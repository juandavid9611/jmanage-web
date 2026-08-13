import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDonationContributions } from 'src/actions/donation';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { DonationNewForm } from '../donation-new-form';
import { DonationContributionsList } from '../donation-contributions-list';

export function DonationRecordView() {
  const { t } = useTranslation();
  const { contributions, contributionsLoading } = useGetDonationContributions(20);

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={t('donations_campaign_title')}
        links={[
          { name: t('app'), href: paths.dashboard.root },
          { name: t('donations_campaign_title'), href: paths.dashboard.donations.root },
        ]}
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <DonationNewForm />
        <DonationContributionsList contributions={contributions} loading={contributionsLoading} />
      </Stack>
    </DashboardContent>
  );
}
