import { Helmet } from 'react-helmet-async';
import { useParams } from 'react-router-dom';

import { CONFIG } from 'src/config-global';

import { PublicTournamentDetailView } from 'src/sections/tournament/public-tournament-detail-view';

// ----------------------------------------------------------------------

const metadata = { title: `Torneo | ${CONFIG.site.name}` };

export default function PublicTournamentDetailPage() {
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
