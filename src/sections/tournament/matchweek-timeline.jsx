import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

/**
 * Matchweek Timeline — Horizontal scrollable strip of jornada cards.
 *
 * @param {Object}   props
 * @param {number}   props.totalMatchweeks  Total matchweeks
 * @param {number}   props.currentMatchweek Active matchweek
 * @param {Object[]} props.allMatches       All matches for the tournament
 * @param {number}   props.selectedMatchweek Currently selected matchweek
 * @param {Function} props.onSelect          Callback when a card is clicked
 */
export function MatchweekTimeline({
  totalMatchweeks = 0,
  currentMatchweek = 0,
  allMatches = [],
  selectedMatchweek,
  onSelect,
}) {
  const theme = useTheme();

  if (totalMatchweeks <= 0) return null;

  const cards = Array.from({ length: totalMatchweeks }, (_, i) => {
    const mw = i + 1;
    const mwMatches = allMatches.filter((m) => m.matchweek === mw);
    const finished = mwMatches.filter((m) => m.status === 'finished').length;
    const total = mwMatches.length;
    const progress = total > 0 ? (finished / total) * 100 : 0;

    let status = 'pending';
    let statusLabel = 'Pendiente';
    if (mw < currentMatchweek || (total > 0 && finished === total)) {
      status = 'done';
      statusLabel = 'Completa';
    } else if (mw === currentMatchweek) {
      status = 'current';
      statusLabel = '● Activa';
    }

    // Featured result: first finished match with a score
    const featured = mwMatches.find((m) => m.status === 'finished' && m.score_home >= 0);

    return { mw, status, statusLabel, finished, total, progress, featured };
  });

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
      }}
    >
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ px: { xs: 2, md: 3.5 }, pt: 1.5, pb: 1 }}
      >
        <Typography
          variant="overline"
          sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.65rem' }}
        >
          Jornadas · Fase de grupos
        </Typography>
        <Button size="small" sx={{ fontSize: 11 }}>
          Ver todas
        </Button>
      </Stack>

      {/* Scrollable Cards */}
      <Box
        sx={{
          display: 'flex',
          gap: 1.25,
          overflowX: 'auto',
          px: { xs: 2, md: 3.5 },
          pb: 2,
          '&::-webkit-scrollbar': { height: 3 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: alpha(theme.palette.grey[500], 0.2),
            borderRadius: 1,
          },
        }}
      >
        {cards.map((card) => {
          const isSelected = selectedMatchweek === card.mw;

          return (
            <Box
              key={card.mw}
              onClick={() => onSelect?.(card.mw)}
              sx={{
                flexShrink: 0,
                width: 172,
                bgcolor:
                  card.status === 'current'
                    ? (t) => alpha(t.palette.grey[900], 0.03)
                    : (t) => alpha(t.palette.grey[500], 0.04),
                border: (t) => `1.5px solid ${
                  isSelected
                    ? t.palette.primary.main
                    : card.status === 'current'
                      ? alpha(t.palette.grey[900], 0.15)
                      : alpha(t.palette.grey[500], 0.08)
                }`,
                borderRadius: 1.75,
                p: 1.75,
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.2s',
                '&:hover': {
                  borderColor: (t) => alpha(t.palette.grey[500], 0.24),
                  transform: 'translateY(-2px)',
                  boxShadow: (t) => t.shadows[4],
                },
                // Top accent line
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  bgcolor:
                    card.status === 'done'
                      ? 'success.main'
                      : card.status === 'current'
                        ? 'text.primary'
                        : alpha(theme.palette.grey[500], 0.12),
                },
              }}
            >
              {/* Card top */}
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: -0.2 }}>
                  Jornada {card.mw}
                </Typography>
                <Chip
                  label={card.statusLabel}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.6rem',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                    bgcolor:
                      card.status === 'done'
                        ? (t) => alpha(t.palette.success.main, 0.08)
                        : card.status === 'current'
                          ? (t) => alpha(t.palette.grey[900], 0.07)
                          : (t) => alpha(t.palette.grey[500], 0.08),
                    color:
                      card.status === 'done'
                        ? 'success.main'
                        : card.status === 'current'
                          ? 'text.primary'
                          : 'text.disabled',
                  }}
                />
              </Stack>

              {/* Progress bar */}
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={card.progress}
                  sx={{
                    flex: 1,
                    height: 3,
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 1,
                      bgcolor:
                        card.status === 'done'
                          ? 'success.main'
                          : card.status === 'current'
                            ? 'text.primary'
                            : 'text.disabled',
                    },
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{ fontFamily: 'monospace', fontSize: '0.6rem', color: 'text.disabled', flexShrink: 0 }}
                >
                  {card.finished}/{card.total}
                </Typography>
              </Stack>

              {/* Featured result or placeholder */}
              {card.featured ? (
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {card.featured.home_team_short || 'LOC'}{' '}
                  <Box
                    component="span"
                    sx={{ fontFamily: 'monospace', fontSize: '0.65rem', color: 'text.disabled' }}
                  >
                    {card.featured.score_home}·{card.featured.score_away}
                  </Box>{' '}
                  {card.featured.away_team_short || 'VIS'}
                </Typography>
              ) : (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.disabled', fontWeight: 500 }}
                >
                  {card.status === 'pending' ? 'Sin jugar' : '—'}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
