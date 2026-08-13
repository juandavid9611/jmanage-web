import { useTranslation } from 'react-i18next';
import { m, useReducedMotion } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';
import { useGetDonationSummary } from 'src/actions/donation';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const EXAMPLE_AMOUNT_COP = 10000;

export function LandingDonationCampaign() {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const { totalAmountCop, contributionCount, summaryLoading, summaryError } =
    useGetDonationSummary();

  const communityTotal = Number(totalAmountCop) || 0;
  const totalImpact = communityTotal * 2;
  const motionProps = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.35 },
        transition: { duration: 0.55, ease: 'easeOut' },
      };

  return (
    <Box
      component="section"
      id="donations"
      sx={{
        pt: { xs: 13, md: 15 },
        pb: { xs: 8, md: 11 },
        overflow: 'hidden',
        position: 'relative',
        background: (theme) =>
          `linear-gradient(135deg, ${varAlpha(theme.vars.palette.warning.lightChannel, 0.16)} 0%, ${varAlpha(theme.vars.palette.success.lightChannel, 0.08)} 100%)`,
        borderBottom: (theme) =>
          `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.12)}`,
      }}
    >
      <Box
        sx={{
          top: -140,
          right: { xs: -160, md: '4%' },
          width: 380,
          height: 380,
          opacity: 0.12,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'warning.main',
        }}
      />
      <Box
        sx={{
          right: { xs: -100, md: '-2%' },
          bottom: -170,
          width: 320,
          height: 320,
          opacity: 0.08,
          position: 'absolute',
          borderRadius: '50%',
          bgcolor: 'error.main',
        }}
      />

      <Container sx={{ position: 'relative' }}>
        <Box
          component={m.div}
          {...motionProps}
          sx={{
            display: 'grid',
            gap: { xs: 5, md: 8 },
            alignItems: 'center',
            gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(360px, 0.85fr)' },
          }}
        >
          <Stack
            spacing={3}
            alignItems={{ xs: 'center', md: 'flex-start' }}
            sx={{ textAlign: { xs: 'center', md: 'left' } }}
          >
            <Chip
              color="warning"
              icon={<Iconify icon="solar:hand-heart-bold" />}
              label={t('home_donations_eyebrow')}
              sx={{ fontWeight: 800 }}
            />

            <Typography
              variant="h2"
              sx={{ maxWidth: 680, fontSize: { xs: 38, md: 52 }, letterSpacing: '-0.035em' }}
            >
              {t('home_donations_title')}
            </Typography>

            <Typography
              sx={{ maxWidth: 640, color: 'text.secondary', fontSize: { md: 18 }, lineHeight: 1.7 }}
            >
              {t('home_donations_description')}
            </Typography>

            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              sx={{ width: { xs: 1, sm: 'auto' } }}
            >
              <Button
                size="large"
                variant="contained"
                color="warning"
                href={paths.publicDonations.root}
                startIcon={<Iconify icon="solar:heart-bold" />}
              >
                {t('home_donations_cta')}
              </Button>
              <Button
                size="large"
                variant="soft"
                color="inherit"
                href={`${paths.publicDonations.root}#como-donar`}
                endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
              >
                {t('donations_how_title')}
              </Button>
            </Stack>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2.5 }}>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Iconify
                  icon="solar:shield-check-bold-duotone"
                  width={20}
                  sx={{ color: 'success.main' }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('home_donations_transparency')}
                </Typography>
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Iconify
                  icon="solar:tag-price-bold-duotone"
                  width={20}
                  sx={{ color: 'warning.dark' }}
                />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  {t('home_donations_direct_purchase')}
                </Typography>
              </Stack>
            </Stack>
          </Stack>

          <Card
            sx={{
              p: { xs: 3, sm: 4 },
              borderRadius: 3,
              position: 'relative',
              border: (theme) =>
                `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.22)}`,
              boxShadow: (theme) =>
                `0 28px 70px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.18)}`,
            }}
          >
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 3 }}
            >
              <Box>
                <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                  {t('home_donations_example_title')}
                </Typography>
                <Typography variant="h5">{t('home_donations_example_subtitle')}</Typography>
              </Box>
              <Box
                component={m.div}
                animate={prefersReducedMotion ? undefined : { scale: [1, 1.08, 1] }}
                transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                sx={{
                  width: 52,
                  height: 52,
                  display: 'grid',
                  flexShrink: 0,
                  placeItems: 'center',
                  borderRadius: '50%',
                  color: 'success.dark',
                  bgcolor: 'success.lighter',
                  typography: 'h6',
                  fontWeight: 900,
                }}
              >
                2x
              </Box>
            </Stack>

            <Stack spacing={1.5}>
              <AmountRow
                icon="solar:users-group-rounded-bold-duotone"
                label={t('home_donations_community_label')}
                amount={EXAMPLE_AMOUNT_COP}
              />
              <AmountRow
                icon="solar:hand-money-bold-duotone"
                label={t('home_donations_sportsmanagement_label')}
                amount={EXAMPLE_AMOUNT_COP}
                color="success"
                prefix="+"
              />

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Typography variant="subtitle1">{t('home_donations_impact_label')}</Typography>
                <Typography variant="h4" sx={{ color: 'warning.dark', whiteSpace: 'nowrap' }}>
                  {fCurrency(EXAMPLE_AMOUNT_COP * 2, { currency: 'COP' })}
                </Typography>
              </Stack>
            </Stack>

            {!summaryError && (
              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => theme.palette.background.neutral,
                }}
              >
                {summaryLoading ? (
                  <Stack alignItems="center">
                    <CircularProgress size={24} />
                  </Stack>
                ) : (
                  <Stack
                    direction="row"
                    alignItems="center"
                    justifyContent="space-between"
                    spacing={2}
                  >
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('home_donations_live_impact')}
                      </Typography>
                      <Typography variant="h5" sx={{ mt: 0.25 }}>
                        {fCurrency(totalImpact, { currency: 'COP' })}
                      </Typography>
                    </Box>
                    <Chip
                      size="small"
                      color="success"
                      label={t('donations_contributions_count', { count: contributionCount })}
                    />
                  </Stack>
                )}
              </Box>
            )}
          </Card>
        </Box>
      </Container>
    </Box>
  );
}

function AmountRow({ icon, label, amount, color = 'warning', prefix = '' }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            display: 'grid',
            flexShrink: 0,
            placeItems: 'center',
            borderRadius: 1.5,
            color: `${color}.dark`,
            bgcolor: `${color}.lighter`,
          }}
        >
          <Iconify icon={icon} width={21} />
        </Box>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Stack>
      <Typography variant="subtitle1" sx={{ color: `${color}.dark`, whiteSpace: 'nowrap' }}>
        {prefix} {fCurrency(amount, { currency: 'COP' })}
      </Typography>
    </Stack>
  );
}
