import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const EVENT_CONFIG = {
  goal: { icon: 'mdi:soccer', color: 'success', label: 'Gol' },
  own_goal: { icon: 'mdi:soccer', color: 'error', label: 'Autogol' },
  assist: { icon: 'mdi:shoe-cleat', color: 'info', label: 'Asistencia' },
  yellow_card: { icon: 'mdi:card', color: 'warning', label: 'Amarilla' },
  second_yellow: { icon: 'mdi:card-multiple', color: 'warning', label: '2ª Amarilla' },
  red_card: { icon: 'mdi:card', color: 'error', label: 'Roja' },
  substitution: { icon: 'mdi:swap-horizontal', color: 'info', label: 'Cambio' },
  penalty_scored: { icon: 'mdi:target', color: 'success', label: 'Penal' },
  penalty_missed: { icon: 'mdi:target', color: 'error', label: 'Penal Fallado' },
};

export function MatchEventTimeline({ events, players, teams, editable, onDeleteEvent }) {
  if (!events?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        No hay eventos registrados
      </Typography>
    );
  }

  const sortedEvents = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  return (
    <Stack spacing={1.5}>
      {sortedEvents.map((event) => {
        const config = EVENT_CONFIG[event.type] || {
          icon: 'mdi:circle-small',
          color: 'default',
          label: event.type,
        };
        const player = players?.find((p) => p.id === event.player_id);
        const team = teams?.find((t) => t.id === event.team_id);

        return (
          <Stack
            key={event.id}
            direction="row"
            alignItems="center"
            spacing={2}
            sx={{
              px: 2,
              py: 1,
              borderRadius: 1,
              bgcolor: 'background.neutral',
            }}
          >
            <Typography variant="subtitle2" sx={{ minWidth: 40, textAlign: 'right' }}>
              {event.minute}&apos;
              {event.stoppage_time > 0 && `+${event.stoppage_time}`}
            </Typography>

            <Iconify
              icon={config.icon}
              width={22}
              sx={{ color: `${config.color}.main` }}
            />

            <Stack sx={{ flex: 1 }}>
              <Typography variant="body2">
                {player?.name || 'Jugador'}
                {team && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    {' '}
                    ({team.short_name || team.name})
                  </Typography>
                )}
              </Typography>
            </Stack>

            <Chip label={config.label} size="small" color={config.color} variant="soft" />

            {editable && onDeleteEvent && (
              <IconButton
                size="small"
                color="error"
                onClick={() => onDeleteEvent(event.id)}
                sx={{ ml: 0.5 }}
              >
                <Iconify icon="solar:trash-bin-trash-bold" width={18} />
              </IconButton>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
