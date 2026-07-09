import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const STATUS_MAP = {
  scheduled: { label: 'label_scheduled', color: 'default', icon: 'mdi:calendar-clock' },
  live: { label: 'label_live', color: 'error', icon: 'mdi:play-circle' },
  finished: { label: 'label_finished', color: 'success', icon: 'mdi:check-circle' },
  postponed: { label: 'label_postponed', color: 'warning', icon: 'mdi:clock-alert' },
};

export function MatchCard({ match, teams, onClick, onScoreClick }) {
  const { t } = useTranslation();
  const homeTeam = teams?.find((team) => team.id === match.home_team_id);
  const awayTeam = teams?.find((team) => team.id === match.away_team_id);
  const status = STATUS_MAP[match.status] || STATUS_MAP.scheduled;

  const hasScore = match.status === 'finished' || match.status === 'live';
  const scoreHome = match.score_home >= 0 ? match.score_home : match.status === 'live' ? 0 : '-';
  const scoreAway = match.score_away >= 0 ? match.score_away : match.status === 'live' ? 0 : '-';

  return (
    <Card
      sx={{
        transition: 'all 0.2s',
        '&:hover': { boxShadow: (theme) => theme.shadows[8] },
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <CardActionArea onClick={onClick} sx={{ flex: 1 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Chip
              icon={<Iconify icon={status.icon} width={16} />}
              label={t(status.label)}
              color={status.color}
              size="small"
            />
            <Stack direction="row" alignItems="center" spacing={0.5}>
              {match.matchweek > 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('label_matchday_abbr')}
                  {match.matchweek}
                </Typography>
              )}
              {match.venue && (
                <Typography variant="caption" color="text.secondary">
                  · {match.venue}
                </Typography>
              )}
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            {/* Home */}
            <Stack alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {homeTeam?.short_name || homeTeam?.name || t('label_tbd')}
              </Typography>
            </Stack>

            {/* Score */}
            <Stack alignItems="center" spacing={0.5}>
              {hasScore ? (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h4">{scoreHome}</Typography>
                  <Typography variant="h6" color="text.secondary">
                    -
                  </Typography>
                  <Typography variant="h4">{scoreAway}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {fDateTime(match.date, 'HH:mm')}
                </Typography>
              )}
              <Typography variant="caption" color="text.secondary">
                {fDateTime(match.date, 'dd MMM yyyy')}
              </Typography>
            </Stack>

            {/* Away */}
            <Stack alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="subtitle2" noWrap>
                {awayTeam?.short_name || awayTeam?.name || t('label_tbd')}
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>

      {/* Inline score button for finished/live matches */}
      {onScoreClick && (
        <Stack sx={{ px: 2, pb: 1.5 }}>
          <Button
            size="small"
            variant="soft"
            startIcon={<Iconify icon="mdi:pencil" width={16} />}
            onClick={(e) => {
              e.stopPropagation();
              onScoreClick();
            }}
          >
            {match.status === 'finished' ? t('label_edit_score') : t('label_register_score')}
          </Button>
        </Stack>
      )}
    </Card>
  );
}
