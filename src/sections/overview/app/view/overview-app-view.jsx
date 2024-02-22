import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { useAuthContext } from 'src/auth/hooks';
import { useGetUserMetrics } from 'src/api/user';
import { SeoIllustration } from 'src/assets/illustrations';
import { _appAuthors, _appFeatured, _analyticOrderTimeline } from 'src/_mock';

import { useSettingsContext } from 'src/components/settings';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';
import MetricWidget from '../metric-widget';
import AppTopAuthors from '../app-top-authors';
import AppAreaInstalled from '../app-area-installed';
import MetricTotalWidget from '../metric-total-widget';
import AnalyticsOrderTimeline from '../analytics-order-timeline';

// ----------------------------------------------------------------------

export default function OverviewAppView() {
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { metrics } = useGetUserMetrics(user?.id);

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Grid container spacing={3}>
        <Grid xs={12} md={8}>
          <AppWelcome
            title={`Welcome back 👋 \n ${user?.displayName}`}
            description="If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything."
            img={<SeoIllustration />}
            action={
              <Button variant="contained" color="primary">
                Go Now
              </Button>
            }
          />
        </Grid>

        <Grid xs={12} md={4}>
          <AppFeatured list={_appFeatured} />
        </Grid>

        <Grid container xs={12}>
          <Grid xs={12} md={4}>
            <MetricTotalWidget
              title="Your Metrics"
              subheader={`Last date updated: ${metrics?.last_update}`}
              chart={{
                series: [
                  { label: 'Earned Percentage', value: metrics?.total },
                  { label: 'Available', value: 100 - (metrics?.total ?? 0) },
                ],
              }}
            />
          </Grid>
          <Grid xs={12} md={8}>
            <MetricWidget
              chart={{
                series: [
                  { label: 'Puntualidad en pagos', percent: metrics?.puntualidad_pagos, total: 40 },
                  {
                    label: 'Asistencia Entrenos',
                    percent: metrics?.asistencia_entrenos,
                    total: 25,
                  },
                ],
              }}
            />
            <MetricWidget
              chart={{
                series: [
                  { label: 'Llegadas tarde', percent: metrics?.llegadas_tarde, total: 10 },
                  {
                    label: 'Asistencias a partidos',
                    percent: metrics?.asistencia_partidos,
                    total: 5,
                  },
                ],
              }}
            />
            <MetricWidget
              chart={{
                series: [
                  { label: 'Deuda Acumulada', percent: metrics?.deuda_acumulada, total: 20 },
                ],
              }}
            />
          </Grid>
        </Grid>

        <Grid container xs={12} md={8}>
          <Grid xs={12}>
            <AppAreaInstalled
              title="Our Performance"
              subheader="(+43%) than last year"
              chart={{
                categories: [
                  'Jan',
                  'Feb',
                  'Mar',
                  'Apr',
                  'May',
                  'Jun',
                  'Jul',
                  'Aug',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Dec',
                ],
                series: [
                  {
                    year: '2019',
                    data: [
                      {
                        name: 'Torneo Los Suarez',
                        data: [10, 41, 35, 51, 49, 62, 69, 91, 148, 35, 51, 49],
                      },
                      {
                        name: 'Torneo Bogolta',
                        data: [10, 34, 13, 56, 77, 88, 99, 77, 45, 13, 56, 77],
                      },
                    ],
                  },
                  {
                    year: '2020',
                    data: [
                      {
                        name: 'Torneo Los Suarez',
                        data: [51, 35, 41, 10, 91, 69, 62, 148, 91, 69, 62, 49],
                      },
                      {
                        name: 'Torneo Bogolta',
                        data: [56, 13, 34, 10, 77, 99, 88, 45, 77, 99, 88, 77],
                      },
                    ],
                  },
                ],
              }}
            />
          </Grid>

          <Grid xs={12} md={6}>
            <AnalyticsOrderTimeline title="Next Events" list={_analyticOrderTimeline} />
          </Grid>
        </Grid>

        <Grid container xs={12} md={4}>
          <Grid xs={12}>
            <AppTopAuthors title="Goals and Assists 2023" list={_appAuthors} />
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
}
