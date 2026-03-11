import { lazy, Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { SplashScreen } from 'src/components/loading-screen';

// ----------------------------------------------------------------------

// Error
const Page404 = lazy(() => import('src/pages/error/404'));

// Public tournament pages
const PublicTournamentListPage = lazy(() => import('src/pages/tournament/public-list'));
const PublicTournamentDetailPage = lazy(() => import('src/pages/tournament/public-detail'));

// ----------------------------------------------------------------------

export const mainRoutes = [
  {
    element: (
      <Suspense fallback={<SplashScreen />}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: '404', element: <Page404 /> },
      {
        path: 'tournaments',
        children: [
          { index: true, element: <PublicTournamentListPage /> },
          { path: ':id', element: <PublicTournamentDetailPage /> },
        ],
      },
    ],
  },
];
