import { z as zod } from 'zod';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
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

import { useGetTours } from 'src/actions/tours';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { createVotation, previewCandidates as apiPreviewCandidates } from 'src/actions/votation';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { VotationCreationStepper } from './votation-creation-stepper';

// ----------------------------------------------------------------------

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const STEPS = [
  { key: 'config', label: 'Configuración', number: '01' },
  { key: 'candidatos', label: 'Candidatos', number: '02' },
  { key: 'confirmar', label: 'Confirmar', number: '03' },
];

const WizardSchema = zod.object({
  month: zod.string().min(1, 'Selecciona un mes'),
  min_pct: zod.coerce.number().int().min(0).max(100),
});

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
    tours.forEach((t) => {
      const d = t.available?.startDate ? new Date(t.available.startDate) : null;
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!seen.has(key)) {
        seen.add(key);
        options.push({ value: key, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
      }
    });
    return options.sort((a, b) => a.value.localeCompare(b.value));
  }, [tours]);

  const methods = useForm({
    resolver: zodResolver(WizardSchema),
    defaultValues: { month: '', min_pct: 70 },
    mode: 'onChange',
  });

  const { watch, trigger, handleSubmit, formState: { isSubmitting } } = methods;
  const values = watch();

  const eligibleCount = candidates.filter((c) => c.eligible).length;

  const getUnlockedSteps = useCallback(() => {
    const unlocked = new Set([0]);
    if (values.month) {
      unlocked.add(1);
      if (candidates.length > 0) unlocked.add(2);
    }
    return unlocked;
  }, [values.month, candidates.length]);

  const unlockedSteps = getUnlockedSteps();

  const handleStepClick = useCallback(
    (step) => {
      if (unlockedSteps.has(step)) setActiveStep(step);
    },
    [unlockedSteps]
  );

  const handleNext = useCallback(async () => {
    if (activeStep === 0) {
      const valid = await trigger(['month', 'min_pct']);
      if (!valid) return;
      setLoadingPreview(true);
      try {
        const computed = await apiPreviewCandidates(
          selectedWorkspace?.id,
          values.month,
          values.min_pct
        );
        setCandidates(computed);
      } catch {
        toast.error('Error al obtener candidatos');
        return;
      } finally {
        setLoadingPreview(false);
      }
    }
    setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  }, [activeStep, trigger, selectedWorkspace?.id, values.month, values.min_pct]);

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
      const monthLabel = monthOptions.find((o) => o.value === data.month)?.label || data.month;
      const payload = {
        workspace_id: selectedWorkspace?.id,
        month: data.month,
        min_pct: data.min_pct,
        candidates: candidates.filter((c) => c.eligible).map((c) => ({
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
      const created = await createVotation(payload, selectedWorkspace?.id);
      toast.success('¡Votación abierta exitosamente!');
      // Pass month label via state since the API doesn't store it
      navigate(paths.dashboard.votaciones.detail(created.id), {
        state: { votationId: created.id, monthLabel },
      });
    } catch (error) {
      toast.error('Error al abrir la votación');
    }
  });

  // Stepper step values for the sidebar
  const stepValues = {
    config: values.month
      ? `${monthOptions.find((o) => o.value === values.month)?.label || values.month} · min ${values.min_pct}%`
      : '—',
    candidatos: candidates.length > 0 ? `${eligibleCount} elegibles` : '—',
    confirmar: eligibleCount > 0 ? 'Listo' : '—',
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
              Nueva votación
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Jugador del mes.
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520 }}>
              Selecciona el mes y el umbral mínimo de asistencia. El sistema calculará los candidatos
              automáticamente a partir de los datos de entrenamiento.
            </Typography>
          </Box>

          {/* Step 1 — Config */}
          {activeStep === 0 && (
            <StepConfig monthOptions={monthOptions} />
          )}

          {/* Step 2 — Candidates */}
          {activeStep === 1 && (
            <StepCandidates
              candidates={candidates}
              onToggle={handleToggleEligible}
            />
          )}

          {/* Step 3 — Confirm */}
          {activeStep === 2 && (
            <StepConfirm
              monthLabel={monthOptions.find((o) => o.value === values.month)?.label || values.month}
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
                color="primary"
                loading={isSubmitting}
                disabled={eligibleCount === 0}
                startIcon={<Iconify icon="solar:cup-star-bold" />}
              >
                Abrir Votación
              </LoadingButton>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Form>
  );
}

// ----------------------------------------------------------------------

function StepConfig({ monthOptions }) {
  return (
    <Stack spacing={3} sx={{ maxWidth: 480 }}>
      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Mes de evaluación
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Se calcularán las asistencias de entrenamiento en este mes.
        </Typography>
        <Field.Select name="month" label="Mes" size="medium">
          {monthOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </Field.Select>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ mb: 0.5 }}>
          Asistencia mínima
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Solo los jugadores con este % de asistencia o más serán candidatos.
        </Typography>
        <Field.Text
          name="min_pct"
          label="Asistencia mínima (%)"
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
  if (candidates.length === 0) {
    return (
      <Box
        sx={{
          py: 8,
          textAlign: 'center',
          border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.2)}`,
          borderRadius: 2,
        }}
      >
        <Iconify icon="solar:users-group-rounded-bold" width={48} sx={{ color: 'text.disabled', mb: 2 }} />
        <Typography variant="h6" sx={{ color: 'text.secondary' }}>
          Sin candidatos
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
          Ningún jugador alcanzó el umbral mínimo de asistencia. Vuelve atrás y ajusta los parámetros.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {candidates.filter((c) => c.eligible).length} de {candidates.length} candidatos elegibles.
        Desactiva los jugadores que no deben participar.
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
      <Typography variant="caption" sx={{ color: 'text.secondary', width: 88, flexShrink: 0, fontSize: '0.7rem' }}>
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
          <Box sx={{ width: `${pct}%`, height: '100%', bgcolor: color, borderRadius: 1, transition: 'width 0.4s' }} />
        </Box>
      </Box>
      <Typography variant="caption" fontWeight={700} sx={{ color, width: 30, textAlign: 'right', flexShrink: 0, fontSize: '0.7rem' }}>
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
      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.58rem', lineHeight: 1 }}>
        {label}
      </Typography>
    </Stack>
  );
}

function CandidateCard({ candidate, onToggle }) {
  return (
    <Card
      sx={{
        p: 2.5,
        border: (t) =>
          `1px solid ${candidate.eligible ? alpha(t.palette.primary.main, 0.2) : alpha(t.palette.grey[500], 0.12)}`,
        opacity: candidate.eligible ? 1 : 0.45,
        transition: 'all 0.2s',
        cursor: 'pointer',
        '&:hover': { borderColor: (t) => alpha(t.palette.primary.main, 0.4) },
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
            <Iconify icon="eva:checkmark-circle-2-fill" width={18} sx={{ color: 'primary.main', flexShrink: 0 }} />
          ) : (
            <Iconify icon="solar:close-circle-bold" width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
          )}
        </Stack>

        {/* Attendance rows */}
        <Stack spacing={0.5}>
          <WizardAttendanceRow icon="solar:dumbbell-bold" label="Entrenamientos" pct={candidate.training_pct} />
          <WizardAttendanceRow icon="solar:running-round-bold" label="Partidos" pct={candidate.match_pct ?? 0} />
        </Stack>

        {/* Performance stats */}
        <Stack direction="row" spacing={1.5}>
          <WizardStatChip icon="solar:football-bold" label="Goles" value={candidate.goals || 0} />
          <WizardStatChip icon="mdi:shoe-cleat" label="Asist." value={candidate.assists || 0} />
          {(candidate.mvp ?? 0) > 0 && (
            <WizardStatChip icon="solar:medal-ribbons-star-bold" label="MVP" value={candidate.mvp} color="warning.main" />
          )}
        </Stack>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function StepConfirm({ monthLabel, minPct, candidates }) {
  const eligible = candidates.filter((c) => c.eligible);

  return (
    <Stack spacing={3} sx={{ maxWidth: 520 }}>
      <Card
        sx={{
          p: 3,
          border: (t) => `1px solid ${alpha(t.palette.primary.main, 0.16)}`,
          bgcolor: (t) => alpha(t.palette.primary.main, 0.02),
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', letterSpacing: 0.5, fontSize: '0.7rem', textTransform: 'uppercase' }}>
          Resumen de la votación
        </Typography>

        <Stack spacing={1.5}>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Mes</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{monthLabel}</Typography>
          </Stack>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Asistencia mínima</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>{minPct}%</Typography>
          </Stack>
          <Divider />
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>Candidatos elegibles</Typography>
            <Label color="primary">{eligible.length}</Label>
          </Stack>
        </Stack>
      </Card>

      {eligible.length > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Candidatos que participarán
          </Typography>
          <Stack spacing={1}>
            {eligible.map((c) => (
              <Stack key={c.id} direction="row" alignItems="center" spacing={1.5}>
                <Avatar src={c.avatar_url} alt={c.name} sx={{ width: 32, height: 32, fontSize: '0.8rem' }}>
                  {c.name?.charAt(0)}
                </Avatar>
                <Typography variant="body2" sx={{ flex: 1 }}>{c.name}</Typography>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    color:
                      c.training_pct >= 80 ? 'success.main' : c.training_pct >= 50 ? 'warning.main' : 'error.main',
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
            border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.2)}`,
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            No hay candidatos elegibles. Vuelve al paso anterior y activa al menos un candidato.
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
