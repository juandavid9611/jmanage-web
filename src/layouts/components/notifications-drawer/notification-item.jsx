import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemButton from '@mui/material/ListItemButton';

import { fToNow } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function NotificationItem({ notification }) {
  const renderAvatar = (
    <ListItemAvatar>
      {notification.avatarUrl ? (
        <Avatar src={notification.avatarUrl} sx={{ bgcolor: 'background.neutral' }} />
      ) : (
        <Avatar sx={{ bgcolor: 'background.neutral' }}>
          <Iconify icon="solar:bell-bing-bold-duotone" width={22} />
        </Avatar>
      )}
    </ListItemAvatar>
  );

  const renderText = (
    <ListItemText
      disableTypography
      primary={
        <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
          {notification.title}
        </Typography>
      }
      secondary={
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          {notification.body && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {notification.body}
            </Typography>
          )}
          <Typography variant="caption" sx={{ color: 'text.disabled' }}>
            {fToNow(notification.createdAt)}
          </Typography>
        </Box>
      }
    />
  );

  const renderUnReadBadge = notification.isUnRead && (
    <Box
      sx={{
        top: 26,
        width: 8,
        height: 8,
        right: 20,
        borderRadius: '50%',
        bgcolor: 'info.main',
        position: 'absolute',
      }}
    />
  );

  return (
    <ListItemButton
      disableRipple
sx={{
        p: 2.5,
        alignItems: 'flex-start',
        borderBottom: (theme) => `dashed 1px ${theme.vars.palette.divider}`,
      }}
    >
      {renderUnReadBadge}
      {renderAvatar}
      <Box sx={{ flexGrow: 1 }}>{renderText}</Box>
    </ListItemButton>
  );
}
