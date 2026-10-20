import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExpenseNewEditForm } from '../expense-new-edit-form';

// ----------------------------------------------------------------------

export function ExpenseCreateView() {
  const { t } = useTranslation();
  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_new_expense')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
          { name: t('label_new_expense') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExpenseNewEditForm />
    </DashboardContent>
  );
}
