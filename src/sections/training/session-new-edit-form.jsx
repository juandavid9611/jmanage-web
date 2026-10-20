import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRef, useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uuidv4 } from 'src/utils/uuidv4';
import { fTimestamp } from 'src/utils/format-time';

import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  sendTrainingSession,
  createTrainingSession,
  updateTrainingSession,
} from 'src/actions/training-sessions';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { ExerciseCard } from './exercise-card';

// ----------------------------------------------------------------------

export function getSessionSchema(t) {
  return zod.object({
    title: zod.string().min(1, { message: t('title_required') }),
    date: zod.union([zod.string(), zod.number()]),
    location: zod.string().optional(),
    teamGroup: zod.string().optional(),
    objective: zod.string().optional(),
  });
}

function emptyExercise() {
  return {
    id: uuidv4(),
    name: '',
    durationMinutes: '',
    instructions: '',
    diagram: { pitchMode: 'half', tokens: [], arrows: [], zones: [] },
  };
}

// ----------------------------------------------------------------------

export function SessionNewEditForm({ currentSession }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();

  const [exercises, setExercises] = useState(currentSession?.exercises?.length ? currentSession.exercises : [emptyExercise()]);

  const SessionSchema = useMemo(() => getSessionSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      title: currentSession?.title || '',
      date: currentSession?.date ? new Date(currentSession.date).getTime() : Date.now(),
      location: currentSession?.location || '',
      teamGroup: currentSession?.teamGroup || '',
      objective: currentSession?.objective || '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const boardApisRef = useRef({});
  const [exportingPdf, setExportingPdf] = useState(false);

  const handleAddExercise = useCallback(() => {
    setExercises((prev) => [...prev, emptyExercise()]);
  }, []);

  const handleChangeExercise = useCallback((updated) => {
    setExercises((prev) => prev.map((exercise) => (exercise.id === updated.id ? updated : exercise)));
  }, []);

  const handleRemoveExercise = useCallback((id) => {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  }, []);

  const handleDuplicateExercise = useCallback((id) => {
    setExercises((prev) => {
      const index = prev.findIndex((exercise) => exercise.id === id);
      if (index === -1) return prev;
      const clone = { ...prev[index], id: uuidv4() };
      return [...prev.slice(0, index + 1), clone, ...prev.slice(index + 1)];
    });
  }, []);

  const handleBoardMount = useCallback((exerciseId, api) => {
    if (api) boardApisRef.current[exerciseId] = api;
    else delete boardApisRef.current[exerciseId];
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!exercises.length) return;
    setExportingPdf(true);
    try {
      const [{ pdf }, { SessionPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('./session-pdf-document'),
      ]);
      const items = await Promise.all(
        exercises.map(async (exercise) => ({
          exercise,
          dataUrl: await boardApisRef.current[exercise.id]?.getPngDataUrl().catch(() => null),
        }))
      );
      const values = methods.getValues();
      const blob = await pdf(
        <SessionPdfDocument
          session={{
            title: values.title,
            date: values.date,
            location: values.location,
            teamGroup: values.teamGroup,
            objective: values.objective,
          }}
          items={items}
        />
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${(values.title || 'sesion').trim().replace(/\s+/g, '_')}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      toast.error(t('label_pdf_export_error'));
    } finally {
      setExportingPdf(false);
    }
  }, [exercises, methods, t]);

  const persist = useCallback(
    async (data, status) => {
      if (status === 'sent' && !exercises.some((exercise) => exercise.name?.trim())) {
        toast.error(t('label_session_needs_exercise'));
        return;
      }

      const payload = {
        title: data.title,
        date: new Date(fTimestamp(data.date)).toISOString(),
        location: data.location || '',
        teamGroup: data.teamGroup || '',
        objective: data.objective || '',
        exercises: exercises.map((exercise) => ({
          ...exercise,
          durationMinutes: Number(exercise.durationMinutes) || 0,
        })),
      };

      // A session with several multi-step sequences, or any freehand-heavy
      // diagram, can approach the API's payload-size limit — catch that
      // here with a specific message instead of letting the save fail with
      // a generic error after the fact.
      const MAX_PAYLOAD_BYTES = 290 * 1024;
      const payloadBytes = new Blob([JSON.stringify(payload)]).size;
      if (payloadBytes > MAX_PAYLOAD_BYTES) {
        toast.error(t('label_session_too_large', { size: Math.round(payloadBytes / 1024) }));
        return;
      }

      try {
        const saved = currentSession?.id
          ? await updateTrainingSession({ ...payload, id: currentSession.id }, selectedWorkspace?.id)
          : await createTrainingSession(payload, selectedWorkspace?.id);

        if (status === 'sent') {
          try {
            await sendTrainingSession(saved.id, selectedWorkspace?.id);
          } catch (sendError) {
            // The draft is saved; only the submission failed. Stay on the form.
            console.error(sendError);
            toast.error(sendError.message || t('label_session_action_error'));
            // avoid a second "create" on retry: continue on the saved draft
            if (!currentSession?.id) router.replace(paths.dashboard.trainingSessions.edit(saved.id));
            return;
          }
        }

        toast.success(currentSession?.id ? t('update_success') : t('create_success'));
        // Saving never changes status (a rejected session stays rejected until
        // it is sent again), so land on the tab where the session really is.
        const landingStatus = status === 'sent' ? 'sent' : saved.status;
        router.push(`${paths.dashboard.trainingSessions.list}?status=${landingStatus}`);
      } catch (error) {
        console.error(error);
        toast.error(error.message || t('label_session_action_error'));
      }
    },
    [currentSession?.id, exercises, router, selectedWorkspace?.id, t]
  );

  const onSaveDraft = handleSubmit((data) => persist(data, 'draft'));
  const onSendToAdmin = handleSubmit((data) => persist(data, 'sent'));

  return (
    <Form methods={methods} onSubmit={onSaveDraft}>
      <Stack spacing={3}>
        <Card sx={{ p: 3, borderRadius: 2.5 }}>
          <Stack spacing={3}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'primary.lighter',
                }}
              >
                <Iconify icon="solar:clipboard-text-bold" width={20} sx={{ color: 'primary.dark' }} />
              </Box>
              <Typography variant="subtitle1">{t('label_session_general_info')}</Typography>
            </Stack>

            <Field.Text
              name="title"
              label={t('label_session_title')}
              variant="standard"
              sx={{ '& .MuiInputBase-input': { fontSize: 22, fontWeight: 800 } }}
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Field.MobileDateTimePicker name="date" label={t('start_date')} />

              <Field.Text
                name="location"
                label={t('label_location')}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Iconify icon="solar:map-point-bold" sx={{ color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Field.Text
                  name="teamGroup"
                  label={t('label_team_group')}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Iconify icon="solar:users-group-rounded-bold" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              <Box sx={{ gridColumn: '1 / -1' }}>
                <Field.Text
                  name="objective"
                  label={t('label_objective')}
                  multiline
                  rows={2}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.75 }}>
                        <Iconify icon="solar:target-bold" sx={{ color: 'text.disabled' }} />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Stack>
        </Card>

        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            onChange={handleChangeExercise}
            onRemove={() => handleRemoveExercise(exercise.id)}
            onDuplicate={() => handleDuplicateExercise(exercise.id)}
            onBoardMount={handleBoardMount}
          />
        ))}

        <Button
          type="button"
          fullWidth
          size="large"
          color="inherit"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddExercise}
          sx={{
            py: 1.75,
            borderRadius: 2.5,
            borderStyle: 'dashed',
            borderWidth: 2,
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.lighter' },
          }}
          variant="outlined"
        >
          {t('label_add_exercise')}
        </Button>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
          <LoadingButton
            type="button"
            variant="outlined"
            color="inherit"
            loading={exportingPdf}
            startIcon={<Iconify icon="mdi:file-pdf-box" />}
            onClick={handleExportPdf}
          >
            {t('label_export_pdf')}
          </LoadingButton>

          <Button
            type="button"
            variant="outlined"
            color="inherit"
            onClick={() => router.push(paths.dashboard.trainingSessions.list)}
          >
            {t('label_close')}
          </Button>

          <LoadingButton
            type="button"
            variant="soft"
            loading={isSubmitting}
            onClick={onSaveDraft}
          >
            {t('label_save_draft')}
          </LoadingButton>

          <LoadingButton
            type="button"
            variant="contained"
            loading={isSubmitting}
            onClick={onSendToAdmin}
          >
            {t('label_send_to_admin')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
