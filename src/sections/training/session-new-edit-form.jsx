import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useState, useCallback } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uuidv4 } from 'src/utils/uuidv4';
import { fTimestamp } from 'src/utils/format-time';

import { useWorkspace } from 'src/workspace/workspace-provider';
import { createTrainingSession, updateTrainingSession } from 'src/actions/training-sessions';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';

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
  const { user } = useAuthContext();
  const { selectedWorkspace } = useWorkspace();

  const [exercises, setExercises] = useState(currentSession?.exercises?.length ? currentSession.exercises : [emptyExercise()]);

  const SessionSchema = useMemo(() => getSessionSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(SessionSchema),
    defaultValues: {
      title: currentSession?.title || '',
      date: currentSession?.date || Date.now(),
      location: currentSession?.location || '',
      teamGroup: currentSession?.teamGroup || '',
      objective: currentSession?.objective || '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const handleAddExercise = useCallback(() => {
    setExercises((prev) => [...prev, emptyExercise()]);
  }, []);

  const handleChangeExercise = useCallback((updated) => {
    setExercises((prev) => prev.map((exercise) => (exercise.id === updated.id ? updated : exercise)));
  }, []);

  const handleRemoveExercise = useCallback((id) => {
    setExercises((prev) => prev.filter((exercise) => exercise.id !== id));
  }, []);

  const persist = useCallback(
    async (data, status) => {
      if (status === 'sent' && !exercises.some((exercise) => exercise.name?.trim())) {
        toast.error(t('label_session_needs_exercise'));
        return;
      }

      const payload = {
        title: data.title,
        date: fTimestamp(data.date),
        location: data.location || '',
        teamGroup: data.teamGroup || '',
        objective: data.objective || '',
        exercises,
        status,
      };

      try {
        if (currentSession?.id) {
          await updateTrainingSession({ ...payload, id: currentSession.id }, selectedWorkspace?.id);
          toast.success(t('update_success'));
        } else {
          await createTrainingSession(
            { ...payload, createdBy: { id: user?.id, name: user?.displayName } },
            selectedWorkspace?.id
          );
          toast.success(t('create_success'));
        }
        router.push(paths.dashboard.trainingSessions.list);
      } catch (error) {
        console.error(error);
      }
    },
    [currentSession?.id, exercises, router, selectedWorkspace?.id, t, user]
  );

  const onSaveDraft = handleSubmit((data) => persist(data, 'draft'));
  const onSendToAdmin = handleSubmit((data) => persist(data, 'sent'));

  return (
    <Form methods={methods} onSubmit={onSaveDraft}>
      <Stack spacing={3}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <Field.Text name="title" label={t('label_session_title')} />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
              <Field.MobileDateTimePicker name="date" label={t('start_date')} />
              <Field.Text name="location" label={t('label_location')} />
            </Stack>

            <Field.Text name="teamGroup" label={t('label_team_group')} />

            <Field.Text
              name="objective"
              label={t('label_objective')}
              multiline
              rows={2}
            />
          </Stack>
        </Card>

        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            index={index}
            onChange={handleChangeExercise}
            onRemove={() => handleRemoveExercise(exercise.id)}
          />
        ))}

        <Button
          type="button"
          variant="soft"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={handleAddExercise}
          sx={{ alignSelf: 'flex-start' }}
        >
          {t('label_add_exercise')}
        </Button>

        <Stack direction="row" spacing={2} justifyContent="flex-end">
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
