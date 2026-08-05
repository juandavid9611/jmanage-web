import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';

import {
  useGetGroups,
  useGetPublicGroups,
  useGetAllStandings,
  useGetPublicStandings,
} from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label values below are i18n keys (or a literal "#"), resolved via t() at render time.
const COLS = [
  { key: 'rank', label: '#', fixed: '20px', align: 'center' },
  { key: 'name', label: 'team', fixed: '2fr', align: 'left' },
  { key: 'played', label: 'label_col_played_abbr', fixed: '1fr', align: 'center' },
  { key: 'won', label: 'label_col_won_abbr', fixed: '1fr', align: 'center' },
  { key: 'drawn', label: 'label_col_drawn_abbr', fixed: '1fr', align: 'center' },
  { key: 'lost', label: 'label_col_lost_abbr', fixed: '1fr', align: 'center' },
  { key: 'goals_for', label: 'label_gf_abbr', fixed: '1fr', align: 'center' },
  { key: 'goals_against', label: 'label_ga_abbr', fixed: '1fr', align: 'center' },
  { key: 'goal_difference', label: 'label_col_goal_diff_abbr', fixed: '1fr', align: 'center' },
  { key: 'points', label: 'label_col_points_abbr', fixed: '1fr', align: 'center' },
];

const GRID_TEMPLATE = COLS.map((c) => c.fixed).join(' ');

// ----------------------------------------------------------------------

export function StandingsSidebar({
  tournamentId,
  nextPendingMatch,
  teams,
  allMatches,
  onViewAll,
  onNextAction,
  currentMatchweek,
  totalMatchweeks,
  publicMode = false,
}) {
  const { t } = useTranslation();
  const authGroups = useGetGroups(publicMode ? null : tournamentId);
  const pubGroups = useGetPublicGroups(publicMode ? tournamentId : null);
  const { groups } = publicMode ? pubGroups : authGroups;

  const authStandings = useGetAllStandings(publicMode ? null : tournamentId);
  const pubStandings = useGetPublicStandings(publicMode ? tournamentId : null);
  const { allStandings, allStandingsLoading } = publicMode ? pubStandings : authStandings;

  const liveTeamIds = useMemo(() => {
    if (!allMatches) return new Set();
    const live = allMatches.filter((m) => m.status === 'live');
    return new Set(live.flatMap((m) => [m.home_team_id, m.away_team_id]));
  }, [allMatches]);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{
          px: 2.25,
          py: 1.5,
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:trophy-outline" width={18} sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            {t('label_standings_table')}
          </Typography>
        </Stack>
        {onViewAll && (
          <Button size="small" sx={{ fontSize: 11 }} onClick={onViewAll}>
            {t('label_view_all')}
          </Button>
        )}
      </Stack>

      {/* Body */}
      <Box sx={{ px: 1.5, py: 1.5, flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
        {allStandingsLoading ? (
          <Stack spacing={0.75}>
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={32} />
            ))}
          </Stack>
        ) : groups?.length > 0 ? (
          groups.map((group) => (
            <GroupStandings
              key={group.id}
              group={group}
              rows={allStandings?.groups?.[group.id]?.items || []}
              teams={teams}
              liveTeamIds={liveTeamIds}
            />
          ))
        ) : (
          <AllStandings
            rows={allStandings?.tournament?.items || []}
            teams={teams}
            liveTeamIds={liveTeamIds}
          />
        )}
      </Box>

      {/* Footer */}
      {(nextPendingMatch || (currentMatchweek > 0 && currentMatchweek < totalMatchweeks)) && (
        <Box
          sx={{
            px: 2.25,
            py: 1.75,
            borderTop: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          }}
        >
          {nextPendingMatch ? (
            <Box
              onClick={onNextAction}
              sx={{
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.04),
                border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
                borderRadius: 1,
                px: 1.75,
                py: 1.25,
                cursor: onNextAction ? 'pointer' : 'default',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'all 0.2s',
                '&:hover': onNextAction
                  ? { bgcolor: (theme) => alpha(theme.palette.grey[900], 0.06) }
                  : {},
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {nextPendingMatch.status === 'live'
                    ? `${t('label_watch_live')} `
                    : `${t('label_register')} `}
                  {teams?.find((team) => team.id === nextPendingMatch.home_team_id)?.short_name ||
                    teams?.find((team) => team.id === nextPendingMatch.home_team_id)?.name ||
                    t('label_home_abbr')}{' '}
                  {t('label_vs')}{' '}
                  {teams?.find((team) => team.id === nextPendingMatch.away_team_id)?.short_name ||
                    teams?.find((team) => team.id === nextPendingMatch.away_team_id)?.name ||
                    t('label_away_abbr')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {nextPendingMatch.status === 'live'
                    ? t('label_match_in_progress')
                    : t('label_result_pending')}
                  {nextPendingMatch.venue ? ` · ${nextPendingMatch.venue}` : ''}
                </Typography>
              </Box>
              <Iconify icon="eva:arrow-forward-fill" sx={{ color: 'text.disabled' }} />
            </Box>
          ) : (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                px: 1.75,
                py: 1.25,
                borderRadius: 1,
                bgcolor: (theme) => alpha(theme.palette.success.main, 0.06),
                border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.16)}`,
              }}
            >
              <Iconify
                icon="mdi:check-circle"
                width={18}
                sx={{ color: 'success.main', flexShrink: 0 }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.dark' }}>
                  {t('label_matchday')} {currentMatchweek} {t('label_completed_fem')}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {t('label_ready_to_advance_to_matchday')} {currentMatchweek + 1}
                </Typography>
              </Box>
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function GroupStandings({ group, rows, teams, liveTeamIds }) {
  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.25 }}>
        <Box
          sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', flexShrink: 0 }}
        />
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {group.name}
        </Typography>
      </Stack>
      <StandingsTable rows={rows} teams={teams} liveTeamIds={liveTeamIds} />
    </Box>
  );
}

function AllStandings({ rows, teams, liveTeamIds }) {
  return <StandingsTable rows={rows} teams={teams} liveTeamIds={liveTeamIds} />;
}

// ----------------------------------------------------------------------

function StandingsTable({ rows, teams, liveTeamIds }) {
  const { t } = useTranslation();
  if (!rows || rows.length === 0) {
    return (
      <Typography
        variant="caption"
        sx={{ color: 'text.disabled', py: 2, display: 'block', textAlign: 'center' }}
      >
        {t('label_no_data')}
      </Typography>
    );
  }

  return (
    <Card
      sx={{
        boxShadow: 'none',
        border: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
        overflow: 'hidden',
      }}
    >
      {/* Column header */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: GRID_TEMPLATE,
          alignItems: 'center',
          px: 1,
          py: 0.75,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04),
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          gap: 0.25,
        }}
      >
        {COLS.map((col) => (
          <Typography
            key={col.key}
            variant="caption"
            sx={{
              fontSize: '0.6rem',
              fontWeight: col.key === 'points' ? 700 : 500,
              color: col.key === 'points' ? 'text.secondary' : 'text.disabled',
              textAlign: col.align,
            }}
          >
            {col.label === '#' ? col.label : t(col.label)}
          </Typography>
        ))}
      </Box>

      {/* Rows */}
      <Stack spacing={0}>
        {rows.map((row, idx) => {
          const team = teams?.find((tm) => tm.id === row.team_id);
          const name = team?.short_name || team?.name || '—';
          const isTop = idx < 4;
          const gd = row.goal_difference;

          return (
            <Box key={row.team_id}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: GRID_TEMPLATE,
                  alignItems: 'center',
                  px: 1,
                  py: 0.875,
                  gap: 0.25,
                  bgcolor: isTop
                    ? (theme) => alpha(theme.palette.success.main, 0.03)
                    : 'transparent',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) },
                }}
              >
                {/* # */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    color: isTop ? 'success.main' : 'text.disabled',
                    textAlign: 'center',
                  }}
                >
                  {idx + 1}
                </Typography>

                {/* Team name */}
                <Stack direction="row" alignItems="center" spacing={0.5}>
                  {isTop && (
                    <Box
                      sx={{
                        width: 3,
                        height: 12,
                        borderRadius: 0.5,
                        bgcolor: 'success.main',
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: isTop ? 600 : 500, fontSize: '0.7rem' }}
                    noWrap
                  >
                    {name}
                  </Typography>
                  {liveTeamIds?.has(row.team_id) && (
                    <Box
                      sx={{
                        px: 0.75,
                        py: 0.25,
                        borderRadius: 0.5,
                        bgcolor: (theme) => alpha(theme.palette.error.main, 0.16),
                        color: 'error.main',
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        lineHeight: 1,
                        ml: 0.5,
                        animation: 'pulse 2s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.5 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    >
                      {t('label_live')}
                    </Box>
                  )}
                </Stack>

                {/* PJ */}
                <StatCell value={row.played ?? 0} />

                {/* PG */}
                <StatCell value={row.won ?? 0} color={row.won > 0 ? 'success.main' : undefined} />

                {/* PE */}
                <StatCell value={row.drawn ?? 0} />

                {/* PP */}
                <StatCell value={row.lost ?? 0} color={row.lost > 0 ? 'error.main' : undefined} />

                {/* GF */}
                <StatCell value={row.goals_for ?? 0} />

                {/* GC */}
                <StatCell value={row.goals_against ?? 0} />

                {/* DG */}
                <Typography
                  variant="caption"
                  sx={{
                    fontSize: '0.65rem',
                    fontWeight: 500,
                    textAlign: 'center',
                    color: gd > 0 ? 'success.main' : gd < 0 ? 'error.main' : 'text.disabled',
                  }}
                >
                  {gd > 0 ? `+${gd}` : gd}
                </Typography>

                {/* PTS */}
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    textAlign: 'center',
                    color: isTop ? 'success.main' : 'text.primary',
                  }}
                >
                  {row.points}
                </Typography>
              </Box>

              {/* Promotion line after position 4 */}
              {idx === 3 && rows.length > 4 && (
                <Divider
                  sx={{
                    mx: 1,
                    borderStyle: 'dashed',
                    borderColor: (theme) => alpha(theme.palette.success.main, 0.24),
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function StatCell({ value, color }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontSize: '0.65rem', textAlign: 'center', color: color || 'text.secondary' }}
    >
      {value}
    </Typography>
  );
}
