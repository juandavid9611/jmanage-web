import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';

import { sumBy } from 'src/utils/helper';
import { fCurrency } from 'src/utils/format-number';

import { useGetExpenses } from 'src/actions/expenses';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBankAccounts } from 'src/actions/bankAccounts';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequests } from 'src/actions/paymentRequest';

import { Scrollbar } from 'src/components/scrollbar';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { InvoiceAnalytic } from '../../invoice/invoice-analytic';

// ----------------------------------------------------------------------

export function FinanzasSummaryView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { selectedWorkspace } = useWorkspace();

  const { expenses, expensesLoading, expensesError } = useGetExpenses(selectedWorkspace?.id);
  const { bankAccounts, bankAccountsLoading, bankAccountsError } = useGetBankAccounts(
    selectedWorkspace?.id
  );
  const {
    paymentRequests,
    paymentRequestsLoading,
    paymentRequestsError,
  } = useGetPaymentRequests(selectedWorkspace?.id);

  if (expensesLoading || bankAccountsLoading || paymentRequestsLoading) return <LoadingScreen />;

  if (expensesError || bankAccountsError || paymentRequestsError) {
    return (
      <DashboardContent>
        <EmptyContent filled title={t('label_finanzas_load_error')} sx={{ py: 10 }} />
      </DashboardContent>
    );
  }

  const getExpenseLength = (status) => expenses.filter((item) => item.status === status).length;
  const getExpenseTotal = (status) =>
    sumBy(
      expenses.filter((item) => item.status === status),
      (expense) => expense.total_amount
    );
  const getExpensePercent = (status) =>
    expenses.length ? (getExpenseLength(status) / expenses.length) * 100 : 0;

  const totalIncome = sumBy(
    paymentRequests.filter((item) => item.status === 'paid'),
    (item) => item.totalAmount
  );
  // Paid-out money isn't only the expenses that reached 'pagado' — an
  // 'aprobado' expense can already have partial payments (cuotas) against
  // it, and those are real money out the door too. Only 'rechazado' never
  // paid anything.
  const totalExpensePaid = sumBy(
    expenses.filter((item) => item.status !== 'rechazado'),
    (item) => item.paid_amount || 0
  );
  const netBalance = totalIncome - totalExpensePaid;

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_finanzas_summary')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
          { name: t('label_finanzas_summary') },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ mb: { xs: 3, md: 5 } }}>
        <Scrollbar sx={{ minHeight: 108 }}>
          <Stack
            direction="row"
            divider={<Divider orientation="vertical" flexItem sx={{ borderStyle: 'dashed' }} />}
            sx={{ py: 2 }}
          >
            <InvoiceAnalytic
              title={t('label_status_pendiente')}
              total={getExpenseLength('pendiente')}
              percent={getExpensePercent('pendiente')}
              price={getExpenseTotal('pendiente')}
              icon="solar:sort-by-time-bold-duotone"
              color={theme.vars.palette.warning.main}
              unitLabel={t('label_expenses')}
            />

            <InvoiceAnalytic
              title={t('label_status_aprobado')}
              total={getExpenseLength('aprobado')}
              percent={getExpensePercent('aprobado')}
              price={getExpenseTotal('aprobado')}
              icon="solar:shield-check-bold-duotone"
              color={theme.vars.palette.info.main}
              unitLabel={t('label_expenses')}
            />

            <InvoiceAnalytic
              title={t('label_status_pagado')}
              total={getExpenseLength('pagado')}
              percent={getExpensePercent('pagado')}
              price={getExpenseTotal('pagado')}
              icon="solar:file-check-bold-duotone"
              color={theme.vars.palette.success.main}
              unitLabel={t('label_expenses')}
            />

            <InvoiceAnalytic
              title={t('label_status_rechazado')}
              total={getExpenseLength('rechazado')}
              percent={getExpensePercent('rechazado')}
              price={getExpenseTotal('rechazado')}
              icon="solar:file-corrupted-bold-duotone"
              color={theme.vars.palette.error.main}
              unitLabel={t('label_expenses')}
            />
          </Stack>
        </Scrollbar>
      </Card>

      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <Card sx={{ p: 3, height: 1 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('label_bank_accounts')}
            </Typography>

            <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {bankAccounts.map((account) => (
                <Stack key={account.id} direction="row" justifyContent="space-between">
                  <Typography variant="body2">{account.name}</Typography>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: account.balance < 0 ? 'error.main' : 'text.primary' }}
                  >
                    {fCurrency(account.balance)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        </Grid>

        <Grid xs={12} md={6}>
          <Card sx={{ height: 1 }}>
            <CardHeader title={t('label_income_vs_expense')} />
            <Stack spacing={1.5} sx={{ p: 3 }} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{t('label_total_income')}</Typography>
                <Typography variant="subtitle2" sx={{ color: 'success.main' }}>
                  {fCurrency(totalIncome)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2">{t('label_total_expense')}</Typography>
                <Typography variant="subtitle2" sx={{ color: 'error.main' }}>
                  {fCurrency(totalExpensePaid)}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="subtitle1">{t('label_net_balance')}</Typography>
                <Typography
                  variant="h6"
                  sx={{ color: netBalance < 0 ? 'error.main' : 'success.main' }}
                >
                  {fCurrency(netBalance)}
                </Typography>
              </Stack>
            </Stack>
          </Card>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
