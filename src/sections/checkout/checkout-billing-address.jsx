import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';

import { useBoolean } from 'src/hooks/use-boolean';

import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';

import { AddressNewForm } from '../address';
import { useCheckoutContext } from './context';
import { CheckoutSummary } from './checkout-summary';

// ----------------------------------------------------------------------

export function CheckoutBillingAddress() {
  const { t } = useTranslation();
  const checkout = useCheckoutContext();

  const addressForm = useBoolean();

  return (
    <>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <EmptyContent
            title={t('label_no_saved_addresses')}
            description={t('label_add_address_to_continue')}
            sx={{ py: 5, mb: 3, borderRadius: 2, boxShadow: (theme) => theme.customShadows.card }}
          />

          <Stack direction="row" justifyContent="space-between">
            <Button
              size="small"
              color="inherit"
              onClick={checkout.onBackStep}
              startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
            >
              {t('label_back')}
            </Button>

            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                color="inherit"
                variant="outlined"
                onClick={() => checkout.onCreateBilling(null)}
              >
                {t('label_continue_without_address')}
              </Button>

              <Button
                size="small"
                color="primary"
                onClick={addressForm.onTrue}
                startIcon={<Iconify icon="mingcute:add-line" />}
              >
                {t('label_new_address')}
              </Button>
            </Stack>
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <CheckoutSummary
            total={checkout.total}
            subtotal={checkout.subtotal}
            discount={checkout.discount}
          />
        </Grid>
      </Grid>

      <AddressNewForm
        open={addressForm.value}
        onClose={addressForm.onFalse}
        onCreate={checkout.onCreateBilling}
      />
    </>
  );
}
