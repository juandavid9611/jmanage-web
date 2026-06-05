import { useState, useCallback } from 'react';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { DashboardContent } from 'src/layouts/dashboard';
import { updateOrder, setOrderDeliveryCheck, setOrderProviderCheck } from 'src/actions/order';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { SplashScreen } from 'src/components/loading-screen';

import { ORDER_STATUS_OPTIONS } from '../order-status';
import { OrderDetailsInfo } from '../order-details-info';
import { OrderDetailsItems } from '../order-details-item';
import { OrderDetailsToolbar } from '../order-details-toolbar';
import { OrderDetailsHistory } from '../order-details-history';

// ----------------------------------------------------------------------

export function OrderDetailsView({ order, loading, error }) {
  const [status, setStatus] = useState(order?.status);
  const [providerCheck, setProviderCheck] = useState(order?.providerCheck || null);
  const [deliveryCheck, setDeliveryCheck] = useState(order?.deliveryCheck || null);

  const handleChangeStatus = useCallback(
    async (newValue) => {
      const previous = status;
      try {
        setStatus(newValue);
        await updateOrder(order.id, { status: newValue });
      } catch (err) {
        console.error(err);
        setStatus(previous);
        toast.error(err?.detail || 'No se pudo actualizar el estado');
      }
    },
    [order?.id, status]
  );

  const handleToggleProviderCheck = useCallback(
    async (checked) => {
      const previous = providerCheck;
      setProviderCheck({ checked, checkedAt: new Date().toISOString(), checkedBy: 'me' });
      try {
        const updated = await setOrderProviderCheck(order.id, checked);
        setProviderCheck(updated.providerCheck || null);
      } catch (err) {
        console.error(err);
        setProviderCheck(previous);
        toast.error(err?.detail || 'No se pudo guardar el cambio');
      }
    },
    [order?.id, providerCheck]
  );

  const handleToggleDeliveryCheck = useCallback(
    async (checked) => {
      const previous = deliveryCheck;
      setDeliveryCheck({ checked, checkedAt: new Date().toISOString(), checkedBy: 'me' });
      try {
        const updated = await setOrderDeliveryCheck(order.id, checked);
        setDeliveryCheck(updated.deliveryCheck || null);
      } catch (err) {
        console.error(err);
        setDeliveryCheck(previous);
        toast.error(err?.detail || 'No se pudo guardar el cambio');
      }
    },
    [order?.id, deliveryCheck]
  );

  if (loading) {
    return <SplashScreen />;
  }

  if (error) {
    return (
      <DashboardContent>
        <EmptyContent
          filled
          title="Order not found!"
          action={
            <Button
              component={RouterLink}
              href={paths.dashboard.order.root}
              startIcon={<Iconify width={16} icon="eva:arrow-ios-back-fill" />}
              sx={{ mt: 3 }}
            >
              Back to list
            </Button>
          }
          sx={{ py: 10, height: 'auto', flexGrow: 'unset' }}
        />
      </DashboardContent>
    );
  }

  return (
    <DashboardContent>
      <OrderDetailsToolbar
        backLink={paths.dashboard.order.root}
        orderNumber={order?.orderNumber}
        createdAt={order?.createdAt}
        status={status}
        onChangeStatus={handleChangeStatus}
        statusOptions={ORDER_STATUS_OPTIONS}
        providerCheck={providerCheck}
        deliveryCheck={deliveryCheck}
        onToggleProviderCheck={handleToggleProviderCheck}
        onToggleDeliveryCheck={handleToggleDeliveryCheck}
      />

      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <Stack spacing={3} direction={{ xs: 'column-reverse', md: 'column' }}>
            <OrderDetailsItems
              items={order?.items}
              taxes={order?.taxes}
              shipping={order?.shipping}
              discount={order?.discount}
              subtotal={order?.subtotal}
              totalAmount={order?.totalAmount}
            />

            <OrderDetailsHistory history={order?.history} />
          </Stack>
        </Grid>

        <Grid xs={12} md={4}>
          <OrderDetailsInfo
            customer={order?.customer}
            delivery={order?.delivery}
            payment={order?.payment}
            shippingAddress={order?.shippingAddress}
            paymentRequestId={order?.paymentRequestId}
          />
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
