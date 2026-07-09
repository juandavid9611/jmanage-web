import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { createPlayer, updatePlayer, getPlayerAvatarUploadUrl } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const POSITION_OPTIONS = [
  { value: 'Goalkeeper', label: 'label_position_goalkeeper' },
  { value: 'Defender', label: 'label_position_defender' },
  { value: 'Midfielder', label: 'label_position_midfielder' },
  { value: 'Forward', label: 'label_position_forward' },
];

function getPlayerSchema(t) {
  return zod.object({
    name: zod.string().min(1, { message: t('name_required') }),
    number: zod.coerce
      .number({ invalid_type_error: t('label_jersey_number_required') })
      .int(t('label_must_be_integer'))
      .min(1, { message: t('label_must_be_greater_than_0') }),
    position: zod
      .string()
      .min(1, { message: t('label_position_required') })
      .refine((v) => ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'].includes(v), {
        message: t('label_select_valid_position'),
      }),
    id_number: zod.string().min(1, { message: t('label_id_number_required') }),
  });
}

// ----------------------------------------------------------------------

async function uploadAvatarToS3(file, presignedUrl) {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
}

// ----------------------------------------------------------------------

export function PlayerFormDialog({ open, onClose, tournamentId, teamId, currentPlayer }) {
  const { t } = useTranslation();
  const isEdit = !!currentPlayer;
  const fileInputRef = useRef(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState(false);

  const defaultValues = {
    name: '',
    number: '',
    position: '',
    id_number: '',
  };

  const PlayerSchema = useMemo(() => getPlayerSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(PlayerSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const nameValue = watch('name');

  useEffect(() => {
    if (open) {
      reset({
        name: currentPlayer?.name || '',
        number: currentPlayer?.number || '',
        position: currentPlayer?.position || '',
        id_number: currentPlayer?.id_number || '',
      });
      setPhotoFile(null);
      setPhotoPreview(currentPlayer?.avatar_url || null);
      setPhotoError(false);
    }
  }, [open, currentPlayer, reset]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoError(false);
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = handleSubmit(async (data) => {
    if (!photoPreview) {
      setPhotoError(true);
      return;
    }
    try {
      const payload = {
        ...data,
        number: data.number ? Number(data.number) : 0,
      };

      if (isEdit) {
        // Upload new photo first if selected
        if (photoFile) {
          const { key, url: presignedUrl } = await getPlayerAvatarUploadUrl(
            tournamentId,
            currentPlayer.id,
            photoFile.name,
            photoFile.type
          );
          await uploadAvatarToS3(photoFile, presignedUrl);
          payload.avatar_url = key;
        } else if (!photoPreview && currentPlayer.avatar_url) {
          // Photo was removed
          payload.avatar_url = '';
        }
        await updatePlayer(tournamentId, currentPlayer.id, payload);
        toast.success(t('label_player_updated'));
      } else {
        // Create player first (no photo yet)
        const created = await createPlayer(tournamentId, teamId, payload);

        // Then upload photo if selected
        if (photoFile) {
          try {
            const { key, url: presignedUrl } = await getPlayerAvatarUploadUrl(
              tournamentId,
              created.id,
              photoFile.name,
              photoFile.type
            );
            await uploadAvatarToS3(photoFile, presignedUrl);
            await updatePlayer(tournamentId, created.id, { avatar_url: key });
          } catch {
            // Photo upload failed — player was created, just warn
            toast.warning(t('label_player_created_but_photo_upload_failed'));
          }
        }
        toast.success(t('label_player_created'));
      }
      onClose();
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    }
  });

  const initials = nameValue?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? t('label_edit_player') : t('label_add_player')}</DialogTitle>

        <DialogContent>
          {/* Photo + name row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mt: 1, mb: 3 }}>
            {/* Avatar picker */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Tooltip title={t('label_change_photo')}>
                <Avatar
                  src={photoPreview || undefined}
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    width: 72,
                    height: 72,
                    fontSize: 22,
                    fontWeight: 700,
                    bgcolor: 'primary.main',
                    cursor: 'pointer',
                    border: (theme) =>
                      photoError
                        ? `2px solid ${theme.palette.error.main}`
                        : `2px solid ${alpha(theme.palette.grey[500], 0.16)}`,
                    '&:hover': { opacity: 0.8 },
                    transition: 'opacity 0.2s',
                  }}
                >
                  {!photoPreview && initials}
                </Avatar>
              </Tooltip>

              {/* Camera overlay */}
              <Box
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  bgcolor: 'grey.800',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  border: '1.5px solid white',
                }}
              >
                <Iconify icon="mdi:camera" width={12} sx={{ color: 'common.white' }} />
              </Box>

              {/* Remove photo button */}
              {photoPreview && (
                <IconButton
                  size="small"
                  onClick={handleRemovePhoto}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    width: 18,
                    height: 18,
                    bgcolor: 'error.main',
                    color: 'common.white',
                    '&:hover': { bgcolor: 'error.dark' },
                    p: 0,
                  }}
                >
                  <Iconify icon="eva:close-fill" width={12} />
                </IconButton>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handlePhotoSelect}
              />
            </Box>

            {/* Name field */}
            <Box sx={{ flex: 1 }}>
              <Field.Text name="name" label={t('label_full_name')} required />
              <Typography
                variant="caption"
                sx={{
                  color: photoError ? 'error.main' : 'text.disabled',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                {photoError
                  ? t('label_photo_required_click_avatar')
                  : t('label_click_avatar_to_upload_photo')}
              </Typography>
            </Box>
          </Box>

          {/* ID + number row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Field.Text
              name="id_number"
              label={t('label_id_number')}
              placeholder={t('label_id_number_example')}
              helperText={t('label_id_document_hint')}
              required
            />
            <Field.Text
              name="number"
              label={t('label_jersey_number')}
              type="number"
              helperText={t('label_player_jersey_hint')}
              required
            />
          </Box>

          {/* Position */}
          <Field.Select name="position" label={t('label_position')} required>
            {POSITION_OPTIONS.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {t(opt.label)}
              </MenuItem>
            ))}
          </Field.Select>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{t('cancel')}</Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {isEdit ? t('label_save') : t('label_create')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
