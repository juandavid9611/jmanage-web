import { z as zod } from 'zod';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';

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

import { TEAM_GROUPS } from 'src/_mock';
import { createEvent, updateEvent, deleteEvent, participateEvent } from 'src/actions/calendar';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';
import { ColorPicker } from 'src/components/color-utils';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export const EventSchema = zod.object({
  title: zod
    .string()
    .min(1, { message: 'Title is required!' })
    .max(100, { message: 'Title must be less than 100 characters' }),
  location: zod.string().max(100, { message: 'Location must be less than 100 characters' }),
  description: zod.string().max(300, { message: 'Description must be less than 300 characters' }),
  // Not required
  color: zod.string(),
  allDay: zod.boolean(),
  createTour: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
  category: zod.string().min(1, { message: 'Category is required!' }),
  group: zod.string().min(1, { message: 'Group is required!' }),
});

// ----------------------------------------------------------------------

export function CalendarForm({ currentEvent, colorOptions, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const router = useRouter();
  const isAdmin = user?.role === 'admin';
  const [isParticipating, setIsParticipating] = useState(
    (currentEvent?.participants && user?.id in currentEvent.participants) || false
  );
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
          await updateEvent(eventData);
          toast.success('Update success!');
        } else {
          await createEvent(eventData);
          toast.success('Create success!');
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
        await participateEvent(`${currentEvent?.id}`, event.target.checked);
        toast.success('Participate success!');
      } catch (error) {
        console.error(error);
      }
    },
    [currentEvent?.id, setIsParticipating]
  );

  const onDelete = useCallback(async () => {
    try {
      await deleteEvent(`${currentEvent?.id}`);
      toast.success('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentEvent?.id, onClose]);

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Scrollbar sx={{ p: 3, bgcolor: 'background.neutral' }}>
        <Stack spacing={3}>
          <Field.Text name="title" label="Title" disabled={!isAdmin} />

          <Field.Text name="location" label="Ubicación" disabled={!isAdmin} />

          <Field.Text
            name="description"
            label="Description"
            multiline
            rows={2}
            disabled={!isAdmin}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select
              name="category"
              label="Category"
              InputLabelProps={{ shrink: true }}
              disabled={!isAdmin}
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
                label="Participate"
              />
            )}
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Select
              name="group"
              label={t('group')}
              InputLabelProps={{ shrink: true }}
              disabled={!isAdmin}
            >
              {TEAM_GROUPS.map((option) => (
                <MenuItem
                  key={option.label}
                  value={option.value}
                  sx={{ textTransform: 'capitalize' }}
                >
                  {t(option.label)}
                </MenuItem>
              ))}
            </Field.Select>

            {!currentEvent?.createTour && isAdmin && (
              <Field.Switch name="createTour" label="Crear post" disabled={!isAdmin} />
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
                Ir a post
              </Button>
            )}
          </Stack>

          <Field.MobileDateTimePicker name="start" label="Start date" disabled={!isAdmin} />

          <Field.MobileDateTimePicker
            name="end"
            label="End date"
            slotProps={{
              textField: {
                error: dateError,
                helperText: dateError ? 'End date must be later than start date' : null,
              },
            }}
            disabled={!isAdmin}
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
            disabled={!isAdmin}
          />
        </Stack>
      </Scrollbar>

      <DialogActions sx={{ flexShrink: 0 }}>
        {!!currentEvent?.id && isAdmin && (
          <Tooltip title="Delete event">
            <IconButton onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>

        {isAdmin && (
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
