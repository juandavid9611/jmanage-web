import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';

import { useGetBankAccounts } from 'src/actions/bankAccounts';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function InvoiceNewEditStatusDate({ disableFields, accountAlreadyPaid }) {
  const { t } = useTranslation();
  const { watch } = useFormContext();
  const { selectedWorkspace } = useWorkspace();
  const { bankAccounts } = useGetBankAccounts(selectedWorkspace?.id);

  const values = watch();
  const selectableAccounts = bankAccounts.filter(
    (account) => account.is_active || account.id === values.accountId
  );

  return (
    <Stack
      spacing={2}
      direction={{ xs: 'column', sm: 'row' }}
      sx={{ p: 3, bgcolor: 'background.neutral' }}
    >
      <Field.Text
        disabled
        name="invoiceId"
        label={`${t('invoice')} ID`}
        value={`PR-${values.paymentRequestId?.slice(-6) || '1996JD'}`}
      />

      <Field.Select
        disabled={disableFields}
        fullWidth
        name="status"
        label={t('status')}
        InputLabelProps={{ shrink: true }}
      >
        {['paid', 'pending', 'overdue', 'approval_pending'].map((option) => (
          <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
            {t(option)}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.DatePicker name="createDate" label={t('create_date')} disabled={disableFields} />
      <Field.DatePicker name="dueDate" label={t('due_date')} disabled={disableFields} />

      {values.status === 'paid' && (
        <Field.Select
          // Solo tiene efecto al momento de pasar a pagado — si ya estaba
          // pagado antes de esta edición, cambiarlo acá no mueve nada en el
          // backend, así que se deja de solo lectura para no sugerir que sí.
          disabled={disableFields || accountAlreadyPaid}
          fullWidth
          name="accountId"
          label={t('label_account')}
        >
          {selectableAccounts.map((account) => (
            <MenuItem key={account.id} value={account.id}>
              {account.name}
            </MenuItem>
          ))}
        </Field.Select>
      )}
    </Stack>
  );
}
