import { useTranslation } from 'react-i18next';
import { useFormContext } from 'react-hook-form';

import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';

import { Field } from 'src/components/hook-form';

// ----------------------------------------------------------------------

export function InvoiceNewEditStatusDate() {
  const { t } = useTranslation();
  const { watch } = useFormContext();

  const values = watch();

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

      <Field.Select fullWidth name="status" label={t('status')} InputLabelProps={{ shrink: true }}>
        {['paid', 'pending', 'overdue', 'draft'].map((option) => (
          <MenuItem key={option} value={option} sx={{ textTransform: 'capitalize' }}>
            {t(option)}
          </MenuItem>
        ))}
      </Field.Select>

      <Field.DatePicker name="createDate" label={t('create_date')} />
      <Field.DatePicker name="dueDate" label={t('due_date')} />
    </Stack>
  );
}
