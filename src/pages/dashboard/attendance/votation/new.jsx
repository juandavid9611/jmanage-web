import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { VotationCreateView } from 'src/sections/votation/view';

// ----------------------------------------------------------------------

const metadata = { title: `Nueva Votación | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <VotationCreateView />
    </>
  );
}
