import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VotationWizard } from '../votation-wizard';

// ----------------------------------------------------------------------

export function VotationCreateView() {
  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      <CustomBreadcrumbs
        heading="Nueva Votación"
        links={[
          { name: 'Votaciones', href: paths.dashboard.votaciones.root },
          { name: 'Nueva Votación' },
        ]}
        sx={{ mb: { xs: 3, md: 5 }, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}
      />
      <VotationWizard />
    </DashboardContent>
  );
}
