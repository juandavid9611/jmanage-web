import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import { Stack, Typography } from '@mui/material';

import { useSettingsContext } from 'src/components/settings';

import { FileUpgrade } from '../file-upgrade';

// ----------------------------------------------------------------------

export function OverviewAnalyticsView() {
  const settings = useSettingsContext();
  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: { xs: 3, md: 5 } }}
      >
        <Typography variant="h4">
          Conoce tu rendimiento y mejora a traves de nuestras alianzas
        </Typography>
      </Stack>
      <Grid container spacing={3}>
        <Grid xs={12} md={4}>
          <FileUpgrade
            title="Vittoria Tech"
            hrefLink="https://lookerstudio.google.com/u/0/reporting/bb0f5ac2-0bf0-4807-8ed5-0dac04e4ff06"
          />
        </Grid>

        <Grid xs={12} md={4}>
          <FileUpgrade
            title="Sinermed"
            hrefLink="https://lookerstudio.google.com/u/0/reporting/14d3ea79-2605-4965-9435-819c547f2494/page/p_wmpv8qs9cd"
          />
        </Grid>

        <Grid xs={12} md={4}>
          <FileUpgrade
            title="La Zona"
            hrefLink="https://lookerstudio.google.com/u/0/reporting/2f4a50bf-fce3-4130-a729-aa24a7653d8d/page/p_b1wc55p6hd"
          />
        </Grid>
      </Grid>
    </Container>
  );
}
