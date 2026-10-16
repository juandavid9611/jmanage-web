import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useAccountType } from 'src/hooks/use-account-type';

// ----------------------------------------------------------------------

// Route guard for features that only make sense for tournament accounts.
export function TournamentOnlyGuard({ children }) {
  const accountType = useAccountType();

  if (accountType !== 'tournament') {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  return <>{children}</>;
}
