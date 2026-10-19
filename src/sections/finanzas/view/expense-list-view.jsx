import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import TableBody from '@mui/material/TableBody';
import { useTheme } from '@mui/material/styles';
import InputAdornment from '@mui/material/InputAdornment';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useSetState } from 'src/hooks/use-set-state';

import { sumBy } from 'src/utils/helper';

import { varAlpha } from 'src/theme/styles';
import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBankAccounts } from 'src/actions/bankAccounts';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { deleteExpense, useGetExpenses } from 'src/actions/expenses';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  emptyRows,
  rowInPage,
  TableNoData,
  getComparator,
  TableEmptyRows,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { ExpenseTableRow } from '../expense-table-row';
import { InvoiceAnalytic } from '../../invoice/invoice-analytic';

// ----------------------------------------------------------------------

const STATUS_TABS = [
  { value: 'all', color: 'default' },
  { value: 'pendiente', color: 'warning' },
  { value: 'aprobado', color: 'info' },
  { value: 'rechazado', color: 'error' },
  { value: 'pagado', color: 'success' },
];

function get_table_head(t) {
  return [
    { id: 'detail', label: t('label_expense_detail') },
    { id: 'beneficiary_name', label: t('label_beneficiary') },
    { id: 'expense_date', label: t('label_expense_date') },
    { id: 'total_amount', label: t('label_total_amount'), align: 'right' },
    { id: 'balance', label: t('label_pending_balance'), align: 'right' },
    { id: 'status', label: t('label_status') },
    { id: '', width: 88 },
  ];
}

export function ExpenseListView() {
  const { t } = useTranslation();
  const theme = useTheme();
  const table = useTable({ defaultOrderBy: 'expense_date' });
  const { selectedWorkspace } = useWorkspace();

  const { expenses, expensesLoading } = useGetExpenses(selectedWorkspace?.id);
  const { bankAccounts } = useGetBankAccounts(selectedWorkspace?.id);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const filters = useSetState({ query: '', status: 'all', account_id: 'all' });

  useEffect(() => {
    table.onResetPage();
  }, [filters.state.query, filters.state.status, filters.state.account_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const dataFiltered = applyFilter({ inputData: expenses, filters: filters.state });

  const dataInPage = rowInPage(
    dataFiltered.sort(getComparator(table.order, table.orderBy)),
    table.page,
    table.rowsPerPage
  );

  const canReset =
    !!filters.state.query || filters.state.status !== 'all' || filters.state.account_id !== 'all';

  const notFound = !dataFiltered.length;

  const getExpenseLength = (status) => expenses.filter((item) => item.status === status).length;

  const getTotalAmount = (status) =>
    sumBy(
      expenses.filter((item) => item.status === status),
      (expense) => expense.total_amount
    );

  const getPercentByStatus = (status) =>
    expenses.length ? (getExpenseLength(status) / expenses.length) * 100 : 0;

  const handleFilterStatus = useCallback(
    (event, newValue) => {
      filters.setState({ status: newValue });
    },
    [filters]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteExpense(deleteTarget.id, selectedWorkspace?.id);
      toast.success(t('delete_success'));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeleteTarget(null);
    }
  }, [deleteTarget, selectedWorkspace?.id, t]);

  if (expensesLoading) return <LoadingScreen />;

  return (
    <>
      <DashboardContent>
        <CustomBreadcrumbs
          heading={t('label_expenses')}
          links={[
            { name: t('label_dashboard'), href: paths.dashboard.root },
            { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
            { name: t('list') },
          ]}
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.finanzas.new}
              variant="contained"
              startIcon={<Iconify icon="mingcute:add-line" />}
            >
              {t('label_add_expense')}
            </Button>
          }
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
                title={t('total')}
                total={expenses.length}
                percent={100}
                price={sumBy(expenses, (expense) => expense.total_amount)}
                icon="solar:wallet-money-bold-duotone"
                color={theme.vars.palette.info.main}
                unitLabel={t('label_expenses')}
              />

              <InvoiceAnalytic
                title={t('label_status_pendiente')}
                total={getExpenseLength('pendiente')}
                percent={getPercentByStatus('pendiente')}
                price={getTotalAmount('pendiente')}
                icon="solar:sort-by-time-bold-duotone"
                color={theme.vars.palette.warning.main}
                unitLabel={t('label_expenses')}
              />

              <InvoiceAnalytic
                title={t('label_status_aprobado')}
                total={getExpenseLength('aprobado')}
                percent={getPercentByStatus('aprobado')}
                price={getTotalAmount('aprobado')}
                icon="solar:shield-check-bold-duotone"
                color={theme.vars.palette.info.main}
                unitLabel={t('label_expenses')}
              />

              <InvoiceAnalytic
                title={t('label_status_pagado')}
                total={getExpenseLength('pagado')}
                percent={getPercentByStatus('pagado')}
                price={getTotalAmount('pagado')}
                icon="solar:file-check-bold-duotone"
                color={theme.vars.palette.success.main}
                unitLabel={t('label_expenses')}
              />
            </Stack>
          </Scrollbar>
        </Card>

        <Card>
          <Tabs
            value={filters.state.status}
            onChange={handleFilterStatus}
            sx={{
              px: 2.5,
              boxShadow: `inset 0 -2px 0 0 ${varAlpha(theme.vars.palette.grey['500Channel'], 0.08)}`,
            }}
          >
            {STATUS_TABS.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                label={tab.value === 'all' ? t('all') : t(`label_status_${tab.value}`)}
                iconPosition="end"
                icon={
                  <Label
                    variant={
                      ((tab.value === 'all' || tab.value === filters.state.status) && 'filled') ||
                      'soft'
                    }
                    color={tab.color}
                  >
                    {tab.value === 'all' ? expenses.length : getExpenseLength(tab.value)}
                  </Label>
                }
              />
            ))}
          </Tabs>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            sx={{ p: 2.5 }}
          >
            <TextField
              value={filters.state.query}
              onChange={(event) => filters.setState({ query: event.target.value })}
              placeholder={t('label_search_expense_placeholder')}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled' }} />
                  </InputAdornment>
                ),
              }}
              sx={{ flex: 1 }}
            />

            <TextField
              select
              value={filters.state.account_id}
              onChange={(event) => filters.setState({ account_id: event.target.value })}
              label={t('label_account')}
              sx={{ minWidth: 200 }}
            >
              <MenuItem value="all">{t('all')}</MenuItem>
              {bankAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </TextField>

            {canReset && (
              <Button
                color="error"
                startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
                onClick={() => filters.setState({ query: '', status: 'all', account_id: 'all' })}
              >
                {t('clear')}
              </Button>
            )}
          </Stack>

          <Box sx={{ position: 'relative' }}>
            <Scrollbar sx={{ minHeight: 444 }}>
              <Table size={table.dense ? 'small' : 'medium'} sx={{ minWidth: 800 }}>
                <TableHeadCustom
                  order={table.order}
                  orderBy={table.orderBy}
                  headLabel={get_table_head(t)}
                  rowCount={dataFiltered.length}
                  onSort={table.onSort}
                />

                <TableBody>
                  {dataInPage.map((row) => (
                    <ExpenseTableRow
                      key={row.id}
                      expense={row}
                      detailsHref={paths.dashboard.finanzas.details(row.id)}
                      editHref={paths.dashboard.finanzas.edit(row.id)}
                      onDelete={() => setDeleteTarget(row)}
                    />
                  ))}

                  <TableEmptyRows
                    height={table.dense ? 56 : 56 + 20}
                    emptyRows={emptyRows(table.page, table.rowsPerPage, dataFiltered.length)}
                  />

                  <TableNoData notFound={notFound} />
                </TableBody>
              </Table>
            </Scrollbar>
          </Box>

          <TablePaginationCustom
            page={table.page}
            dense={table.dense}
            count={dataFiltered.length}
            rowsPerPage={table.rowsPerPage}
            onPageChange={table.onChangePage}
            onChangeDense={table.onChangeDense}
            onRowsPerPageChange={table.onChangeRowsPerPage}
          />
        </Card>
      </DashboardContent>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('delete')}
        content={deleteTarget?.detail}
        action={
          <Button variant="contained" color="error" onClick={handleDelete}>
            {t('delete')}
          </Button>
        }
      />
    </>
  );
}

function applyFilter({ inputData, filters }) {
  const { query, status, account_id: accountId } = filters;

  let data = [...inputData];

  if (query) {
    const lowerQuery = query.toLowerCase();
    data = data.filter(
      (expense) =>
        expense.detail?.toLowerCase().includes(lowerQuery) ||
        expense.beneficiary_name?.toLowerCase().includes(lowerQuery) ||
        expense.category?.toLowerCase().includes(lowerQuery)
    );
  }

  if (status !== 'all') {
    data = data.filter((expense) => expense.status === status);
  }

  if (accountId !== 'all') {
    data = data.filter((expense) => expense.account_id === accountId);
  }

  return data;
}
