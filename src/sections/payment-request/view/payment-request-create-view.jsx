import Container from '@mui/material/Container';

import { paths } from 'src/routes/paths';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import PaymentRequestNewEditForm from '../payment-request-new-edit-form';

// ----------------------------------------------------------------------

export default function PaymentRequestCreateView() {
  const settings = useSettingsContext();

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="Create a new Payment Request"
        links={[
          {
            name: 'Dashboard',
            href: paths.dashboard.root,
          },
          {
            name: 'Payment request',
            href: paths.dashboard.admin.paymentRequest.root,
          },
          { name: 'New' },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />

      <PaymentRequestNewEditForm />
    </Container>
  );
}
