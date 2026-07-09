import { z as zod } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFormContext } from 'react-hook-form';
import { useMemo, useState, useEffect, useCallback } from 'react';

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

// label values below are i18n keys, resolved via t() at render time.
const SPORT_OPTIONS = [
  { value: 'futbol', label: 'label_sport_futbol' },
  { value: 'baloncesto', label: 'label_sport_baloncesto' },
  { value: 'voleibol', label: 'label_sport_voleibol' },
  { value: 'tenis', label: 'label_sport_tenis' },
  { value: 'padel', label: 'label_sport_padel' },
  { value: 'otro', label: 'label_sport_otro' },
];

// label/desc/badge values below are i18n keys, resolved via t() at render time.
const FORMAT_OPTIONS = [
  {
    value: 'hybrid',
    label: 'label_groups_and_knockout',
    icon: '⊞ →',
    desc: 'label_format_hybrid_desc',
    badge: 'label_popular',
  },
  {
    value: 'league',
    label: 'label_format_league',
    icon: '⊞',
    desc: 'label_format_league_desc',
    badge: null,
  },
  {
    value: 'knockout',
    label: 'label_knockout',
    icon: '→',
    desc: 'label_format_knockout_desc',
    badge: null,
  },
];

const GROUP_SIZE_OPTIONS = [1, 2, 3, 4, 5, 6];

// NOTE: These default tiebreaker labels are persisted verbatim as `tiebreaker_order`
// values via the API and displayed as-is elsewhere (standings tiebreak explanations).
// Translating them here would desync the stored value from other read paths;
// left untranslated pending a backend schema change to store tiebreaker keys instead.
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

function getWizardSchema(t) {
  return zod.object({
    // Step 1
    name: zod.string().min(1, { message: t('name_required') }),
    sport: zod.string().min(1, { message: t('label_select_a_sport') }),
    location: zod.string().optional(),
    // Step 2
    type: zod.string().min(1, { message: t('label_select_a_format') }),
    teams_per_group: zod.coerce.number().int().optional(),
    legs: zod.coerce.number().int().optional(),
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
}

// label values below are i18n keys, resolved via t() at render time.
const STEPS = [
  { key: 'identity', label: 'label_step_identity', number: '01' },
  { key: 'format', label: 'label_step_format', number: '02' },
  { key: 'scoring', label: 'label_step_scoring', number: '03' },
  { key: 'tiebreakers', label: 'label_step_tiebreakers', number: '04' },
  { key: 'options', label: 'label_step_options', number: '05' },
];

// Step validation: which fields must be valid to unlock the next step
const STEP_FIELDS = {
  0: ['name', 'sport'],
  1: ['type'],
  2: ['rules.points_per_win', 'rules.points_per_draw', 'rules.points_per_loss'],
  3: [],
  4: [],
};

// ----------------------------------------------------------------------

export function TournamentCreationWizard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);

  const defaultValues = {
    name: '',
    sport: '',
    location: '',
    type: '',
    teams_per_group: 4,
    legs: 1,
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

  const WizardSchema = useMemo(() => getWizardSchema(t), [t]);

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
    if (values.name && values.sport) {
      unlocked.add(1);
      unlocked.add(2);
      unlocked.add(3);
      unlocked.add(4);
    }
    if (values.type) {
      unlocked.add(2);
      unlocked.add(3);
      unlocked.add(4);
    }
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
        location: data.location,
        type: data.type,
        teams_per_group: data.teams_per_group,
        rules: { ...data.rules, legs: data.legs },
        tiebreaker_order: data.tiebreaker_order,
        options: data.options,
      };
      const result = await createTournament(payload);
      toast.success(t('label_tournament_created_successfully'));
      navigate(paths.dashboard.tournament.details(result.id));
    } catch (error) {
      console.error(error);
      toast.error(error.message || t('label_error_creating_tournament'));
    }
  });

  // Structure preview calculations
  const structurePreview = getStructurePreview(values, t);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid
        container
        spacing={0}
        sx={{ minHeight: 'calc(100vh - 64px)', maxWidth: 1440, mx: 'auto' }}
      >
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
        <Grid
          xs={12}
          md={6.5}
          sx={{ p: { xs: 2, md: 5 }, overflowY: 'auto', maxHeight: { md: 'calc(100vh - 64px)' } }}
        >
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              {t('label_new_tournament')}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {t('label_create_your_tournament')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 480 }}>
              {t('label_tournament_wizard_intro_hint')}
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
              {t('label_previous')}
            </Button>

            {activeStep < STEPS.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleNext}
                endIcon={<Iconify icon="eva:arrow-forward-fill" />}
              >
                {t('label_next')}
              </Button>
            ) : (
              <LoadingButton
                type="submit"
                variant="contained"
                loading={isSubmitting}
                endIcon={<Iconify icon="eva:checkmark-circle-2-fill" />}
              >
                {t('label_create_tournament')}
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
          <TournamentCreationSummary values={values} structurePreview={structurePreview} />
        </Grid>
      </Grid>
    </Form>
  );
}

// ======================================================================
// STEP 1 — IDENTIDAD
// ======================================================================

function StepIdentity({ onSportChange }) {
  const { t } = useTranslation();
  const { watch } = useFormContext();
  const sport = watch('sport');

  // Sync tiebreaker labels when sport changes
  useEffect(() => {
    if (sport) onSportChange(sport);
  }, [sport, onSportChange]);

  return (
    <StepSection number="01" title={t('label_step_identity')}>
      <Stack spacing={3}>
        <Field.Text
          name="name"
          label={t('label_tournament_name')}
          placeholder={t('label_tournament_name_example')}
        />

        <Grid container spacing={2}>
          <Grid xs={12} md={6}>
            <Field.Select name="sport" label={t('label_sport')}>
              {SPORT_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </MenuItem>
              ))}
            </Field.Select>
          </Grid>
          <Grid xs={12} md={6}>
            <Field.Text
              name="location"
              label={t('label_venue_city')}
              placeholder={t('label_city_example')}
            />
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
  const { t } = useTranslation();

  return (
    <StepSection number="02" title={t('label_tournament_format')}>
      <Stack spacing={3}>
        {/* Format cards */}
        <Grid container spacing={1.5}>
          {FORMAT_OPTIONS.map((opt) => (
            <Grid xs={12} sm={4} key={opt.value}>
              <FormatCard option={opt} selected={values.type === opt.value} />
            </Grid>
          ))}
        </Grid>

        {/* Sub-parameters */}
        {values.type && (
          <Grid container spacing={2}>
            {values.type !== 'league' && values.type !== 'knockout' && (
              <Grid xs={12} md={6}>
                <Field.Select name="teams_per_group" label={t('label_teams_per_group')}>
                  {GROUP_SIZE_OPTIONS.map((n) => (
                    <MenuItem key={n} value={n}>
                      {n} {t('word_teams_lowercase')}
                    </MenuItem>
                  ))}
                </Field.Select>
              </Grid>
            )}

            {values.type !== 'knockout' && (
              <Grid xs={12} md={6}>
                <Field.Select name="legs" label={t('label_legs')}>
                  <MenuItem value={1}>{t('label_single_leg')}</MenuItem>
                  <MenuItem value={2}>{t('label_double_leg')}</MenuItem>
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
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              ✦ {t('label_structure_preview')}
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
  const { t } = useTranslation();
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
        bgcolor: (theme) =>
          selected ? alpha(theme.palette.primary.main, 0.08) : 'background.paper',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
        },
      }}
    >
      <Typography sx={{ fontSize: 22, mb: 1 }}>{option.icon}</Typography>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {t(option.label)}
      </Typography>
      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
        {t(option.desc)}
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
          {t(option.badge)}
        </Box>
      )}
    </Card>
  );
}

// ======================================================================
// STEP 3 — PUNTUACIÓN
// ======================================================================

function StepScoring({ values, setValue }) {
  const { t } = useTranslation();
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
    <StepSection number="03" title={t('label_scoring_system')}>
      <Stack spacing={3}>
        {/* Preset cards */}
        <Grid container spacing={1.5}>
          <Grid xs={12} sm={6}>
            <Card
              onClick={() => handlePreset('standard')}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: (theme) =>
                  `1.5px solid ${isStandard ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.12)}`,
                bgcolor: isStandard
                  ? (theme) => alpha(theme.palette.primary.main, 0.08)
                  : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="subtitle2">{t('label_standard_fifa')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('label_standard_scoring_example')}
              </Typography>
            </Card>
          </Grid>
          <Grid xs={12} sm={6}>
            <Card
              onClick={() => handlePreset('custom')}
              sx={{
                p: 2,
                cursor: 'pointer',
                border: (theme) =>
                  `1.5px solid ${!isStandard ? theme.palette.primary.main : alpha(theme.palette.grey[500], 0.12)}`,
                bgcolor: !isStandard
                  ? (theme) => alpha(theme.palette.primary.main, 0.08)
                  : 'background.paper',
                transition: 'all 0.2s',
              }}
            >
              <Typography variant="subtitle2">{t('label_custom')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('label_define_custom_scoring_hint')}
              </Typography>
            </Card>
          </Grid>
        </Grid>

        {/* Scoring inputs */}
        <Grid container spacing={2}>
          <Grid xs={4}>
            <ScoringInput label={t('label_victory')} name="rules.points_per_win" />
          </Grid>
          <Grid xs={4}>
            <ScoringInput label={t('label_tie')} name="rules.points_per_draw" />
          </Grid>
          <Grid xs={4}>
            <ScoringInput label={t('label_defeat')} name="rules.points_per_loss" />
          </Grid>
        </Grid>
      </Stack>
    </StepSection>
  );
}

function ScoringInput({ label, name }) {
  return (
    <Card
      sx={{
        p: 2,
        textAlign: 'center',
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
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
        inputProps={{
          min: 0,
          max: 9,
          style: { textAlign: 'center', fontSize: 28, fontWeight: 600 },
        }}
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
  const { t } = useTranslation();
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
    <StepSection number="04" title={t('label_tiebreaker_criteria')}>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2.5, lineHeight: 1.7 }}>
        {t('label_tiebreaker_criteria_hint')}
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
              border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
              transition: 'all 0.2s',
              opacity: dragIndex === index ? 0.4 : 1,
              '&:hover': {
                borderColor: (theme) => alpha(theme.palette.grey[500], 0.24),
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

// title/desc values below are i18n keys, resolved via t() at render time.
const OPTION_TOGGLES = [
  {
    name: 'options.public_registration',
    title: 'label_option_public_registration_title',
    desc: 'label_option_public_registration_desc',
  },
  {
    name: 'options.individual_stats',
    title: 'label_option_individual_stats_title',
    desc: 'label_option_individual_stats_desc',
  },
  {
    name: 'options.public_results',
    title: 'label_option_public_results_title',
    desc: 'label_option_public_results_desc',
  },
  {
    name: 'options.email_notifications',
    title: 'label_option_email_notifications_title',
    desc: 'label_option_email_notifications_desc',
  },
  {
    name: 'options.extra_time',
    title: 'label_option_extra_time_title',
    desc: 'label_option_extra_time_desc',
  },
];

function StepOptions() {
  const { t } = useTranslation();
  return (
    <StepSection number="05" title={t('label_advanced_options')}>
      <Stack
        spacing={0}
        divider={
          <Box
            sx={{ borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}` }}
          />
        }
      >
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
                {t(opt.title)}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t(opt.desc)}
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
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        boxShadow: 'none',
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.6),
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
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
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
        <Box
          sx={{
            flex: 1,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          }}
        />
      </Stack>
      {children}
    </Card>
  );
}

// ======================================================================
// HELPERS — structure preview
// ======================================================================

function getStructurePreview(values, t) {
  const { type, teams_per_group } = values;
  if (!type) return { text: '', phases: [] };

  const gs = parseInt(teams_per_group, 10) || 4;

  if (type === 'hybrid') {
    return {
      text: `${t('label_structure_hybrid_prefix')} ${gs} ${t('word_teams_lowercase')} ${t('label_structure_hybrid_suffix')}`,
      phases: [
        { name: t('label_inscription'), detail: t('label_dynamic_teams'), active: true },
        {
          name: t('label_group_stage'),
          detail: `${gs} ${t('word_teams_lowercase')}/${t('label_group_singular_lowercase')}`,
          pending: true,
        },
        { name: 'Knockout', detail: t('label_generated_automatically'), pending: true },
      ],
    };
  }

  if (type === 'league') {
    return {
      text: t('label_structure_league_text'),
      phases: [
        { name: t('label_inscription'), detail: t('label_dynamic_teams'), active: true },
        { name: 'Round Robin', detail: t('label_round_robin_detail'), pending: true },
      ],
    };
  }

  if (type === 'knockout') {
    return {
      text: t('label_structure_knockout_text'),
      phases: [
        { name: t('label_inscription'), detail: t('label_dynamic_teams'), active: true },
        { name: 'Knockout', detail: t('label_direct_elimination'), pending: true },
      ],
    };
  }

  return { text: '', phases: [] };
}
