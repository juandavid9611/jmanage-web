import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { SessionNewEditForm } from '../session-new-edit-form';

// ----------------------------------------------------------------------

export function SessionCreateView() {
  const { t } = useTranslation();

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_new_session')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_training_sessions'), href: paths.dashboard.trainingSessions.list },
          { name: t('label_new_session') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <SessionNewEditForm />
    </DashboardContent>
  );
}
