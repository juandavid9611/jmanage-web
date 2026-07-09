import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

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
  let wins = 0;
  let draws = 0;
  let losses = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let totalYellow = 0;
  let totalRed = 0;
  let totalLate = 0;
  let totalMvp = 0;
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
      if (b.redCard) totalRed += 1;
      if (b.late) totalLate += 1;
      if (b.mvp) totalMvp += 1;
      if (b.goals > 0) {
        scorerMap[b.name] = scorerMap[b.name] || { name: b.name, avatarUrl: b.avatarUrl, goals: 0 };
        scorerMap[b.name].goals += b.goals;
      }
      if (b.assists > 0) {
        assistMap[b.name] = assistMap[b.name] || {
          name: b.name,
          avatarUrl: b.avatarUrl,
          assists: 0,
        };
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

  const attackScore = Math.min(Math.round((goalsFor / Math.max(played, 1) / 2.5) * 100), 100);
  const defenseScore = Math.max(
    Math.round(100 - (goalsAgainst / Math.max(played, 1) / 2) * 100),
    0
  );
  const disciplineScore = Math.max(
    Math.round(100 - (totalYellow * 5 + totalRed * 20) / Math.max(played, 1)),
    0
  );
  const consistScore = winRate;
  const teamworkScore =
    goalsFor > 0 ? Math.min(Math.round((totalAssists / goalsFor) * 100), 100) : 40;

  const healthScore = Math.min(
    Math.max(
      Math.round(
        winRate * 0.45 + Math.min(Math.max(goalDiff * 3, -15), 20) + disciplineScore * 0.25
      ),
      0
    ),
    100
  );

  return {
    played,
    wins,
    draws,
    losses,
    goalsFor,
    goalsAgainst,
    goalDiff,
    winRate,
    totalYellow,
    totalRed,
    totalLate,
    totalMvp,
    totalAssists,
    topScorers,
    topAssists,
    radar: [attackScore, defenseScore, disciplineScore, consistScore, teamworkScore],
    healthScore,
  };
}

// ── AI narrative ───────────────────────────────────────────────────────

function buildNarrative(stats, last5, t) {
  const {
    wins,
    draws,
    losses,
    played,
    winRate,
    goalsFor,
    goalsAgainst,
    goalDiff,
    topScorers,
    totalYellow,
    totalRed,
  } = stats;
  const recentWins = last5.filter(
    (tour) => (tour.scores?.home ?? 0) > (tour.scores?.away ?? 0)
  ).length;
  const recentLoss = last5.filter(
    (tour) => (tour.scores?.home ?? 0) < (tour.scores?.away ?? 0)
  ).length;

  let opening = '';
  if (winRate >= 70)
    opening = `${t('label_narrative_excellent_prefix')} ${wins}V/${draws}E/${losses}D (${winRate}${t('label_narrative_excellent_suffix')}`;
  else if (winRate >= 50)
    opening = `${t('label_narrative_positive_prefix')} ${wins}V/${draws}E/${losses}D. ${t('label_narrative_positive_suffix')}`;
  else if (winRate >= 30)
    opening = `${t('label_narrative_irregular_prefix')} ${wins} ${t('label_narrative_wins_in')} ${played} ${t('word_matches')}. ${t('label_narrative_irregular_suffix')}`;
  else
    opening = `${t('label_narrative_difficult_prefix')} ${wins} ${t('label_narrative_wins_in')} ${played} ${t('word_matches')}. ${t('label_narrative_difficult_suffix')}`;

  let formLine = '';
  if (recentWins >= 4)
    formLine = ` ${t('label_narrative_form_streak_prefix')} ${recentWins}/5 ${t('label_narrative_form_streak_suffix')}`;
  else if (recentLoss >= 3)
    formLine = ` ${t('label_narrative_form_worrying_prefix')} ${recentLoss} ${t('label_narrative_form_worrying_suffix')}`;
  else if (recentWins >= 2)
    formLine = ` ${t('label_narrative_form_acceptable_prefix')} (${recentWins}/5) ${t('label_narrative_form_acceptable_suffix')}`;

  let goalsLine = '';
  if (goalDiff >= 8)
    goalsLine = ` ${t('label_narrative_goals_dominance_prefix')}${goalDiff} ${t('label_narrative_goals_dominance_suffix')}`;
  else if (goalDiff <= -4)
    goalsLine = ` ${t('label_narrative_goals_negative_prefix')} (${goalDiff}) ${t('label_narrative_goals_negative_suffix')}`;
  else if (goalsFor > goalsAgainst)
    goalsLine = ` ${t('label_narrative_goals_positive_prefix')} ${goalsFor} ${t('label_narrative_goals_positive_mid')} ${goalsAgainst} ${t('label_narrative_goals_positive_suffix')}`;

  let playerLine = '';
  if (topScorers[0]?.goals > 0) {
    playerLine = ` ${topScorers[0].name} ${t('label_led_the_offense_with')} ${topScorers[0].goals} ${topScorers[0].goals > 1 ? t('word_goals') : t('word_goal')}`;
    if (topScorers[1]?.goals > 0)
      playerLine += ` ${t('label_and')} ${topScorers[1].name} ${t('label_contributes')} ${topScorers[1].goals} ${t('label_more')}`;
    playerLine += '.';
  }

  let discLine = '';
  const cardsPerMatch = (totalYellow + totalRed * 3) / Math.max(played, 1);
  if (totalRed > 1)
    discLine = ` ${totalRed} ${t('label_ejections_plural')} ${t('label_discipline_alarm_suffix')}`;
  else if (cardsPerMatch < 0.5) discLine = ` ${t('label_narrative_good_discipline')}`;

  return opening + (formLine || '') + (goalsLine || '') + (playerLine || '') + (discLine || '');
}

// ── AI Insights generator ──────────────────────────────────────────────

function buildInsights(stats, chronoTours, t) {
  const insights = [];
  const {
    winRate,
    goalsFor,
    goalsAgainst,
    played,
    topScorers,
    totalYellow,
    totalRed,
    totalLate,
    radar,
  } = stats;
  const last3 = chronoTours.slice(-3);
  const last3Goals = last3.reduce((s, tour) => s + (tour.scores?.home ?? 0), 0);
  const prevGoals = chronoTours.slice(-6, -3).reduce((s, tour) => s + (tour.scores?.home ?? 0), 0);

  // Offensive trend
  if (last3Goals > prevGoals && prevGoals > 0) {
    insights.push({
      icon: 'mdi:trending-up',
      color: 'success',
      title: t('label_insight_offensive_streak_title'),
      body: `${last3Goals} ${t('label_insight_offensive_streak_body_mid')} ${prevGoals} ${t('label_insight_offensive_streak_body_suffix')}`,
    });
  } else if (last3Goals < prevGoals && last3Goals <= 1) {
    insights.push({
      icon: 'mdi:trending-down',
      color: 'error',
      title: t('label_insight_scoring_drought_title'),
      body: `${t('label_only')} ${last3Goals} ${t('label_insight_scoring_drought_body_suffix')}`,
    });
  }

  // Top scorer dependency
  const topGoals = topScorers[0]?.goals || 0;
  const topShare = goalsFor > 0 ? Math.round((topGoals / goalsFor) * 100) : 0;
  if (topShare > 50 && topGoals > 2) {
    insights.push({
      icon: 'mdi:alert-circle-outline',
      color: 'warning',
      title: t('label_insight_offensive_dependency_title'),
      body: `${topScorers[0].name} ${t('label_insight_offensive_dependency_body_mid')} ${topShare}${t('label_insight_offensive_dependency_body_suffix')}`,
    });
  } else if (topScorers.length >= 3 && topShare < 35) {
    insights.push({
      icon: 'mdi:check-decagram',
      color: 'success',
      title: t('label_insight_choral_attack_title'),
      body: `${topScorers.length} ${t('label_insight_choral_attack_body_suffix')}`,
    });
  }

  // Defense
  const goalsAgainstPM = goalsAgainst / Math.max(played, 1);
  if (goalsAgainstPM < 0.8) {
    insights.push({
      icon: 'mdi:shield-check',
      color: 'success',
      title: t('label_insight_defensive_solidity_title'),
      body: `${t('label_only')} ${goalsAgainst} ${t('label_insight_defensive_solidity_body_mid')} ${played} ${t('word_matches')} (${goalsAgainstPM.toFixed(1)}${t('label_insight_defensive_solidity_body_suffix')}`,
    });
  } else if (goalsAgainstPM > 2) {
    insights.push({
      icon: 'mdi:shield-alert',
      color: 'error',
      title: t('label_insight_defensive_fragility_title'),
      body: `${t('label_insight_defensive_fragility_body_prefix')} ${goalsAgainstPM.toFixed(1)} ${t('label_insight_defensive_fragility_body_suffix')}`,
    });
  }

  // Discipline
  if (totalRed > 0) {
    insights.push({
      icon: 'mdi:card-remove',
      color: 'error',
      title: t('label_insight_red_alert_title'),
      body: `${totalRed} ${totalRed > 1 ? t('label_ejections_plural') : t('label_ejection_singular')} ${t('label_alert_red_suffix')}`,
    });
  }
  if (totalLate >= 3 && played > 0) {
    insights.push({
      icon: 'mdi:clock-alert',
      color: 'warning',
      title: t('label_insight_team_punctuality_title'),
      body: `${totalLate} ${t('label_insight_team_punctuality_body_suffix')}`,
    });
  }

  // Radar weakness
  const radarLabels = [
    t('label_radar_attack'),
    t('label_radar_defense'),
    t('label_radar_discipline'),
    t('label_radar_consistency'),
    t('label_radar_teamwork'),
  ];
  const minIdx = radar.indexOf(Math.min(...radar));
  if (radar[minIdx] < 40) {
    insights.push({
      icon: 'mdi:target',
      color: 'info',
      title: `${t('label_insight_area_to_improve_prefix')}: ${radarLabels[minIdx]}`,
      body: `${t('label_insight_radar_weakness_body_prefix')} ${radarLabels[minIdx]} ${t('label_insight_radar_weakness_body_mid')} ${radar[minIdx]}${t('label_insight_radar_weakness_body_suffix')}`,
    });
  }

  // Win rate ceiling
  if (winRate >= 60 && played >= 5) {
    insights.push({
      icon: 'mdi:trophy',
      color: 'success',
      title: t('label_insight_local_elite_title'),
      body: `${t('label_insight_local_elite_body_prefix')} ${winRate}${t('label_insight_local_elite_body_mid')} ${played} ${t('label_insight_local_elite_body_suffix')}`,
    });
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
  const { t } = useTranslation();
  const theme = useTheme();

  const chronoTours = useMemo(() => orderBy(tours, ['available.startDate'], ['asc']), [tours]);
  const stats = useMemo(() => computeStats(tours), [tours]);
  const narrative = useMemo(
    () => buildNarrative(stats, chronoTours.slice(-5), t),
    [stats, chronoTours, t]
  );
  const insights = useMemo(() => buildInsights(stats, chronoTours, t), [stats, chronoTours, t]);

  const last8 = chronoTours.slice(-8);

  // ── Charts ────────────────────────────────────────────────────────

  const trendLabels = chronoTours.map((tour) =>
    tour.available?.startDate
      ? new Date(tour.available.startDate).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
        })
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
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
      labels: { colors: theme.vars.palette.text.primary },
    },
  });

  const radarOptions = useChart({
    colors: [theme.palette.primary.main],
    chart: { type: 'radar' },
    fill: { opacity: 0.18 },
    stroke: { width: 2 },
    markers: { size: 4 },
    xaxis: {
      categories: [
        t('label_radar_attack'),
        t('label_radar_defense'),
        t('label_radar_discipline'),
        t('label_radar_consistency'),
        t('label_radar_teamwork_short'),
      ],
    },
    yaxis: { show: false, min: 0, max: 100 },
    plotOptions: { radar: { polygons: { fill: { colors: ['transparent'] } } } },
  });

  // Mock: goals by period (seeded per tour)
  const goalsByPeriod = useMemo(() => {
    const periods = [0, 0, 0, 0];
    tours.forEach((tour) => {
      const g = tour.scores?.home ?? 0;
      for (let i = 0; i < g; i += 1) {
        const p = seededVal(tour.id + String(i), 0, 3);
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
    tooltip: { y: { formatter: (v) => `${v} ${t('word_goals')}` } },
    legend: { show: false },
    dataLabels: { enabled: true, style: { fontSize: '11px', fontWeight: 700 } },
  });

  const healthRadialOptions = useChart({
    colors: [
      theme.palette[
        stats.healthScore >= 70
          ? 'success'
          : stats.healthScore >= 50
            ? 'primary'
            : stats.healthScore >= 30
              ? 'warning'
              : 'error'
      ].main,
    ],
    plotOptions: {
      radialBar: {
        hollow: { size: '65%', margin: 0 },
        track: { margin: 0 },
        dataLabels: {
          value: { fontSize: '22px', fontWeight: 900 },
          total: { show: true, label: t('label_score'), color: theme.vars.palette.text.disabled },
        },
      },
    },
    labels: [t('label_score')],
  });

  const donutOptions = useChart({
    colors: [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main],
    chart: { type: 'donut' },
    labels: [t('label_wins_plural'), t('label_draws_plural'), t('label_losses_plural')],
    plotOptions: {
      pie: { donut: { size: '72%', labels: { value: { fontSize: '20px', fontWeight: 800 } } } },
    },
    legend: { show: true, position: 'bottom', labels: { colors: theme.vars.palette.text.primary } },
  });

  // Player contribution matrix
  const playerMatrix = useMemo(() => {
    const nameMap = {};
    chronoTours.forEach((tour) => {
      Object.values(tour.bookers || {}).forEach((b) => {
        if (!nameMap[b.name])
          nameMap[b.name] = { name: b.name, avatarUrl: b.avatarUrl, totalScore: 0 };
        nameMap[b.name].totalScore +=
          b.goals * 3 +
          b.assists * 2 +
          (b.mvp ? 2 : 0) -
          (b.yellowCard ? 1 : 0) -
          (b.redCard ? 3 : 0);
      });
    });
    const players = orderBy(Object.values(nameMap), ['totalScore'], ['desc']).slice(0, 10);
    return players.map((p) => ({
      ...p,
      cells: chronoTours.map((tour) => {
        const b = Object.values(tour.bookers || {}).find((bk) => bk.name === p.name);
        if (!b) return null;
        const events = [];
        if (b.redCard) events.push('red');
        if (b.mvp) events.push('mvp');
        if (b.goals > 0) events.push('goal');
        if (b.assists > 0) events.push('assist');
        if (b.yellowCard) events.push('yellow');
        if (b.late) events.push('late');
        if (events.length === 0) events.push('played');
        return { events, goalCount: b.goals, assistCount: b.assists };
      }),
    }));
  }, [chronoTours]);

  const [matrixFilter, setMatrixFilter] = useState(null);

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
            background:
              'radial-gradient(ellipse 60% 80% at 80% 50%, rgba(142,51,255,0.12) 0%, transparent 60%), radial-gradient(ellipse 40% 60% at 20% 80%, rgba(12,104,233,0.1) 0%, transparent 50%)',
            pointerEvents: 'none',
          },
        }}
      >
        <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3 }}>
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            spacing={2}
            sx={{ mb: 2.5 }}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #0C68E9, #8E33FF)',
                }}
              >
                <Iconify icon="mdi:creation" width={18} sx={{ color: 'white' }} />
              </Box>
              <Stack>
                <Typography
                  variant="overline"
                  sx={{
                    color: 'rgba(255,255,255,0.35)',
                    lineHeight: 1,
                    fontSize: '0.62rem',
                    letterSpacing: 1.5,
                  }}
                >
                  {t('label_season_analysis').toUpperCase()}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: 'common.white', fontWeight: 700, lineHeight: 1.2 }}
                >
                  {t('label_performance_report')}
                </Typography>
              </Stack>
            </Stack>
            <Chip
              label={t('label_ai_badge')}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.6rem',
                fontWeight: 900,
                letterSpacing: 1,
                background: 'linear-gradient(135deg, #0C68E9, #8E33FF)',
                color: 'white',
                flexShrink: 0,
              }}
            />
          </Stack>

          <Typography
            variant="body2"
            sx={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.8, mb: 3, maxWidth: 760 }}
          >
            {narrative}
          </Typography>

          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
          >
            {[
              { label: t('word_matches').toUpperCase(), value: stats.played, color: '#6BB1F8' },
              {
                label: t('label_effectiveness').toUpperCase(),
                value: `${stats.winRate}%`,
                color: stats.winRate >= 50 ? '#22C55E' : '#FFAB00',
              },
              {
                label: t('label_goals_scored').toUpperCase(),
                value: stats.goalsFor,
                color: '#0C68E9',
              },
              {
                label: t('label_difference').toUpperCase(),
                value: (stats.goalDiff >= 0 ? '+' : '') + stats.goalDiff,
                color: stats.goalDiff >= 0 ? '#22C55E' : '#FF5630',
              },
            ].map((k) => (
              <Box key={k.label} sx={{ borderLeft: `2px solid ${alpha(k.color, 0.6)}`, pl: 1.5 }}>
                <Typography
                  sx={{ color: k.color, fontSize: '1.75rem', fontWeight: 900, lineHeight: 1 }}
                >
                  {k.value}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: 'rgba(255,255,255,0.35)', fontWeight: 700, letterSpacing: 0.5 }}
                >
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
          <Typography
            variant="overline"
            sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}
          >
            {t('label_club_health').toUpperCase()}
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
            {[
              { l: t('label_result_abbr_win'), v: stats.wins, c: 'success.main' },
              { l: t('label_result_abbr_draw'), v: stats.draws, c: 'warning.main' },
              { l: t('label_result_abbr_loss'), v: stats.losses, c: 'error.main' },
            ].map((r) => (
              <Stack key={r.l} alignItems="center" spacing={0}>
                <Typography sx={{ fontSize: '1.1rem', fontWeight: 800, color: r.c, lineHeight: 1 }}>
                  {r.v}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700 }}>
                  {r.l}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Form strip */}
        <Card sx={{ p: 2.5 }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}
          >
            {t('label_last_n_matches_prefix')} {last8.length} {t('label_last_n_matches_suffix')}
          </Typography>
          <Stack direction="row" spacing={0.75} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.75 }}>
            {last8.map((tour, i) => {
              const r = resultType(tour);
              const col = r === 'W' ? 'success' : r === 'D' ? 'warning' : 'error';
              return (
                <Tooltip
                  key={i}
                  title={`${tour.name} · ${tour.scores?.home ?? 0}–${tour.scores?.away ?? 0}`}
                  arrow
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: (th) => alpha(th.palette[col].main, 0.15),
                      border: (th) => `1.5px solid ${alpha(th.palette[col].main, 0.4)}`,
                      cursor: 'default',
                    }}
                  >
                    <Typography sx={{ fontSize: '0.7rem', fontWeight: 900, color: `${col}.main` }}>
                      {r}
                    </Typography>
                  </Box>
                </Tooltip>
              );
            })}
          </Stack>
          <Divider sx={{ my: 1.75 }} />
          <Stack direction="row" justifyContent="space-between">
            {[
              {
                label: t('label_current_streak'),
                value: (() => {
                  let s = 0;
                  const last = resultType(last8[last8.length - 1]);
                  for (let i = last8.length - 1; i >= 0; i -= 1) {
                    if (resultType(last8[i]) === last) s += 1;
                    else break;
                  }
                  return `${s} ${last === 'W' ? t('label_wins_plural') : last === 'D' ? t('label_draws_plural') : t('label_losses_plural')}`;
                })(),
              },
              {
                label: t('label_goals_per_match'),
                value: (stats.goalsFor / Math.max(stats.played, 1)).toFixed(1),
              },
              {
                label: t('label_goals_against_per_match'),
                value: (stats.goalsAgainst / Math.max(stats.played, 1)).toFixed(1),
              },
            ].map((m) => (
              <Stack key={m.label} alignItems="center">
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  {m.value}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {m.label}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Win distribution donut */}
        <Card sx={{ p: 2.5, textAlign: 'center' }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.disabled', fontSize: '0.6rem', letterSpacing: 1.5 }}
          >
            {t('label_results_distribution').toUpperCase()}
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
          <Stack
            direction="row"
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Stack spacing={0.25}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('label_results_evolution')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('label_goals_for_vs_against_per_match')}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.75}>
              <Chip
                label={`${stats.goalsFor} ${t('label_gf_abbr')}`}
                size="small"
                color="primary"
                variant="soft"
                sx={{ fontWeight: 700 }}
              />
              <Chip
                label={`${stats.goalsAgainst} ${t('label_ga_abbr')}`}
                size="small"
                color="error"
                variant="soft"
                sx={{ fontWeight: 700 }}
              />
            </Stack>
          </Stack>
          <Chart
            type="area"
            series={[
              { name: t('label_for'), data: chronoTours.map((tour) => tour.scores?.home ?? 0) },
              { name: t('label_against'), data: chronoTours.map((tour) => tour.scores?.away ?? 0) },
            ]}
            options={trendOptions}
            height={200}
          />
        </Card>

        {/* Radar */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('label_team_profile')}
            </Typography>
            <Chip
              label={t('label_ai_badge')}
              size="small"
              sx={{
                height: 16,
                fontSize: '0.58rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg,#0C68E9,#8E33FF)',
                color: 'white',
              }}
            />
          </Stack>
          <Chart
            type="radar"
            series={[{ name: t('label_team_singular'), data: stats.radar }]}
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
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('label_scoring_minutes')}
            </Typography>
            <Chip
              label={t('label_simulated')}
              size="small"
              variant="outlined"
              sx={{
                height: 16,
                fontSize: '0.58rem',
                color: 'text.disabled',
                borderColor: 'divider',
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1.5 }}>
            {t('label_scoring_minutes_subtitle')}
          </Typography>
          <Chart
            type="bar"
            series={[{ name: t('word_goals'), data: goalsByPeriod }]}
            options={periodOptions}
            height={180}
          />
        </Card>

        {/* Top scorers + Top assists */}
        <Card sx={{ p: 2.5 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:trophy-outline" width={18} sx={{ color: 'warning.main' }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('label_individual_leaders')}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={3}>
            {/* Scorers */}
            <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'text.disabled',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block',
                }}
              >
                {t('label_top_scorers').toUpperCase()}
              </Typography>
              {stats.topScorers.slice(0, 5).map((s, i) => (
                <Stack
                  key={s.name}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 0.625 }}
                >
                  <Typography
                    sx={{
                      width: 14,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: ['#FFAB00', '#919EAB', '#CD7F32'][i] ?? 'text.disabled',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Typography>
                  <Avatar
                    src={s.avatarUrl}
                    sx={{ width: 22, height: 22, fontSize: '0.6rem', flexShrink: 0 }}
                  >
                    {s.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, flex: 1 }}>
                    {s.name.split(' ')[0]}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      color: i === 0 ? 'warning.main' : 'text.primary',
                      flexShrink: 0,
                    }}
                  >
                    {s.goals}
                  </Typography>
                </Stack>
              ))}
              {stats.topScorers.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {t('label_no_goals')}
                </Typography>
              )}
            </Stack>

            <Divider orientation="vertical" flexItem />

            {/* Assists */}
            <Stack spacing={0} sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  color: 'text.disabled',
                  letterSpacing: 0.5,
                  mb: 1,
                  display: 'block',
                }}
              >
                {t('label_assists').toUpperCase()}
              </Typography>
              {stats.topAssists.slice(0, 5).map((s, i) => (
                <Stack
                  key={s.name}
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ py: 0.625 }}
                >
                  <Typography
                    sx={{
                      width: 14,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: ['#FFAB00', '#919EAB', '#CD7F32'][i] ?? 'text.disabled',
                      textAlign: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </Typography>
                  <Avatar
                    src={s.avatarUrl}
                    sx={{ width: 22, height: 22, fontSize: '0.6rem', flexShrink: 0 }}
                  >
                    {s.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, flex: 1 }}>
                    {s.name.split(' ')[0]}
                  </Typography>
                  <Typography
                    sx={{
                      fontWeight: 900,
                      fontSize: '0.9rem',
                      color: i === 0 ? 'primary.main' : 'text.primary',
                      flexShrink: 0,
                    }}
                  >
                    {s.assists}
                  </Typography>
                </Stack>
              ))}
              {stats.topAssists.length === 0 && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {t('label_no_assists_abbr')}
                </Typography>
              )}
            </Stack>
          </Stack>
        </Card>
      </Box>

      {/* ── Player contribution matrix ───────────────────────────────── */}
      {playerMatrix.length > 0 && chronoTours.length > 1 && (
        <Card sx={{ overflow: 'hidden' }}>
          <Box
            sx={{
              px: 2.5,
              pt: 1.75,
              pb: 1.25,
              borderBottom: (th) => `1px solid ${alpha(th.palette.grey[500], 0.1)}`,
            }}
          >
            {/* Title row */}
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
              <Iconify icon="mdi:grid" width={18} sx={{ color: 'primary.main' }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {t('label_contribution_map')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {t('label_players_times_matches')}
              </Typography>
            </Stack>
            {/* Legend pills row */}
            <Stack direction="row" spacing={0.75} flexWrap="wrap" rowGap={0.75}>
              {[
                { label: t('label_legend_goal'), type: 'goal', color: '#22C55E' },
                { label: t('label_assists_abbr_cap'), type: 'assist', color: '#0C68E9' },
                { label: 'MVP', type: 'mvp', color: '#FFAB00' },
                { label: t('label_yellow_card_singular_short'), type: 'yellow', color: '#FFAB00' },
                { label: t('label_red_card_singular_short'), type: 'red', color: '#FF5630' },
                { label: t('label_late_arrival'), type: 'late', color: '#8E33FF' },
              ].map((l) => {
                const active = matrixFilter === l.type;
                return (
                  <Stack
                    key={l.label}
                    direction="row"
                    alignItems="center"
                    spacing={0.5}
                    onClick={() => setMatrixFilter(active ? null : l.type)}
                    sx={{
                      cursor: 'pointer',
                      px: 1,
                      py: 0.4,
                      borderRadius: 1,
                      border: `1px solid ${active ? alpha(l.color, 0.5) : alpha(l.color, 0.15)}`,
                      bgcolor: active ? alpha(l.color, 0.12) : 'transparent',
                      transition: 'all 0.15s',
                      '&:hover': { bgcolor: alpha(l.color, 0.1), borderColor: alpha(l.color, 0.4) },
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: 0.5,
                        bgcolor: l.color,
                        flexShrink: 0,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        color: active ? l.color : 'text.secondary',
                        fontSize: '0.65rem',
                        fontWeight: active ? 700 : 500,
                        lineHeight: 1,
                      }}
                    >
                      {l.label}
                    </Typography>
                  </Stack>
                );
              })}
              {matrixFilter && (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  onClick={() => setMatrixFilter(null)}
                  sx={{
                    cursor: 'pointer',
                    px: 1,
                    py: 0.4,
                    borderRadius: 1,
                    border: (th) => `1px dashed ${alpha(th.palette.grey[500], 0.3)}`,
                    '&:hover': { bgcolor: (th) => alpha(th.palette.grey[500], 0.06) },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.disabled', fontSize: '0.65rem' }}
                  >
                    {t('label_view_all')}
                  </Typography>
                </Stack>
              )}
            </Stack>
          </Box>

          <Box
            sx={{
              overflowX: 'auto',
              px: 2.5,
              py: 2,
              '&::-webkit-scrollbar': { height: 4 },
              '&::-webkit-scrollbar-thumb': {
                bgcolor: (th) => alpha(th.palette.grey[500], 0.2),
                borderRadius: 2,
              },
            }}
          >
            {/* Header row: match dates */}
            <Stack direction="row" sx={{ mb: 0.75, minWidth: 'max-content' }}>
              <Box sx={{ width: 120, flexShrink: 0 }} />
              {chronoTours.map((tour, i) => (
                <Tooltip key={i} title={tour.name} arrow>
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mr: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 0.75,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: (() => {
                          const r = resultType(tour);
                          return r === 'W'
                            ? alpha('#22C55E', 0.15)
                            : r === 'D'
                              ? alpha('#FFAB00', 0.15)
                              : alpha('#FF5630', 0.12);
                        })(),
                      }}
                    >
                      <Typography
                        sx={{
                          fontSize: '0.55rem',
                          fontWeight: 900,
                          color: (() => {
                            const r = resultType(tour);
                            return r === 'W' ? '#22C55E' : r === 'D' ? '#FFAB00' : '#FF5630';
                          })(),
                        }}
                      >
                        {resultType(tour)}
                      </Typography>
                    </Box>
                  </Box>
                </Tooltip>
              ))}
            </Stack>

            {/* Player rows */}
            {playerMatrix.map((player) => (
              <Stack
                key={player.name}
                direction="row"
                alignItems="center"
                sx={{ mb: 0.5, minWidth: 'max-content' }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.75}
                  sx={{ width: 120, flexShrink: 0, pr: 1 }}
                >
                  <Avatar src={player.avatarUrl} sx={{ width: 20, height: 20, fontSize: '0.6rem' }}>
                    {player.name?.charAt(0)}
                  </Avatar>
                  <Typography variant="caption" noWrap sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                    {player.name.split(' ')[0]}
                  </Typography>
                </Stack>
                {player.cells.map((cell, ci) => {
                  const CELL_CFG = {
                    goal: {
                      bg: alpha('#22C55E', 0.3),
                      border: '#22C55E',
                      icon: 'mdi:soccer',
                      iconColor: '#22C55E',
                    },
                    assist: {
                      bg: alpha('#0C68E9', 0.2),
                      border: '#0C68E9',
                      icon: 'mdi:shoe-cleat',
                      iconColor: '#6BB1F8',
                    },
                    mvp: {
                      bg: alpha('#FFAB00', 0.25),
                      border: '#FFAB00',
                      icon: 'solar:star-bold',
                      iconColor: '#FFAB00',
                    },
                    yellow: {
                      bg: alpha('#FFAB00', 0.12),
                      border: alpha('#FFAB00', 0.4),
                      icon: 'mdi:card',
                      iconColor: '#FFAB00',
                    },
                    red: {
                      bg: alpha('#FF5630', 0.2),
                      border: '#FF5630',
                      icon: 'mdi:card',
                      iconColor: '#FF5630',
                    },
                    late: {
                      bg: alpha('#8E33FF', 0.12),
                      border: alpha('#8E33FF', 0.4),
                      icon: 'mdi:clock-alert',
                      iconColor: '#C684FF',
                    },
                    played: { bg: alpha('#919EAB', 0.06), border: 'transparent', icon: null },
                  };

                  if (cell === null) {
                    return <Box key={ci} sx={{ width: 28, height: 28, mr: 0.5, flexShrink: 0 }} />;
                  }

                  const { events, goalCount, assistCount } = cell;
                  const isMatch = !matrixFilter || events.includes(matrixFilter);
                  const dimmed = matrixFilter && !isMatch;
                  const activeGlow = isMatch && !!matrixFilter;

                  // When a filter is active, show only the filtered event; otherwise show all
                  const displayEvents =
                    matrixFilter && isMatch
                      ? [matrixFilter]
                      : events.filter((ev) => ev !== 'played');

                  // Background/border follow the active filter when matched, else dominant priority
                  const dominantKey = matrixFilter && isMatch ? matrixFilter : events[0];
                  const dominant = CELL_CFG[dominantKey] ?? CELL_CFG.played;

                  // Tooltip label
                  const tipParts = [];
                  if (events.includes('mvp')) tipParts.push('MVP');
                  if (goalCount > 0)
                    tipParts.push(
                      `${goalCount} ${goalCount > 1 ? t('word_goals') : t('word_goal')}`
                    );
                  if (assistCount > 0) tipParts.push(`${assistCount} ${t('label_assists_abbr')}`);
                  if (events.includes('yellow'))
                    tipParts.push(t('label_yellow_card_singular_short'));
                  if (events.includes('red')) tipParts.push(t('label_red_card_singular_short'));
                  if (events.includes('late')) tipParts.push(t('label_late_arrival'));
                  if (tipParts.length === 0) tipParts.push(t('label_played_past'));

                  return (
                    <Tooltip key={ci} title={tipParts.join(' · ')} arrow placement="top">
                      <Box
                        sx={{
                          width: 28,
                          height: 28,
                          mr: 0.5,
                          flexShrink: 0,
                          borderRadius: 0.75,
                          bgcolor: dominant.bg,
                          border: `1px solid ${dominant.border}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: dimmed ? 0.15 : 1,
                          transition: 'opacity 0.2s',
                          ...(activeGlow && { boxShadow: `0 0 0 1.5px ${dominant.border}` }),
                        }}
                      >
                        {displayEvents.length === 0 && null}

                        {/* Single event */}
                        {displayEvents.length === 1 &&
                          (() => {
                            const cfg = CELL_CFG[displayEvents[0]];
                            const count =
                              displayEvents[0] === 'goal'
                                ? goalCount
                                : displayEvents[0] === 'assist'
                                  ? assistCount
                                  : null;
                            return (
                              <Stack
                                direction="row"
                                alignItems="center"
                                spacing={0.25}
                                sx={{ lineHeight: 1 }}
                              >
                                <Iconify
                                  icon={cfg.icon}
                                  width={11}
                                  sx={{ color: cfg.iconColor, flexShrink: 0 }}
                                />
                                {count > 1 && (
                                  <Typography
                                    sx={{
                                      fontSize: '0.55rem',
                                      fontWeight: 900,
                                      color: cfg.iconColor,
                                      lineHeight: 1,
                                    }}
                                  >
                                    {count}
                                  </Typography>
                                )}
                              </Stack>
                            );
                          })()}

                        {/* 2 events */}
                        {displayEvents.length === 2 && (
                          <Stack direction="row" alignItems="center" spacing={0.3}>
                            {displayEvents.map((ev) => {
                              const cfg = CELL_CFG[ev];
                              const count =
                                ev === 'goal' ? goalCount : ev === 'assist' ? assistCount : null;
                              return (
                                <Stack key={ev} direction="row" alignItems="center" spacing={0.15}>
                                  <Iconify
                                    icon={cfg.icon}
                                    width={9}
                                    sx={{ color: cfg.iconColor }}
                                  />
                                  {count > 1 && (
                                    <Typography
                                      sx={{
                                        fontSize: '0.5rem',
                                        fontWeight: 900,
                                        color: cfg.iconColor,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {count}
                                    </Typography>
                                  )}
                                </Stack>
                              );
                            })}
                          </Stack>
                        )}

                        {/* 3+ events: 2x2 mini grid */}
                        {displayEvents.length >= 3 && (
                          <Box
                            sx={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '1px',
                              width: 18,
                              height: 18,
                            }}
                          >
                            {displayEvents.slice(0, 4).map((ev) => {
                              const cfg = CELL_CFG[ev];
                              const count =
                                ev === 'goal' ? goalCount : ev === 'assist' ? assistCount : null;
                              return (
                                <Stack
                                  key={ev}
                                  direction="row"
                                  alignItems="center"
                                  justifyContent="center"
                                  spacing={0.1}
                                >
                                  <Iconify
                                    icon={cfg.icon}
                                    width={7}
                                    sx={{ color: cfg.iconColor }}
                                  />
                                  {count > 1 && (
                                    <Typography
                                      sx={{
                                        fontSize: '0.45rem',
                                        fontWeight: 900,
                                        color: cfg.iconColor,
                                        lineHeight: 1,
                                      }}
                                    >
                                      {count}
                                    </Typography>
                                  )}
                                </Stack>
                              );
                            })}
                          </Box>
                        )}
                      </Box>
                    </Tooltip>
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
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'text.secondary' }}>
              {t('label_ai_recommendations').toUpperCase()}
            </Typography>
          </Stack>
          <Box
            display="grid"
            gap={1.5}
            gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }}
          >
            {insights.map((ins, i) => {
              const accent =
                {
                  success: '#22C55E',
                  error: '#FF5630',
                  warning: '#FFAB00',
                  info: '#00B8D9',
                  primary: '#0C68E9',
                }[ins.color] || '#0C68E9';
              return (
                <Card
                  key={i}
                  sx={{
                    p: 2,
                    borderLeft: `3px solid ${accent}`,
                    bgcolor: (th) => alpha(accent, 0.04),
                    border: (th) => `1px solid ${alpha(th.palette.grey[500], 0.1)}`,
                    borderLeftColor: accent,
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: (th) => th.shadows[4] },
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                    <Iconify icon={ins.icon} width={16} sx={{ color: accent }} />
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 800, color: accent, letterSpacing: 0.3 }}
                    >
                      {ins.title.toUpperCase()}
                    </Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', lineHeight: 1.6, display: 'block' }}
                  >
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
