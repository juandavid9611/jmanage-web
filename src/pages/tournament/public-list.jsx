import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { PublicTournamentListView } from 'src/sections/tournament/public-tournament-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `Torneos | ${CONFIG.site.name}` };

export default function PublicTournamentListPage() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <PublicTournamentListView />
    </>
  );
}
