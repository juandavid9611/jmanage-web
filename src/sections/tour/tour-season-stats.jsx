import { useMemo } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { orderBy } from 'src/utils/helper';

import { Iconify } from 'src/components/iconify';
import { Chart, useChart } from 'src/components/chart';

// ── Seeded mock helper (deterministic per tour) ────────────────────────

function seed(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i += 1) {
    h = (h * 33 + str.charCodeAt(i)) % 2147483647;
  }
  return h;
}
function seededVal(str, min, max) {
  return min + (seed(str) % (max - min + 1));
}

// ── Core stats ─────────────────────────────────────────────────────────

function computeStats(tours) {
  let wins = 0; let draws = 0; let losses = 0; let goalsFor = 0; let goalsAgainst = 0;
  let totalYellow = 0; let totalRed = 0; let totalLate = 0; let totalMvp = 0;
  const scorerMap = {};
  const assistMap = {};

  tours.forEach((tour) => {
    const { home, away } = tour.scores || { home: 0, away: 0 };
    if (home > away) wins += 1;
    else if (home === away) draws += 1;
    else losses += 1;
    goalsFor += home;
    goalsAgainst += away;

    Object.values(tour.bookers || {}).forEach((b) => {
      if (b.yellowCard) totalYellow += 1;
      if (b.redCard)    totalRed += 1;
      if (b.late)       totalLate += 1;
      if (b.mvp)        totalMvp += 1;
      if (b.goals > 0) {
        scorerMap[b.name] = scorerMap[b.name] || { name: b.name, avatarUrl: b.avatarUrl, goals: 0 };
        scorerMap[b.name].goals += b.goals;
      }
      if (b.assists > 0) {
        assistMap[b.name] = assistMap[b.name] || { name: b.name, avatarUrl: b.avatarUrl, assists: 0 };
        assistMap[b.name].assists += b.assists;
      }
    });
  });

  const played = tours.length;
  const winRate = played > 0 ? Math.round((wins / played) * 100) : 0;
  const goalDiff = goalsFor - goalsAgainst;
  const totalAssists = Object.values(assistMap).reduce((s, p) => s + p.assists, 0);
  const topScorers = orderBy(Object.values(scorerMap), ['goals'], ['desc']).slice(0, 6);
  const topAssists = orderBy(Object.values(assistMap), ['assists'], ['desc']).slice(0, 6);

  const attackScore     = Math.min(Math.round((goalsFor / Math.max(played, 1) / 2.5) * 100), 100);
  const defenseScore    = Math.max(Math.round(100 - (goalsAgainst / Math.max(played, 1) / 2) * 100), 0);
  const disciplineScore = Math.max(Math.round(100 - (totalYellow * 5 + totalRed * 20) / Math.max(played, 1)), 0);
  const consistScore    = winRate;
  const teamworkScore   = goalsFor > 0 ? Math.min(Math.round((totalAssists / goalsFor) * 100), 100) : 40;

  const healthScore = Math.min(Math.max(Math.round(
    winRate * 0.45 +
    Math.min(Math.max(goalDiff * 3, -15), 20) +
    disciplineScore * 0.25
  ), 0), 100);

  return {
    played, wins, draws, losses, goalsFor, goalsAgainst, goalDiff,
    winRate, totalYellow, totalRed, totalLate, totalMvp, totalAssists,
    topScorers, topAssists,
    radar: [attackScore, defenseScore, disciplineScore, consistScore, teamworkScore],
    healthScore,
  };
}

// ── AI narrative ───────────────────────────────────────────────────────

function buildNarrative(stats, last5) {
  const { wins, draws, losses, played, winRate, goalsFor, goalsAgainst, goalDiff, topScorers, totalYellow, totalRed } = stats;
  const recentWins  = last5.filter((t) => (t.scores?.home ?? 0) > (t.scores?.away ?? 0)).length;
  const recentLoss  = last5.filter((t) => (t.scores?.home ?? 0) < (t.scores?.away ?? 0)).length;

  let opening = '';
  if (winRate >= 70)       opening = `Temporada sobresaliente con ${wins}V/${draws}E/${losses}D (${winRate}% efectividad). El equipo está demostrando un nivel competitivo muy alto.`;
  else if (winRate >= 50)  opening = `Balance positivo en la temporada: ${wins}V/${draws}E/${losses}D. El equipo rinde por encima del 50% con margen de mejora.`;
  else if (winRate >= 30)  opening = `Temporada irregular con ${wins} victorias en ${played} partidos. Los altibajos frenan el progreso del equipo.`;
  else                     opening = `Momento difícil: solo ${wins} victorias en ${played} partidos. El análisis apunta a problemas estructurales que resolver.`;

  let formLine = '';
  if (recentWins >= 4)     formLine = ` La racha reciente de ${recentWins}/5 victorias indica que el equipo llega en su mejor momento.`;
  else if (recentLoss >= 3) formLine = ` Preocupa la forma reciente con ${recentLoss} derrotas en los últimos 5 partidos — se necesita un ajuste táctico.`;
  else if (recentWins >= 2) formLine = ` La forma reciente (${recentWins}/5) es aceptable aunque con margen de mejora claro.`;

  let goalsLine = '';
  if (goalDiff >= 8)       goalsLine = ` Dominio goleador con +${  goalDiff  } de diferencia, lo que refleja una superioridad ofensiva consistente.`;
  else if (goalDiff <= -4) goalsLine = ` La diferencia de goles negativa (${goalDiff}) alerta sobre la fragilidad defensiva.`;
  else if (goalsFor > goalsAgainst) goalsLine = ` Con ${goalsFor} a favor y ${goalsAgainst} en contra, el balance es positivo aunque ajustado.`;

  let playerLine = '';
  if (topScorers[0]?.goals > 0) {
    playerLine = ` ${topScorers[0].name} lidera el ataque con ${topScorers[0].goals} gol${topScorers[0].goals > 1 ? 'es' : ''}`;
    if (topScorers[1]?.goals > 0) playerLine += ` y ${topScorers[1].name} aporta ${topScorers[1].goals} más`;
    playerLine += '.';
  }

  let discLine = '';
  const cardsPerMatch = (totalYellow + totalRed * 3) / Math.max(played, 1);
  if (totalRed > 1)      discLine = ` ${totalRed} expulsiones esta temporada son una señal de alarma disciplinaria.`;
  else if (cardsPerMatch < 0.5) discLine = ' La disciplina del equipo es un activo importante: muy pocas amonestaciones.';

  return opening + (formLine || '') + (goalsLine || '') + (playerLine || '') + (discLine || '');
}

// ── AI Insights generator ──────────────────────────────────────────────

function buildInsights(stats, chronoTours) {
  const insights = [];
  const { winRate, goalsFor, goalsAgainst, played, topScorers, totalYellow, totalRed, totalLate, radar } = stats;
  const last3 = chronoTours.slice(-3);
  const last3Goals = last3.reduce((s, t) => s + (t.scores?.home ?? 0), 0);
  const prevGoals  = chronoTours.slice(-6, -3).reduce((s, t) => s + (t.scores?.home ?? 0), 0);

  // Offensive trend
  if (last3Goals > prevGoals && prevGoals > 0) {
    insights.push({ icon: 'mdi:trending-up', color: 'success', title: 'Racha Ofensiva', body: `${last3Goals} goles en los últimos 3 partidos vs ${prevGoals} en los 3 anteriores. El equipo está en su mejor momento anotador.` });
  } else if (last3Goals < prevGoals && last3Goals <= 1) {
    insights.push({ icon: 'mdi:trending-down', color: 'error', title: 'Sequía Goleadora', body: `Solo ${last3Goals} goles en los últimos 3 partidos. Revisar la finalización y la circulación en campo contrario.` });
  }

  // Top scorer dependency
  const topGoals = topScorers[0]?.goals || 0;
  const topShare = goalsFor > 0 ? Math.round((topGoals / goalsFor) * 100) : 0;
  if (topShare > 50 && topGoals > 2) {
    insights.push({ icon: 'mdi:alert-circle-outline', color: 'warning', title: 'Dependencia Ofensiva', body: `${topScorers[0].name} aporta el ${topShare}% de los goles del equipo. Riesgo alto si no está disponible.` });
  } else if (topScorers.length >= 3 && topShare < 35) {
    insights.push({ icon: 'mdi:check-decagram', color: 'success', title: 'Ataque Coral', body: `${topScorers.length} jugadores diferentes han marcado esta temporada. El gol está bien repartido en el equipo.` });
  }

  // Defense
  const goalsAgainstPM = goalsAgainst / Math.max(played, 1);
  if (goalsAgainstPM < 0.8) {
    insights.push({ icon: 'mdi:shield-check', color: 'success', title: 'Solidez Defensiva', body: `Solo ${goalsAgainst} goles encajados en ${played} partidos (${goalsAgainstPM.toFixed(1)}/partido). La defensa es el pilar del equipo esta temporada.` });
  } else if (goalsAgainstPM > 2) {
    insights.push({ icon: 'mdi:shield-alert', color: 'error', title: 'Fragilidad Defensiva', body: `Promedio de ${goalsAgainstPM.toFixed(1)} goles encajados/partido. La línea defensiva necesita ajustes urgentes en los desmarques de segunda línea.` });
  }

  // Discipline
  if (totalRed > 0) {
    insights.push({ icon: 'mdi:card-remove', color: 'error', title: 'Alerta Roja', body: `${totalRed} expulsión${totalRed > 1 ? 'es' : ''} esta temporada. Los partidos jugados en inferioridad numérica tienen un impacto crítico en los resultados.` });
  }
  if (totalLate >= 3 && played > 0) {
    insights.push({ icon: 'mdi:clock-alert', color: 'warning', title: 'Puntualidad del Equipo', body: `${totalLate} llegadas tarde registradas. La preparación previa al partido es parte del rendimiento colectivo.` });
  }

  // Radar weakness
  const radarLabels = ['Ataque', 'Defensa', 'Disciplina', 'Consistencia', 'Trabajo en equipo'];
  const minIdx = radar.indexOf(Math.min(...radar));
  if (radar[minIdx] < 40) {
    insights.push({ icon: 'mdi:target', color: 'info', title: `Área a Mejorar: ${radarLabels[minIdx]}`, body: `El perfil del equipo muestra ${radarLabels[minIdx]} como el punto más débil (score: ${radar[minIdx]}/100). Foco táctico recomendado.` });
  }

  // Win rate ceiling
  if (winRate >= 60 && played >= 5) {
    insights.push({ icon: 'mdi:trophy', color: 'success', title: 'Equipo de Élite Local', body: `Con ${winRate}% de victorias en ${played} partidos, el equipo se sitúa entre los mejores de su categoría. Mantener el nivel es el desafío.` });
  }

  return insights.slice(0, 4);
}

// ── Helpers ────────────────────────────────────────────────────────────

function resultType(tour) {
  const h = tour.scores?.home ?? 0;
  const a = tour.scores?.away ?? 0;
  return h > a ? 'W' : h === a ? 'D' : 'L';
}

// ── Main component ─────────────────────────────────────────────────────

export function TourSeasonStats({ tours = [] }) {
  const theme = useTheme();

  const chronoTours = useMemo(() => orderBy(tours, ['available.startDate'], ['asc']), [tours]);
  const stats       = useMemo(() => computeStats(tours), [tours]);
  const narrative   = useMemo(() => buildNarrative(stats, chronoTours.slice(-5)), [stats, chronoTours]);
  const insights    = useMemo(() => buildInsights(stats, chronoTours), [stats, chronoTours]);

  const last8 = chronoTours.slice(-8);

  // ── Charts ────────────────────────────────────────────────────────

  const trendLabels = chronoTours.map((t) =>
    t.available?.startDate
      ? new Date(t.available.startDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
      : '?'
  );

  const trendOptions = useChart({
    colors: [theme.palette.primary.main, theme.palette.error.light],
    chart: { type: 'area' },
    fill: { type: 'gradient', gradient: { opacityFrom: 0.28, opacityTo: 0.02 } },
    stroke: { width: [2.5, 2], curve: 'smooth', dashArray: [0, 4] },
    xaxis: { categories: trendLabels, labels: { style: { fontSize: '10px' } } },
    yaxis: { tickAmount: 3 },
    tooltip: { shared: true, intersect: false },
    legend: { show: true, position: 'top', horizontalAlign: 'right', labels: { colors: theme.vars.palette.text.primary } },
  });

  const radarOptions = useChart({
    colors: [theme.palette.primary.main],
    chart: { type: 'radar' },
    fill: { opacity: 0.18 },
    stroke: { width: 2 },
    markers: { size: 4 },
    xaxis: { categories: ['Ataque', 'Defensa', 'Disciplina', 'Consistencia', 'Trabajo'] },
    yaxis: { show: false, min: 0, max: 100 },
    plotOptions: { radar: { polygons: { fill: { colors: ['transparent'] } } } },
  });

  // Mock: goals by period (seeded per tour)
  const goalsByPeriod = useMemo(() => {
    const periods = [0, 0, 0, 0];
    tours.forEach((t) => {
      const g = t.scores?.home ?? 0;
      for (let i = 0; i < g; i += 1) {
        const p = seededVal(t.id + String(i), 0, 3);
        periods[p] += 1;
      }
    });
    return periods;
  }, [tours]);

  const periodOptions = useChart({
    colors: [
      alpha(theme.palette.primary.main, 0.5),
      alpha(theme.palette.primary.main, 0.7),
      theme.palette.primary.main,
      theme.palette.warning.main,
    ],
    chart: { type: 'bar' },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '55%', distributed: true } },
    xaxis: { categories: ["0'–30'", "31'–60'", "61'–90'", "90'+"] },
    yaxis: { tickAmount: 3 },
    tooltip: { y: { formatter: (v) => `${v} goles` } },
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
  });

  const healthRadialOptions = useChart({
    colors: [theme.palette[stats.healthScore >= 70 ? 'success' : stats.healthScore >= 50 ? 'primary' : stats.healthScore >= 30 ? 'warning' : 'error'].main],
    plotOptions: { radialBar: { hollow: { size: '65%', margin: 0 }, track: { margin: 0 }, dataLabels: { value: { fontSize: '22px', fontWeight: 900 }, total: { show: true, label: 'Score', color: theme.vars.palette.text.disabled } } } },
    labels: ['Score'],
  });

  const donutOptions = useChart({
    colors: [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    chart: { type: 'donut' },
    labels: ['Victorias', 'Empates', 'Derrotas'],
    plotOptions: { pie: { donut: { size: '72%', labels: { value: { fontSize: '20px', fontWeight: 800 } } } } },
    legend: { show: true, position: 'bottom', labels: { colors: theme.vars.palette.text.primary } },
  });

  // Player contribution matrix
  const playerMatrix = useMemo(() => {
    const nameMap = {};
    chronoTours.forEach((tour) => {
      Object.values(tour.bookers || {}).forEach((b) => {
        if (!nameMap[b.name]) nameMap[b.name] = { name: b.name, avatarUrl: b.avatarUrl, totalScore: 0 };
        nameMap[b.name].totalScore += (b.goals * 3) + (b.assists * 2) + (b.mvp ? 2 : 0) - (b.yellowCard ? 1 : 0) - (b.redCard ? 3 : 0);
      });
    });
    const players = orderBy(Object.values(nameMap), ['totalScore'], ['desc']).slice(0, 10);
    return players.map((p) => ({
      ...p,
      cells: chronoTours.map((tour) => {
        const b = Object.values(tour.bookers || {}).find((bk) => bk.name === p.name);
        if (!b) return null;
        if (b.redCard)    return 'red';
        if (b.mvp)        return 'mvp';
        if (b.goals > 0)  return 'goal';
        if (b.assists > 0) return 'assist';
        if (b.yellowCard) return 'yellow';
        if (b.late)       return 'late';
        return 'played';
      }),
    }));
  }, [chronoTours]);

  if (tours.length === 0) return null;

  // ── Render ────────────────────────────────────────────────────────

  return (
    <Stack spacing={2.5} sx={{ mb: 5 }}>

      {/* ── AI Brief ──────────────────────────────────────────────── */}
      <Box
        sx={{
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'grey.900',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(142,51,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(12,104,233,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={2} sx={{ mb: 2.5 }}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ width: 32, height: 32, borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0C68E9, #8E33FF)' }}>
                <Iconify icon="mdi:creation" width={18} sx={{ color: 'white' }} />
              </Box>
              <Stack>
                <Typography variant="overline" sx={{ color: 'rgba(255,255,255,0.35)', lineHeight: 1, fontSize: '0.62rem', letterSpacing: 1.5 }}>
                  ANÁLISIS DE TEMPORADA
                </Typography>
                <Typography variant="h6" sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.2 }}>
                  Informe de Rendimiento
                </Typography>
              </Stack>
            </Stack>
            <Chip
              label="IA"
              size="small"
              sx={{ height: 20, fontSize: '0.6rem', fontWeight: 900, letterSpacing: 1, background: 'linear-gradient(135deg, #0C68E9, #8E33FF)', color: 'white', flexShrink: 0 }}
            />
          </Stack>

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, mb: 3, maxWidth: 760 }}>
            {narrative}
          </Typography>

          <Box display="grid" gap={2} gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}>
            {[
              { label: 'PARTIDOS', value: stats.played, color: '#6BB1F8' },
              { label: 'EFECTIVIDAD', value: `${stats.winRate}%`, color: stats.winRate >= 50 ? '#22C55E' : '#FFAB00' },
              { label: 'GOLES MARCADOS', value: stats.goalsFor, color: '#0C68E9' },
              { label: 'DIFERENCIA', value: (stats.goalDiff >= 0 ? '+' : '') + stats.goalDiff, color: stats.goalDiff >= 0 ? '#22C55E' : '#FF5630' },
            ].map((k) => (
              <Box key={k.label} sx={{ borderLeft: `2px solid ${alpha(k.color, 0.6)}`, pl: 1.5 }}>
                <Typography sx={{ color: k.color, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}>
                  {k.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 0.5 }}>
                  {k.label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* ── Vitals row ─────────────────────────────────────────────── */}
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: 'repeat(3, 1fr)' }}>

        {/* Health score */}
        <Card sx={{ p: 2.5, textAlign: 'center', position: 'relative', overflow: 'visible' }}>
          <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}>
            SALUD DEL CLUB
          </Typography>
          <Box sx={{ my: 0.5 }}>
            <Chart
              type="radialBar"
              series={[stats.healthScore]}
              options={healthRadialOptions}
              height={160}
            />
          </Box>
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 0.5 }}>
            {[{ l: 'V', v: stats.wins, c: 'success.main' }, { l: 'E', v: stats.draws, c: 'warning.main' }, { l: 'D', v: stats.losses, c: 'error.main' }].map((r) => (
              <Stack key={r.l} alignItems="center" spacing={0}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: r.c, lineHeight: 1 }}>{r.v}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>{r.l}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Form strip */}
        <Card sx={{ p: 2.5 }}>
          <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}>
            ÚLTIMOS {last8.length} PARTIDOS
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
            {last8.map((t, i) => {
              const r = resultType(t);
              const col = r === 'W' ? 'success' : r === 'D' ? 'warning' : 'error';
              return (
                <Tooltip key={i} title={`${t.name} · ${t.scores?.home ?? 0}–${t.scores?.away ?? 0}`} arrow>
                  <Box sx={{ width: 32, height: 32, borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (th) => alpha(th.palette[col].main, 0.15), border: (th) => `1.5px solid ${alpha(th.palette[col].main, 0.4)}`, cursor: 'default' }}>
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: `${col}.main` }}>{r}</Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
          <Divider sx={{ my: 1.75 }} />
          <Stack direction="row" justifyContent="space-between">
            {[
              { label: 'Racha actual', value: (() => { let s = 0; const last = resultType(last8[last8.length - 1]); for (let i = last8.length - 1; i >= 0; i -= 1) { if (resultType(last8[i]) === last) s += 1; else break; } return `${s} ${last === 'W' ? 'victorias' : last === 'D' ? 'empates' : 'derrotas'}`; })() },
              { label: 'G/partido', value: (stats.goalsFor / Math.max(stats.played, 1)).toFixed(1) },
              { label: 'EC/partido', value: (stats.goalsAgainst / Math.max(stats.played, 1)).toFixed(1) },
            ].map((m) => (
              <Stack key={m.label} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>{m.value}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>{m.label}</Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Win distribution donut */}
        <Card sx={{ p: 2.5, textAlign: 'center' }}>
          <Typography variant="overline" sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}>
            DISTRIBUCIÓN DE RESULTADOS
          </Typography>
          <Chart
            type="donut"
            series={[stats.wins, stats.draws, stats.losses]}
            options={donutOptions}
            height={180}
          />
        </Card>
      </Box>

      {/* ── Performance + Radar ─────────────────────────────────────── */}
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', md: '1fr 320px' }}>

        {/* Goals trend */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
            <Stack spacing={0.25}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Evolución de Resultados</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Goles a favor (—) vs en contra (- -) por partido</Typography>
            </Stack>
            <Stack direction="row" spacing={0.75}>
              <Chip label={`${stats.goalsFor} GF`} size="small" color="primary" variant="soft" sx={{ fontWeight: 700 }} />
              <Chip label={`${stats.goalsAgainst} GC`} size="small" color="error" variant="soft" sx={{ fontWeight: 700 }} />
            </Stack>
          </Stack>
          <Chart
            type="area"
            series={[{ name: 'A favor', data: chronoTours.map((t) => t.scores?.home ?? 0) }, { name: 'En contra', data: chronoTours.map((t) => t.scores?.away ?? 0) }]}
            options={trendOptions}
            height={200}
          />
        </Card>

        {/* Radar */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Perfil del Equipo</Typography>
            <Chip label="IA" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 800, background: 'linear-gradient(135deg,#0C68E9,#8E33FF)', color: 'white' }} />
          </Stack>
          <Chart
            type="radar"
            series={[{ name: 'Equipo', data: stats.radar }]}
            options={radarOptions}
            height={220}
          />
        </Card>
      </Box>

      {/* ── Goals by period + Top scorers ───────────────────────────── */}
      <Box display="grid" gap={2} gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}>

        {/* Goals by period (mock-assisted) */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Minutos Goleadores</Typography>
            <Chip label="simulado" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.58rem', color: 'text.disabled', borderColor: 'divider' }} />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            En qué tramo del partido suele anotar el equipo
          </Typography>
          <Chart
            type="bar"
            series={[{ name: 'Goles', data: goalsByPeriod }]}
            options={periodOptions}
            height={180}
          />
        </Card>

        {/* Top scorers + Top assists */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:trophy-outline" width={18} sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Líderes Individuales</Typography>
          </Stack>

          <Stack direction="row" spacing={3}>
            {/* Scorers */}
            <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                GOLEADORES
              </Typography>
              {stats.topScorers.slice(0, 5).map((s, i) => (
                <Stack key={s.name} direction="row" alignItems="center" spacing={1} sx={{ py: 0.625 }}>
                  <Typography sx={{ width: 14, fontSize: '0.7rem', fontWeight: 800, color: ['#FFAB00', '#919EAB', '#CD7F32'][i] ?? 'text.disabled', textAlign: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </Typography>
                  <Avatar src={s.avatarUrl} sx={{ width: 22, height: 22, fontSize: '0.6rem', flexShrink: 0 }}>{s.name?.charAt(0)}</Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, flex: 1 }}>{s.name.split(' ')[0]}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: i === 0 ? 'warning.main' : 'text.primary', flexShrink: 0 }}>{s.goals}</Typography>
                </Stack>
              ))}
              {stats.topScorers.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>Sin goles</Typography>
              )}
            </Stack>

            <Divider orientation="vertical" flexItem />

            {/* Assists */}
            <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: 'text.disabled', letterSpacing: 0.5, mb: 1, display: 'block' }}>
                ASISTENCIAS
              </Typography>
              {stats.topAssists.slice(0, 5).map((s, i) => (
                <Stack key={s.name} direction="row" alignItems="center" spacing={1} sx={{ py: 0.625 }}>
                  <Typography sx={{ width: 14, fontSize: '0.7rem', fontWeight: 800, color: ['#FFAB00', '#919EAB', '#CD7F32'][i] ?? 'text.disabled', textAlign: 'center', flexShrink: 0 }}>
                    {i + 1}
                  </Typography>
                  <Avatar src={s.avatarUrl} sx={{ width: 22, height: 22, fontSize: '0.6rem', flexShrink: 0 }}>{s.name?.charAt(0)}</Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, flex: 1 }}>{s.name.split(' ')[0]}</Typography>
                  <Typography sx={{ fontWeight: 900, fontSize: '0.9rem', color: i === 0 ? 'primary.main' : 'text.primary', flexShrink: 0 }}>{s.assists}</Typography>
                </Stack>
              ))}
              {stats.topAssists.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>Sin asist.</Typography>
              )}
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* ── Player contribution matrix ───────────────────────────────── */}
      {playerMatrix.length > 0 && chronoTours.length > 1 && (
        <Card sx={{ overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.1)}` }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify icon="mdi:grid" width={18} sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Mapa de Contribuciones</Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>Jugadores × partidos</Typography>
            </Stack>
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="flex-end">
              {[
                { label: 'Gol', color: '#22C55E' },
                { label: 'Asist.', color: '#0C68E9' },
                { label: 'MVP', color: '#FFAB00' },
                { label: 'Amarilla', color: '#FFF5CC' },
                { label: 'Roja', color: '#FF5630' },
              ].map((l) => (
                <Stack key={l.label} direction="row" alignItems="center" spacing={0.4}>
                  <Box sx={{ width: 8, height: 8, borderRadius: 0.5, bgcolor: l.color, opacity: 0.8 }} />
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>{l.label}</Typography>
                </Stack>
              ))}
            </Stack>
          </Stack>

          <Box sx={{ overflowX: 'auto', px: 2.5, py: 2, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { bgcolor: (t) => alpha(t.palette.grey[500], 0.2), borderRadius: 2 } }}>
            {/* Header row: match dates */}
            <Stack direction="row" sx={{ mb: 0.75, minWidth: 'max-content' }}>
              <Box sx={{ width: 120, flexShrink: 0 }} />
              {chronoTours.map((t, i) => (
                <Tooltip key={i} title={t.name} arrow>
                  <Box sx={{ width: 28, height: 28, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', mr: 0.5 }}>
                    <Box sx={{ width: 20, height: 20, borderRadius: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: (() => { const r = resultType(t); return r === 'W' ? alpha('#22C55E', 0.15) : r === 'D' ? alpha('#FFAB00', 0.15) : alpha('#FF5630', 0.12); })() }}>
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: (() => { const r = resultType(t); return r === 'W' ? '#22C55E' : r === 'D' ? '#FFAB00' : '#FF5630'; })() }}>
                        {resultType(t)}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              ))}
            </Stack>

            {/* Player rows */}
            {playerMatrix.map((player) => (
              <Stack key={player.name} direction="row" alignItems="center" sx={{ mb: 0.5, minWidth: 'max-content' }}>
                <Stack direction="row" alignItems="center" spacing={0.75} sx={{ width: 120, flexShrink: 0, pr: 1 }}>
                  <Avatar src={player.avatarUrl} sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>{player.name?.charAt(0)}</Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, fontSize: '0.7rem' }}>{player.name.split(' ')[0]}</Typography>
                </Stack>
                {player.cells.map((cell, ci) => {
                  const cellConfig = {
                    goal:   { bg: alpha('#22C55E', 0.3), border: '#22C55E', icon: 'mdi:soccer', iconColor: '#22C55E' },
                    assist: { bg: alpha('#0C68E9', 0.2), border: '#0C68E9', icon: 'mdi:shoe-cleat', iconColor: '#6BB1F8' },
                    mvp:    { bg: alpha('#FFAB00', 0.25), border: '#FFAB00', icon: 'solar:star-bold', iconColor: '#FFAB00' },
                    yellow: { bg: alpha('#FFAB00', 0.12), border: alpha('#FFAB00', 0.4), icon: 'mdi:card', iconColor: '#FFAB00' },
                    red:    { bg: alpha('#FF5630', 0.2), border: '#FF5630', icon: 'mdi:card', iconColor: '#FF5630' },
                    late:   { bg: alpha('#8E33FF', 0.12), border: alpha('#8E33FF', 0.4), icon: 'mdi:clock-alert', iconColor: '#C684FF' },
                    played: { bg: alpha('#919EAB', 0.06), border: 'transparent', icon: null },
                  }[cell] || { bg: alpha('#919EAB', 0.03), border: 'transparent', icon: null };

                  return (
                    <Box key={ci} sx={{ width: 28, height: 28, mr: 0.5, flexShrink: 0, borderRadius: 0.75, bgcolor: cell === null ? 'transparent' : cellConfig.bg, border: `1px solid ${cell === null ? 'transparent' : cellConfig.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cellConfig.icon && <Iconify icon={cellConfig.icon} width={12} sx={{ color: cellConfig.iconColor }} />}
                    </Box>
                  );
                })}
              </Stack>
            ))}
          </Box>
        </Card>
      )}

      {/* ── AI Insight cards ─────────────────────────────────────────── */}
      {insights.length > 0 && (
        <Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
            <Iconify icon="mdi:creation" width={16} sx={{ color: 'primary.main' }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>RECOMENDACIONES IA</Typography>
          </Stack>
          <Box
            display="grid"
            gap={1.5}
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
          >
            {insights.map((ins, i) => {
              const accent = { success: '#22C55E', error: '#FF5630', warning: '#FFAB00', info: '#00B8D9', primary: '#0C68E9' }[ins.color] || '#0C68E9';
              return (
                <Card
                  key={i}
                  sx={{
                    p: 2,
                    borderLeft: `3px solid ${accent}`,
                    bgcolor: (t) => alpha(accent, 0.04),
                    border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.1)}`,
                    borderLeftColor: accent,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: (t) => t.shadows[4] },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                    <Iconify icon={ins.icon} width={16} sx={{ color: accent }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, color: accent, letterSpacing: 0.3 }}>
                      {ins.title.toUpperCase()}
                    </Typography>
                  </Stack>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6, display: 'block' }}>
                    {ins.body}
                  </Typography>
                </Card>
              );
            })}
          </Box>
        </Box>
      )}

      <Divider sx={{ borderStyle: 'dashed' }} />
    </Stack>
  );
}
