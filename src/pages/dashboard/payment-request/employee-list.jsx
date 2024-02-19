import { Helmet } from 'react-helmet-async';

import { EmployeePaymentRequestListView } from 'src/sections/payment-request/view';

// ----------------------------------------------------------------------

export default function EmployeePaymentRequestListPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: User PaymentRequest List</title>
      </Helmet>

      <EmployeePaymentRequestListView />
    </>
  );
}
