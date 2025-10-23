import OneSignal from 'react-onesignal';
import { useRef, useState, useEffect } from 'react';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { orderBy } from 'src/utils/helper';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';
import {
  useGetLateArrives,
  useGetUserMetrics,
  useGetUserAssistsStats,
  useGetTopGoalsAndAssists,
} from 'src/actions/user';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { NextEvents } from '../next-events';
import { AppFeatured } from '../app-featured';
import { FileUpgrade } from '../file-upgrade';
import { AppTopAuthors } from '../app-top-authors';
import { AppNewInvoice } from '../app-new-invoice';
import { CourseWidgetSummary } from '../course-widget-summary';

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
  const { stadistics } = useGetUserAssistsStats() || [];

  const { events } = useGetEvents(selectedWorkspace);
  const { topGoalsAndAssists } = useGetTopGoalsAndAssists(selectedWorkspace);

  const isAdmin = user?.role === 'admin';

  const theme = useTheme();
  const onesignalInited = useRef(false);
  const [isOneSignalReady, setOneSignalReady] = useState(false);

  useEffect(() => {
    if (onesignalInited.current) return;
    onesignalInited.current = true;

    OneSignal.init({
      appId: 'b25d699b-e3dc-4977-9ac2-c261eafd928d',
      safari_web_id: 'web.onesignal.auto.5d035d80-811e-4f05-a17d-f7e13950e2b6',
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/onesignal/' },
      notifyButton: { enable: true },
    })
      .then(() => {
        console.log('✅ OneSignal initialized');
        setOneSignalReady(true);
      })
      .catch((e) => console.error('❌ OneSignal init failed', e));
  }, []);

  // Link logged user to OneSignal (use email or your user.id)
  useEffect(() => {
    if (!isOneSignalReady || !user?.email) return undefined;

    OneSignal.login(user.email)
      .then(async () => console.log('User logged into OneSignal', await OneSignal.User.onesignalId))
      .catch((err) => console.error('Login error', err));

    return () => {
      OneSignal.logout();
    };
  }, [isOneSignalReady, user?.email]);

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        <Grid xs={12} md={6}>
          <AppWelcome
            title={`${t('welcome_back')} ${user?.displayName}`}
            description={t('we_re_vittoria')}
            img={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={6}>
          <AppNewInvoice
            title="Pagos pendientes o vencidos"
            tableData={pendingOrOverduePaymentRequests}
            headLabel={[
              { id: 'status', label: 'Estado' },
              { id: 'totalAmount', label: 'Monto' },
              { id: 'concept', label: 'Concepto' },
              { id: 'dueDate', label: 'Vencimiento' },
              { id: 'id', label: 'ID Pago' },
            ]}
          />
        </Grid>

        <Grid xs={12} md={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <NextEvents title={t('next_events')} list={events} />
            <FileUpgrade userId={user.id} />
          </Box>
        </Grid>

        <Grid xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AppFeatured list={_appFeatured} />
            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <CourseWidgetSummary title="Puntos llegadas tarde" list={stadistics} />
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
