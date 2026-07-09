import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetPaymentRequest } from 'src/actions/paymentRequest';

import { SplashScreen } from 'src/components/loading-screen';

import { InvoiceEditView } from 'src/sections/invoice/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('page_title_invoice_edit')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

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
