import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { SplashScreen } from 'src/components/loading-screen';

import { GuestGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

/** **************************************
 * Amplify
 *************************************** */
const Amplify = {
  SignInPage: lazy(() => import('src/pages/auth/amplify/sign-in')),
  SignUpPage: lazy(() => import('src/pages/auth/amplify/sign-up')),
  VerifyPage: lazy(() => import('src/pages/auth/amplify/verify')),
  UpdatePasswordPage: lazy(() => import('src/pages/auth/amplify/update-password')),
  ResetPasswordPage: lazy(() => import('src/pages/auth/amplify/reset-password')),
};

const authAmplify = {
  path: 'amplify',
  children: [
    {
      path: 'sign-in',
      element: (
        <GuestGuard>
          <AuthCenteredLayout section={{ title: 'Hi, Welcome back' }}>
            <Amplify.SignInPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'sign-up',
      element: (
        <GuestGuard>
          <AuthCenteredLayout>
            <Amplify.SignUpPage />
          </AuthCenteredLayout>
        </GuestGuard>
      ),
    },
    {
      path: 'verify',
      element: (
        <AuthCenteredLayout>
          <Amplify.VerifyPage />
        </AuthCenteredLayout>
      ),
    },
    {
      path: 'reset-password',
      element: (
        <AuthCenteredLayout>
          <Amplify.ResetPasswordPage />
        </AuthCenteredLayout>
      ),
    },
    {
      path: 'update-password',
      element: (
        <AuthCenteredLayout>
          <Amplify.UpdatePasswordPage />
        </AuthCenteredLayout>
      ),
    },
  ],
};
// ----------------------------------------------------------------------

export const authRoutes = [
  {
    path: 'auth',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [authAmplify],
  },
];
