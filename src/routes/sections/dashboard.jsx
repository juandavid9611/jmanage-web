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
// Tour
const TourDetailsPage = lazy(() => import('src/pages/dashboard/tour/details'));
const TourListPage = lazy(() => import('src/pages/dashboard/tour/list'));
const TourCreatePage = lazy(() => import('src/pages/dashboard/tour/new'));
const TourEditPage = lazy(() => import('src/pages/dashboard/tour/edit'));
// Product
const ProductDetailsPage = lazy(() => import('src/pages/dashboard/product/details'));
const ProductListPage = lazy(() => import('src/pages/dashboard/product/list'));
const ProductCreatePage = lazy(() => import('src/pages/dashboard/product/new'));
const ProductEditPage = lazy(() => import('src/pages/dashboard/product/edit'));
// Shop
const ProductShopListPage = lazy(() => import('src/pages/dashboard/shop/list'));
const ProductShopDetailsPage = lazy(() => import('src/pages/dashboard/shop/details'));
const ProductShopCheckoutPage = lazy(() => import('src/pages/dashboard/shop/checkout'));
// Order
const OrderListPage = lazy(() => import('src/pages/dashboard/order/list'));
const OrderDetailsPage = lazy(() => import('src/pages/dashboard/order/details'));
// File manager
const FileManagerPage = lazy(() => import('src/pages/dashboard/file-manager'));
// Tournament
const TournamentListPage = lazy(() => import('src/pages/dashboard/tournament/list'));
const TournamentCreatePage = lazy(() => import('src/pages/dashboard/tournament/new'));
const TournamentDetailsPage = lazy(() => import('src/pages/dashboard/tournament/details'));
const TournamentEditPage = lazy(() => import('src/pages/dashboard/tournament/edit'));
const TournamentMatchesPage = lazy(() => import('src/pages/dashboard/tournament/matches'));
const TournamentMatchDetailPage = lazy(() => import('src/pages/dashboard/tournament/match-detail'));
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
      {
        path: 'tour',
        children: [
          { element: <TourListPage />, index: true },
          { path: 'list', element: <TourListPage /> },
          { path: ':id', element: <TourDetailsPage /> },
          { path: 'new', element: <TourCreatePage /> },
          { path: ':id/edit', element: <TourEditPage /> },
        ],
      },
      {
        path: 'product',
        children: [
          { element: <ProductListPage />, index: true },
          { path: 'list', element: <ProductListPage /> },
          { path: ':id', element: <ProductDetailsPage /> },
          { path: 'new', element: <ProductCreatePage /> },
          { path: ':id/edit', element: <ProductEditPage /> },
        ],
      },
      {
        path: 'shop',
        children: [
          { element: <ProductShopListPage />, index: true },
          { path: 'list', element: <ProductShopListPage /> },
          { path: ':id', element: <ProductShopDetailsPage /> },
          { path: 'checkout', element: <ProductShopCheckoutPage /> },
        ],
      },
      {
        path: 'order',
        children: [
          { element: <OrderListPage />, index: true },
          { path: 'list', element: <OrderListPage /> },
          { path: ':id', element: <OrderDetailsPage /> },
        ],
      },
      { path: 'file-manager', element: <FileManagerPage /> },
      {
        path: 'tournament',
        children: [
          { element: <TournamentListPage />, index: true },
          { path: 'list', element: <TournamentListPage /> },
          { path: 'new', element: <TournamentCreatePage /> },
          { path: ':id', element: <TournamentDetailsPage /> },
          { path: ':id/edit', element: <TournamentEditPage /> },
          { path: ':id/matches', element: <TournamentMatchesPage /> },
          { path: ':id/matches/:matchId', element: <TournamentMatchDetailPage /> },
        ],
      },
    ],
  },
];
