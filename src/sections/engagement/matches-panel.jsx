import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import Collapse from '@mui/material/Collapse';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';

import {
  saveEngagementLineup,
  createEngagementMatch,
  deleteEngagementMatch,
  useGetEngagementLineup,
} from 'src/actions/engagement';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

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

export function MatchesPanel({ tournamentId, roster, matches }) {
  const [newMatchDialog, setNewMatchDialog] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const handleDelete = async (matchId) => {
    try {
      await deleteEngagementMatch(matchId);
      toast.success('Partido eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setNewMatchDialog(true)}
          disabled={roster.length === 0}
        >
          Nuevo Partido
        </Button>
      </Box>

      {roster.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
          Armá primero la plantilla para poder cargar convocatorias.
        </Typography>
      ) : matches.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
          Sin partidos — hacé clic en &quot;Nuevo Partido&quot;
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Rival</TableCell>
              <TableCell align="center">Convocatoria</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map((m) => (
              <MatchRow
                key={m.id}
                match={m}
                roster={roster}
                expanded={expandedId === m.id}
                onToggle={() => setExpandedId((prev) => (prev === m.id ? null : m.id))}
                onDelete={() => handleDelete(m.id)}
              />
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      )}

      <NewMatchDialog
        open={newMatchDialog}
        onClose={() => setNewMatchDialog(false)}
        tournamentId={tournamentId}
      />
    </Box>
  );
}

function MatchRow({ match, roster, expanded, onToggle, onDelete }) {
  const { lineup } = useGetEngagementLineup(match.id);
  const registrado = !!lineup;

  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer' }} onClick={onToggle}>
        <TableCell>{fmtFecha(match.date)}</TableCell>
        <TableCell>{match.rival}</TableCell>
        <TableCell align="center">
          <Chip
            label={registrado ? 'Registrada' : 'Pendiente'}
            size="small"
            color={registrado ? 'success' : 'default'}
            variant="soft"
          />
        </TableCell>
        <TableCell onClick={(e) => e.stopPropagation()}>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Iconify icon="solar:trash-bin-trash-bold" width={16} />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, border: expanded ? undefined : 'none' }}>
          <Collapse in={expanded}>
            <Box sx={{ p: 2, bgcolor: 'background.neutral' }}>
              <LineupForm matchId={match.id} roster={roster} savedLineup={lineup} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function LineupForm({ matchId, roster, savedLineup }) {
  const [rows, setRows] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const next = {};
    roster.forEach((p) => {
      const saved = savedLineup?.entries?.find((e) => e.roster_entry_id === p.id);
      next[p.id] = saved || { roster_entry_id: p.id, called_up: false, status: '', minutes: 0 };
    });
    setRows(next);
  }, [roster, savedLineup]);

  const updateRow = (playerId, patch) => {
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
      await saveEngagementLineup(matchId, values);
      toast.success('Convocatoria guardada');
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <TableContainer sx={{ overflowX: 'auto' }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Jugador</TableCell>
            <TableCell align="center">Convocado</TableCell>
            <TableCell align="center">Estado</TableCell>
            <TableCell align="center">Minutos</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roster.map((p) => {
            const row = rows[p.id] || { called_up: false, status: '', minutes: 0 };
            return (
              <TableRow key={p.id}>
                <TableCell>
                  {p.number ? `#${p.number} ` : ''}
                  {p.name}
                </TableCell>
                <TableCell align="center">
                  <Switch
                    size="small"
                    checked={!!row.called_up}
                    onChange={(e) =>
                      updateRow(p.id, {
                        called_up: e.target.checked,
                        ...(!e.target.checked && { status: '', minutes: 0 }),
                      })
                    }
                  />
                </TableCell>
                <TableCell align="center">
                  <TextField
                    select
                    size="small"
                    value={row.status || ''}
                    disabled={!row.called_up}
                    onChange={(e) => updateRow(p.id, { status: e.target.value })}
                    sx={{ width: 130 }}
                  >
                    <MenuItem value="">—</MenuItem>
                    {POSITION_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell align="center">
                  <TextField
                    type="number"
                    size="small"
                    value={row.minutes ?? ''}
                    disabled={!row.called_up}
                    onChange={(e) =>
                      updateRow(p.id, { minutes: e.target.value === '' ? '' : Number(e.target.value) })
                    }
                    onBlur={(e) => {
                      if (e.target.value === '') updateRow(p.id, { minutes: 0 });
                    }}
                    sx={{ width: 80 }}
                    inputProps={{ min: 0, max: 120 }}
                  />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      </TableContainer>
      <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
        <LoadingButton variant="contained" size="small" loading={isSubmitting} onClick={handleSave}>
          Guardar convocatoria
        </LoadingButton>
      </Stack>
    </Box>
  );
}

function NewMatchDialog({ open, onClose, tournamentId }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [rival, setRival] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setDate(new Date().toISOString().split('T')[0]);
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
      await createEngagementMatch({ tournament_id: tournamentId, date, rival: rival.trim() });
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
          <TextField
            type="date"
            label="Fecha"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
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
        <Button onClick={handleClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSave}>
          Crear
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
