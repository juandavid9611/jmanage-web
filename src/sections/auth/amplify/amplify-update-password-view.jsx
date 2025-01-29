import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';
import { useRouter, useSearchParams } from 'src/routes/hooks';

import { useBoolean } from 'src/hooks/use-boolean';
import { useCountdownSeconds } from 'src/hooks/use-countdown';

import { SentIcon } from 'src/assets/icons';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { resetPassword, updatePassword } from 'src/auth/context/amplify';

export function getUpdatePasswordSchema(t) {
  return zod
    .object({
      code: zod
        .string()
        .min(1, { message: t('code_required') })
        .min(6, { message: t('code_min') }),
      email: zod
        .string()
        .min(1, { message: t('email_required') })
        .email({ message: t('email_invalid') }),
      password: zod
        .string()
        .min(1, { message: t('password_required') })
        .min(6, { message: t('password_min') }),
      confirmPassword: zod.string().min(1, { message: t('confirm_password_required') }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwords_do_not_match'),
      path: ['confirmPassword'],
    });
}

// ----------------------------------------------------------------------

export function AmplifyUpdatePasswordView() {
  const router = useRouter();
  const { t } = useTranslation();

  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const password = useBoolean();

  const { countdown, counting, startCountdown } = useCountdownSeconds(60);

  const defaultValues = {
    code: '',
    email: email || '',
    password: '',
    confirmPassword: '',
  };

  const UpdatePasswordSchema = useMemo(() => getUpdatePasswordSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(UpdatePasswordSchema),
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
      await updatePassword({
        username: data.email,
        confirmationCode: data.code,
        newPassword: data.password,
      });

      router.push(paths.auth.amplify.signIn);
      toast.success('Your password has been updated!');
    } catch (error) {
      console.error(error);
    }
  });

  const handleResendCode = useCallback(async () => {
    try {
      startCountdown();
      await resetPassword({ username: values.email });
    } catch (error) {
      console.error(error);
    }
  }, [startCountdown, values.email]);

  const renderHead = (
    <>
      <SentIcon sx={{ mx: 'auto' }} />

      <Stack spacing={1} sx={{ mt: 3, mb: 5, textAlign: 'center', whiteSpace: 'pre-line' }}>
        <Typography variant="h5">{t('update_password_heading')}</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('update_password_body')}
        </Typography>
      </Stack>
    </>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="email"
        label={t('email_label')}
        placeholder={t('email_placeholder_example')}
        InputLabelProps={{ shrink: true }}
        disabled
      />

      <Field.Code name="code" />

      <Field.Text
        name="password"
        label={t('password')}
        placeholder={t('password_placeholder_hint')}
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <Field.Text
        name="confirmPassword"
        label={t('confirm_new_password')}
        type={password.value ? 'text' : 'password'}
        InputLabelProps={{ shrink: true }}
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={password.onToggle} edge="end">
                <Iconify icon={password.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'} />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('updating_password')}
      >
        {t('update_password')}
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
