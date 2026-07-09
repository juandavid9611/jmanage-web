import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { TopAnalyticsView } from 'src/sections/overview/analytics/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('page_title_top_analytics')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TopAnalyticsView />
    </>
  );
}
