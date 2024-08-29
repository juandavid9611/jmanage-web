import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import { Divider, CardHeader, Typography } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { fDateTime } from 'src/utils/format-time';
import { fPercent } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function NextEvents({ title, list, ...other }) {
  const theme = useTheme();
  const limit_time = new Date();
  limit_time.setHours(0, 0, 0, 0);

  const colors = [
    theme.vars.palette.info.main,
    theme.vars.palette.error.main,
    theme.vars.palette.secondary.main,
    theme.vars.palette.success.main,
  ];

  return (
    <Card {...other}>
      <CardHeader title={title} />

      <Box sx={{ p: 2, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {list.map(
          (item, index) =>
            item.start >= limit_time && (
              <Item key={item.id} item={item} sx={{ color: item.color }} />
            )
        )}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />
      <Box sx={{ p: 2, typography: 'caption', color: 'text.secondary' }}>Quorum de 15 personas</Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  const { participants } = item;
  const participantsCount = Object.entries(participants || {}).length || 0;
  const percent = (participantsCount / 20) * 100;

  const clickPopover = usePopover();
  const { user } = useAuthContext();

  return (
    <Box sx={{ gap: 1.5, display: 'flex', ...sx }} {...other}>
      <Box
        sx={{
          width: 6,
          my: '3px',
          height: 16,
          flexShrink: 0,
          opacity: 0.24,
          borderRadius: 1,
          bgcolor: 'currentColor',
        }}
      />

      <Box
        sx={{
          gap: 1,
          minWidth: 0,
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
        }}
      >
        <Link variant="subtitle2" color="inherit" sx={{ color: 'text.primary' }}>
          {item.title}
        </Link>

        <Box
          sx={{
            gap: 0.5,
            display: 'flex',
            alignItems: 'center',
            typography: 'caption',
            color: 'text.secondary',
          }}
        >
          <Iconify width={16} icon="solar:calendar-date-bold" />
          {fDateTime(item.start)}
          <Iconify width={16} icon="solar:map-point-wave-linear" />
          {item.description}
          <Iconify
            sx={{ color: item.color }}
            width={16}
            icon="solar:user-check-bold"
            onClick={clickPopover.onOpen}
          />
          {participantsCount}
        </Box>

        <Box sx={{ gap: 2, display: 'flex', alignItems: 'center' }}>
          <LinearProgress
            color="warning"
            variant="determinate"
            value={percent}
            sx={{
              width: 1,
              height: 6,
              bgcolor: (theme) => varAlpha(theme.vars.palette.grey['500Channel'], 0.16),
              [` .${linearProgressClasses.bar}`]: { bgcolor: 'currentColor' },
            }}
          />
          <Box
            component="span"
            sx={{
              width: 40,
              typography: 'caption',
              color: 'text.primary',
              fontWeight: 'fontWeightMedium',
            }}
          >
            {fPercent(percent)}
          </Box>
        </Box>
      </Box>
      <CustomPopover
        open={Boolean(clickPopover.open)}
        anchorEl={clickPopover.anchorEl}
        onClose={clickPopover.onClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <Box sx={{ p: 2, maxWidth: 280 }}>
          <Typography variant="subtitle1" gutterBottom>
            Participantes
          </Typography>
          {Object.entries(participants || {}).map((entry, index) =>
            entry[0] === user?.id ? (
              <Typography key={entry[0]} variant="body2" sx={{ color: 'text.primary' }}>
                {index + 1}. {entry[1]}
              </Typography>
            ) : (
              <Typography key={entry[0]} variant="body2" sx={{ color: 'text.secondary' }}>
                {index + 1}. {entry[1]}
              </Typography>
            )
          )}
        </Box>
      </CustomPopover>
    </Box>
  );
}
