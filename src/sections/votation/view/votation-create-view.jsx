import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';

import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { VotationWizard } from '../votation-wizard';

// ----------------------------------------------------------------------

export function VotationCreateView() {
  const { t } = useTranslation();
  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      <CustomBreadcrumbs
        heading={t('label_new_vote')}
        links={[
          { name: t('label_votations'), href: paths.dashboard.votaciones.root },
          { name: t('label_new_vote') },
        ]}
        sx={{ mb: { xs: 3, md: 5 }, px: { xs: 2, md: 3 }, pt: { xs: 2, md: 3 } }}
      />
      <VotationWizard />
    </DashboardContent>
  );
}
