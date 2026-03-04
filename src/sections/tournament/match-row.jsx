import { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { fDateTime } from 'src/utils/format-time';

import { useGetMatch } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const STATUS_BADGE = {
  live:       { label: 'En vivo',   color: 'error' },
  finished:   { label: 'Final',     color: 'success' },
  scheduled:  { label: 'Pendiente', color: 'warning' },
  postponed:  { label: 'Aplazado',  color: 'warning' },
};

export const EVENT_CONFIG = {
  goal:             { icon: 'mdi:soccer',          color: 'success.main',  label: 'Gol' },
  own_goal:         { icon: 'mdi:soccer',          color: 'error.main',    label: 'En propia' },
  penalty_scored:   { icon: 'mdi:soccer',          color: 'success.main',  label: 'Penal' },
  yellow_card:      { icon: 'mdi:card',            color: '#F5A623',       label: 'Amarilla' },
  second_yellow:    { icon: 'mdi:card',            color: '#F5A623',       label: '2ª Amarilla' },
  red_card:         { icon: 'mdi:card',            color: 'error.main',    label: 'Roja' },
  substitution:     { icon: 'mdi:swap-vertical',   color: 'info.main',     label: 'Cambio' },
};

// ----------------------------------------------------------------------

export function MatchRow({ match, teams, players, tournamentId, onClick, onScoreClick, expanded, onToggle }) {
  const homeTeam = teams?.find((t) => t.id === match.home_team_id);
  const awayTeam = teams?.find((t) => t.id === match.away_team_id);
  const homeName = homeTeam?.short_name || homeTeam?.name || 'TBD';
  const awayName = awayTeam?.short_name || awayTeam?.name || 'TBD';

  const isFinished = match.status === 'finished';
  const isLive     = match.status === 'live';
  const isPending  = match.status === 'scheduled';

  const badge = STATUS_BADGE[match.status] || STATUS_BADGE.scheduled;

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        borderLeft: (t) =>
          `2.5px solid ${
            isLive      ? t.palette.error.main
            : isFinished ? t.palette.success.main
            : isPending  ? t.palette.warning.main
            : alpha(t.palette.grey[500], 0.2)
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
          '&:hover': onClick
            ? { bgcolor: (t) => alpha(t.palette.grey[500], 0.03) }
            : {},
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
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'error.main' }}>
                {match.minute || '--'}&#39;
              </Typography>
            </Stack>
          ) : (
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'text.secondary' }}>
              {match.date ? fDateTime(match.date, 'HH:mm') : '--:--'}
            </Typography>
          )}
          {match.venue && (
            <Typography variant="caption" sx={{ display: 'block', fontSize: '0.6rem', color: 'text.disabled', mt: 0.25 }}>
              {match.venue}
            </Typography>
          )}
        </Box>

        {/* Teams + score */}
        <Box>
          <Stack direction="row" alignItems="center" spacing={1}>
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
                    bgcolor: (t) => alpha(t.palette.success.main, 0.08),
                  }),
                }}
              >
                {match.score_home ?? 0}·{match.score_away ?? 0}
              </Typography>
            ) : (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>vs</Typography>
            )}
            <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
              {awayName}
            </Typography>
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.25 }}>
            {isFinished && 'Final'}
            {isLive && `${match.half || ''}° tiempo`}
            {match.group_name ? ` · ${match.group_name}` : ''}
          </Typography>
        </Box>

        {/* Status chip + action */}
        <Stack alignItems="flex-end" spacing={0.75}>
          <Chip
            label={badge.label}
            color={badge.color}
            size="small"
            variant="soft"
            sx={{ height: 22, fontSize: '0.65rem', fontWeight: 600 }}
          />
          {isPending && onScoreClick && (
            <Button
              size="small"
              variant="contained"
              sx={{ fontSize: '0.65rem', py: 0.5, px: 1.25, minWidth: 0 }}
              onClick={(e) => { e.stopPropagation(); onScoreClick(); }}
            >
              Registrar
            </Button>
          )}
          {isFinished && onClick && (
            <Button
              size="small"
              variant="soft"
              sx={{ fontSize: '0.65rem', py: 0.5, px: 1.25, minWidth: 0 }}
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              Ver
            </Button>
          )}
        </Stack>

        {/* Expand toggle */}
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); onToggle?.(); }}
          sx={{ color: 'text.disabled', '&:hover': { color: 'text.secondary' } }}
        >
          <Iconify
            icon={expanded ? 'eva:chevron-up-fill' : 'eva:chevron-down-fill'}
            width={18}
          />
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
        />
      </Collapse>
    </Box>
  );
}

// ----------------------------------------------------------------------

function MatchEventPanel({ matchId, tournamentId, homeTeamId, awayTeamId, homeName, awayName, players }) {
  const { match, matchLoading } = useGetMatch(tournamentId, matchId);
  const events = match?.events || [];
  const sorted = [...events].sort((a, b) => a.minute - b.minute);

  return (
    <Box
      sx={{
        borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        bgcolor: (t) => alpha(t.palette.grey[500], 0.02),
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
          Sin eventos registrados
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
              borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600 }}>
              {homeName}
            </Typography>
            <Box />
            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'text.disabled', fontWeight: 600, textAlign: 'right' }}>
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
  const isRight = align === 'right';

  return (
    <Stack
      direction={isRight ? 'row-reverse' : 'row'}
      alignItems="flex-start"
      spacing={0.75}
    >
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
          bgcolor: (t) => alpha(
            cfg.color.includes('.') ? t.palette[cfg.color.split('.')[0]][cfg.color.split('.')[1]] : cfg.color,
            0.12
          ),
        }}
      >
        <Iconify icon={cfg.icon} width={12} sx={{ color: cfg.color }} />
      </Box>

      <Box sx={{ textAlign: isRight ? 'right' : 'left' }}>
        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.7rem', display: 'block' }}>
          {player?.name || <Typography component="span" sx={{ color: 'text.disabled', fontStyle: 'italic', fontSize: '0.65rem' }}>Jugador</Typography>}
        </Typography>
        {assist && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block' }}>
            Asist. {assist.name}
          </Typography>
        )}
        {cfg.label === 'En propia' && (
          <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.6rem', display: 'block' }}>
            En propia
          </Typography>
        )}
        {cfg.label === 'Penal' && (
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem', display: 'block' }}>
            Penalti
          </Typography>
        )}
        {cfg.label === 'Cambio' && assist && (
          <Typography variant="caption" sx={{ color: 'info.main', fontSize: '0.6rem', display: 'block' }}>
            ↑ {assist.name}
          </Typography>
        )}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export function MatchList({ matches, teams, players, tournamentId, onMatchClick, onScoreClick, grouped = true }) {
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
            expanded={expandedId === match.id}
            onToggle={() => toggle(match.id)}
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

  const live    = matches.filter((m) => m.status === 'live');
  const pending = matches.filter((m) => m.status === 'scheduled');
  const done    = matches.filter((m) => m.status === 'finished');

  const renderSection = (label, list, badgeColor) => {
    if (list.length === 0) return null;
    return (
      <Box sx={{ mb: 2.75 }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
            {label}
          </Typography>
          <Box sx={{ flex: 1, height: 1, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }} />
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
              expanded={expandedId === match.id}
              onToggle={() => toggle(match.id)}
            />
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Box>
      {renderSection('En vivo', live, 'error')}
      {renderSection('Pendientes', pending, 'warning')}
      {renderSection('Finalizados', done, 'success')}
      {matches.length === 0 && (
        <Typography variant="body2" sx={{ color: 'text.disabled', py: 4, textAlign: 'center' }}>
          No hay partidos en esta jornada
        </Typography>
      )}
    </Box>
  );
}
