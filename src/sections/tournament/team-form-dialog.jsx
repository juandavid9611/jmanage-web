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

import { createTeam, updateTeam } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const TeamSchema = zod.object({
  name: zod.string().min(1, 'El nombre es obligatorio'),
  short_name: zod.string().max(3, 'Máximo 3 caracteres').optional(),
  group_id: zod.string().optional(),
  seed: zod.coerce.number().int().min(1).optional(),
});

export function TeamFormDialog({ open, onClose, tournamentId, currentTeam, groups }) {
  const isEdit = !!currentTeam;

  const defaultValues = {
    name: '',
    short_name: '',
    group_id: '',
    seed: 1,
  };

  const methods = useForm({
    resolver: zodResolver(TeamSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  // Reset form when dialog opens with different team data
  useEffect(() => {
    if (open) {
      reset({
        name: currentTeam?.name || '',
        short_name: currentTeam?.short_name || '',
        group_id: currentTeam?.group_id || '',
        seed: currentTeam?.seed || 1,
      });
    }
  }, [open, currentTeam, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await updateTeam(tournamentId, currentTeam.id, data);
        toast.success('Equipo actualizado');
      } else {
        await createTeam(tournamentId, data);
        toast.success('Equipo creado');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Editar Equipo' : 'Agregar Equipo'}</DialogTitle>

        <DialogContent>
          <Field.Text name="name" label="Nombre" required sx={{ mt: 1, mb: 2 }} />
          <Field.Text name="short_name" label="Nombre Corto" placeholder="ABC" sx={{ mb: 2 }} />

          {groups?.length > 0 && (
            <Field.Select name="group_id" label="Grupo" sx={{ mb: 2 }}>
              <MenuItem value="">Sin grupo</MenuItem>
              {groups.map((g) => (
                <MenuItem key={g.id} value={g.id}>
                  {g.name}
                </MenuItem>
              ))}
            </Field.Select>
          )}

          <Field.Text name="seed" label="Seed" type="number" />
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
