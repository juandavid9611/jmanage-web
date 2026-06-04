import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { OverviewAppView } from 'src/sections/overview/app/view';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

const metadata = { title: `Dashboard - ${CONFIG.site.name}` };

export default function OverviewAppPage() {
  const { user } = useAuthContext();
  const activeRole = user?.accountsRoles?.[user?.activeAccountId];

  if (activeRole === 'team_owner') {
    return <Navigate to="/dashboard/team-owner" replace />;
  }

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <OverviewAppView />
    </>
  );
}
