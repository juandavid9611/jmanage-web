# Match Schedule & Venue Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let tournament admins edit a match's date, time, and venue from (a) a dialog opened from the match row and (b) an inline form in the match detail page's header.

**Architecture:** Frontend-only. Backend already supports `date` and `venue` via `PATCH /tournaments/{id}/matches/{matchId}` (`updateMatch` action). Task 1 adds `MatchScheduleDialog` (exported from `match-row.jsx`) and an icon button inside `MatchRow`. Task 2 wires the dialog into the tournament detail view. Task 3 adds an inline edit toggle to the match detail page header.

**Tech Stack:** React 18, MUI v5, SWR (cache invalidation automatic via existing `updateMatch`), `jmanage-web` repo at `/Users/juan.arevalo/repos/jmanage/jmanage-web`

## Global Constraints

- Editing is admin-only (`workspaceRole === 'admin'`). Non-admins never see edit controls.
- `onEditSchedule` prop follows the existing `onScoreClick` pattern: pass the function for admins, omit it (undefined) for non-admins.
- `match.date` is stored as an ISO datetime string (e.g. `"2026-06-15T20:00:00.000Z"`). Split into `yyyy-MM-dd` + `HH:mm` for inputs; combine back as `${date}T${time}:00.000Z` on save.
- Editing is available for any match status (scheduled, live, finished, postponed).
- After save, SWR revalidates automatically — `updateMatch` calls `mutate((key) => key.includes(...))` internally.
- Run `npm run lint && npm run build` from `jmanage-web/` before committing each task. Fix any import-order warnings with `npx eslint --fix <file>`.
- Import ordering rule: `perfectionist/sort-imports` with `type: 'line-length', order: 'asc'` — shorter lines first within each group; alphabetical tiebreaker.

---

### Task 1: `MatchScheduleDialog` component + icon button in `MatchRow`

**Files:**
- Modify: `src/sections/tournament/match-row.jsx`

**Interfaces:**
- Produces: `export function MatchScheduleDialog({ open, match, tournamentId, onClose })` — used by Task 2
- Produces: `MatchRow` now accepts optional `onEditSchedule?: (match: object) => void` — used by Task 2

- [ ] **Step 1: Add new imports to `match-row.jsx`**

The file currently starts with:
```javascript
import { useState } from 'react';
```

Change to:
```javascript
import { useState, useEffect } from 'react';
```

Then add to the MUI block (after existing MUI imports, sorted by line length — run `npx eslint --fix src/sections/tournament/match-row.jsx` after to auto-sort):
```javascript
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import LoadingButton from '@mui/lab/LoadingButton';
```

Add to the `src/actions/tournament` import line (it currently only imports `useGetMatch, useGetPublicMatch`):
```javascript
import { useGetMatch, useGetPublicMatch, updateMatch } from 'src/actions/tournament';
```

Add a new import group for snackbar (after the `Iconify` import):
```javascript
import { toast } from 'src/components/snackbar';
```

- [ ] **Step 2: Add `onEditSchedule` prop and icon button to `MatchRow`**

The current `MatchRow` signature at line 41 is:
```javascript
export function MatchRow({ match, teams, players, tournamentId, onClick, onScoreClick, expanded, onToggle, publicMode = false }) {
```

Change to:
```javascript
export function MatchRow({ match, teams, players, tournamentId, onClick, onScoreClick, onEditSchedule, expanded, onToggle, publicMode = false }) {
```

Inside the action `Stack` (the one at `{/* Status chip + action */}`, lines 172–200), add the icon button **after** the "Ver" button and **before** the closing `</Stack>`:

```jsx
          {onEditSchedule && !publicMode && (
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); onEditSchedule(match); }}
              sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
            >
              <Iconify icon="mdi:calendar-edit" width={15} />
            </IconButton>
          )}
```

- [ ] **Step 3: Add `MatchScheduleDialog` at the bottom of `match-row.jsx`**

Append this exported component at the very end of the file (after the last closing brace of `MatchList`):

```jsx
// ----------------------------------------------------------------------

export function MatchScheduleDialog({ open, match, tournamentId, onClose }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!match) return;
    const dt = match.date ? new Date(match.date) : new Date();
    setDate(dt.toISOString().slice(0, 10));
    setTime(dt.toISOString().slice(11, 16));
    setVenue(match.venue || '');
  }, [match]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await updateMatch(tournamentId, match.id, {
        date: `${date}T${time}:00.000Z`,
        venue,
      });
      toast.success('Horario actualizado');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Horario y Sede</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Fecha"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Hora"
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Sede"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            fullWidth
            placeholder="Nombre del estadio o cancha"
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          disabled={!date || !time}
          onClick={handleSave}
        >
          Guardar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
```

- [ ] **Step 4: Fix import order and verify lint + build**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
npx eslint --fix src/sections/tournament/match-row.jsx
npm run lint && npm run build
```

Expected: no errors (warnings OK).

- [ ] **Step 5: Commit**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
git add src/sections/tournament/match-row.jsx
git commit -m "feat(tournament): add MatchScheduleDialog and edit icon to MatchRow"
```

---

### Task 2: Wire `MatchScheduleDialog` into `tournament-detail-view.jsx`

**Files:**
- Modify: `src/sections/tournament/view/tournament-detail-view.jsx`

**Interfaces:**
- Consumes: `MatchScheduleDialog` from Task 1 — `export function MatchScheduleDialog({ open, match, tournamentId, onClose })`
- Consumes: `onEditSchedule` prop on `MatchRow`/`MatchList` from Task 1

- [ ] **Step 1: Import `MatchScheduleDialog`**

The file already imports from `'../match-row'`:
```javascript
import { MatchList } from '../match-row';
```

Change to:
```javascript
import { MatchList, MatchScheduleDialog } from '../match-row';
```

- [ ] **Step 2: Add `scheduleMatch` state**

The file already has several `useState` declarations (lines 90–97). Add after `disciplineOpen`:
```javascript
const [scheduleMatch, setScheduleMatch] = useState(null);
```

- [ ] **Step 3: Pass `onEditSchedule` to `MatchList`**

The `<MatchList>` render call (around line 328–336) currently is:
```jsx
<MatchList
  matches={currentMatches}
  teams={teams}
  players={players}
  tournamentId={id}
  grouped
  onMatchClick={handleMatchClick}
  onScoreClick={isAdmin ? handleScoreClick : undefined}
/>
```

Add `onEditSchedule`:
```jsx
<MatchList
  matches={currentMatches}
  teams={teams}
  players={players}
  tournamentId={id}
  grouped
  onMatchClick={handleMatchClick}
  onScoreClick={isAdmin ? handleScoreClick : undefined}
  onEditSchedule={isAdmin ? (m) => setScheduleMatch(m) : undefined}
/>
```

- [ ] **Step 4: Render `MatchScheduleDialog`**

Find the section where other dialogs are rendered (the `{/* ── Activate Dialog */}` block or similar near the end of the JSX return). Add the schedule dialog alongside them:

```jsx
<MatchScheduleDialog
  open={!!scheduleMatch}
  match={scheduleMatch}
  tournamentId={id}
  onClose={() => setScheduleMatch(null)}
/>
```

- [ ] **Step 5: Verify lint + build**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
npx eslint --fix src/sections/tournament/view/tournament-detail-view.jsx
npm run lint && npm run build
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
git add src/sections/tournament/view/tournament-detail-view.jsx
git commit -m "feat(tournament): wire MatchScheduleDialog into tournament detail view"
```

---

### Task 3: Inline schedule edit in `match-detail-view.jsx` meta row

**Files:**
- Modify: `src/sections/tournament/view/match-detail-view.jsx`

**Interfaces:**
- Consumes: `updateMatch(tournamentId, matchId, { date, venue })` — already imported in this file
- Consumes: `useWorkspace()` from `src/workspace/workspace-provider` — returns `{ workspaceRole: string }`

- [ ] **Step 1: Add `useWorkspace` import**

The file currently imports from `src/routes/paths` and other sources. Add:
```javascript
import { useWorkspace } from 'src/workspace/workspace-provider';
```

Place it in the internal imports group (after `src/layouts/dashboard` import, before `src/actions/tournament`). Run `npx eslint --fix` after to sort by line length.

- [ ] **Step 2: Add state for inline edit**

In `MatchDetailView`, after the existing `const [notes, setNotes] = useState('');` line, add:

```javascript
const [scheduleEditOpen, setScheduleEditOpen] = useState(false);
const [scheduleDate, setScheduleDate] = useState('');
const [scheduleTime, setScheduleTime] = useState('');
const [scheduleVenue, setScheduleVenue] = useState('');
```

- [ ] **Step 3: Derive `isAdmin` from workspace role**

After the existing hooks (after `useGetPlayers`), add:
```javascript
const { workspaceRole } = useWorkspace();
const isAdmin = workspaceRole === 'admin';
```

- [ ] **Step 4: Sync schedule state from match**

The file already has:
```javascript
useEffect(() => {
  if (match) setNotes(match.notes || '');
}, [match]);
```

Add a second `useEffect` directly after it:
```javascript
useEffect(() => {
  if (!match) return;
  const dt = match.date ? new Date(match.date) : new Date();
  setScheduleDate(dt.toISOString().slice(0, 10));
  setScheduleTime(dt.toISOString().slice(11, 16));
  setScheduleVenue(match.venue || '');
}, [match]);
```

- [ ] **Step 5: Add `handleSaveSchedule` handler**

Add this handler alongside the existing handlers (after `handleStatusTransition`):

```javascript
const handleSaveSchedule = async () => {
  try {
    setIsSubmitting(true);
    await updateMatch(tournamentId, matchId, {
      date: `${scheduleDate}T${scheduleTime}:00.000Z`,
      venue: scheduleVenue,
    });
    toast.success('Horario actualizado');
    setScheduleEditOpen(false);
  } catch (err) {
    toast.error(err.message || 'Error al guardar');
  } finally {
    setIsSubmitting(false);
  }
};
```

- [ ] **Step 6: Replace the meta row with edit-toggle version**

The current meta row (around lines 285–302) is:
```jsx
{/* Meta row */}
<Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
  {match.matchweek && (
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
      Jornada {match.matchweek}
    </Typography>
  )}
  {match.round && (
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
      {match.round}
    </Typography>
  )}
  {match.venue && (
    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
      📍 {match.venue}
    </Typography>
  )}
</Stack>
```

Replace with:
```jsx
{/* Meta row */}
{scheduleEditOpen ? (
  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }} flexWrap="wrap">
    <TextField
      label="Fecha"
      type="date"
      size="small"
      value={scheduleDate}
      onChange={(e) => setScheduleDate(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ width: 150 }}
    />
    <TextField
      label="Hora"
      type="time"
      size="small"
      value={scheduleTime}
      onChange={(e) => setScheduleTime(e.target.value)}
      InputLabelProps={{ shrink: true }}
      sx={{ width: 120 }}
    />
    <TextField
      label="Sede"
      size="small"
      value={scheduleVenue}
      onChange={(e) => setScheduleVenue(e.target.value)}
      placeholder="Estadio o cancha"
      sx={{ width: 200 }}
    />
    <LoadingButton
      size="small"
      variant="contained"
      loading={isSubmitting}
      disabled={!scheduleDate || !scheduleTime}
      onClick={handleSaveSchedule}
    >
      Guardar
    </LoadingButton>
    <Button size="small" onClick={() => setScheduleEditOpen(false)}>
      Cancelar
    </Button>
  </Stack>
) : (
  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
    {match.matchweek && (
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        Jornada {match.matchweek}
      </Typography>
    )}
    {match.round && (
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        {match.round}
      </Typography>
    )}
    {match.venue && (
      <Typography variant="caption" sx={{ color: 'text.disabled' }}>
        📍 {match.venue}
      </Typography>
    )}
    {isAdmin && (
      <IconButton
        size="small"
        onClick={() => setScheduleEditOpen(true)}
        sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, p: 0.25 }}
      >
        <Iconify icon="mdi:pencil" width={13} />
      </IconButton>
    )}
  </Stack>
)}
```

- [ ] **Step 7: Verify lint + build**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
npx eslint --fix src/sections/tournament/view/match-detail-view.jsx
npm run lint && npm run build
```

Expected: no errors.

- [ ] **Step 8: Commit**

```bash
cd /Users/juan.arevalo/repos/jmanage/jmanage-web
git add src/sections/tournament/view/match-detail-view.jsx
git commit -m "feat(tournament): inline schedule and venue edit in match detail header"
```

---

## Self-Review

- **Spec coverage:**
  - Entry B (match row dialog): Tasks 1 + 2 ✓
  - Entry C (match detail inline edit, pencil icon in meta row): Task 3 ✓
  - Admin-only gating for both: `onEditSchedule` omitted for non-admins (Task 2), `isAdmin` check before pencil icon (Task 3) ✓
  - Any match status: no status guard on either trigger ✓
  - Date + time + venue fields in both: ✓
  - Save via `updateMatch(tournamentId, matchId, { date, venue })`: ✓
  - `disabled={!date || !time}` guard on Guardar button: ✓

- **Placeholder scan:** None found. All code is complete.

- **Type consistency:** `MatchScheduleDialog` signature `{ open, match, tournamentId, onClose }` used consistently in Task 1 (definition) and Task 2 (render). `onEditSchedule` prop name consistent across Tasks 1 and 2. `scheduleDate/Time/Venue` state names consistent between Steps 2–6 of Task 3.
