import { Helmet } from 'react-helmet-async';

import { PaymentRequestCreateView } from 'src/sections/payment-request/view';

// ----------------------------------------------------------------------

export default function PaymentRequestCreatePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Create a new PaymentRequest</title>
      </Helmet>

      <PaymentRequestCreateView />
    </>
  );
}
