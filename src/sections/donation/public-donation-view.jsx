import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';

import { fCurrency } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';
import { useGetDonationSummary, useGetDonationContributions } from 'src/actions/donation';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

import { LandingNav } from 'src/sections/landing/landing-nav';

import { DonationPaymentDetails } from './donation-payment-details';
import { DonationMessageSpotlight } from './donation-message-spotlight';
import { DonationContributionsList } from './donation-contributions-list';

// ----------------------------------------------------------------------

const IMPACT_ITEMS = [
  {
    icon: 'solar:map-point-bold-duotone',
    valueKey: 'donations_distance_value',
    labelKey: 'donations_distance_label',
  },
  {
    icon: 'solar:buildings-3-bold-duotone',
    valueKey: 'donations_direct_purchase_value',
    labelKey: 'donations_direct_purchase_label',
  },
  {
    icon: 'solar:hand-heart-bold-duotone',
    valueKey: 'donations_any_amount_value',
    labelKey: 'donations_any_amount_label',
  },
];

const MATERIAL_ITEMS = [
  { icon: 'solar:buildings-2-bold-duotone', labelKey: 'donations_material_cement' },
  { icon: 'solar:home-2-bold-duotone', labelKey: 'donations_material_roofing' },
  { icon: 'solar:layers-bold-duotone', labelKey: 'donations_material_wood' },
  { icon: 'solar:hammer-bold-duotone', labelKey: 'donations_material_tools' },
];

export function PublicDonationView() {
  const { t } = useTranslation();
  const { totalAmountCop, contributionCount, summaryLoading, summaryError } =
    useGetDonationSummary();
  const { contributions, contributionsLoading, contributionsError } =
    useGetDonationContributions(20);
  const communityTotalAmountCop = Number(totalAmountCop) || 0;
  const totalImpactCop = communityTotalAmountCop * 2;

  const shareText = t('donations_share_text');
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${window.location.href}`)}`;

  return (
    <Box
      sx={{
        width: '100%',
        maxWidth: '100vw',
        minHeight: '100vh',
        overflowX: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <LandingNav basePath="/" />

      <Box
        component="main"
        sx={{
          overflow: 'hidden',
          background: (theme) =>
            `linear-gradient(180deg, ${varAlpha(theme.vars.palette.warning.lightChannel, 0.14)} 0%, transparent 32%)`,
        }}
      >
        <Box
          component="section"
          sx={{ position: 'relative', pt: { xs: 12, md: 16 }, pb: { xs: 7, md: 11 } }}
        >
          <Box
            sx={{
              top: 72,
              right: { xs: -100, md: '6%' },
              width: 280,
              height: 280,
              opacity: 0.14,
              position: 'absolute',
              borderRadius: '50%',
              bgcolor: 'warning.main',
              filter: 'blur(1px)',
            }}
          />
          <Box
            sx={{
              top: 220,
              right: { xs: -80, md: '1%' },
              width: 180,
              height: 180,
              opacity: 0.1,
              position: 'absolute',
              borderRadius: '50%',
              bgcolor: 'error.main',
            }}
          />

          <Container maxWidth="lg" sx={{ position: 'relative' }}>
            <Grid container spacing={{ xs: 5, md: 8 }} alignItems="center">
              <Grid xs={12} md={7} sx={{ minWidth: 0 }}>
                <Stack
                  spacing={3}
                  alignItems={{ xs: 'center', md: 'flex-start' }}
                  sx={{ textAlign: { xs: 'center', md: 'left' } }}
                >
                  <Chip
                    color="warning"
                    icon={<Iconify icon="solar:hand-heart-bold" />}
                    label={t('donations_campaign_badge')}
                    sx={{ fontWeight: 700 }}
                  />

                  <Typography
                    component="h1"
                    sx={{
                      maxWidth: 760,
                      fontSize: { xs: 40, sm: 54, md: 68 },
                      fontWeight: 800,
                      lineHeight: 0.98,
                      letterSpacing: '-0.045em',
                    }}
                  >
                    {t('donations_hero_title')}
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      maxWidth: 690,
                      color: 'text.secondary',
                      fontWeight: 400,
                      lineHeight: 1.65,
                    }}
                  >
                    {t('donations_hero_description')}
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
                      href="#como-donar"
                      startIcon={<Iconify icon="solar:heart-bold" />}
                    >
                      {t('donations_cta_donate')}
                    </Button>
                    <Button
                      size="large"
                      variant="soft"
                      color="inherit"
                      href={shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      startIcon={<Iconify icon="logos:whatsapp-icon" />}
                    >
                      {t('donations_cta_share')}
                    </Button>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ color: 'text.secondary' }}
                  >
                    <Iconify
                      icon="solar:shield-check-bold-duotone"
                      width={22}
                      sx={{ color: 'success.main' }}
                    />
                    <Typography variant="body2">{t('donations_transparency_short')}</Typography>
                  </Stack>
                </Stack>
              </Grid>

              <Grid xs={12} md={5} sx={{ minWidth: 0 }}>
                <Card
                  sx={{
                    p: { xs: 3, sm: 4 },
                    borderRadius: 3,
                    border: (theme) =>
                      `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.2)}`,
                    boxShadow: (theme) =>
                      `0 32px 80px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.2)}`,
                  }}
                >
                  <Stack spacing={3}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="overline" sx={{ color: 'text.secondary' }}>
                        {t('donations_total_impact')}
                      </Typography>
                      <Chip label="2x" color="success" size="small" sx={{ fontWeight: 800 }} />
                    </Stack>

                    {summaryLoading ? (
                      <Box sx={{ py: 2, textAlign: 'center' }}>
                        <CircularProgress />
                      </Box>
                    ) : summaryError ? (
                      <Typography variant="body2" sx={{ color: 'error.main' }}>
                        {t('donations_summary_error')}
                      </Typography>
                    ) : (
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="h2" sx={{ wordBreak: 'break-word' }}>
                            {fCurrency(totalImpactCop, { currency: 'COP' })}
                          </Typography>
                          <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 0.5 }}>
                            {t('donations_contributions_count', { count: contributionCount })}
                          </Typography>
                        </Box>

                        <Stack spacing={1}>
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                              {t('donations_community_amount')}
                            </Typography>
                            <Typography variant="subtitle2" sx={{ whiteSpace: 'nowrap' }}>
                              {fCurrency(communityTotalAmountCop, { currency: 'COP' })}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" spacing={2}>
                            <Typography variant="body2" sx={{ color: 'success.dark' }}>
                              {t('donations_sportsmanagement_amount')}
                            </Typography>
                            <Typography
                              variant="subtitle2"
                              sx={{ color: 'success.dark', whiteSpace: 'nowrap' }}
                            >
                              + {fCurrency(communityTotalAmountCop, { currency: 'COP' })}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    )}

                    <Divider sx={{ borderStyle: 'dashed' }} />

                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        bgcolor: (theme) => varAlpha(theme.vars.palette.warning.mainChannel, 0.1),
                      }}
                    >
                      <Stack direction="row" spacing={1.5}>
                        <Iconify
                          icon="solar:hand-money-bold-duotone"
                          width={28}
                          sx={{ color: 'warning.dark', flexShrink: 0 }}
                        />
                        <Box>
                          <Typography variant="subtitle2">
                            {t('donations_discount_title')}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
                            {t('donations_discount_description')}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            </Grid>
          </Container>
        </Box>

        <Container maxWidth="lg">
          <Grid container spacing={2.5} sx={{ mb: { xs: 8, md: 12 } }}>
            {IMPACT_ITEMS.map((item) => (
              <Grid xs={12} md={4} key={item.valueKey}>
                <Card
                  sx={{
                    p: 3,
                    height: 1,
                    borderRadius: 2.5,
                    boxShadow: 'none',
                    border: (theme) => `1px solid ${theme.vars.palette.divider}`,
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        display: 'grid',
                        flexShrink: 0,
                        placeItems: 'center',
                        borderRadius: 2,
                        color: 'warning.dark',
                        bgcolor: (theme) => varAlpha(theme.vars.palette.warning.mainChannel, 0.12),
                      }}
                    >
                      <Iconify icon={item.icon} width={28} />
                    </Box>
                    <Box>
                      <Typography variant="h6">{t(item.valueKey)}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {t(item.labelKey)}
                      </Typography>
                    </Box>
                  </Stack>
                </Card>
              </Grid>
            ))}
          </Grid>

          <DonationMessageSpotlight
            contributions={contributions}
            loading={contributionsLoading}
            error={contributionsError}
          />

          <Grid
            container
            spacing={{ xs: 5, md: 8 }}
            alignItems="center"
            sx={{ mb: { xs: 8, md: 12 } }}
          >
            <Grid xs={12} md={6}>
              <Typography variant="overline" sx={{ color: 'warning.dark' }}>
                {t('donations_story_eyebrow')}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1, mb: 3 }}>
                {t('donations_story_title')}
              </Typography>
              <Stack spacing={2} sx={{ color: 'text.secondary' }}>
                <Typography>{t('donations_story_paragraph_1')}</Typography>
                <Typography>{t('donations_story_paragraph_2')}</Typography>
                <Typography sx={{ color: 'text.primary', fontWeight: 600 }}>
                  {t('donations_story_paragraph_3')}
                </Typography>
              </Stack>
            </Grid>

            <Grid xs={12} md={6}>
              <Card
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 3,
                  bgcolor: (theme) => varAlpha(theme.vars.palette.success.mainChannel, 0.08),
                  boxShadow: 'none',
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 3 }}>
                  <Iconify
                    icon="solar:home-smile-bold-duotone"
                    width={36}
                    sx={{ color: 'success.main' }}
                  />
                  <Box>
                    <Typography variant="h5">{t('donations_materials_title')}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t('donations_materials_subtitle')}
                    </Typography>
                  </Box>
                </Stack>
                <Grid container spacing={2}>
                  {MATERIAL_ITEMS.map((item) => (
                    <Grid xs={6} key={item.labelKey}>
                      <Stack
                        spacing={1}
                        sx={{ p: 2, height: 1, borderRadius: 2, bgcolor: 'background.paper' }}
                      >
                        <Iconify icon={item.icon} width={28} sx={{ color: 'success.dark' }} />
                        <Typography variant="subtitle2">{t(item.labelKey)}</Typography>
                      </Stack>
                    </Grid>
                  ))}
                </Grid>
              </Card>
            </Grid>
          </Grid>
        </Container>

        <Box
          id="como-donar"
          component="section"
          sx={{
            py: { xs: 8, md: 12 },
            scrollMarginTop: 72,
            bgcolor: (theme) => theme.palette.background.neutral,
          }}
        >
          <Container maxWidth="lg">
            <Stack alignItems="center" sx={{ mb: { xs: 4, md: 6 }, textAlign: 'center' }}>
              <Typography variant="overline" sx={{ color: 'warning.dark' }}>
                {t('donations_how_eyebrow')}
              </Typography>
              <Typography variant="h3" sx={{ mt: 1 }}>
                {t('donations_how_title')}
              </Typography>
              <Typography sx={{ mt: 1.5, maxWidth: 620, color: 'text.secondary' }}>
                {t('donations_how_subtitle')}
              </Typography>
            </Stack>
            <DonationPaymentDetails />
          </Container>
        </Box>

        <Container maxWidth="md" component="section" sx={{ py: { xs: 8, md: 12 } }}>
          <Stack alignItems="center" sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="overline" sx={{ color: 'warning.dark' }}>
              {t('donations_community_eyebrow')}
            </Typography>
            <Typography variant="h3" sx={{ mt: 1 }}>
              {t('donations_recent_title')}
            </Typography>
            <Typography sx={{ mt: 1.5, color: 'text.secondary' }}>
              {t('donations_recent_subtitle')}
            </Typography>
          </Stack>

          {contributionsError ? (
            <Card sx={{ p: 3, textAlign: 'center', color: 'error.main' }}>
              {t('donations_list_error')}
            </Card>
          ) : (
            <DonationContributionsList
              contributions={contributions}
              loading={contributionsLoading}
            />
          )}
        </Container>
      </Box>

      <Box
        component="footer"
        sx={{ py: 4, borderTop: (theme) => `1px solid ${theme.vars.palette.divider}` }}
      >
        <Container maxWidth="lg">
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <Logo href="/" />
            <Typography variant="body2" sx={{ color: 'text.secondary', textAlign: 'center' }}>
              {t('donations_footer')}
            </Typography>
            <Button
              color="inherit"
              href={paths.publicTournaments.root}
              endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
            >
              {t('nav_live_tournaments')}
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
