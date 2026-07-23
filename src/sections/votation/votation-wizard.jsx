import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { alpha, useTheme } from '@mui/material/styles';

import { paths } from 'src/routes/paths';

import { fIsAfter } from 'src/utils/format-time';

import { useGetTours } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { createVotation, previewCandidates as apiPreviewCandidates } from 'src/actions/votation';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { formStateToPeriodLabel } from './votation-utils';
import { VotationCreationStepper } from './votation-creation-stepper';

// ----------------------------------------------------------------------

// values below are i18n keys, resolved via t() at render time.
const MONTH_NAMES = [
  'month_jan_full',
  'month_feb_full',
  'month_mar_full',
  'month_apr_full',
  'month_may_full',
  'month_jun_full',
  'month_jul_full',
  'month_aug_full',
  'month_sep_full',
  'month_oct_full',
  'month_nov_full',
  'month_dec_full',
];

// label values below are i18n keys, resolved via t() at render time; `key` is a real
// data-matching identifier (indexes stepValues) and must stay unchanged.
const STEPS = [
  { key: 'config', label: 'label_step_config', number: '01' },
  { key: 'candidatos', label: 'label_candidates', number: '02' },
  { key: 'confirmar', label: 'label_confirm', number: '03' },
];

function getWizardSchema(t) {
  return zod
    .object({
      period_type: zod.enum(['month', 'semester']),
      month: zod.string().optional(),
      start_date: zod.union([zod.number(), zod.string(), zod.date(), zod.null()]).optional(),
      end_date: zod.union([zod.number(), zod.string(), zod.date(), zod.null()]).optional(),
      min_pct: zod.coerce.number().int().min(0).max(100),
    })
    .superRefine((data, ctx) => {
      if (data.period_type === 'month') {
        if (!data.month) {
          ctx.addIssue({
            code: zod.ZodIssueCode.custom,
            message: t('label_select_a_month'),
            path: ['month'],
          });
        }
        return;
      }
      if (!data.start_date) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: t('label_select_a_start_date'),
          path: ['start_date'],
        });
      }
      if (!data.end_date) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: t('label_select_an_end_date'),
          path: ['end_date'],
        });
      }
      if (data.start_date && data.end_date && !fIsAfter(data.end_date, data.start_date)) {
        ctx.addIssue({
          code: zod.ZodIssueCode.custom,
          message: t('label_end_date_must_be_later'),
          path: ['end_date'],
        });
      }
    });
}

function getDateParts(startDate) {
  if (!startDate) return null;
  try {
    const d = new Date(startDate);
    return { year: d.getFullYear(), month: d.getMonth() };
  } catch {
    return null;
  }
}

// ----------------------------------------------------------------------

export function VotationWizard() {
  const { t } = useTranslation();
  const theme = useTheme();
  const navigate = useNavigate();
  const { selectedWorkspace } = useWorkspace();
  const { tours } = useGetTours(selectedWorkspace?.id, 'training');

  const [activeStep, setActiveStep] = useState(0);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [candidates, setCandidates] = useState([]);

  const monthOptions = useMemo(() => {
    const seen = new Set();
    const options = [];
    tours.forEach((tour) => {
      const d = tour.available?.startDate ? new Date(tour.available.startDate) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({ value: key, label: `${t(MONTH_NAMES[d.getMonth()])} ${d.getFullYear()}` });
      }
    });
    return options.sort((a, b) => a.value.localeCompare(b.value));
  }, [tours, t]);

  const WizardSchema = useMemo(() => getWizardSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(WizardSchema),
    defaultValues: {
      period_type: 'month',
      month: '',
      start_date: null,
      end_date: null,
      min_pct: 70,
    },
    mode: 'onChange',
  });

  const {
    watch,
    trigger,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;
  const values = watch();

  const eligibleCount = candidates.filter((c) => c.eligible).length;

  const hasPeriodSelected =
    values.period_type === 'semester' ? !!(values.start_date && values.end_date) : !!values.month;

  const getUnlockedSteps = useCallback(() => {
    const unlocked = new Set([0]);
    if (hasPeriodSelected) {
      unlocked.add(1);
      if (candidates.length > 0) unlocked.add(2);
    }
    return unlocked;
  }, [hasPeriodSelected, candidates.length]);

  const unlockedSteps = getUnlockedSteps();

  const handleStepClick = useCallback(
    (step) => {
      if (unlockedSteps.has(step)) setActiveStep(step);
    },
    [unlockedSteps]
  );

  const handleNext = useCallback(async () => {
    if (activeStep === 0) {
      const isSemester = values.period_type === 'semester';
      const valid = await trigger(
        isSemester
          ? ['period_type', 'start_date', 'end_date', 'min_pct']
          : ['period_type', 'month', 'min_pct']
      );
      if (!valid) return;
      setLoadingPreview(true);
      try {
        const periodParams = isSemester
          ? {
              period_type: 'semester',
              start_date: dayjs(values.start_date).format('YYYY-MM-DD'),
              end_date: dayjs(values.end_date).format('YYYY-MM-DD'),
            }
          : { period_type: 'month', month: values.month };
        const computed = await apiPreviewCandidates(
          selectedWorkspace?.id,
          values.min_pct,
          periodParams
        );
        setCandidates(computed);
      } catch {
        toast.error(t('label_error_fetching_candidates'));
        return;
      } finally {
        setLoadingPreview(false);
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [
    activeStep,
    trigger,
    selectedWorkspace?.id,
    values.period_type,
    values.month,
    values.start_date,
    values.end_date,
    values.min_pct,
    t,
  ]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const handleToggleEligible = useCallback((candidateId) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidateId ? { ...c, eligible: !c.eligible } : c))
    );
  }, []);

  const onSubmit = handleSubmit(async (data) => {
    try {
      const periodLabelText = formStateToPeriodLabel(data, monthOptions, t);
      const payload = {
        workspace_id: selectedWorkspace?.id,
        period_type: data.period_type,
        min_pct: data.min_pct,
        candidates: candidates
          .filter((c) => c.eligible)
          .map((c) => ({
            id: c.id,
            name: c.name,
            avatar_url: c.avatar_url,
            training_pct: c.training_pct,
            match_pct: c.match_pct ?? 0,
            goals: c.goals || 0,
            assists: c.assists || 0,
            mvp: c.mvp || 0,
            eligible: true,
          })),
      };
      if (data.period_type === 'semester') {
        payload.start_date = dayjs(data.start_date).format('YYYY-MM-DD');
        payload.end_date = dayjs(data.end_date).format('YYYY-MM-DD');
      } else {
        payload.month = data.month;
      }
      const created = await createVotation(payload, selectedWorkspace?.id);
      toast.success(t('label_votation_opened_successfully'));
      // Pass the period label via state since the API doesn't store a rendered label
      navigate(paths.dashboard.votaciones.detail(created.id), {
        state: { votationId: created.id, periodLabel: periodLabelText },
      });
    } catch (error) {
      toast.error(t('label_error_opening_votation'));
    }
  });

  // Stepper step values for the sidebar
  const stepValues = {
    config: hasPeriodSelected
      ? `${formStateToPeriodLabel(values, monthOptions, t)} · ${t('word_min')} ${values.min_pct}%`
      : '—',
    candidatos: candidates.length > 0 ? `${eligibleCount} ${t('label_eligible_plural')}` : '—',
    confirmar: eligibleCount > 0 ? t('label_ready') : '—',
  };

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
          <VotationCreationStepper
            steps={STEPS}
            activeStep={activeStep}
            unlockedSteps={unlockedSteps}
            stepValues={stepValues}
            onStepClick={handleStepClick}
          />
        </Grid>

        {/* MAIN CONTENT */}
        <Grid
          xs={12}
          md={9.5}
          sx={{
            p: { xs: 2, md: 5 },
            overflowY: 'auto',
            maxHeight: { md: 'calc(100vh - 64px)' },
          }}
        >
          <Box sx={{ mb: 5 }}>
            <Typography
              variant="overline"
              sx={{ color: 'primary.main', letterSpacing: 2, mb: 1, display: 'block' }}
            >
              {t('label_new_votation_overline')}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              {t(
                values.period_type === 'semester'
                  ? 'label_player_of_the_semester_period'
                  : 'label_player_of_the_month_period'
              )}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520 }}>
              {t('label_wizard_intro_body')}
            </Typography>
          </Box>

          {/* Step 1 — Config */}
          {activeStep === 0 && (
            <StepConfig monthOptions={monthOptions} periodType={values.period_type} />
          )}

          {/* Step 2 — Candidates */}
          {activeStep === 1 && (
            <StepCandidates candidates={candidates} onToggle={handleToggleEligible} />
          )}

          {/* Step 3 — Confirm */}
          {activeStep === 2 && (
            <StepConfirm
              periodLabel={formStateToPeriodLabel(values, monthOptions, t)}
              periodType={values.period_type}
              minPct={values.min_pct}
              candidates={candidates}
            />
          )}

          {/* Nav buttons */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 5 }}>
            <Button
              variant="outlined"
              onClick={handleBack}
              disabled={activeStep === 0}
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
                color="primary"
                loading={isSubmitting}
                disabled={eligibleCount === 0}
                startIcon={<Iconify icon="solar:cup-star-bold" />}
              >
                {t('label_open_votation')}
              </LoadingButton>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}

// ----------------------------------------------------------------------

function StepConfig({ monthOptions, periodType }) {
  const { t } = useTranslation();
  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('label_votation_type')}
        </Typography>
        <Field.RadioGroup
          row
          name="period_type"
          options={[
            { label: t('label_votation_type_monthly'), value: 'month' },
            { label: t('label_votation_type_semester'), value: 'semester' },
          ]}
        />
      </Box>

      {periodType === 'semester' ? (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            {t('label_evaluation_period')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('label_training_attendance_calculated_note_period')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Field.DatePicker name="start_date" label={t('start_date')} />
            <Field.DatePicker name="end_date" label={t('end_date')} />
          </Stack>
        </Box>
      ) : (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
            {t('label_evaluation_month')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('label_training_attendance_calculated_note')}
          </Typography>
          <Field.Select name="month" label={t('label_month')} size="medium">
            {monthOptions.map((opt) => (
              <MenuItem key={opt.value} value={opt.value}>
                {opt.label}
              </MenuItem>
            ))}
          </Field.Select>
        </Box>
      )}

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          {t('label_minimum_attendance')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          {t('label_min_attendance_candidates_note')}
        </Typography>
        <Field.Text
          name="min_pct"
          label={t('label_minimum_attendance_pct')}
          type="number"
          size="medium"
          inputProps={{ min: 0, max: 100 }}
          sx={{ width: 200 }}
        />
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function StepCandidates({ candidates, onToggle }) {
  const { t } = useTranslation();
  if (candidates.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
          borderRadius: 2,
        }}
      >
        <Iconify
          icon="solar:users-group-rounded-bold"
          width={48}
          sx={{ color: 'text.disabled', mb: 2 }}
        />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          {t('label_no_candidates')}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
          {t('label_no_candidates_body')}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {candidates.filter((c) => c.eligible).length} {t('label_of')} {candidates.length}{' '}
        {t('label_eligible_candidates')}. {t('label_deactivate_players_note')}
      </Typography>
      <Grid container spacing={2}>
        {candidates.map((candidate) => (
          <Grid key={candidate.id} xs={12} sm={6} md={4}>
            <CandidateCard candidate={candidate} onToggle={onToggle} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

// ----------------------------------------------------------------------

function WizardAttendanceRow({ icon, label, pct }) {
  const color = pct >= 80 ? 'success.main' : pct >= 50 ? 'warning.main' : 'error.main';
  return (
    <Stack direction="row" alignItems="center" spacing={0.75}>
      <Iconify icon={icon} width={13} sx={{ color: 'text.disabled', flexShrink: 0 }} />
      <Typography
        variant="caption"
        sx={{ color: 'text.secondary', width: 88, flexShrink: 0, fontSize: '0.7rem' }}
      >
        {label}
      </Typography>
      <Box sx={{ flex: 1 }}>
        <Box
          sx={{
            height: 4,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              width: `${pct}%`,
              height: '100%',
              bgcolor: color,
              borderRadius: 1,
              transition: 'width 0.4s',
            }}
          />
        </Box>
      </Box>
      <Typography
        variant="caption"
        fontWeight={700}
        sx={{ color, width: 30, textAlign: 'right', flexShrink: 0, fontSize: '0.7rem' }}
      >
        {pct}%
      </Typography>
    </Stack>
  );
}

function WizardStatChip({ icon, label, value, color = 'text.secondary' }) {
  return (
    <Stack alignItems="center" spacing={0.2} sx={{ minWidth: 36 }}>
      <Iconify icon={icon} width={14} sx={{ color }} />
      <Typography variant="caption" fontWeight={700} sx={{ color, fontSize: '0.7rem' }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', fontSize: '0.58rem', lineHeight: 1 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function CandidateCard({ candidate, onToggle }) {
  const { t } = useTranslation();
  return (
    <Card
      sx={{
        p: 2.5,
        border: (theme) =>
          `1px solid ${candidate.eligible ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.grey[500], 0.12)}`,
        opacity: candidate.eligible ? 1 : 0.45,
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': { borderColor: (theme) => alpha(theme.palette.primary.main, 0.4) },
      }}
      onClick={() => onToggle(candidate.id)}
    >
      <Stack spacing={1.25}>
        {/* Header: avatar + name + eligible toggle */}
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Avatar
            src={candidate.avatar_url}
            alt={candidate.name}
            sx={{ width: 40, height: 40, flexShrink: 0, fontSize: '0.95rem' }}
          >
            {candidate.name?.charAt(0)}
          </Avatar>
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ flex: 1, textDecoration: candidate.eligible ? 'none' : 'line-through' }}
          >
            {candidate.name}
          </Typography>
          {candidate.eligible ? (
            <Iconify
              icon="eva:checkmark-circle-2-fill"
              width={18}
              sx={{ color: 'primary.main', flexShrink: 0 }}
            />
          ) : (
            <Iconify
              icon="solar:close-circle-bold"
              width={18}
              sx={{ color: 'text.disabled', flexShrink: 0 }}
            />
          )}
        </Stack>

        {/* Attendance rows */}
        <Stack spacing={0.5}>
          <WizardAttendanceRow
            icon="solar:dumbbell-bold"
            label={t('label_trainings')}
            pct={candidate.training_pct}
          />
          <WizardAttendanceRow
            icon="solar:running-round-bold"
            label={t('word_matches')}
            pct={candidate.match_pct ?? 0}
          />
        </Stack>

        {/* Performance stats */}
        <Stack direction="row" spacing={1.5}>
          <WizardStatChip
            icon="solar:football-bold"
            label={t('word_goals')}
            value={candidate.goals || 0}
          />
          <WizardStatChip
            icon="mdi:shoe-cleat"
            label={t('label_assists_abbr_cap')}
            value={candidate.assists || 0}
          />
          {(candidate.mvp ?? 0) > 0 && (
            <WizardStatChip
              icon="solar:medal-ribbons-star-bold"
              label="MVP"
              value={candidate.mvp}
              color="warning.main"
            />
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function StepConfirm({ periodLabel, periodType, minPct, candidates }) {
  const { t } = useTranslation();
  const eligible = candidates.filter((c) => c.eligible);

  return (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <Card
        sx={{
          p: 3,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{
            mb: 2,
            color: 'text.secondary',
            letterSpacing: 0.5,
            fontSize: '0.7rem',
            textTransform: 'uppercase',
          }}
        >
          {t('label_votation_summary')}
        </Typography>

        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t(periodType === 'semester' ? 'label_evaluation_period' : 'label_month')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {periodLabel}
            </Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('label_minimum_attendance')}
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {minPct}%
            </Typography>
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('label_eligible_candidates')}
            </Typography>
            <Label color="primary">{eligible.length}</Label>
          </Stack>
        </Stack>
      </Card>

      {eligible.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('label_participating_candidates')}
          </Typography>
          <Stack spacing={1}>
            {eligible.map((c) => (
              <Stack key={c.id} direction="row" alignItems="center" spacing={1.5}>
                <Avatar
                  src={c.avatar_url}
                  alt={c.name}
                  sx={{ width: 32, height: 32, fontSize: '0.8rem' }}
                >
                  {c.name?.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ flex: 1 }}>
                  {c.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color:
                      c.training_pct >= 80
                        ? 'success.main'
                        : c.training_pct >= 50
                          ? 'warning.main'
                          : 'error.main',
                  }}
                >
                  {c.training_pct}%
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Box>
      )}

      {eligible.length === 0 && (
        <Box
          sx={{
            p: 3,
            textAlign: 'center',
            border: (theme) => `1px dashed ${alpha(theme.palette.grey[500], 0.2)}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            {t('label_no_eligible_candidates_note')}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
