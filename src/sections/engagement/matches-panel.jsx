import dayjs from 'dayjs';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';

import { useGetTour } from 'src/actions/tours';
import { useGetEvents } from 'src/actions/calendar';
import {
  saveEngagementLineup,
  createEngagementMatch,
  deleteEngagementMatch,
  setEngagementCalledUp,
} from 'src/actions/engagement';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// A player's real sign-up/withdrawal on the linked calendar event lives on
// a backend Tour (the same system that powers Entrenamientos attendance),
// so "Convocado" is driven live from the linked Tour. The rest of this module
// is API-backed (club tournaments, roster, matches, lineups).
// Polling this (rather than only refetching on focus) is what makes the
// "Convocado" column pick up a sign-up/withdrawal without anyone reloading.
const TOUR_POLL_MS = 12_000;

// ----------------------------------------------------------------------

const POSITION_OPTIONS = [
  { value: 'titular', label: 'Titular' },
  { value: 'suplente', label: 'Suplente' },
];

function fmtFecha(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function MatchesPanel({ tournamentId, roster, matches, workspaceId }) {
  const [newMatchDialog, setNewMatchDialog] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const { events } = useGetEvents({ id: workspaceId });

  const handleDelete = async (matchId) => {
    try {
      await deleteEngagementMatch(tournamentId, matchId, workspaceId);
      toast.success('Partido eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  const registradas = matches.filter((m) => !!m.lineup).length;

  return (
    <Box>
      {roster.length > 0 && matches.length > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {matches.length} partido{matches.length === 1 ? '' : 's'} · {registradas}{' '}
            {registradas === 1 ? 'registrado' : 'registrados'}
          </Typography>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setNewMatchDialog(true)}
          >
            Nuevo Partido
          </Button>
        </Stack>
      )}

      {roster.length === 0 ? (
        <EmptyState
          icon="solar:users-group-rounded-bold"
          title="Primero armá la plantilla"
          description="Necesitás jugadores en la plantilla para poder cargar convocatorias."
        />
      ) : matches.length === 0 ? (
        <EmptyState
          icon="solar:calendar-date-bold"
          title="Todavía no hay partidos"
          description="Creá un partido y cargá quiénes fueron convocados, su estado y minutos."
          action={
            <Button
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
              onClick={() => setNewMatchDialog(true)}
            >
              Nuevo Partido
            </Button>
          }
        />
      ) : (
        <Stack spacing={1.5}>
          {matches.map((m) => (
            <MatchRow
              key={m.id}
              match={m}
              roster={roster}
              expanded={expandedId === m.id}
              onToggle={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
              onDelete={() => handleDelete(m.id)}
              workspaceId={workspaceId}
              events={events}
            />
          ))}
        </Stack>
      )}

      <NewMatchDialog
        open={newMatchDialog}
        onClose={() => setNewMatchDialog(false)}
        tournamentId={tournamentId}
        workspaceId={workspaceId}
      />
    </Box>
  );
}

function MatchRow({ match, roster, expanded, onToggle, onDelete, workspaceId, events }) {
  const { lineup } = match;
  const registrado = !!lineup;

  // The calendar event this match is linked to (if any) carries a real,
  // backend-backed Tour — that's where "who's actually signed up" lives.
  // The link itself is server-side (match.calendar_event_id). A match whose
  // event has no Tour just keeps a fully coach-managed "Convocado".
  const linkedEvent = events?.find((e) => e.id === match.calendar_event_id);
  const { tour } = useGetTour(linkedEvent?.tourId, {
    refreshInterval: TOUR_POLL_MS,
    revalidateOnFocus: true,
  });

  return (
    <Box
      sx={{
        borderRadius: 1.5,
        overflow: 'hidden',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], expanded ? 0.32 : 0.16)}`,
      }}
    >
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        onClick={onToggle}
        sx={{ px: 2, py: 1.5, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {match.rival}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {fmtFecha(match.date)}
          </Typography>
        </Box>
        <Chip
          label={registrado ? 'Registrada' : 'Pendiente'}
          size="small"
          color={registrado ? 'success' : 'default'}
          variant="soft"
          sx={{ flexShrink: 0 }}
        />
        <IconButton
          size="small"
          aria-label="Eliminar partido"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}
        >
          <Iconify icon="solar:trash-bin-trash-bold" width={18} />
        </IconButton>
        <Iconify
          icon="eva:arrow-ios-downward-fill"
          width={18}
          sx={{
            flexShrink: 0,
            color: 'text.disabled',
            transition: (t) => t.transitions.create('transform'),
            transform: expanded ? 'rotate(180deg)' : 'none',
          }}
        />
      </Stack>
      <Collapse in={expanded}>
        <Box sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'background.neutral' }}>
          <LineupForm match={match} roster={roster} workspaceId={workspaceId} tour={tour} />
        </Box>
      </Collapse>
    </Box>
  );
}

function EmptyState({ icon, title, description, action }) {
  return (
    <Stack
      alignItems="center"
      spacing={1}
      sx={{
        py: 5,
        px: 2,
        textAlign: 'center',
        borderRadius: 1.5,
        border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.32)}`,
      }}
    >
      <Iconify icon={icon} width={40} sx={{ color: 'text.disabled' }} />
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
        {description}
      </Typography>
      {action && <Box sx={{ pt: 1 }}>{action}</Box>}
    </Stack>
  );
}

function LineupForm({ match, roster, workspaceId, tour }) {
  const { id: matchId, tournament_id: tournamentId, lineup: savedLineup } = match;
  const [rows, setRows] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Re-seed `rows` from the server every time `savedLineup` changes (e.g. a
  // player signs up for the linked calendar event from another tab) — but
  // only for players the coach hasn't touched *in this unsaved session*, so
  // a background revalidation can't clobber an edit that's still in
  // progress. `dirtyRef` tracks who's been locally edited since the last
  // load/save; it resets when the match changes or a save completes.
  const dirtyRef = useRef(new Set());
  const prevMatchIdRef = useRef(matchId);

  // Keep the persisted lineup's "called up" in sync with who's *really*
  // signed up on the linked calendar event's Tour (backend-backed, so this
  // is true regardless of which device the player or the coach are on).
  // Only touches players with a real account tied to a Tour booker — a
  // guest roster entry, or a real player who never touched the calendar
  // for this event, stays fully coach-managed via the toggle below.
  const syncingRef = useRef(false);
  useEffect(() => {
    if (!tour?.bookers || syncingRef.current) return;
    // One write for every player that changed: separate concurrent writes
    // would each replace the whole lineup and overwrite one another.
    const changes = [];
    roster.forEach((p) => {
      if (!p.user_id) return;
      const booker = tour.bookers[p.user_id];
      if (!booker) return; // never touched the calendar event: the coach's toggle is the source of truth
      const approved = booker.approved === true;
      const saved = savedLineup?.entries?.find((e) => e.roster_entry_id === p.id);
      if ((saved?.called_up ?? false) !== approved) {
        changes.push({ rosterEntryId: p.id, calledUp: approved });
      }
    });
    if (!changes.length) return;
    syncingRef.current = true;
    setEngagementCalledUp(match, changes, workspaceId)
      .catch((error) => console.error(error))
      .finally(() => {
        syncingRef.current = false;
      });
  }, [tour, roster, savedLineup, match, workspaceId]);

  useEffect(() => {
    if (prevMatchIdRef.current !== matchId) {
      dirtyRef.current = new Set();
      prevMatchIdRef.current = matchId;
    }
  }, [matchId]);

  useEffect(() => {
    setRows((prev) => {
      const next = {};
      roster.forEach((p) => {
        if (dirtyRef.current.has(p.id) && prev[p.id]) {
          next[p.id] = prev[p.id];
          return;
        }
        const saved = savedLineup?.entries?.find((e) => e.roster_entry_id === p.id);
        next[p.id] = saved || { roster_entry_id: p.id, called_up: false, status: '', minutes: 0 };
      });
      return next;
    });
  }, [roster, savedLineup, matchId]);

  const updateRow = (playerId, patch) => {
    dirtyRef.current.add(playerId);
    setRows((prev) => ({ ...prev, [playerId]: { ...prev[playerId], ...patch } }));
  };

  const handleSave = async () => {
    const values = Object.values(rows);
    if (values.some((r) => r.called_up && !r.status)) {
      toast.error('Todo jugador convocado necesita Estado (Titular/Suplente)');
      return;
    }
    try {
      setIsSubmitting(true);
      await saveEngagementLineup(tournamentId, matchId, values, workspaceId);
      dirtyRef.current = new Set();
      toast.success('Convocatoria guardada');
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={1}>
        {roster.map((p) => {
          const row = rows[p.id] || { called_up: false, status: '', minutes: 0 };
          const calledUp = !!row.called_up;
          return (
            <Stack
              key={p.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 1, sm: 2 }}
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'background.paper',
                border: (t) =>
                  `1px solid ${calledUp ? alpha(t.palette.primary.main, 0.32) : alpha(t.palette.grey[500], 0.16)}`,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap sx={{ flex: 1, minWidth: 0 }}>
                  {p.number != null && (
                    <Box component="span" sx={{ color: 'text.secondary', mr: 0.75 }}>
                      #{p.number}
                    </Box>
                  )}
                  {p.name}
                </Typography>
                <FormControlLabel
                  label="Convocado"
                  labelPlacement="start"
                  sx={{ mr: 0, ml: 0, flexShrink: 0, '& .MuiFormControlLabel-label': { typography: 'caption', color: 'text.secondary' } }}
                  control={
                    <Switch
                      size="small"
                      checked={calledUp}
                      onChange={(e) =>
                        updateRow(p.id, {
                          called_up: e.target.checked,
                          ...(!e.target.checked && { status: '', minutes: 0 }),
                        })
                      }
                    />
                  }
                />
              </Stack>
              <Stack direction="row" spacing={1} sx={{ opacity: calledUp ? 1 : 0.48 }}>
                <TextField
                  select
                  size="small"
                  label="Estado"
                  value={row.status || ''}
                  disabled={!calledUp}
                  onChange={(e) => updateRow(p.id, { status: e.target.value })}
                  sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 140 } }}
                >
                  <MenuItem value="">—</MenuItem>
                  {POSITION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  type="number"
                  size="small"
                  label="Minutos"
                  value={row.minutes ?? ''}
                  disabled={!calledUp}
                  onChange={(e) =>
                    updateRow(p.id, { minutes: e.target.value === '' ? '' : Number(e.target.value) })
                  }
                  onBlur={(e) => {
                    if (e.target.value === '') updateRow(p.id, { minutes: 0 });
                  }}
                  sx={{ width: 96, flexShrink: 0 }}
                  inputProps={{ min: 0, max: 300 }}
                />
              </Stack>
            </Stack>
          );
        })}
      </Stack>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <LoadingButton variant="contained" size="small" loading={isSubmitting} onClick={handleSave}>
          Guardar convocatoria
        </LoadingButton>
      </Stack>
    </Box>
  );
}

function NewMatchDialog({ open, onClose, tournamentId, workspaceId }) {
  const [date, setDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [rival, setRival] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setDate(dayjs().format('YYYY-MM-DD'));
    setRival('');
    onClose();
  };

  const handleSave = async () => {
    if (!rival.trim()) {
      toast.error('Escribí el rival');
      return;
    }
    try {
      setIsSubmitting(true);
      await createEngagementMatch({ tournament_id: tournamentId, date, rival: rival.trim() }, workspaceId);
      toast.success('Partido creado');
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Error al crear');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nuevo Partido</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <MobileDatePicker
            label="Fecha"
            value={dayjs(date)}
            onChange={(value) => value && value.isValid() && setDate(value.format('YYYY-MM-DD'))}
          />
          <TextField
            label="Rival"
            placeholder="Ej. Criollos FC"
            value={rival}
            onChange={(e) => setRival(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="soft" onClick={handleClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSave}>
          Crear
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
