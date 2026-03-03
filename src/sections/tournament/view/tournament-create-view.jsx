import { DashboardContent } from 'src/layouts/dashboard';

import { TournamentCreationWizard } from '../tournament-creation-wizard';

// ----------------------------------------------------------------------

export function TournamentCreateView() {
  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      <TournamentCreationWizard />
    </DashboardContent>
  );
}

