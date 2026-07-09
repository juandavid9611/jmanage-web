import { z as zod } from 'zod';
import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { zodResolver } from '@hookform/resolvers/zod';

import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import LoadingButton from '@mui/lab/LoadingButton';

import { createOrder } from 'src/actions/order';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Form } from 'src/components/hook-form';
import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

import { useCheckoutContext } from './context';
import { CheckoutSummary } from './checkout-summary';
import { CheckoutDelivery } from './checkout-delivery';
import { CheckoutBillingInfo } from './checkout-billing-info';
import { CheckoutPaymentMethods } from './checkout-payment-methods';

// ----------------------------------------------------------------------

// label/description values below are i18n keys, resolved via t() at render time.
const DELIVERY_OPTIONS = [
  {
    value: 0,
    label: 'label_delivery_pickup',
    description: 'label_delivery_pickup_desc',
    disabled: false,
  },
  {
    value: 10,
    label: 'word_standard',
    description: 'label_delivery_standard_desc',
    disabled: true,
  },
  {
    value: 20,
    label: 'word_express',
    description: 'label_delivery_express_desc',
    disabled: true,
  },
];

const PAYMENT_OPTIONS = [
  {
    value: 'paypal',
    label: 'PayPal',
    description: 'label_payment_paypal_desc',
    disabled: true,
  },
  {
    value: 'creditcard',
    label: 'word_credit_debit_card',
    description: 'label_payment_card_desc',
    disabled: true,
  },
  {
    value: 'cash',
    label: 'word_cash',
    description: 'label_payment_cash_desc',
    disabled: false,
  },
];

const CARD_OPTIONS = [];

export function getPaymentSchema(t) {
  return zod.object({
    payment: zod.string().min(1, { message: t('label_select_payment_method') }),
    delivery: zod.number(),
  });
}

// ----------------------------------------------------------------------

export function CheckoutPayment() {
  const { t } = useTranslation();
  const checkout = useCheckoutContext();
  const { selectedWorkspace } = useWorkspace();
  const { user } = useAuthContext();

  const defaultValues = { delivery: 0, payment: 'cash' };

  const PaymentSchema = useMemo(() => getPaymentSchema(t), [t]);

  const methods = useForm({
    resolver: zodResolver(PaymentSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      const deliveryOption = DELIVERY_OPTIONS.find((option) => option.value === data.delivery);
      const orderData = {
        workspaceId: selectedWorkspace?.id,
        items: checkout.items.map((item) => ({
          ...item,
          sku: item.sku || item.id,
        })),
        subtotal: checkout.subtotal,
        shipping: data.delivery,
        discount: checkout.discount,
        totalAmount: checkout.subtotal - checkout.discount + data.delivery,
        totalQuantity: checkout.totalItems,
        customer: {
          id: user?.id,
          name: user?.displayName || user?.name,
          email: user?.email,
          phoneNumber: user?.phone_number || user?.phoneNumber || '',
          avatarUrl: user?.photoURL,
        },
        shippingAddress: {
          fullAddress: checkout.billing?.fullAddress || t('label_delivery_pickup'),
          addressType: checkout.billing?.addressType || 'Pickup',
          company: checkout.billing?.company || '',
        },
        delivery: {
          shipmentAmount: data.delivery,
          deliveryType: deliveryOption?.label || 'label_delivery_pickup',
        },
        payment: {
          payment: data.payment,
        },
      };
      await createOrder(orderData);
      checkout.onNextStep();
      checkout.onReset();
    } catch (error) {
      console.error(error);
    }
  });

  return (
    <Form methods={methods} onSubmit={onSubmit}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <CheckoutDelivery
            name="delivery"
            onApplyShipping={checkout.onApplyShipping}
            options={DELIVERY_OPTIONS}
          />

          <CheckoutPaymentMethods
            name="payment"
            options={{
              cards: CARD_OPTIONS,
              payments: PAYMENT_OPTIONS,
            }}
            sx={{ my: 3 }}
          />

          <Button
            size="small"
            color="inherit"
            onClick={checkout.onBackStep}
            startIcon={<Iconify icon="eva:arrow-ios-back-fill" />}
          >
            {t('label_back')}
          </Button>
        </Grid>

        <Grid xs={12} md={4}>
          <CheckoutBillingInfo billing={checkout.billing} onBackStep={checkout.onBackStep} />

          <CheckoutSummary
            total={checkout.subtotal - checkout.discount}
            subtotal={checkout.subtotal}
            discount={checkout.discount}
            shipping={0}
            onEdit={() => checkout.onGotoStep(0)}
          />

          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
          >
            {t('label_complete_order')}
          </LoadingButton>
        </Grid>
      </Grid>
    </Form>
  );
}
