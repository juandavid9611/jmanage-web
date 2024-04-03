import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

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

  const { t } = useTranslation();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('edit')}
        links={[
          { name: t('app'), href: paths.dashboard.root },
          {
            name: t('payment_request'),
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
