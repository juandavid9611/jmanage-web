import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { updateUserMetrics } from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

export const UserQuickEditSchema = zod.object({
  asistencia_entrenos: zod.number().min(1, { message: 'Asistencia a entrenos es requerido!' }),
  asistencia_partidos: zod.number().min(1, { message: 'Asistencia a partidos es requerido!' }),
  puntualidad_pagos: zod.number().min(1, { message: 'Puntualidad en pagos es requerido!' }),
  llegadas_tarde: zod.number().min(1, { message: 'Llegadas tarde es requerido!' }),
  deuda_acumulada: zod.number().min(1, { message: 'Deuda acumulada es requerido!' }),
  total: zod.number().min(1, { message: 'Total es requerido!' }),
  puntaje_asistencia: zod.number().max(3, { message: 'Puntaje asistencia es requerido!' }),
  puntaje_asistencia_description: zod.string(),
});

export function UserQuickEditForm({ currentUser, open, onClose }) {
  const { t } = useTranslation();

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      asistencia_entrenos: currentUser?.user_metrics?.asistencia_entrenos || 0,
      asistencia_partidos: currentUser?.user_metrics?.asistencia_partidos || 0,
      puntualidad_pagos: currentUser?.user_metrics?.puntualidad_pagos || 0,
      llegadas_tarde: currentUser?.user_metrics?.llegadas_tarde || 0,
      deuda_acumulada: currentUser?.user_metrics?.deuda_acumulada || 0,
      total: currentUser?.user_metrics?.total || 0,
      puntaje_asistencia: currentUser?.user_metrics?.puntaje_asistencia || 0,
      puntaje_asistencia_description:
        currentUser?.user_metrics?.puntaje_asistencia_description || '',
    }),
    [currentUser]
  );
  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(UserQuickEditSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    const promise = updateUserMetrics(currentUser.id, data);

    try {
      toast.promise(promise, {
        loading: 'Loading...',
        success: t('update_metrics_success'),
        error: 'Update error!',
      });

      await promise;
      onClose();
      reset(values);
    } catch (error) {
      console.error(error);
    }
  });
  // });
  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 720 } }}
    >
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Metrics Update</DialogTitle>
        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            <Typography>
              Update the metrics for <strong>{currentUser?.name}</strong> user of group{' '}
              <strong>{currentUser?.group}</strong>
            </Typography>
          </Alert>
          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
          >
            <Field.Text name="asistencia_entrenos" label="Asistencia entrenos" type="number" />
            <Field.Text name="asistencia_partidos" label="Asistencia partidos" type="number" />
            <Field.Text name="puntualidad_pagos" label="Puntualidad pagos" type="number" />
            <Field.Text name="llegadas_tarde" label="Llegadas tarde" type="number" />
            <Field.Text name="deuda_acumulada" label="Deuda acumulada" type="number" />
            <Field.Text name="total" label="Total" type="number" />
            <Field.Text name="puntaje_asistencia" label="Puntaje asistencia" type="number" />
            <Field.Text
              name="puntaje_asistencia_description"
              label="Descripción puntaje asistencia"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
