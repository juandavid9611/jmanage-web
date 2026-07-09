import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { PublicTournamentDetailView } from 'src/sections/tournament/public-tournament-detail-view';

// ----------------------------------------------------------------------

export default function PublicTournamentDetailPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('tournament')} | ${CONFIG.site.name}` };

  const { id } = useParams();

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <PublicTournamentDetailView id={id} />
    </>
  );
}
