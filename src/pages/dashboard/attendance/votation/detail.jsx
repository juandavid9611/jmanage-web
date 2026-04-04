import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { VotationDetailView } from 'src/sections/votation/view';

// ----------------------------------------------------------------------

const metadata = { title: `Votación | ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>

      <VotationDetailView />
    </>
  );
}
