import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createWorkspace } from 'src/actions/workspaces';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const NAME_MAX_LENGTH = 80;

export function WorkspaceCreateDialog({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setName('');
    setError('');
    onClose();
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError(t('label_category_name_required'));
      return;
    }
    if (trimmed.length > NAME_MAX_LENGTH) {
      setError(t('label_category_name_too_long'));
      return;
    }
    setIsSubmitting(true);
    try {
      const created = await createWorkspace({ name: trimmed });
      toast.success(t('label_category_created'));
      onCreated?.(created);
      setName('');
      setError('');
      onClose();
    } catch (submitError) {
      if (submitError?.status === 409) {
        setError(t('label_category_exists'));
      } else {
        toast.error(t('label_category_create_error'));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mingcute:add-line" width={24} sx={{ color: 'primary.main' }} />
          <span>{t('label_new_category')}</span>
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
          {t('label_new_category_body')}
        </Typography>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          autoFocus
          label={t('label_category_name')}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (error) setError('');
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSubmit();
            }
          }}
          error={!!error}
          helperText={error}
          inputProps={{ maxLength: NAME_MAX_LENGTH }}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button variant="soft" color="inherit" onClick={handleClose} disabled={isSubmitting}>
          {t('cancel')}
        </Button>
        <LoadingButton variant="contained" onClick={handleSubmit} loading={isSubmitting}>
          {t('label_create')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
