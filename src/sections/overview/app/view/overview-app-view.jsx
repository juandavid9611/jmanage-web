import { useState, useEffect } from 'react';
import { WebPushClient, registerServiceWorker } from '@magicbell/webpush';

import { Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { orderBy } from 'src/utils/helper';
import { fDateTime } from 'src/utils/format-time';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { CONFIG } from 'src/config-global';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { SeoIllustration } from 'src/assets/illustrations';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetLateArrives, useGetUserMetrics, get_top_goals_and_assists } from 'src/actions/user';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { NextEvents } from '../next-events';
import { AppFeatured } from '../app-featured';
import { AppTopAuthors } from '../app-top-authors';
import { MetricProgress } from '../metric-progress';
import { MetricsOverview } from '../metrics-overview';
import { CourseWidgetSummary } from '../course-widget-summary';

registerServiceWorker('/sw.js');

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const { metrics } = useGetUserMetrics(user?.id);

  const { selectedWorkspace } = useWorkspace();

  const { lateArrives } = useGetLateArrives(user?.id);

  const { events } = useGetEvents(selectedWorkspace);

  const isAdmin = user?.role === 'admin';

  const theme = useTheme();

  const [status, setStatus] = useState('not yet');

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

  function getMetricsProgress(metricsList) {
    return [
      {
        label: 'Puntualidad en pagos',
        percent: metricsList?.puntualidad_pagos || 0,
        total: 40,
        helpText:
          'Si el pago se realiza del 1-5 de cada mes 100%, del 6-10: 75%, del 11-28: 50%, >28: 25%, No pago: 0%',
      },
      {
        label: 'Asistencia Entrenos',
        percent: metricsList?.asistencia_entrenos || 0,
        total: 25,
        helpText:
          'Asistencias / Total de Entrenos Válidos. Los fallos se clasifican por lesión, trabajo o no asistencia',
      },
      {
        label: 'Deuda Acumulada',
        percent: metricsList?.deuda_acumulada || 0,
        total: 20,
        helpText:
          'Resultado de comparativo de deuda vs cobros totales por mes. Promedio semestral de calificaciones mensuales',
      },
      {
        label: 'Llegadas tarde',
        percent: metricsList?.llegadas_tarde || 0,
        total: 10,
        helpText: 'Se compara por jugador vs total de asistencia. 1 - Llegadas Tarde/Asistencias',
      },
      {
        label: 'Asistencias a partidos',
        percent: metricsList?.asistencia_partidos || 0,
        total: 5,
        helpText:
          'Los fallos se clasifican por lesión, trabajo o no asistencia. Se calcula como el #Asistencias / # Total de Partidos Válidos',
      },
    ];
  }

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

        {metrics?.total > 0 && (
          <Grid xs={12} md={4}>
            <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
              <MetricsOverview
                title={t('my_metrics')}
                subheader={`Última actualización: ${fDateTime(metrics?.last_update)}`}
                chart={{ series: metrics?.total || 0 }}
              />
              <MetricProgress
                title="Progreso"
                subheader={`Última actualización: ${fDateTime(metrics?.last_update)}`}
                data={getMetricsProgress(metrics)}
              />
            </Box>
          </Grid>
        )}

        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <NextEvents title={t('next_events')} list={events} />
            <CourseWidgetSummary
              title="Puntos llegadas tarde"
              total={lateArrives[0]?.rating || 0}
              color="secondary"
              icon={`${CONFIG.site.basePath}/assets/icons/courses/ic-courses-completed.svg`}
            />
          </Box>
        </Grid>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            {selectedWorkspace?.id === 'male' && (
              <AppTopAuthors
                title={`${t('goals_and_assits')} Masculino`}
                list={orderBy(get_top_goals_and_assists('masculino'), ['goals'], ['desc']).slice(
                  0,
                  3
                )}
              />
            )}
            {selectedWorkspace?.id === 'female' && (
              <AppTopAuthors
                title={`${t('goals_and_assits')} Femenino`}
                list={orderBy(get_top_goals_and_assists('femenino'), ['goals'], ['desc']).slice(
                  0,
                  3
                )}
              />
            )}
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
