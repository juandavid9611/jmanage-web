import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { MatchDetailView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('page_title_match_details')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <MatchDetailView />
    </>
  );
}
