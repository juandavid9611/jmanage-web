import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';

import { useGetMyTeamOwnerTeams } from 'src/actions/me';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTeams,
  useGetGroups,
  useGetMatches,
  useGetPlayers,
  useGetBracket,
  useGetTournament,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { MatchList } from 'src/sections/tournament/match-row';
import { BracketView } from 'src/sections/tournament/bracket-view';
import { StandingsSidebar } from 'src/sections/tournament/standings-sidebar';
import { MatchweekTimeline } from 'src/sections/tournament/matchweek-timeline';
import { PlayerRankingTable } from 'src/sections/tournament/player-ranking-table';
import { getPhases, TournamentBanner } from 'src/sections/tournament/tournament-banner';

// ----------------------------------------------------------------------

function getDefaultPhase(tournament, teams) {
  const phases = getPhases(tournament, teams);
  const active = phases.find((p) => p.state === 'active');
  if (active) return active.key;
  const lastDone = [...phases].reverse().find((p) => p.state === 'done');
  if (lastDone) return lastDone.key;
  return phases[0]?.key || 'configuracion';
}

// ----------------------------------------------------------------------

/**
 * Inner view: shows a single tournament read-only for a team owner.
 * The owner's team is highlighted via highlightTeamId.
 */
function TournamentView({ tournamentId, highlightTeamId }) {
  const [activePhase, setActivePhase] = useState(null);
  const [selectedMw, setSelectedMw] = useState(undefined);
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(tournamentId);
  const { teams } = useGetTeams(tournamentId);
  const { groups } = useGetGroups(tournamentId);
  const { matches: allMatches, matchesLoading } = useGetMatches(tournamentId);
  const { bracket, bracketLoading } = useGetBracket(tournamentId);

  const currentMw = tournament?.current_matchweek || 1;
  const totalMw =
    tournament?.rules?.total_matchweeks ||
    (allMatches.length > 0 ? Math.max(...allMatches.map((m) => m.matchweek || 0)) : 0);
  const activeMw = selectedMw === undefined ? currentMw : selectedMw;

  const currentMatches = useMemo(
    () => (activeMw === null ? allMatches : allMatches.filter((m) => m.matchweek === activeMw)),
    [allMatches, activeMw]
  );

  const currentPhase =
    activePhase || (tournament ? getDefaultPhase(tournament, teams) : 'configuracion');

  const isKnockoutPhase = currentPhase === 'eliminatorias';

  if (tournamentLoading) return <LoadingScreen />;

  if (!tournament) {
    return <EmptyContent title="Torneo no encontrado" sx={{ py: 8 }} />;
  }

  return (
    <DashboardContent maxWidth={false} disablePadding>
      {/* Team strip */}
      <TeamStrip tournament={tournament} teams={teams} highlightTeamId={highlightTeamId} />

      {/* Tournament banner with phase tabs (read-only — no edit controls) */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={(p) => setActivePhase(p)}
        readOnly
      />

      {/* Phase content */}
      <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.02), minHeight: 400 }}>
        {/* ── FASE GRUPOS: matches + standings ── */}
        {currentPhase === 'fase_grupos' && (
          <Grid container>
            <Grid
              xs={12}
              md={6}
              sx={{
                borderRight: (t) => ({ md: `1px solid ${alpha(t.palette.grey[500], 0.12)}` }),
              }}
            >
              {totalMw > 0 && (
                <MatchweekTimeline
                  totalMatchweeks={totalMw}
                  currentMatchweek={currentMw}
                  allMatches={allMatches}
                  selectedMatchweek={activeMw}
                  onSelect={(mw) => setSelectedMw(mw)}
                  onViewAll={() => setSelectedMw(null)}
                />
              )}

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                    {activeMw === null ? 'Todos los partidos' : `Jornada ${activeMw}`}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    }}
                  />
                </Stack>

                {matchesLoading ? (
                  <Stack spacing={0.75}>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={64} />
                    ))}
                  </Stack>
                ) : (
                  <MatchList
                    matches={currentMatches}
                    teams={teams}
                    tournamentId={tournamentId}
                    grouped
                    highlightTeamId={highlightTeamId}
                  />
                )}
              </Box>
            </Grid>

            <Grid xs={12} md={6}>
              <StandingsSidebar
                tournamentId={tournamentId}
                teams={teams}
                allMatches={allMatches}
                currentMatchweek={currentMw}
                totalMatchweeks={totalMw}
                highlightTeamId={highlightTeamId}
              />
            </Grid>
          </Grid>
        )}

        {/* ── FASE FINAL (bracket) ── */}
        {isKnockoutPhase && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BracketView
              tournamentId={tournamentId}
              teams={teams}
              tournament={tournament}
              allMatches={allMatches}
              readOnly
              bracket={bracket}
              bracketLoading={bracketLoading}
            />
          </Box>
        )}

        {/* ── ESTADÍSTICAS ── */}
        {currentPhase === 'estadisticas' && (
          <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Goleadores
              </Typography>
              <PlayerRankingTable tournamentId={tournamentId} metric="goals" highlightTeamId={highlightTeamId} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Asistencias
              </Typography>
              <PlayerRankingTable tournamentId={tournamentId} metric="assists" highlightTeamId={highlightTeamId} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                Amonestaciones
              </Typography>
              <PlayerRankingTable tournamentId={tournamentId} metric="cards" highlightTeamId={highlightTeamId} />
            </Box>
          </Stack>
        )}

        {/* ── MY TEAM ROSTER (always shown at bottom) ── */}
        {highlightTeamId && (
          <MyTeamRoster tournamentId={tournamentId} teamId={highlightTeamId} teams={teams} />
        )}
      </Box>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

/**
 * Top strip showing the team owner's team info + tournament context.
 */
function TeamStrip({ tournament, teams, highlightTeamId }) {
  const myTeam = teams?.find((t) => t.id === highlightTeamId);

  return (
    <Box
      sx={{
        px: { xs: 2, md: 5 },
        py: 2,
        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" gap={1}>
        {/* Team logo + name */}
        {myTeam && (
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {myTeam.logo_url ? (
              <Avatar
                src={myTeam.logo_url}
                variant="rounded"
                sx={{
                  width: 44,
                  height: 44,
                  border: (t) => `2px solid ${t.palette.primary.main}`,
                }}
              />
            ) : (
              <Box
                sx={{
                  width: 44,
                  height: 44,
                  borderRadius: 1,
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: (t) => `2px solid ${t.palette.primary.main}`,
                }}
              >
                <Iconify icon="mdi:shield-half-full" width={24} sx={{ color: 'primary.main' }} />
              </Box>
            )}
            <Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {myTeam.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                Mi equipo
              </Typography>
            </Stack>
          </Stack>
        )}

        {/* Divider */}
        {myTeam && (
          <Box sx={{ width: 1, height: 32, bgcolor: (t) => alpha(t.palette.grey[500], 0.2) }} />
        )}

        {/* Tournament info */}
        <Stack>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {tournament?.name}
          </Typography>
          {tournament?.start_date && (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {tournament.start_date}
              {tournament.end_date ? ` — ${tournament.end_date}` : ''}
            </Typography>
          )}
        </Stack>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * My team's player roster shown as a bottom section.
 */
function MyTeamRoster({ tournamentId, teamId, teams }) {
  const myTeam = teams?.find((t) => t.id === teamId);
  const { players, playersLoading } = useGetPlayers(tournamentId, teamId);

  if (!myTeam) return null;

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Plantel — {myTeam.name}
      </Typography>

      {playersLoading ? (
        <Stack spacing={0.75}>
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={40} />
          ))}
        </Stack>
      ) : !players?.length ? (
        <EmptyContent title="Sin jugadores registrados" sx={{ py: 4 }} />
      ) : (
        <Box
          display="grid"
          gap={1}
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          {players.map((p) => (
            <Stack
              key={p.id}
              direction="row"
              alignItems="center"
              spacing={1.5}
              sx={{
                px: 1.5,
                py: 1,
                borderRadius: 1,
                border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              }}
            >
              <Typography variant="body2" sx={{ minWidth: 28, color: 'text.disabled' }}>
                {p.number != null ? `#${p.number}` : '—'}
              </Typography>
              <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
                {p.name}
              </Typography>
              {p.position && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {p.position}
                </Typography>
              )}
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * Multi-tournament picker (shown when the user owns teams in more than one tournament).
 */
function TournamentPicker({ teams, onSelect }) {
  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Typography variant="h4">Mis torneos</Typography>
        <Box
          display="grid"
          gap={2}
          gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
        >
          {teams.map((t) => (
            <Box
              key={t.tournament_team_id}
              onClick={() => onSelect(t)}
              sx={{
                p: 3,
                cursor: 'pointer',
                borderRadius: 2,
                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                bgcolor: 'background.paper',
                transition: 'all 0.15s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-2px)',
                  boxShadow: (theme) => theme.customShadows?.z8 || '0 8px 16px 0 rgba(0,0,0,0.16)',
                },
              }}
            >
              <Stack spacing={0.5}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {t.tournament_name}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t.team_name}
                </Typography>
                <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
                  Mi equipo
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Stack>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

/**
 * Root view: resolves the team owner's tournament(s) and renders the appropriate UI.
 */
export function TeamOwnerTournamentView() {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const { teams, teamsLoading } = useGetMyTeamOwnerTeams();

  if (teamsLoading) return <LoadingScreen />;

  if (!teams?.length) {
    return (
      <DashboardContent>
        <EmptyContent
          title="Sin torneo asignado"
          description="No eres responsable de ningún equipo en un torneo activo."
          sx={{ py: 10 }}
        />
      </DashboardContent>
    );
  }

  // Single tournament: go straight in
  if (teams.length === 1 && !selectedEntry) {
    const entry = teams[0];
    return (
      <TournamentView
        tournamentId={entry.tournament_id}
        highlightTeamId={entry.tournament_team_id}
      />
    );
  }

  // Multiple tournaments: show picker then detail
  if (selectedEntry) {
    return (
      <TournamentView
        tournamentId={selectedEntry.tournament_id}
        highlightTeamId={selectedEntry.tournament_team_id}
      />
    );
  }

  return <TournamentPicker teams={teams} onSelect={setSelectedEntry} />;
}
