import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { PasswordIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { resetPassword } from 'src/auth/context/amplify';

// ----------------------------------------------------------------------

export function getResetPasswordSchema(t) {
  return zod.object({
    email: zod
      .string()
      .min(1, { message: t('email_required') })
      .email({ message: t('email_invalid') }),
  });
}

// ----------------------------------------------------------------------

export function AmplifyResetPasswordView() {
  const router = useRouter();
  const { t } = useTranslation();

  const defaultValues = {
    email: '',
  };

  const ResetPasswordSchema = useMemo(() => getResetPasswordSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(ResetPasswordSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await resetPassword({ username: data.email });

      const searchParams = new URLSearchParams({ email: data.email }).toString();

      const href = `${paths.auth.amplify.updatePassword}?${searchParams}`;
      router.push(href);
    } catch (error) {
      console.error(error);
    }
  });

  const renderHead = (
    <>
      <PasswordIcon sx={{ mx: 'auto' }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5, textAlign: 'center', whiteSpace: 'pre-line' }}>
        <Typography variant="h5">{t('forgot_password')}</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('reset_password_body')}
        </Typography>
      </Stack>
    </>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        autoFocus
        name="email"
        label={t('email_label')}
        placeholder={t('email_placeholder_example')}
        InputLabelProps={{ shrink: true }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('sending_request')}
      >
        {t('send_request')}
      </LoadingButton>

      <Link
        component={RouterLink}
        href={paths.auth.amplify.signIn}
        color="inherit"
        variant="subtitle2"
        sx={{ gap: 0.5, alignSelf: 'center', alignItems: 'center', display: 'inline-flex' }}
      >
        <Iconify width={16} icon="eva:arrow-ios-back-fill" />
        {t('back_to_sign_in')}
      </Link>
    </Stack>
  );

  return (
    <>
      {renderHead}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>
    </>
  );
}
