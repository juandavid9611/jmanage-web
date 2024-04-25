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
  ];
  const mascJugados = 6;
  const mascGolFavor = 13;
  const mascGolContra = 6;
  const mascDifGoles = mascGolFavor - mascGolContra;

  const femJugados = 9;
  const femGolFavor = 7;
  const femGolContra = 15;
  const femDifGoles = femGolFavor - femGolContra;

  const mascSeries = [
    {
      type: 'Fase Ofensiva',
      data: [
        {
          name: 'Remates totales',
          data: [14, 9, 5, 15, 16, 20],
        },
        {
          name: 'Remates a puerta',
          data: [8, 5, 4, 7, 10, 9],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [61, 68, 72, 66, 71, 59],
        },
        {
          name: 'Recuperaciones',
          data: [1, 4, 6, 3, 3, 4],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [275, 154, 315, 267, 261, 321],
        },
        {
          name: 'Pases completados',
          data: [232, 113, 254, 234, 216, 278],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [73, 64, 83, 75, 68, 86],
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
          data: [3, 5, 7, 11, 3, 4, 11, 7, 18],
        },
        {
          name: 'Remates a puerta',
          data: [3, 1, 6, 6, 2, 1, 5, 5, 8],
        },
      ],
    },
    {
      type: 'Fase Defensiva',
      data: [
        {
          name: 'Intercepciones',
          data: [62, 58, 49, 57, 58, 11, 70, 15, 43],
        },
        {
          name: 'Recuperaciones',
          data: [4, 6, 3, 1, 5, 14, 1, 9, 5],
        },
      ],
    },
    {
      type: 'Pases',
      data: [
        {
          name: 'Pases totales',
          data: [138, 102, 104, 181, 78, 192, 116, 149, 196],
        },
        {
          name: 'Pases completados',
          data: [97, 69, 67, 131, 45, 149, 85, 112, 162],
        },
      ],
    },
    {
      type: 'Posesión',
      data: [
        {
          name: 'Porcentaje de posesión',
          data: [44, 36, 54, 53, 23, 80, 59, 75, 93],
        },
      ],
    },
  ];
  const mascMinutos = [
    { label: 'Adrian Villalba', value: 442 },
    { label: 'Juan Quilaguy', value: 442 },
    { label: 'Santiago Motta', value: 435 },
    { label: 'Cristian Gomez', value: 396 },

    { label: 'William Cabrera', value: 315 },
    { label: 'Cristian Medina', value: 312 },
    { label: 'Jonathan Mindiola', value: 300 },
    { label: 'Julio Mejia', value: 298 },
    { label: 'Alejandro Archila', value: 285 },
    { label: 'Juan Alarcon', value: 282 },
    { label: 'Leonardo Triviño', value: 246 },
    { label: 'Cristian Lozano', value: 242 },
    { label: 'Abdulh Daza', value: 216 },
    { label: 'David Reina', value: 207 },
    { label: 'Nicolas Gomez', value: 185 },
    { label: 'Santiago Lozano', value: 128 },
    { label: 'Felipe Morales', value: 117 },
    { label: 'Pablo Salamanca', value: 106 },
    { label: 'Diego Rincon', value: 90 },
    { label: 'Camilo Arango', value: 83 },
    { label: 'Wilmis Gonzalez', value: 77 },
    { label: 'Andres Zuñiga', value: 76 },
    { label: 'Roberto Moralez', value: 73 },
    { label: 'Jorge Carrasco', value: 50 },
    { label: 'Herrera Diego', value: 25 },
    { label: 'Garcia Luis', value: 21 },
    { label: 'Carlos Castellanos', value: 8 },
  ];

  const femMinutos = [
    { label: 'Luisa Pineda', value: 433 },
    { label: 'Tatiana Montoya', value: 404 },
    { label: 'Valentina Bello', value: 343 },
    { label: 'Monica Pacheco', value: 317 },
    { label: 'Valentina Garcia', value: 306 },
    { label: 'Juliana Castillo', value: 302 },
    { label: 'Laura Gomez', value: 273 },
    { label: 'Paula Sierra', value: 254 },
    { label: 'Valentina Murillo', value: 248 },
    { label: 'Valentina Suarez', value: 240 },
    { label: 'Estefania Losada', value: 222 },
    { label: 'Karen Chaves', value: 187 },
    { label: 'Sofia Cordoba', value: 183 },
    { label: 'Alison De Armas', value: 173 },
    { label: 'Camila Chiquiza', value: 160 },
    { label: 'Maria Pertuz', value: 155 },
    { label: 'Maria Guerra', value: 106 },
    { label: 'Lady Sanchez', value: 85 },
    { label: 'Paola Garzon', value: 83 },
    { label: 'Alejandra Rojas', value: 68 },
    { label: 'Laura Suarez', value: 60 },
    { label: 'Cristina Perez', value: 51 },
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
