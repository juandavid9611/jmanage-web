import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { UserNewEditForm } from '../user-new-edit-form';

// ----------------------------------------------------------------------

export function UserEditView({ user: currentUser }) {
  const { t } = useTranslation();
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Edit"
        links={[
          {
            name: t('app'),
            href: paths.dashboard.root,
          },
          {
            name: t('user'),
            href: paths.dashboard.admin.user.list,
          },
          { name: currentUser?.name },
        ]}
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      />
      <UserNewEditForm currentUser={currentUser} isAdmin />
    </DashboardContent>
  );
}
