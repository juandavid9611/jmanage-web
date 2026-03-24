import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export function TourPerformanceChart({ bookers = [] }) {
  const theme = useTheme();

  const contributors = bookers
    .filter((b) => b.goals > 0 || b.assists > 0)
    .sort((a, b) => b.goals + b.assists - (a.goals + a.assists))
    .slice(0, 8);

  const names   = contributors.map((b) => b.name.split(' ')[0]);
  const goals   = contributors.map((b) => b.goals);
  const assists = contributors.map((b) => b.assists);

  const chartOptions = useChart({
    chart: { type: 'bar' },
    colors: [theme.palette.primary.main, theme.palette.warning.main],
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        columnWidth: '40%',
        barHeight: '60%',
        borderRadiusApplication: 'end',
      },
    },
    stroke: { show: false },
    fill: { opacity: 1 },
    xaxis: {
      categories: names,
      labels: { style: { fontSize: '12px' } },
    },
    yaxis: { labels: { style: { fontWeight: 600 } } },
    grid: {
      xaxis: { lines: { show: true } },
      yaxis: { lines: { show: false } },
    },
    tooltip: {
      shared: true,
      intersect: false,
      y: { formatter: (val) => `${val}` },
    },
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: theme.vars.palette.text.primary },
    },
  });

  if (contributors.length === 0) {
    return (
      <Card
        sx={{
          p: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          minHeight: 160,
          bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
          border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.2)}`,
        }}
      >
        <Iconify icon="mdi:soccer" width={32} sx={{ color: 'text.disabled' }} />
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Sin anotaciones registradas
        </Typography>
      </Card>
    );
  }

  return (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack spacing={0.25}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Aportaciones por Jugador
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Goles y asistencias en este partido
          </Typography>
        </Stack>
        <Iconify icon="mdi:chart-bar" width={20} sx={{ color: 'text.disabled', mt: 0.5 }} />
      </Stack>

      <Chart
        type="bar"
        series={[
          { name: 'Goles', data: goals },
          { name: 'Asistencias', data: assists },
        ]}
        options={chartOptions}
        height={Math.max(contributors.length * 52, 160)}
      />
    </Card>
  );
}
