import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useCountdownSeconds } from 'src/hooks/use-countdown';

import { EmailInboxIcon } from 'src/assets/icons';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { confirmSignUp, resendSignUpCode } from 'src/auth/context/amplify';

// ----------------------------------------------------------------------

export function getVerifySchema(t) {
  return zod.object({
    code: zod
      .string()
      .min(1, { message: t('code_required') })
      .min(6, { message: t('code_min') }),
    email: zod
      .string()
      .min(1, { message: t('email_required') })
      .email({ message: t('email_invalid') }),
  });
}

// ----------------------------------------------------------------------

export function AmplifyVerifyView() {
  const router = useRouter();
  const { t } = useTranslation();

  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const { countdown, counting, startCountdown } = useCountdownSeconds(60);

  const defaultValues = { code: '', email: email || '' };

  const VerifySchema = useMemo(() => getVerifySchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(VerifySchema),
    defaultValues,
  });

  const {
    watch,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await confirmSignUp({ username: data.email, confirmationCode: data.code });
      router.push(paths.auth.amplify.signIn);
    } catch (error) {
      console.error(error);
    }
  });

  const handleResendCode = useCallback(async () => {
    try {
      startCountdown();
      await resendSignUpCode?.({ username: values.email });
    } catch (error) {
      console.error(error);
    }
  }, [startCountdown, values.email]);

  const renderHead = (
    <>
      <EmailInboxIcon sx={{ mx: 'auto' }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5, textAlign: 'center', whiteSpace: 'pre-line' }}>
        <Typography variant="h5">{t('verify_email_heading')}</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('verify_email_body')}
        </Typography>
      </Stack>
    </>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="email"
        label={t('email_address')}
        placeholder={t('email_placeholder_example')}
        InputLabelProps={{ shrink: true }}
      />

      <Field.Code name="code" />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('verifying')}
      >
        {t('verify')}
      </LoadingButton>

      <Typography variant="body2" sx={{ mx: 'auto' }}>
        {`${t('no_code_yet')} `}
        <Link
          variant="subtitle2"
          onClick={handleResendCode}
          sx={{
            cursor: 'pointer',
            ...(counting && { color: 'text.disabled', pointerEvents: 'none' }),
          }}
        >
          {t('resend_code')} {counting && `(${countdown}s)`}
        </Link>
      </Typography>

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
