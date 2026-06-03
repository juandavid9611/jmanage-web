import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Skeleton from '@mui/material/Skeleton';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';

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

function getFirstName(user) {
  const raw = user?.name?.trim();
  if (raw) return raw.split(' ')[0];
  const email = user?.email;
  if (email) {
    const local = email.split('@')[0]?.split('+')[0] || '';
    if (local) return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return '';
}

/**
 * Team owner welcome landing — greeting + one rich card per managed team.
 */
function TeamOwnerWelcome({ teams, onEnter }) {
  const { user } = useAuthContext();
  const firstName = getFirstName(user);

  return (
    <DashboardContent>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h4" sx={{ mb: 0.5 }}>
            Bienvenido{firstName ? `, ${firstName}` : ''} 👋
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {teams.length === 1
              ? 'Este es el equipo que gestionas hoy.'
              : 'Estos son los equipos que gestionas hoy.'}
          </Typography>
        </Box>

        <Stack spacing={3}>
          {teams.map((entry) => (
            <RichTeamCard key={entry.tournament_team_id} entry={entry} onEnter={onEnter} />
          ))}
        </Stack>
      </Stack>
    </DashboardContent>
  );
}

function formatDate(date) {
  if (!date) return null;
  try {
    return new Date(date).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return String(date);
  }
}

function RichTeamCard({ entry, onEnter }) {
  const { tournament } = useGetTournament(entry.tournament_id);
  const { teams: tournamentTeams } = useGetTeams(entry.tournament_id);
  const { players } = useGetPlayers(entry.tournament_id, entry.tournament_team_id);

  const status = tournament?.status;
  const startDate = tournament?.start_date;
  const drawDate = tournament?.group_draw_date || tournament?.rules?.group_draw_date;
  const sport = tournament?.sport;
  const city = tournament?.city;

  const playerCount = players?.length ?? 0;
  const rosterDone = playerCount > 0;

  const otherTeams = (tournamentTeams || []).filter((t) => t.id !== entry.tournament_team_id);

  return (
    <Card>
      {/* Header */}
      <CardContent sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="flex-start" spacing={2}>
          <Avatar
            variant="rounded"
            sx={{
              width: 56,
              height: 56,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: 'primary.main',
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:shield-half-full" width={32} />
          </Avatar>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>
              {entry.team_name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }} noWrap>
              Tu equipo en <strong>{entry.tournament_name}</strong>
            </Typography>
          </Box>

          {status && (
            <Label variant="soft" color={STATUS_COLORS[status] || 'default'} sx={{ flexShrink: 0 }}>
              {STATUS_LABELS[status] || status}
            </Label>
          )}
        </Stack>

        {/* Stats row */}
        <Stack
          direction="row"
          spacing={3}
          flexWrap="wrap"
          useFlexGap
          sx={{ mt: 2.5, color: 'text.secondary' }}
        >
          {sport && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="mdi:soccer" width={16} />
              <Typography variant="body2">{sport}</Typography>
            </Stack>
          )}
          {city && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:map-point-bold" width={16} />
              <Typography variant="body2">{city}</Typography>
            </Stack>
          )}
          {startDate && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="solar:calendar-bold" width={16} />
              <Typography variant="body2">Inicia {formatDate(startDate)}</Typography>
            </Stack>
          )}
          {drawDate && (
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon="mdi:dice-multiple" width={16} />
              <Typography variant="body2">Sorteo {formatDate(drawDate)}</Typography>
            </Stack>
          )}
        </Stack>
      </CardContent>

      <Divider />

      {/* Próximos pasos */}
      <CardContent sx={{ pb: 2 }}>
        <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 1.5 }}>
          Próximos pasos
        </Typography>
        <Stack spacing={1.25}>
          <ChecklistItem done label="Aceptaste la invitación" />
          <ChecklistItem
            done={rosterDone}
            label="Confirma tu plantel"
            hint={
              rosterDone
                ? `${playerCount} jugador${playerCount === 1 ? '' : 'es'} registrado${playerCount === 1 ? '' : 's'}`
                : 'Aún no has registrado jugadores'
            }
            actionLabel="Registrar"
            onAction={() => onEnter(entry, 'inscripcion')}
          />
          <ChecklistItem
            done={false}
            label="Espera el sorteo de grupos"
            hint={drawDate ? formatDate(drawDate) : 'Pronto'}
          />
        </Stack>
      </CardContent>

      {otherTeams.length > 0 && (
        <>
          <Divider />
          <CardContent sx={{ pb: 2 }}>
            <Typography
              variant="overline"
              sx={{ color: 'text.disabled', display: 'block', mb: 1 }}
            >
              Equipos participantes ({otherTeams.length + 1})
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              <Chip
                size="small"
                label={entry.team_name}
                color="primary"
                variant="filled"
                sx={{ fontWeight: 600 }}
              />
              {otherTeams.map((t) => (
                <Chip key={t.id} size="small" label={t.name} variant="outlined" />
              ))}
            </Stack>
          </CardContent>
        </>
      )}

      <Divider />

      <CardActions sx={{ px: 3, py: 2, gap: 1, flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="inherit"
          onClick={() => onEnter(entry, 'configuracion')}
          startIcon={<Iconify icon="solar:arrow-right-bold" width={16} />}
        >
          Entrar al torneo
        </Button>
        <Button
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

function ChecklistItem({ done, label, hint, actionLabel, onAction }) {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5}>
      <Iconify
        icon={done ? 'solar:check-circle-bold' : 'solar:check-circle-line-duotone'}
        width={20}
        sx={{ color: done ? 'success.main' : 'text.disabled', flexShrink: 0 }}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500, color: done ? 'text.primary' : 'text.primary' }}>
          {label}
        </Typography>
        {hint && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {hint}
          </Typography>
        )}
      </Box>
      {!done && actionLabel && onAction && (
        <Button size="small" color="inherit" onClick={onAction} sx={{ flexShrink: 0 }}>
          {actionLabel}
        </Button>
      )}
    </Stack>
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
