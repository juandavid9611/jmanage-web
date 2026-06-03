import { m } from 'framer-motion';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import { alpha, useTheme } from '@mui/material/styles';

import { useGetMyTeamOwnerTeams } from 'src/actions/me';
import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTeams,
  deletePlayer,
  useGetMatches,
  useGetPlayers,
  useGetBracket,
  useGetTournament,
} from 'src/actions/tournament';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { varFade, MotionContainer } from 'src/components/animate';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { MatchList } from 'src/sections/tournament/match-row';
import { BracketView } from 'src/sections/tournament/bracket-view';
import { StatsOverview } from 'src/sections/tournament/stats-overview';
import { StandingsSidebar } from 'src/sections/tournament/standings-sidebar';
import { PlayerFormDialog } from 'src/sections/tournament/player-form-dialog';
import { MatchweekTimeline } from 'src/sections/tournament/matchweek-timeline';
import { PlayerRankingTable } from 'src/sections/tournament/player-ranking-table';
import { getPhases, TournamentBanner } from 'src/sections/tournament/tournament-banner';
import { TournamentConfigSummary } from 'src/sections/tournament/tournament-config-summary';

import { useAuthContext } from 'src/auth/hooks';

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
function TournamentView({ tournamentId, highlightTeamId, initialPhase = null, onBack }) {
  const [activePhase, setActivePhase] = useState(initialPhase);
  const [selectedMw, setSelectedMw] = useState(undefined);

  const { tournament, tournamentLoading } = useGetTournament(tournamentId);
  const { teams } = useGetTeams(tournamentId);
  const { matches: allMatches, matchesLoading } = useGetMatches(tournamentId);
  const { bracket, bracketLoading } = useGetBracket(tournamentId);

  const currentMw = tournament?.current_matchweek || 1;
  const totalMw =
    tournament?.rules?.total_matchweeks ||
    (allMatches.length > 0 ? Math.max(...allMatches.map((match) => match.matchweek || 0)) : 0);
  const activeMw = selectedMw === undefined ? currentMw : selectedMw;

  const currentMatches = useMemo(
    () => (activeMw === null ? allMatches : allMatches.filter((match) => match.matchweek === activeMw)),
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
      <TeamStrip
        tournament={tournament}
        teams={teams}
        highlightTeamId={highlightTeamId}
        onBack={onBack}
      />

      {/* Tournament banner with phase tabs (read-only — no edit controls) */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={(p) => setActivePhase(p)}
        publicMode
      />

      {/* Phase content */}
      <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.02), minHeight: 400 }}>
        {/* ── RESUMEN (configuracion) ── */}
        {currentPhase === 'configuracion' && (
          <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
            <StatsOverview tournamentId={tournamentId} tournament={tournament} />
            <TournamentConfigSummary tournament={tournament} />
          </Stack>
        )}

        {/* ── INSCRIPCIÓN: my team roster ── */}
        {currentPhase === 'inscripcion' && highlightTeamId && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <MyTeamRoster tournamentId={tournamentId} teamId={highlightTeamId} teams={teams} />
          </Box>
        )}

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

      </Box>
    </DashboardContent>
  );
}

// ----------------------------------------------------------------------

/**
 * Top strip showing the team owner's team info + tournament context.
 */
function TeamStrip({ tournament, teams, highlightTeamId, onBack }) {
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
        {onBack && (
          <Button
            size="small"
            color="inherit"
            onClick={onBack}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" width={18} />}
            sx={{ mr: 1, flexShrink: 0 }}
          >
            Mis torneos
          </Button>
        )}
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
          <Box
            sx={{
              width: '1px',
              height: 32,
              bgcolor: (t) => alpha(t.palette.grey[500], 0.2),
              alignSelf: 'stretch',
              display: { xs: 'none', sm: 'block' },
            }}
          />
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
 * Single player row with three-dot menu for edit / delete.
 */
function PlayerRow({ player, onEdit, onDelete }) {
  const popover = usePopover();

  return (
    <Stack
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
        {player.number != null ? `#${player.number}` : '—'}
      </Typography>
      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }}>
        {player.name}
      </Typography>
      {player.position && (
        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {player.position}
        </Typography>
      )}

      <IconButton size="small" onClick={popover.onOpen}>
        <Iconify icon="eva:more-vertical-fill" width={16} />
      </IconButton>

      <CustomPopover open={popover.open} anchorEl={popover.anchorEl} onClose={popover.onClose}>
        <MenuItem
          onClick={() => {
            popover.onClose();
            onEdit(player);
          }}
          sx={{ fontSize: 13 }}
        >
          <Iconify icon="solar:pen-bold" width={16} sx={{ mr: 1 }} />
          Editar
        </MenuItem>
        <MenuItem
          onClick={() => {
            popover.onClose();
            onDelete(player);
          }}
          sx={{ fontSize: 13, color: 'error.main' }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={16} sx={{ mr: 1 }} />
          Eliminar
        </MenuItem>
      </CustomPopover>
    </Stack>
  );
}

// ----------------------------------------------------------------------

/**
 * My team's player roster with CRUD affordances for team owners.
 */
function MyTeamRoster({ tournamentId, teamId, teams }) {
  const myTeam = teams?.find((t) => t.id === teamId);
  const { players, playersLoading } = useGetPlayers(tournamentId, teamId);

  const [addOpen, setAddOpen] = useState(false);
  const [editPlayer, setEditPlayer] = useState(null);
  const [deletePlayer_, setDeletePlayer_] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = useCallback((p) => setEditPlayer(p), []);
  const handleDelete = useCallback((p) => setDeletePlayer_(p), []);

  const handleConfirmDelete = useCallback(async () => {
    if (!deletePlayer_) return;
    setDeleting(true);
    try {
      await deletePlayer(tournamentId, deletePlayer_.id);
      toast.success('Jugador eliminado');
      setDeletePlayer_(null);
    } catch (err) {
      toast.error(err?.message || 'Error al eliminar jugador');
    } finally {
      setDeleting(false);
    }
  }, [tournamentId, deletePlayer_]);

  if (!myTeam) return null;

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Plantel — {myTeam.name}</Typography>
        <Button
          size="small"
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" width={16} />}
          onClick={() => setAddOpen(true)}
        >
          Agregar jugador
        </Button>
      </Stack>

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
            <PlayerRow key={p.id} player={p} onEdit={handleEdit} onDelete={handleDelete} />
          ))}
        </Box>
      )}

      {/* Add player dialog */}
      <PlayerFormDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        tournamentId={tournamentId}
        teamId={teamId}
      />

      {/* Edit player dialog */}
      <PlayerFormDialog
        open={!!editPlayer}
        onClose={() => setEditPlayer(null)}
        tournamentId={tournamentId}
        teamId={teamId}
        currentPlayer={editPlayer}
      />

      {/* Delete confirm dialog */}
      <ConfirmDialog
        open={!!deletePlayer_}
        onClose={() => setDeletePlayer_(null)}
        title="Eliminar jugador"
        content={`¿Estás seguro de que deseas eliminar a ${deletePlayer_?.name}? Esta acción no se puede deshacer.`}
        action={
          <LoadingButton
            variant="contained"
            color="error"
            loading={deleting}
            onClick={handleConfirmDelete}
          >
            Eliminar
          </LoadingButton>
        }
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

const STATUS_COLORS = {
  draft: 'default',
  active: 'success',
  in_progress: 'success',
  completed: 'info',
  archived: 'default',
};

const STATUS_LABELS = {
  draft: 'Borrador',
  active: 'En progreso',
  in_progress: 'En progreso',
  completed: 'Finalizado',
  archived: 'Archivado',
};

/**
 * Team owner welcome landing — animated hero + one card per managed team.
 */
function TeamOwnerWelcome({ teams, onEnter }) {
  const theme = useTheme();
  const { user } = useAuthContext();
  const firstName = user?.name?.split(' ')[0] || '';

  return (
    <DashboardContent>
      <Box component={MotionContainer}>
        <Stack spacing={5}>
          {/* Animated hero */}
          <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: { xs: 2, md: 4 } }}>
            <Box
              component={m.div}
              variants={varFade({ distance: 24 }).inDown}
              sx={{ position: 'relative', mb: 1 }}
            >
              <Box
                component={m.div}
                animate={{ rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                sx={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
                  color: 'warning.main',
                }}
              >
                <Iconify icon="mdi:soccer" width={36} />
              </Box>
            </Box>

            <Box
              component={m.div}
              variants={varFade({ distance: 24 }).inUp}
            >
              <Typography
                variant="overline"
                sx={{ color: 'text.disabled', display: 'block', mb: 0.5 }}
              >
                Bienvenido{firstName ? `, ${firstName}` : ''} 👋
              </Typography>
              <Box
                component="h1"
                sx={{
                  ...theme.typography.h3,
                  m: 0,
                  fontFamily: theme.typography.fontSecondaryFamily,
                  fontSize: { xs: 28, md: 40 },
                  lineHeight: 1.15,
                  mb: 1,
                }}
              >
                Tu torneo está cada vez{' '}
                <Box
                  component="span"
                  sx={{
                    background: `linear-gradient(120deg, ${theme.palette.warning.main}, ${theme.palette.error.main})`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  más cerca
                </Box>
              </Box>
              <Typography variant="h6" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                Vive la pasión del fútbol ⚽
              </Typography>
            </Box>
          </Stack>

          {/* Section heading */}
          <Box component={m.div} variants={varFade({ distance: 16 }).inUp}>
            <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
              {teams.length === 1 ? 'Tu equipo' : 'Tus equipos'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {teams.length === 1
                ? 'Este es el equipo que gestionas hoy.'
                : 'Estos son los equipos que gestionas hoy.'}
            </Typography>
          </Box>

          {/* Team cards */}
          <Box
            display="grid"
            gap={2.5}
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
          >
            {teams.map((entry) => (
              <Box
                key={entry.tournament_team_id}
                component={m.div}
                variants={varFade({ distance: 24 }).inUp}
              >
                <TeamCard entry={entry} onEnter={onEnter} />
              </Box>
            ))}
          </Box>
        </Stack>
      </Box>
    </DashboardContent>
  );
}

function TeamCard({ entry, onEnter }) {
  const { tournament } = useGetTournament(entry.tournament_id);
  const status = tournament?.status;
  const startDate = tournament?.start_date;

  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.15s',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.customShadows?.z16 || '0 12px 24px 0 rgba(0,0,0,0.16)',
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar
            variant="rounded"
            sx={{
              width: 48,
              height: 48,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <Iconify icon="mdi:shield-half-full" width={28} />
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
              {entry.team_name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 600 }}>
              Mi equipo
            </Typography>
          </Box>
        </Stack>

        <Stack spacing={1}>
          <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
            {entry.tournament_name}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
            {status && (
              <Label variant="soft" color={STATUS_COLORS[status] || 'default'}>
                {STATUS_LABELS[status] || status}
              </Label>
            )}
            {startDate && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Inicia {startDate}
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <CardActions sx={{ px: 2, pb: 2, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        <Button
          size="small"
          variant="contained"
          color="inherit"
          onClick={() => onEnter(entry, 'configuracion')}
          startIcon={<Iconify icon="solar:arrow-right-bold" width={16} />}
        >
          Entrar al torneo
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          onClick={() => onEnter(entry, 'inscripcion')}
          startIcon={<Iconify icon="solar:users-group-rounded-bold" width={16} />}
        >
          Gestionar plantel
        </Button>
      </CardActions>
    </Card>
  );
}

// ----------------------------------------------------------------------

/**
 * Root view: resolves the team owner's tournament(s) and renders the appropriate UI.
 */
export function TeamOwnerTournamentView() {
  const [selected, setSelected] = useState(null);
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

  if (selected) {
    return (
      <TournamentView
        tournamentId={selected.entry.tournament_id}
        highlightTeamId={selected.entry.tournament_team_id}
        initialPhase={selected.initialPhase}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <TeamOwnerWelcome
      teams={teams}
      onEnter={(entry, initialPhase) => setSelected({ entry, initialPhase })}
    />
  );
}
