import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TournamentCreateView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

const metadata = { title: `Crear Torneo | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <TournamentCreateView />
    </>
  );
}
