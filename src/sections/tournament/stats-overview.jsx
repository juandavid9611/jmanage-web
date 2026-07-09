import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useGetStats, useGetPublicStats } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const STAT_TILES = [
  { key: 'total_matches', label: 'word_matches', icon: 'mdi:soccer-field', color: 'primary' },
  {
    key: 'matches_played',
    label: 'label_played',
    icon: 'mdi:check-circle',
    color: 'success',
    progressOf: 'total_matches',
  },
  { key: 'total_goals', label: 'word_goals', icon: 'mdi:soccer', color: 'warning' },
  {
    key: 'average_goals_per_match',
    label: 'label_goals_per_match_stat',
    icon: 'mdi:chart-line',
    color: 'info',
    decimals: 1,
  },
  {
    key: 'total_yellow_cards',
    label: 'label_yellow_cards_plural_short',
    icon: 'mdi:card',
    color: 'warning',
  },
  {
    key: 'total_red_cards',
    label: 'label_red_cards_plural_short',
    icon: 'mdi:card',
    color: 'error',
  },
  { key: 'total_teams', label: 'label_teams', icon: 'mdi:shield-half-full', color: 'primary' },
  { key: 'current_matchweek', label: 'label_matchday', icon: 'mdi:calendar-today', color: 'info' },
];

// ----------------------------------------------------------------------

export function StatsOverview({ tournamentId, tournament, publicMode = false }) {
  const { t } = useTranslation();
  const auth = useGetStats(publicMode ? null : tournamentId);
  const pub = useGetPublicStats(publicMode ? tournamentId : null);
  const { stats, statsLoading } = publicMode ? pub : auth;

  const champion = stats?.champion || null;

  if (statsLoading || !stats) {
    return (
      <Box
        display="grid"
        gap={1.5}
        gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
      >
        {STAT_TILES.map((tile) => (
          <Skeleton key={tile.key} variant="rounded" height={90} />
        ))}
      </Box>
    );
  }

  return (
    <Stack spacing={2}>
      {/* Champion banner */}
      {champion && (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            px: 2.5,
            py: 2,
            borderRadius: 2,
            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.06),
            border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.2)}`,
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:trophy" width={24} sx={{ color: 'warning.main' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="caption"
              sx={{
                color: 'warning.dark',
                fontWeight: 700,
                display: 'block',
                lineHeight: 1,
                mb: 0.25,
              }}
            >
              {t('label_champion').toUpperCase()}
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: 'warning.darker', fontWeight: 800, lineHeight: 1.2 }}
              noWrap
            >
              {champion.name}
            </Typography>
            {tournament?.season && (
              <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                {t('label_season')} {tournament.season}
              </Typography>
            )}
          </Box>
          <Iconify
            icon="mdi:laurel-wreath"
            width={32}
            sx={{ color: (theme) => alpha(theme.palette.warning.main, 0.3), flexShrink: 0 }}
          />
        </Box>
      )}

      {/* Stat tiles grid */}
      <Box
        display="grid"
        gap={1.5}
        gridTemplateColumns={{ xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' }}
      >
        {STAT_TILES.map((tile) => {
          const raw = stats[tile.key];
          const value = tile.decimals ? Number(raw).toFixed(tile.decimals) : raw ?? 0;
          const progressPct = tile.progressOf
            ? Math.min((Number(raw) / (stats[tile.progressOf] || 1)) * 100, 100)
            : null;

          return (
            <StatTile
              key={tile.key}
              icon={tile.icon}
              color={tile.color}
              label={t(tile.label)}
              value={value}
              progressPct={progressPct}
            />
          );
        })}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function StatTile({ icon, color, label, value, progressPct }) {
  return (
    <Box
      sx={{
        px: 2,
        py: 1.75,
        borderRadius: 1.5,
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {/* Icon + label row */}
      <Stack direction="row" alignItems="center" spacing={0.75}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={15} sx={{ color: `${color}.main` }} />
        </Box>
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontWeight: 600, lineHeight: 1 }}
        >
          {label}
        </Typography>
      </Stack>

      {/* Value */}
      <Typography
        sx={{
          fontSize: '1.5rem',
          fontWeight: 700,
          lineHeight: 1,
          color: 'text.primary',
        }}
      >
        {value}
      </Typography>

      {/* Optional progress bar */}
      {progressPct !== null && (
        <LinearProgress
          variant="determinate"
          value={progressPct}
          color={color}
          sx={{
            height: 3,
            borderRadius: 1,
            bgcolor: (theme) => alpha(theme.palette[color].main, 0.1),
            '& .MuiLinearProgress-bar': { borderRadius: 1 },
          }}
        />
      )}
    </Box>
  );
}
