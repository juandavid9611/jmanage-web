import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useBoolean } from 'src/hooks/use-boolean';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetBankAccounts } from 'src/actions/bankAccounts';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetExpense, rejectExpense, approveExpense } from 'src/actions/expenses';

import { Label } from 'src/components/label';
import { Image } from 'src/components/image';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { ExpenseMarkPaidDialog } from '../expense-mark-paid-dialog';

// ----------------------------------------------------------------------

const STATUS_COLOR = { pendiente: 'warning', aprobado: 'info', rechazado: 'error', pagado: 'success' };

function Row({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ py: 1 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
        {label}
      </Typography>
      <Typography variant="subtitle2">{value || '—'}</Typography>
    </Stack>
  );
}

export function ExpenseDetailsView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { selectedWorkspace, workspaceRole } = useWorkspace();
  const { expense, expenseLoading } = useGetExpense(id, selectedWorkspace?.id);
  const { bankAccounts } = useGetBankAccounts(selectedWorkspace?.id);

  const isAdmin = workspaceRole === 'admin';
  const accountName = bankAccounts.find((account) => account.id === expense?.account_id)?.name;

  const approveConfirm = useBoolean();
  const rejectDialog = useBoolean();
  const markPaidDialog = useBoolean();
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await approveExpense(expense.id, selectedWorkspace?.id);
      toast.success(t('label_expense_approved'));
      approveConfirm.onFalse();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    setSubmitting(true);
    try {
      await rejectExpense(expense.id, rejectReason, selectedWorkspace?.id);
      toast.success(t('label_expense_rejected'));
      rejectDialog.onFalse();
      setRejectReason('');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (expenseLoading) return <LoadingScreen />;

  const pendingBalance = Math.max((expense?.total_amount || 0) - (expense?.paid_amount || 0), 0);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('label_expense_details')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('label_finanzas'), href: paths.dashboard.finanzas.root },
          { name: expense?.detail || '' },
        ]}
        action={
          isAdmin && (
            <Button
              component={RouterLink}
              href={paths.dashboard.finanzas.edit(expense.id)}
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
            >
              {t('edit')}
            </Button>
          )
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Card sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">{expense.detail}</Typography>
          <Label variant="soft" color={STATUS_COLOR[expense.status] || 'default'}>
            {t(`label_status_${expense.status}`)}
          </Label>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Row label={t('label_expense_team')} value={t(`label_expense_team_${expense.team}`)} />
        <Row
          label={t('label_expense_category')}
          value={[expense.category, expense.subcategory].filter(Boolean).join(' · ')}
        />
        <Row label={t('label_beneficiary')} value={expense.beneficiary_name} />
        <Row label={t('label_expense_date')} value={fDate(expense.expense_date)} />
        <Row label={t('label_total_amount')} value={fCurrency(expense.total_amount)} />
        <Row label={t('label_paid_amount')} value={fCurrency(expense.paid_amount || 0)} />
        <Row label={t('label_pending_balance')} value={fCurrency(pendingBalance)} />
        <Row label={t('label_account')} value={accountName} />

        {!!expense.proof_images?.length && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
              {t('label_proof_images')}
            </Typography>
            <Stack direction="row" spacing={1.5} sx={{ flexWrap: 'wrap' }}>
              {expense.proof_images.map((src) => (
                <Link key={src} href={src} target="_blank" rel="noopener">
                  <Box
                    sx={{
                      width: 96,
                      height: 96,
                      borderRadius: 1,
                      overflow: 'hidden',
                    }}
                  >
                    <Image src={src} sx={{ width: 1, height: 1 }} />
                  </Box>
                </Link>
              ))}
            </Stack>
          </>
        )}

        {isAdmin && expense.status !== 'rechazado' && expense.status !== 'pagado' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button color="error" variant="outlined" onClick={rejectDialog.onTrue}>
                {t('label_reject')}
              </Button>

              {expense.status === 'pendiente' && (
                <Button variant="contained" onClick={approveConfirm.onTrue}>
                  {t('label_approve')}
                </Button>
              )}

              {expense.status === 'aprobado' && (
                <Button variant="contained" onClick={markPaidDialog.onTrue}>
                  {t('label_mark_paid')}
                </Button>
              )}
            </Stack>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={approveConfirm.value}
        onClose={approveConfirm.onFalse}
        title={t('label_approve')}
        content={t('label_confirm_approve_expense')}
        action={
          <LoadingButton variant="contained" loading={submitting} onClick={handleApprove}>
            {t('label_approve')}
          </LoadingButton>
        }
      />

      <Dialog open={rejectDialog.value} onClose={rejectDialog.onFalse} maxWidth="xs" fullWidth>
        <DialogTitle>{t('label_reject')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            {t('label_confirm_reject_expense')}
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            label={t('label_rejection_reason')}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="soft" color="inherit" onClick={rejectDialog.onFalse}>
            {t('label_close')}
          </Button>
          <LoadingButton variant="contained" color="error" loading={submitting} onClick={handleReject}>
            {t('label_reject')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {markPaidDialog.value && (
        <ExpenseMarkPaidDialog
          open={markPaidDialog.value}
          onClose={markPaidDialog.onFalse}
          expense={expense}
        />
      )}
    </DashboardContent>
  );
}
