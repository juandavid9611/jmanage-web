import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { AuthGuard } from 'src/auth/guard';
import DashboardLayout from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// OVERVIEW
const IndexPage = lazy(() => import('src/pages/dashboard/app'));
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const MonthlyPlayerComingPage = lazy(() => import('src/pages/dashboard/monthly-player-coming'));
// PAYMENT REQUEST
const PaymentRequestListPage = lazy(() => import('src/pages/dashboard/payment-request/list'));
const EmployeePaymentRequestListPage = lazy(() =>
  import('src/pages/dashboard/payment-request/employee-list')
);
const PaymentRequestCreatePage = lazy(() => import('src/pages/dashboard/payment-request/new'));
const PaymentRequestEditPage = lazy(() => import('src/pages/dashboard/payment-request/edit'));
// USER
const UserCardsPage = lazy(() => import('src/pages/dashboard/user/cards'));
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserCreatePage = lazy(() => import('src/pages/dashboard/user/new'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
// APP
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));

// ----------------------------------------------------------------------

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: (
      <AuthGuard>
        <DashboardLayout>
          <Suspense fallback={<LoadingScreen />}>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      </AuthGuard>
    ),
    children: [
      { element: <IndexPage />, index: true },
      { path: 'analytics', element: <OverviewAnalyticsPage /> },
      { path: 'monthly-player-coming-soon', element: <MonthlyPlayerComingPage /> },
      {
        path: 'user',
        children: [
          { element: <UserListPage />, index: true },
          { path: 'cards', element: <UserCardsPage /> },
          { path: 'list', element: <UserListPage /> },
          { path: 'new', element: <UserCreatePage /> },
          { path: ':id/edit', element: <UserEditPage /> },
        ],
      },
      {
        path: 'payment_request',
        children: [
          { element: <PaymentRequestListPage />, index: true },
          { path: 'list', element: <PaymentRequestListPage /> },
          { path: 'employee-list', element: <EmployeePaymentRequestListPage /> },
          { path: 'new', element: <PaymentRequestCreatePage /> },
          { path: ':id/edit', element: <PaymentRequestEditPage /> },
        ],
      },
      { path: 'calendar', element: <CalendarPage /> },
    ],
  },
];
