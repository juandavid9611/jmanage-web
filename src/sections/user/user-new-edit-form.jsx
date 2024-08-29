import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

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
import { createUser, updateUser } from 'src/actions/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// // ----------------------------------------------------------------------

export const NewUserSchema = zod.object({
  name: zod.string().min(1, { message: 'Name is required!' }),
  email: zod
    .string()
    .min(1, { message: 'Email is required!' })
    .email({ message: 'Email must be a valid email address!' }),
  phoneNumber: zod.string().min(1, { message: 'Phone Number is required!' }),
  address: zod.string().min(1, { message: 'Address is required!' }),
  group: zod.string().min(1, { message: 'Group is required!' }),
  company: zod
    .string()
    .min(2, { message: 'company_too_short' })
    .max(50, { message: 'company_too_long' }),
  state: zod.string().min(1, { message: 'State is required!' }),
  city: zod.string().min(1, { message: 'City is required!' }),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Country is required!' },
  }),
  role: zod.string().min(1, { message: 'Role is required!' }),
  zipCode: zod.string().min(1, { message: 'Zip code is required!' }),
});

export function UserNewEditForm({ currentUser }) {
  const router = useRouter();
  const { t } = useTranslation();

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
    mode: 'onSubmit',
    resolver: zodResolver(NewUserSchema),
    defaultValues,
  });

  const {
    reset,
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    data.email = data.email.toLowerCase();
    try {
      if (currentUser) {
        data.status = currentUser.status;
        await updateUser(currentUser.id, data);
        toast.success('Update success!');
      } else {
        data.status = 'pending';
        await createUser(data);
        toast.success('Create success!');
      }
    } catch (error) {
      toast.error(error.message);
    }
    router.push(paths.dashboard.admin.user.list);
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
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
              <Field.UploadAvatar
                name="avatarUrl"
                maxSize={3145728}
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
              <Field.Text name="name" label={t('full_name')} />
              <Field.Text name="email" label={t('email_address')} />
              <Field.Text name="phoneNumber" label={t('phone_number')} />

              <Field.Select name="group" label={t('group')}>
                {TEAM_GROUPS.map((group) => (
                  <option key={group.label} value={group.value}>
                    {t(group.label)}
                  </option>
                ))}
              </Field.Select>

              <Field.CountrySelect
                fullWidth
                name="country"
                label="Country"
                placeholder="Choose a country"
              />
              <Field.Text name="state" label={t('state_region')} />
              <Field.Text name="city" label={t('city')} />
              <Field.Text name="address" label={t('address')} />
              <Field.Text name="zipCode" label={t('zip_code')} />
              <Field.Text name="company" label={t('company')} />
              <Field.Text name="role" label={t('role')} />
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
