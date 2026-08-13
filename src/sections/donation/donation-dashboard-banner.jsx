import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';
import { useGetDonationSummary } from 'src/actions/donation';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function DonationDashboardBanner() {
  const { t } = useTranslation();
  const { totalAmountCop, contributionCount, summaryLoading, summaryError } =
    useGetDonationSummary();

  const totalImpactCop = (Number(totalAmountCop) || 0) * 2;

  return (
    <Card
      sx={{
        p: { xs: 2.5, sm: 3, md: 4 },
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 3,
        background: (theme) =>
          `linear-gradient(120deg, ${theme.vars.palette.warning.lighter} 0%, ${varAlpha(theme.vars.palette.success.lightChannel, 0.18)} 100%)`,
        border: (theme) => `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.22)}`,
        boxShadow: (theme) =>
          `0 16px 40px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
      }}
    >
      <Box
        sx={{
          top: -110,
          right: { xs: -130, md: '27%' },
          width: 280,
          height: 280,
          opacity: 0.12,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'warning.main',
        }}
      />
      <Box
        sx={{
          right: -80,
          bottom: -130,
          width: 260,
          height: 260,
          opacity: 0.08,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'error.main',
        }}
      />

      <Box
        sx={{
          gap: { xs: 3, md: 5 },
          display: 'grid',
          position: 'relative',
          alignItems: 'center',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) auto' },
        }}
      >
        <Stack spacing={2} alignItems="flex-start">
          <Chip
            size="small"
            color="warning"
            icon={<Iconify icon="solar:hand-heart-bold" />}
            label={t('dashboard_donations_badge')}
            sx={{ fontWeight: 800 }}
          />

          <Box>
            <Typography
              component="h2"
              variant="h3"
              sx={{ fontSize: { xs: 28, sm: 34, md: 40 }, letterSpacing: '-0.03em' }}
            >
              {t('dashboard_donations_title')}
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 1, maxWidth: 720, color: 'text.secondary', lineHeight: 1.65 }}
            >
              {t('dashboard_donations_description')}
            </Typography>
          </Box>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={1.25}
            sx={{ width: { xs: 1, sm: 'auto' } }}
          >
            <Button
              variant="contained"
              color="warning"
              href={`${paths.publicDonations.root}#como-donar`}
              startIcon={<Iconify icon="solar:heart-bold" />}
            >
              {t('dashboard_donations_cta')}
            </Button>
            <Button
              variant="soft"
              color="inherit"
              href={paths.publicDonations.root}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            >
              {t('dashboard_donations_learn_more')}
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            minWidth: { md: 300 },
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2.5,
            bgcolor: (theme) => varAlpha(theme.vars.palette.background.paperChannel, 0.82),
            backdropFilter: 'blur(8px)',
            border: (theme) => `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.7)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                {t('dashboard_donations_total_impact')}
              </Typography>
              {summaryLoading ? (
                <Box sx={{ pt: 1 }}>
                  <CircularProgress size={26} />
                </Box>
              ) : summaryError ? (
                <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                  {t('dashboard_donations_every_peso')}
                </Typography>
              ) : (
                <>
                  <Typography
                    variant="h3"
                    sx={{ mt: 0.25, color: 'success.dark', overflowWrap: 'anywhere' }}
                  >
                    {fCurrency(totalImpactCop, { currency: 'COP' })}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('donations_contributions_count', { count: contributionCount })}
                  </Typography>
                </>
              )}
            </Box>
            <Box
              sx={{
                width: 58,
                height: 58,
                display: 'grid',
                flexShrink: 0,
                placeItems: 'center',
                borderRadius: '50%',
                color: 'success.dark',
                bgcolor: 'success.lighter',
                typography: 'h5',
                fontWeight: 900,
              }}
            >
              2x
            </Box>
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}
