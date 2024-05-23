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

  const mascCategories = [
    'Pescara FC',
    'Albalon FC',
    'Deportivo AZ',
    'Curramba FC',
    'Canterbury FC',
    'Country FC',
    'Sabana SC',
    'Harten Klaussen',
    'Wallace FC',
  ];
  const femCategories = [
    'Funcode FC',
    'Mambe FC',
    'Sabana SC',
    'Forta FC',
    'Joga Bonito',
    'Espal',
    'Furia',
    'Dilex',
    'Leonas',
    'Siro',
    'Gratia Plena FC',
  ];
  const mascJugados = 9;
  const mascGolFavor = 20;
  const mascGolContra = 13;
  const mascDifGoles = mascGolFavor - mascGolContra;

  const femJugados = 12;
  const femGolFavor = 7;
  const femGolContra = 19;
  const femDifGoles = femGolFavor - femGolContra;

  const mascSeries = [
    {
      type: 'Fase Ofensiva',
      data: [
        {
          name: 'Remates totales',
          data: [14, 9, 5, 15, 16, 20, 9, 10, 19],
        },
        {
          name: 'Remates a puerta',
          data: [8, 5, 4, 7, 10, 9, 3, 8, 9],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [61, 68, 72, 66, 71, 59, 60, 39, 45],
        },
        {
          name: 'Recuperaciones',
          data: [1, 4, 6, 3, 3, 4, 3, 2, 2],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [275, 154, 315, 267, 261, 321, 217, 250, 355],
        },
        {
          name: 'Pases completados',
          data: [232, 113, 254, 234, 216, 278, 167, 209, 317],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [73, 64, 83, 75, 68, 86, 40, 57, 86],
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
          data: [3, 5, 7, 11, 3, 4, 11, 7, 18, 8, 16],
        },
        {
          name: 'Remates a puerta',
          data: [3, 1, 6, 6, 2, 1, 5, 5, 8, 5, 6],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [62, 58, 49, 57, 58, 11, 70, 15, 43, 19],
        },
        {
          name: 'Recuperaciones',
          data: [4, 6, 3, 1, 5, 14, 1, 9, 5, 10],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [138, 102, 104, 181, 78, 192, 116, 149, 196, 108, 205],
        },
        {
          name: 'Pases completados',
          data: [97, 69, 67, 131, 45, 149, 85, 112, 162, 60, 165],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [44, 36, 54, 53, 23, 80, 59, 75, 93, 40, 90],
        },
      ],
    },
  ];
  const mascMinutos = [
    { label: 'Santiago Motta', value: 650 },
    { label: 'Adrian Villalba', value: 647 },
    { label: 'Juan Quilaguy', value: 602 },
    { label: 'Cristian Gomez', value: 569 },
    { label: 'Abdulh Daza', value: 477 },
    { label: 'Juan Alarcon', value: 462 },
    { label: 'Cristian Lozano', value: 422 },
    { label: 'Jonathan Mindiola', value: 410 },
    { label: 'William Cabrera', value: 405 },
    { label: 'Alejandro Archila', value: 384 },
    { label: 'Cristian Medina', value: 368 },
    { label: 'Julio Mejia', value: 347 },
    { label: 'Santiago Lozano', value: 321 },
    { label: 'Camilo Arango', value: 263 },
    { label: 'Leonardo Triviño', value: 246 },
    { label: 'Jorge Carrasco', value: 230 },
    { label: 'David Reina', value: 207 },
    { label: 'Felipe Morales', value: 207 },
    { label: 'Luis Garcia', value: 190 },
    { label: 'Nicolas Gomez', value: 185 },
    { label: 'Daniel Rodriguez', value: 180 },
    { label: 'Pablo Salamanca', value: 140 },
    { label: 'Diego Herrera', value: 115 },
    { label: 'Diego Rincon', value: 90 },
    { label: 'Wilmis Gonzalez', value: 86 },
    { label: 'Andres Zuñiga', value: 76 },
    { label: 'Roberto Moralez', value: 73 },
    { label: 'Carlos Castellanos', value: 70 },
  ];

  const femMinutos = [
    { label: 'Tatiana Montoya', value: 523 },
    { label: 'Luisa Pineda', value: 523 },
    { label: 'Valentina Bello', value: 431 },
    { label: 'Valentina Garcia', value: 421 },
    { label: 'Monica Pacheco', value: 405 },
    { label: 'Juliana Castillo', value: 362 },
    { label: 'Valentina Suarez', value: 334 },
    { label: 'Laura Gomez', value: 315 },
    { label: 'Paula Sierra', value: 314 },
    { label: 'Valentina Murillo', value: 304 },
    { label: 'Karen Chaves', value: 251 },
    { label: 'Estefania Losada', value: 247 },
    { label: 'Sofia Cordoba', value: 191 },
    { label: 'Camila Chiquiza', value: 180 },
    { label: 'Alison De Armas', value: 173 },
    { label: 'Maria Pertuz', value: 155 },
    { label: 'Lady Sanchez', value: 128 },
    { label: 'Maria Guerra', value: 106 },
    { label: 'Paola Garzon', value: 103 },
    { label: 'Laura Suarez', value: 88 },
    { label: 'Alejandra Rojas', value: 76 },
    { label: 'Cristina Perez', value: 64 },
    { label: 'Valeria Cortes', value: 41 },
    { label: 'Camila Amador', value: 26 },
  ];

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Typography
        variant="h4"
        sx={{
          mb: { xs: 3, md: 5 },
        }}
      >
        Conoce tu rendimiento y mejora continuamente 👋{' '}
        <a
          href="https://lookerstudio.google.com/u/0/reporting/bb0f5ac2-0bf0-4807-8ed5-0dac04e4ff06"
          target="_blank"
          rel="noopener noreferrer"
        >
          Looker Studio
        </a>
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
            total={isFem ? femJugados : mascJugados}
            icon={<SeoIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Goles a favor"
            total={isFem ? femGolFavor : mascGolFavor}
            icon={<MotivationIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Goles en contra"
            total={isFem ? femGolContra : mascGolContra}
            icon={<ComingSoonIllustration />}
          />
        </Grid>

        <Grid xs={12} md={3}>
          <ValueWidgetSummary
            title="Diferencia de Goles"
            total={isFem ? femDifGoles : mascDifGoles}
            icon={<MaintenanceIllustration />}
          />
        </Grid>

        <Grid xs={12} md={6} lg={6}>
          <AnalyticsPartidos
            title="Rendimiento en partidos"
            subheader="Ultima actualización: 24 Abril 2024"
            chart={{
              colors: [
                theme.palette.primary.main,
                theme.palette.error.light,
                theme.palette.warning.main,
                theme.palette.success.main,
              ],
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
              total={!isFem ? femJugados : mascJugados}
              icon={<SeoIllustration />}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <ValueWidgetSummary
              title="Goles a favor"
              total={!isFem ? femGolFavor : mascGolFavor}
              icon={<MotivationIllustration />}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <ValueWidgetSummary
              title="Goles en contra"
              total={!isFem ? femGolContra : mascGolContra}
              icon={<ComingSoonIllustration />}
            />
          </Grid>

          <Grid xs={12} md={3}>
            <ValueWidgetSummary
              title="Diferencia de Goles"
              total={!isFem ? femDifGoles : mascDifGoles}
              icon={<MaintenanceIllustration />}
            />
          </Grid>

          <Grid xs={12} md={6} lg={6}>
            <AnalyticsPartidos
              title="Rendimiento en partidos"
              subheader="Ultima actualización: 24 Abril 2024"
              chart={{
                colors: [
                  theme.palette.primary.main,
                  theme.palette.error.light,
                  theme.palette.warning.main,
                  theme.palette.success.main,
                ],
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
        </Grid>
      )}
    </Container>
  );
}
