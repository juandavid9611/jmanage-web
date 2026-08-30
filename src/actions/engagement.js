import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

// ── Mock data layer ──────────────────────────────────────────────────
// Frontend-only placeholder for "Compromiso" (Analítica → Compromiso):
// tracking the club's own team as it competes in external tournaments
// (e.g. Lichi Cup, Ascenso Trinche 2) — separate from the "Torneos" module,
// which is for organizing/hosting a bracket, not for logging participation
// in someone else's competition. Persists to localStorage so it survives
// reloads during design review; real version needs backend endpoints
// mirroring this shape (tournament, roster, match, lineup).
//
// Player identity still comes from the real, workspace-scoped Usuarios
// (src/actions/user.js) — pass `users` (from useGetUsers) into the hooks
// below to join names/avatars. A roster row can also carry a plain
// `guest_name` with no user_id for someone without an account yet.

const TOURNAMENTS_KEY = 'jmanage_mock_engagement_tournaments';
const ROSTER_KEY = 'jmanage_mock_engagement_roster';
const MATCHES_KEY = 'jmanage_mock_engagement_matches';
const LINEUPS_KEY = 'jmanage_mock_engagement_lineups';
const CALENDAR_LINKS_KEY = 'jmanage_mock_engagement_calendar_links';

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

export function useGetEngagementTournaments() {
  const { data, isLoading } = useSWR('mock-engagement-tournaments', () => readList(TOURNAMENTS_KEY));
  return useMemo(() => ({ tournaments: data || [], tournamentsLoading: isLoading }), [data, isLoading]);
}

export async function createEngagementTournament({ name, category }) {
  const list = readList(TOURNAMENTS_KEY);
  const row = { id: uid(), name, category: category || '', created_at: new Date().toISOString() };
  list.push(row);
  writeList(TOURNAMENTS_KEY, list);
  touchEngagement();
  return row;
}

export async function deleteEngagementTournament(id) {
  writeList(TOURNAMENTS_KEY, readList(TOURNAMENTS_KEY).filter((t) => t.id !== id));
  writeList(ROSTER_KEY, readList(ROSTER_KEY).filter((r) => r.tournament_id !== id));
  const matches = readList(MATCHES_KEY);
  const keptMatches = matches.filter((m) => m.tournament_id !== id);
  const removedIds = new Set(matches.filter((m) => m.tournament_id === id).map((m) => m.id));
  writeList(MATCHES_KEY, keptMatches);
  const lineups = readMap(LINEUPS_KEY);
  removedIds.forEach((matchId) => delete lineups[matchId]);
  writeMap(LINEUPS_KEY, lineups);
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

export function useGetEngagementRoster(tournamentId, users) {
  const key = tournamentId ? `mock-engagement-roster-${tournamentId}` : null;
  const { data, isLoading } = useSWR(key, () =>
    readList(ROSTER_KEY).filter((r) => r.tournament_id === tournamentId)
  );
  const roster = useMemo(() => (data || []).map((e) => joinRosterEntry(e, users || [])), [data, users]);
  return { roster, rosterLoading: isLoading };
}

// entry: { tournament_id, user_id?, guest_name?, number, position }
export async function addToEngagementRoster(entry) {
  const roster = readList(ROSTER_KEY);
  if (entry.user_id) {
    const already = roster.find(
      (r) => r.tournament_id === entry.tournament_id && r.user_id === entry.user_id
    );
    if (already) throw new Error('Este usuario ya está en la plantilla de este torneo');
  }
  const row = { id: uid(), ...entry };
  roster.push(row);
  writeList(ROSTER_KEY, roster);
  touchEngagement();
  return row;
}

export async function updateEngagementRosterEntry(entryId, patch) {
  const roster = readList(ROSTER_KEY);
  const idx = roster.findIndex((r) => r.id === entryId);
  if (idx === -1) throw new Error('No encontrado en la plantilla');
  roster[idx] = { ...roster[idx], ...patch };
  writeList(ROSTER_KEY, roster);
  touchEngagement();
  return roster[idx];
}

export async function removeFromEngagementRoster(entryId) {
  writeList(ROSTER_KEY, readList(ROSTER_KEY).filter((r) => r.id !== entryId));
  touchEngagement();
}

// ── Partidos (simples: fecha + rival) ────────────────────────────────

export function useGetEngagementMatches(tournamentId) {
  const key = tournamentId ? `mock-engagement-matches-${tournamentId}` : null;
  const { data, isLoading } = useSWR(key, () =>
    readList(MATCHES_KEY)
      .filter((m) => m.tournament_id === tournamentId)
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  );
  return { matches: data || [], matchesLoading: isLoading };
}

// entry: { tournament_id, date, rival }
export async function createEngagementMatch(entry) {
  const matches = readList(MATCHES_KEY);
  const row = { id: uid(), ...entry, created_at: new Date().toISOString() };
  matches.push(row);
  writeList(MATCHES_KEY, matches);
  touchEngagement();
  return row;
}

export async function deleteEngagementMatch(matchId) {
  writeList(MATCHES_KEY, readList(MATCHES_KEY).filter((m) => m.id !== matchId));
  const lineups = readMap(LINEUPS_KEY);
  delete lineups[matchId];
  writeMap(LINEUPS_KEY, lineups);
  touchEngagement();
}

// ── Convocatoria (por partido) ───────────────────────────────────────

export function useGetEngagementLineup(matchId) {
  const key = matchId ? `mock-engagement-lineup-${matchId}` : null;
  const { data, isLoading } = useSWR(key, () => readMap(LINEUPS_KEY)[matchId] || null);
  return { lineup: data || null, lineupLoading: isLoading };
}

// entries: [{ roster_entry_id, called_up, status: 'titular'|'suplente'|'', minutes }]
export async function saveEngagementLineup(matchId, entries) {
  const lineups = readMap(LINEUPS_KEY);
  lineups[matchId] = { entries, saved_at: new Date().toISOString() };
  writeMap(LINEUPS_KEY, lineups);
  touchEngagement();
  return lineups[matchId];
}

export function useGetEngagementLineupsForMatches(matchIds) {
  const ids = (matchIds || []).slice().sort();
  const key = ids.length ? `mock-engagement-lineups-${ids.join(',')}` : null;
  const { data, isLoading } = useSWR(key, () => {
    const lineups = readMap(LINEUPS_KEY);
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
export function useGetCalendarEventLink(calendarEventId) {
  const key = calendarEventId ? `mock-engagement-cal-link-${calendarEventId}` : null;
  const { data, isLoading } = useSWR(key, () => readMap(CALENDAR_LINKS_KEY)[calendarEventId] || null);
  return { link: data || null, linkLoading: isLoading };
}

// { tournament_id, date: 'YYYY-MM-DD', rival }
export async function linkCalendarEventToTournament(calendarEventId, payload) {
  const links = readMap(CALENDAR_LINKS_KEY);
  const existing = links[calendarEventId];

  let matchId = existing?.match_id;
  if (existing && existing.tournament_id !== payload.tournament_id) {
    // Tournament changed — the old match no longer applies here.
    await deleteEngagementMatch(existing.match_id);
    matchId = null;
  }

  if (matchId) {
    const matches = readList(MATCHES_KEY);
    const idx = matches.findIndex((m) => m.id === matchId);
    if (idx !== -1) {
      matches[idx] = { ...matches[idx], date: payload.date, rival: payload.rival };
      writeList(MATCHES_KEY, matches);
    }
  } else {
    const created = await createEngagementMatch({
      tournament_id: payload.tournament_id,
      date: payload.date,
      rival: payload.rival,
    });
    matchId = created.id;
  }

  links[calendarEventId] = { tournament_id: payload.tournament_id, match_id: matchId };
  writeMap(CALENDAR_LINKS_KEY, links);
  touchEngagement();
  return links[calendarEventId];
}

export async function unlinkCalendarEvent(calendarEventId) {
  const links = readMap(CALENDAR_LINKS_KEY);
  const existing = links[calendarEventId];
  if (!existing) return;
  await deleteEngagementMatch(existing.match_id);
  delete links[calendarEventId];
  writeMap(CALENDAR_LINKS_KEY, links);
  touchEngagement();
}
