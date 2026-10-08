import { Navigate } from 'react-router-dom';

import { paths } from 'src/routes/paths';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

// Route guard for admin-only screens (product/order management). Mirrors the API, which
// authorizes with the caller's role in the ACTIVE ACCOUNT; falls back to the user's own role.
// Non-admins are redirected to the dashboard instead of seeing a blank/failed page.
export function AdminOnlyGuard({ children }) {
  const { user } = useAuthContext();

  const role = user?.accountsRoles?.[user?.activeAccountId] ?? user?.role;

  if (role !== 'admin') {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  return <>{children}</>;
}
