import { z as zod } from 'zod';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import {
  createTournament,
  updateTournament,
  getTournamentLogoUploadUrl,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const TOURNAMENT_TYPE_OPTIONS = [
  { value: 'league', label: 'Liga' },
  { value: 'knockout', label: 'Eliminación Directa' },
  { value: 'hybrid', label: 'Híbrido (Grupos + Eliminación)' },
];

const LEGS_OPTIONS = [
  { value: 1, label: 'Ida (1 vuelta)' },
  { value: 2, label: 'Ida y Vuelta (2 vueltas)' },
];

const NUM_TEAMS_OPTIONS = [4, 8, 12, 16, 20, 24, 32];

const TournamentSchema = zod.object({
  name: zod.string().min(1, 'El nombre es obligatorio'),
  season: zod.string().optional(),
  type: zod.enum(['league', 'knockout', 'hybrid']),
  is_public: zod.boolean().optional(),
  num_teams: zod.coerce.number().int().min(2).optional().or(zod.literal('')),
  description: zod.string().optional(),
  location: zod.string().optional(),
  start_date: zod.string().optional(),
  end_date: zod.string().optional(),
  rules: zod.object({
    points_per_win: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    points_per_draw: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    points_per_loss: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    total_matchweeks: zod.coerce.number().int().min(1, 'Debe ser al menos 1'),
    legs: zod.coerce.number().int().refine((v) => v === 1 || v === 2, { message: 'Debe ser 1 o 2' }),
  }),
});

async function uploadLogoToS3(file, presignedUrl) {
  await fetch(presignedUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
}

// ----------------------------------------------------------------------

export function TournamentNewEditForm({ currentTournament }) {
  const navigate = useNavigate();
  const isEdit = !!currentTournament;
  const fileInputRef = useRef(null);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(currentTournament?.logo_url || null);

  const defaultValues = {
    name: currentTournament?.name || '',
    season: currentTournament?.season || '',
    type: currentTournament?.type || 'league',
    is_public: currentTournament?.is_public ?? false,
    num_teams: currentTournament?.num_teams || '',
    description: currentTournament?.description || '',
    location: currentTournament?.location || '',
    start_date: currentTournament?.start_date || '',
    end_date: currentTournament?.end_date || '',
    rules: {
      points_per_win: currentTournament?.rules?.points_per_win ?? 3,
      points_per_draw: currentTournament?.rules?.points_per_draw ?? 1,
      points_per_loss: currentTournament?.rules?.points_per_loss ?? 0,
      total_matchweeks: currentTournament?.rules?.total_matchweeks ?? 6,
      legs: currentTournament?.rules?.legs ?? 1,
    },
  };

  const methods = useForm({
    resolver: zodResolver(TournamentSchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const tournamentType = watch('type');
  const nameValue = watch('name');
  const showLeagueRules = tournamentType === 'league' || tournamentType === 'hybrid';
  const showMatchweeks = tournamentType === 'league';

  const handleLogoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        ...data,
        num_teams: data.num_teams ? Number(data.num_teams) : undefined,
      };

      if (isEdit) {
        // Upload new logo if changed
        if (logoFile) {
          const { key, url: presignedUrl } = await getTournamentLogoUploadUrl(
            currentTournament.id,
            logoFile.name,
            logoFile.type
          );
          await uploadLogoToS3(logoFile, presignedUrl);
          payload.logo_url = key;
        } else if (!logoPreview && currentTournament.logo_url) {
          payload.logo_url = '';
        }
        await updateTournament(currentTournament.id, payload);
        toast.success('Torneo actualizado');
        navigate(paths.dashboard.tournament.root);
      } else {
        // Create first, then upload logo
        const created = await createTournament(payload);
        if (logoFile) {
          try {
            const { key, url: presignedUrl } = await getTournamentLogoUploadUrl(
              created.id,
              logoFile.name,
              logoFile.type
            );
            await uploadLogoToS3(logoFile, presignedUrl);
            await updateTournament(created.id, { logo_url: key });
          } catch {
            toast.warning('Torneo creado, pero el logo no pudo subirse');
          }
        }
        toast.success('Torneo creado');
        navigate(paths.dashboard.tournament.details(created.id));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar');
    }
  });

  const initials = nameValue?.slice(0, 2)?.toUpperCase() || 'T';

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {/* ── Main info ── */}
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            {/* Logo + name header */}
            <Stack direction="row" spacing={2.5} alignItems="flex-start" sx={{ mb: 3 }}>
              {/* Logo picker */}
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Tooltip title="Cambiar logo">
                  <Avatar
                    src={logoPreview || undefined}
                    variant="rounded"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      width: 80,
                      height: 80,
                      fontSize: 26,
                      fontWeight: 700,
                      bgcolor: 'primary.main',
                      borderRadius: 2,
                      cursor: 'pointer',
                      border: (t) => `2px solid ${alpha(t.palette.grey[500], 0.16)}`,
                      '&:hover': { opacity: 0.8 },
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {!logoPreview && initials}
                  </Avatar>
                </Tooltip>

                <Box
                  onClick={() => fileInputRef.current?.click()}
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    bgcolor: 'grey.800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '2px solid white',
                  }}
                >
                  <Iconify icon="mdi:camera" width={13} sx={{ color: 'common.white' }} />
                </Box>

                {logoPreview && (
                  <IconButton
                    size="small"
                    onClick={handleRemoveLogo}
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
                  onChange={handleLogoSelect}
                />
              </Box>

              {/* Name + season */}
              <Stack spacing={2} sx={{ flex: 1 }}>
                <Field.Text name="name" label="Nombre del Torneo" required />
                <Grid container spacing={2}>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="season" label="Temporada" placeholder="2026-A" />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <Field.Text name="location" label="Sede / Ciudad" placeholder="Bogotá" />
                  </Grid>
                </Grid>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2.5}>
              <Field.Text
                name="description"
                label="Descripción"
                multiline
                rows={2}
                placeholder="Descripción opcional del torneo..."
              />

              <Grid container spacing={2}>
                <Grid xs={12} sm={4}>
                  <Field.Select name="type" label="Tipo de Torneo">
                    {TOURNAMENT_TYPE_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>

                <Grid xs={12} sm={4}>
                  <Field.Select name="num_teams" label="Equipos (capacidad)">
                    <MenuItem value="">Sin límite</MenuItem>
                    {NUM_TEAMS_OPTIONS.map((n) => (
                      <MenuItem key={n} value={n}>
                        {n} equipos
                      </MenuItem>
                    ))}
                  </Field.Select>
                </Grid>

                <Grid xs={12} sm={4}>
                  <Field.Switch
                    name="is_public"
                    label="Torneo público"
                    helperText="Visible sin iniciar sesión"
                  />
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid xs={12} sm={6}>
                  <Field.Text
                    name="start_date"
                    label="Fecha de inicio"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid xs={12} sm={6}>
                  <Field.Text
                    name="end_date"
                    label="Fecha de fin"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
              </Grid>
            </Stack>
          </Card>
        </Grid>

        {/* ── Rules sidebar ── */}
        <Grid xs={12} md={4}>
          {tournamentType !== 'knockout' && (
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Reglas
              </Typography>

              <Stack spacing={2}>
                {showLeagueRules && (
                  <>
                    <Field.Text name="rules.points_per_win" label="Puntos por Victoria" type="number" />
                    <Field.Text name="rules.points_per_draw" label="Puntos por Empate" type="number" />
                    <Field.Text name="rules.points_per_loss" label="Puntos por Derrota" type="number" />
                  </>
                )}

                {showMatchweeks && (
                  <Field.Text name="rules.total_matchweeks" label="Total Jornadas" type="number" />
                )}

                <Field.Select name="rules.legs" label="Vueltas">
                  {LEGS_OPTIONS.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Stack>
            </Card>
          )}
        </Grid>

        <Grid xs={12}>
          <Stack alignItems="flex-end">
            <LoadingButton type="submit" size="large" variant="contained" loading={isSubmitting}>
              {isEdit ? 'Guardar Cambios' : 'Crear Torneo'}
            </LoadingButton>
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}
