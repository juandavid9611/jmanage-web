import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetPaymentRequest } from 'src/actions/paymentRequest';

import { SplashScreen } from 'src/components/loading-screen';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

const metadata = { title: `Invoice edit | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { paymentRequest, paymentRequestLoading } = useGetPaymentRequest(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {paymentRequestLoading ? <SplashScreen /> : <InvoiceEditView invoice={paymentRequest} />}
    </>
  );
}
