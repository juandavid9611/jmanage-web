import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  createBankAccountAdjustment,
  useGetBankAccountAdjustments,
} from 'src/actions/bankAccounts';

import { toast } from 'src/components/snackbar';
import { Scrollbar } from 'src/components/scrollbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

function getSchema(t) {
  return zod.object({
    amount: zod.number({ invalid_type_error: t('title_required') }),
    date: zod.union([zod.string(), zod.number()]),
    note: zod.string().optional(),
  });
}

export function BankAccountAdjustmentsDialog({ open, onClose, account }) {
  const { t } = useTranslation();
  const { selectedWorkspace } = useWorkspace();

  const { adjustments, adjustmentsLoading } = useGetBankAccountAdjustments(
    account?.id,
    selectedWorkspace?.id
  );

  const schema = useMemo(() => getSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, date: dayjs().valueOf(), note: '' },
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createBankAccountAdjustment(
        account.id,
        { ...data, date: dayjs(data.date).format('YYYY-MM-DD') },
        selectedWorkspace?.id
      );
      toast.success(t('create_success'));
      reset({ amount: 0, date: dayjs().valueOf(), note: '' });
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        {t('label_account_adjustments')} — {account?.name}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={1} sx={{ mb: 3 }}>
          {!adjustmentsLoading && !adjustments.length && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {t('label_no_adjustments')}
            </Typography>
          )}

          <Scrollbar sx={{ maxHeight: 220 }}>
            <Stack spacing={1.5} divider={<Divider sx={{ borderStyle: 'dashed' }} />}>
              {adjustments.map((adjustment) => (
                <Stack key={adjustment.id} direction="row" justifyContent="space-between">
                  <Stack>
                    <Typography variant="body2">{adjustment.note || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {fDate(adjustment.date)}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="subtitle2"
                    sx={{ color: adjustment.amount < 0 ? 'error.main' : 'success.main' }}
                  >
                    {fCurrency(adjustment.amount)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Scrollbar>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Form methods={methods} onSubmit={onSubmit}>
          <Stack spacing={2}>
            <Typography variant="subtitle2">{t('label_add_adjustment')}</Typography>

            <Field.Text
              name="amount"
              type="number"
              label={t('label_adjustment_amount')}
              helperText={t('label_adjustment_amount_helper')}
            />

            <Field.DatePicker name="date" label={t('label_expense_date')} />

            <Field.Text name="note" label={t('label_adjustment_note')} />

            <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
              {t('label_add_adjustment')}
            </LoadingButton>
          </Stack>
        </Form>
      </DialogContent>

      <DialogActions>
        <Button variant="soft" color="inherit" onClick={onClose}>
          {t('label_close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
