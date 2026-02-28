import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createPlayer, updatePlayer } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const POSITION_OPTIONS = [
  { value: 'Goalkeeper', label: 'Portero' },
  { value: 'Defender', label: 'Defensa' },
  { value: 'Midfielder', label: 'Centrocampista' },
  { value: 'Forward', label: 'Delantero' },
];

export function PlayerFormDialog({ open, onClose, tournamentId, teamId, currentPlayer }) {
  const isEdit = !!currentPlayer;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: currentPlayer?.name || '',
    number: currentPlayer?.number || '',
    position: currentPlayer?.position || '',
    user_id: currentPlayer?.user_id || '',
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEnter = useCallback(() => {
    setFormData({
      name: currentPlayer?.name || '',
      number: currentPlayer?.number || '',
      position: currentPlayer?.position || '',
      user_id: currentPlayer?.user_id || '',
    });
  }, [currentPlayer]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const payload = { ...formData, number: Number(formData.number) };

      if (isEdit) {
        await updatePlayer(tournamentId, currentPlayer.id, payload);
        toast.success('Jugador actualizado');
      } else {
        await createPlayer(tournamentId, teamId, payload);
        toast.success('Jugador creado');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isEdit, tournamentId, teamId, currentPlayer, formData, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>{isEdit ? 'Editar Jugador' : 'Agregar Jugador'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          <TextField
            fullWidth
            type="number"
            label="Número"
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value)}
          />
          <TextField
            fullWidth
            select
            label="Posición"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
          >
            {POSITION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <LoadingButton
          variant="contained"
          loading={isSubmitting}
          onClick={handleSubmit}
          disabled={!formData.name}
        >
          {isEdit ? 'Guardar' : 'Crear'}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
