import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { fDateTime } from 'src/utils/format-time';



// ----------------------------------------------------------------------

const STATUS_BORDER = {
  live: 'error.main',
  finished: 'success.main',
  scheduled: 'warning.main',
  postponed: 'warning.main',
};

const STATUS_BADGE = {
  live: { label: 'En vivo', color: 'error' },
  finished: { label: 'Final', color: 'success' },
  scheduled: { label: 'Pendiente', color: 'warning' },
  postponed: { label: 'Aplazado', color: 'warning' },
};

// ----------------------------------------------------------------------

export function MatchRow({ match, teams, onClick, onScoreClick }) {
  const theme = useTheme();

  const homeTeam = teams?.find((t) => t.id === match.home_team_id);
  const awayTeam = teams?.find((t) => t.id === match.away_team_id);
  const homeName = homeTeam?.short_name || homeTeam?.name || 'TBD';
  const awayName = awayTeam?.short_name || awayTeam?.name || 'TBD';

  const isFinished = match.status === 'finished';
  const isLive = match.status === 'live';
  const isPending = match.status === 'scheduled';

  const badge = STATUS_BADGE[match.status] || STATUS_BADGE.scheduled;

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'grid',
        gridTemplateColumns: '52px 1fr auto',
        alignItems: 'center',
        gap: 1.5,
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        borderLeft: (t) =>
          `2.5px solid ${
            match.status === 'live'
              ? t.palette.error.main
              : match.status === 'finished'
                ? t.palette.success.main
                : match.status === 'scheduled'
                  ? t.palette.warning.main
                  : alpha(t.palette.grey[500], 0.2)
          }`,
        borderRadius: 1,
        px: 2,
        py: 1.5,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick
          ? {
              borderColor: (t) => alpha(t.palette.grey[500], 0.2),
              transform: 'translateX(2px)',
              boxShadow: (t) => t.shadows[2],
            }
          : {},
      }}
    >
      {/* Time / Court */}
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
              sx={{ fontFamily: 'monospace', fontSize: '0.7rem', color: 'error.main' }}
            >
              {match.minute || '--'}&#39;
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="caption"
            sx={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'text.secondary' }}
          >
            {match.date ? fDateTime(match.date, 'HH:mm') : '--:--'}
          </Typography>
        )}
        {match.venue && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontSize: '0.6rem',
              color: 'text.disabled',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              mt: 0.25,
            }}
          >
            {match.venue}
          </Typography>
        )}
      </Box>

      {/* Teams + Score */}
      <Box>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
            {homeName}
          </Typography>
          {isFinished || isLive ? (
            <Typography
              variant="subtitle2"
              sx={{
                fontFamily: 'monospace',
                fontWeight: 500,
                px: 0.75,
                py: 0.125,
                borderRadius: 0.5,
                ...(isLive && { color: 'error.main' }),
                ...(isFinished && {
                  color: 'success.main',
                  bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                }),
              }}
            >
              {match.score_home ?? 0}·{match.score_away ?? 0}
            </Typography>
          ) : (
            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
              vs
            </Typography>
          )}
          <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
            {awayName}
          </Typography>
        </Stack>

        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>
          {isFinished && 'Final'}
          {isLive && `${match.half || ''}° tiempo`}
          {isPending && ''}
          {match.group_name ? ` · ${match.group_name}` : ''}
        </Typography>
      </Box>

      {/* Status + Action */}
      <Stack alignItems="flex-end" spacing={0.75}>
        <Chip
          label={badge.label}
          color={badge.color}
          size="small"
          variant="soft"
          sx={{ height: 22, fontSize: '0.65rem', fontFamily: 'monospace' }}
        />
        {isPending && onScoreClick && (
          <Button
            size="small"
            variant="contained"
            sx={{ fontSize: '0.65rem', py: 0.5, px: 1.25, minWidth: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              onScoreClick();
            }}
          >
            Registrar
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
            Ver
          </Button>
        )}
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

/**
 * MatchList — Groups matches by status and renders them with section headers.
 */
export function MatchList({ matches, teams, onMatchClick, onScoreClick, grouped = true }) {
  if (!grouped) {
    return (
      <Stack spacing={0.75}>
        {matches.map((match) => (
          <MatchRow
            key={match.id}
            match={match}
            teams={teams}
            onClick={() => onMatchClick?.(match)}
            onScoreClick={() => onScoreClick?.(match)}
          />
        ))}
        {matches.length === 0 && (
          <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
            No hay partidos
          </Typography>
        )}
      </Stack>
    );
  }

  const live = matches.filter((m) => m.status === 'live');
  const pending = matches.filter((m) => m.status === 'scheduled');
  const done = matches.filter((m) => m.status === 'finished');

  const renderSection = (label, list, badgeColor, badgeCount) => {
    if (list.length === 0) return null;
    return (
      <Box sx={{ mb: 2.75 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography
            variant="overline"
            sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.6rem' }}
          >
            {label}
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }} />
          {badgeCount > 0 && (
            <Chip
              label={`${badgeCount} ${label.toLowerCase()}`}
              size="small"
              color={badgeColor}
              variant="soft"
              sx={{ height: 20, fontSize: '0.6rem', fontFamily: 'monospace' }}
            />
          )}
        </Stack>
        <Stack spacing={0.75}>
          {list.map((match) => (
            <MatchRow
              key={match.id}
              match={match}
              teams={teams}
              onClick={() => onMatchClick?.(match)}
              onScoreClick={() => onScoreClick?.(match)}
            />
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {renderSection('En vivo', live, 'error', live.length)}
      {renderSection('Pendientes', pending, 'warning', pending.length)}
      {renderSection('Finalizados', done, 'success', done.length)}
      {matches.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
          No hay partidos en esta jornada
        </Typography>
      )}
    </Box>
  );
}
