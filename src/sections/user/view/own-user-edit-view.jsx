import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

export function OwnUserEditView({ user: currentUser }) {
  const { t } = useTranslation();
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Tu Perfil"
        links={[
          {
            name: t('app'),
            href: paths.dashboard.root,
          },
          { name: currentUser?.name },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      <UserNewEditForm currentUser={currentUser} />
    </DashboardContent>
  );
}
