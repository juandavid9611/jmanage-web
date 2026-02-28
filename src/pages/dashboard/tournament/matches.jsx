import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { MatchCenterView } from 'src/sections/tournament/view';

// ----------------------------------------------------------------------

const metadata = { title: `Partidos | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <MatchCenterView />
    </>
  );
}
