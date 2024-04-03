import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Unstable_Grid2';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fData } from 'src/utils/format-number';

import { TEAM_GROUPS } from 'src/_mock';
import { countries } from 'src/assets/data';
import { createUser, updateUser } from 'src/api/user';

import Label from 'src/components/label';
import Iconify from 'src/components/iconify';
import { useSnackbar } from 'src/components/snackbar';
import FormProvider, {
  RHFSelect,
  RHFTextField,
  RHFUploadAvatar,
  RHFAutocomplete,
} from 'src/components/hook-form';

// ----------------------------------------------------------------------

export default function UserNewEditForm({ currentUser }) {
  const router = useRouter();

  const { enqueueSnackbar } = useSnackbar();

  const { t } = useTranslation();

  const NewUserSchema = Yup.object().shape({
    name: Yup.string().required(t('name_required')),
    email: Yup.string().required(t('email_required')).email(t('email_invalid')),
    phoneNumber: Yup.string().required(t('phone_number_required')),
    address: Yup.string().required(t('address_required')),
    group: Yup.string().required(t('group_required')),
    company: Yup.string().required(t('company_required')),
    state: Yup.string().required(t('state_required')),
    city: Yup.string().required(t('city_required')),
    country: Yup.string().required(t('country_required')),
    role: Yup.string().required(t('role_required')),
    zipCode: Yup.string().required(t('zip_code_required')),
    // not required
    status: Yup.string(),
    isVerified: Yup.boolean(),
  });

  const defaultValues = useMemo(
    () => ({
      name: currentUser?.name || '',
      role: currentUser?.role || '',
      email: currentUser?.email || '',
      city: currentUser?.city || 'Bogota',
      state: currentUser?.state || 'Bogota',
      country: currentUser?.country || 'Colombia',
      status: currentUser?.status || '',
      address: currentUser?.address || '',
      group: currentUser?.group || 'male',
      zipCode: currentUser?.zipCode || '111111',
      company: currentUser?.company || 'Vittoria CD',
      avatarUrl: currentUser?.avatarUrl || null,
      phoneNumber: currentUser?.phoneNumber || '',
      isVerified: currentUser?.isVerified || true,
    }),
    [currentUser]
  );

  const methods = useForm({
    resolver: yupResolver(NewUserSchema),
    defaultValues,
  });

  const { reset, watch, setValue, handleSubmit } = methods;

  const values = watch();

  useEffect(() => {
    if (currentUser) {
      reset(defaultValues);
    }
  }, [currentUser, defaultValues, reset]);

  const onSubmit = handleSubmit(async (data) => {
    if (!currentUser) {
      try {
        data.email = data.email.toLowerCase();
        createUser(data);
        enqueueSnackbar('Create success!');
      } catch (error) {
        enqueueSnackbar(error.detail, { variant: 'error' });
      }
    } else {
      data.email = data.email.toLowerCase();
      updateUser(currentUser.id, data);
      enqueueSnackbar('Update success!');
    }
    router.push(paths.dashboard.admin.user.list);
  });

  const handleDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];

      const newFile = Object.assign(file, {
        preview: URL.createObjectURL(file),
      });

      if (file) {
        setValue('avatarUrl', newFile, { shouldValidate: true });
      }
    },
    [setValue]
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={
                  (values.status === 'active' && 'success') ||
                  (values.status === 'banned' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.status}
              </Label>
            )}

            <Box sx={{ mb: 5 }}>
              <RHFUploadAvatar
                name="avatarUrl"
                maxSize={3145728}
                onDrop={handleDrop}
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
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
            </Box>
          </Card>
        </Grid>

        <Grid xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Box
              rowGap={3}
              columnGap={2}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                sm: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="name" label={t('full_name')} />
              <RHFTextField name="email" label={t('email_address')} />
              <RHFTextField name="phoneNumber" label={t('phone_number')} />

              <RHFSelect native name="group" label={t('group')} InputLabelProps={{ shrink: true }}>
                {TEAM_GROUPS.map((group) => (
                  <option key={group.label} value={group.value}>
                    {t(group.label)}
                  </option>
                ))}
              </RHFSelect>

              <RHFAutocomplete
                name="country"
                label={t('country')}
                options={countries.map((country) => country.label)}
                getOptionLabel={(option) => option}
                renderOption={(props, option) => {
                  const { code, label, phone } = countries.filter(
                    (country) => country.label === option
                  )[0];

                  if (!label) {
                    return null;
                  }

                  return (
                    <li {...props} key={label}>
                      <Iconify
                        key={label}
                        icon={`circle-flags:${code.toLowerCase()}`}
                        width={28}
                        sx={{ mr: 1 }}
                      />
                      {label} ({code}) +{phone}
                    </li>
                  );
                }}
              />
              <RHFTextField name="state" label={t('state_region')} />
              <RHFTextField name="city" label={t('city')} />
              <RHFTextField name="address" label={t('address')} />
              <RHFTextField name="zipCode" label={t('zip_code')} />
              <RHFTextField name="company" label={t('company')} />
              <RHFTextField name="role" label={t('role')} />
            </Box>

            <Stack alignItems="flex-end" sx={{ mt: 3 }}>
              <LoadingButton type="submit" variant="contained">
                {!currentUser ? t('create_user') : t('save_changes')}
              </LoadingButton>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </FormProvider>
  );
}

UserNewEditForm.propTypes = {
  currentUser: PropTypes.object,
};
