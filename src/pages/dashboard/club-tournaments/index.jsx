import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { ClubTournamentsView } from 'src/sections/engagement/view';

// ----------------------------------------------------------------------

const metadata = { title: `Torneos del Club | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <ClubTournamentsView />
    </>
  );
}
