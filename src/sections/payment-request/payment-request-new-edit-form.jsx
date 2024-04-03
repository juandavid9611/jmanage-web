import * as Yup from 'yup';
import PropTypes from 'prop-types';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import FormControlLabel from '@mui/material/FormControlLabel';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useResponsive } from 'src/hooks/use-responsive';

import { useGetUsers } from 'src/api/user';
import { TEAM_GROUPS, PAYMENT_REQUEST_CATEGORY_OPTIONS } from 'src/_mock';
import { updatePaymentRequest, createPaymentRequests } from 'src/api/paymentRequest';

import { useSnackbar } from 'src/components/snackbar';
import FormProvider, { RHFSelect, RHFTextField, RHFAutocomplete } from 'src/components/hook-form';

import PaymentRequestNewEditStatusDate from './payment-request-new-edit-status-date';

// ----------------------------------------------------------------------

export default function PaymentRequestNewEditForm({ currentPaymentRequest }) {
  const router = useRouter();

  const mdUp = useResponsive('up', 'md');

  const { enqueueSnackbar } = useSnackbar();

  const [includeSponsor, setIncludeSponsor] = useState(false);

  const { users } = useGetUsers();

  const { t } = useTranslation();

  const NewPaymentRequestSchema = Yup.object().shape({
    concept: Yup.string().required(t('concept_required')),
    description: Yup.string().required(t('description_required')),
    createDate: Yup.date().required(t('create_date_required')),
    dueDate: Yup.date(),
    status: Yup.string().required(t('status_required')),
    category: Yup.string().required(t('category_required')),
    group: Yup.string().required(t('group_required')),
    paymentRequestTo: Yup.array().min(1, t('payment_request_to_required')),
    userPrice: Yup.number(),
    sponsorPrice: Yup.number(),
    sponsorPercentage: Yup.number(),
  });

  const defaultValues = useMemo(
    () => ({
      concept: currentPaymentRequest?.concept || '',
      description: currentPaymentRequest?.description || '',
      id: currentPaymentRequest?.id || null,
      createDate: currentPaymentRequest?.createDate
        ? new Date(currentPaymentRequest.createDate)
        : new Date(),
      dueDate: currentPaymentRequest?.dueDate ? new Date(currentPaymentRequest.dueDate) : null,
      status: currentPaymentRequest?.status || 'pending',
      category: currentPaymentRequest?.category || 'yellow_card',
      group: currentPaymentRequest?.group || 'male',
      paymentRequestTo: currentPaymentRequest?.paymentRequestTo
        ? [currentPaymentRequest?.paymentRequestTo]
        : [],
      userPrice: currentPaymentRequest?.totalAmount || 0,
      sponsorPrice: currentPaymentRequest?.sponsorPrice || 0,
      sponsorPercentage: currentPaymentRequest?.sponsorPercentage || 0,
    }),
    [currentPaymentRequest]
  );

  const methods = useForm({
    resolver: yupResolver(NewPaymentRequestSchema),
    defaultValues,
  });

  const {
    watch,
    reset,
    setValue,
    resetField,
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const values = watch();

  useEffect(() => {
    if (currentPaymentRequest) {
      reset(defaultValues);
    }
  }, [currentPaymentRequest, defaultValues, reset]);

  useEffect(() => {
    if (includeSponsor) {
      setValue('sponsorPercentage', 0);
    } else {
      setValue('sponsorPercentage', currentPaymentRequest?.sponsorPercentage || 0);
    }
  }, [currentPaymentRequest?.sponsorPercentage, includeSponsor, setValue]);

  useEffect(() => {
    resetField('users');
  }, [resetField, values.group]);

  const onSubmit = handleSubmit(async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      reset();
      enqueueSnackbar(currentPaymentRequest ? 'Update success!' : 'Create success!');
      if (!currentPaymentRequest) {
        createPaymentRequests(data);
      } else {
        updatePaymentRequest(currentPaymentRequest.id, data);
      }

      router.push(paths.dashboard.admin.paymentRequest.root);
      console.info('DATA', data);
    } catch (error) {
      console.error(error);
    }
  });

  const handleChangeIncludeSponsor = useCallback((event) => {
    setIncludeSponsor(event.target.checked);
  }, []);

  const renderProperties = (
    <>
      {mdUp && (
        <Grid md={4}>
          <Typography variant="h6" sx={{ mb: 0.5 }}>
            {t('properties')}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('payment_request_properties')}
          </Typography>
        </Grid>
      )}

      <Grid xs={12} md={8}>
        <Card>
          <PaymentRequestNewEditStatusDate />
          {!mdUp && <CardHeader title="Properties" />}

          <Stack spacing={3} sx={{ p: 3 }}>
            <Box
              columnGap={2}
              rowGap={3}
              display="grid"
              gridTemplateColumns={{
                xs: 'repeat(1, 1fr)',
                md: 'repeat(2, 1fr)',
              }}
            >
              <RHFTextField name="concept" label={t('concept')} />

              <RHFTextField name="description" label={t('description')} />

              <RHFSelect native name="category" label={t('category')} InputLabelProps={{ shrink: true }}>
                {PAYMENT_REQUEST_CATEGORY_OPTIONS.map((category) => (
                  <optgroup key={category.group} label={category.group}>
                    {category.classify.map((classify) => (
                      <option key={classify.label} value={classify.value}>
                        {classify.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </RHFSelect>

              <RHFSelect native name="group" label={t('group')} InputLabelProps={{ shrink: true }}>
                {TEAM_GROUPS.map((group) => (
                  <option key={group.label} value={group.value}>
                    {t(group.label)}
                  </option>
                ))}
              </RHFSelect>
            </Box>

            {!currentPaymentRequest ? (
              <RHFAutocomplete
                name="paymentRequestTo"
                label={t('users')}
                placeholder={`+${t('user')}`}
                disableCloseOnSelect
                multiple
                options={users.filter((option) => option.group === values?.group)}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option?.id === value?.id}
                renderTags={(selected, getTagProps) =>
                  selected.map((option, index) => (
                    <Chip
                      {...getTagProps({ index })}
                      label={option.name}
                      size="small"
                      color="info"
                      variant="soft"
                    />
                  ))
                }
              />
            ) : (
              <RHFTextField
                disabled
                name="paymentRequestTo"
                label={t('users')}
                value={currentPaymentRequest?.paymentRequestTo?.name || ''}
              />
            )}

            <Divider sx={{ borderStyle: 'dashed' }} />
            <Stack spacing={3}>
              <RHFTextField
                name="userPrice"
                label={t('user_price')}
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

              <RHFTextField
                name="sponsorPrice"
                label={t('sponsor_price')}
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

              <FormControlLabel
                control={<Switch checked={includeSponsor} onChange={handleChangeIncludeSponsor} />}
                label={t('price_include_sponsor')}
              />

              {includeSponsor && (
                <RHFTextField
                  name="sponsorPercentage"
                  label="Sponsor (%)"
                  placeholder="0.00"
                  type="number"
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Box component="span" sx={{ color: 'text.disabled' }}>
                          %
                        </Box>
                      </InputAdornment>
                    ),
                  }}
                />
              )}
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </>
  );

  const renderActions = (
    <>
      {mdUp && <Grid md={4} />}
      <Grid xs={12} md={8} sx={{ display: 'flex', alignItems: 'center' }}>
        <Box sx={{ flexGrow: 1 }} />

        <LoadingButton type="submit" variant="contained" size="large" loading={isSubmitting}>
          {!currentPaymentRequest ? 'Create Payment Request' : 'Save Changes'}
        </LoadingButton>
      </Grid>
    </>
  );

  return (
    <FormProvider methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        {renderProperties}
        {renderActions}
      </Grid>
    </FormProvider>
  );
}

PaymentRequestNewEditForm.propTypes = {
  currentPaymentRequest: PropTypes.object,
};
