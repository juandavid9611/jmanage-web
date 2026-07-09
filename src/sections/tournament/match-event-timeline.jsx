import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const EVENT_CONFIG = {
  goal: { icon: 'mdi:soccer', color: 'success', label: 'label_goal_singular' },
  own_goal: { icon: 'mdi:soccer', color: 'error', label: 'label_own_goal' },
  assist: { icon: 'mdi:shoe-cleat', color: 'info', label: 'label_assist_singular' },
  yellow_card: { icon: 'mdi:card', color: 'warning', label: 'label_yellow_card_singular_short' },
  second_yellow: { icon: 'mdi:card-multiple', color: 'warning', label: 'label_second_yellow' },
  red_card: { icon: 'mdi:card', color: 'error', label: 'label_red_card_singular_short' },
  substitution: { icon: 'mdi:swap-horizontal', color: 'info', label: 'label_substitution' },
  penalty_scored: { icon: 'mdi:target', color: 'success', label: 'label_penalty' },
  penalty_missed: { icon: 'mdi:target', color: 'error', label: 'label_penalty_missed' },
};

export function MatchEventTimeline({ events, players, teams, editable, onDeleteEvent }) {
  const { t } = useTranslation();
  if (!events?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        {t('label_no_events_recorded')}
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
          label: null,
        };
        const displayLabel = config.label ? t(config.label) : event.type;
        const player = players?.find((p) => p.id === event.player_id);
        const team = teams?.find((tm) => tm.id === event.team_id);

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

            <Iconify icon={config.icon} width={22} sx={{ color: `${config.color}.main` }} />

            <Stack sx={{ flex: 1 }}>
              <Typography variant="body2">
                {player?.name || t('label_player_singular')}
                {team && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    {' '}
                    ({team.short_name || team.name})
                  </Typography>
                )}
              </Typography>
            </Stack>

            <Chip label={displayLabel} size="small" color={config.color} variant="soft" />

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
