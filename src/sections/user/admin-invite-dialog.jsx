import { useState } from 'react';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createAdminInvitation } from 'src/actions/invitation';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function AdminInviteDialog({ open, onClose }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!EMAIL_REGEX.test(email)) {
      setError('Ingresa un correo válido');
      return;
    }
    setIsSubmitting(true);
    try {
      await createAdminInvitation({ email });
      toast.success(`Invitación enviada a ${email}`);
      handleClose();
    } catch (submitError) {
      toast.error(submitError?.response?.data?.detail || 'Error al enviar la invitación');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:shield-account-outline" width={24} sx={{ color: 'primary.main' }} />
          <span>Crear administrador</span>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          Enviaremos un enlace de invitación para que configure su cuenta.
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label="Correo"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          error={!!error}
          helperText={error}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="soft" color="inherit" onClick={handleClose}>
          Cancelar
        </Button>
        <LoadingButton
          variant="contained"
          onClick={handleSubmit}
          loading={isSubmitting}
          startIcon={<Iconify icon="mingcute:add-line" />}
        >
          Enviar invitación
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
