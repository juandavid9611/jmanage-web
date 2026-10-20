import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { markExpensePaid } from 'src/actions/expenses';
import { useGetBankAccounts } from 'src/actions/bankAccounts';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------------

function getSchema(t, pendingBalance) {
  return zod.object({
    account_id: zod.string().min(1, { message: t('label_expense_account_required') }),
    // The amount field is optional — leaving it blank means "pay the full
    // pending balance" per the API contract. The shared RHFTextField turns
    // an emptied field into 0 (not undefined), so 0 doubles as the "unset"
    // sentinel here and is stripped from the payload on submit.
    amount: zod
      .number()
      .int()
      .min(0)
      .refine((value) => value <= pendingBalance, {
        message: t('label_amount_exceeds_balance'),
      })
      .optional(),
    paid_at: zod.union([zod.string(), zod.number()]),
  });
}

export function ExpenseMarkPaidDialog({ open, onClose, expense }) {
  const { t } = useTranslation();
  const { selectedWorkspace } = useWorkspace();
  const { bankAccounts } = useGetBankAccounts(selectedWorkspace?.id);
  const activeAccounts = bankAccounts.filter((account) => account.is_active);

  const pendingBalance = Math.max((expense?.total_amount || 0) - (expense?.paid_amount || 0), 0);
  const canMarkPaid = expense?.status === 'aprobado';

  const schema = useMemo(() => getSchema(t, pendingBalance), [t, pendingBalance]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues: {
      account_id: expense?.account_id || '',
      amount: pendingBalance,
      paid_at: dayjs().valueOf(),
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await markExpensePaid(
        expense.id,
        {
          account_id: data.account_id,
          amount: data.amount > 0 ? data.amount : undefined,
          paid_at: dayjs(data.paid_at).format('YYYY-MM-DD'),
        },
        selectedWorkspace?.id
      );
      toast.success(t('label_expense_paid'));
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t('label_mark_paid')}</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            {!canMarkPaid && <Alert severity="warning">{t('label_expense_not_approved')}</Alert>}

            <Field.Select
              name="account_id"
              label={t('label_account')}
              disabled={!canMarkPaid}
            >
              {activeAccounts.map((account) => (
                <MenuItem key={account.id} value={account.id}>
                  {account.name}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="amount"
              type="number"
              label={t('label_payment_amount')}
              inputProps={{ min: 0, max: pendingBalance }}
              helperText={t('label_pending_balance_helper')}
              disabled={!canMarkPaid}
            />

            <Field.DatePicker
              name="paid_at"
              label={t('label_payment_date')}
              disabled={!canMarkPaid}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="soft" color="inherit" onClick={onClose}>
            {t('label_close')}
          </Button>
          <LoadingButton
            type="submit"
            variant="contained"
            loading={isSubmitting}
            disabled={!canMarkPaid}
          >
            {t('label_mark_paid')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
