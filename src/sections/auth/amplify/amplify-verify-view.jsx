import { z as zod } from 'zod';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
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

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { confirmSignUp, resendSignUpCode } from 'src/auth/context/amplify';

// ----------------------------------------------------------------------

export const VerifySchema = zod.object({
  code: zod
    .string()
    .min(1, { message: 'El código es requerido!' })
    .min(6, { message: 'El código debe tener al menos 6 caracteres!' }),
  email: zod
    .string()
    .min(1, { message: 'El correo es requerido!' })
    .email({ message: 'El correo debe ser una dirección de correo electrónico válida!' }),
});

// ----------------------------------------------------------------------

export function AmplifyVerifyView() {
  const router = useRouter();

  const searchParams = useSearchParams();

  const email = searchParams.get('email');

  const { countdown, counting, startCountdown } = useCountdownSeconds(60);

  const defaultValues = { code: '', email: email || '' };

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
      toast.success('Your email has been verified!');
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
        <Typography variant="h5">¡Por favor verifica tu correo!</Typography>

        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {`Hemos enviado un código de confirmación de 6 dígitos a tu correo. \nPor favor ingresa el código en el cuadro de abajo para verificar tu correo.`}
        </Typography>
      </Stack>
    </>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Field.Text
        name="email"
        label="Dirección de correo electrónico"
        placeholder="ejemplo@gmail.com"
        InputLabelProps={{ shrink: true }}
      />

      <Field.Code name="code" />

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Verificando..."
      >
        Verificar
      </LoadingButton>

      <Typography variant="body2" sx={{ mx: 'auto' }}>
        {`¿No tienes un código? `}
        <Link
          variant="subtitle2"
          onClick={handleResendCode}
          sx={{
            cursor: 'pointer',
            ...(counting && { color: 'text.disabled', pointerEvents: 'none' }),
          }}
        >
          Reenviar código {counting && `(${countdown}s)`}
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
        Regresar a iniciar sesión
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
