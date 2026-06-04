import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';

import { useBoolean } from 'src/hooks/use-boolean';

import { acceptInvitation, useGetPublicInvitation } from 'src/actions/invitation';

import { Iconify } from 'src/components/iconify';
import { AnimateLogo1 } from 'src/components/animate';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from 'src/auth/hooks';
import { signInWithPassword } from 'src/auth/context/amplify';

// ----------------------------------------------------------------------

const ExistingUserSchema = zod.object({
  email: zod
    .string()
    .min(1, { message: 'Correo requerido!' })
    .email({ message: 'Dirección de correo no válida!' }),
  password: zod
    .string()
    .min(1, { message: 'Contraseña requerida!' })
    .min(6, { message: 'La contraseña debe tener al menos 6 caracteres!' }),
});

const NewUserSchema = zod
  .object({
    name: zod
      .string()
      .min(1, { message: 'Tu nombre es requerido!' })
      .min(2, { message: 'Tu nombre debe tener al menos 2 caracteres!' }),
    phoneNumber: zod
      .string()
      .min(1, { message: 'Número de contacto es requerido!' })
      .min(7, { message: 'El número de contacto debe tener al menos 7 dígitos!' }),
    email: zod
      .string()
      .min(1, { message: 'Correo requerido!' })
      .email({ message: 'Dirección de correo no válida!' }),
    password: zod
      .string()
      .min(1, { message: 'Contraseña requerida!' })
      .min(6, { message: 'La contraseña debe tener al menos 6 caracteres!' }),
    confirmPassword: zod.string().min(1, { message: 'Confirma tu contraseña!' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden!',
    path: ['confirmPassword'],
  });

// ----------------------------------------------------------------------

function SkeletonState() {
  return (
    <Stack spacing={2}>
      <Skeleton variant="text" width="60%" height={40} />
      <Skeleton variant="text" width="80%" height={24} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={56} />
      <Skeleton variant="rectangular" height={48} />
    </Stack>
  );
}

function TerminalState({ title, subtitle }) {
  return (
    <Stack spacing={2} alignItems="center" sx={{ textAlign: 'center', py: 4 }}>
      <Iconify icon="solar:info-circle-bold" width={48} sx={{ color: 'text.secondary' }} />
      <Typography variant="h6">{title}</Typography>
      {subtitle && (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

// ----------------------------------------------------------------------

function ExistingUserForm({ invitation, token }) {
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();
  const navigate = useNavigate();
  const { checkUserSession, switchAccount } = useAuthContext();

  const methods = useForm({
    resolver: zodResolver(ExistingUserSchema),
    defaultValues: {
      email: invitation.email ?? '',
      password: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');

    try {
      await signInWithPassword({ username: data.email, password: data.password });
    } catch (signInError) {
      console.error(signInError);
      setErrorMsg(signInError?.message || 'Credenciales inválidas. Verifica el correo y la contraseña.');
      return;
    }

    try {
      const result = await acceptInvitation({ token });
      await checkUserSession?.();
      if (result?.accountId) {
        switchAccount?.(result.accountId);
      } else {
        navigate('/dashboard');
      }
    } catch (acceptError) {
      console.error(acceptError);
      setErrorMsg(acceptError?.response?.data?.detail || 'Tu sesión está activa, pero no pudimos aceptar la invitación. Contacta al organizador.');
    }
  });

  return (
    <>
      <AnimateLogo1 sx={{ mb: 3, mx: 'auto' }} />

      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5" textAlign="center">
          Inicia sesión para unirte al equipo
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {invitation.teamName && invitation.tournamentName
            ? `Equipo ${invitation.teamName} en ${invitation.tournamentName}`
            : 'Acepta tu invitación'}
        </Typography>
      </Stack>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Field.Text
            name="email"
            label="Correo"
            InputLabelProps={{ shrink: true }}
            inputProps={{ readOnly: true }}
          />

          <Field.Text
            name="password"
            label="Contraseña"
            placeholder="6+ caracteres"
            type={password.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'current-password' }}
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
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Iniciando sesión..."
          >
            Aceptar invitación
          </LoadingButton>
        </Stack>
      </Form>
    </>
  );
}

// ----------------------------------------------------------------------

function NewUserForm({ invitation, token }) {
  const [errorMsg, setErrorMsg] = useState('');
  const password = useBoolean();
  const confirmPassword = useBoolean();
  const navigate = useNavigate();
  const { checkUserSession } = useAuthContext();

  const methods = useForm({
    resolver: zodResolver(NewUserSchema),
    defaultValues: {
      name: '',
      phoneNumber: '',
      email: invitation.email ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    setErrorMsg('');

    try {
      await acceptInvitation({
        token,
        password: data.password,
        name: data.name,
        phoneNumber: data.phoneNumber,
      });
    } catch (acceptError) {
      console.error(acceptError);
      setErrorMsg(acceptError?.response?.data?.detail || acceptError?.message || 'No pudimos aceptar tu invitación. Inténtalo de nuevo.');
      return;
    }

    try {
      // User now exists in Cognito — sign in to install the Amplify session
      await signInWithPassword({ username: data.email, password: data.password });
      await checkUserSession?.();
      navigate('/dashboard');
    } catch (signInError) {
      console.error(signInError);
      setErrorMsg('Tu cuenta fue creada. Intenta iniciar sesión directamente con el correo y la contraseña que acabas de configurar.');
    }
  });

  return (
    <>
      <AnimateLogo1 sx={{ mb: 3, mx: 'auto' }} />

      <Stack spacing={1.5} sx={{ mb: 5 }}>
        <Typography variant="h5" textAlign="center">
          Establece tu contraseña para aceptar la invitación
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
          {invitation.teamName && invitation.tournamentName
            ? `Equipo ${invitation.teamName} en ${invitation.tournamentName}`
            : 'Acepta tu invitación'}
        </Typography>
      </Stack>

      {!!errorMsg && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {errorMsg}
        </Alert>
      )}

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          <Field.Text
            name="name"
            label="Tu nombre"
            placeholder="Cómo te van a ver en el torneo"
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'name' }}
          />

          <Field.Text
            name="phoneNumber"
            label="Número de contacto"
            placeholder="3001234567"
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'tel', inputMode: 'tel' }}
          />

          <Field.Text
            name="email"
            label="Correo"
            InputLabelProps={{ shrink: true }}
            inputProps={{ readOnly: true }}
          />

          <Field.Text
            name="password"
            label="Contraseña"
            placeholder="6+ caracteres"
            type={password.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'new-password' }}
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
            label="Confirmar contraseña"
            placeholder="6+ caracteres"
            type={confirmPassword.value ? 'text' : 'password'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ autoComplete: 'new-password' }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={confirmPassword.onToggle} edge="end">
                    <Iconify
                      icon={confirmPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                    />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <LoadingButton
            fullWidth
            color="inherit"
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            loadingIndicator="Aceptando invitación..."
          >
            Aceptar invitación
          </LoadingButton>
        </Stack>
      </Form>
    </>
  );
}

// ----------------------------------------------------------------------

export function InvitationAcceptView() {
  const { token } = useParams();
  const { invitation, invitationLoading, invitationError } = useGetPublicInvitation(token);

  if (invitationLoading) {
    return <SkeletonState />;
  }

  if (invitationError) {
    const status = invitationError?.response?.status;
    if (status === 404) {
      return (
        <TerminalState
          title="Invitación no encontrada"
          subtitle="El enlace de invitación no es válido o ha expirado. Contacta al organizador del torneo para obtener uno nuevo."
        />
      );
    }
    return (
      <TerminalState
        title="Error al cargar la invitación"
        subtitle="Ocurrió un error al cargar la invitación. Por favor intenta nuevamente más tarde."
      />
    );
  }

  if (!invitation) {
    return <SkeletonState />;
  }

  if (invitation.status === 'accepted') {
    return (
      <TerminalState
        title="Invitación ya aceptada"
        subtitle="Esta invitación ya fue aceptada. Si necesitas acceso, contacta al organizador del torneo."
      />
    );
  }

  if (invitation.status === 'revoked') {
    return (
      <TerminalState
        title="Invitación revocada"
        subtitle="Esta invitación fue revocada. Contacta al organizador del torneo para obtener una nueva."
      />
    );
  }

  if (invitation.status === 'expired') {
    return (
      <TerminalState
        title="Invitación expirada"
        subtitle="Esta invitación ha expirado. Contacta al organizador del torneo para obtener una nueva."
      />
    );
  }

  if (invitation.status !== 'pending') {
    return (
      <TerminalState
        title={`Invitación ${invitation.status}`}
        subtitle="Contacta al organizador del torneo para obtener una nueva invitación."
      />
    );
  }

  if (invitation.emailHasExistingUser) {
    return <ExistingUserForm invitation={invitation} token={token} />;
  }

  return <NewUserForm invitation={invitation} token={token} />;
}
