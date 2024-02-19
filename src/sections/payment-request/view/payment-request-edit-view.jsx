import PropTypes from 'prop-types';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useGetPaymentRequest } from 'src/api/paymentRequest';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PaymentRequestNewEditForm from '../payment-request-new-edit-form';

// ----------------------------------------------------------------------

export default function PaymentRequestEditView({ id }) {
  const settings = useSettingsContext();

  const { paymentRequest: currentPaymentRequest, paymentRequestLoading } = useGetPaymentRequest(id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          {
            name: 'Payment Request',
            href: paths.dashboard.admin.paymentRequest.root,
          },
          { name: currentPaymentRequest?.concept },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      {!paymentRequestLoading && (
        <PaymentRequestNewEditForm currentPaymentRequest={currentPaymentRequest} />
      )}
    </Container>
  );
}

PaymentRequestEditView.propTypes = {
  id: PropTypes.string,
};
