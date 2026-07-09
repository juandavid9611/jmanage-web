import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTournament } from 'src/actions/tournament';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TournamentNewEditForm } from '../tournament-new-edit-form';

// ----------------------------------------------------------------------

export function TournamentEditView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { tournament, tournamentLoading } = useGetTournament(id);

  if (tournamentLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_edit_tournament')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('tournaments'), href: paths.dashboard.tournament.root },
          { name: tournament?.name || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <TournamentNewEditForm currentTournament={tournament} />
    </DashboardContent>
  );
}
