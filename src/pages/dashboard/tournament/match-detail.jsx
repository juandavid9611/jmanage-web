import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MatchDetailView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

const metadata = { title: `Detalle Partido | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <MatchDetailView />
    </>
  );
}
