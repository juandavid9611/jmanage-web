import dayjs from 'dayjs';
import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useWorkspace } from 'src/workspace/workspace-provider';
import { createBankAccount, updateBankAccount } from 'src/actions/bankAccounts';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

const ACCOUNT_TYPES = ['personal_bank', 'club_bank', 'cash', 'other'];

function getAccountSchema(t) {
  return zod.object({
    name: zod.string().min(1, { message: t('title_required') }),
    type: zod.string().min(1),
    opening_balance: zod.number().int(),
    opening_balance_date: zod.union([zod.string(), zod.number()]),
  });
}

export function BankAccountNewEditDialog({ open, onClose, currentAccount }) {
  const { t } = useTranslation();
  const { selectedWorkspace } = useWorkspace();

  const schema = useMemo(() => getAccountSchema(t), [t]);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(schema),
    defaultValues: {
      name: currentAccount?.name || '',
      type: currentAccount?.type || 'personal_bank',
      opening_balance: currentAccount?.opening_balance ?? 0,
      opening_balance_date: currentAccount?.opening_balance_date
        ? dayjs(currentAccount.opening_balance_date).valueOf()
        : dayjs().valueOf(),
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    const payload = {
      ...data,
      opening_balance_date: dayjs(data.opening_balance_date).format('YYYY-MM-DD'),
    };
    try {
      if (currentAccount) {
        await updateBankAccount(currentAccount.id, payload, selectedWorkspace?.id);
      } else {
        await createBankAccount(payload, selectedWorkspace?.id);
      }
      toast.success(t(currentAccount ? 'update_success' : 'create_success'));
      onClose();
    } catch (error) {
      toast.error(error.message);
    }
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <Form methods={methods} onSubmit={onSubmit}>
        <DialogTitle>{t(currentAccount ? 'label_edit_account' : 'label_add_account')}</DialogTitle>

        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <Field.Text name="name" label={t('label_account_name')} />

            <Field.Select name="type" label={t('label_account_type')}>
              {ACCOUNT_TYPES.map((type) => (
                <MenuItem key={type} value={type}>
                  {t(`label_account_type_${type}`)}
                </MenuItem>
              ))}
            </Field.Select>

            <Field.Text
              name="opening_balance"
              type="number"
              label={t('label_opening_balance')}
              disabled={!!currentAccount}
            />

            <Field.DatePicker
              name="opening_balance_date"
              label={t('label_opening_balance_date')}
              disabled={!!currentAccount}
            />
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button variant="soft" color="inherit" onClick={onClose}>
            {t('label_close')}
          </Button>
          <LoadingButton type="submit" variant="contained" loading={isSubmitting}>
            {t(currentAccount ? 'label_save' : 'label_add_account')}
          </LoadingButton>
        </DialogActions>
      </Form>
    </Dialog>
  );
}
