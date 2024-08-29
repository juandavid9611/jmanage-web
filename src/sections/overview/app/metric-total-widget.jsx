import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';

import { sumBy } from 'src/utils/helper';
import { fNumber } from 'src/utils/format-number';

import Chart, { useChart } from 'src/components/chart';

// ----------------------------------------------------------------------

export default function MetricTotalWidget({ title, subheader, chart, ...other }) {
  const theme = useTheme();

  const {
    colors = [theme.palette.primary.light, theme.palette.primary.main],
    series,
    options,
  } = chart;

  const total = sumBy(series, (item) => item.value);

  const chartSeries =
    (series.filter((i) => i.label === 'Earned Percentage')[0].value / total) * 100;

  const getFillGradient = (value) => {
    if (value >= 100) {
      return {
        fill: {
          type: 'gradient',
          gradient: {
            colorStops: [
              { offset: 0, color: theme.palette.success.light, opacity: 1 },
              { offset: 100, color: theme.palette.success.main, opacity: 1 },
            ],
          },
        },
      };
    }
    if (value >= 75) {
      return {
        fill: {
          type: 'gradient',
          gradient: {
            colorStops: [
              { offset: 0, color: theme.palette.warning.light, opacity: 1 },
              { offset: 100, color: theme.palette.warning.main, opacity: 1 },
            ],
          },
        },
      };
    }
    return {
      fill: {
        type: 'gradient',
        gradient: {
          colorStops: [
            { offset: 0, color: theme.palette.error.light, opacity: 1 },
            { offset: 100, color: theme.palette.error.main, opacity: 1 },
          ],
        },
      },
    };
  };

  const chartOptions = useChart({
    legend: {
      show: false,
    },
    grid: {
      padding: { top: -32, bottom: -32 },
    },
    fill: {
      type: 'gradient',
      gradient: {
        colorStops: [
          { offset: 0, color: colors[0], opacity: 1 },
          { offset: 100, color: colors[1], opacity: 1 },
        ],
      },
    },
    plotOptions: {
      radialBar: {
        hollow: { size: '64%' },
        dataLabels: {
          name: { offsetY: -16 },
          value: { offsetY: 8 },
          total: {
            label: 'Porcentaje total',
            formatter: () => `${fNumber(series[0].value)}%`,
          },
        },
      },
    },
    ...options,
  });

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} sx={{ mb: 8 }} />

      <Chart
        dir="ltr"
        type="radialBar"
        series={[chartSeries]}
        options={{ ...chartOptions, ...getFillGradient(series[0]?.value || 0) }}
        width="100%"
        height={310}
      />
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, mb: 5 }} />
      <Divider sx={{ borderStyle: 'dashed' }} />
    </Card>
  );
}
