import { z as zod } from 'zod';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect, useCallback } from 'react';
import { useForm, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { createTournament } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { TournamentCreationStepper } from './tournament-creation-stepper';
import { TournamentCreationSummary } from './tournament-creation-summary';

// ----------------------------------------------------------------------

const SPORT_OPTIONS = [
  { value: 'futbol', label: 'Fútbol' },
  { value: 'baloncesto', label: 'Baloncesto' },
  { value: 'voleibol', label: 'Voleibol' },
  { value: 'tenis', label: 'Tenis' },
  { value: 'padel', label: 'Pádel' },
  { value: 'otro', label: 'Otro' },
];

const FORMAT_OPTIONS = [
  {
    value: 'hybrid',
    label: 'Grupos + Knockout',
    icon: '⊞ →',
    desc: 'Fase de grupos seguida de eliminación directa. El más completo.',
    badge: 'Popular',
  },
  {
    value: 'league',
    label: 'Liga / Round Robin',
    icon: '⊞',
    desc: 'Todos contra todos. Gana quien más puntos acumule al final.',
    badge: null,
  },
  {
    value: 'knockout',
    label: 'Solo Knockout',
    icon: '→',
    desc: 'Eliminación directa desde el inicio. Rápido e intenso.',
    badge: null,
  },
];

const TEAM_COUNT_OPTIONS = [8, 12, 16, 20, 24, 32];
const GROUP_SIZE_OPTIONS = [3, 4, 5, 6];

const DEFAULT_TIEBREAKERS_FUTBOL = [
  'Puntos acumulados',
  'Diferencia de goles',
  'Goles a favor',
  'Enfrentamiento directo',
  'Menor número de tarjetas',
];

const DEFAULT_TIEBREAKERS_PUNTOS = [
  'Puntos acumulados',
  'Diferencia de puntos',
  'Puntos a favor',
  'Enfrentamiento directo',
  'Menor número de faltas',
];

// ----------------------------------------------------------------------

const WizardSchema = zod.object({
  // Step 1
  name: zod.string().min(1, 'El nombre es obligatorio'),
  sport: zod.string().min(1, 'Selecciona un deporte'),
  city: zod.string().optional(),
  // Step 2
  type: zod.string().min(1, 'Selecciona un formato'),
  num_teams: zod.coerce.number().int().min(2, 'Selecciona el número de equipos'),
  teams_per_group: zod.coerce.number().int().optional(),
  // Step 3
  rules: zod.object({
    points_per_win: zod.coerce.number().int().min(0),
    points_per_draw: zod.coerce.number().int().min(0),
    points_per_loss: zod.coerce.number().int().min(0),
  }),
  scoring_preset: zod.string().optional(),
  // Step 4
  tiebreaker_order: zod.array(zod.string()).optional(),
  // Step 5
  options: zod.object({
    public_registration: zod.boolean(),
    individual_stats: zod.boolean(),
    public_results: zod.boolean(),
    email_notifications: zod.boolean(),
    extra_time: zod.boolean(),
  }),
});

const STEPS = [
  { key: 'identity', label: 'Identidad', number: '01' },
  { key: 'format', label: 'Formato', number: '02' },
  { key: 'scoring', label: 'Puntuación', number: '03' },
  { key: 'tiebreakers', label: 'Desempates', number: '04' },
  { key: 'options', label: 'Opciones', number: '05' },
];

// Step validation: which fields must be valid to unlock the next step
const STEP_FIELDS = {
  0: ['name', 'sport'],
  1: ['type', 'num_teams'],
  2: ['rules.points_per_win', 'rules.points_per_draw', 'rules.points_per_loss'],
  3: [],
  4: [],
};

// ----------------------------------------------------------------------

export function TournamentCreationWizard() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const defaultValues = {
    name: '',
    sport: '',
    city: '',
    type: '',
    num_teams: '',
    teams_per_group: 4,
    rules: { points_per_win: 3, points_per_draw: 1, points_per_loss: 0 },
    scoring_preset: 'standard',
    tiebreaker_order: [...DEFAULT_TIEBREAKERS_FUTBOL],
    options: {
      public_registration: true,
      individual_stats: true,
      public_results: true,
      email_notifications: false,
      extra_time: false,
    },
  };

  const methods = useForm({
    resolver: zodResolver(WizardSchema),
    defaultValues,
    mode: 'onChange',
  });

  const {
    watch,
    trigger,
    setValue,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = methods;

  const values = watch();

  // Derive unlocked steps
  const getUnlockedSteps = useCallback(() => {
    const unlocked = new Set([0]);
    if (values.name && values.sport) { unlocked.add(1); unlocked.add(2); unlocked.add(3); unlocked.add(4); }
    if (values.type) { unlocked.add(2); unlocked.add(3); unlocked.add(4); }
    return unlocked;
  }, [values.name, values.sport, values.type]);

  const unlockedSteps = getUnlockedSteps();

  const handleStepClick = useCallback(
    (step) => {
      if (unlockedSteps.has(step)) setActiveStep(step);
    },
    [unlockedSteps]
  );

  const handleNext = useCallback(async () => {
    const fields = STEP_FIELDS[activeStep];
    if (fields && fields.length > 0) {
      const valid = await trigger(fields);
      if (!valid) return;
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [activeStep, trigger]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  // Update tiebreaker labels when sport changes
  const handleSportChange = useCallback(
    (sport) => {
      if (sport === 'baloncesto' || sport === 'voleibol') {
        setValue('tiebreaker_order', [...DEFAULT_TIEBREAKERS_PUNTOS]);
      } else {
        setValue('tiebreaker_order', [...DEFAULT_TIEBREAKERS_FUTBOL]);
      }
    },
    [setValue]
  );

  const onSubmit = handleSubmit(async (data) => {
    try {
      const payload = {
        name: data.name,
        sport: data.sport,
        city: data.city,
        type: data.type,
        num_teams: data.num_teams,
        teams_per_group: data.teams_per_group,
        rules: data.rules,
        tiebreaker_order: data.tiebreaker_order,
        options: data.options,
      };
      const result = await createTournament(payload);
      toast.success('¡Torneo creado exitosamente!');
      navigate(paths.dashboard.tournament.details(result.id));
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al crear el torneo');
    }
  });

  // Structure preview calculations
  const structurePreview = getStructurePreview(values);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={0} sx={{ minHeight: 'calc(100vh - 64px)', maxWidth: 1440, mx: 'auto' }}>
        {/* LEFT STEPPER */}
        <Grid
          xs={12}
          md={2.5}
          sx={{
            borderRight: { md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` },
            borderBottom: { xs: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`, md: 'none' },
          }}
        >
          <TournamentCreationStepper
            steps={STEPS}
            activeStep={activeStep}
            unlockedSteps={unlockedSteps}
            values={values}
            onStepClick={handleStepClick}
          />
        </Grid>

        {/* MAIN FORM */}
        <Grid xs={12} md={6.5} sx={{ p: { xs: 2, md: 5 }, overflowY: 'auto', maxHeight: { md: 'calc(100vh - 64px)' } }}>
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              Nuevo torneo
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Crea tu torneo.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480 }}>
              Cada sección se habilita conforme avanzas. El sistema ajusta las opciones según tus
              decisiones anteriores.
            </Typography>
          </Box>

          {/* Step content */}
          {activeStep === 0 && <StepIdentity onSportChange={handleSportChange} />}
          {activeStep === 1 && <StepFormat values={values} structurePreview={structurePreview} />}
          {activeStep === 2 && <StepScoring values={values} setValue={setValue} />}
          {activeStep === 3 && <StepTiebreakers values={values} setValue={setValue} />}
          {activeStep === 4 && <StepOptions />}

          {/* Navigation buttons */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button
              variant="outlined"
              color="inherit"
              disabled={activeStep === 0}
              onClick={handleBack}
              startIcon={<Iconify icon="eva:arrow-back-fill" />}
            >
              Anterior
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<Iconify icon="eva:arrow-forward-fill" />}
              >
                Siguiente
              </Button>
            ) : (
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                endIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              >
                Crear torneo
              </LoadingButton>
            )}
          </Stack>
        </Grid>

        {/* RIGHT SUMMARY */}
        <Grid
          xs={12}
          md={3}
          sx={{
            borderLeft: { md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}` },
            borderTop: { xs: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`, md: 'none' },
          }}
        >
          <TournamentCreationSummary
            values={values}
            structurePreview={structurePreview}
          />
        </Grid>
      </Grid>
    </Form>
  );
}

// ======================================================================
// STEP 1 — IDENTIDAD
// ======================================================================

function StepIdentity({ onSportChange }) {
  const { watch } = useFormContext();
  const sport = watch('sport');

  // Sync tiebreaker labels when sport changes
  useEffect(() => {
    if (sport) onSportChange(sport);
  }, [sport, onSportChange]);

  return (
    <StepSection number="01" title="Identidad">
      <Stack spacing={3}>
        <Field.Text name="name" label="Nombre del torneo" placeholder="Ej. Copa Verano 2025" />

        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <Field.Select name="sport" label="Deporte">
              {SPORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </Field.Select>
          </Grid>
          <Grid xs={12} md={6}>
            <Field.Text name="city" label="Sede / Ciudad" placeholder="Ej. Bogotá" />
          </Grid>
        </Grid>
      </Stack>
    </StepSection>
  );
}

// ======================================================================
// STEP 2 — FORMATO
// ======================================================================

function StepFormat({ values, structurePreview }) {
  const theme = useTheme();

  return (
    <StepSection number="02" title="Formato del torneo">
      <Stack spacing={3}>
        {/* Format cards */}
        <Grid container spacing={1.5}>
          {FORMAT_OPTIONS.map((opt) => (
            <Grid xs={12} sm={4} key={opt.value}>
              <FormatCard
                option={opt}
                selected={values.type === opt.value}
              />
            </Grid>
          ))}
        </Grid>

        {/* Sub-parameters */}
        {values.type && (
          <Grid container spacing={2}>
            <Grid xs={12} md={6}>
              <Field.Select name="num_teams" label="Número de equipos">
                {TEAM_COUNT_OPTIONS.map((n) => (
                  <MenuItem key={n} value={n}>
                    {n} equipos
                  </MenuItem>
                ))}
              </Field.Select>
            </Grid>

            {values.type !== 'league' && values.type !== 'knockout' && (
              <Grid xs={12} md={6}>
                <Field.Select name="teams_per_group" label="Equipos por grupo">
                  {GROUP_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n} equipos
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
            )}
          </Grid>
        )}

        {/* Structure preview */}
        {structurePreview.text && (
          <Card
            sx={{
              p: 2.5,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              ✦ Vista previa de estructura
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {structurePreview.text}
            </Typography>
          </Card>
        )}
      </Stack>
    </StepSection>
  );
}

function FormatCard({ option, selected }) {
  const { setValue } = useFormContext();

  return (
    <Card
      onClick={() => {
        setValue('type', option.value, { shouldValidate: true });
      }}
      sx={{
        p: 2,
        cursor: 'pointer',
        position: 'relative',
        border: (theme) =>
          `1.5px solid ${selected ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.12)}`,
        bgcolor: (theme) => (selected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper'),
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <Typography sx={{ fontSize: 22, mb: 1 }}>{option.icon}</Typography>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {option.label}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
        {option.desc}
      </Typography>
      {option.badge && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            px: 1,
            py: 0.25,
            borderRadius: '100px',
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: 0.5,
          }}
        >
          {option.badge}
        </Box>
      )}
    </Card>
  );
}

// ======================================================================
// STEP 3 — PUNTUACIÓN
// ======================================================================

function StepScoring({ values, setValue }) {
  const theme = useTheme();
  const isStandard = values.scoring_preset === 'standard';

  const handlePreset = (preset) => {
    setValue('scoring_preset', preset);
    if (preset === 'standard') {
      setValue('rules.points_per_win', 3);
      setValue('rules.points_per_draw', 1);
      setValue('rules.points_per_loss', 0);
    }
  };

  return (
    <StepSection number="03" title="Sistema de puntuación">
      <Stack spacing={3}>
        {/* Preset cards */}
        <Grid container spacing={1.5}>
          <Grid xs={12} sm={6}>
            <Card
              onClick={() => handlePreset('standard')}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: (t) =>
                  `1.5px solid ${isStandard ? t.palette.primary.main : alpha(t.palette.grey[500], 0.12)}`,
                bgcolor: isStandard ? (t) => alpha(t.palette.primary.main, 0.08) : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="subtitle2">Estándar FIFA</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Victoria 3 pts · Empate 1 pt · Derrota 0 pts
              </Typography>
            </Card>
          </Grid>
          <Grid xs={12} sm={6}>
            <Card
              onClick={() => handlePreset('custom')}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: (t) =>
                  `1.5px solid ${!isStandard ? t.palette.primary.main : alpha(t.palette.grey[500], 0.12)}`,
                bgcolor: !isStandard ? (t) => alpha(t.palette.primary.main, 0.08) : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="subtitle2">Personalizado</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Define tus propios valores de puntuación.
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Scoring inputs */}
        <Grid container spacing={2}>
          <Grid xs={4}>
            <ScoringInput label="Victoria" name="rules.points_per_win" />
          </Grid>
          <Grid xs={4}>
            <ScoringInput label="Empate" name="rules.points_per_draw" />
          </Grid>
          <Grid xs={4}>
            <ScoringInput label="Derrota" name="rules.points_per_loss" />
          </Grid>
        </Grid>
      </Stack>
    </StepSection>
  );
}

function ScoringInput({ label, name }) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 2,
        textAlign: 'center',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
      }}
    >
      <Typography
        variant="overline"
        sx={{ color: 'text.secondary', letterSpacing: 1, mb: 1, display: 'block' }}
      >
        {label}
      </Typography>
      <Field.Text
        name={name}
        type="number"
        inputProps={{ min: 0, max: 9, style: { textAlign: 'center', fontSize: 28, fontWeight: 600 } }}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
          '& .MuiInputBase-input': { color: 'primary.main' },
        }}
      />
    </Card>
  );
}

// ======================================================================
// STEP 4 — DESEMPATES
// ======================================================================

function StepTiebreakers({ values, setValue }) {
  const theme = useTheme();
  const items = values.tiebreaker_order || [];
  const [dragIndex, setDragIndex] = useState(null);

  const handleDragStart = (index) => {
    setDragIndex(index);
  };

  const handleDrop = (dropIndex) => {
    if (dragIndex === null || dragIndex === dropIndex) return;
    const updated = [...items];
    const [removed] = updated.splice(dragIndex, 1);
    updated.splice(dropIndex, 0, removed);
    setValue('tiebreaker_order', updated);
    setDragIndex(null);
  };

  return (
    <StepSection number="04" title="Criterios de desempate">
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.7 }}>
        Define el orden en que se resolverán los empates en la tabla. Arrastra para reordenar. El
        sistema los aplicará automáticamente.
      </Typography>

      <Stack spacing={0.75}>
        {items.map((item, index) => (
          <Card
            key={item}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(index)}
            sx={{
              px: 2,
              py: 1.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              cursor: 'grab',
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              transition: 'all 0.2s',
              opacity: dragIndex === index ? 0.4 : 1,
              '&:hover': {
                borderColor: (t) => alpha(t.palette.grey[500], 0.24),
              },
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: 'primary.main', fontWeight: 600, minWidth: 20, fontFamily: 'monospace' }}
            >
              {index + 1}°
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 500, flex: 1 }}>
              {item}
            </Typography>
            <Iconify icon="eva:menu-outline" sx={{ color: 'text.disabled' }} />
          </Card>
        ))}
      </Stack>
    </StepSection>
  );
}

// ======================================================================
// STEP 5 — OPCIONES
// ======================================================================

const OPTION_TOGGLES = [
  {
    name: 'options.public_registration',
    title: 'Inscripción pública',
    desc: 'Los managers pueden registrar sus equipos con un link',
  },
  {
    name: 'options.individual_stats',
    title: 'Estadísticas individuales',
    desc: 'Goles, asistencias y tarjetas por jugador',
  },
  {
    name: 'options.public_results',
    title: 'Resultados públicos',
    desc: 'Tabla y resultados visibles sin login para todos',
  },
  {
    name: 'options.email_notifications',
    title: 'Notificaciones por email',
    desc: 'Avisar a los managers de partidos y resultados',
  },
  {
    name: 'options.extra_time',
    title: 'Tiempo extra en knockout',
    desc: 'Habilitar prórroga y penales en eliminatorias',
  },
];

function StepOptions() {
  return (
    <StepSection number="05" title="Opciones avanzadas">
      <Stack spacing={0} divider={<Box sx={{ borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }} />}>
        {OPTION_TOGGLES.map((opt) => (
          <Stack
            key={opt.name}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ py: 1.5 }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {opt.title}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {opt.desc}
              </Typography>
            </Box>
            <Field.Switch name={opt.name} />
          </Stack>
        ))}
      </Stack>
    </StepSection>
  );
}

// ======================================================================
// SHARED — Section wrapper
// ======================================================================

function StepSection({ number, title, children }) {
  return (
    <Card
      sx={{
        mb: 3,
        p: 3,
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        boxShadow: 'none',
        bgcolor: (t) => alpha(t.palette.background.paper, 0.6),
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
            color: 'primary.main',
            fontSize: 11,
            fontWeight: 600,
            fontFamily: 'monospace',
          }}
        >
          {number}
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Box sx={{ flex: 1, borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }} />
      </Stack>
      {children}
    </Card>
  );
}

// ======================================================================
// HELPERS — structure preview
// ======================================================================

function getStructurePreview(values) {
  const { type, num_teams, teams_per_group } = values;
  if (!type || !num_teams) return { text: '', phases: [] };

  const t = parseInt(num_teams, 10);
  const gs = parseInt(teams_per_group, 10) || 4;

  if (type === 'hybrid') {
    const groups = Math.ceil(t / gs);
    const advance = Math.min(2, gs - 1);
    const koTeams = groups * advance;
    const roundName =
      koTeams <= 2
        ? 'Final'
        : koTeams <= 4
          ? 'Semifinales'
          : koTeams <= 8
            ? 'Cuartos de final'
            : 'Octavos de final';
    return {
      text: `${groups} grupos de ${gs} equipos. Los ${advance} mejores de cada grupo avanzan a ${roundName} con ${koTeams} equipos.`,
      phases: [
        { name: 'Inscripción', detail: `${t} equipos`, active: true },
        { name: 'Fase de grupos', detail: `${groups} grupos de ${gs}`, pending: true },
        { name: 'Knockout', detail: 'Se genera automáticamente', pending: true },
      ],
    };
  }

  if (type === 'league') {
    const matches = (t * (t - 1)) / 2;
    return {
      text: `${matches} partidos en total. Cada equipo juega ${t - 1} jornadas. Gana quien más puntos acumule.`,
      phases: [
        { name: 'Inscripción', detail: `${t} equipos`, active: true },
        { name: 'Round Robin', detail: `${matches} partidos`, pending: true },
      ],
    };
  }

  if (type === 'knockout') {
    const rounds = Math.ceil(Math.log2(t));
    return {
      text: `${rounds} rondas de eliminación directa. Desde los primeros partidos, perder significa quedar eliminado.`,
      phases: [
        { name: 'Inscripción', detail: `${t} equipos`, active: true },
        { name: 'Knockout', detail: `${rounds} rondas`, pending: true },
      ],
    };
  }

  return { text: '', phases: [] };
}
