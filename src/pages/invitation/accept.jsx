import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';
import { AuthCenteredLayout } from 'src/layouts/auth-centered';

import { InvitationAcceptView } from 'src/sections/invitation/invitation-accept-view';

// ----------------------------------------------------------------------

export default function InvitationAcceptPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('page_title_accept_invitation')} | ${CONFIG.site.name}` };

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
