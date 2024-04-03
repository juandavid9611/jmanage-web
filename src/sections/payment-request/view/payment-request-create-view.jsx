import { useTranslation } from 'react-i18next';

import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PaymentRequestNewEditForm from '../payment-request-new-edit-form';

// ----------------------------------------------------------------------

export default function PaymentRequestCreateView() {
  const settings = useSettingsContext();

  const { t } = useTranslation();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('create_new_payment_request')}
        links={[
          {
            name: t('app'),
            href: paths.dashboard.root,
          },
          {
            name: t('payment_requests'),
            href: paths.dashboard.admin.paymentRequest.root,
          },
          { name: t('new') },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PaymentRequestNewEditForm />
    </Container>
  );
}
