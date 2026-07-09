import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { AmplifyResetPasswordView } from 'src/sections/auth/amplify';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = { title: `${t('page_title_reset_password')} | Amplify - ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <AmplifyResetPasswordView />
    </>
  );
}
