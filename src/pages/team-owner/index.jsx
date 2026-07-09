import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { TeamOwnerTournamentView } from 'src/sections/team-owner/team-owner-tournament-view';

import { useAuthContext } from 'src/auth/hooks';
import { RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

export default function TeamOwnerPage() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('nav_my_tournament')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

  const { user } = useAuthContext();
  const currentRole = user?.accountsRoles?.[user?.activeAccountId];

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <RoleBasedGuard hasContent currentRole={currentRole} acceptRoles={['team_owner']}>
        <TeamOwnerTournamentView />
      </RoleBasedGuard>
    </>
  );
}
