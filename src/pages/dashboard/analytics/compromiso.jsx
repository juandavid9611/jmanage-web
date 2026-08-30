import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { CompromisoAnalyticsView } from 'src/sections/overview/analytics/view';

// ----------------------------------------------------------------------

const metadata = { title: `Compromiso | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <CompromisoAnalyticsView />
    </>
  );
}
