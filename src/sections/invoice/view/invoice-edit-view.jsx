import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { useWorkspaceChangeRedirect } from 'src/hooks/use-workspace-change-redirect';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { SplashScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceNewEditForm } from '../invoice-new-edit-form';

// ----------------------------------------------------------------------

export function InvoiceEditView({ invoice }) {
  const { t } = useTranslation();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';
  const invoiceHref = isAdmin
    ? paths.dashboard.admin.invoice.root
    : paths.dashboard.user.invoice.invoiceList;

  // Redirect to appropriate invoice list when workspace changes
  const { isRedirecting } = useWorkspaceChangeRedirect(invoiceHref);

  // Show loading screen during redirect to prevent 400 errors
  if (isRedirecting) {
    return <SplashScreen />;
  }

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
