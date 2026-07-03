# Match Schedule & Venue Edit — Design

## Goal

Give tournament admins two ways to set or correct a match's date, time, and venue (sede) after the match has been created. No backend changes are needed — `PatchMatch` already accepts `date` and `venue`.

## Scope

Frontend only (`jmanage-web`). Three files change.

Editing is available for matches of any status (scheduled, live, finished, postponed). Only workspace admins (`workspaceRole === 'admin'`) see the edit controls.

---

## Entry Point B — Match Row Dialog

### Trigger

A small calendar icon button appears in the action area of each `MatchRow` (to the right of the status chip, alongside the "Registrar" button). It is only rendered when an `onEditSchedule` prop is provided — following the exact same pattern as `onScoreClick`:

- **Admin:** `onEditSchedule={(match) => openScheduleDialog(match)}` passed from `tournament-detail-view.jsx`
- **Non-admin:** prop not passed → button not rendered

The icon is `mdi:calendar-edit` (or similar), `size="small"`, `variant="outlined"`.

### Dialog — `MatchScheduleDialog`

A compact MUI `Dialog` (`maxWidth="xs"`, `fullWidth`) with:

| Field | Input | Notes |
|-------|-------|-------|
| Fecha | `<input type="date">` rendered as MUI `TextField` | Pre-filled from `match.date` (ISO date part) |
| Hora | `<input type="time">` rendered as MUI `TextField` | Pre-filled from `match.date` (HH:mm part) |
| Sede | `TextField` text | Pre-filled from `match.venue` |

On **Guardar**: combine date + time into one ISO datetime string (`${date}T${time}:00.000Z`) and call `updateMatch(tournamentId, matchId, { date: isoString, venue })`. Show `LoadingButton` while saving. On success: close dialog, SWR revalidates automatically. On error: `toast.error`.

On **Cancelar**: close dialog, no changes.

### Location in `match-row.jsx`

`MatchRow` receives a new optional prop: `onEditSchedule?: (match) => void`.

When provided, render a small `IconButton` in the `Stack alignItems="flex-end"` action area (same stack that holds the Registrar/Ver buttons). The dialog state lives inside `MatchRow`.

---

## Entry Point C — Match Detail Inline Edit

### Trigger

The existing meta row (lines 286–302 of `match-detail-view.jsx`) currently shows:

```
Jornada X  ·  Round  ·  📍 venue
```

Add a small pencil `IconButton` (`mdi:pencil`, size `small`, `sx={{ opacity: 0.4 }}`) at the end of this row, visible only when `workspaceRole === 'admin'` (via `useWorkspace()`). Clicking it toggles `scheduleEditOpen` state.

### Inline Edit Mode

When `scheduleEditOpen` is true, replace the meta row content with a horizontal `Stack` containing the same three fields (date, time, venue) as the dialog above, plus **Guardar** (`LoadingButton`) and **Cancelar** (`Button`) buttons. On save/cancel, toggle back to read-only view.

Same save logic as Entry Point B.

---

## Data Flow

```
match.date  ──► split ──► dateStr (yyyy-MM-dd) + timeStr (HH:mm)
                                    ▼ edit ▼
                          combine ──► `${dateStr}T${timeStr}:00.000Z`
                                    ▼
                          updateMatch(tournamentId, matchId, { date, venue })
                                    ▼
                          SWR mutates → UI revalidates
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/sections/tournament/match-row.jsx` | Add `onEditSchedule` prop, `IconButton` in action stack, `MatchScheduleDialog` component at bottom of file |
| `src/sections/tournament/view/tournament-detail-view.jsx` | Add `scheduleMatch` state; pass `onEditSchedule={isAdmin ? (match) => setScheduleMatch(match) : undefined}` to `MatchList`; render `MatchScheduleDialog` driven by `scheduleMatch` |
| `src/sections/tournament/view/match-detail-view.jsx` | Add `useWorkspace()`, pencil icon to meta row, `scheduleEditOpen` state, inline edit form |

---

## Error Handling

- Save errors show `toast.error(error.message || 'Error al guardar')` — consistent with existing pattern throughout the file.
- Empty date or time fields disable the Guardar button (`disabled={!date || !time}`).

## Out of Scope

- Bulk date editing across matchweeks
- Time zone handling (dates stored as-is in ISO format, consistent with existing behavior)
- Backend changes
