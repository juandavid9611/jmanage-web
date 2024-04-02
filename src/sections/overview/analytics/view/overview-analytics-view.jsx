import { useTheme } from '@emotion/react';

import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { useAuthContext } from 'src/auth/hooks';
import { MaintenanceIllustration } from 'src/assets/illustrations';
import SeoIllustration from 'src/assets/illustrations/seo-illustration';
import MotivationIllustration from 'src/assets/illustrations/motivation-illustration';
import ComingSoonIllustration from 'src/assets/illustrations/coming-soon-illustration';

import { useSettingsContext } from 'src/components/settings';

import ValueWidgetSummary from '../value-widget-summary';
import AnalyticsPartidos from '../analytics-website-visits';
import AnalyticsConversionRates from '../analytics-conversion-rates';

// ----------------------------------------------------------------------

export default function OverviewAnalyticsView() {
  const theme = useTheme();
  const settings = useSettingsContext();
  const { user } = useAuthContext();
  console.log(user);
  const isAdmin = user?.role === 'admin';
  const isFem = user?.myUser.group === 'female';

  const mascCategories = ['Pescara FC', 'Albalon FC', 'Deportivo AZ', 'Curramba FC'];
  const femCategories = ['Funcode FC', 'Mambe FC', 'Sabana SC', 'Forta FC'];
  const mascSeries = [
    {
      type: 'Fase Ofensiva',
      data: [
        {
          name: 'Remates totales',
          data: [14, 9, 5, 15],
        },
        {
          name: 'Remates a puerta',
          data: [8, 5, 4, 7],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [61, 68, 44, 66],
        },
        {
          name: 'Recuperaciones',
          data: [1, 4, 64, 3],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [275, 154, 359, 267],
        },
        {
          name: 'Pases completados',
          data: [232, 113, 298, 234],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [73, 64, 83, 75],
        },
      ],
    },
  ];
  const femSeries = [
    {
      type: 'Fase Ofensiva',
      data: [
        {
          name: 'Remates totales',
          data: [3, 5, 7, 11],
        },
        {
          name: 'Remates a puerta',
          data: [3, 1, 6, 6],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [62, 58, 49, 57],
        },
        {
          name: 'Recuperaciones',
          data: [4, 6, 3, 1],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [138, 102, 104, 181],
        },
        {
          name: 'Pases completados',
          data: [97, 69, 67, 131],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [44, 36, 54, 53],
        },
      ],
    },
  ]
  const mascMinutos = [
    { label: 'Cristian Gomez', value: 270 },
    { label: 'Adrian Villalba', value: 264 },
    { label: 'Juan Quilaguy', value: 257 },
    { label: 'Santiago Motta', value: 250 },
    { label: 'Leonardo Triviño', value: 246 },
    { label: 'Julio Mejia', value: 245 },
    { label: 'William Cabrera', value: 225 },
    { label: 'Jonathan Mindiola', value: 210 },
    { label: 'David Reina', value: 207 },
    { label: 'Cristian Medina', value: 170 },
    { label: 'Alejandro Archila', value: 150 },
    { label: 'Juan Alarcon', value: 130 },
    { label: 'Cristian Lozano', value: 110 },
    { label: 'Felipe Morales', value: 101 },
    { label: 'Santiago Lozano', value: 98 },
    { label: 'Nicolas Gomez', value: 90 },
    { label: 'Diego Rincon', value: 90 },
    { label: 'Pablo Salamanca', value: 83 },
    { label: 'Andres Zuñiga', value: 76 },
    { label: 'Roberto Moralez', value: 73 },
    { label: 'Abdulh Daza', value: 65 },
    { label: 'Willmis Gonzalez', value: 27 },
    { label: 'Camilo Arango', value: 14 },
    { label: 'Carlos Castellanos', value: 8 },
  ];

  const femMinutos = [
    { label: 'Luisa Pineda', value: 236 },
    { label: 'Tatiana Montoya', value: 207 },
    { label: 'Valentina Suarez', value: 180 },
    { label: 'Monica Pacheco', value: 176 },
    { label: 'Armas De Alison', value: 173 },
    { label: 'Valentina Garcia', value: 171 },
    { label: 'Laura Gomez', value: 154 },
    { label: 'Valentina Bello', value: 151 },
    { label: 'Valentina Murillo', value: 145 },
    { label: 'Sofia Cordoba', value: 90 },
    { label: 'Juliana Castillo', value: 74 },
    { label: 'Paula Sierra', value: 74 },
    { label: 'Estefania Losada', value: 70 },
    { label: 'Karen Chaves', value: 67 },
    { label: 'Camila Chiquiza', value: 52 },
    { label: 'Maria Guerra', value: 30 },
    { label: 'Paola Garzon', value: 29 },
    { label: 'Camila Amador', value: 26 },
    { label: 'Maria Pertuz', value: 20 },
    { label: 'Alejandra Rojas', value: 15 },
    { label: 'Lady Sanchez', value: 12 },
    { label: 'Cristina Perez', value: 8 },
  ];

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        Conoce tu rendimiento y mejora continuamente 👋
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 5,
        }}
      >
        Conoce más en nuestra plataforma especializada <a href="https://lookerstudio.google.com/u/0/reporting/bb0f5ac2-0bf0-4807-8ed5-0dac04e4ff06" target="_blank" rel="noopener noreferrer">Aqui</a>
        </Typography>
        

      <Grid container spacing={3}>
      <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Partidos jugados"
            total={isFem ? 4:4}
            icon={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles a favor" total={isFem ? 2:8} icon={<MotivationIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles en contra" total={isFem ? 12:4} icon={<ComingSoonIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Diferencia de Goles" total={isFem ? -10:4} icon={<MaintenanceIllustration />} />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsPartidos
            title="Rendimiento en partidos"
            subheader="Ultima actualización: 2 Abril 2024"
            chart={{
              colors: [theme.palette.primary.main, theme.palette.error.light, theme.palette.warning.main, theme.palette.success.main],
              categories: isFem ? femCategories : mascCategories,
              series: isFem ? femSeries : mascSeries,
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsConversionRates
            title="Minutos en partidos"
            chart={{
              series: isFem ? femMinutos : mascMinutos,
            }}
          />
        </Grid>
      </Grid>
      {isAdmin && (
      <Grid container spacing={3}>
      <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Partidos jugados"
            total={!isFem ? 4:4}
            icon={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles a favor" total={!isFem ? 2:8} icon={<MotivationIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles en contra" total={!isFem ? 12:4} icon={<ComingSoonIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Diferencia de Goles" total={!isFem ? -10:4} icon={<MaintenanceIllustration />} />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsPartidos
            title="Rendimiento en partidos"
            subheader="Ultima actualización: 2 Abril 2024"
            chart={{
              colors: [theme.palette.primary.main, theme.palette.error.light, theme.palette.warning.main, theme.palette.success.main],
              categories: !isFem ? femCategories : mascCategories,
              series: !isFem ? femSeries : mascSeries,
            }}
          />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsConversionRates
            title="Minutos en partidos"
            chart={{
              series: !isFem ? femMinutos : mascMinutos,
            }}
          />
        </Grid>
      </Grid>)}
    </Container>
  );
}
