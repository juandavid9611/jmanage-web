import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { OverviewAppView } from 'src/sections/overview/app/view';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export default function OverviewAppPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('label_dashboard')} - ${CONFIG.site.name}` };

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
