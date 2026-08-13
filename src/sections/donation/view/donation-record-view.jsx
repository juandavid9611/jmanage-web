import { useTranslation } from 'react-i18next';

import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetDonationContributions } from 'src/actions/donation';

import { Iconify } from 'src/components/iconify';
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
        action={
          <Button
            variant="soft"
            color="inherit"
            href={paths.publicDonations.root}
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<Iconify icon="solar:external-link-outline" />}
          >
            {t('donations_public_campaign')}
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack spacing={3}>
        <DonationNewForm />
        <DonationContributionsList contributions={contributions} loading={contributionsLoading} />
      </Stack>
    </DashboardContent>
  );
}
