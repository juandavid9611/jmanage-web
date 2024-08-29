import Grid from '@mui/material/Unstable_Grid2';
import { Box, Stack, Typography } from '@mui/material';

import { orderBy } from 'src/utils/helper';

import { DashboardContent } from 'src/layouts/dashboard';
import { get_top_goals_and_assists } from 'src/actions/user';

import { AppTopAnalytics } from '../app-top-analytics';
import { EcommerceWelcome } from '../ecommerce-welcome';

// ----------------------------------------------------------------------

export function TopAnalyticsView() {
  return (
    <DashboardContent maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Typography variant="h4">Goleadores y asistidores</Typography>
      </Stack>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <EcommerceWelcome
              title={`Goleador 🥇\n ${orderBy(get_top_goals_and_assists('masculino'), ['goals'], ['desc'])[0].name}`}
              imgIndex={9}
            />
            <AppTopAnalytics
              title="Goleadores Equipo Masculino"
              list={orderBy(get_top_goals_and_assists('masculino'), ['goals'], ['desc'])}
              isGoal
            />
          </Box>
        </Grid>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <EcommerceWelcome
              title={`Goleadora 🥇\n ${orderBy(get_top_goals_and_assists('femenino'), ['goals'], ['desc'])[0].name}`}
              imgIndex={2}
            />
            <AppTopAnalytics
              title="Goleadoras Equipo Femenino"
              list={orderBy(get_top_goals_and_assists('femenino'), ['goals'], ['desc'])}
              isGoal
            />
          </Box>
        </Grid>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <EcommerceWelcome
              title={`Asistidor 🏅\n ${orderBy(get_top_goals_and_assists('masculino'), ['assists'], ['desc'])[0].name}`}
              imgIndex={7}
            />
            <AppTopAnalytics
              title="Asistidores Equipo Masculino"
              list={orderBy(get_top_goals_and_assists('masculino'), ['assists'], ['desc'])}
              isGoal={false}
            />
          </Box>
        </Grid>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <EcommerceWelcome
              title={`Asistidora 🏅\n ${orderBy(get_top_goals_and_assists('femenino'), ['assists'], ['desc'])[0].name}`}
              imgIndex={0}
            />
            <AppTopAnalytics
              title="Asistidoras Equipo Femenino"
              list={orderBy(get_top_goals_and_assists('femenino'), ['assists'], ['desc'])}
              isGoal={false}
            />
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
