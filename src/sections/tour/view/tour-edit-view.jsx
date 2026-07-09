import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { useWorkspaceChangeRedirect } from 'src/hooks/use-workspace-change-redirect';

import { DashboardContent } from 'src/layouts/dashboard';

import { SplashScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TourNewEditForm } from '../tour-new-edit-form';

// ----------------------------------------------------------------------

export function TourEditView({ tour }) {
  const { t } = useTranslation();
  // Redirect to tour list when workspace changes
  const { isRedirecting } = useWorkspaceChangeRedirect(paths.dashboard.admin.tour.root);

  if (isRedirecting) {
    return <SplashScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('edit')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('tour'), href: paths.dashboard.admin.tour.root },
          { name: tour?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TourNewEditForm currentTour={tour} />
    </DashboardContent>
  );
}
