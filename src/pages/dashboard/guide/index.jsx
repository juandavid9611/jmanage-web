import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { GuideView } from 'src/sections/guide/view';

// ----------------------------------------------------------------------

const metadata = { title: `Guia de inicio | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <GuideView />
    </>
  );
}
