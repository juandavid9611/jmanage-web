import { z as zod } from 'zod';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { createUser } from 'src/actions/user';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { signUp } from 'src/auth/context/amplify';

// ----------------------------------------------------------------------

export function getSignUpSchema(t) {
  return zod.object({
    firstName: zod.string().min(1, { message: t('first_name_required') }),
    lastName: zod.string().min(1, { message: t('last_name_required') }),
    email: zod
      .string()
      .min(1, { message: t('email_required') })
      .email({ message: t('email_invalid') }),
    password: zod
      .string()
      .min(1, { message: t('password_required') })
      .min(6, { message: t('password_min') }),
    teamCode: zod.literal('vittoria2024sm', { message: t('team_code_invalid') }),
    accountId: zod.string().default('vittoriacd'),
  });
}

// ----------------------------------------------------------------------

export function AmplifySignUpView() {
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();
  const { t } = useTranslation();

  const password = useBoolean();

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    teamCode: '',
  };

  const SignUpSchema = useMemo(() => getSignUpSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const response = await signUp({
        username: data.email.toLowerCase(),
        password: data.password,
        fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      });

      const userData = {
        ...data,
        id: response.userId,
        name: `${data.firstName} ${data.lastName}`,
        email: data.email.toLowerCase(),
      };

      await createUser(userData);

      const searchParams = new URLSearchParams({ email: data.email }).toString();

      const href = `${paths.auth.amplify.verify}?${searchParams}`;

      router.push(href);
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : error);
    }
  });

  const renderHead = (
    <Stack spacing={1.5} sx={{ mb: 5 }}>
      <Typography variant="h5">{t('sign_up_heading')}</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {t('already_have_account')}
        </Typography>

        <Link component={RouterLink} href={paths.auth.amplify.signIn} variant="subtitle2">
          {t('sign_in')}
        </Link>
      </Stack>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Field.Text name="firstName" label={t('first_name')} InputLabelProps={{ shrink: true }} />
        <Field.Text name="lastName" label={t('last_name')} InputLabelProps={{ shrink: true }} />
      </Stack>

      <Field.Text name="email" label={t('email_label')} InputLabelProps={{ shrink: true }} />

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

      <Field.Text name="teamCode" label={t('team_code')} InputLabelProps={{ shrink: true }} />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator={t('creating_account')}
      >
        {t('create_account')}
      </LoadingButton>
    </Stack>
  );

  const renderTerms = (
    <Typography
      component="div"
      sx={{
        mt: 3,
        textAlign: 'center',
        typography: 'caption',
        color: 'text.secondary',
      }}
    >
      {`${t('sign_up_terms_prefix')} `}
      <Link underline="always" color="text.primary">
        {t('terms_of_service')}
      </Link>
      {` ${t('and')} `}
      <Link underline="always" color="text.primary">
        {t('privacy_policy')}
      </Link>
      .
    </Typography>
  );

  return (
    <>
      {renderHead}

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        {renderForm}
      </Form>

      {renderTerms}
    </>
  );
}
