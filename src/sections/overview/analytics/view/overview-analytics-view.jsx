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
  const isAdmin = user?.role === 'admin';
  const isFem = user?.myUser.group === 'female';

  const mascCategories = ['Pescara FC', 'Albalon FC', 'Deportivo AZ', 'Curramba FC', 'Canterbury FC'];
  const femCategories = ['Funcode FC', 'Mambe FC', 'Sabana SC', 'Forta FC', 'Joga Bonito'];
  const mascSeries = [
    {
      type: 'Fase Ofensiva',
      data: [
        {
          name: 'Remates totales',
          data: [14, 9, 5, 15, 16],
        },
        {
          name: 'Remates a puerta',
          data: [8, 5, 4, 7, 10],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [61, 68, 44, 66, 71],
        },
        {
          name: 'Recuperaciones',
          data: [1, 4, 64, 3, 3],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [275, 154, 359, 267, 261],
        },
        {
          name: 'Pases completados',
          data: [232, 113, 298, 234, 216],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [73, 64, 83, 75, 68],
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
          data: [3, 5, 7, 11, 3],
        },
        {
          name: 'Remates a puerta',
          data: [3, 1, 6, 6, 2],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [62, 58, 49, 57, 58],
        },
        {
          name: 'Recuperaciones',
          data: [4, 6, 3, 1, 5],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [138, 102, 104, 181, 78],
        },
        {
          name: 'Pases completados',
          data: [97, 69, 67, 131, 45],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [44, 36, 54, 53, 23],
        },
      ],
    },
  ]
  const mascMinutos = [
    { label: 'Adrian Villalba', value: 359 },
    { label: 'Juan Quilaguy', value: 352 },
    { label: 'Santiago Motta', value: 345 },
    { label: 'Cristian Gomez', value: 340 },
    { label: 'Julio Mejia', value: 298 },
    { label: 'Leonardo Triviño', value: 246 },
    { label: 'Cristian Medina', value: 242 },
    { label: 'William Cabrera', value: 225 },
    { label: 'Juan Alarcon', value: 212 },
    { label: 'Jonathan Mindiola', value: 210 },
    { label: 'David Reina', value: 207 },
    { label: 'Alejandro Archila', value: 195 },
    { label: 'Nicolas Gomez', value: 185 },
    { label: 'Cristian Lozano', value: 152 },
    { label: 'Abdulh Daza', value: 126 },
    { label: 'Pablo Salamanca', value: 106 },
    { label: 'Felipe Morales', value: 101 },
    { label: 'Santiago Lozano', value: 98 },
    { label: 'Diego Rincon', value: 90 },
    { label: 'Camilo Arango', value: 83 },
    { label: 'Andres Zuñiga', value: 76 },
    { label: 'Roberto Moralez', value: 73 },
    { label: 'Wilmis Gonzalez', value: 61 },
    { label: 'Jorge Carrasco', value: 50 },
    { label: 'Herrera Diego', value: 25 },
    { label: 'Garcia Luis', value: 18 },
    { label: 'Carlos Castellanos', value: 8 },
  ];

  const femMinutos = [
    { label: 'Luisa Pineda', value: 278 },
    { label: 'Tatiana Montoya', value: 247 },
    { label: 'Valentina Suarez', value: 240 },
    { label: 'Monica Pacheco', value: 229 },
    { label: 'Valentina Garcia', value: 206 },
    { label: 'Valentina Bello', value: 198 },
    { label: 'Valentina Murillo', value: 189 },
    { label: 'Laura Gomez', value: 181 },
    { label: 'Alison De Armas', value: 173 },
    { label: 'Juliana Castillo', value: 134 },
    { label: 'Karen Chaves', value: 127 },
    { label: 'Sofia Cordoba', value: 103 },
    { label: 'Estefania Losada', value: 90 },
    { label: 'Camila Chiquiza', value: 76 },
    { label: 'Paula Sierra', value: 74 },
    { label: 'Maria Pertuz', value: 43 },
    { label: 'Maria Guerra', value: 30 },
    { label: 'Paola Garzon', value: 29 },
    { label: 'Camila Amador', value: 26 },
    { label: 'Alejandra Rojas', value: 15 },
    { label: 'Lady Sanchez', value: 12 },
    { label: 'Cristina Perez', value: 12 },
  ];

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        Conoce tu rendimiento y mejora continuamente 👋 <a href="https://lookerstudio.google.com/u/0/reporting/bb0f5ac2-0bf0-4807-8ed5-0dac04e4ff06" target="_blank" rel="noopener noreferrer">Looker Studio</a>
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 5,
        }}
      >
        Conoce tus estadísticas y mejora tu rendimiento continuamente.
        </Typography>
        

      <Grid container spacing={3}>
      <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Partidos jugados"
            total={isFem ? 5:5}
            icon={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles a favor" total={isFem ? 2:11} icon={<MotivationIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles en contra" total={isFem ? 15:6} icon={<ComingSoonIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Diferencia de Goles" total={isFem ? -13:5} icon={<MaintenanceIllustration />} />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsPartidos
            title="Rendimiento en partidos"
            subheader="Ultima actualización: 8 Abril 2024"
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
            total={!isFem ? 5:5}
            icon={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles a favor" total={!isFem ? 2:11} icon={<MotivationIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Goles en contra" total={!isFem ? 15:6} icon={<ComingSoonIllustration />} />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary title="Diferencia de Goles" total={!isFem ? -13:5} icon={<MaintenanceIllustration />} />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsPartidos
            title="Rendimiento en partidos"
            subheader="Ultima actualización: 8 Abril 2024"
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
