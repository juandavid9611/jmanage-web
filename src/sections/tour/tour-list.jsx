import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDate, fTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

function resultOf(scores) {
  if (!scores || scores.home == null || scores.away == null) return null;
  if (scores.home > scores.away) return 'win';
  if (scores.home < scores.away) return 'loss';
  return 'draw';
}

const RESULT_CONFIG = {
  win:  { color: 'success.main', border: 'success.main', label: 'V' },
  draw: { color: 'warning.main', border: 'warning.main', label: 'E' },
  loss: { color: 'error.main',   border: 'error.main',   label: 'D' },
};

// ----------------------------------------------------------------------

function MatchTourRow({ tour }) {
  const router = useRouter();
  const { user } = useAuthContext();

  const result = resultOf(tour.scores);
  const cfg = result ? RESULT_CONFIG[result] : null;
  const bookerCount = Object.keys(tour.bookers || {}).length;
  const userBooked = user?.sub && Object.keys(tour.bookers || {}).includes(user.sub);
  const startDate = tour.available?.startDate;

  return (
    <Card
      onClick={() => router.push(paths.dashboard.admin.tour.details(tour.id))}
      sx={{
        px: 2.5,
        py: 1.75,
        cursor: 'pointer',
        borderLeft: (t) =>
          `3px solid ${cfg ? t.palette[result === 'win' ? 'success' : result === 'loss' ? 'error' : 'warning'].main : alpha(t.palette.grey[500], 0.24)}`,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: (t) => t.shadows[4] },
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        {/* Date */}
        <Box sx={{ width: 52, flexShrink: 0, textAlign: 'center' }}>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1}>
            {startDate ? fDate(startDate, 'DD MMM') : '—'}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {startDate ? fTime(startDate) : ''}
          </Typography>
        </Box>

        {/* Match name + location */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={600} noWrap>
            {tour.name}
          </Typography>
          {tour.location && (
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.25 }}>
              <Iconify icon="mingcute:location-fill" width={12} sx={{ color: 'text.disabled', flexShrink: 0 }} />
              <Typography variant="caption" sx={{ color: 'text.secondary' }} noWrap>
                {tour.location}
              </Typography>
            </Stack>
          )}
        </Box>

        {/* Score */}
        {result ? (
          <Stack alignItems="center" spacing={0.5} sx={{ flexShrink: 0 }}>
            <Chip
              label={`${tour.scores.home} — ${tour.scores.away}`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '0.8rem',
                bgcolor: (t) => alpha(t.palette[result === 'win' ? 'success' : result === 'loss' ? 'error' : 'warning'].main, 0.1),
                color: cfg.color,
                border: 'none',
              }}
            />
            <Typography variant="caption" sx={{ color: cfg.color, fontWeight: 700, fontSize: '0.65rem', lineHeight: 1 }}>
              {result === 'win' ? 'Victoria' : result === 'loss' ? 'Derrota' : 'Empate'}
            </Typography>
          </Stack>
        ) : (
          <Typography variant="caption" sx={{ color: 'text.disabled', flexShrink: 0 }}>
            Pendiente
          </Typography>
        )}

        {/* Attendance */}
        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexShrink: 0, minWidth: 56 }}>
          <Iconify
            icon="solar:users-group-rounded-bold"
            width={14}
            sx={{ color: userBooked ? 'success.main' : 'text.disabled' }}
          />
          <Typography
            variant="caption"
            sx={{ color: userBooked ? 'success.main' : 'text.secondary', fontWeight: userBooked ? 700 : 400 }}
          >
            {bookerCount}
          </Typography>
          {userBooked && (
            <Iconify icon="eva:checkmark-fill" width={12} sx={{ color: 'success.main' }} />
          )}
        </Stack>

        <Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ color: 'text.disabled', flexShrink: 0 }} />
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function TourList({ tours }) {
  if (!tours.length) return null;

  return (
    <Stack spacing={1}>
      {tours.map((tour) => (
        <MatchTourRow key={tour.id} tour={tour} />
      ))}
    </Stack>
  );
}
