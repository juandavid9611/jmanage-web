import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Avatar from '@mui/material/Avatar';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import {
  computeCompromisoStats,
  useGetEngagementLineupsForMatches,
} from 'src/actions/engagement';

import { Chart, useChart } from 'src/components/chart';

import AnalyticsWidgetSummary from '../overview/analytics/analytics-widget-summary';

// ----------------------------------------------------------------------

function compromisoColor(pct) {
  if (pct >= 66) return 'success';
  if (pct >= 33) return 'warning';
  return 'error';
}

export function CompromisoCharts({ roster, matches }) {
  const theme = useTheme();
  const matchIds = useMemo(() => matches.map((m) => m.id), [matches]);
  const { lineupsByMatch } = useGetEngagementLineupsForMatches(matchIds);

  const stats = useMemo(() => computeCompromisoStats(roster, lineupsByMatch), [roster, lineupsByMatch]);
  const partidosRegistrados = stats[0]?.partidosRegistrados || 0;

  const sortedByCompromiso = useMemo(
    () => [...stats].sort((a, b) => b.compromiso - a.compromiso),
    [stats]
  );

  const kpis = useMemo(() => {
    const compromisoPromedio = stats.length
      ? Math.round((stats.reduce((sum, s) => sum + s.compromiso, 0) / stats.length) * 100)
      : 0;
    const minutosTotales = stats.reduce((sum, s) => sum + s.minutos, 0);
    const masConstante = sortedByCompromiso[0];

    return { compromisoPromedio, minutosTotales, masConstante };
  }, [stats, sortedByCompromiso]);

  const totalTitular = stats.reduce((sum, s) => sum + s.titulares, 0);
  const totalSuplente = stats.reduce((sum, s) => sum + s.suplentes, 0);
  const totalSlots = partidosRegistrados * roster.length;
  const totalNoConvocado = Math.max(totalSlots - totalTitular - totalSuplente, 0);

  const donutOptions = useChart({
    labels: ['Titular', 'Suplente', 'No convocado'],
    colors: [theme.palette.success.main, theme.palette.warning.main, theme.palette.grey[400]],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true, dropShadow: { enabled: false } },
  });

  if (partidosRegistrados === 0) {
    return (
      <Typography variant="body2" sx={{ color: 'text.disabled', textAlign: 'center', py: 3 }}>
        Todavía no hay convocatorias guardadas — cargalas desde la pestaña &quot;Partidos&quot;.
      </Typography>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid xs={6} sm={6} md={3}>
        <AnalyticsWidgetSummary
          title="Partidos registrados"
          total={partidosRegistrados}
          color="info"
          sx={{ boxShadow: (t) => t.customShadows?.card, borderRadius: 2 }}
        />
      </Grid>
      <Grid xs={6} sm={6} md={3}>
        <AnalyticsWidgetSummary
          title="% Compromiso promedio"
          total={kpis.compromisoPromedio}
          color="primary"
          sx={{ boxShadow: (t) => t.customShadows?.card, borderRadius: 2 }}
        />
      </Grid>
      <Grid xs={6} sm={6} md={3}>
        <AnalyticsWidgetSummary
          title="Minutos totales del equipo"
          total={kpis.minutosTotales}
          color="success"
          sx={{ boxShadow: (t) => t.customShadows?.card, borderRadius: 2 }}
        />
      </Grid>
      <Grid xs={6} sm={6} md={3}>
        <Card
          sx={{
            py: 5,
            px: 2,
            height: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            borderRadius: 2,
            boxShadow: (t) => t.customShadows?.card,
          }}
        >
          <Typography variant="subtitle1" noWrap sx={{ mb: 0.5, maxWidth: 1 }}>
            {kpis.masConstante?.player?.name || '—'}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.64 }}>
            Jugador más constante
          </Typography>
        </Card>
      </Grid>

      <Grid xs={12} md={7}>
        <Card sx={{ boxShadow: (t) => t.customShadows?.card, borderRadius: 2 }}>
          <CardHeader title="% Compromiso por jugador" />
          <Box
            sx={{
              px: 3,
              py: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2.5,
              maxHeight: 420,
              overflowY: 'auto',
            }}
          >
            {sortedByCompromiso.map((s) => {
              const pct = Math.round(s.compromiso * 100);
              return (
                <Box key={s.player.id}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 1,
                      mb: 0.75,
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                      <Avatar src={s.player.avatarUrl} sx={{ width: 24, height: 24, fontSize: 12 }}>
                        {s.player.name?.[0]}
                      </Avatar>
                      <Typography variant="body2" noWrap sx={{ minWidth: 0 }}>
                        {s.player.name}
                      </Typography>
                    </Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ flexShrink: 0, color: `${compromisoColor(pct)}.main` }}
                    >
                      {pct}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={pct}
                    color={compromisoColor(pct)}
                    sx={{ height: 8, borderRadius: 1 }}
                  />
                </Box>
              );
            })}
          </Box>
        </Card>
      </Grid>

      <Grid xs={12} md={5}>
        <Card sx={{ boxShadow: (t) => t.customShadows?.card, borderRadius: 2 }}>
          <CardHeader title="Participación del equipo" subheader="Titular / Suplente / No convocado" />
          <Chart
            dir="ltr"
            type="donut"
            series={[totalTitular, totalSuplente, totalNoConvocado]}
            options={donutOptions}
            width="100%"
            height={320}
            sx={{ p: 3 }}
          />
        </Card>
      </Grid>
    </Grid>
  );
}
