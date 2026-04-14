import { useMemo } from 'react';
import useSWR, { mutate } from 'swr';

import axiosInstance, { fetcher, endpoints, publicFetcher } from 'src/utils/axios';

const URL = endpoints.tournaments;
const PUBLIC_URL = '/public/tournaments';
const PUBLIC_ACCOUNT_ID = import.meta.env.VITE_PUBLIC_ACCOUNT_ID;

// ── Tournament CRUD ───────────────────────────────────────────────────

export function useGetTournaments(status) {
  const params = status ? `?status=${status}` : '';
  const { data, isLoading, error, isValidating } = useSWR(`${URL}${params}`, fetcher);

  return useMemo(
    () => ({
      tournaments: data?.items || [],
      countsByStatus: data?.counts_by_status || {},
      tournamentsLoading: isLoading,
      tournamentsError: error,
      tournamentsValidating: isValidating,
      tournamentsEmpty: !isLoading && !data?.items?.length,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetTournament(tournamentId) {
  const { data, isLoading, error, isValidating } = useSWR(
    tournamentId ? `${URL}/${tournamentId}` : null,
    fetcher
  );

  return useMemo(
    () => ({
      tournament: data,
      tournamentLoading: isLoading,
      tournamentError: error,
      tournamentValidating: isValidating,
    }),
    [data, error, isLoading, isValidating]
  );
}

export async function createTournament(tournamentData) {
  const res = await axiosInstance.post(URL, tournamentData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function updateTournament(id, tournamentData) {
  const res = await axiosInstance.patch(`${URL}/${id}`, tournamentData);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function deleteTournament(id) {
  const res = await axiosInstance.delete(`${URL}/${id}`);
  mutate((key) => typeof key === 'string' && key.startsWith(URL));
  return res.data;
}

export async function getTournamentLogoUploadUrl(tournamentId, filename, contentType) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/logo-url`, {
    filename,
    content_type: contentType,
  });
  return res.data; // { key, url }
}

// ── Groups ────────────────────────────────────────────────────────────

export function useGetGroups(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/groups` : null,
    fetcher
  );

  return useMemo(
    () => ({
      groups: data || [],
      groupsLoading: isLoading,
      groupsError: error,
    }),
    [data, error, isLoading]
  );
}

export async function createGroup(tournamentId, groupData) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/groups`, groupData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/groups`));
  return res.data;
}

export async function updateGroup(tournamentId, groupId, groupData) {
  const res = await axiosInstance.patch(`${URL}/${tournamentId}/groups/${groupId}`, groupData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/groups`));
  return res.data;
}

export async function deleteGroup(tournamentId, groupId) {
  const res = await axiosInstance.delete(`${URL}/${tournamentId}/groups/${groupId}`);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/groups`));
  return res.data;
}

export async function assignTeamToGroup(tournamentId, groupId, teamId, seed) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/groups/${groupId}/teams`, {
    team_id: teamId,
    seed,
  });
  mutate((key) => typeof key === 'string' && key.includes(tournamentId));
  return res.data;
}

export async function removeTeamFromGroup(tournamentId, groupId, teamId) {
  const res = await axiosInstance.delete(
    `${URL}/${tournamentId}/groups/${groupId}/teams/${teamId}`
  );
  mutate((key) => typeof key === 'string' && key.includes(tournamentId));
  return res.data;
}

// ── Teams ─────────────────────────────────────────────────────────────

export function useGetTeams(tournamentId, groupId) {
  const params = groupId ? `?group_id=${groupId}` : '';
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/teams${params}` : null,
    fetcher
  );

  return useMemo(
    () => ({
      teams: data || [],
      teamsLoading: isLoading,
      teamsError: error,
    }),
    [data, error, isLoading]
  );
}

export async function createTeam(tournamentId, teamData) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/teams`, teamData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/teams`));
  return res.data;
}

export async function updateTeam(tournamentId, teamId, teamData) {
  const res = await axiosInstance.patch(`${URL}/${tournamentId}/teams/${teamId}`, teamData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/teams`));
  return res.data;
}

export async function deleteTeam(tournamentId, teamId) {
  const res = await axiosInstance.delete(`${URL}/${tournamentId}/teams/${teamId}`);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/teams`));
  return res.data;
}

export function useGetTeam(tournamentId, teamId) {
  const { data, isLoading, error, mutate: revalidate } = useSWR(
    tournamentId && teamId ? `${URL}/${tournamentId}/teams/${teamId}` : null,
    fetcher
  );
  return useMemo(
    () => ({ team: data || null, teamLoading: isLoading, teamError: error, revalidateTeam: revalidate }),
    [data, error, isLoading, revalidate]
  );
}

export async function getTeamLogoUploadUrl(tournamentId, teamId, filename, contentType) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/logo-url`,
    { filename, content_type: contentType }
  );
  return res.data; // { key, url }
}

export async function getTeamDocumentUploadUrl(tournamentId, teamId, docType, filename, contentType) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/documents/upload-url`,
    { doc_type: docType, filename, content_type: contentType }
  );
  return res.data; // { key, url }
}

export async function confirmTeamDocument(tournamentId, teamId, docType, name, key) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/documents`,
    { doc_type: docType, name, key }
  );
  mutate((k) => typeof k === 'string' && k.includes(`${tournamentId}/teams/${teamId}`));
  return res.data;
}

export async function removeTeamDocument(tournamentId, teamId, docType, key) {
  const res = await axiosInstance.delete(
    `${URL}/${tournamentId}/teams/${teamId}/documents`,
    { data: { doc_type: docType, key } }
  );
  mutate((k) => typeof k === 'string' && k.includes(`${tournamentId}/teams/${teamId}`));
  return res.data;
}

// ── Players ───────────────────────────────────────────────────────────

export function useGetPlayers(tournamentId, teamId, sort) {
  let params = '';
  if (teamId) params += `?team_id=${teamId}`;
  if (sort) params += `${params ? '&' : '?'}sort=${sort}`;

  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/players${params}` : null,
    fetcher
  );

  return useMemo(
    () => ({
      players: data || [],
      playersLoading: isLoading,
      playersError: error,
    }),
    [data, error, isLoading]
  );
}

export async function createPlayer(tournamentId, teamId, playerData) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/teams/${teamId}/players`,
    playerData
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/players`));
  return res.data;
}

export async function updatePlayer(tournamentId, playerId, playerData) {
  const res = await axiosInstance.patch(
    `${URL}/${tournamentId}/players/${playerId}`,
    playerData
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/players`));
  return res.data;
}

export async function deletePlayer(tournamentId, playerId) {
  const res = await axiosInstance.delete(`${URL}/${tournamentId}/players/${playerId}`);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/players`));
  return res.data;
}

export async function getPlayerAvatarUploadUrl(tournamentId, playerId, filename, contentType) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/players/${playerId}/avatar-url`, {
    filename,
    content_type: contentType,
  });
  return res.data; // { key, url }
}

// ── Matches ───────────────────────────────────────────────────────────

export function useGetMatches(tournamentId, filters = {}) {
  const params = new URLSearchParams();
  if (filters.matchweek) params.set('matchweek', filters.matchweek);
  if (filters.status) params.set('status', filters.status);
  if (filters.team_id) params.set('team_id', filters.team_id);
  if (filters.round) params.set('round', filters.round);
  if (filters.group_id) params.set('group_id', filters.group_id);
  const qs = params.toString() ? `?${params.toString()}` : '';

  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/matches${qs}` : null,
    fetcher,
    {
      refreshInterval: (latestData) =>
        latestData?.some((m) => m.status === 'live') ? 15000 : 0,
    }
  );

  return useMemo(
    () => ({
      matches: data || [],
      matchesLoading: isLoading,
      matchesError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetMatch(tournamentId, matchId) {
  const { data, isLoading, error } = useSWR(
    tournamentId && matchId ? `${URL}/${tournamentId}/matches/${matchId}` : null,
    fetcher,
    {
      refreshInterval: (latestData) => (latestData?.status === 'live' ? 15000 : 0),
    }
  );

  return useMemo(
    () => ({
      match: data,
      matchLoading: isLoading,
      matchError: error,
    }),
    [data, error, isLoading]
  );
}

export async function createMatch(tournamentId, matchData) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/matches`, matchData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/matches`));
  return res.data;
}

export async function updateMatch(tournamentId, matchId, matchData) {
  const res = await axiosInstance.patch(
    `${URL}/${tournamentId}/matches/${matchId}`,
    matchData
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/matches`));
  return res.data;
}

export async function deleteMatch(tournamentId, matchId) {
  const res = await axiosInstance.delete(`${URL}/${tournamentId}/matches/${matchId}`);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/matches`));
  return res.data;
}

export async function advanceWinner(tournamentId, matchId, winnerTeamId) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/matches/${matchId}:advance`,
    { winner_team_id: winnerTeamId }
  );
  mutate((key) => typeof key === 'string' && key.includes(tournamentId));
  return res.data;
}

export async function updateBracketSlot(tournamentId, data) {
  const res = await axiosInstance.patch(`${URL}/${tournamentId}/bracket`, data);
  mutate((key) => typeof key === 'string' && key.includes(tournamentId));
  return res.data;
}

// ── Match Events ──────────────────────────────────────────────────────

export async function createMatchEvent(matchId, eventData) {
  const res = await axiosInstance.post(`${URL}/matches/${matchId}/events`, eventData);
  mutate((key) => typeof key === 'string' && key.includes('matches'));
  return res.data;
}

export async function updateMatchEvent(matchId, eventId, eventData) {
  const res = await axiosInstance.patch(
    `${URL}/matches/${matchId}/events/${eventId}`,
    eventData
  );
  mutate((key) => typeof key === 'string' && key.includes('matches'));
  return res.data;
}

export async function deleteMatchEvent(matchId, eventId) {
  const res = await axiosInstance.delete(`${URL}/matches/${matchId}/events/${eventId}`);
  mutate((key) => typeof key === 'string' && key.includes('matches'));
  return res.data;
}

// ── Standings ─────────────────────────────────────────────────────────

export function useGetStandings(tournamentId, groupId) {
  const path = groupId
    ? `${URL}/${tournamentId}/groups/${groupId}/standings`
    : `${URL}/${tournamentId}/standings`;

  const { data, isLoading, error } = useSWR(tournamentId ? path : null, fetcher);

  return useMemo(
    () => ({
      standings: data,
      standingsLoading: isLoading,
      standingsError: error,
    }),
    [data, error, isLoading]
  );
}

// Returns combined standings for all groups + tournament level in one request.
// Response shape: { groups: { [groupId]: { group_name, as_of, items } }, tournament: { as_of, items } }
export function useGetAllStandings(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/standings` : null,
    fetcher
  );

  return useMemo(
    () => ({
      allStandings: data,
      allStandingsLoading: isLoading,
      allStandingsError: error,
    }),
    [data, error, isLoading]
  );
}

// ── Bracket ───────────────────────────────────────────────────────────

export function useGetBracket(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/bracket` : null,
    fetcher
  );

  return useMemo(
    () => ({
      bracket: data,
      bracketLoading: isLoading,
      bracketError: error,
    }),
    [data, error, isLoading]
  );
}

export async function generateBracket(tournamentId, bracketData) {
  const res = await axiosInstance.post(`${URL}/${tournamentId}/bracket:generate`, bracketData);
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/bracket`));
  return res.data;
}

// ── Fixture Generation ────────────────────────────────────────────────

export async function generateSchedule(tournamentId, scheduleData) {
  const res = await axiosInstance.post(
    `${URL}/${tournamentId}/schedule:generate`,
    scheduleData
  );
  mutate((key) => typeof key === 'string' && key.includes(`${tournamentId}/matches`));
  return res.data;
}

// ── Stats ─────────────────────────────────────────────────────────────

export function useGetStats(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/stats` : null,
    fetcher
  );

  return useMemo(
    () => ({
      stats: data,
      statsLoading: isLoading,
      statsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetTopScorers(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${URL}/${tournamentId}/top-scorers` : null,
    fetcher
  );

  return useMemo(
    () => ({
      scorers: data || [],
      scorersLoading: isLoading,
      scorersError: error,
    }),
    [data, error, isLoading]
  );
}

// ── Public Hooks (no auth) ─────────────────────────────────────────────

export function useGetPublicTournaments(status) {
  const params = status ? { status } : {};

  const { data, isLoading, error, isValidating } = useSWR(
    [PUBLIC_URL, params],
    publicFetcher
  );

  return useMemo(
    () => ({
      tournaments: data?.items || [],
      countsByStatus: data?.counts_by_status || {},
      tournamentsLoading: isLoading,
      tournamentsError: error,
      tournamentsValidating: isValidating,
      tournamentsEmpty: !isLoading && !data?.items?.length,
    }),
    [data, error, isLoading, isValidating]
  );
}

export function useGetPublicTournament(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      tournament: data,
      tournamentLoading: isLoading,
      tournamentError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicGroups(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}/groups` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      groups: data || [],
      groupsLoading: isLoading,
      groupsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicTeams(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}/teams` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      teams: data || [],
      teamsLoading: isLoading,
      teamsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicMatches(tournamentId, filters = {}) {
  const params = {};
  if (filters.matchweek) params.matchweek = filters.matchweek;
  if (filters.status) params.status = filters.status;

  const { data, isLoading, error } = useSWR(
    tournamentId ? [`${PUBLIC_URL}/${tournamentId}/matches`, params] : null,
    publicFetcher,
    {
      refreshInterval: (latestData) =>
        latestData?.some((m) => m.status === 'live') ? 15000 : 0,
    }
  );

  return useMemo(
    () => ({
      matches: data || [],
      matchesLoading: isLoading,
      matchesError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicStandings(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}/standings` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      allStandings: data,
      allStandingsLoading: isLoading,
      allStandingsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicStats(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}/stats` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      stats: data,
      statsLoading: isLoading,
      statsError: error,
    }),
    [data, error, isLoading]
  );
}

export function useGetPublicTopScorers(tournamentId) {
  const { data, isLoading, error } = useSWR(
    tournamentId ? `${PUBLIC_URL}/${tournamentId}/top-scorers` : null,
    publicFetcher
  );

  return useMemo(
    () => ({
      scorers: data || [],
      scorersLoading: isLoading,
      scorersError: error,
    }),
    [data, error, isLoading]
  );
}

