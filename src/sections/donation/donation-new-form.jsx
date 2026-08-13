import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { LoadingButton } from '@mui/lab';
import Button from '@mui/material/Button';
import InputAdornment from '@mui/material/InputAdornment';

import { createDonationContribution } from 'src/actions/donation';

import { toast } from 'src/components/snackbar';
import { Form, Field } from 'src/components/hook-form';

export function getDonationSchema(t) {
  return zod
    .object({
      donorName: zod.string().optional(),
      amountCop: zod.number().min(1, { message: t('donations_amount_required') }),
      message: zod.string().optional(),
      anonymous: zod.boolean(),
    })
    .refine((data) => data.anonymous || !!data.donorName, {
      message: t('donations_donor_name_required'),
      path: ['donorName'],
    });
}

const defaultValues = {
  donorName: '',
  amountCop: 0,
  message: '',
  anonymous: false,
};

export function DonationNewForm() {
  const { t } = useTranslation();
  const DonationSchema = getDonationSchema(t);

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(DonationSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await createDonationContribution(data);
      toast.success(t('donations_record_success'));
      reset();
    } catch (error) {
      toast.error(error?.detail || error.message || t('something_went_wrong'));
    }
  });

  return (
    <Form methods={methods}>
      <Card sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Field.Text name="donorName" label={t('donations_donor_name')} />
          <Field.Text
            name="amountCop"
            label={t('donations_amount')}
            type="number"
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: <InputAdornment position="start">$</InputAdornment>,
            }}
          />
          <Field.Text name="message" label={t('donations_message')} multiline rows={2} />
          <Field.Checkbox name="anonymous" label={t('donations_anonymous_checkbox')} />

          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button variant="soft" onClick={() => reset()}>
              {t('cancel')}
            </Button>
            <LoadingButton type="submit" variant="contained" loading={isSubmitting} onClick={onSubmit}>
              {t('donations_record_button')}
            </LoadingButton>
          </Stack>
        </Stack>
      </Card>
    </Form>
  );
}
