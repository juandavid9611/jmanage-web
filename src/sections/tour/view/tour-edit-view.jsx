import { paths } from 'src/routes/paths';

import { useWorkspaceChangeRedirect } from 'src/hooks/use-workspace-change-redirect';

import { DashboardContent } from 'src/layouts/dashboard';

import { SplashScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TourNewEditForm } from '../tour-new-edit-form';

// ----------------------------------------------------------------------

export function TourEditView({ tour }) {
  // Redirect to tour list when workspace changes
  const { isRedirecting } = useWorkspaceChangeRedirect(paths.dashboard.admin.tour.root);

  if (isRedirecting) {
    return <SplashScreen />;
  }

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Tour', href: paths.dashboard.admin.tour.root },
          { name: tour?.name },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TourNewEditForm currentTour={tour} />
    </DashboardContent>
  );
}
