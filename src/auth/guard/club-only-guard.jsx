import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useAccountType } from 'src/hooks/use-account-type';

// ----------------------------------------------------------------------

// Route guard for features that only make sense for club accounts.
export function ClubOnlyGuard({ children }) {
  const accountType = useAccountType();

  if (accountType !== 'club') {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  return <>{children}</>;
}
