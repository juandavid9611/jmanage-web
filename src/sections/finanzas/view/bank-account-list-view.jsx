import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Table from '@mui/material/Table';
import Button from '@mui/material/Button';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { deleteBankAccount, useGetBankAccounts } from 'src/actions/bankAccounts';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { useSettingsContext } from 'src/components/settings';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';
import {
  useTable,
  TableNoData,
  TableHeadCustom,
  TablePaginationCustom,
} from 'src/components/table';

import { BankAccountTableRow } from '../bank-account-table-row';
import { BankAccountNewEditDialog } from '../bank-account-new-edit-dialog';
import { BankAccountAdjustmentsDialog } from '../bank-account-adjustments-dialog';

// ----------------------------------------------------------------------

const TABLE_HEAD = [
  { id: 'name', label: 'label_account_name' },
  { id: 'type', label: 'label_account_type' },
  { id: 'balance', label: 'label_balance', align: 'right' },
  { id: '', width: 88 },
];

export function BankAccountListView() {
  const { t } = useTranslation();
  const settings = useSettingsContext();
  const table = useTable({ defaultRowsPerPage: 25 });
  const { selectedWorkspace } = useWorkspace();

  const { bankAccounts, bankAccountsLoading, bankAccountsError } = useGetBankAccounts(
    selectedWorkspace?.id
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(null);
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);

  const handleOpenCreate = useCallback(() => {
    setCurrentAccount(null);
    setDialogOpen(true);
  }, []);

  const handleOpenEdit = useCallback((account) => {
    setCurrentAccount(account);
    setDialogOpen(true);
  }, []);

  const handleDeactivate = useCallback(async () => {
    try {
      await deleteBankAccount(deactivateTarget.id, selectedWorkspace?.id);
      toast.success(t('label_account_deactivated'));
    } catch (error) {
      toast.error(error.message);
    } finally {
      setDeactivateTarget(null);
    }
  }, [deactivateTarget, selectedWorkspace?.id, t]);

  if (bankAccountsLoading) return <LoadingScreen />;

  if (bankAccountsError) {
    return (
      <DashboardContent maxWidth={settings.themeStretch ? false : 'lg'}>
        <EmptyContent filled title={t('label_finanzas_load_error')} sx={{ py: 10 }} />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading={t('label_bank_accounts')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
          { name: t('label_bank_accounts') },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mingcute:add-line" />}
            onClick={handleOpenCreate}
          >
            {t('label_add_account')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card>
        <TableContainer sx={{ position: 'relative', overflow: 'unset' }}>
          <Table size="medium">
            <TableHeadCustom
              headLabel={TABLE_HEAD.map((cell) => ({ ...cell, label: cell.label ? t(cell.label) : '' }))}
              rowCount={bankAccounts.length}
            />

            <TableBody>
              {bankAccounts
                .slice(
                  table.page * table.rowsPerPage,
                  table.page * table.rowsPerPage + table.rowsPerPage
                )
                .map((account) => (
                  <BankAccountTableRow
                    key={account.id}
                    account={account}
                    onEdit={() => handleOpenEdit(account)}
                    onDeactivate={() => setDeactivateTarget(account)}
                    onAdjust={() => setAdjustTarget(account)}
                  />
                ))}

              <TableNoData notFound={!bankAccounts.length} sx={{ py: 6 }} />
            </TableBody>
          </Table>
        </TableContainer>

        <TablePaginationCustom
          page={table.page}
          dense={table.dense}
          count={bankAccounts.length}
          rowsPerPage={table.rowsPerPage}
          onPageChange={table.onChangePage}
          onRowsPerPageChange={table.onChangeRowsPerPage}
        />
      </Card>

      {dialogOpen && (
        <BankAccountNewEditDialog
          open={dialogOpen}
          currentAccount={currentAccount}
          onClose={() => setDialogOpen(false)}
        />
      )}

      {adjustTarget && (
        <BankAccountAdjustmentsDialog
          open={!!adjustTarget}
          account={adjustTarget}
          onClose={() => setAdjustTarget(null)}
        />
      )}

      <ConfirmDialog
        open={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title={t('label_deactivate_account')}
        content={deactivateTarget?.name}
        action={
          <Button variant="contained" color="error" onClick={handleDeactivate}>
            {t('label_deactivate_account')}
          </Button>
        }
      />
    </DashboardContent>
  );
}
