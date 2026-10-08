import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import {
  addToEngagementRoster,
  bulkAddToEngagementRoster,
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
export function RosterPanel({ tournamentId, users, roster, workspaceId }) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const availableUsers = users.filter((u) => !roster.some((r) => r.user_id === u.id));

  const handleDelete = async (entryId) => {
    try {
      await removeFromEngagementRoster(tournamentId, entryId, workspaceId);
      toast.success('Jugador quitado de la plantilla');
    } catch (error) {
      toast.error(error.message || 'Error al quitar');
    }
  };

  const handleNumberBlur = async (entryId, value) => {
    try {
      // `!== ''` (not truthiness) so jersey number 0 is kept
      await updateEngagementRosterEntry(
        tournamentId,
        entryId,
        { number: value !== '' ? Number(value) : null },
        workspaceId
      );
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  const handlePositionChange = async (entryId, value) => {
    try {
      await updateEngagementRosterEntry(tournamentId, entryId, { position: value || '' }, workspaceId);
    } catch (error) {
      toast.error(error.message || 'Error al actualizar');
    }
  };

  return (
    <Box>
      {roster.length > 0 && (
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
            {roster.length} jugador{roster.length === 1 ? '' : 'es'} en la plantilla
          </Typography>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setDialogOpen(true)}
          >
            Agregar Jugadores
          </Button>
        </Stack>
      )}

      {roster.length === 0 ? (
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
          <Iconify icon="solar:users-group-rounded-bold" width={40} sx={{ color: 'text.disabled' }} />
          <Typography variant="subtitle1">Todavía no hay jugadores</Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 360 }}>
            Sumá a los jugadores de este torneo para después cargar partidos y convocatorias.
          </Typography>
          <Button
            variant="contained"
            sx={{ mt: 1 }}
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={() => setDialogOpen(true)}
          >
            Agregar Jugadores
          </Button>
        </Stack>
      ) : (
        <Stack divider={<Divider flexItem sx={{ borderStyle: 'dashed' }} />}>
          {roster.map((r) => (
            <Stack
              key={r.id}
              direction={{ xs: 'column', sm: 'row' }}
              alignItems={{ xs: 'stretch', sm: 'center' }}
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{ py: 1.5 }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} sx={{ flex: 1, minWidth: 0 }}>
                <Avatar src={r.avatarUrl} sx={{ width: 32, height: 32, fontSize: 14 }}>
                  {r.name?.[0]}
                </Avatar>
                <Typography variant="body2" noWrap sx={{ minWidth: 0, flexShrink: 1 }}>
                  {r.name}
                </Typography>
                {r.isGuest && (
                  <Chip label="Sin cuenta" size="small" variant="soft" color="warning" sx={{ flexShrink: 0 }} />
                )}
                <Box sx={{ flexGrow: 1, display: { xs: 'block', sm: 'none' } }} />
                <IconButton
                  size="small"
                  aria-label="Quitar de la plantilla"
                  onClick={() => handleDelete(r.id)}
                  sx={{ display: { xs: 'inline-flex', sm: 'none' }, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={1.5}>
                <TextField
                  type="number"
                  size="small"
                  label="Número"
                  // re-mount when the server value changes so defaultValue stays fresh
                  key={`${r.id}-${r.number ?? ''}`}
                  defaultValue={r.number ?? ''}
                  onBlur={(e) => handleNumberBlur(r.id, e.target.value)}
                  inputProps={{ min: 0, max: 999 }}
                  sx={{ width: 84, flexShrink: 0 }}
                />
                <TextField
                  select
                  size="small"
                  label="Posición"
                  value={r.position || ''}
                  onChange={(e) => handlePositionChange(r.id, e.target.value)}
                  sx={{ flex: { xs: 1, sm: 'none' }, width: { sm: 170 } }}
                >
                  <MenuItem value="">Sin posición</MenuItem>
                  {POSITION_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  size="small"
                  aria-label="Quitar de la plantilla"
                  onClick={() => handleDelete(r.id)}
                  sx={{ display: { xs: 'none', sm: 'inline-flex' }, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                </IconButton>
              </Stack>
            </Stack>
          ))}
        </Stack>
      )}

      <AddToRosterDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        tournamentId={tournamentId}
        availableUsers={availableUsers}
        workspaceId={workspaceId}
      />
    </Box>
  );
}

function AddToRosterDialog({ open, onClose, tournamentId, availableUsers, workspaceId }) {
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
        const { results } = await bulkAddToEngagementRoster(
          tournamentId,
          selectedUsers.map((u) => ({ user_id: u.id })),
          workspaceId
        );
        // The API answers per row; surface exactly which ones failed and why.
        const failed = results.filter((r) => !r.ok);
        const succeeded = results.length - failed.length;

        if (succeeded) {
          toast.success(
            `${succeeded} jugador${succeeded === 1 ? '' : 'es'} agregado${succeeded === 1 ? '' : 's'} — asigná el número y la posición desde la tabla`
          );
        }
        if (failed.length) {
          toast.error(
            `No se pudo agregar: ${failed
              .map((r) => `${selectedUsers[r.index]?.name || 'Usuario'}${r.error ? ` (${r.error})` : ''}`)
              .join(', ')}`
          );
          // keep the dialog open with only the failed users still selected
          setSelectedUsers(failed.map((r) => selectedUsers[r.index]).filter(Boolean));
          return;
        }
      } else {
        await addToEngagementRoster(
          tournamentId,
          {
            user_id: null,
            guest_name: guestName.trim(),
            number: number !== '' ? Number(number) : null,
            position: position || null,
          },
          workspaceId
        );
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
              <Stack spacing={2}>
                <TextField
                  type="number"
                  label="Número"
                  value={number}
                  onChange={(e) => setNumber(e.target.value)}
                />
                <TextField
                  select
                  label="Posición"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
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
        <Button variant="soft" onClick={handleClose}>
          Cancelar
        </Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSave}>
          Agregar
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
