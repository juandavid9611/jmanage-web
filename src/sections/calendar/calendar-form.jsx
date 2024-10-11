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

import { uuidv4 } from 'src/utils/uuidv4';
import { fIsAfter, fTimestamp } from 'src/utils/format-time';

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
  description: zod.string().max(5000, { message: 'Description must be less than 5000 characters' }),
  // Not required
  color: zod.string(),
  allDay: zod.boolean(),
  start: zod.union([zod.string(), zod.number()]),
  end: zod.union([zod.string(), zod.number()]),
  category: zod.string().min(1, { message: 'Category is required!' }),
});

// ----------------------------------------------------------------------

export function CalendarForm({ currentEvent, colorOptions, onClose }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  // const isAdmin = false;
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
      description: data?.description,
      end: end_time_stamp,
      start: start_time_stamp,
      category: data?.category,
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

          <Field.Text
            name="description"
            label="Description"
            multiline
            rows={3}
            disabled={!isAdmin}
          />

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            <Field.Switch name="allDay" label="All day" disabled={!isAdmin} />

            <FormControlLabel
              disabled={values.category === 'money' || values.category === 'other'}
              control={<Switch checked={isParticipating} onChange={handleChangeIsParticipating} />}
              label="Participate"
            />

            <Field.Select
              name="category"
              label="Category"
              InputLabelProps={{ shrink: true }}
              disabled={!isAdmin}
            >
              {['match', 'training', 'money', 'other'].map((option) => (
                <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
                  {option}
                </MenuItem>
              ))}
            </Field.Select>
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
