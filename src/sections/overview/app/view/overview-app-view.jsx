import OneSignal from 'react-onesignal';
import { useRef, useState, useEffect, useCallback } from 'react';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { orderBy } from 'src/utils/helper';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';
import {
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
import { Wrap2025Widget } from '../wrap-2025-widget';
import { CourseWidgetSummary } from '../course-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { t } = useTranslate();
  const theme = useTheme();

  const { user } = useAuthContext();
  const { selectedWorkspace } = useWorkspace();

  const { paymentRequests } = useGetPaymentRequestsByUser(user.id);
  const { stadistics } = useGetUserAssistsStats() || [];
  const { events } = useGetEvents(selectedWorkspace);
  const { topGoalsAndAssists } = useGetTopGoalsAndAssists(selectedWorkspace);

  const pendingOrOverduePaymentRequests = paymentRequests?.filter(
    (request) => request.status === 'pending' || request.status === 'overdue'
  );

  // ---- OneSignal state/refs -------------------------------------------------

  const onesignalInited = useRef(false);
  const [isOneSignalReady, setOneSignalReady] = useState(false);

  // Ask browser for push permission with a user action or soft prompt
  const askForNotificationPermission = useCallback(async () => {
    try {
      const hasPermission = OneSignal.Notifications.permission;

      // Case 1: already allowed
      if (hasPermission) {
        console.log('✅ Already allowed, nothing to do');
        return;
      }

      // Case 2: blocked
      // We can't recover from "blocked" in code. We need to instruct the user.
      const blocked = !hasPermission && Notification.permission === 'denied';
      // Browser's native state: "default" | "granted" | "denied"
      // If it's "denied", it's hard blocked by the browser.

      if (blocked) {
        alert(
          'Las notificaciones están bloqueadas para este sitio.\n\n' +
            'Por favor habilítalas manualmente en los permisos del navegador:\n' +
            '🔒 Icono de candado -> Permisos -> Notificaciones -> Permitir'
        );
        return;
      }

      // Case 3: not decided yet ("default")
      // Now we can try to prompt
      const wantsNotifications = window.confirm(
        '¿Quieres recibir notificaciones? (cambios de horario, pagos pendientes, etc.)'
      );

      if (wantsNotifications) {
        await OneSignal.Notifications.requestPermission();
        console.log(
          '📲 After requestPermission, permission =',
          OneSignal.Notifications.permission,
          'native =',
          Notification.permission
        );
      }
    } catch (err) {
      console.error('⚠️ requestPermission error:', err);
    }
  }, []);

  // Init OneSignal once
  useEffect(() => {
    if (onesignalInited.current) return;
    onesignalInited.current = true;

    // Only run on client
    if (typeof window === 'undefined') return;

    OneSignal.init({
      appId: 'eeffeafb-7f76-4691-a447-9e3565549a69',

      // allow localhost HTTP during dev
      allowLocalhostAsSecureOrigin: true,

      // SERVICE WORKER SETUP:
      // Make sure this file actually exists at /onesignal/OneSignalSDKWorker.js
      // and imports the v16 sw code.
      serviceWorkerPath: 'onesignal/OneSignalSDKWorker.js',
      serviceWorkerParam: { scope: '/onesignal/' },

      // Built-in bell/subscribe button from OneSignal
      notifyButton: { enable: true },
    })
      .then(() => {
        console.log('✅ OneSignal initialized');
        setOneSignalReady(true);
      })
      .catch((e) => console.error('❌ OneSignal init failed', e));
  }, []);

  // Login user in OneSignal and listen for subscription changes
  useEffect(() => {
    if (!isOneSignalReady) return;
    if (!user?.email) return;
    if (typeof window === 'undefined') return;

    let cancelled = false;

    async function linkUser() {
      try {
        // Associate this browser session with your platform user
        await OneSignal.login(user.email);
        console.log('🔐 login() resolved for', user.email);

        // Handler that fires whenever OneSignal finalizes/mutates the user object
        const handleUserChange = () => {
          if (cancelled) return;

          const osId = OneSignal.User.onesignalId;
          const { externalId } = OneSignal.User;
          const sub = OneSignal.User.PushSubscription;
          const subscriptionId = sub?.id;
          const optedIn = sub?.optedIn;

          console.log('📣 OneSignal User change');
          console.log('   onesignalId:', osId); // internal OneSignal user ID
          console.log('   externalId:', externalId); // should match user.email
          console.log('   push sub id:', subscriptionId); // use this with include_subscription_ids
          console.log('   optedIn:', optedIn); // true if we can actually send push

          // Optional: if not opted in yet, we can nudge for permission.
          if (!optedIn) {
            // We don't auto spam them, but we *could* ask here.
            // comment/uncomment to taste:
            askForNotificationPermission();
          }

          // TODO: you can POST { osId, subscriptionId } to your backend here
          // so your backend can later send targeted notifications.
        };

        // Attach listener
        OneSignal.User.addEventListener('change', handleUserChange);

        // Call once immediately in case the user is already "ready"
        handleUserChange();

        // Cleanup: remove listener on unmount or deps change
        return () => {
          cancelled = true;
          OneSignal.User.removeEventListener('change', handleUserChange);
        };
      } catch (err) {
        console.error('Login error', err);
        return undefined;
      }
    }

    const cleanupPromise = linkUser();

    // run returned cleanup if linkUser resolved with one
  }, [isOneSignalReady, user?.email, askForNotificationPermission]);

  // You will call OneSignal.logout() yourself when the real app user logs out.
  // NOT in an effect cleanup, otherwise dev hot reload and route changes kill the session.

  // ----------------------------------------------------------------------

  return (
    <DashboardContent maxWidth="xl">
      <Grid container spacing={3}>
        {/* Welcome / hero */}
        <Grid xs={12} md={6}>
          <AppWelcome
            title={`${t('welcome_back')} ${user?.displayName}`}
            description={t('we_re_vittoria')}
          />
        </Grid>

        {/* Pending / overdue payments */}
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

        {/* Next events + upload voucher */}
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <Wrap2025Widget list={stadistics} user={user} />
            <NextEvents title={t('next_events')} list={events} />
            <FileUpgrade userId={user.id} />
          </Box>
        </Grid>

        {/* Featured content + stats */}
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
