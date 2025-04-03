import { useEffect } from 'react';
import { WebPushClient, registerServiceWorker } from '@magicbell/webpush';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { orderBy } from 'src/utils/helper';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/config-global';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';
import { useGetLateArrives, useGetUserMetrics, useGetTopGoalsAndAssists } from 'src/actions/user';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { NextEvents } from '../next-events';
import { AppFeatured } from '../app-featured';
import { FileUpgrade } from '../file-upgrade';
import { AppTopAuthors } from '../app-top-authors';
import { AppNewInvoice } from '../app-new-invoice';
import { CourseWidgetSummary } from '../course-widget-summary';

registerServiceWorker('/sw.js');

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const { metrics } = useGetUserMetrics(user?.id);

  const { paymentRequests } = useGetPaymentRequestsByUser(user.id);

  const pendingOrOverduePaymentRequests = paymentRequests?.filter(
    (request) => request.status === 'pending' || request.status === 'overdue'
  );
  const { selectedWorkspace } = useWorkspace();

  const { lateArrives } = useGetLateArrives(user?.id);

  const { events } = useGetEvents(selectedWorkspace);
  const { topGoalsAndAssists } = useGetTopGoalsAndAssists(selectedWorkspace);

  const isAdmin = user?.role === 'admin';

  const theme = useTheme();

  registerServiceWorker('/sw.js');

  useEffect(() => {
    (async () => {
      const client = new WebPushClient({
        apiKey: CONFIG.site.magicBellApiKey,
        userEmail: user.email,
      });
      const isSubscribed = await client.isSubscribed();
      if (!isSubscribed) {
        await client.subscribe();
      }
    })();
  }, [user.email]);

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`${t('welcome_back')} ${user?.displayName}`}
            description={t('we_re_vittoria')}
            img={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>

        <Grid xs={12} md={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <NextEvents title={t('next_events')} list={events} />
            <FileUpgrade userId={user.id} />
          </Box>
        </Grid>

        <Grid xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AppNewInvoice
              title="Pagos pendientes o vencidos"
              tableData={pendingOrOverduePaymentRequests?.slice(0, 5)}
              headLabel={[
                { id: 'id', label: 'ID Pago' },
                { id: 'concept', label: 'Concepto' },
                { id: 'totalAmount', label: 'Monto' },
                { id: 'status', label: 'Estado' },
                { id: 'dueDate', label: 'Vencimiento' },
              ]}
            />
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <CourseWidgetSummary
                  title="Puntos llegadas tarde"
                  total={lateArrives?.[0]?.rating ?? 0}
                  color="secondary"
                  icon={`${CONFIG.site.basePath}/assets/icons/courses/ic-courses-completed.svg`}
                />
              </Grid>

              <Grid xs={12} md={6}>
                <AppTopAuthors
                  title={`${t('goals_and_assits')} ${selectedWorkspace?.name}`}
                  list={orderBy(topGoalsAndAssists, ['goals'], ['desc']).slice(0, 3)}
                />
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
