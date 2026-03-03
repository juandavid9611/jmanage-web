import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { useGetStats, useGetTeams, useGetBracket } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STAT_CARDS = [
  { key: 'total_matches', label: 'Partidos', icon: 'mdi:soccer-field', color: 'primary' },
  { key: 'matches_played', label: 'Jugados', icon: 'mdi:check-circle', color: 'success' },
  { key: 'total_goals', label: 'Goles', icon: 'mdi:soccer', color: 'warning' },
  { key: 'average_goals_per_match', label: 'Goles/Partido', icon: 'mdi:chart-line', color: 'info', decimals: 1 },
  { key: 'total_yellow_cards', label: 'Amarillas', icon: 'mdi:card', color: 'warning' },
  { key: 'total_red_cards', label: 'Rojas', icon: 'mdi:card', color: 'error' },
  { key: 'total_teams', label: 'Equipos', icon: 'mdi:shield-half-full', color: 'primary' },
  { key: 'current_matchweek', label: 'Jornada Actual', icon: 'mdi:calendar-today', color: 'info' },
];

export function StatsOverview({ tournamentId, tournament }) {
  const { stats, statsLoading } = useGetStats(tournamentId);
  const { bracket } = useGetBracket(tournamentId);
  const { teams } = useGetTeams(tournamentId);

  const championId = bracket?.final?.[0]?.winner_team_id;
  const champion = championId ? teams?.find((t) => t.id === championId) : null;

  if (statsLoading || !stats) return null;

  return (
    <Stack spacing={3}>
      {champion && (
        <Card
          sx={{
            p: 4,
            textAlign: 'center',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.warning.lighter} 0%, ${theme.palette.warning.light} 100%)`,
            border: (theme) => `2px solid ${theme.palette.warning.main}`,
          }}
        >
          <Stack alignItems="center" spacing={1}>
            <Iconify icon="mdi:trophy" width={56} sx={{ color: 'warning.dark' }} />
            <Typography variant="overline" color="warning.dark" letterSpacing={3}>
              Campeón
            </Typography>
            <Typography variant="h3" color="warning.darker" fontWeight={800}>
              {champion.name}
            </Typography>
            {champion.short_name && champion.short_name !== champion.name && (
              <Typography variant="subtitle1" color="warning.dark">
                {champion.short_name}
              </Typography>
            )}
            {tournament?.season && (
              <Typography variant="body2" color="warning.dark">
                Temporada {tournament.season}
              </Typography>
            )}
          </Stack>
        </Card>
      )}

      <Box
        gap={3}
        display="grid"
        gridTemplateColumns={{
          xs: 'repeat(2, 1fr)',
          sm: 'repeat(3, 1fr)',
          md: 'repeat(4, 1fr)',
        }}
      >
        {STAT_CARDS.map((card) => {
          const value = stats[card.key];
          const displayValue = card.decimals ? Number(value).toFixed(card.decimals) : value;

          return (
            <Card key={card.key} sx={{ p: 3 }}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon={card.icon} width={24} sx={{ color: `${card.color}.main` }} />
                  <Typography variant="subtitle2" color="text.secondary">
                    {card.label}
                  </Typography>
                </Stack>
                <Typography variant="h3">{displayValue ?? 0}</Typography>
              </Stack>
            </Card>
          );
        })}
      </Box>
    </Stack>
  );
}
