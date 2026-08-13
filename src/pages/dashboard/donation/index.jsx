import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { DonationRecordView } from 'src/sections/donation/view/donation-record-view';

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('donations_campaign_title')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DonationRecordView />
    </>
  );
}
