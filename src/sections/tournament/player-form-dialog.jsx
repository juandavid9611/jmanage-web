import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useRef, useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';

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

import {
  createPlayer,
  updatePlayer,
  getPlayerAvatarUploadUrl,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
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
  id_number: zod.string().optional(),
});

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
  const isEdit = !!currentPlayer;
  const fileInputRef = useRef(null);

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  const defaultValues = {
    name: '',
    number: '',
    position: '',
    id_number: '',
  };

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
    }
  }, [open, currentPlayer, reset]);

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const onSubmit = handleSubmit(async (data) => {
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
        toast.success('Jugador actualizado');
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
            toast.warning('Jugador creado, pero la foto no pudo subirse');
          }
        }
        toast.success('Jugador creado');
      }
      onClose();
    } catch (error) {
      toast.error(error.message || 'Error');
    }
  });

  const initials = nameValue?.slice(0, 2)?.toUpperCase() || '?';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{isEdit ? 'Editar Jugador' : 'Agregar Jugador'}</DialogTitle>

        <DialogContent>
          {/* Photo + name row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2.5, mt: 1, mb: 3 }}>
            {/* Avatar picker */}
            <Box sx={{ position: 'relative', flexShrink: 0 }}>
              <Tooltip title="Cambiar foto">
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
                    border: (t) => `2px solid ${alpha(t.palette.grey[500], 0.16)}`,
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
              <Field.Text name="name" label="Nombre completo" required />
              <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, display: 'block' }}>
                Haz clic en el avatar para subir una foto
              </Typography>
            </Box>
          </Box>

          {/* ID + number row */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
            <Field.Text
              name="id_number"
              label="Nº de identificación"
              placeholder="Ej. 1234567890"
              helperText="Cédula o documento"
            />
            <Field.Text
              name="number"
              label="Número de camiseta"
              type="number"
              helperText="Dorsal del jugador"
            />
          </Box>

          {/* Position */}
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
