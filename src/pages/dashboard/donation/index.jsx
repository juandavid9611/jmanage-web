import { Helmet } from 'react-helmet-async';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/config-global';

import { DonationRecordView } from 'src/sections/donation/view/donation-record-view';

import { useAuthContext } from 'src/auth/hooks';

export default function Page() {
  const { t } = useTranslation();
  const { user } = useAuthContext();
  const activeRole = user?.accountsRoles?.[user?.activeAccountId];
  const activeAccountType =
    user?.accounts?.[user?.activeAccountId]?.settings?.account_type ?? 'club';
  const metadata = {
    title: `${t('donations_campaign_title')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

  if (activeAccountType !== 'club' || activeRole !== 'admin') {
    return <Navigate to={paths.dashboard.root} replace />;
  }

  return (
    <>
      <Helmet>
        <title>{metadata.title}</title>
      </Helmet>
      <DonationRecordView />
    </>
  );
}
