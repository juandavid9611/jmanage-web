import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { CONFIG } from 'src/config-global';

import { PublicMatchDetailView } from 'src/sections/tournament/public-match-detail-view';

// ----------------------------------------------------------------------

export default function PublicMatchDetailPage() {
  const { t } = useTranslation();
  const metadata = { title: `${t('match')} | ${CONFIG.site.name}` };

  const { id, matchId } = useParams();

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <PublicMatchDetailView tournamentId={id} matchId={matchId} />
    </>
  );
}
