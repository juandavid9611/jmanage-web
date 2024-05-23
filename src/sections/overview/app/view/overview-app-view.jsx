import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { useAuthContext } from 'src/auth/hooks';
import { useGetEvents } from 'src/api/calendar';
import { SeoIllustration } from 'src/assets/illustrations';
import { useGetLateArrives, useGetUserMetrics } from 'src/api/user';

import { useSettingsContext } from 'src/components/settings';

import AppWelcome from '../app-welcome';
import AppFeatured from '../app-featured';
import AppTopAuthors from '../app-top-authors';
import MetricProgress from '../metric-progress';
import MetricTotalWidget from '../metric-total-widget';
import LateArrivesReviews from '../late-arrives-reviews';
import AnalyticsOrderTimeline from '../analytics-order-timeline';

// ----------------------------------------------------------------------

export default function OverviewAppView() {
  const { t } = useTranslate();
  const { user } = useAuthContext();

  const settings = useSettingsContext();

  const { metrics } = useGetUserMetrics(user?.id);

  const { lateArrives } = useGetLateArrives(user?.id);

  const groupLateArrives = lateArrives.filter((item) => item.group === user.group);

  const { events } = useGetEvents();

  const isAdmin = user?.role === 'admin';

  const masc_goals_and_assits = [
    {
      name: 'Santiago Lozano',
      goals: 3,
      assists: 0,
      avatarUrl: '/assets/images/avatar/masc_1.jpg',
    },
    {
      name: 'Cristian Medina',
      goals: 3,
      assists: 0,
      avatarUrl: '/assets/images/avatar/masc_2.jpg',
    },
    {
      name: 'Daniel Rodriguez',
      goals: 2,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_3.jpg',
    },
    {
      name: 'Abdulh Daza',
      goals: 2,
      assists: 3,
      avatarUrl: '/assets/images/avatar/masc_4.jpg',
    },
    { name: 'Julio Mejia', goals: 2, assists: 1, avatarUrl: '/assets/images/avatar/masc_5.jpg' },
    {
      name: 'Alejandro Archila',
      goals: 2,
      assists: 0,
      avatarUrl: '/assets/images/avatar/masc_3.jpg',
    },
    { name: 'Felipe Morales', goals: 2, assists: 0, avatarUrl: '/assets/images/avatar/masc_6.jpg' },
    {
      name: 'Adrian Villalba',
      goals: 1,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_7.jpg',
    },
    {
      name: 'Cristian Gomez',
      goals: 1,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_8.jpg',
    },
    {
      name: 'Diego Herrera',
      goals: 1,
      assists: 0,
      avatarUrl: '/assets/images/avatar/masc_9.jpg',
    },
    {
      name: 'Leonardo Triviño',
      goals: 1,
      assists: 0,
      avatarUrl: '/assets/images/avatar/masc_10.jpg',
    },
    {
      name: 'Jonathan Mindiola',
      goals: 0,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_11.jpg',
    },
    {
      name: 'Cristian Lozano',
      goals: 0,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_1.jpg',
    },
    { name: 'Juan Alarcon', goals: 0, assists: 1, avatarUrl: '/assets/images/avatar/masc_2.jpg' },
    {
      name: 'Santiago Motta',
      goals: 0,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_3.jpg',
    },
    {
      name: 'Luis Garcia',
      goals: 0,
      assists: 1,
      avatarUrl: '/assets/images/avatar/masc_4.jpg',
    },
  ];

  const fem_goals_and_assits = [
    {
      name: 'Estefania Losada',
      goals: 2,
      assists: 1,
      avatarUrl: '/assets/images/avatar/fem_1.jpg',
    },
    { name: 'Laura Gomez', goals: 1, assists: 0, avatarUrl: '/assets/images/avatar/fem_2.jpg' },
    {
      name: 'Luisa Pineda',
      goals: 1,
      assists: 0,
      avatarUrl: '/assets/images/avatar/fem_3.jpg',
    },
    {
      name: 'Valentina Bello',
      goals: 1,
      assists: 0,
      avatarUrl: '/assets/images/avatar/fem_1.jpg',
    },
    { name: 'Tatiana Montoya', goals: 0, assists: 2, avatarUrl: '/assets/images/avatar/fem_2.jpg' },
  ];

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
        <Grid xs={12} md={4}>
          <MetricProgress
            title="Progreso"
            subheader={`Última actualización: ${formatDateTime(metrics?.last_update)}`}
            data={getMetricsProgress(metrics)}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <LateArrivesReviews
            title="Jugadores con llegadas tarde"
            playersList={isAdmin ? lateArrives : groupLateArrives}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <AnalyticsOrderTimeline title={t('next_events')} list={events} />
        </Grid>

        <Grid xs={12} md={4}>
          <AppTopAuthors
            title={`${t('goals_and_assits')} 2024 Masculino`}
            subheader={t('goals_and_assists_subheader')}
            list={masc_goals_and_assits}
          />
        </Grid>
        <Grid xs={12} md={4}>
          <AppTopAuthors
            title={`${t('goals_and_assits')} 2024 Femenino`}
            subheader={t('goals_and_assists_subheader')}
            list={fem_goals_and_assits}
          />
        </Grid>
      </Grid>
    </Container>
  );
}
