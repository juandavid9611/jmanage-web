import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import { useGetEvents } from 'src/api/calendar';
import { useGetUserMetrics } from 'src/api/user';
import { _appAuthors, _appFeatured } from 'src/_mock';
import { SeoIllustration } from 'src/assets/illustrations';

import { useSettingsContext } from 'src/components/settings';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';
import MetricWidget from '../metric-widget';
import AppTopAuthors from '../app-top-authors';
import MetricTotalWidget from '../metric-total-widget';
import AnalyticsOrderTimeline from '../analytics-order-timeline';

// ----------------------------------------------------------------------

export default function OverviewAppView() {
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { metrics } = useGetUserMetrics(user?.id);

  const { events } = useGetEvents();

  function formatDateTime(datetimeString) {
    const dateTime = new Date(datetimeString);

    // Format date
    const formattedDate = dateTime.toLocaleDateString(); // Adjust options as needed

    // Format time
    const formattedTime = dateTime.toLocaleTimeString(undefined, { hour12: false });

    // Combine date, time, and milliseconds
    const formattedDateTime = `${formattedDate} ${formattedTime}`;

    return formattedDateTime;
  }

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
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

        <Grid container xs={12}>
          <Grid xs={12} md={4}>
            <MetricTotalWidget
              title={t('my_metrics')}
              subheader={`Última actualización: ${formatDateTime(metrics?.last_update)}`}
              chart={{
                series: [
                  { label: 'Earned Percentage', value: metrics?.total || 0 },
                  { label: 'Min beca', value: 100 - (metrics?.total || 0) },
                ],
              }}
            />
          </Grid>
          <Grid xs={12} md={8}>
            <Grid>
              <MetricWidget
                chart={{
                  series: [
                    {
                      label: 'Puntualidad en pagos',
                      percent: metrics?.puntualidad_pagos || 0,
                      total: 40,
                    },
                    {
                      label: 'Asistencia Entrenos',
                      percent: metrics?.asistencia_entrenos || 0,
                      total: 25,
                    },
                  ],
                }}
              />
              <MetricWidget
                chart={{
                  series: [
                    { label: 'Llegadas tarde', percent: metrics?.llegadas_tarde || 0, total: 10 },
                    {
                      label: 'Asistencias a partidos',
                      percent: metrics?.asistencia_partidos || 0,
                      total: 5,
                    },
                  ],
                }}
              />
              <MetricWidget
                chart={{
                  series: [
                    { label: 'Deuda Acumulada', percent: metrics?.deuda_acumulada || 0, total: 20 },
                  ],
                }}
              />
            </Grid>
            <Grid xs={12} md={6} marginTop={2}>
              <AnalyticsOrderTimeline title={t('next_events')} list={events} />
            </Grid>
          </Grid>
        </Grid>

        <Grid container xs={12} md={4}>
          <Grid xs={12}>
            <AppTopAuthors title={`${t('goals_and_assits')} 2024`} subheader={t('goals_and_assists_subheader')} list={_appAuthors}/>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
