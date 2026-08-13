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
        <meta name="description" content={t('donations_hero_description')} />
        <meta property="og:title" content={t('donations_campaign_title')} />
        <meta property="og:description" content={t('donations_hero_description')} />
      </Helmet>
      <PublicDonationView />
    </>
  );
}
