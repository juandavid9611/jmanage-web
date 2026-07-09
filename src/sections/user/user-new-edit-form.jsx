import { z as zod } from 'zod';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import { Switch, FormControlLabel } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { uploadFileToS3 } from 'src/actions/filesS3';
import {
  updateUser,
  enableUser,
  disableUser,
  updateAvatarUrl,
  generatePresignedUrl,
} from 'src/actions/user';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { UserWorkspaceCard } from './user-workspace-card';

// // ----------------------------------------------------------------------

export function getNewUserSchema(t) {
  return zod.object({
    name: zod.string().min(1, { message: t('name_required') }),
    identityCardNumber: zod.string().min(1, { message: t('identity_card_required') }),
    email: zod
      .string()
      .min(1, { message: t('email_required') })
      .email({ message: t('email_invalid') }),
    phoneNumber: zod.string().min(1, { message: t('phone_number_required') }),
    country: schemaHelper.objectOrNull({
      message: { required_error: t('country_required') },
    }),
    city: zod.string().min(1, { message: t('city_required') }),
    address: zod.string().min(1, { message: t('address_required') }),
    rh: zod.string().min(1, { message: t('rh_required') }),
    emergencyContactName: zod.string().min(1, { message: t('emergency_contact_name_required') }),
    emergencyContactPhoneNumber: zod
      .string()
      .min(1, { message: t('emergency_contact_phone_required') }),
    emergencyContactRelationship: zod
      .string()
      .min(1, { message: t('emergency_contact_relationship_required') }),
    eps: zod.string().min(1, { message: t('eps_required') }),
    avatarUrl: zod.string().nullable(),
    shirtNumber: zod.string().min(1, { message: t('shirt_number_required') }),
  });
}

export function UserNewEditForm({ currentUser, isAdmin }) {
  const router = useRouter();
  const { t } = useTranslation();

  const NewUserSchema = useMemo(() => getNewUserSchema(t), [t]);

  const defaultValues = useMemo(
    () => ({
      id: currentUser?.id || '',
      name: currentUser?.name || '',
      identityCardNumber: currentUser?.identityCardNumber || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      country: currentUser?.country || 'Colombia',
      city: currentUser?.city || 'Bogota',
      address: currentUser?.address || '',
      rh: currentUser?.rh || '',
      eps: currentUser?.eps || '',
      emergencyContactName: currentUser?.emergencyContactName || '',
      emergencyContactPhoneNumber: currentUser?.emergencyContactPhoneNumber || '',
      emergencyContactRelationship: currentUser?.emergencyContactRelationship || '',
      status: currentUser?.status || 'pending',
      confirmationStatus: currentUser?.confirmationStatus || 'pending',
      avatarUrl: currentUser?.avatarUrl || null,
      shirtNumber: currentUser?.shirtNumber || 0,
    }),
    [currentUser]
  );

  const methods = useForm({
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    watch,
    setValue,
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    data.email = data.email.toLowerCase();
    try {
      data.status = currentUser.status;
      await updateUser(currentUser.id, data);
      toast.success(t('update_success'));
      if (isAdmin) {
        router.push(paths.dashboard.admin.user.list);
      } else {
        router.push(paths.dashboard.root);
      }
    } catch (error) {
      toast.error(error.message);
    }
  });

  const handleDropAvatar = useCallback(
    async (acceptedFiles) => {
      const file = acceptedFiles[0];
      const response = await generatePresignedUrl(values.id, file);
      const getPresignedUrl = response.urls.get_presigned_url;
      const putPresignedUrl = response.urls.put_presigned_url;
      const fileKey = response.urls.key;
      const uploadFilePromise = uploadFileToS3(file, putPresignedUrl);
      const updateAvatarUrlPromise = await updateAvatarUrl(values.id, fileKey);
      const allPromises = Promise.all([uploadFilePromise, updateAvatarUrlPromise]);
      toast.promise(allPromises, {
        loading: t('label_loading'),
        success: () => t('label_all_files_uploaded'),
        error: t('label_file_upload_error'),
      });
      setValue('avatarUrl', getPresignedUrl);
    },
    [setValue, values.id, t]
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <UserWorkspaceCard />
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            <Box sx={{ mb: 5 }}>
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                onDrop={handleDropAvatar}
                helperText={
                  <Typography
                    variant="caption"
                    sx={{
                      mt: 3,
                      mx: 'auto',
                      display: 'block',
                      textAlign: 'center',
                      color: 'text.disabled',
                    }}
                  >
                    {t('label_allowed_image_formats')}
                    <br /> {t('label_max_size_of')} {fData(3145728)}
                  </Typography>
                }
              />
              {currentUser && (
                <FormControlLabel
                  labelPlacement="start"
                  disabled={!isAdmin}
                  control={
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Switch
                          {...field}
                          checked={field.value === 'disabled'}
                          onChange={(event) => {
                            field.onChange(event.target.checked ? 'disabled' : 'active');
                            if (event.target.checked) {
                              disableUser(currentUser.id);
                            } else {
                              enableUser(currentUser.id);
                            }
                          }}
                        />
                      )}
                    />
                  }
                  label={
                    <>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        {t('disabled')}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t('label_disabled_user_body')}
                      </Typography>
                    </>
                  }
                  sx={{
                    mx: 0,
                    mb: 3,
                    width: 1,
                    justifyContent: 'space-between',
                  }}
                />
              )}
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card spacing={3} sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="name" label={t('full_name')} />
              <Field.Text name="identityCardNumber" label={t('identity_card')} />
              <Field.Text name="email" label={t('email_address')} disabled />
              <Field.Text name="phoneNumber" label={t('phone_number')} />

              <Field.CountrySelect
                fullWidth
                name="country"
                label={t('country')}
                placeholder={t('label_choose_a_country')}
              />
              <Field.Text name="city" label={t('city')} />
              <Field.Text name="address" label={t('address')} />
              <Field.Text name="rh" label={t('rh')} />
              <Field.Text name="eps" label={t('eps')} />
              <Field.Text name="shirtNumber" label={t('shirt_number')} />
            </Box>

            <Stack spacing={3} px={3} py={3}>
              <Typography variant="subtitle2">{t('label_emergency_contact')}</Typography>
            </Stack>

            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <Field.Text name="emergencyContactName" label={t('name')} />
              <Field.Text name="emergencyContactPhoneNumber" label={t('phone_number')} />
              <Field.Text name="emergencyContactRelationship" label={t('relationship')} />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
                {!currentUser ? t('create_user') : t('save_changes')}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </Form>
  );
}
