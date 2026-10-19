import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { useGetExpense } from 'src/actions/expenses';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExpenseNewEditForm } from '../expense-new-edit-form';

// ----------------------------------------------------------------------

export function ExpenseEditView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { selectedWorkspace } = useWorkspace();
  const { expense, expenseLoading } = useGetExpense(id, selectedWorkspace?.id);

  if (expenseLoading) return <LoadingScreen />;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_edit_expense')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
          { name: expense?.detail || '' },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <ExpenseNewEditForm currentExpense={expense} />
    </DashboardContent>
  );
}
