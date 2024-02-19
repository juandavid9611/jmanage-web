import { Helmet } from 'react-helmet-async';

import PaymentRequestListView from 'src/sections/payment-request/view/payment-request-list-view';

// ----------------------------------------------------------------------

export default function PaymentRequestListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: PaymentRequest List</title>
      </Helmet>

      <PaymentRequestListView />
    </>
  );
}
