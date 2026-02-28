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

import { createTeam, updateTeam } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

export function TeamFormDialog({ open, onClose, tournamentId, currentTeam, groups }) {
  const isEdit = !!currentTeam;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: currentTeam?.name || '',
    short_name: currentTeam?.short_name || '',
    group_id: currentTeam?.group_id || '',
    seed: currentTeam?.seed || 1,
    logo_url: currentTeam?.logo_url || '',
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Reset form when dialog opens with different data
  const handleEnter = useCallback(() => {
    setFormData({
      name: currentTeam?.name || '',
      short_name: currentTeam?.short_name || '',
      group_id: currentTeam?.group_id || '',
      seed: currentTeam?.seed || 1,
      logo_url: currentTeam?.logo_url || '',
    });
  }, [currentTeam]);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      if (isEdit) {
        await updateTeam(tournamentId, currentTeam.id, formData);
        toast.success('Equipo actualizado');
      } else {
        await createTeam(tournamentId, formData);
        toast.success('Equipo creado');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isEdit, tournamentId, currentTeam, formData, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>{isEdit ? 'Editar Equipo' : 'Agregar Equipo'}</DialogTitle>
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
            label="Nombre Corto"
            value={formData.short_name}
            onChange={(e) => handleChange('short_name', e.target.value)}
            placeholder="ABC"
          />
          {groups?.length > 0 && (
            <TextField
              fullWidth
              select
              label="Grupo"
              value={formData.group_id}
              onChange={(e) => handleChange('group_id', e.target.value)}
            >
              <MenuItem value="">Sin grupo</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            fullWidth
            type="number"
            label="Seed"
            value={formData.seed}
            onChange={(e) => handleChange('seed', Number(e.target.value))}
          />
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
