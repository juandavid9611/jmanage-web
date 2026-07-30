# Player Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an admin search a player by name on a tournament's dashboard detail page and see that player's team's full match schedule inline, without leaving the page.

**Architecture:** Pure frontend change in `jmanage-web`. `players`, `teams`, and `matches` are already fetched in full for the tournament by `tournament-detail-view.jsx` (via `useGetPlayers`, `useGetTeams`, `useGetMatches`); a new `PlayerSearchBox` component filters these in-memory arrays client-side — no new backend endpoint, no new SWR hook.

**Tech Stack:** React 18, MUI v5 (`Autocomplete`, existing `MatchList`/`MatchRow`), `react-i18next` for copy, existing `useDebounce` hook.

## Global Constraints

- No test framework exists in `jmanage-web` (per this project's conventions) — verification is manual: `npm run lint`, `npm run build`, then a manual check in the running dev app. Do not write fictitious test code.
- Follow `jmanage-web/CLAUDE.md` UI rules: use `variant="soft"` for de-emphasized chips, neutral backgrounds via the existing `alpha(theme.palette.grey[500], ...)` pattern already used throughout this file (for visual consistency with the rest of the page), and `Iconify` for all icons — no emoji, no raw `<input>`.
- All user-facing copy goes through `t('label_...')` — add new keys to **both** `src/locales/langs/en/common.json` and `src/locales/langs/es/common.json`, keeping the two files' key order identical (this codebase keeps both locale files line-aligned).
- Use `src/...` absolute imports, never relative paths that cross into `src/` from outside it. Within `src/sections/tournament/`, sibling files import each other with relative paths (e.g. `../match-row`), matching the existing convention in `tournament-detail-view.jsx`.
- Design spec: `jmanage-web/docs/superpowers/specs/2026-07-30-player-search-design.md`.

---

### Task 1: Add i18n keys

**Files:**
- Modify: `jmanage-web/src/locales/langs/en/common.json` (append 3 keys before the final closing `}`, currently at line 1805)
- Modify: `jmanage-web/src/locales/langs/es/common.json` (same 3 keys, same position, currently at line 1805)

**Interfaces:**
- Produces: three i18n keys — `label_search_player_placeholder`, `label_no_players_found`, `label_no_matches_scheduled_yet` — consumed by `PlayerSearchBox` in Task 2.

- [ ] **Step 1: Add the English keys**

In `jmanage-web/src/locales/langs/en/common.json`, the file currently ends with:

```json
  "label_next_steps_documents_desc": "Access all files and documents shared by your club.",
  "label_go_to_documents": "Go to Documents"
}
```

Change it to:

```json
  "label_next_steps_documents_desc": "Access all files and documents shared by your club.",
  "label_go_to_documents": "Go to Documents",
  "label_search_player_placeholder": "Search player...",
  "label_no_players_found": "No players found",
  "label_no_matches_scheduled_yet": "No matches scheduled yet"
}
```

- [ ] **Step 2: Add the matching Spanish keys**

In `jmanage-web/src/locales/langs/es/common.json`, the file currently ends with:

```json
  "label_next_steps_documents_desc": "Accede a todos los archivos y documentos compartidos por tu club.",
  "label_go_to_documents": "Ir a Documentos"
}
```

Change it to:

```json
  "label_next_steps_documents_desc": "Accede a todos los archivos y documentos compartidos por tu club.",
  "label_go_to_documents": "Ir a Documentos",
  "label_search_player_placeholder": "Buscar jugador...",
  "label_no_players_found": "No se encontraron jugadores",
  "label_no_matches_scheduled_yet": "Aún no hay partidos programados"
}
```

- [ ] **Step 3: Verify both files are still valid JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('src/locales/langs/en/common.json'))" && node -e "JSON.parse(require('fs').readFileSync('src/locales/langs/es/common.json'))" && echo OK`
Expected: `OK` printed, no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/langs/en/common.json src/locales/langs/es/common.json
git commit -m "Add i18n keys for player search"
```

---

### Task 2: Create `PlayerSearchBox` component

**Files:**
- Create: `jmanage-web/src/sections/tournament/player-search.jsx`

**Interfaces:**
- Consumes: `MatchList` from `../match-row` (signature: `MatchList({ matches, teams, players, tournamentId, onMatchClick, onScoreClick, onEditSchedule, grouped = true, publicMode = false })`, `jmanage-web/src/sections/tournament/match-row.jsx:528`); `useDebounce(value, delay = 1000)` from `src/hooks/use-debounce.js`.
- Produces: `PlayerSearchBox({ players, teams, matches, tournamentId, onMatchClick })` — a self-contained component with its own search/selection state. `players` items have shape `{ id, tournament_id, team_id, name, position, number, ... }`. `teams` items have shape `{ id, name, short_name, logo_url, ... }`. `matches` items have shape `{ id, home_team_id, away_team_id, status, date, venue, ... }`. `onMatchClick(match)` is called when a match row in the inline schedule panel is clicked (same signature `handleMatchClick` already uses in `tournament-detail-view.jsx:231-236`).

- [ ] **Step 1: Write the component**

Create `jmanage-web/src/sections/tournament/player-search.jsx`:

```jsx
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputAdornment from '@mui/material/InputAdornment';
import Autocomplete from '@mui/material/Autocomplete';

import { useDebounce } from 'src/hooks/use-debounce';

import { Iconify } from 'src/components/iconify';

import { MatchList } from './match-row';

// ----------------------------------------------------------------------

export function PlayerSearchBox({ players, teams, matches, tournamentId, onMatchClick }) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const debouncedQuery = useDebounce(query, 300);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) return [];
    return players.filter((player) => player.name?.toLowerCase().includes(q));
  }, [players, debouncedQuery]);

  const teamNameFor = (teamId) => teams?.find((team) => team.id === teamId)?.name || '';

  const teamMatches = useMemo(() => {
    if (!selectedPlayer) return [];
    return matches.filter(
      (m) => m.home_team_id === selectedPlayer.team_id || m.away_team_id === selectedPlayer.team_id
    );
  }, [matches, selectedPlayer]);

  return (
    <Box>
      <Autocomplete
        sx={{ width: { xs: 1, sm: 320 } }}
        options={results}
        autoHighlight
        popupIcon={null}
        inputValue={query}
        value={selectedPlayer}
        onInputChange={(event, newValue) => setQuery(newValue)}
        onChange={(event, newValue) => setSelectedPlayer(newValue)}
        getOptionLabel={(option) => option.name || ''}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText={t('label_no_players_found')}
        renderInput={(params) => (
          <TextField
            {...params}
            size="small"
            placeholder={t('label_search_player_placeholder')}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <Iconify icon="eva:search-fill" sx={{ ml: 1, color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />
        )}
        renderOption={(props, player) => (
          <Box component="li" {...props} key={player.id}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ width: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {player.name}
              </Typography>
              {player.number != null && (
                <Chip
                  label={`#${player.number}`}
                  size="small"
                  variant="soft"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              )}
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {teamNameFor(player.team_id)}
              </Typography>
            </Stack>
          </Box>
        )}
      />

      {selectedPlayer && (
        <Box
          sx={{
            mt: 2,
            p: 2,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
            border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="subtitle2">
              {selectedPlayer.name} · {teamNameFor(selectedPlayer.team_id)}
            </Typography>
            <IconButton size="small" onClick={() => setSelectedPlayer(null)}>
              <Iconify icon="eva:close-fill" width={18} />
            </IconButton>
          </Stack>

          {teamMatches.length === 0 ? (
            <Typography
              variant="body2"
              sx={{ color: 'text.disabled', textAlign: 'center', py: 2 }}
            >
              {t('label_no_matches_scheduled_yet')}
            </Typography>
          ) : (
            <MatchList
              matches={teamMatches}
              teams={teams}
              players={players}
              tournamentId={tournamentId}
              onMatchClick={onMatchClick}
            />
          )}
        </Box>
      )}
    </Box>
  );
}
```

- [ ] **Step 2: Lint the new file**

Run: `npx eslint src/sections/tournament/player-search.jsx`
Expected: no errors. If autofixable issues are reported, run `npx eslint --fix src/sections/tournament/player-search.jsx` and re-check.

- [ ] **Step 3: Commit**

```bash
git add src/sections/tournament/player-search.jsx
git commit -m "Add PlayerSearchBox component for tournament player search"
```

---

### Task 3: Wire `PlayerSearchBox` into the tournament detail page

**Files:**
- Modify: `jmanage-web/src/sections/tournament/view/tournament-detail-view.jsx`

**Interfaces:**
- Consumes: `PlayerSearchBox` from Task 2 (`{ players, teams, matches, tournamentId, onMatchClick }`); existing `players` (from `useGetPlayers(id)`, line 91), `teams` (from `useGetTeams(id)`, line 87), `allMatches` (from `useGetMatches(id)`, line 90), `id` (from `useParams()`, line 82), and the existing `handleMatchClick` callback (line 231-236) are all already in scope in this component — no new state or hooks needed.

- [ ] **Step 1: Import the new component**

In `jmanage-web/src/sections/tournament/view/tournament-detail-view.jsx`, add the import next to the other relative sibling imports (currently lines 46-56):

```jsx
import { TeamList } from '../team-list';
import { BracketView } from '../bracket-view';
import { StatsOverview } from '../stats-overview';
import { PlayerSearchBox } from '../player-search';
import { StandingsSidebar } from '../standings-sidebar';
import { MatchweekTimeline } from '../matchweek-timeline';
import { PlayerRankingTable } from '../player-ranking-table';
import { MatchList, MatchScheduleDialog } from '../match-row';
import { TeamDisciplineTable } from '../team-discipline-table';
import { TournamentUsersTable } from '../tournament-users-table';
import { getPhases, TournamentBanner } from '../tournament-banner';
import { TournamentConfigSummary } from '../tournament-config-summary';
```

(Only the `PlayerSearchBox` line is new; keep the existing alphabetical-by-import-length ordering the file already uses.)

- [ ] **Step 2: Render it between the banner and the phase content**

In the same file, the `return` currently looks like (lines 256-277):

```jsx
  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      {/* ═══ Banner + Phase Stepper ═══ */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        isSubmitting={isSubmitting}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={handlePhaseClick}
        onActivate={() => setActivateDialog(true)}
        onFinish={() => setFinishDialog(true)}
        onDelete={() => setDeleteDialog(true)}
        onAdvanceMatchweek={handleAdvanceMatchweek}
        onNavigateEdit={() => navigate(paths.dashboard.tournament.edit(id))}
        onOpenDiscipline={() => setDisciplineOpen(true)}
        onOpenUsers={canViewTournamentPayments ? () => setUsersOpen(true) : undefined}
      />

      {/* ═══ Phase Content ═══ */}
      <Box sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02), minHeight: 400 }}>
```

Change it to insert a search section between the banner and the phase content:

```jsx
  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      {/* ═══ Banner + Phase Stepper ═══ */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        isSubmitting={isSubmitting}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={handlePhaseClick}
        onActivate={() => setActivateDialog(true)}
        onFinish={() => setFinishDialog(true)}
        onDelete={() => setDeleteDialog(true)}
        onAdvanceMatchweek={handleAdvanceMatchweek}
        onNavigateEdit={() => navigate(paths.dashboard.tournament.edit(id))}
        onOpenDiscipline={() => setDisciplineOpen(true)}
        onOpenUsers={canViewTournamentPayments ? () => setUsersOpen(true) : undefined}
      />

      {/* ═══ Player Search — persistent regardless of active phase ═══ */}
      <Box sx={{ px: { xs: 2, md: 3 }, py: 1.5 }}>
        <PlayerSearchBox
          players={players}
          teams={teams}
          matches={allMatches}
          tournamentId={id}
          onMatchClick={handleMatchClick}
        />
      </Box>

      {/* ═══ Phase Content ═══ */}
      <Box sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02), minHeight: 400 }}>
```

- [ ] **Step 3: Lint the modified file**

Run: `npx eslint src/sections/tournament/view/tournament-detail-view.jsx`
Expected: no errors. If autofixable issues are reported, run `npx eslint --fix src/sections/tournament/view/tournament-detail-view.jsx` and re-check.

- [ ] **Step 4: Commit**

```bash
git add src/sections/tournament/view/tournament-detail-view.jsx
git commit -m "Add player search to tournament detail dashboard page"
```

---

### Task 4: Project-wide verification

**Files:** none (verification only)

**Interfaces:** none

- [ ] **Step 1: Run the full lint suite**

Run: `npm run lint`
Expected: exits 0, no errors (per this project's verification-gate convention, run project-wide, not just changed files).

- [ ] **Step 2: Run the production build**

Run: `npm run build`
Expected: build completes with exit code 0.

- [ ] **Step 3: Manually verify in the running app**

Run: `npm run dev` (port 3031), then in a browser:
1. Navigate to a tournament's dashboard detail page (`/tournament/:id`) for a tournament that has players and generated matches.
2. Type part of a player's name into the new search box below the banner.
3. Confirm the dropdown shows matching players with name, number, and team name.
4. Select a player and confirm the inline panel shows that player's team's match schedule (grouped live/pending/finished, matching the existing match-list styling elsewhere on the page).
5. Click a match in the panel and confirm it navigates to that match's detail page.
6. Clear the search / collapse the panel via the close icon and confirm it disappears cleanly.
7. Type a name that matches no player and confirm the "No players found" empty state appears.
8. Select a player whose team has no matches yet (or a tournament with no schedule generated) and confirm "No matches scheduled yet" appears.

Expected: all of the above behave as described, no console errors.

- [ ] **Step 4: Commit if step 3 required any fixes**

If manual verification in Step 3 required code changes, commit them with a descriptive message before considering this plan complete. If no changes were needed, this step is a no-op.
