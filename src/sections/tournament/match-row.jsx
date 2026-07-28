import dayjs from 'dayjs';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { MobileDateTimePicker } from '@mui/x-date-pickers/MobileDateTimePicker';

import { fDateTime } from 'src/utils/format-time';

import { useGetMatch, updateMatch, useGetPublicMatch } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const STATUS_BADGE = {
  live: { label: 'label_live', color: 'error' },
  finished: { label: 'label_final', color: 'success' },
  scheduled: { label: 'pending', color: 'warning' },
  postponed: { label: 'label_postponed', color: 'warning' },
};

// label values below are i18n keys, resolved via t() at render time.
// `type` mirrors the object's own key — used for real comparisons (see EventBadge)
// instead of comparing against the (now translated) label.
export const EVENT_CONFIG = {
  goal: { type: 'goal', icon: 'mdi:soccer', color: 'success.main', label: 'label_goal_singular' },
  own_goal: { type: 'own_goal', icon: 'mdi:soccer', color: 'error.main', label: 'label_own_goal' },
  penalty_scored: {
    type: 'penalty_scored',
    icon: 'mdi:soccer',
    color: 'success.main',
    label: 'label_penalty',
  },
  penalty_missed: {
    type: 'penalty_missed',
    icon: 'mdi:target',
    color: 'error.main',
    label: 'label_penalty_missed',
  },
  yellow_card: {
    type: 'yellow_card',
    icon: 'mdi:card',
    color: '#F5A623',
    label: 'label_yellow_card_singular_short',
  },
  second_yellow: {
    type: 'second_yellow',
    icon: 'mdi:card',
    color: '#F5A623',
    label: 'label_second_yellow',
  },
  red_card: {
    type: 'red_card',
    icon: 'mdi:card',
    color: 'error.main',
    label: 'label_red_card_singular_short',
  },
  substitution: {
    type: 'substitution',
    icon: 'mdi:swap-vertical',
    color: 'info.main',
    label: 'label_substitution',
  },
};

// ----------------------------------------------------------------------

export function MatchRow({
  match,
  teams,
  players,
  tournamentId,
  onClick,
  onScoreClick,
  onEditSchedule,
  expanded,
  onToggle,
  publicMode = false,
}) {
  const { t } = useTranslation();
  const homeTeam = teams?.find((team) => team.id === match.home_team_id);
  const awayTeam = teams?.find((team) => team.id === match.away_team_id);
  const homeName = homeTeam?.short_name || homeTeam?.name || t('label_tbd');
  const awayName = awayTeam?.short_name || awayTeam?.name || t('label_tbd');

  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isPending = match.status === 'scheduled';

  const badge = STATUS_BADGE[match.status] || STATUS_BADGE.scheduled;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        borderLeft: (theme) =>
          `2.5px solid ${
            isLive
              ? theme.palette.error.main
              : isFinished
                ? theme.palette.success.main
                : isPending
                  ? theme.palette.warning.main
                  : alpha(theme.palette.grey[500], 0.2)
          }`,
        borderRadius: 1,
        overflow: 'hidden',
        transition: 'all 0.2s',
      }}
    >
      {/* Main row */}
      <Box
        onClick={onClick}
        sx={{
          display: 'grid',
          gridTemplateColumns: '52px 1fr auto 32px',
          alignItems: 'center',
          gap: 1.5,
          px: 2,
          py: 1.5,
          cursor: onClick ? 'pointer' : 'default',
          '&:hover': onClick ? { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.03) } : {},
        }}
      >
        {/* Time / venue */}
        <Box sx={{ textAlign: 'center' }}>
          {isLive ? (
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={0.5}>
              <Box
                sx={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  bgcolor: 'error.main',
                  animation: 'blink 1.4s ease-in-out infinite',
                  '@keyframes blink': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.25 },
                  },
                }}
              />
              <Typography
                variant="caption"
                sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'error.main' }}
              >
                {match.minute || '--'}&#39;
              </Typography>
            </Stack>
          ) : (
            <Typography
              variant="caption"
              sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}
            >
              {match.date ? fDateTime(match.date, 'DD MMM · HH:mm') : '--:--'}
            </Typography>
          )}
          {match.venue && (
            <Typography
              variant="caption"
              sx={{ display: 'block', fontSize: '0.6rem', color: 'text.disabled', mt: 0.25 }}
            >
              {match.venue}
            </Typography>
          )}
        </Box>

        {/* Teams + score */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Avatar
              src={homeTeam?.logo_url || undefined}
              variant="rounded"
              sx={{ width: 20, height: 20, fontSize: '0.55rem' }}
            >
              {!homeTeam?.logo_url && homeName.slice(0, 2)}
            </Avatar>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
              {homeName}
            </Typography>
            {isFinished || isLive ? (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  px: 0.75,
                  py: 0.125,
                  borderRadius: 0.5,
                  ...(isLive && { color: 'error.main' }),
                  ...(isFinished && {
                    color: 'success.main',
                    bgcolor: (theme) => alpha(theme.palette.success.main, 0.08),
                  }),
                }}
              >
                {match.score_home ?? 0}·{match.score_away ?? 0}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('label_vs')}
              </Typography>
            )}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
              {awayName}
            </Typography>
            <Avatar
              src={awayTeam?.logo_url || undefined}
              variant="rounded"
              sx={{ width: 20, height: 20, fontSize: '0.55rem' }}
            >
              {!awayTeam?.logo_url && awayName.slice(0, 2)}
            </Avatar>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>
            {isFinished && t('label_final')}
            {isLive && `${match.half || ''}${t('label_half_suffix')}`}
            {match.group_name ? ` · ${match.group_name}` : ''}
          </Typography>
        </Box>

        {/* Status chip + action */}
        <Stack alignItems="flex-end" spacing={0.75}>
          <Chip
            label={t(badge.label)}
            color={badge.color}
            size="small"
            variant="soft"
            sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
          />
          {isPending && onScoreClick && !publicMode && (
            <Button
              size="small"
              variant="contained"
              sx={{ fontSize: '0.65rem', py: 0.5, px: 1.25, minWidth: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                onScoreClick();
              }}
            >
              {t('label_register')}
            </Button>
          )}
          {isFinished && onClick && (
            <Button
              size="small"
              variant="soft"
              sx={{ fontSize: '0.65rem', py: 0.5, px: 1.25, minWidth: 0 }}
              onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}
            >
              {t('label_view')}
            </Button>
          )}
          {onEditSchedule && !publicMode && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                onEditSchedule(match);
              }}
              sx={{ color: 'text.disabled', '&:hover': { color: 'text.primary' } }}
            >
              <Iconify icon="mdi:calendar-edit" width={15} />
            </IconButton>
          )}
        </Stack>

        {/* Expand toggle */}
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onToggle?.();
          }}
          sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
        >
          <Iconify icon={expanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'} width={18} />
        </IconButton>
      </Box>

      {/* Events panel */}
      <Collapse in={expanded} unmountOnExit>
        <MatchEventPanel
          matchId={match.id}
          tournamentId={tournamentId}
          homeTeamId={match.home_team_id}
          awayTeamId={match.away_team_id}
          homeName={homeName}
          awayName={awayName}
          players={players}
          publicMode={publicMode}
        />
      </Collapse>
    </Box>
  );
}

// ----------------------------------------------------------------------

function MatchEventPanel({
  matchId,
  tournamentId,
  homeTeamId,
  awayTeamId,
  homeName,
  awayName,
  players,
  publicMode = false,
}) {
  const { t } = useTranslation();
  const auth = useGetMatch(publicMode ? null : tournamentId, publicMode ? null : matchId);
  const pub = useGetPublicMatch(publicMode ? tournamentId : null, publicMode ? matchId : null);
  const match = publicMode ? pub.match : auth.match;
  const matchLoading = publicMode ? pub.matchLoading : auth.matchLoading;
  const events = match?.events || [];
  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <Box
      sx={{
        borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
        px: 2,
        py: 1.5,
      }}
    >
      {matchLoading ? (
        <Stack spacing={0.75}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={28} />
          ))}
        </Stack>
      ) : sorted.length === 0 ? (
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 1 }}
        >
          {t('label_no_events_recorded')}
        </Typography>
      ) : (
        <Stack spacing={0}>
          {/* Column headers */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 44px 1fr',
              mb: 0.75,
              pb: 0.75,
              borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600 }}
            >
              {homeName}
            </Typography>
            <Box />
            <Typography
              variant="caption"
              sx={{
                fontSize: '0.6rem',
                color: 'text.disabled',
                fontWeight: 600,
                textAlign: 'right',
              }}
            >
              {awayName}
            </Typography>
          </Box>

          {/* Events */}
          {sorted.map((event) => {
            const isHome = event.team_id === homeTeamId;
            const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.goal;
            const player = players?.find((p) => p.id === event.player_id);
            const assist = event.assist_player_id
              ? players?.find((p) => p.id === event.assist_player_id)
              : null;

            const eventContent = (
              <EventBadge
                cfg={cfg}
                player={player}
                assist={assist}
                align={isHome ? 'left' : 'right'}
              />
            );

            return (
              <Box
                key={event.id}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 44px 1fr',
                  alignItems: 'center',
                  py: 0.5,
                }}
              >
                <Box>{isHome && eventContent}</Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.disabled' }}
                  >
                    {event.minute}
                    {event.stoppage_time ? `+${event.stoppage_time}` : ''}&#39;
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  {!isHome && eventContent}
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function EventBadge({ cfg, player, assist, align }) {
  const { t } = useTranslation();
  const isRight = align === 'right';

  return (
    <Stack direction={isRight ? 'row-reverse' : 'row'} alignItems="flex-start" spacing={0.75}>
      <Box
        sx={{
          mt: 0.25,
          flexShrink: 0,
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) =>
            alpha(
              cfg.color.includes('.')
                ? theme.palette[cfg.color.split('.')[0]][cfg.color.split('.')[1]]
                : cfg.color,
              0.12
            ),
        }}
      >
        <Iconify icon={cfg.icon} width={12} sx={{ color: cfg.color }} />
      </Box>

      <Box sx={{ textAlign: isRight ? 'right' : 'left' }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block' }}
        >
          {player?.name || (
            <Typography
              component="span"
              sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.65rem' }}
            >
              {t('label_player_singular')}
            </Typography>
          )}
        </Typography>
        {assist && (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block' }}
          >
            {t('label_assist_abbr')} {assist.name}
          </Typography>
        )}
        {cfg.type === 'own_goal' && (
          <Typography
            variant="caption"
            sx={{ color: 'error.main', fontSize: '0.6rem', display: 'block' }}
          >
            {t('label_own_goal')}
          </Typography>
        )}
        {cfg.type === 'penalty_scored' && (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block' }}
          >
            {t('label_penalty_kick')}
          </Typography>
        )}
        {cfg.type === 'substitution' && assist && (
          <Typography
            variant="caption"
            sx={{ color: 'info.main', fontSize: '0.6rem', display: 'block' }}
          >
            ↑ {assist.name}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function MatchList({
  matches,
  teams,
  players,
  tournamentId,
  onMatchClick,
  onScoreClick,
  onEditSchedule,
  grouped = true,
  publicMode = false,
}) {
  const { t } = useTranslation();
  const [expandedId, setExpandedId] = useState(null);

  const toggle = (id) => setExpandedId((prev) => (prev === id ? null : id));

  if (!grouped) {
    return (
      <Stack spacing={0.75}>
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            teams={teams}
            players={players}
            tournamentId={tournamentId}
            onClick={() => onMatchClick?.(match)}
            onScoreClick={() => onScoreClick?.(match)}
            onEditSchedule={onEditSchedule}
            expanded={expandedId === match.id}
            onToggle={() => toggle(match.id)}
            publicMode={publicMode}
          />
        ))}
        {matches.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
            {t('label_no_matches')}
          </Typography>
        )}
      </Stack>
    );
  }

  const live = matches.filter((m) => m.status === 'live');
  const pending = matches.filter((m) => m.status === 'scheduled');
  const done = matches.filter((m) => m.status === 'finished');

  const renderSection = (label, list, badgeColor) => {
    if (list.length === 0) return null;
    return (
      <Box sx={{ mb: 2.75 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
            {label}
          </Typography>
          <Box
            sx={{ flex: 1, height: 1, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08) }}
          />
          <Chip
            label={list.length}
            size="small"
            color={badgeColor}
            variant="soft"
            sx={{ height: 20, minWidth: 20, fontSize: '0.65rem', fontWeight: 600 }}
          />
        </Stack>
        <Stack spacing={0.75}>
          {list.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              teams={teams}
              players={players}
              tournamentId={tournamentId}
              onClick={() => onMatchClick?.(match)}
              onScoreClick={() => onScoreClick?.(match)}
              onEditSchedule={onEditSchedule}
              expanded={expandedId === match.id}
              onToggle={() => toggle(match.id)}
              publicMode={publicMode}
            />
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {renderSection(t('label_live'), live, 'error')}
      {renderSection(t('label_pending_plural'), pending, 'warning')}
      {renderSection(t('label_finished_plural'), done, 'success')}
      {matches.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
          {t('label_no_matches_this_matchday')}
        </Typography>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

export function MatchScheduleDialog({ open, match, tournamentId, onClose }) {
  const { t } = useTranslation();
  const [datetime, setDatetime] = useState(null);
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!match) return;
    setDatetime(match.date ? dayjs(match.date) : null);
    setVenue(match.venue || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [match?.id, open]);

  const handleSave = async () => {
    if (!match || !datetime) return;
    try {
      setSaving(true);
      await updateMatch(tournamentId, match.id, {
        date: datetime.toISOString(),
        venue,
      });
      toast.success(t('label_schedule_updated'));
      onClose();
    } catch (err) {
      toast.error(err.message || t('label_error_saving'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{t('label_schedule_and_venue')}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <MobileDateTimePicker
            label={t('label_date_and_time')}
            value={datetime}
            onChange={setDatetime}
            slotProps={{ textField: { fullWidth: true } }}
          />
          <TextField
            label={t('label_venue')}
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            fullWidth
            placeholder={t('label_venue_placeholder')}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button variant="soft" color="inherit" onClick={onClose}>
          {t('cancel')}
        </Button>
        <LoadingButton
          variant="contained"
          loading={saving}
          disabled={!datetime || !datetime.isValid()}
          onClick={handleSave}
        >
          {t('label_save')}
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
