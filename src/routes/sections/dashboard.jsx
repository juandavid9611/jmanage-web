import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { CONFIG } from 'src/config-global';
import { DashboardLayout } from 'src/layouts/dashboard';

import { LoadingScreen } from 'src/components/loading-screen';

import { AuthGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const IndexPage = lazy(() => import('src/pages/dashboard'));
const CalendarPage = lazy(() => import('src/pages/dashboard/calendar'));
// Analytics
const OverviewAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics'));
const TopAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics/top'));
const LateArrivesAnalyticsPage = lazy(() => import('src/pages/dashboard/analytics/late-arrives'));
// Invoice
const InvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/list'));
const InvoiceCreatePage = lazy(() => import('src/pages/dashboard/invoice/new'));
const InvoiceEditPage = lazy(() => import('src/pages/dashboard/invoice/edit'));
const UserInvoiceListPage = lazy(() => import('src/pages/dashboard/invoice/user-list'));
// User
const UserListPage = lazy(() => import('src/pages/dashboard/user/list'));
const UserEditPage = lazy(() => import('src/pages/dashboard/user/edit'));
const OwnUserEditPage = lazy(() => import('src/pages/dashboard/user/own-edit'));
// ----------------------------------------------------------------------

const layoutContent = (
  <DashboardLayout>
    <Suspense fallback={<LoadingScreen />}>
      <Outlet />
    </Suspense>
  </DashboardLayout>
);

export const dashboardRoutes = [
  {
    path: 'dashboard',
    element: CONFIG.auth.skip ? <>{layoutContent}</> : <AuthGuard>{layoutContent}</AuthGuard>,
    children: [
      { element: <IndexPage />, index: true },
      {
        path: 'analytics',
        children: [
          { element: <OverviewAnalyticsPage />, index: true },
          { path: 'top', element: <TopAnalyticsPage /> },
          { path: 'late-arrives', element: <LateArrivesAnalyticsPage /> },
        ],
      },
      { path: 'calendar', element: <CalendarPage /> },
      {
        path: 'invoice',
        children: [
          { element: <InvoiceListPage />, index: true },
          { path: 'list', element: <InvoiceListPage /> },
          { path: ':id/edit', element: <InvoiceEditPage /> },
          { path: 'new', element: <InvoiceCreatePage /> },
          { path: 'user-list', element: <UserInvoiceListPage /> },
        ],
      },
      {
        path: 'user',
        children: [
          { element: <UserListPage />, index: true },
          { path: 'list', element: <UserListPage /> },
          { path: ':id/edit', element: <UserEditPage /> },
          { path: ':id/own-edit', element: <OwnUserEditPage /> },
        ],
      },
      {},
    ],
  },
];
