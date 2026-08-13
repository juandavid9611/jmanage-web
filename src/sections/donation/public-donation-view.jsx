import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { fCurrency } from 'src/utils/format-number';

import { useGetDonationSummary, useGetDonationContributions } from 'src/actions/donation';

import { LandingNav } from 'src/sections/landing/landing-nav';

import { DonationContributionsList } from './donation-contributions-list';

export function PublicDonationView() {
  const { t } = useTranslation();
  const { totalAmountCop, contributionCount, summaryLoading, summaryError } =
    useGetDonationSummary();
  const { contributions, contributionsLoading, contributionsError } =
    useGetDonationContributions(20);

  return (
    <>
      <LandingNav basePath="/" />
      <Container maxWidth="lg" sx={{ pt: { xs: 12, md: 14 }, pb: { xs: 6, md: 8 } }}>
        <Stack spacing={1} sx={{ mb: { xs: 3, md: 5 }, textAlign: 'center' }}>
          <Typography variant="h3">{t('donations_campaign_title')}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>
            {t('donations_campaign_subtitle')}
          </Typography>
        </Stack>

        <Card sx={{ p: 5, mb: 5, textAlign: 'center' }}>
          {summaryLoading ? (
            <CircularProgress />
          ) : summaryError ? (
            <Typography variant="body1" sx={{ color: 'error.main' }}>
              {t('donations_summary_error')}
            </Typography>
          ) : (
            <>
              <Typography variant="h1">{fCurrency(totalAmountCop, { currency: 'COP' })}</Typography>
              <Typography variant="subtitle1" sx={{ color: 'text.secondary', mt: 1 }}>
                {t('donations_contributions_count', { count: contributionCount })}
              </Typography>
            </>
          )}
        </Card>

        <Typography variant="h5" sx={{ mb: 2 }}>
          {t('donations_recent_title')}
        </Typography>

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
    </>
  );
}
