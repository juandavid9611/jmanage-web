import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TournamentListView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

const metadata = { title: `Torneos | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <TournamentListView />
    </>
  );
}
