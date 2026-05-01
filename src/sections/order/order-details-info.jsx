import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { useGetPaymentRequest } from 'src/actions/paymentRequest';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const PAYMENT_STATUS_LABEL = {
  paid: { text: 'Pagado', color: 'success' },
  pending: { text: 'Pendiente', color: 'warning' },
  overdue: { text: 'Vencido', color: 'error' },
  canceled: { text: 'Cancelado', color: 'default' },
  approval_pending: { text: 'Aprobando', color: 'info' },
};

const PAYMENT_METHOD_LABEL = {
  cash: { text: 'Efectivo', icon: 'solar:wad-of-money-bold' },
  creditcard: { text: 'Tarjeta crédito / débito', icon: 'solar:card-bold' },
  paypal: { text: 'PayPal', icon: 'logos:paypal' },
};

function Row({ label, children }) {
  return (
    <Stack direction="row" alignItems="center" sx={{ typography: 'body2' }}>
      <Box component="span" sx={{ color: 'text.secondary', width: 140, flexShrink: 0 }}>
        {label}
      </Box>
      <Box sx={{ flexGrow: 1, minWidth: 0, wordBreak: 'break-word' }}>{children || '—'}</Box>
    </Stack>
  );
}

export function OrderDetailsInfo({
  customer,
  delivery,
  payment,
  shippingAddress,
  paymentRequestId,
}) {
  const { paymentRequest } = useGetPaymentRequest(paymentRequestId);

  const paymentMethod = PAYMENT_METHOD_LABEL[payment?.payment];

  const renderCustomer = (
    <>
      <CardHeader title="Cliente" />
      <Stack direction="row" sx={{ p: 3 }}>
        <Avatar
          alt={customer?.name}
          src={customer?.avatarUrl}
          sx={{ width: 48, height: 48, mr: 2 }}
        />

        <Stack spacing={0.5} alignItems="flex-start" sx={{ typography: 'body2' }}>
          <Typography variant="subtitle2">{customer?.name || '—'}</Typography>

          {customer?.email && <Box sx={{ color: 'text.secondary' }}>{customer.email}</Box>}

          {customer?.phoneNumber && (
            <Box sx={{ color: 'text.secondary' }}>{customer.phoneNumber}</Box>
          )}
        </Stack>
      </Stack>
    </>
  );

  const renderDelivery = (
    <>
      <CardHeader title="Entrega" />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Row label="Tipo">{delivery?.deliveryType}</Row>
        <Row label="Costo">
          {delivery?.shipmentAmount != null
            ? `$${Number(delivery.shipmentAmount).toLocaleString()}`
            : '—'}
        </Row>
      </Stack>
    </>
  );

  const renderShipping = (
    <>
      <CardHeader title="Dirección" />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Row label="Dirección">{shippingAddress?.fullAddress}</Row>
        {shippingAddress?.company && <Row label="Empresa">{shippingAddress.company}</Row>}
        {customer?.phoneNumber && <Row label="Teléfono">{customer.phoneNumber}</Row>}
      </Stack>
    </>
  );

  const renderPayment = (
    <>
      <CardHeader title="Método de pago" />
      <Stack direction="row" alignItems="center" spacing={1} sx={{ p: 3 }}>
        {paymentMethod ? (
          <>
            <Iconify icon={paymentMethod.icon} width={24} />
            <Typography variant="body2">{paymentMethod.text}</Typography>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            —
          </Typography>
        )}
      </Stack>
    </>
  );

  const renderPaymentRequest = paymentRequestId ? (
    <>
      <CardHeader
        title="Solicitud de pago"
        action={
          <Button
            component={RouterLink}
            href={paths.dashboard.admin.invoice.edit(paymentRequestId)}
            size="small"
            endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
          >
            Ver
          </Button>
        }
      />
      <Stack spacing={1.5} sx={{ p: 3 }}>
        <Row label="Estado">
          {paymentRequest?.status ? (
            <Label color={PAYMENT_STATUS_LABEL[paymentRequest.status]?.color || 'default'}>
              {PAYMENT_STATUS_LABEL[paymentRequest.status]?.text || paymentRequest.status}
            </Label>
          ) : null}
        </Row>
        <Row label="Monto">
          {paymentRequest?.totalAmount != null
            ? `$${Number(paymentRequest.totalAmount).toLocaleString()}`
            : null}
        </Row>
        <Row label="Vencimiento">{paymentRequest?.dueDate}</Row>
      </Stack>
    </>
  ) : null;

  return (
    <Card>
      {renderCustomer}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderDelivery}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderShipping}

      <Divider sx={{ borderStyle: 'dashed' }} />

      {renderPayment}

      {renderPaymentRequest && <Divider sx={{ borderStyle: 'dashed' }} />}

      {renderPaymentRequest}
    </Card>
  );
}
