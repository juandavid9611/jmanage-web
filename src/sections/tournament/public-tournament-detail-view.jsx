import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import {
  useGetPublicTeams,
  useGetPublicGroups,
  useGetPublicMatches,
  useGetPublicPlayers,
  useGetPublicBracket,
  useGetPublicTournament,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { LandingNav } from 'src/sections/landing/landing-nav';

import { MatchList } from './match-row';
import { BracketView } from './bracket-view';
import { StatsOverview } from './stats-overview';
import { StandingsSidebar } from './standings-sidebar';
import { MatchweekTimeline } from './matchweek-timeline';
import { PlayerRankingTable } from './player-ranking-table';
import { getPhases, TournamentBanner } from './tournament-banner';
import { TournamentConfigSummary } from './tournament-config-summary';

// ----------------------------------------------------------------------

const POSITION_LABEL = {
  Goalkeeper: 'Porteros',
  Defender: 'Defensas',
  Midfielder: 'Mediocampistas',
  Forward: 'Delanteros',
};

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

export function PublicTournamentDetailView({ id }) {
  const navigate = useNavigate();
  const [activePhase, setActivePhase] = useState(null);
  const [selectedMw, setSelectedMw] = useState(undefined);
  const [openTeamId, setOpenTeamId] = useState(null);

  const { tournament, tournamentLoading } = useGetPublicTournament(id);
  const { teams } = useGetPublicTeams(id);
  const { groups } = useGetPublicGroups(id);
  const { matches: allMatches, matchesLoading } = useGetPublicMatches(id);
  const { bracket, bracketLoading } = useGetPublicBracket(id);

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

  const isLeague = tournament?.type === 'league';
  const isHybrid = tournament?.type === 'hybrid';
  const isKnockoutPhase = currentPhase === 'eliminatorias';

  const openTeamRoster = (teamId) => setOpenTeamId(teamId);
  const closeTeamRoster = () => setOpenTeamId(null);

  if (tournamentLoading) return <LoadingScreen />;
  if (!tournament) {
    return (
      <>
        <LandingNav basePath="/" />
        <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: 8 }}>
          <EmptyContent
            title="Torneo no disponible"
            description="Este torneo no existe o no está configurado como público."
          />
        </Container>
      </>
    );
  }

  return (
    <>
      <LandingNav basePath="/" />

      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 5, md: 8 } }}>
        {/* Back link */}
        <Button
          startIcon={<Iconify icon="eva:arrow-back-fill" />}
          onClick={() => navigate(paths.publicTournaments.root)}
          sx={{ mb: 2, color: 'text.secondary' }}
        >
          Torneos
        </Button>

        {/* Same banner + phase tabs as auth, wrapped in a card-like surface so it
            reads as a single unit on the public marketing site (constrained width). */}
        <Box
          sx={{
            borderRadius: 2,
            overflow: 'hidden',
            border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.16)}`,
            bgcolor: 'background.paper',
          }}
        >
          <TournamentBanner
            tournament={tournament}
            teams={teams}
            activePhase={currentPhase}
            totalMatchweeks={totalMw}
            allMatches={allMatches}
            onPhaseClick={(p) => setActivePhase(p)}
            publicMode
          />

          {/* Phase content (mirrors auth tournament-detail-view) */}
          <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.02), minHeight: 400 }}>
          {/* ── CONFIGURACIÓN ── */}
          {currentPhase === 'configuracion' && (
            <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
              <StatsOverview tournamentId={id} tournament={tournament} publicMode />
              <TournamentConfigSummary tournament={tournament} />
            </Stack>
          )}

          {/* ── INSCRIPCIÓN (public: teams grouped by Grupo, read-only) ── */}
          {currentPhase === 'inscripcion' && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <PublicTeamsByGroup
                teams={teams}
                groups={groups}
                onTeamClick={openTeamRoster}
              />
            </Box>
          )}

          {/* ── FASE GRUPOS: matches + standings (50/50 like auth) ── */}
          {currentPhase === 'fase_grupos' && (
            <Grid container>
              <Grid
                xs={12}
                md={6}
                sx={{
                  borderRight: (t) => ({ md: `1px solid ${alpha(t.palette.grey[500], 0.12)}` }),
                }}
              >
                {(isLeague || isHybrid) && totalMw > 0 && (
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
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled', fontWeight: 600 }}
                    >
                      {activeMw === null ? 'Todos los partidos' : `Jornada ${activeMw}`}
                    </Typography>
                    <Box
                      sx={{ flex: 1, height: 1, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }}
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
                      tournamentId={id}
                      grouped
                      publicMode
                      onMatchClick={(match) =>
                        navigate(paths.publicTournaments.match(id, match.id))
                      }
                    />
                  )}
                </Box>
              </Grid>

              <Grid xs={12} md={6}>
                <StandingsSidebar
                  tournamentId={id}
                  teams={teams}
                  allMatches={allMatches}
                  currentMatchweek={currentMw}
                  totalMatchweeks={totalMw}
                  publicMode
                />
              </Grid>
            </Grid>
          )}

          {/* ── FASE FINAL (bracket) ── */}
          {isKnockoutPhase && (
            <Box sx={{ p: { xs: 2, md: 3 } }}>
              <BracketView
                tournamentId={id}
                teams={teams}
                tournament={tournament}
                allMatches={allMatches}
                readOnly
                bracket={bracket}
                bracketLoading={bracketLoading}
              />
            </Box>
          )}

          {/* ── ESTADÍSTICAS: rankings (goals, assists, cards) ── */}
          {currentPhase === 'estadisticas' && (
            <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Goleadores
                </Typography>
                <PlayerRankingTable tournamentId={id} metric="goals" publicMode />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Asistencias
                </Typography>
                <PlayerRankingTable tournamentId={id} metric="assists" publicMode />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Amonestaciones
                </Typography>
                <PlayerRankingTable tournamentId={id} metric="cards" publicMode />
              </Box>
            </Stack>
          )}
          </Box>
        </Box>
      </Container>

      <PublicTeamRosterDialog
        open={!!openTeamId}
        tournamentId={id}
        teamId={openTeamId}
        teams={teams}
        onClose={closeTeamRoster}
      />
    </>
  );
}

// ----------------------------------------------------------------------
// Public-only: clickable team-card grid (drills into roster Dialog)
// ----------------------------------------------------------------------

function PublicTeamsByGroup({ teams, groups, onTeamClick }) {
  if (!teams?.length) {
    return <EmptyContent title="Sin equipos" sx={{ py: 8 }} />;
  }

  const groupsList = groups || [];
  const groupedIds = new Set();
  const sections = groupsList.map((g) => {
    const inGroup = teams.filter((t) => t.group_id === g.id);
    inGroup.forEach((t) => groupedIds.add(t.id));
    return { key: g.id, name: g.name || 'Grupo', teams: inGroup };
  });
  const ungrouped = teams.filter((t) => !groupedIds.has(t.id));
  if (ungrouped.length > 0) {
    sections.push({
      key: '__ungrouped__',
      name: sections.length > 0 ? 'Sin grupo' : 'Equipos',
      teams: ungrouped,
    });
  }

  return (
    <Stack spacing={3}>
      {sections.map((section) => (
        <Box key={section.key}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                flexShrink: 0,
              }}
            />
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {section.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              {section.teams.length} equipo{section.teams.length !== 1 ? 's' : ''}
            </Typography>
          </Stack>
          <PublicTeamsGrid teams={section.teams} onTeamClick={onTeamClick} />
        </Box>
      ))}
    </Stack>
  );
}

function PublicTeamsGrid({ teams, onTeamClick }) {
  if (!teams?.length) {
    return <EmptyContent title="Sin equipos" sx={{ py: 8 }} />;
  }

  return (
    <Box
      display="grid"
      gap={1.5}
      gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' }}
    >
      {teams.map((team) => (
        <Card
          key={team.id}
          onClick={() => onTeamClick?.(team.id)}
          sx={{
            px: 2,
            py: 2,
            cursor: 'pointer',
            transition: 'all 0.15s',
            '&:hover': {
              borderColor: (t) => alpha(t.palette.primary.main, 0.32),
              transform: 'translateY(-1px)',
            },
            border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            {team.logo_url ? (
              <Avatar src={team.logo_url} variant="rounded" sx={{ width: 40, height: 40 }} />
            ) : (
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Iconify icon="mdi:shield-half-full" width={22} sx={{ color: 'text.disabled' }} />
              </Box>
            )}
            <Stack sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {team.name}
              </Typography>
              {team.short_name && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }} noWrap>
                  {team.short_name}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Box>
  );
}

// ----------------------------------------------------------------------

function PublicTeamRosterDialog({ open, tournamentId, teamId, teams, onClose }) {
  const team = teams?.find((t) => t.id === teamId);
  const { players, playersLoading } = useGetPublicPlayers(open ? tournamentId : null, teamId);

  const grouped = useMemo(() => {
    const buckets = { Goalkeeper: [], Defender: [], Midfielder: [], Forward: [] };
    (players || []).forEach((p) => {
      const pos = p.position || 'Other';
      if (!buckets[pos]) buckets[pos] = [];
      buckets[pos].push(p);
    });
    Object.values(buckets).forEach((b) =>
      b.sort((a, b2) => (a.number ?? 999) - (b2.number ?? 999))
    );
    return buckets;
  }, [players]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          {team?.logo_url ? (
            <Avatar src={team.logo_url} variant="rounded" sx={{ width: 36, height: 36 }} />
          ) : (
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.12),
              }}
            />
          )}
          <Stack>
            <Typography variant="h6">{team?.name || 'Equipo'}</Typography>
            {team?.short_name && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {team.short_name}
              </Typography>
            )}
          </Stack>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {playersLoading ? (
          <Stack spacing={1}>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={32} />
            ))}
          </Stack>
        ) : !players?.length ? (
          <EmptyContent title="Sin jugadores" sx={{ py: 4 }} />
        ) : (
          <Stack spacing={2}>
            {Object.entries(grouped).map(([pos, list]) =>
              list.length > 0 ? (
                <Box key={pos}>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    {POSITION_LABEL[pos] || pos}
                  </Typography>
                  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                    {list.map((p) => (
                      <Stack
                        key={p.id}
                        direction="row"
                        alignItems="center"
                        spacing={1.5}
                        sx={{ py: 0.5 }}
                      >
                        <Typography variant="body2" sx={{ minWidth: 32, color: 'text.disabled' }}>
                          {p.number != null ? `#${p.number}` : ''}
                        </Typography>
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {p.name}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              ) : null
            )}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
