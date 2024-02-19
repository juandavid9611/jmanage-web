import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { PaymentRequestEditView } from 'src/sections/payment-request/view';

// ----------------------------------------------------------------------

export default function PaymentRequestEditPage() {
  const params = useParams();

  const { id } = params;

  return (
    <>
      <Helmet>
        <title> Dashboard: PaymentRequest Edit</title>
      </Helmet>

      <PaymentRequestEditView id={`${id}`} />
    </>
  );
}
