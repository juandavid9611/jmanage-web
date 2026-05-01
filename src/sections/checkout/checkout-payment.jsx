import { z as zod } from 'zod';
import { useForm } from 'react-hook-form';
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

const DELIVERY_OPTIONS = [
  {
    value: 0,
    label: 'Entrega en el lugar',
    description: 'Recoge tu pedido en la tienda sin costo.',
    disabled: false,
  },
  {
    value: 10,
    label: 'Standard',
    description: 'Entrega en 3-5 días.',
    disabled: true,
  },
  {
    value: 20,
    label: 'Express',
    description: 'Entrega en 2-3 días.',
    disabled: true,
  },
];

const PAYMENT_OPTIONS = [
  {
    value: 'paypal',
    label: 'PayPal',
    description: 'Paga con tu cuenta de PayPal.',
    disabled: true,
  },
  {
    value: 'creditcard',
    label: 'Tarjeta crédito / débito',
    description: 'Aceptamos Mastercard, Visa, Discover y Stripe.',
    disabled: true,
  },
  {
    value: 'cash',
    label: 'Efectivo',
    description: 'Paga en efectivo al recibir tu pedido.',
    disabled: false,
  },
];

const CARD_OPTIONS = [];

export const PaymentSchema = zod.object({
  payment: zod.string().min(1, { message: 'Selecciona un método de pago' }),
  delivery: zod.number(),
});

// ----------------------------------------------------------------------

export function CheckoutPayment() {
  const checkout = useCheckoutContext();
  const { selectedWorkspace } = useWorkspace();
  const { user } = useAuthContext();

  const defaultValues = { delivery: 0, payment: 'cash' };

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
          fullAddress: checkout.billing?.fullAddress || 'Entrega en el lugar',
          addressType: checkout.billing?.addressType || 'Pickup',
          company: checkout.billing?.company || '',
        },
        delivery: {
          shipmentAmount: data.delivery,
          deliveryType: deliveryOption?.label || 'Entrega en el lugar',
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
            Atrás
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
            Completar orden
          </LoadingButton>
        </Grid>
      </Grid>
    </Form>
  );
}
