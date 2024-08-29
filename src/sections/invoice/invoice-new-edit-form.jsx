import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import LoadingButton from '@mui/lab/LoadingButton';
import { Box, Chip, Avatar, Divider, Typography, CardHeader, InputAdornment } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { today, fIsAfter, fDateTime } from 'src/utils/format-time';

import { TEAM_GROUPS } from 'src/_mock';
import { useGetUsers } from 'src/actions/user';
import { updatePaymentRequest, createPaymentRequests } from 'src/actions/paymentRequest';

import { toast } from 'src/components/snackbar';
import { Form, Field, schemaHelper } from 'src/components/hook-form';

import { InvoiceNewEditStatusDate } from './invoice-new-edit-status-date';

export const NewInvoiceSchema = zod
  .object({
    concept: zod.string().min(1, { message: 'Concept is required!' }),
    description: zod.string().min(1, { message: 'Description is required!' }),
    createDate: schemaHelper.date({ message: { required_error: 'Create date is required!' } }),
    dueDate: schemaHelper.date({ message: { required_error: 'Due date is required!' } }),
    status: zod.string().min(1, { message: 'Status is required!' }),
    category: zod.string().min(1, { message: 'Category is required!' }),
    group: zod.string().min(1, { message: 'Group is required!' }),
    paymentRequestTo: zod.any().array().min(1, { message: 'Payment request to is required!' }),
    userPrice: zod.number().min(1, { message: 'User price must be more than 0' }),
    overduePrice: zod.number(),
    sponsorPrice: zod.number(),
    sponsorPercentage: zod.number(),
  })
  .refine((data) => !fIsAfter(data.createDate, data.dueDate), {
    message: 'Due date cannot be earlier than create date!',
    path: ['dueDate'],
  });

// ----------------------------------------------------------------------

export function InvoiceNewEditForm({ currentInvoice }) {
  const { t } = useTranslation();
  const router = useRouter();

  const defaultValues = useMemo(
    () => ({
      concept: currentInvoice?.concept || '',
      description: currentInvoice?.description || '',
      id: currentInvoice?.id || null,
      createDate: currentInvoice?.createDate || today(),
      dueDate: currentInvoice?.dueDate || null,
      status: currentInvoice?.status || 'pending',
      category: currentInvoice?.category || 'yellow_card',
      paymentRequestTo: currentInvoice?.paymentRequestTo ? [currentInvoice.paymentRequestTo] : [],
      group: currentInvoice?.group || 'male',
      userPrice: currentInvoice?.totalAmount || 0,
      overduePrice: currentInvoice?.overduePrice || 0,
      sponsorPrice: currentInvoice?.sponsorPrice || 0,
      sponsorPercentage: currentInvoice?.sponsorPercentage || 0,
    }),
    [currentInvoice]
  );

  const methods = useForm({
    mode: 'all',
    resolver: zodResolver(NewInvoiceSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  const { users } = useGetUsers();

  const onSubmit = handleSubmit(async (data) => {
    data.createDate = fDateTime(data?.createDate, 'YYYY-MM-DDTHH:mm:ss');
    data.dueDate = fDateTime(data?.dueDate, 'YYYY-MM-DDTHH:mm:ss');

    try {
      if (currentInvoice) {
        await updatePaymentRequest(currentInvoice.id, data);
        toast.success('Update success!');
      } else {
        await createPaymentRequests(data);
        toast.success('Create success!');
      }
    } catch (error) {
      toast.error(error.message);
    }
    router.push(paths.dashboard.admin.invoice.root);
  });

  return (
    <Form methods={methods}>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 990 } }}>
        <Card>
          <InvoiceNewEditStatusDate />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{ xs: 'repeat(1, 1fr)', md: 'repeat(2, 1fr)' }}
            >
              <Field.Text name="concept" label={t('concept')} />

              <Field.Text name="description" label={t('description')} />

              <Field.Select
                native
                name="category"
                label={t('category')}
                InputLabelProps={{ shrink: true }}
              >
                {['Mensualidad', 'Tarjetas'].map((category) => (
                  <option key={category} value={category}>
                    {t(category)}
                  </option>
                ))}
              </Field.Select>

              <Field.Select native name="group" label="Grupo" InputLabelProps={{ shrink: true }}>
                {TEAM_GROUPS.map((group) => (
                  <option key={group.label} value={group.value}>
                    {t(group.label)}
                  </option>
                ))}
              </Field.Select>
            </Box>

            {!currentInvoice ? (
              <Field.Autocomplete
                multiple
                name="paymentRequestTo"
                placeholder={`${t('users')}...`}
                disableCloseOnSelect
                options={users.filter((option) => option.group === values?.group)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderOption={(props, paymentRequestTo) => (
                  <li {...props} key={paymentRequestTo.id}>
                    <Avatar
                      key={paymentRequestTo.id}
                      alt={paymentRequestTo.avatarUrl}
                      src={paymentRequestTo.avatarUrl}
                      sx={{ mr: 1, width: 24, height: 24, flexShrink: 0 }}
                    />

                    {paymentRequestTo.name}
                  </li>
                )}
                renderTags={(selected, getTagProps) =>
                  selected.map((paymentRequestTo, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      key={paymentRequestTo.id}
                      size="small"
                      variant="soft"
                      label={paymentRequestTo.name}
                      avatar={
                        <Avatar alt={paymentRequestTo.name} src={paymentRequestTo.avatarUrl} />
                      }
                    />
                  ))
                }
              />
            ) : (
              <Field.Text
                disabled
                name="paymentRequestTo"
                label={t('user')}
                value={currentInvoice?.paymentRequestTo?.name || ''}
              />
            )}

            <Stack spacing={1}>
              <Typography variant="subtitle2">{t('price')}</Typography>
              <Field.MultiCheckbox row name="gender" options={[]} sx={{ gap: 2 }} />
            </Stack>

            <Divider sx={{ borderStyle: 'dashed' }} />

            <Field.Text
              name="userPrice"
              label={t('regular_price')}
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              }}
            />

            <Field.Text
              name="overduePrice"
              label={t('overdue_price')}
              placeholder="0.00"
              type="number"
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Box component="span" sx={{ color: 'text.disabled' }}>
                      $
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Stack>
        </Card>

        <Card>
          <CardHeader
            title={t('payment')}
            subheader={t('add_your_payment_vouchers')}
            sx={{ mb: 3 }}
          />

          <Divider />
          <Stack spacing={3} sx={{ p: 3 }}>
            <Typography variant="subtitle2">{t('images')}</Typography>
            <Field.Upload
              disabled
              multiple
              thumbnail
              name="images"
              maxSize={3145728}
              onUpload={() => console.info('ON UPLOAD')}
            />
          </Stack>
        </Card>

        <Stack justifyContent="flex-end" direction="row" spacing={2} sx={{ mt: 3 }}>
          <LoadingButton
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            onClick={onSubmit}
          >
            {currentInvoice ? t('update') : t('create')} & {t('send')}
          </LoadingButton>
        </Stack>
      </Stack>
    </Form>
  );
}
