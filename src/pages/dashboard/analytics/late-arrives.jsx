import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { TopLateArrivesView } from 'src/sections/overview/analytics/view';

// ----------------------------------------------------------------------

const metadata = { title: `Late Arrives | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <TopLateArrivesView />
    </>
  );
}
