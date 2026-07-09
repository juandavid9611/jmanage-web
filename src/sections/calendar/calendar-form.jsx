import { z as zod } from 'zod';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import { Switch, MenuItem, FormControlLabel } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { uuidv4 } from 'src/utils/uuidv4';
import { fIsAfter, fTimestamp } from 'src/utils/format-time';

import { useWorkspace } from 'src/workspace/workspace-provider';
import { createEvent, updateEvent, deleteEvent, participateEvent } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ColorPicker } from 'src/components/color-utils';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function getEventSchema(t) {
  return zod.object({
    title: zod
      .string()
      .min(1, { message: t('title_required') })
      .max(100, { message: t('label_title_max_100') }),
    location: zod.string().max(100, { message: t('label_location_max_100') }),
    description: zod.string().max(300, { message: t('label_description_max_300') }),
    // Not required
    color: zod.string(),
    allDay: zod.boolean(),
    createTour: zod.boolean(),
    start: zod.union([zod.string(), zod.number()]),
    end: zod.union([zod.string(), zod.number()]),
    category: zod.string().min(1, { message: t('category_required') }),
    group: zod.string().min(1, { message: t('group_required') }),
  });
}

// ----------------------------------------------------------------------

export function CalendarForm({ currentEvent, colorOptions, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const { workspaceRole, selectedWorkspace } = useWorkspace();
  const router = useRouter();
  const isAdminOrCoach = workspaceRole === 'admin' || workspaceRole === 'coach';
  const [isParticipating, setIsParticipating] = useState(
    (currentEvent?.participants && user?.id in currentEvent.participants) || false
  );
  const EventSchema = useMemo(() => getEventSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(EventSchema),
    defaultValues: currentEvent,
  });

  const {
    reset,
    watch,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const dateError = fIsAfter(values.start, values.end);

  const onSubmit = handleSubmit(async (data) => {
    const start_time_stamp = fTimestamp(data?.start);
    const end_time_stamp = fTimestamp(data?.end);
    const eventData = {
      id: currentEvent?.id ? currentEvent?.id : uuidv4(),
      color: data?.color,
      title: data?.title,
      allDay: data?.allDay,
      createTour: data?.createTour || false,
      location: data?.location,
      description: data?.description,
      end: end_time_stamp,
      start: start_time_stamp,
      category: data?.category,
      group: data?.group,
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          await updateEvent(eventData, selectedWorkspace?.id);
          toast.success(t('update_success'));
        } else {
          await createEvent(eventData, selectedWorkspace?.id);
          toast.success(t('create_success'));
        }
        onClose();
        reset();
      }
    } catch (error) {
      console.error(error);
    }
  });

  const handleChangeIsParticipating = useCallback(
    async (event) => {
      try {
        setIsParticipating(event.target.checked);
        await participateEvent(`${currentEvent?.id}`, event.target.checked, selectedWorkspace?.id);
        toast.success(t('label_participate_success'));
      } catch (error) {
        console.error(error);
      }
    },
    [currentEvent?.id, setIsParticipating, selectedWorkspace?.id, t]
  );

  const onDelete = useCallback(async () => {
    try {
      await deleteEvent(`${currentEvent?.id}`, selectedWorkspace?.id);
      toast.success(t('delete_success'));
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentEvent?.id, onClose, selectedWorkspace?.id, t]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Stack spacing={3}>
          <Field.Text name="title" label={t('title')} disabled={!isAdminOrCoach} />

          <Field.Text name="location" label={t('label_location')} disabled={!isAdminOrCoach} />

          <Field.Text
            name="description"
            label={t('label_description')}
            multiline
            rows={2}
            disabled={!isAdminOrCoach}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select
              name="category"
              label={t('category')}
              InputLabelProps={{ shrink: true }}
              disabled={!isAdminOrCoach}
            >
              {['match', 'training', 'money', 'other'].map((option) => (
                <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                  {t(option)}
                </MenuItem>
              ))}
            </Field.Select>
            {currentEvent?.id && (
              <FormControlLabel
                disabled={values.category === 'money' || values.category === 'other'}
                control={
                  <Switch checked={isParticipating} onChange={handleChangeIsParticipating} />
                }
                label={t('label_sign_up')}
              />
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select
              name="group"
              label={t('group')}
              InputLabelProps={{ shrink: true }}
              disabled={!isAdminOrCoach}
            >
              <MenuItem
                key={currentEvent?.group}
                value={currentEvent?.group}
                sx={{ textTransform: 'capitalize' }}
              >
                {t(currentEvent?.group)}
              </MenuItem>
            </Field.Select>

            {!currentEvent?.createTour && isAdminOrCoach && (
              <Field.Switch
                name="createTour"
                label={t('label_create_post')}
                disabled={!isAdminOrCoach}
              />
            )}
            {currentEvent?.createTour && currentEvent?.tourId && (
              <Button
                size="medium"
                color="inherit"
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
                onClick={() =>
                  router.push(paths.dashboard.admin.tour.details(currentEvent?.tourId))
                }
              >
                {t('label_go_to_post')}
              </Button>
            )}
          </Stack>

          <Field.MobileDateTimePicker
            name="start"
            label={t('start_date')}
            disabled={!isAdminOrCoach}
          />

          <Field.MobileDateTimePicker
            name="end"
            label={t('end_date')}
            slotProps={{
              textField: {
                error: dateError,
                helperText: dateError ? t('label_end_date_must_be_later') : null,
              },
            }}
            disabled={!isAdminOrCoach}
          />

          <Controller
            name="color"
            control={control}
            render={({ field }) => (
              <ColorPicker
                selected={field.value}
                onSelectColor={(color) => field.onChange(color)}
                colors={colorOptions}
              />
            )}
            disabled={!isAdminOrCoach}
          />
        </Stack>
      </Scrollbar>

      <DialogActions sx={{ flexShrink: 0 }}>
        {!!currentEvent?.id && isAdminOrCoach && (
          <Tooltip title={t('label_delete_event')}>
            <IconButton onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          {t('label_close')}
        </Button>

        {isAdminOrCoach && (
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={dateError}
          >
            {t('save_changes')}
          </LoadingButton>
        )}
      </DialogActions>
    </Form>
  );
}
