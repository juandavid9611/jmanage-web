import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { InvoiceNewEditForm } from '../invoice-new-edit-form';

// ----------------------------------------------------------------------

export function InvoiceEditView({ invoice }) {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const isAdmin = user?.role === 'admin';
  const invoiceHref = isAdmin
    ? paths.dashboard.admin.invoice.root
    : paths.dashboard.user.invoice.invoiceList;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Actualizar pago"
        links={[
          { name: t('app'), href: paths.dashboard.root },
          { name: t('invoice'), href: invoiceHref },
          { name: t('list') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <InvoiceNewEditForm currentInvoice={invoice} />
    </DashboardContent>
  );
}
