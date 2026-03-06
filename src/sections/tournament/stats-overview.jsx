import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { useGetStats, useGetTeams, useGetBracket } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STAT_TILES = [
  { key: 'total_matches',          label: 'Partidos',     icon: 'mdi:soccer-field',    color: 'primary' },
  { key: 'matches_played',         label: 'Jugados',      icon: 'mdi:check-circle',    color: 'success', progressOf: 'total_matches' },
  { key: 'total_goals',            label: 'Goles',        icon: 'mdi:soccer',          color: 'warning' },
  { key: 'average_goals_per_match',label: 'Goles/Partido',icon: 'mdi:chart-line',      color: 'info',    decimals: 1 },
  { key: 'total_yellow_cards',     label: 'Amarillas',    icon: 'mdi:card',            color: 'warning' },
  { key: 'total_red_cards',        label: 'Rojas',        icon: 'mdi:card',            color: 'error' },
  { key: 'total_teams',            label: 'Equipos',      icon: 'mdi:shield-half-full',color: 'primary' },
  { key: 'current_matchweek',      label: 'Jornada',      icon: 'mdi:calendar-today',  color: 'info' },
];

// ----------------------------------------------------------------------

export function StatsOverview({ tournamentId, tournament }) {
  const { stats, statsLoading } = useGetStats(tournamentId);
  const { bracket } = useGetBracket(tournamentId);
  const { teams } = useGetTeams(tournamentId);

  const championId = bracket?.final?.[0]?.winner_team_id;
  const champion = championId ? teams?.find((t) => t.id === championId) : null;

  if (statsLoading || !stats) return null;

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
            bgcolor: (t) => alpha(t.palette.warning.main, 0.06),
            border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.2)}`,
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
              bgcolor: (t) => alpha(t.palette.warning.main, 0.12),
              flexShrink: 0,
            }}
          >
            <Iconify icon="mdi:trophy" width={24} sx={{ color: 'warning.main' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="caption" sx={{ color: 'warning.dark', fontWeight: 700, display: 'block', lineHeight: 1, mb: 0.25 }}>
              CAMPEÓN
            </Typography>
            <Typography variant="h6" sx={{ color: 'warning.darker', fontWeight: 800, lineHeight: 1.2 }} noWrap>
              {champion.name}
            </Typography>
            {tournament?.season && (
              <Typography variant="caption" sx={{ color: 'warning.dark' }}>
                Temporada {tournament.season}
              </Typography>
            )}
          </Box>
          <Iconify icon="mdi:laurel-wreath" width={32} sx={{ color: (t) => alpha(t.palette.warning.main, 0.3), flexShrink: 0 }} />
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
          const value = tile.decimals ? Number(raw).toFixed(tile.decimals) : (raw ?? 0);
          const progressPct = tile.progressOf
            ? Math.min((Number(raw) / (stats[tile.progressOf] || 1)) * 100, 100)
            : null;

          return (
            <StatTile
              key={tile.key}
              icon={tile.icon}
              color={tile.color}
              label={tile.label}
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
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
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
            bgcolor: (t) => alpha(t.palette[color].main, 0.1),
            flexShrink: 0,
          }}
        >
          <Iconify icon={icon} width={15} sx={{ color: `${color}.main` }} />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, lineHeight: 1 }}>
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
            bgcolor: (t) => alpha(t.palette[color].main, 0.1),
            '& .MuiLinearProgress-bar': { borderRadius: 1 },
          }}
        />
      )}
    </Box>
  );
}
