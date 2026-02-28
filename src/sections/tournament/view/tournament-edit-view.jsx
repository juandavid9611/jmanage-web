import { useParams } from 'react-router-dom';

import { DashboardContent } from 'src/layouts/dashboard';

import { paths } from 'src/routes/paths';

import { useGetTournament } from 'src/actions/tournament';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TournamentNewEditForm } from '../tournament-new-edit-form';

// ----------------------------------------------------------------------

export function TournamentEditView() {
  const { id } = useParams();
  const { tournament, tournamentLoading } = useGetTournament(id);

  if (tournamentLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Editar Torneo"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: tournament?.name || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TournamentNewEditForm currentTournament={tournament} />
    </DashboardContent>
  );
}
