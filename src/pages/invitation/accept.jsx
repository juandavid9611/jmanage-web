import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';
import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { InvitationAcceptView } from 'src/sections/invitation/invitation-accept-view';

// ----------------------------------------------------------------------

const metadata = { title: `Aceptar invitación | ${CONFIG.site.name}` };

export default function InvitationAcceptPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <AuthCenteredLayout>
        <InvitationAcceptView />
      </AuthCenteredLayout>
    </>
  );
}
