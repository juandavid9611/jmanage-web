import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { useGetGroups, useGetStandings } from 'src/actions/tournament';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function StandingsSidebar({ tournamentId, nextPendingMatch, teams, onViewAll, onNextAction }) {
  const theme = useTheme();
  const { groups } = useGetGroups(tournamentId);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderLeft: (t) => ({ md: `1px solid ${alpha(t.palette.grey[500], 0.12)}` }),
        borderTop: (t) => ({ xs: `1px solid ${alpha(t.palette.grey[500], 0.12)}`, md: 'none' }),
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
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
          Tabla de posiciones
        </Typography>
        {onViewAll && (
          <Button size="small" sx={{ fontSize: 11 }} onClick={onViewAll}>
            Ver todo
          </Button>
        )}
      </Stack>

      {/* Body */}
      <Box sx={{ px: 2.25, py: 1.5, flex: 1, overflowY: 'auto' }}>
        {groups?.length > 0 ? (
          groups.map((group) => (
            <GroupStandings
              key={group.id}
              group={group}
              tournamentId={tournamentId}
              teams={teams}
            />
          ))
        ) : (
          <AllStandings tournamentId={tournamentId} teams={teams} />
        )}
      </Box>

      {/* Footer — Next Action */}
      {nextPendingMatch && (
        <Box
          sx={{
            px: 2.25,
            py: 1.75,
            borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
          }}
        >
          <Box
            onClick={onNextAction}
            sx={{
              bgcolor: (t) => alpha(t.palette.grey[900], 0.04),
              border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
              borderRadius: 1,
              px: 1.75,
              py: 1.25,
              cursor: onNextAction ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              '&:hover': onNextAction
                ? { bgcolor: (t) => alpha(t.palette.grey[900], 0.06) }
                : {},
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                Registrar{' '}
                {(teams?.find((t) => t.id === nextPendingMatch.home_team_id)?.short_name ||
                  teams?.find((t) => t.id === nextPendingMatch.home_team_id)?.name ||
                  'LOC')}{' '}
                vs{' '}
                {(teams?.find((t) => t.id === nextPendingMatch.away_team_id)?.short_name ||
                  teams?.find((t) => t.id === nextPendingMatch.away_team_id)?.name ||
                  'VIS')}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Resultado pendiente{nextPendingMatch.venue ? ` · ${nextPendingMatch.venue}` : ''}
              </Typography>
            </Box>
            <Iconify icon="eva:arrow-forward-fill" sx={{ color: 'text.disabled' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function GroupStandings({ group, tournamentId, teams }) {
  const { standings } = useGetStandings(tournamentId, group.id);
  const rows = standings?.items || [];

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="overline"
        sx={{
          color: 'text.disabled',
          letterSpacing: 2,
          fontSize: '0.6rem',
          mb: 0.75,
          display: 'block',
        }}
      >
        {group.name}
      </Typography>
      <StandingsRows rows={rows} teams={teams} />
    </Box>
  );
}

function AllStandings({ tournamentId, teams }) {
  const { standings } = useGetStandings(tournamentId);
  const rows = standings?.items || [];

  return <StandingsRows rows={rows} teams={teams} />;
}

function StandingsRows({ rows, teams }) {
  const theme = useTheme();

  if (!rows || rows.length === 0) {
    return (
      <Typography variant="caption" sx={{ color: 'text.disabled', py: 1 }}>
        Sin datos
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {rows.map((row, idx) => {
        const team = teams?.find((t) => t.id === row.team_id);
        const name = team?.short_name || team?.name || row.team_id;
        const isTop = idx < 2; // promotion zone

        return (
          <Box key={row.team_id}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '16px 1fr 24px 28px',
                gap: 0.5,
                alignItems: 'center',
                py: 0.75,
                px: 0.75,
                borderRadius: 0.5,
                ...(isTop && { bgcolor: (t) => alpha(t.palette.success.main, 0.04) }),
                transition: 'background 0.2s',
                '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.04) },
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontSize: '0.65rem',
                  color: isTop ? 'success.main' : 'text.disabled',
                  textAlign: 'center',
                }}
              >
                {idx + 1}
              </Typography>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                {isTop && (
                  <Box
                    sx={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      bgcolor: 'success.main',
                      flexShrink: 0,
                    }}
                  />
                )}
                <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
                  {name}
                </Typography>
              </Stack>

              <Typography
                variant="caption"
                sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.disabled', textAlign: 'center' }}
              >
                {row.goal_difference > 0 ? `+${row.goal_difference}` : row.goal_difference}
              </Typography>

              <Typography
                variant="caption"
                sx={{
                  fontFamily: 'monospace',
                  fontWeight: 500,
                  fontSize: '0.75rem',
                  textAlign: 'center',
                  ...(isTop && { color: 'success.main' }),
                }}
              >
                {row.points}
              </Typography>
            </Box>

            {/* Divider after position 2 (promotion line) */}
            {idx === 1 && rows.length > 2 && (
              <Divider sx={{ mx: 0.75, my: 0.25, borderColor: (t) => alpha(t.palette.grey[500], 0.08) }} />
            )}
          </Box>
        );
      })}
    </Stack>
  );
}
