import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TeamOwnerTournamentView } from 'src/sections/team-owner/team-owner-tournament-view';

import { useAuthContext } from 'src/auth/hooks';
import { RoleBasedGuard } from 'src/auth/guard';

// ----------------------------------------------------------------------

const metadata = { title: `Mi torneo | Dashboard - ${CONFIG.site.name}` };

export default function TeamOwnerPage() {
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
