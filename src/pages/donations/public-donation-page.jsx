import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { PublicDonationView } from 'src/sections/donation/public-donation-view';

export default function PublicDonationPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('donations_campaign_title')} | ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <PublicDonationView />
    </>
  );
}
