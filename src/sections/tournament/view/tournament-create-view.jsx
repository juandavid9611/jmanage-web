import { DashboardContent } from 'src/layouts/dashboard';

import { paths } from 'src/routes/paths';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TournamentNewEditForm } from '../tournament-new-edit-form';

// ----------------------------------------------------------------------

export function TournamentCreateView() {
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Crear Torneo"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: 'Crear' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TournamentNewEditForm />
    </DashboardContent>
  );
}
