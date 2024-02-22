import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { GuestGuard } from 'src/auth/guard';
import CompactLayout from 'src/layouts/compact';
import AuthClassicLayout from 'src/layouts/auth/classic';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// AMPLIFY
const AmplifyRegisterPage = lazy(() => import('src/pages/auth/amplify/register'));
const AmplifyLoginPage = lazy(() => import('src/pages/auth/amplify/login'));
const AmplifyVerifyPage = lazy(() => import('src/pages/auth/amplify/verify'));
const AmplifyNewPasswordPage = lazy(() => import('src/pages/auth/amplify/new-password'));
const AmplifyForgotPasswordPage = lazy(() => import('src/pages/auth/amplify/forgot-password'));


// ----------------------------------------------------------------------

const authAmplify = {
  path: 'amplify',
  element: (
    <GuestGuard>
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    </GuestGuard>
  ),
  children: [
    {
      path: 'login',
      element: (
        <AuthClassicLayout>
          <AmplifyLoginPage />
        </AuthClassicLayout>
      ),
    },
    {
      path: 'register',
      element: (
        <AuthClassicLayout title="Manage the job more effectively with Minimal">
          <AmplifyRegisterPage />
        </AuthClassicLayout>
      ),
    },
    {
      element: (
        <CompactLayout>
          <Outlet />
        </CompactLayout>
      ),
      children: [
        { path: 'verify', element: <AmplifyVerifyPage /> },
        { path: 'new-password', element: <AmplifyNewPasswordPage /> },
        { path: 'forgot-password', element: <AmplifyForgotPasswordPage /> },
      ],
    },
  ],
};

export const authRoutes = [
  {
    path: 'auth',
    children: [authAmplify],
  },
];
