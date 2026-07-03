# Match Charge Trigger — Design

## Goal

Let tournament admins manually trigger payment request charge creation for finished matches. Charges are created one per card event (yellow/red). The operation is idempotent: each card event carries a `reference` field (the event ID) so re-running never creates duplicates.

## Scope

Backend: one new endpoint in `api/payments.py` + `reference` field added to `BulkPutPaymentRequest` schema + service storage + `_create_card_charges` updated to pass the reference. Frontend: one action + one button in the match detail page.

---

## Backend

### Schema change — `api/schemas/payments.py`

Add one optional field to `BulkPutPaymentRequest`:

```python
reference: str | None = None   # e.g. match event ID for idempotency
```

### Service change — `services/payment_request_service.py`

Store `reference` in the DynamoDB item dict inside `bulk_create()` (alongside the existing fields). The `list_payment_requests()` method already returns all fields, so existing reads will include it automatically.

### `_create_card_charges` — `api/tournaments.py`

When building `BulkPutPaymentRequest` for each card event, add:

```python
reference=ev["id"],
```

This ensures the auto-creation path (when a match is marked finished) also writes event references, making it idempotent against the new manual endpoint from day one.

### New endpoint — `api/payments.py`

```
POST /payment-requests/tournament-match-charges
```

Body:
```python
class TournamentMatchChargesRequest(BaseModel):
    tournament_id: str
    match_id: str
```

Auth: `ADMIN` dependency (same pattern as other admin endpoints).

Logic:
1. Fetch tournament — raise 404 if not found, 400 if `payments_enabled` is `False`.
2. Fetch match — raise 404 if not found, 400 if `status != "finished"`.
3. Fetch match events via `ev_svc.list_events(match_id)`.
4. Filter card events: `type in {"yellow_card", "red_card", "second_yellow"}`.
5. Fetch existing payment requests: `pr_svc.list_payment_requests(account_id, group=tournament_id)`.
6. Build a set of already-charged event IDs: `{pr["reference"] for pr in existing if pr.get("reference")}`.
7. For each card event not in the set: build and call `pr_svc.bulk_create(...)` with `reference=event["id"]`.
8. Return `{"created": N, "skipped": M}`.

Fee config from `tournament["rules"]`:
- `yellow_card` → `rules.get("yellow_card_fee", 0)`
- `red_card` / `second_yellow` → `rules.get("red_card_fee", 0)`

Skip events with fee = 0 or team with no `contact_email` (same guard as auto-creation path).

Dependencies needed in this endpoint: `get_tournament_service`, `get_match_service`, `get_match_event_service`, `get_tournament_team_service`, `get_payment_request_service` — all already wired in `di.py`.

---

## Frontend

### `src/actions/tournament.js`

New action function:

```javascript
export async function createMatchCharges(tournamentId, matchId) {
  const res = await axiosInstance.post(`${PAYMENTS_URL}/tournament-match-charges`, {
    tournamentId,
    matchId,
  });
  return res.data;
}
```

Where `PAYMENTS_URL` is the existing payments base URL (e.g. `endpoints.paymentRequests` or however the base URL is defined in `src/utils/axios.js`).

### `src/sections/tournament/view/match-detail-view.jsx`

Add to the existing action toolbar (the `Stack` containing `+ Evento`, `Descargar plantillas`, `Eliminar`):

```jsx
{isAdmin && tournament?.payments_enabled && isFinished && (
  <LoadingButton
    size="small"
    variant="soft"
    color="warning"
    loading={chargesLoading}
    startIcon={<Iconify icon="solar:dollar-minimalistic-bold" width={16} />}
    onClick={handleCreateCharges}
  >
    Generar Cobros
  </LoadingButton>
)}
```

State: `const [chargesLoading, setChargesLoading] = useState(false)`.

Handler:
```javascript
const handleCreateCharges = async () => {
  try {
    setChargesLoading(true);
    const { created, skipped } = await createMatchCharges(tournamentId, matchId);
    if (created === 0) toast.info('Cobros ya existentes para este partido');
    else toast.success(`${created} cobro${created !== 1 ? 's' : ''} generado${created !== 1 ? 's' : ''}`);
  } catch (err) {
    toast.error(err.message || 'Error al generar cobros');
  } finally {
    setChargesLoading(false);
  }
};
```

`tournament` is already available via `useGetTournament(tournamentId)` which is already called in the file.

---

## Data Flow

```
Admin clicks "Generar Cobros"
  → POST /payment-requests/tournament-match-charges { tournament_id, match_id }
  → fetch tournament (payments_enabled check)
  → fetch match (finished check)
  → list card events for match
  → list existing payment requests (group=tournament_id)
  → diff: events without a matching reference in existing PRs
  → bulk_create one PR per new card event (reference=event_id)
  → { created: N, skipped: M }
  → toast.success / toast.info
```

---

## Error Handling

| Condition | Response |
|-----------|----------|
| Tournament not found | 404 |
| `payments_enabled = False` | 400 "Payments not enabled for this tournament" |
| Match not found | 404 |
| Match not finished | 400 "Match is not finished" |
| No card events | 200 `{ created: 0, skipped: 0 }` |
| All events already charged | 200 `{ created: 0, skipped: N }` |
| Team has no contact_email or fee = 0 | silently skip that event |

---

## Out of Scope

- Bulk trigger across all matches in a tournament
- Deleting / reversing charges
- Showing which specific events were charged vs skipped
