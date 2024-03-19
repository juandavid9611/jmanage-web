import * as Yup from 'yup';
import { useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { Typography } from '@mui/material';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { updateUserMetrics } from 'src/api/user';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function UserQuickEditForm({ currentUser, open, onClose }) {
  const { enqueueSnackbar } = useSnackbar();

  const NewMetricsSchema = Yup.object().shape({
    asistencia_entrenos: Yup.number().required('Asistencia a entrenos is required'),
    asistencia_partidos: Yup.number().required('Asistencia a partidos is required'),
    puntualidad_pagos: Yup.number().required('Puntualidad en pagos is required'),
    llegadas_tarde: Yup.number().required('Llegadas tarde is required'),
    deuda_acumulada: Yup.number().required('Deuda acumlada is required'),
    total: Yup.number().required('Total number is required'),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      asistencia_entrenos: currentUser?.user_metrics?.asistencia_entrenos || 0,
      asistencia_partidos: currentUser?.user_metrics?.asistencia_partidos || 0,
      puntualidad_pagos: currentUser?.user_metrics?.puntualidad_pagos || 0,
      llegadas_tarde: currentUser?.user_metrics?.llegadas_tarde || 0,
      deuda_acumulada: currentUser?.user_metrics?.deuda_acumulada || 0,
      total: currentUser?.user_metrics?.total || 0,
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewMetricsSchema),
    defaultValues,
  });

  const {
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onCloseHandle = () => {
    onClose();
    reset(defaultValues);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      onClose();
      enqueueSnackbar('Update metrics success!');
      updateUserMetrics(currentUser.id, data);
      currentUser.user_metrics = data;
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { maxWidth: 720 },
      }}
    >
      <FormProvider methods={methods} onSubmit={onSubmit}>
        <DialogTitle>Quick Metrics Update</DialogTitle>

        <DialogContent>
          <Alert variant="outlined" severity="info" sx={{ mb: 3 }}>
            <Typography>
              Update the metrics for <strong>{currentUser?.name}</strong> user of group <strong>{currentUser?.group}</strong>
            </Typography>
          </Alert>

          <Box
            rowGap={3}
            columnGap={2}
            display="grid"
            gridTemplateColumns={{
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
            }}
          >

            <RHFTextField name="asistencia_entrenos" label="Asistencia entrenos" />

            <RHFTextField name="asistencia_partidos" label="Asistencia partidos" />

            <RHFTextField name="puntualidad_pagos" label="Puntualidad pagos" />

            <RHFTextField name="llegadas_tarde" label="Llegadas tarde" />

            <RHFTextField name="deuda_acumulada" label="Deuda acumulada" />

            <RHFTextField name="total" label="Total" />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button variant="outlined" onClick={onCloseHandle}>
            Cancel
          </Button>

          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            Update
          </LoadingButton>
        </DialogActions>
      </FormProvider>
    </Dialog>
  );
}

UserQuickEditForm.propTypes = {
  currentUser: PropTypes.object,
  onClose: PropTypes.func,
  open: PropTypes.bool,
};
