import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
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
import { uploadFileToS3 } from 'src/actions/files';
import { updateUser, updateAvatarUrl, generatePresignedUrl } from 'src/actions/user';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

// // ----------------------------------------------------------------------

export const NewUserSchema = zod.object({
  name: zod.string().min(1, { message: 'Nombre requerido!' }),
  identityCardNumber: zod.string().min(1, { message: 'Número de documento requerido!' }),
  email: zod
    .string()
    .min(1, { message: 'Correo requerido!' })
    .email({ message: 'Dirección de correo invalida!' }),
  phoneNumber: zod.string().min(1, { message: 'Número de teléfono requerido!' }),
  country: schemaHelper.objectOrNull({
    message: { required_error: 'Pais requerido!' },
  }),
  city: zod.string().min(1, { message: 'Ciudad requerida!' }),
  address: zod.string().min(1, { message: 'Dirección requerida!' }),
  group: zod.string().min(1, { message: 'Grupo requerido!' }),
  rh: zod.string().min(1, { message: 'R.H requerido!' }),
  emergencyContactName: zod
    .string()
    .min(1, { message: 'Nombre de contacto de emergencia requerido!' }),
  emergencyContactPhoneNumber: zod
    .string()
    .min(1, { message: 'Número de teléfono contacto de emergencia requerido!' }),
  emergencyContactRelationship: zod
    .string()
    .min(1, { message: 'Relación contacto de emergencia requerida!' }),
  eps: zod.string().min(1, { message: 'Eps requerida!' }),
  avatarUrl: zod.string().nullable(),
});

export function UserNewEditForm({ currentUser, isAdmin }) {
  const router = useRouter();
  const { t } = useTranslation();

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
      group: currentUser?.group || 'male',
      rh: currentUser?.rh || '',
      eps: currentUser?.eps || '',
      emergencyContactName: currentUser?.emergencyContactName || '',
      emergencyContactPhoneNumber: currentUser?.emergencyContactPhoneNumber || '',
      emergencyContactRelationship: currentUser?.emergencyContactRelationship || '',
      status: currentUser?.status || 'pending',
      confirmationStatus: currentUser?.confirmationStatus || 'pending',
      avatarUrl: currentUser?.avatarUrl || null,
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
    setValue,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    data.email = data.email.toLowerCase();
    try {
      data.status = currentUser.status;
      await updateUser(currentUser.id, data);
      toast.success('Update success!');
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
        loading: 'Loading...',
        success: () => 'All files uploaded successfully',
        error: 'File upload failed',
      });
      setValue('avatarUrl', getPresignedUrl);
    },
    [setValue, values.id]
  );

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Card sx={{ pt: 10, pb: 5, px: 3 }}>
            {currentUser && (
              <Label
                color={
                  (values.confirmationStatus === 'confirmed' && 'success') ||
                  (values.confirmationStatus === 'inactive' && 'error') ||
                  'warning'
                }
                sx={{ position: 'absolute', top: 24, right: 24 }}
              >
                {values.confirmationStatus === 'confirmed' && t('active')}
                {values.confirmationStatus === 'inactived' && t('inactive')}
                {values.confirmationStatus === 'pending' && t('pending')}
              </Label>
            )}

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
                    Allowed *.jpeg, *.jpg, *.png, *.gif
                    <br /> max size of {fData(3145728)}
                  </Typography>
                }
              />
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
                label="Country"
                placeholder="Choose a country"
              />
              <Field.Text name="city" label={t('city')} />
              <Field.Text name="address" label={t('address')} />

              <Field.Select name="group" label={t('group')}>
                {TEAM_GROUPS.map((group) => (
                  <option key={group.label} value={group.value}>
                    {t(group.label)}
                  </option>
                ))}
              </Field.Select>

              <Field.Text name="rh" label={t('rh')} />
              <Field.Text name="eps" label={t('eps')} />
            </Box>

            <Stack spacing={3} px={3} py={3}>
              <Typography variant="subtitle2">Contacto de emergencia</Typography>
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
