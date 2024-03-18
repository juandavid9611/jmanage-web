import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogActions from '@mui/material/DialogActions';
import { Switch, FormControlLabel } from '@mui/material';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import uuidv4 from 'src/utils/uuidv4';
import { fTimestamp } from 'src/utils/format-time';

import { useAuthContext } from 'src/auth/hooks';
import { CALENDAR_EVENT_CATEGORIES } from 'src/_mock';
import { createEvent, updateEvent, deleteEvent, participateEvent } from 'src/api/calendar';

import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import { ColorPicker } from 'src/components/color-utils';
import FormProvider, { RHFSelect, RHFSwitch, RHFTextField } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function CalendarForm({ currentEvent, colorOptions, onClose }) {
  console.log('currentEvent', currentEvent);
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  const { enqueueSnackbar } = useSnackbar();
  const [isParticipating, setIsParticipating] = useState(
    console.log('currentEvent?.participants', currentEvent?.participants) ||
      (currentEvent?.participants && user?.id in currentEvent.participants) ||
      false
  );

  const EventSchema = Yup.object().shape({
    title: Yup.string().max(255).required('Title is required'),
    description: Yup.string().max(5000, 'Description must be at most 5000 characters'),
    // not required
    color: Yup.string(),
    category: Yup.string(),
    allDay: Yup.boolean(),
    start: Yup.mixed(),
    end: Yup.mixed(),
  });

  const methods = useForm({
    resolver: yupResolver(EventSchema),
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

  const dateError = values.start && values.end ? values.start > values.end : false;

  const onSubmit = handleSubmit(async (data) => {
    const eventData = {
      id: currentEvent?.id ? currentEvent?.id : uuidv4(),
      color: data?.color,
      title: data?.title,
      allDay: data?.allDay,
      description: data?.description,
      end: data?.end,
      start: data?.start,
      category: data?.category || 'match',
    };

    try {
      if (!dateError) {
        if (currentEvent?.id) {
          await updateEvent(eventData);
          enqueueSnackbar('Update success!');
        } else {
          await createEvent(eventData);
          enqueueSnackbar('Create success!');
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
        enqueueSnackbar('Participate success!');
        await participateEvent(`${currentEvent?.id}`, event.target.checked);
      } catch (error) {
        console.error(error);
      }
    },
    [enqueueSnackbar, currentEvent?.id, setIsParticipating]
  );

  const onDelete = useCallback(async () => {
    try {
      await deleteEvent(`${currentEvent?.id}`);
      enqueueSnackbar('Delete success!');
      onClose();
    } catch (error) {
      console.error(error);
    }
  }, [currentEvent?.id, enqueueSnackbar, onClose]);

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Stack spacing={3} sx={{ px: 3 }}>
        <RHFTextField disabled={!isAdmin} name="title" label="Title" />

        <RHFTextField
          disabled={!isAdmin}
          name="description"
          label="Description"
          multiline
          rows={3}
        />

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
          <RHFSwitch disabled={!isAdmin} name="allDay" label="All day" />

          <RHFSelect
            disabled={!isAdmin}
            native
            name="category"
            label="Category"
            InputLabelProps={{ shrink: true }}
          >
            {CALENDAR_EVENT_CATEGORIES.map((group) => (
              <option key={group.label} value={group.value}>
                {group.label}
              </option>
            ))}
          </RHFSelect>

          {currentEvent?.id && (
            <FormControlLabel
              disabled={values.category === 'money' || values.category === 'other'}
              control={<Switch checked={isParticipating} onChange={handleChangeIsParticipating} />}
              label="Participate"
            />
          )}
        </Stack>

        <Controller
          disabled={!isAdmin}
          name="start"
          control={control}
          render={({ field }) => (
            <MobileDateTimePicker
              {...field}
              value={new Date(field.value)}
              onChange={(newValue) => {
                if (newValue) {
                  field.onChange(fTimestamp(newValue));
                }
              }}
              label="Start date"
              format="dd/MM/yyyy hh:mm a"
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          )}
        />

        <Controller
          disabled={!isAdmin}
          name="end"
          control={control}
          render={({ field }) => (
            <MobileDateTimePicker
              {...field}
              value={new Date(field.value)}
              onChange={(newValue) => {
                if (newValue) {
                  field.onChange(fTimestamp(newValue));
                }
              }}
              label="End date"
              format="dd/MM/yyyy hh:mm a"
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: dateError,
                  helperText: dateError && 'End date must be later than start date',
                },
              }}
            />
          )}
        />

        {isAdmin && (
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
          />
        )}
      </Stack>

      <DialogActions>
        {!!currentEvent?.id && isAdmin && (
          <Tooltip title="Delete Event">
            <IconButton onClick={onDelete}>
              <Iconify icon="solar:trash-bin-trash-bold" />
            </IconButton>
          </Tooltip>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button variant="outlined" color="inherit" onClick={onClose}>
          Cancel
        </Button>

        {isAdmin && (
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={dateError}
          >
            Save Changes
          </LoadingButton>
        )}
      </DialogActions>
    </FormProvider>
  );
}

CalendarForm.propTypes = {
  colorOptions: PropTypes.arrayOf(PropTypes.string),
  currentEvent: PropTypes.object,
  onClose: PropTypes.func,
};
