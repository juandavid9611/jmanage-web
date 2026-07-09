import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMemo, useEffect, useCallback } from 'react';

import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fIsAfter } from 'src/utils/format-time';

import { uploadFileToS3 } from 'src/actions/filesS3';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { _tags, _tourGuides, TOUR_SERVICE_OPTIONS } from 'src/_mock';
import { addImages, createTour, updateTour, generatePresignedUrls } from 'src/actions/tours';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { IncrementerButton } from './components/incrementer-button';

// ----------------------------------------------------------------------

export function getNewTourSchema(t) {
  return zod
    .object({
      name: zod.string().min(1, { message: t('name_required') }),
      content: schemaHelper.editor({
        message: { required_error: t('description_required') },
      }),
      tourGuides: zod.array(
        zod.object({
          id: zod.string(),
          name: zod.string(),
          avatarUrl: zod.string(),
          phoneNumber: zod.string(),
        })
      ),
      available: zod.object({
        startDate: schemaHelper.date({
          message: { required_error: t('label_start_date_required') },
        }),
        endDate: schemaHelper.date({
          message: { required_error: t('label_end_date_required') },
        }),
      }),
      location: schemaHelper.objectOrNull({
        message: { required_error: t('label_location_required') },
      }),
      services: zod
        .string()
        .array()
        .min(1, { message: t('label_must_have_at_least_1_item') }),
      tags: zod.string().array(),
      scores: zod.object({
        home: zod.number(),
        away: zod.number(),
      }),
    })
    .refine((data) => !fIsAfter(data.available.startDate, data.available.endDate), {
      message: t('label_end_date_cannot_be_earlier'),
      path: ['available.endDate'],
    });
}

export function TourNewEditForm({ currentTour }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();

  const defaultValues = useMemo(
    () => ({
      name: currentTour?.name || '',
      content: currentTour?.content || '',
      images: currentTour?.images || [],
      tourGuides: currentTour?.tourGuides || [],
      available: {
        startDate: currentTour?.available.startDate || null,
        endDate: currentTour?.available.endDate || null,
      },
      location: currentTour?.location || '',
      services: currentTour?.services || [],
      tags: currentTour?.tags || [],
      scores: {
        home: currentTour?.scores?.home || 0,
        away: currentTour?.scores?.away || 0,
      },
    }),
    [currentTour]
  );

  const NewTourSchema = useMemo(() => getNewTourSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewTourSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentTour) {
      reset(defaultValues);
    }
  }, [currentTour, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      if (currentTour?.id) {
        await updateTour(currentTour.id, data, selectedWorkspace?.id);
        toast.success(t('update_success'));
      } else {
        await createTour(data, selectedWorkspace?.id);
        toast.success(t('create_success'));
      }
      reset();
      router.push(paths.dashboard.admin.tour.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleUploadFiles = useCallback(
    async (event) => {
      // Step 4: Wait for all uploads to complete
      try {
        // Step 2: Request pre-signed URLs for each file from the backend
        const response = await generatePresignedUrls(
          currentTour.id,
          values.images,
          selectedWorkspace?.id
        );

        // Step 3: Upload each file to its respective pre-signed URL
        const uploadPromises = values.images.map((file) => {
          const presignedUrl = response.urls[file.name];
          return uploadFileToS3(file, presignedUrl);
        });
        const file_names = values.images.map((file) => file.name);
        const allPromises = Promise.all(uploadPromises);
        toast.promise(allPromises, {
          loading: t('label_loading_ellipsis'),
          success: () => t('label_all_files_uploaded'),
          error: t('label_file_upload_error'),
        });
        await addImages(currentTour.id, file_names, selectedWorkspace?.id);
      } catch (error) {
        console.error('File upload failed', error);
      }
    },
    [currentTour.id, values.images, selectedWorkspace?.id, t]
  );

  const handleRemoveFile = useCallback(
    (inputFile) => {
      const filtered = values.images && values.images?.filter((file) => file !== inputFile);
      setValue('images', filtered, { shouldValidate: true });
    },
    [setValue, values.images]
  );

  const handleRemoveAllFiles = useCallback(() => {
    setValue('images', [], { shouldValidate: true });
  }, [setValue]);

  const renderDetails = (
    <Card>
      <CardHeader
        title={t('details')}
        subheader={t('label_title_short_description_image')}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Stack spacing={1.5} sx={{ flex: 1 }}>
            <Typography variant="subtitle2">{t('name')}</Typography>
            <Field.Text name="name" disabled />
          </Stack>
          <Stack spacing={1.5}>
            <Typography variant="subtitle2">{t('label_scoreboard')}</Typography>
            <Stack direction="row" spacing={2}>
              <Stack direction="row" spacing={1.5}>
                <Typography variant="caption">{t('label_home_team')}</Typography>
                <IncrementerButton
                  name="scores.home"
                  quantity={values.scores.home}
                  disabledDecrease={values.scores.home <= 1}
                  disabledIncrease={values.scores.home >= 10}
                  onIncrease={() => {
                    setValue('scores.home', values.scores.home + 1);
                  }}
                  onDecrease={() => setValue('scores.home', values.scores.home - 1)}
                />
              </Stack>
              <Stack direction="row" spacing={1.5}>
                <IncrementerButton
                  name="scores.away"
                  quantity={values.scores.away}
                  disabledDecrease={values.scores.away <= 1}
                  disabledIncrease={values.scores.away >= 20}
                  onIncrease={() => setValue('scores.away', values.scores.away + 1)}
                  onDecrease={() => setValue('scores.away', values.scores.away - 1)}
                />
                <Typography variant="caption">{t('label_away_team')}</Typography>
              </Stack>
            </Stack>
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('label_content')}</Typography>
          <Field.Editor name="content" sx={{ maxHeight: 480 }} />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('images')}</Typography>
          <Field.Upload
            multiple
            thumbnail
            name="images"
            maxSize={10145728}
            onRemove={handleRemoveFile}
            onRemoveAll={handleRemoveAllFiles}
            onUpload={handleUploadFiles}
          />
        </Stack>
      </Stack>
    </Card>
  );

  const renderProperties = (
    <Card>
      <CardHeader
        title={t('label_properties')}
        subheader={t('label_additional_functions_and_attributes')}
        sx={{ mb: 3 }}
      />

      <Divider />

      <Stack spacing={3} sx={{ p: 3 }}>
        <div>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            {t('label_tour_guide')}
          </Typography>

          <Field.Autocomplete
            multiple
            name="tourGuides"
            placeholder={t('label_plus_tour_guides')}
            disableCloseOnSelect
            options={_tourGuides}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderOption={(props, tourGuide) => (
              <li {...props} key={tourGuide.id}>
                <Avatar
                  key={tourGuide.id}
                  alt={tourGuide.avatarUrl}
                  src={tourGuide.avatarUrl}
                  sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                />

                {tourGuide.name}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((tourGuide, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={tourGuide.id}
                  size="small"
                  variant="soft"
                  label={tourGuide.name}
                  avatar={<Avatar alt={tourGuide.name} src={tourGuide.avatarUrl} />}
                />
              ))
            }
          />
        </div>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('label_dates')}</Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Field.DatePicker name="available.startDate" label={t('start_date')} disabled />
            <Field.DatePicker name="available.endDate" label={t('end_date')} disabled />
          </Stack>
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('label_location')}</Typography>
          <Field.Text fullWidth name="location" placeholder={t('label_location')} disabled />
        </Stack>

        <Stack spacing={1}>
          <Typography variant="subtitle2">{t('label_services')}</Typography>
          <Field.MultiCheckbox
            name="services"
            options={TOUR_SERVICE_OPTIONS}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}
          />
        </Stack>

        <Stack spacing={1.5}>
          <Typography variant="subtitle2">{t('label_tags')}</Typography>
          <Field.Autocomplete
            name="tags"
            placeholder={t('label_plus_tags')}
            multiple
            freeSolo
            disableCloseOnSelect
            options={_tags.map((option) => option)}
            getOptionLabel={(option) => option}
            renderOption={(props, option) => (
              <li {...props} key={option}>
                {option}
              </li>
            )}
            renderTags={(selected, getTagProps) =>
              selected.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  color="info"
                  variant="soft"
                />
              ))
            }
          />
        </Stack>
      </Stack>
    </Card>
  );

  const renderActions = (
    <Stack direction="row" alignItems="center" flexWrap="wrap">
      <FormControlLabel
        control={<Switch defaultChecked inputProps={{ id: 'publish-switch' }} />}
        label={t('label_publish')}
        sx={{ flexGrow: 1, pl: 3 }}
      />

      <LoadingButton
        type="submit"
        variant="contained"
        size="large"
        loading={isSubmitting}
        sx={{ ml: 2 }}
      >
        {!currentTour ? t('label_create_tour') : t('save_changes')}
      </LoadingButton>
    </Stack>
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        {renderDetails}

        {renderProperties}

        {renderActions}
      </Stack>
    </Form>
  );
}
