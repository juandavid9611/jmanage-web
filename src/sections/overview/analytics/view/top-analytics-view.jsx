import Grid from '@mui/material/Unstable_Grid2';
import { Box, Stack, Typography } from '@mui/material';

import { orderBy } from 'src/utils/helper';

import { DashboardContent } from 'src/layouts/dashboard';
import { useGetTopGoalsAndAssists } from 'src/actions/user';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { AppTopAnalytics } from '../app-top-analytics';
import { EcommerceWelcome } from '../ecommerce-welcome';

// ----------------------------------------------------------------------

export function TopAnalyticsView() {
  const { selectedWorkspace } = useWorkspace();
  const { topGoalsAndAssists } = useGetTopGoalsAndAssists(selectedWorkspace);
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
              title={`Goleador 🥇\n ${orderBy(topGoalsAndAssists, ['goals'], ['desc'])[0]?.name}`}
              imgIndex={9}
            />
            <AppTopAnalytics
              title={`Goleadores ${selectedWorkspace.name} 🏆`}
              list={orderBy(topGoalsAndAssists, ['goals'], ['desc'])}
              isGoal
            />
          </Box>
        </Grid>
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
            <EcommerceWelcome
              title={`Asistidor 🏅\n ${orderBy(topGoalsAndAssists, ['assists'], ['desc'])[0]?.name}`}
              imgIndex={7}
            />
            <AppTopAnalytics
              title={`Asistidores ${selectedWorkspace.name} 🏆`}
              list={orderBy(topGoalsAndAssists, ['assists'], ['desc'])}
              isGoal={false}
            />
          </Box>
        </Grid>
      </Grid>
    </DashboardContent>
  );
}
