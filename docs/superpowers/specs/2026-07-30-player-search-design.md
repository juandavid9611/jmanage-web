# Player Search — Design

## Problem

There's no way, from a tournament's dashboard page, to look up a player by
name and see where/when their team is playing. With dozens of teams and
matches per tournament, finding a specific player's schedule means manually
scanning the players list and then cross-referencing matches.

## Goal

Add a search box to the tournament dashboard detail page that lets an admin
type a player's name and immediately see that player's team's full match
schedule (past + upcoming).

## Scope

- Dashboard only (`tournament-detail-view.jsx`) — not the public tournament
  view.
- Scoped to a single tournament — no cross-tournament search.
- Plain case-insensitive substring match on player name — no fuzzy/typo
  tolerance.

## Architecture — client-side filtering, no new API endpoint

`useGetPlayers(id)` and `useGetMatches(id)` (both already called in
`tournament-detail-view.jsx`) fetch the entire unpaginated player and match
list for the tournament into the browser (backend repos use unbounded
`_query_all`, no pagination). Tournaments are amateur-scale — dozens of
teams, low hundreds of players/matches — so filtering entirely in memory on
the client is sufficient. No new backend endpoint is needed.

Rejected alternative: a server-side `GET /tournaments/{id}/players?q=`
endpoint mirroring the existing `products_search` DynamoDB-scan pattern.
Not justified — the data already lives client-side, and adding a network
round trip and a new scan-based endpoint would add latency and backend
surface area for no benefit at current scale. Revisit only if tournament
size grows into the thousands of players.

## Components

### `PlayerSearchBox`

New component, `src/sections/tournament/player-search.jsx`, mirroring the
existing `ProductSearch` pattern (`src/sections/product/product-search.jsx`):

- Text input debounced via the existing `useDebounce` hook
  (`src/hooks/use-debounce.js`).
- Filters the in-memory `players` array (passed in as a prop from the
  parent view) by case-insensitive substring match on `name`.
- Dropdown lists matches: player name, number, position, and team name.
  `Player` only stores `team_id`, so team name is resolved by looking up
  the already-fetched `teams` array (from `useGetTeams(id)`) by `team_id`.
- Empty state: "No players found" when the query matches nothing.

### Inline schedule panel

- Selecting a player in the dropdown closes the dropdown and renders an
  inline panel below the search box (no navigation).
- Panel header: player name + team name.
- Panel body: that team's full match list (past + upcoming), filtered from
  the already-fetched `matches` array where `home_team_id` or
  `away_team_id` equals the player's `team_id`. Reuses existing match-row
  rendering rather than introducing a new match list component.
- Empty state: "No matches scheduled yet" if the team has no fixtures.
- The panel can be dismissed (collapsed) or replaced by picking a
  different player from the search box.

## Placement

Added near the top of `tournament-detail-view.jsx`, above the existing
tabs (players/matches/bracket), so it acts as a persistent lookup tool
regardless of which tab is active.

## Data flow

No new SWR hooks. `players`, `teams`, and `matches` are already fetched in
the parent view (`useGetPlayers(id)`, `useGetTeams(id)`, `useGetMatches(id)`)
and passed down as props to `PlayerSearchBox`.

## Out of scope

- Cross-tournament search.
- Public-facing version.
- Fuzzy/typo-tolerant matching.
- Any backend changes.
