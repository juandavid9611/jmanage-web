import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

export function DonationContributionsList({ contributions, loading }) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Card sx={{ p: 5, textAlign: 'center' }}>
        <CircularProgress />
      </Card>
    );
  }

  if (contributions.length === 0) {
    return (
      <Card sx={{ p: 5, textAlign: 'center', color: 'text.secondary' }}>
        <Iconify
          icon="solar:hand-heart-bold-duotone"
          width={48}
          sx={{ mb: 1.5, color: 'warning.main' }}
        />
        <Typography variant="body1">{t('donations_none_yet')}</Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ overflow: 'hidden', borderRadius: 2.5 }}>
      <Stack
        divider={<Box sx={{ borderBottom: (theme) => `dashed 1px ${theme.palette.divider}` }} />}
      >
        {contributions.map((contribution) => (
          <Stack
            key={contribution.id}
            direction={{ xs: 'column', sm: 'row' }}
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2.5, gap: 2, alignItems: { xs: 'flex-start', sm: 'center' } }}
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  display: 'grid',
                  flexShrink: 0,
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'warning.dark',
                  bgcolor: 'warning.lighter',
                }}
              >
                <Iconify icon="solar:heart-bold-duotone" width={22} />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle2">
                  {contribution.donorName || t('donations_anonymous')}
                </Typography>
                {contribution.message && (
                  <Typography variant="body2" sx={{ mt: 0.25, color: 'text.secondary' }}>
                    {contribution.message}
                  </Typography>
                )}
              </Box>
            </Stack>
            <Typography
              variant="subtitle1"
              sx={{ pl: { xs: 7, sm: 0 }, color: 'success.dark', whiteSpace: 'nowrap' }}
            >
              {fCurrency(contribution.amountCop, { currency: 'COP' })}
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
