import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
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
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TableContainer from '@mui/material/TableContainer';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  addToEngagementRoster,
  removeFromEngagementRoster,
  updateEngagementRosterEntry,
} from 'src/actions/engagement';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const POSITION_OPTIONS = [
  { value: 'Goalkeeper', label: 'Portero' },
  { value: 'Defender', label: 'Defensa' },
  { value: 'Midfielder', label: 'Centrocampista' },
  { value: 'Forward', label: 'Delantero' },
];
const POSITION_LABELS = Object.fromEntries(POSITION_OPTIONS.map((p) => [p.value, p.label]));

// users: real workspace Usuarios (from useGetUsers) — the reusable identity.
// roster: this tournament's joined roster rows (from useGetEngagementRoster).
export function RosterPanel({ tournamentId, users, roster }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const availableUsers = users.filter((u) => !roster.some((r) => r.user_id === u.id));

  const handleDelete = async (entryId) => {
    try {
      await removeFromEngagementRoster(entryId);
      toast.success('Jugador quitado de la plantilla');
    } catch (error) {
      toast.error(error.message || 'Error al quitar');
    }
  };

  const handleNumberBlur = async (entryId, value) => {
    try {
      await updateEngagementRosterEntry(entryId, { number: value ? Number(value) : null });
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const handlePositionChange = async (entryId, value) => {
    try {
      await updateEngagementRosterEntry(entryId, { position: value || null });
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
        <Button
          size="small"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setDialogOpen(true)}
        >
          Agregar Jugadores
        </Button>
      </Box>

      {roster.length === 0 ? (
        <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
          Sin jugadores — hacé clic en &quot;Agregar Jugadores&quot;
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell width={72}>#</TableCell>
              <TableCell>Jugador</TableCell>
              <TableCell width={160}>Posición</TableCell>
              <TableCell width={48} />
            </TableRow>
          </TableHead>
          <TableBody>
            {roster.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  <TextField
                    type="number"
                    size="small"
                    variant="standard"
                    defaultValue={r.number ?? ''}
                    onBlur={(e) => handleNumberBlur(r.id, e.target.value)}
                    sx={{ width: 48 }}
                  />
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Avatar src={r.avatarUrl} sx={{ width: 28, height: 28, fontSize: 13 }}>
                      {r.name?.[0]}
                    </Avatar>
                    <Typography variant="body2">{r.name}</Typography>
                    {r.isGuest && (
                      <Chip label="Sin cuenta" size="small" variant="soft" color="warning" sx={{ height: 18, fontSize: 10 }} />
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <TextField
                    select
                    size="small"
                    variant="standard"
                    value={r.position || ''}
                    onChange={(e) => handlePositionChange(r.id, e.target.value)}
                    sx={{ width: 140 }}
                  >
                    <MenuItem value="">—</MenuItem>
                    {POSITION_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </TableCell>
                <TableCell>
                  <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={16} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </TableContainer>
      )}

      <AddToRosterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tournamentId={tournamentId}
        availableUsers={availableUsers}
      />
    </Box>
  );
}

function AddToRosterDialog({ open, onClose, tournamentId, availableUsers }) {
  const [mode, setMode] = useState('user'); // 'user' | 'guest'
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [guestName, setGuestName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reset = () => {
    setMode('user');
    setSelectedUsers([]);
    setGuestName('');
    setNumber('');
    setPosition('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSave = async () => {
    if (mode === 'user' && selectedUsers.length === 0) {
      toast.error('Seleccioná al menos un usuario');
      return;
    }
    if (mode === 'guest' && !guestName.trim()) {
      toast.error('Escribí el nombre del jugador');
      return;
    }
    try {
      setIsSubmitting(true);
      if (mode === 'user') {
        await Promise.all(
          selectedUsers.map((u) =>
            addToEngagementRoster({
              tournament_id: tournamentId,
              user_id: u.id,
              guest_name: null,
              number: null,
              position: null,
            })
          )
        );
        toast.success(
          `${selectedUsers.length} jugador${selectedUsers.length === 1 ? '' : 'es'} agregado${selectedUsers.length === 1 ? '' : 's'} — asigná el número y la posición desde la tabla`
        );
      } else {
        await addToEngagementRoster({
          tournament_id: tournamentId,
          user_id: null,
          guest_name: guestName.trim(),
          number: number ? Number(number) : null,
          position: position || null,
        });
        toast.success('Jugador agregado a la plantilla');
      }
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Error al agregar');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Agregar Jugadores a la Plantilla</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <ToggleButtonGroup
            value={mode}
            exclusive
            size="small"
            onChange={(_, v) => v && setMode(v)}
            fullWidth
          >
            <ToggleButton value="user">Desde Usuarios</ToggleButton>
            <ToggleButton value="guest">Sin cuenta todavía</ToggleButton>
          </ToggleButtonGroup>

          {mode === 'user' ? (
            <Autocomplete
              multiple
              disableCloseOnSelect
              options={availableUsers}
              getOptionLabel={(u) => u.name || ''}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={selectedUsers}
              onChange={(_, v) => setSelectedUsers(v)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar usuarios"
                  placeholder="Elegí uno o varios"
                  helperText="Podés seleccionar varios de una vez — el número y la posición se asignan después, desde la tabla."
                />
              )}
              renderOption={(props, u) => (
                <li {...props} key={u.id}>
                  <Avatar src={u.avatarUrl} sx={{ width: 24, height: 24, fontSize: 11, mr: 1.5 }}>
                    {u.name?.[0]}
                  </Avatar>
                  {u.name}
                </li>
              )}
              renderTags={(value, getTagProps) =>
                value.map((u, index) => (
                  <Chip {...getTagProps({ index })} key={u.id} size="small" label={u.name} avatar={<Avatar src={u.avatarUrl}>{u.name?.[0]}</Avatar>} />
                ))
              }
              noOptionsText="No hay más usuarios disponibles en esta categoría"
            />
          ) : (
            <>
              <TextField
                fullWidth
                label="Nombre del jugador"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                helperText="Se podrá vincular a su cuenta más adelante cuando se registre"
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  type="number"
                  label="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                  sx={{ flex: 1 }}
                />
                <TextField
                  select
                  label="Posición"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  sx={{ flex: 1 }}
                >
                  <MenuItem value="">Sin posición</MenuItem>
                  {POSITION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSave}>
          Agregar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
