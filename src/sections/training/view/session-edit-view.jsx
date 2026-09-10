import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetTrainingSession } from 'src/actions/training-sessions';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SessionNewEditForm } from '../session-new-edit-form';

// ----------------------------------------------------------------------

export function SessionEditView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { selectedWorkspace } = useWorkspace();

  const { session, sessionLoading } = useGetTrainingSession(selectedWorkspace, id);

  if (sessionLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_edit_session')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_training_sessions'), href: paths.dashboard.trainingSessions.list },
          { name: session?.title },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SessionNewEditForm currentSession={session} />
    </DashboardContent>
  );
}
