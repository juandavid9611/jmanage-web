import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { PublicTournamentListView } from 'src/sections/tournament/public-tournament-list-view';

// ----------------------------------------------------------------------

export default function PublicTournamentListPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('page_title_tournaments')} | ${CONFIG.site.name}` };

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <PublicTournamentListView />
    </>
  );
}
