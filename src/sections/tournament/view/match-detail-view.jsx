import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
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

import { MatchEventTimeline } from '../match-event-timeline';

// ----------------------------------------------------------------------

const STATUS_ACTIONS = {
  scheduled: { next: 'live', label: 'Iniciar Partido', icon: 'mdi:play' },
  live: { next: 'finished', label: 'Finalizar', icon: 'mdi:whistle' },
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

  if (matchLoading) return <LoadingScreen />;
  if (!match) return <Typography>Partido no encontrado</Typography>;

  const homeTeam = teams.find((t) => t.id === match.home_team_id);
  const awayTeam = teams.find((t) => t.id === match.away_team_id);
  const events = match.events || [];
  const statusAction = STATUS_ACTIONS[match.status];

  const matchPlayers = players.filter(
    (p) => p.team_id === match.home_team_id || p.team_id === match.away_team_id
  );

  const handleStatusTransition = async () => {
    try {
      setIsSubmitting(true);
      const updateData = { status: statusAction.next };
      await updateMatch(tournamentId, matchId, updateData);
      toast.success(statusAction.next === 'finished' ? 'Partido finalizado — marcador calculado desde eventos' : 'Estado actualizado');
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      setIsSubmitting(true);
      await createMatchEvent(matchId, {
        ...eventForm,
        minute: Number(eventForm.minute),
      });
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
      navigate(paths.dashboard.tournament.matches(tournamentId));
    } catch (error) {
      toast.error('Error al eliminar');
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

  // Compute live score from events
  const goalTypes = new Set(['goal', 'penalty_scored']);
  let liveScoreHome = 0;
  let liveScoreAway = 0;
  events.forEach((ev) => {
    if (goalTypes.has(ev.type)) {
      if (ev.team_id === match.home_team_id) liveScoreHome += 1;
      if (ev.team_id === match.away_team_id) liveScoreAway += 1;
    } else if (ev.type === 'own_goal') {
      if (ev.team_id === match.home_team_id) liveScoreAway += 1;
      if (ev.team_id === match.away_team_id) liveScoreHome += 1;
    }
  });

  const scoreHome = match.status === 'live'
    ? liveScoreHome
    : match.score_home === -1 ? '-' : match.score_home;
  const scoreAway = match.status === 'live'
    ? liveScoreAway
    : match.score_away === -1 ? '-' : match.score_away;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Detalle Partido"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: tournament?.name || '', href: paths.dashboard.tournament.details(tournamentId) },
          { name: 'Partidos', href: paths.dashboard.tournament.matches(tournamentId) },
          { name: `${homeTeam?.short_name || '?'} vs ${awayTeam?.short_name || '?'}` },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Score card */}
      <Card sx={{ p: 4, mb: 3 }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={4}>
          <Stack alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
            <Typography variant="h5">{homeTeam?.name || 'Local'}</Typography>
            <Chip label={homeTeam?.short_name} size="small" />
          </Stack>

          <Stack alignItems="center" spacing={1}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="h2">{scoreHome}</Typography>
              <Typography variant="h4" color="text.secondary">
                -
              </Typography>
              <Typography variant="h2">{scoreAway}</Typography>
            </Stack>
            <Chip
              label={match.status === 'live' ? 'En Vivo' : match.status === 'finished' ? 'Finalizado' : 'Programado'}
              color={match.status === 'live' ? 'error' : match.status === 'finished' ? 'success' : 'default'}
            />
          </Stack>

          <Stack alignItems="center" spacing={1} sx={{ minWidth: 120 }}>
            <Typography variant="h5">{awayTeam?.name || 'Visitante'}</Typography>
            <Chip label={awayTeam?.short_name} size="small" />
          </Stack>
        </Stack>
      </Card>

      {/* Actions */}
      <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
        {statusAction && (
          <LoadingButton
            variant="contained"
            startIcon={<Iconify icon={statusAction.icon} />}
            loading={isSubmitting}
            onClick={handleStatusTransition}
          >
            {statusAction.label}
          </LoadingButton>
        )}
        {match.status === 'live' && (
          <Button
            variant="outlined"
            startIcon={<Iconify icon="mdi:plus" />}
            onClick={() => setEventDialog(true)}
          >
            Evento
          </Button>
        )}
        <Button
          variant="soft"
          color="error"
          startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
          onClick={handleDelete}
        >
          Eliminar
        </Button>

        {match.status === 'finished' && match.round && (
            <Button
              variant="contained"
              color="success"
              startIcon={<Iconify icon="mdi:trophy" />}
              onClick={async () => {
                try {
                  const winnerId = (match.score_home > match.score_away) ? match.home_team_id : match.away_team_id;
                  await advanceWinner(tournamentId, matchId, winnerId);
                  toast.success('Ganador avanzado al siguiente round');
                  navigate(paths.dashboard.tournament.details(tournamentId));
                } catch (error) {
                  toast.error(error.message || 'Error al avanzar ganador');
                }
              }}
            >
              Avanzar Ganador ({(match.score_home > match.score_away) ? homeTeam?.short_name : awayTeam?.short_name})
            </Button>
        )}
      </Stack>

      {/* Events timeline */}
      <Card sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Eventos
        </Typography>
        <MatchEventTimeline
          events={events}
          players={players}
          teams={teams}
          editable={match.status === 'live'}
          onDeleteEvent={handleDeleteEvent}
        />
      </Card>

      {/* Add Event Dialog */}
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
