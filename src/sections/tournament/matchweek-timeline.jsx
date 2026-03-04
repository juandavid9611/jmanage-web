import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

// ----------------------------------------------------------------------

export function MatchweekTimeline({
  totalMatchweeks = 0,
  currentMatchweek = 0,
  allMatches = [],
  selectedMatchweek,
  onSelect,
  onViewAll,
}) {
  if (totalMatchweeks <= 0) return null;

  const rows = Array.from({ length: totalMatchweeks }, (_, i) => {
    const mw        = i + 1;
    const mwMatches = allMatches.filter((m) => m.matchweek === mw);
    const finished  = mwMatches.filter((m) => m.status === 'finished').length;
    const live      = mwMatches.filter((m) => m.status === 'live').length;
    const total     = mwMatches.length;
    const progress  = total > 0 ? (finished / total) * 100 : 0;

    let status = 'pending';
    if (mw < currentMatchweek || (total > 0 && finished === total)) status = 'done';
    else if (mw === currentMatchweek)                                status = 'current';

    const featured = mwMatches.find((m) => m.status === 'finished' && m.score_home != null);

    return { mw, status, finished, live, total, progress, featured };
  });

  const value = selectedMatchweek === null ? 'all' : (selectedMatchweek ?? currentMatchweek);

  const handleChange = (e) => {
    if (e.target.value === 'all') onViewAll?.();
    else onSelect?.(e.target.value);
  };

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
        px: { xs: 2, md: 2.5 },
        py: 1.25,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, flexShrink: 0 }}>
          Jornada
        </Typography>

        <Select
          size="small"
          value={value}
          onChange={handleChange}
          renderValue={(val) => {
            if (val === 'all') return <Typography variant="body2" sx={{ fontWeight: 500 }}>Todas las jornadas</Typography>;
            const row = rows.find((r) => r.mw === val);
            if (!row) return null;
            return (
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Jornada {row.mw}
                </Typography>
                <StatusDot status={row.status} />
              </Stack>
            );
          }}
          sx={{
            flex: 1,
            maxWidth: 320,
            '& .MuiSelect-select': { py: 0.75 },
            '& fieldset': { borderColor: (t) => alpha(t.palette.grey[500], 0.2) },
          }}
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 320,
                mt: 0.5,
                boxShadow: (t) => t.shadows[8],
                border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
              },
            },
          }}
        >
          {/* "Ver todas" option */}
          <MenuItem value="all" sx={{ py: 1, borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
              Todas las jornadas
            </Typography>
          </MenuItem>

          {rows.map((row) => (
            <MenuItem
              key={row.mw}
              value={row.mw}
              sx={{
                py: 1,
                px: 1.5,
                '&.Mui-selected': {
                  bgcolor: (t) => alpha(t.palette.primary.main, 0.06),
                },
              }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: '110px 1fr auto auto', alignItems: 'center', gap: 1.5, width: '100%' }}>
                {/* Label + dot */}
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <StatusDot status={row.status} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Jornada {row.mw}
                  </Typography>
                </Stack>

                {/* Progress bar */}
                <Stack direction="row" alignItems="center" spacing={0.75}>
                  <LinearProgress
                    variant="determinate"
                    value={row.progress}
                    sx={{
                      flex: 1,
                      height: 3,
                      borderRadius: 1,
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.1),
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 1,
                        bgcolor:
                          row.status === 'done'    ? 'success.main' :
                          row.status === 'current' ? 'text.primary' : 'text.disabled',
                      },
                    }}
                  />
                  <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled', flexShrink: 0 }}>
                    {row.finished}/{row.total}
                  </Typography>
                </Stack>

                {/* Featured result */}
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ fontSize: '0.68rem', color: 'text.disabled', minWidth: 80 }}
                >
                  {row.live > 0 ? (
                    <Box component="span" sx={{ color: 'error.main', fontWeight: 700 }}>
                      ● {row.live} en vivo
                    </Box>
                  ) : row.featured ? (
                    <>{row.featured.home_team_short || 'LOC'} <strong>{row.featured.score_home}·{row.featured.score_away}</strong> {row.featured.away_team_short || 'VIS'}</>
                  ) : (
                    row.status === 'pending' ? 'Sin jugar' : '—'
                  )}
                </Typography>

                {/* Status chip */}
                <StatusChip status={row.status} />
              </Box>
            </MenuItem>
          ))}
        </Select>
      </Stack>
    </Box>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function StatusDot({ status }) {
  return (
    <Box
      sx={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        flexShrink: 0,
        bgcolor:
          status === 'done'    ? 'success.main' :
          status === 'current' ? 'text.primary'  : 'text.disabled',
        ...(status === 'current' && {
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
        }),
      }}
    />
  );
}

function StatusChip({ status }) {
  if (status === 'done') {
    return <Chip label="Completa" size="small" color="success" variant="soft" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700 }} />;
  }
  if (status === 'current') {
    return <Chip label="Activa" size="small" variant="soft" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600 }} />;
  }
  return <Chip label="Pendiente" size="small" variant="soft" sx={{ height: 20, fontSize: '0.6rem', fontWeight: 600, color: 'text.disabled' }} />;
}
