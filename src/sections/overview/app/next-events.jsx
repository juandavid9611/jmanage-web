import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import { useTheme } from '@mui/material/styles';
import { Button, Divider, CardHeader, Typography, IconButton } from '@mui/material';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useCopyToClipboard } from 'src/hooks/use-copy-to-clipboard';

import { fDateTime } from 'src/utils/format-time';
import { fPercent } from 'src/utils/format-number';

import { varAlpha } from 'src/theme/styles';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { Scrollbar } from 'src/components/scrollbar';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function NextEvents({ title, list, ...other }) {
  const theme = useTheme();
  const router = useRouter();
  const limit_time = new Date();
  limit_time.setHours(0, 0, 0, 0);

  return (
    <Card {...other}>
      <CardHeader title={title} />

      <Box sx={{ p: 2, gap: 3, display: 'flex', flexDirection: 'column' }}>
        {list.map(
          (event, index) =>
            event.start >= limit_time && (
              <Item key={event.id} item={event} sx={{ color: event.color }} />
            )
        )}
      </Box>
      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ typography: 'caption', color: 'text.secondary' }}>Quorum de 22 personas</Box>
        <Button
          size="medium"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          onClick={() => router.push(paths.dashboard.calendar)}
        >
          Inscribirme
        </Button>
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  const participantsCount = Object.entries(item.participants || {}).length || 0;
  const percent = (participantsCount / 20) * 100;

  const clickPopover = usePopover();
  const { user } = useAuthContext();

  const userParticipates = Object.entries(item.participants || {}).find(
    (entry) => entry[0] === user?.id
  );
  const { copy } = useCopyToClipboard();

  const onCopyParticipants = () => {
    if (!item.participants || Object.keys(item.participants).length === 0) {
      toast.error('No hay participantes para copiar.');
      return;
    }

    const formattedParticipants = Object.entries(item.participants)
      .map(([_, name], index) => `${index + 1}. ${name}`)
      .join('\n');

    const textToCopy = ` *${item.title.trim()}*
📅 ${fDateTime(item.start)}
📌 ${item.location} - ${item.description}

${formattedParticipants}`;

    copy(textToCopy);
    toast.success('Participantes copiados!');
  };

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
          {item.location} - {item.description}
          <Iconify
            sx={{
              color: userParticipates ? item.color : 'success',
            }}
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
        <Box sx={{ p: 2, width: 280 }}>
          <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ width: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Participantes
            </Typography>
            <IconButton onClick={() => onCopyParticipants()}>
              <Iconify icon="eva:copy-fill" width={24} />
            </IconButton>
          </Box>
          <Scrollbar sx={{ px: 2, pb: 3, pt: 0, maxHeight: '50vh' }}>
            {Object.entries(item.participants || {}).map((entry, index) =>
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
          </Scrollbar>
        </Box>
      </CustomPopover>
    </Box>
  );
}
