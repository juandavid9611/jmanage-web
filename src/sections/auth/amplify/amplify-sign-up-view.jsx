import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
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

export const SignUpSchema = zod.object({
  firstName: zod.string().min(1, { message: 'Nombre requeridos!' }),
  lastName: zod.string().min(1, { message: 'Apellido requeridos!' }),
  email: zod
    .string()
    .min(1, { message: 'Correo requerido!' })
    .email({ message: 'Dirección de correo no valida!' }),
  password: zod
    .string()
    .min(1, { message: 'Contraseña requerida!' })
    .min(6, { message: 'Contraseña debe tener al menos 6 caracteres!' }),
  teamCode: zod.literal('vittoria2024sm', { message: 'Código de equipo no válido!' }),
});

// ----------------------------------------------------------------------

export function AmplifySignUpView() {
  const [errorMsg, setErrorMsg] = useState('');

  const router = useRouter();

  const password = useBoolean();

  const defaultValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    teamCode: '',
  };

  const methods = useForm({
    resolver: zodResolver(SignUpSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    data.email = data.email.toLowerCase();
    try {
      const response = await signUp({
        username: data.email,
        password: data.password,
        fullName: `${data.firstName.trim()} ${data.lastName.trim()}`,
      });

      data.id = response.userId;
      data.name = `${data.firstName} ${data.lastName}`;

      await createUser(data);

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
      <Typography variant="h5">Comienza tu camino de la mano de SportsManage</Typography>

      <Stack direction="row" spacing={0.5}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Ya tienes una cuenta?
        </Typography>

        <Link component={RouterLink} href={paths.auth.amplify.signIn} variant="subtitle2">
          Iniciar sesión
        </Link>
      </Stack>
    </Stack>
  );

  const renderForm = (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <Field.Text name="firstName" label="Nombre" InputLabelProps={{ shrink: true }} />
        <Field.Text name="lastName" label="Apellido" InputLabelProps={{ shrink: true }} />
      </Stack>

      <Field.Text name="email" label="Correo" InputLabelProps={{ shrink: true }} />

      <Field.Text
        name="password"
        label="Contraseña"
        placeholder="6+ caracteres"
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

      <Field.Text name="teamCode" label="Codigo de equipo" InputLabelProps={{ shrink: true }} />

      <LoadingButton
        fullWidth
        color="inherit"
        size="large"
        type="submit"
        variant="contained"
        loading={isSubmitting}
        loadingIndicator="Creando cuenta..."
      >
        Crear cuenta
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
      {'Creando una cuenta, acetas los '}
      <Link underline="always" color="text.primary">
        Terms of service
      </Link>
      {' y '}
      <Link underline="always" color="text.primary">
        Privacy policy
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
