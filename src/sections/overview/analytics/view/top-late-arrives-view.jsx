import Grid from '@mui/material/Unstable_Grid2';
import { Box, Stack, Typography } from '@mui/material';

import { orderBy } from 'src/utils/helper';

import { useGetLateArrives } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { EcommerceWelcome } from '../ecommerce-welcome';
import { LateArriveAnalytics } from '../late-arrive-analytics';

// ----------------------------------------------------------------------

export function TopLateArrivesView() {
  const { user } = useAuthContext();
  const { lateArrives } = useGetLateArrives(user?.id);

  const mascLateArrives = lateArrives.filter((item) => item.group === 'male');
  const femLateArrives = lateArrives.filter((item) => item.group === 'female');

  return (
    <DashboardContent maxWidth="xl">
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Typography variant="h4">Llegadas tarde</Typography>
      </Stack>
      <Stack spacing={{ xs: 3, md: 5 }} sx={{ mx: 'auto', maxWidth: { xs: 720, xl: 880 } }}>
        <Grid container spacing={3}>
          <Grid xs={12} md={6}>
            <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
              <EcommerceWelcome title="Masculino" imgIndex={20} />
              <LateArriveAnalytics list={orderBy(mascLateArrives, ['rating'], ['desc'])} />
            </Box>
          </Grid>
          <Grid xs={12} md={6}>
            <Box sx={{ gap: 1, display: 'flex', flexDirection: 'column' }}>
              <EcommerceWelcome title="Femenino" imgIndex={6} />
              <LateArriveAnalytics list={orderBy(femLateArrives, ['rating'], ['desc'])} />
            </Box>
          </Grid>
        </Grid>
      </Stack>
    </DashboardContent>
  );
}
