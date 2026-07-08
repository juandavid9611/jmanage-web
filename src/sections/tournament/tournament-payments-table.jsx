import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import { fDate } from 'src/utils/format-time';
import { fCurrency } from 'src/utils/format-number';

import { useGetPaymentRequests } from 'src/actions/paymentRequest';

import { EmptyContent } from 'src/components/empty-content';

// ----------------------------------------------------------------------

const STATUS_META = {
  paid: { label: 'Pagado', color: 'success' },
  pending: { label: 'Pendiente', color: 'warning' },
  overdue: { label: 'Vencido', color: 'error' },
  approval_pending: { label: 'En revisión', color: 'secondary' },
  canceled: { label: 'Cancelado', color: 'default' },
};

/**
 * Payment requests generated for a tournament (e.g. via "Generar Cobros").
 * These are grouped by tournamentId rather than a workspace, so they're
 * fetched here instead of the workspace-scoped invoice views.
 */
export function TournamentPaymentsTable({ tournamentId }) {
  const { paymentRequests, paymentRequestsLoading } = useGetPaymentRequests(tournamentId);

  if (paymentRequestsLoading) {
    return (
      <Stack spacing={1}>
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="rounded" height={56} />
        ))}
      </Stack>
    );
  }

  if (!paymentRequests?.length) {
    return <EmptyContent title="Sin cobros generados todavía" sx={{ py: 6 }} />;
  }

  return (
    <Stack spacing={0.75}>
      {paymentRequests.map((pr) => {
        const recipient = pr.paymentRequestTo?.[0];
        const meta = STATUS_META[pr.status] || STATUS_META.pending;
        return (
          <Box
            key={pr.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.25,
              bgcolor: 'background.paper',
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
              borderRadius: 1,
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Avatar sx={{ width: 32, height: 32 }}>
                {(recipient?.name || '?').charAt(0).toUpperCase()}
              </Avatar>
              <Stack spacing={0.25}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {pr.concept}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {recipient?.name || 'Sin destinatario'} · Vence {fDate(pr.dueDate)}
                </Typography>
              </Stack>
            </Stack>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {fCurrency(pr.totalAmount)}
            </Typography>

            <Chip size="small" variant="soft" color={meta.color} label={meta.label} />
          </Box>
        );
      })}
    </Stack>
  );
}
