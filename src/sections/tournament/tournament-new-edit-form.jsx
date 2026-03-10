import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { createTournament, updateTournament } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
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

const TournamentSchema = zod.object({
  name: zod.string().min(1, 'El nombre es obligatorio'),
  season: zod.string().optional(),
  type: zod.enum(['league', 'knockout', 'hybrid']),
  is_public: zod.boolean().optional(),
  rules: zod.object({
    points_per_win: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    points_per_draw: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    points_per_loss: zod.coerce.number().int().min(0, 'Debe ser 0 o más'),
    total_matchweeks: zod.coerce.number().int().min(1, 'Debe ser al menos 1'),
    legs: zod.coerce.number().int().refine((v) => v === 1 || v === 2, { message: 'Debe ser 1 o 2' }),
  }),
});

export function TournamentNewEditForm({ currentTournament }) {
  const navigate = useNavigate();
  const isEdit = !!currentTournament;

  const defaultValues = {
    name: currentTournament?.name || '',
    season: currentTournament?.season || '',
    type: currentTournament?.type || 'league',
    is_public: currentTournament?.is_public ?? false,
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
  const showLeagueRules = tournamentType === 'league' || tournamentType === 'hybrid';
  const showMatchweeks = tournamentType === 'league';

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (isEdit) {
        await updateTournament(currentTournament.id, data);
        toast.success('Torneo actualizado');
        navigate(paths.dashboard.tournament.root);
      } else {
        const result = await createTournament(data);
        toast.success('Torneo creado');
        navigate(paths.dashboard.tournament.details(result.id));
      }
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar');
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Stack spacing={3}>
              <Field.Text name="name" label="Nombre del Torneo" required />

              <Field.Text name="season" label="Temporada" placeholder="2026-A" />

              <Field.Select name="type" label="Tipo de Torneo">
                {TOURNAMENT_TYPE_OPTIONS.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </Field.Select>

              <Field.Switch
                name="is_public"
                label="Torneo público"
                helperText="Visible para cualquier persona sin necesidad de iniciar sesión"
              />
            </Stack>
          </Card>
        </Grid>

        {tournamentType !== 'knockout' && (
          <Grid xs={12} md={4}>
            <Card sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 3 }}>
                Reglas
              </Typography>

              <Stack spacing={2}>
                {showLeagueRules && (
                  <>
                    <Field.Text
                      name="rules.points_per_win"
                      label="Puntos por Victoria"
                      type="number"
                    />
                    <Field.Text
                      name="rules.points_per_draw"
                      label="Puntos por Empate"
                      type="number"
                    />
                    <Field.Text
                      name="rules.points_per_loss"
                      label="Puntos por Derrota"
                      type="number"
                    />
                  </>
                )}

                {showMatchweeks && (
                  <Field.Text
                    name="rules.total_matchweeks"
                    label="Total Jornadas"
                    type="number"
                  />
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
          </Grid>
        )}

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
