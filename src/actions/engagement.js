import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

// ── Mock data layer ──────────────────────────────────────────────────
// Frontend-only placeholder for "Torneos" (club-scoped): tracking the
// club's own team as it competes in external tournaments (e.g. Lichi
// Cup, Ascenso Trinche 2, Liga Tradicional) — this is NOT the bracket
// organizer (that lives in src/actions/tournament.js, which hosts
// competitions between many teams and isn't workspace-scoped at all).
// Here, a "tournament" is just something this club's team participates
// in, with its own roster drawn from the club's real Usuarios. Persists
// to localStorage, scoped per workspace, so it survives reloads during
// design review; real version needs backend endpoints mirroring this
// shape (tournament, roster, match, lineup), each filtered by
// workspace_id.
//
// Player identity still comes from the real, workspace-scoped Usuarios
// (src/actions/user.js) — pass `users` (from useGetUsers) into the hooks
// below to join names/avatars. A roster row can also carry a plain
// `guest_name` with no user_id for someone without an account yet.

const TOURNAMENTS_KEY_BASE = 'jmanage_mock_engagement_tournaments';
const ROSTER_KEY_BASE = 'jmanage_mock_engagement_roster';
const MATCHES_KEY_BASE = 'jmanage_mock_engagement_matches';
const LINEUPS_KEY_BASE = 'jmanage_mock_engagement_lineups';
const CALENDAR_LINKS_KEY_BASE = 'jmanage_mock_engagement_calendar_links';

function scopedKey(base, workspaceId) {
  return `${base}_${workspaceId}`;
}

function readList(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}
function writeList(key, list) {
  localStorage.setItem(key, JSON.stringify(list));
}
function readMap(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}
function writeMap(key, map) {
  localStorage.setItem(key, JSON.stringify(map));
}
function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function touchEngagement() {
  mutate((key) => typeof key === 'string' && key.startsWith('mock-engagement'));
}

// ── Torneos (participación externa) ──────────────────────────────────

export function useGetEngagementTournaments(workspaceId) {
  const key = workspaceId ? `mock-engagement-tournaments-${workspaceId}` : null;
  const { data, isLoading } = useSWR(key, () =>
    readList(scopedKey(TOURNAMENTS_KEY_BASE, workspaceId))
  );
  return useMemo(() => ({ tournaments: data || [], tournamentsLoading: isLoading }), [data, isLoading]);
}

export async function createEngagementTournament({ name, category }, workspaceId) {
  const key = scopedKey(TOURNAMENTS_KEY_BASE, workspaceId);
  const list = readList(key);
  const row = {
    id: uid(),
    workspaceId,
    name,
    category: category || '',
    created_at: new Date().toISOString(),
  };
  list.push(row);
  writeList(key, list);
  touchEngagement();
  return row;
}

export async function deleteEngagementTournament(id, workspaceId) {
  writeList(
    scopedKey(TOURNAMENTS_KEY_BASE, workspaceId),
    readList(scopedKey(TOURNAMENTS_KEY_BASE, workspaceId)).filter((t) => t.id !== id)
  );
  writeList(
    scopedKey(ROSTER_KEY_BASE, workspaceId),
    readList(scopedKey(ROSTER_KEY_BASE, workspaceId)).filter((r) => r.tournament_id !== id)
  );
  const matches = readList(scopedKey(MATCHES_KEY_BASE, workspaceId));
  const keptMatches = matches.filter((m) => m.tournament_id !== id);
  const removedIds = new Set(matches.filter((m) => m.tournament_id === id).map((m) => m.id));
  writeList(scopedKey(MATCHES_KEY_BASE, workspaceId), keptMatches);

  const lineups = readMap(scopedKey(LINEUPS_KEY_BASE, workspaceId));
  removedIds.forEach((matchId) => delete lineups[matchId]);
  writeMap(scopedKey(LINEUPS_KEY_BASE, workspaceId), lineups);

  const links = readMap(scopedKey(CALENDAR_LINKS_KEY_BASE, workspaceId));
  Object.entries(links).forEach(([calendarEventId, link]) => {
    if (link.tournament_id === id) delete links[calendarEventId];
  });
  writeMap(scopedKey(CALENDAR_LINKS_KEY_BASE, workspaceId), links);

  touchEngagement();
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
  const key = tournamentId && workspaceId ? `mock-engagement-roster-${workspaceId}-${tournamentId}` : null;
  const { data, isLoading } = useSWR(key, () =>
    readList(scopedKey(ROSTER_KEY_BASE, workspaceId)).filter((r) => r.tournament_id === tournamentId)
  );
  const roster = useMemo(() => (data || []).map((e) => joinRosterEntry(e, users || [])), [data, users]);
  return { roster, rosterLoading: isLoading };
}

// Every tournament a given user_id is rostered in, across this workspace.
export function useGetEngagementTournamentsForUser(userId, workspaceId) {
  const key = userId && workspaceId ? `mock-engagement-user-tournaments-${workspaceId}-${userId}` : null;
  const { data, isLoading } = useSWR(key, () => {
    const roster = readList(scopedKey(ROSTER_KEY_BASE, workspaceId)).filter((r) => r.user_id === userId);
    const tournaments = readList(scopedKey(TOURNAMENTS_KEY_BASE, workspaceId));
    return roster
      .map((entry) => ({
        rosterEntryId: entry.id,
        tournament: tournaments.find((t) => t.id === entry.tournament_id) || null,
      }))
      .filter((row) => row.tournament);
  });
  return { entries: data || [], entriesLoading: isLoading };
}

// entry: { tournament_id, user_id?, guest_name?, number, position }
export async function addToEngagementRoster(entry, workspaceId) {
  const key = scopedKey(ROSTER_KEY_BASE, workspaceId);
  const roster = readList(key);
  if (entry.user_id) {
    const already = roster.find(
      (r) => r.tournament_id === entry.tournament_id && r.user_id === entry.user_id
    );
    if (already) throw new Error('Este usuario ya está en la plantilla de este torneo');
  }
  const row = { id: uid(), ...entry };
  roster.push(row);
  writeList(key, roster);
  touchEngagement();
  return row;
}

export async function updateEngagementRosterEntry(entryId, patch, workspaceId) {
  const key = scopedKey(ROSTER_KEY_BASE, workspaceId);
  const roster = readList(key);
  const idx = roster.findIndex((r) => r.id === entryId);
  if (idx === -1) throw new Error('No encontrado en la plantilla');
  roster[idx] = { ...roster[idx], ...patch };
  writeList(key, roster);
  touchEngagement();
  return roster[idx];
}

export async function removeFromEngagementRoster(entryId, workspaceId) {
  const key = scopedKey(ROSTER_KEY_BASE, workspaceId);
  writeList(key, readList(key).filter((r) => r.id !== entryId));
  touchEngagement();
}

// ── Partidos (simples: fecha + rival) ────────────────────────────────

export function useGetEngagementMatches(tournamentId, workspaceId) {
  const key = tournamentId && workspaceId ? `mock-engagement-matches-${workspaceId}-${tournamentId}` : null;
  const { data, isLoading } = useSWR(key, () =>
    readList(scopedKey(MATCHES_KEY_BASE, workspaceId))
      .filter((m) => m.tournament_id === tournamentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  );
  return { matches: data || [], matchesLoading: isLoading };
}

// entry: { tournament_id, date, rival }
export async function createEngagementMatch(entry, workspaceId) {
  const key = scopedKey(MATCHES_KEY_BASE, workspaceId);
  const matches = readList(key);
  const row = { id: uid(), ...entry, created_at: new Date().toISOString() };
  matches.push(row);
  writeList(key, matches);
  touchEngagement();
  return row;
}

export async function deleteEngagementMatch(matchId, workspaceId) {
  writeList(
    scopedKey(MATCHES_KEY_BASE, workspaceId),
    readList(scopedKey(MATCHES_KEY_BASE, workspaceId)).filter((m) => m.id !== matchId)
  );
  const lineups = readMap(scopedKey(LINEUPS_KEY_BASE, workspaceId));
  delete lineups[matchId];
  writeMap(scopedKey(LINEUPS_KEY_BASE, workspaceId), lineups);
  touchEngagement();
}

// ── Convocatoria (por partido) ───────────────────────────────────────

export function useGetEngagementLineup(matchId, workspaceId) {
  const key = matchId && workspaceId ? `mock-engagement-lineup-${workspaceId}-${matchId}` : null;
  const { data, isLoading } = useSWR(key, () => readMap(scopedKey(LINEUPS_KEY_BASE, workspaceId))[matchId] || null);
  return { lineup: data || null, lineupLoading: isLoading };
}

// entries: [{ roster_entry_id, called_up, status: 'titular'|'suplente'|'', minutes }]
export async function saveEngagementLineup(matchId, entries, workspaceId) {
  const key = scopedKey(LINEUPS_KEY_BASE, workspaceId);
  const lineups = readMap(key);
  lineups[matchId] = { entries, saved_at: new Date().toISOString() };
  writeMap(key, lineups);
  touchEngagement();
  return lineups[matchId];
}

export function useGetEngagementLineupsForMatches(matchIds, workspaceId) {
  const ids = (matchIds || []).slice().sort();
  const key = ids.length && workspaceId ? `mock-engagement-lineups-${workspaceId}-${ids.join(',')}` : null;
  const { data, isLoading } = useSWR(key, () => {
    const lineups = readMap(scopedKey(LINEUPS_KEY_BASE, workspaceId));
    const map = {};
    ids.forEach((id) => {
      if (lineups[id]) map[id] = lineups[id];
    });
    return map;
  });
  return { lineupsByMatch: data || {}, lineupsLoading: isLoading };
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

    return { player, vecesConvocado, partidosRegistrados, compromiso, pj, titulares, suplentes, minutos };
  });
}

// ── Vínculo con Calendario ────────────────────────────────────────────
// El Calendario real (src/actions/calendar.js) pega contra el backend de
// verdad, que no tiene ningún campo de "torneo" — así que en vez de
// arriesgarme a que el backend descarte un campo que no reconoce, el
// vínculo evento↔torneo vive acá: al guardar un evento de categoría
// "match" con un torneo elegido, se crea (o actualiza) automáticamente un
// Partido de Compromiso para ese torneo, usando el título del evento como
// rival y su fecha de inicio. Borrar el vínculo no borra el evento real.
export function useGetCalendarEventLink(calendarEventId, workspaceId) {
  const key = calendarEventId && workspaceId ? `mock-engagement-cal-link-${workspaceId}-${calendarEventId}` : null;
  const { data, isLoading } = useSWR(
    key,
    () => readMap(scopedKey(CALENDAR_LINKS_KEY_BASE, workspaceId))[calendarEventId] || null
  );
  return { link: data || null, linkLoading: isLoading };
}

// { tournament_id, date: 'YYYY-MM-DD', rival }
export async function linkCalendarEventToTournament(calendarEventId, payload, workspaceId) {
  const linksKey = scopedKey(CALENDAR_LINKS_KEY_BASE, workspaceId);
  const links = readMap(linksKey);
  const existing = links[calendarEventId];

  let matchId = existing?.match_id;
  if (existing && existing.tournament_id !== payload.tournament_id) {
    // Tournament changed — the old match no longer applies here.
    await deleteEngagementMatch(existing.match_id, workspaceId);
    matchId = null;
  }

  if (matchId) {
    const matchesKey = scopedKey(MATCHES_KEY_BASE, workspaceId);
    const matches = readList(matchesKey);
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      matches[idx] = { ...matches[idx], date: payload.date, rival: payload.rival };
      writeList(matchesKey, matches);
    }
  } else {
    const created = await createEngagementMatch(
      {
        tournament_id: payload.tournament_id,
        date: payload.date,
        rival: payload.rival,
      },
      workspaceId
    );
    matchId = created.id;
  }

  links[calendarEventId] = { tournament_id: payload.tournament_id, match_id: matchId };
  writeMap(linksKey, links);
  touchEngagement();
  return links[calendarEventId];
}

export async function unlinkCalendarEvent(calendarEventId, workspaceId) {
  const linksKey = scopedKey(CALENDAR_LINKS_KEY_BASE, workspaceId);
  const links = readMap(linksKey);
  const existing = links[calendarEventId];
  if (!existing) return;
  await deleteEngagementMatch(existing.match_id, workspaceId);
  delete links[calendarEventId];
  writeMap(linksKey, links);
  touchEngagement();
}
