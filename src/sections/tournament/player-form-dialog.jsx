import { z as zod } from 'zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createPlayer, updatePlayer } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const POSITION_OPTIONS = [
  { value: 'Goalkeeper', label: 'Portero' },
  { value: 'Defender', label: 'Defensa' },
  { value: 'Midfielder', label: 'Centrocampista' },
  { value: 'Forward', label: 'Delantero' },
];

const PlayerSchema = zod.object({
  name: zod.string().min(1, 'El nombre es obligatorio'),
  number: zod.coerce
    .number()
    .int('Debe ser un número entero')
    .min(1, 'Debe ser mayor a 0')
    .optional()
    .or(zod.literal('')),
  position: zod.string().optional(),
});

export function PlayerFormDialog({ open, onClose, tournamentId, teamId, currentPlayer }) {
  const isEdit = !!currentPlayer;

  const defaultValues = {
    name: '',
    number: '',
    position: '',
  };

  const methods = useForm({
    resolver: zodResolver(PlayerSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  useEffect(() => {
    if (open) {
      reset({
        name: currentPlayer?.name || '',
        number: currentPlayer?.number || '',
        position: currentPlayer?.position || '',
      });
    }
  }, [open, currentPlayer, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        number: data.number ? Number(data.number) : 0,
      };

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
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Editar Jugador' : 'Agregar Jugador'}</DialogTitle>

        <DialogContent>
          <Field.Text name="name" label="Nombre" required sx={{ mt: 1, mb: 2 }} />
          <Field.Text
            name="number"
            label="Número"
            type="number"
            helperText="Número de camiseta"
            sx={{ mb: 2 }}
          />
          <Field.Select name="position" label="Posición">
            <MenuItem value="">Sin posición</MenuItem>
            {POSITION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Field.Select>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? 'Guardar' : 'Crear'}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
