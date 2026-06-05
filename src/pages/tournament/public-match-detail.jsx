import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { PublicMatchDetailView } from 'src/sections/tournament/public-match-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `Partido | ${CONFIG.site.name}` };

export default function PublicMatchDetailPage() {
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
