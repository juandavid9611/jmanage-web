import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axios, { fetcher, endpoints } from 'src/utils/axios';

// ----------------------------------------------------------------------
// "Torneos del Club" / Compromiso: the club's own team competing in
// external tournaments (NOT the bracket organizer in actions/tournament.js).
// Server-backed (/club-tournaments, club accounts only), workspace-scoped.
//
// The API speaks camelCase; the views were written against snake_case rows,
// so the mapping lives here, in one place, and the views stay untouched:
//   tournament  { id, workspaceId, name, category, created_at }
//   roster row  { id, tournament_id, user_id, guest_name, number, position }
//   match       { id, tournament_id, date, rival, calendar_event_id, lineup }
//   lineup      { entries: [{ roster_entry_id, called_up, status, minutes }], saved_at }
//
// Player identity still comes from the real Usuarios (src/actions/user.js):
// pass `users` (from useGetUsers) into useGetEngagementRoster to join names.

const CLUB_ENDPOINT = endpoints.clubTournaments;

function url(path, workspaceId) {
  return `${CLUB_ENDPOINT}${path}?workspace_id=${workspaceId}`;
}

function revalidateClub() {
  return mutate((key) => typeof key === 'string' && key.startsWith(CLUB_ENDPOINT));
}

// ── Mapping ───────────────────────────────────────────────────────────

function fromApiTournament(t) {
  return { ...t, created_at: t.createdAt };
}

function fromApiRoster(r) {
  return {
    id: r.id,
    tournament_id: r.tournamentId,
    user_id: r.userId || null,
    guest_name: r.guestName || null,
    number: r.number,
    position: r.position,
  };
}

function fromApiLineup(lineup) {
  if (!lineup) return null;
  return {
    entries: (lineup.entries || []).map((e) => ({
      roster_entry_id: e.rosterEntryId,
      called_up: !!e.calledUp,
      status: e.status || '',
      minutes: e.minutes ?? 0,
    })),
    saved_at: lineup.savedAt,
  };
}

function toApiLineupEntries(entries) {
  return entries.map((e) => ({
    rosterEntryId: e.roster_entry_id,
    calledUp: !!e.called_up,
    status: e.called_up ? e.status || '' : '',
    minutes: e.called_up ? Number(e.minutes) || 0 : 0,
  }));
}

function fromApiMatch(m) {
  return {
    id: m.id,
    tournament_id: m.tournamentId,
    date: m.date,
    rival: m.rival,
    calendar_event_id: m.calendarEventId || null,
    lineup: fromApiLineup(m.lineup),
  };
}

// ── Torneos ───────────────────────────────────────────────────────────

export function useGetEngagementTournaments(workspaceId) {
  const { data, isLoading, error } = useSWR(
    workspaceId ? url('', workspaceId) : null,
    async (key) => (await fetcher(key)).map(fromApiTournament)
  );
  return useMemo(
    () => ({ tournaments: data || [], tournamentsLoading: isLoading, tournamentsError: error }),
    [data, isLoading, error]
  );
}

export async function createEngagementTournament({ name, category }, workspaceId) {
  const res = await axios.post(url('', workspaceId), { name, category: category || '' });
  await revalidateClub();
  return fromApiTournament(res.data);
}

// Cascades roster + matches server-side.
export async function deleteEngagementTournament(id, workspaceId) {
  await axios.delete(url(`/${id}`, workspaceId));
  await revalidateClub();
}

// ── Plantilla (roster ↔ Usuarios reales) ─────────────────────────────

function joinRosterEntry(entry, users) {
  const user = entry.user_id ? users.find((u) => u.id === entry.user_id) : null;
  return {
    id: entry.id,
    tournament_id: entry.tournament_id,
    user_id: entry.user_id || null,
    isGuest: !entry.user_id,
    name: user?.name || entry.guest_name || '(sin nombre)',
    avatarUrl: user?.avatarUrl || null,
    number: entry.number,
    position: entry.position,
  };
}

export function useGetEngagementRoster(tournamentId, users, workspaceId) {
  const { data, isLoading, error } = useSWR(
    tournamentId && workspaceId ? url(`/${tournamentId}/roster`, workspaceId) : null,
    async (key) => (await fetcher(key)).map(fromApiRoster)
  );
  const roster = useMemo(
    () => (data || []).map((e) => joinRosterEntry(e, users || [])),
    [data, users]
  );
  return { roster, rosterLoading: isLoading, rosterError: error };
}

// Every tournament the signed-in user is rostered in, across this workspace
// (the API resolves "me" from the token).
export function useGetEngagementTournamentsForUser(userId, workspaceId) {
  const { data, isLoading } = useSWR(
    userId && workspaceId ? `${url('/mine', workspaceId)}&user=${userId}` : null,
    async (key) => {
      const rows = await fetcher(key.replace(/&user=.*$/, ''));
      return rows.map((row) => ({
        rosterEntryId: row.rosterEntryId,
        tournament: fromApiTournament(row.tournament),
      }));
    }
  );
  return { entries: data || [], entriesLoading: isLoading };
}

// entry: { user_id?, guest_name?, number?, position? } — one of user_id / guest_name.
export async function addToEngagementRoster(tournamentId, entry, workspaceId) {
  const res = await axios.post(url(`/${tournamentId}/roster`, workspaceId), {
    userId: entry.user_id || null,
    guestName: entry.guest_name || null,
    number: entry.number ?? null,
    position: entry.position || '',
  });
  await revalidateClub();
  return fromApiRoster(res.data);
}

// entries: same shape as addToEngagementRoster's `entry`. Returns
// { results: [{ index, ok, error? }], added, failed } so the caller can tell
// the user exactly which rows failed.
export async function bulkAddToEngagementRoster(tournamentId, entries, workspaceId) {
  const res = await axios.post(url(`/${tournamentId}/roster/bulk`, workspaceId), {
    entries: entries.map((entry) => ({
      userId: entry.user_id || null,
      guestName: entry.guest_name || null,
      number: entry.number ?? null,
      position: entry.position || '',
    })),
  });
  await revalidateClub();
  return res.data;
}

// patch: { number?, position?, guest_name? } (the API only accepts these).
export async function updateEngagementRosterEntry(tournamentId, entryId, patch, workspaceId) {
  const body = {};
  if ('number' in patch) body.number = patch.number;
  if ('position' in patch) body.position = patch.position || '';
  if ('guest_name' in patch) body.guestName = patch.guest_name;
  const res = await axios.put(url(`/${tournamentId}/roster/${entryId}`, workspaceId), body);
  await revalidateClub();
  return fromApiRoster(res.data);
}

export async function removeFromEngagementRoster(tournamentId, entryId, workspaceId) {
  await axios.delete(url(`/${tournamentId}/roster/${entryId}`, workspaceId));
  await revalidateClub();
}

// ── Partidos (fecha + rival, con convocatoria embebida) ──────────────

export function useGetEngagementMatches(tournamentId, workspaceId) {
  const { data, isLoading, error } = useSWR(
    tournamentId && workspaceId ? url(`/${tournamentId}/matches`, workspaceId) : null,
    async (key) => (await fetcher(key)).map(fromApiMatch)
  );
  const matches = useMemo(
    () => [...(data || [])].sort((a, b) => new Date(b.date) - new Date(a.date)),
    [data]
  );
  return { matches, matchesLoading: isLoading, matchesError: error };
}

// entry: { tournament_id, date: 'YYYY-MM-DD', rival }. The calendar link is
// NOT set here: it is owned by the calendar event (clubMatchId).
export async function createEngagementMatch(entry, workspaceId) {
  const res = await axios.post(url(`/${entry.tournament_id}/matches`, workspaceId), {
    date: entry.date,
    rival: entry.rival,
  });
  await revalidateClub();
  return fromApiMatch(res.data);
}

export async function deleteEngagementMatch(tournamentId, matchId, workspaceId) {
  await axios.delete(url(`/${tournamentId}/matches/${matchId}`, workspaceId));
  await revalidateClub();
  // a linked calendar event drops its link server-side
  await mutate((key) => typeof key === 'string' && key.startsWith(endpoints.calendar));
}

// ── Convocatoria (embebida en el partido) ────────────────────────────

// entries: [{ roster_entry_id, called_up, status: 'titular'|'suplente'|'', minutes }]
export async function saveEngagementLineup(tournamentId, matchId, entries, workspaceId) {
  const res = await axios.put(url(`/${tournamentId}/matches/${matchId}/lineup`, workspaceId), {
    entries: toApiLineupEntries(entries),
  });
  await revalidateClub();
  return fromApiLineup(res.data?.lineup ?? res.data);
}

// Applies several called-up flags to a match's lineup in ONE write without
// clobbering the rest of it. `changes`: [{ rosterEntryId, calledUp }].
// "Convocado" is driven live from the real Tour tied to the match's calendar
// event (see MatchesPanel); this keeps the persisted lineup (used by the
// Compromiso stats) matching that.
export async function setEngagementCalledUp(match, changes, workspaceId) {
  const current = match.lineup?.entries || [];
  const byId = new Map(current.map((e) => [e.roster_entry_id, e]));
  changes.forEach(({ rosterEntryId, calledUp }) => {
    const prev = byId.get(rosterEntryId);
    byId.set(
      rosterEntryId,
      prev
        ? { ...prev, called_up: calledUp, ...(!calledUp && { status: '', minutes: 0 }) }
        : { roster_entry_id: rosterEntryId, called_up: calledUp, status: '', minutes: 0 }
    );
  });
  return saveEngagementLineup(match.tournament_id, match.id, [...byId.values()], workspaceId);
}

// matches (from useGetEngagementMatches) -> { [matchId]: lineup } for the
// ones with a saved lineup.
export function getLineupsByMatch(matches) {
  const map = {};
  (matches || []).forEach((m) => {
    if (m.lineup) map[m.id] = m.lineup;
  });
  return map;
}

// ── Compromiso (derivado, nunca se guarda aparte) ────────────────────
// partidos registrados = partidos del torneo con convocatoria guardada
// (mismo denominador para todos los jugadores de la plantilla).
export function computeCompromisoStats(roster, lineupsByMatch) {
  const registeredMatchIds = Object.keys(lineupsByMatch);
  const partidosRegistrados = registeredMatchIds.length;

  return roster.map((player) => {
    let vecesConvocado = 0;
    let titulares = 0;
    let suplentes = 0;
    let minutos = 0;

    registeredMatchIds.forEach((matchId) => {
      const entry = lineupsByMatch[matchId]?.entries?.find((e) => e.roster_entry_id === player.id);
      if (!entry?.called_up) return;
      vecesConvocado += 1;
      if (entry.status === 'titular') titulares += 1;
      if (entry.status === 'suplente') suplentes += 1;
      minutos += Number(entry.minutes) || 0;
    });

    const pj = titulares + suplentes;
    const compromiso = partidosRegistrados > 0 ? vecesConvocado / partidosRegistrados : 0;

    return {
      player,
      vecesConvocado,
      partidosRegistrados,
      compromiso,
      pj,
      titulares,
      suplentes,
      minutos,
    };
  });
}

// ── Vínculo con Calendario ────────────────────────────────────────────
// The link lives on the calendar event (`clubMatchId`), server-side: the API
// keeps the match's date/rival in sync with the event and clears the link when
// either side is deleted. To preselect the tournament in the event form we
// find which tournament owns the event's match.
export function useGetCalendarEventLink(clubMatchId, tournaments, workspaceId) {
  const tournamentIds = (tournaments || []).map((t) => t.id).join(',');
  const { data, isLoading } = useSWR(
    clubMatchId && workspaceId && tournamentIds
      ? `${url('', workspaceId)}&matchLookup=${clubMatchId}&in=${tournamentIds}`
      : null,
    async () => {
      const lists = await Promise.all(
        tournamentIds
          .split(',')
          .map((tid) => fetcher(url(`/${tid}/matches`, workspaceId)).then((ms) => ({ tid, ms })))
      );
      const hit = lists.find(({ ms }) => ms.some((m) => m.id === clubMatchId));
      return hit ? { tournament_id: hit.tid, match_id: clubMatchId } : null;
    }
  );
  return { link: data || null, linkLoading: isLoading };
}
