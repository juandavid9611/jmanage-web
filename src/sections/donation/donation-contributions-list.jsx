import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

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
      <Card sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
        {t('donations_none_yet')}
      </Card>
    );
  }

  return (
    <Card>
      <Stack
        divider={<Box sx={{ borderBottom: (theme) => `dashed 1px ${theme.palette.divider}` }} />}
      >
        {contributions.map((contribution) => (
          <Stack
            key={contribution.id}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ p: 2 }}
          >
            <Box>
              <Typography variant="subtitle2">
                {contribution.donorName || t('donations_anonymous')}
              </Typography>
              {contribution.message && (
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {contribution.message}
                </Typography>
              )}
            </Box>
            <Typography variant="subtitle1">{fCurrency(contribution.amountCop)}</Typography>
          </Stack>
        ))}
      </Stack>
    </Card>
  );
}
