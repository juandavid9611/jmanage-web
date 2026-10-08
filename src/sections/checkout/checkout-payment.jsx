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

import { toast } from 'src/components/snackbar';
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

// Maps API failures on POST /orders to a clear Spanish message (i18n keys). The API replies
// with { detail } text; status codes are the primary signal, detail text is a fallback.
function getOrderErrorKey(error) {
  const detail = typeof error?.detail === 'string' ? error.detail : error?.message || '';

  if (error?.status === 409 || /stock|available|insufficient/i.test(detail)) {
    return 'label_order_error_stock';
  }
  if (error?.status === 502) return 'label_order_error_payment_request';
  if (error?.status === 404) return 'label_order_error_product_unavailable';
  if (error?.status === 403) return 'label_order_error_forbidden';
  if (error?.status === 400 || error?.status === 422) return 'label_order_error_invalid';
  return 'label_order_error_generic';
}

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

      // Items carry only what the user chose; the server loads the products and recomputes
      // subtotal/total itself. `shipping` is one of the fixed DELIVERY_OPTIONS values and
      // `discount` is always 0.
      const orderData = {
        workspaceId: selectedWorkspace?.id,
        items: checkout.items.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          ...(item.colors?.[0] && { color: item.colors[0] }),
          ...(item.size && { size: item.size }),
        })),
        shipping: deliveryOption?.value ?? 0,
        discount: 0, // no client-controlled discounts: price reductions come from product.priceSale
        customer: {
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
      toast.error(t(getOrderErrorKey(error)));
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
