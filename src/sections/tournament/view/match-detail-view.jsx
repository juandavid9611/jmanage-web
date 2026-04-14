import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetMatch,
  useGetTeams,
  updateMatch,
  deleteMatch,
  advanceWinner,
  useGetPlayers,
  useGetTournament,
  createMatchEvent,
  deleteMatchEvent,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { EventBadge, EVENT_CONFIG } from '../match-row';

// ----------------------------------------------------------------------

const STATUS_ACTIONS = {
  scheduled: { next: 'live', label: 'Iniciar Partido', icon: 'mdi:play' },
  live: { next: 'finished', label: 'Finalizar', icon: 'mdi:whistle' },
};

const STATUS_CHIP = {
  live: { label: 'En Vivo', color: 'error' },
  finished: { label: 'Finalizado', color: 'success' },
  scheduled: { label: 'Programado', color: 'default' },
};

const EVENT_TYPES = [
  { value: 'goal', label: 'Gol' },
  { value: 'own_goal', label: 'Autogol' },
  { value: 'yellow_card', label: 'Tarjeta Amarilla' },
  { value: 'red_card', label: 'Tarjeta Roja' },
  { value: 'substitution', label: 'Cambio' },
  { value: 'penalty_scored', label: 'Penal Anotado' },
  { value: 'penalty_missed', label: 'Penal Fallado' },
];

export function MatchDetailView() {
  const { id: tournamentId, matchId } = useParams();
  const navigate = useNavigate();

  const { tournament } = useGetTournament(tournamentId);
  const { match, matchLoading } = useGetMatch(tournamentId, matchId);
  const { teams } = useGetTeams(tournamentId);
  const { players } = useGetPlayers(tournamentId);

  const [eventDialog, setEventDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    minute: '',
    player_id: '',
    team_id: '',
    assist_player_id: '',
  });

  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (match) setNotes(match.notes || '');
  }, [match]);

  if (matchLoading) return <LoadingScreen />;
  if (!match) return <Typography>Partido no encontrado</Typography>;

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const homeName = homeTeam?.short_name || homeTeam?.name || 'TBD';
  const awayName = awayTeam?.short_name || awayTeam?.name || 'TBD';
  const events = match.events || [];
  const statusAction = STATUS_ACTIONS[match.status];
  const chipCfg = STATUS_CHIP[match.status] || STATUS_CHIP.scheduled;

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isPending = match.status === 'scheduled';

  const matchPlayers = players.filter(
    (p) => p.team_id === match.home_team_id || p.team_id === match.away_team_id
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const handleStatusTransition = async () => {
    try {
      setIsSubmitting(true);
      await updateMatch(tournamentId, matchId, { status: statusAction.next });
      toast.success(
        statusAction.next === 'finished'
          ? 'Partido finalizado — marcador calculado desde eventos'
          : 'Estado actualizado'
      );
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      setIsSubmitting(true);
      await createMatchEvent(matchId, { ...eventForm, minute: Number(eventForm.minute) });
      setEventDialog(false);
      setEventForm({ type: 'goal', minute: '', player_id: '', team_id: '', assist_player_id: '' });
      toast.success('Evento registrado');
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMatch(tournamentId, matchId);
      toast.success('Partido eliminado');
      navigate(paths.dashboard.tournament.details(tournamentId));
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSubmitting(true);
      await updateMatch(tournamentId, matchId, { notes });
      toast.success('Observaciones guardadas exitosamente');
    } catch (error) {
      toast.error(error.message || 'Error al guardar observaciones');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteMatchEvent(matchId, eventId);
      toast.success('Evento eliminado');
    } catch (error) {
      toast.error('Error al eliminar evento');
    }
  };

  // ── Compute live score & mocked pending payments ─────────────────────────────────────────────
  const goalTypes = new Set(['goal', 'penalty_scored']);
  let liveScoreHome = 0;
  let liveScoreAway = 0;
  let yellowCardsCount = 0;
  let redCardsCount = 0;

  events.forEach((ev) => {
    if (goalTypes.has(ev.type)) {
      if (ev.team_id === match.home_team_id) liveScoreHome += 1;
      if (ev.team_id === match.away_team_id) liveScoreAway += 1;
    } else if (ev.type === 'own_goal') {
      if (ev.team_id === match.home_team_id) liveScoreAway += 1;
      if (ev.team_id === match.away_team_id) liveScoreHome += 1;
    } else if (ev.type === 'yellow_card') {
      yellowCardsCount += 1;
    } else if (ev.type === 'red_card' || ev.type === 'second_yellow') {
      redCardsCount += 1;
    }
  });

  const pendingAmount = (yellowCardsCount * 15000) + (redCardsCount * 30000);

  const scoreHome = isLive ? liveScoreHome : match.score_home === -1 ? '-' : match.score_home;
  const scoreAway = isLive ? liveScoreAway : match.score_away === -1 ? '-' : match.score_away;

  // ── Sort events ─────────────────────────────────────────────────
  const sortedEvents = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      <CustomBreadcrumbs
        heading="Detalle Partido"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: tournament?.name || '', href: paths.dashboard.tournament.details(tournamentId) },
          { name: `${homeName} vs ${awayName}` },
        ]}
        sx={{ px: { xs: 2, md: 3.5 }, pt: { xs: 2, md: 2.75 }, pb: 0 }}
      />

      {/* ── Score Header ───────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          px: { xs: 2, md: 3.5 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          {/* Home */}
          <Stack alignItems="center" spacing={0.75}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, textAlign: 'center' }}>
              {homeTeam?.name || 'Local'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {homeName}
            </Typography>
          </Stack>

          {/* Score center */}
          <Stack alignItems="center" spacing={1} sx={{ px: 3 }}>
            <Stack direction="row" alignItems="baseline" spacing={1.5}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  ...(isLive && { color: 'error.main' }),
                }}
              >
                {scoreHome}
              </Typography>
              <Typography variant="h4" sx={{ color: 'text.disabled', lineHeight: 1 }}>
                ·
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  ...(isLive && { color: 'error.main' }),
                }}
              >
                {scoreAway}
              </Typography>
            </Stack>

            <Chip
              label={chipCfg.label}
              color={chipCfg.color}
              size="small"
              variant="soft"
              sx={{
                fontWeight: 600,
                ...(isLive && {
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
                }),
              }}
            />

            {/* Meta row */}
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
              {match.matchweek && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  Jornada {match.matchweek}
                </Typography>
              )}
              {match.round && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {match.round}
                </Typography>
              )}
              {match.venue && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  📍 {match.venue}
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Away */}
          <Stack alignItems="center" spacing={0.75}>
            <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: -0.5, textAlign: 'center' }}>
              {awayTeam?.name || 'Visitante'}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {awayName}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* ── Actions Toolbar ────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          px: { xs: 2, md: 3.5 },
          py: 1.25,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {statusAction && (
            <LoadingButton
              variant="contained"
              size="small"
              startIcon={<Iconify icon={statusAction.icon} width={16} />}
              loading={isSubmitting}
              onClick={handleStatusTransition}
            >
              {statusAction.label}
            </LoadingButton>
          )}
          {(isLive || isFinished) && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="mdi:plus" width={16} />}
              onClick={() => setEventDialog(true)}
            >
              Evento
            </Button>
          )}

          {isFinished && match.round && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<Iconify icon="mdi:trophy" width={16} />}
              onClick={async () => {
                try {
                  const winnerId =
                    match.score_home > match.score_away
                      ? match.home_team_id
                      : match.away_team_id;
                  await advanceWinner(tournamentId, matchId, winnerId);
                  toast.success('Ganador avanzado al siguiente round');
                  navigate(paths.dashboard.tournament.details(tournamentId));
                } catch (error) {
                  toast.error(error.message || 'Error al avanzar ganador');
                }
              }}
            >
              Avanzar Ganador (
              {match.score_home > match.score_away
                ? homeTeam?.short_name
                : awayTeam?.short_name}
              )
            </Button>
          )}

          <Box sx={{ flex: 1 }} />

          <Button
            variant="soft"
            color="error"
            size="small"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
            onClick={handleDelete}
          >
            Eliminar
          </Button>
        </Stack>
      </Box>

      {/* ── Events Timeline (two-column) ───────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          px: { xs: 2, md: 3.5 },
          py: 3,
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.65rem', mb: 2, display: 'block' }}
        >
          Cronología del partido
        </Typography>

        {sortedEvents.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 4 }}
          >
            Sin eventos registrados
          </Typography>
        ) : (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            {/* Column headers */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 52px 1fr',
                mb: 1.5,
                pb: 1,
                borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600 }}
              >
                {homeName}
              </Typography>
              <Box />
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600, textAlign: 'right' }}
              >
                {awayName}
              </Typography>
            </Box>

            {/* Event rows */}
            <Stack spacing={0}>
              {sortedEvents.map((event) => {
                const isHome = event.team_id === match.home_team_id;
                const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.goal;
                const player = players?.find((p) => p.id === event.player_id);
                const assist = event.assist_player_id
                  ? players?.find((p) => p.id === event.assist_player_id)
                  : null;

                const editable = isLive || isFinished;

                const eventContent = (
                  <Stack
                    direction={isHome ? 'row' : 'row-reverse'}
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <EventBadge
                        cfg={cfg}
                        player={player}
                        assist={assist}
                        align={isHome ? 'left' : 'right'}
                      />
                    </Box>
                    {editable && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEvent(event.id)}
                        sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                      </IconButton>
                    )}
                  </Stack>
                );

                return (
                  <Box
                    key={event.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 52px 1fr',
                      alignItems: 'center',
                      py: 0.75,
                      borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.04)}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>{isHome && eventContent}</Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.disabled' }}
                      >
                        {event.minute}
                        {event.stoppage_time ? `+${event.stoppage_time}` : ''}&#39;
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {!isHome && eventContent}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      {/* ── Observaciones (Comments & Mocked Payments) ────────────────────── */}
      <Box sx={{ px: { xs: 2, md: 3.5 }, py: 4, bgcolor: (t) => alpha(t.palette.grey[500], 0.02) }}>
        <Typography variant="overline" sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.65rem', mb: 2, display: 'block' }}>
          Observaciones del Oficial de Partido
        </Typography>

        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          {pendingAmount > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Existen cobros pendientes por emitir: <strong>{yellowCardsCount} amarillas</strong> y <strong>{redCardsCount} rojas/doble amarilla</strong>, total de <strong>${pendingAmount.toLocaleString()}</strong> pendientes de cobro y pago.
            </Alert>
          )}

          <TextField
             fullWidth
             multiline
             rows={4}
             placeholder="Agregar observaciones, incidentes o notas adicionales del partido..."
             value={notes}
             onChange={(e) => setNotes(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <LoadingButton 
               variant="contained" 
               size="small" 
               loading={isSubmitting} 
               onClick={handleSaveNotes}
               disabled={notes === (match.notes || '')}
            >
               Guardar Observaciones
            </LoadingButton>
          </Box>
        </Box>
      </Box>

      {/* ── Add Event Dialog ───────────────────────────────────────── */}
      <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Registrar Evento</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label="Tipo"
              value={eventForm.type}
              onChange={(e) => setEventForm((f) => ({ ...f, type: e.target.value }))}
            >
              {EVENT_TYPES.map((t) => (
                <MenuItem key={t.value} value={t.value}>
                  {t.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Minuto"
              value={eventForm.minute}
              onChange={(e) => setEventForm((f) => ({ ...f, minute: e.target.value }))}
            />
            <TextField
              select
              fullWidth
              label="Equipo"
              value={eventForm.team_id}
              onChange={(e) => setEventForm((f) => ({ ...f, team_id: e.target.value }))}
            >
              {[homeTeam, awayTeam].filter(Boolean).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Jugador"
              value={eventForm.player_id}
              onChange={(e) => setEventForm((f) => ({ ...f, player_id: e.target.value }))}
            >
              {matchPlayers
                .filter((p) => !eventForm.team_id || p.team_id === eventForm.team_id)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </MenuItem>
                ))}
            </TextField>
            {['goal', 'penalty_scored'].includes(eventForm.type) && (
              <TextField
                select
                fullWidth
                label="Asistencia (opcional)"
                value={eventForm.assist_player_id}
                onChange={(e) => setEventForm((f) => ({ ...f, assist_player_id: e.target.value }))}
              >
                <MenuItem value="">Sin asistencia</MenuItem>
                {matchPlayers
                  .filter((p) => !eventForm.team_id || p.team_id === eventForm.team_id)
                  .filter((p) => p.id !== eventForm.player_id)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      #{p.number} {p.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialog(false)}>Cancelar</Button>
          <LoadingButton variant="contained" loading={isSubmitting} onClick={handleAddEvent}>
            Registrar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
