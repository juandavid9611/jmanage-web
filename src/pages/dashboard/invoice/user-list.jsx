import { Helmet } from 'react-helmet-async';

import { CONFIG } from 'src/config-global';

import { UserInvoiceListView } from 'src/sections/invoice/view/user-invoice-list-view';

// ----------------------------------------------------------------------

const metadata = { title: `User Invoice list | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      <UserInvoiceListView />
    </>
  );
}
