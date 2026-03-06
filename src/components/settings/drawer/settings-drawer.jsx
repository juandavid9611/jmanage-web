import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Drawer, { drawerClasses } from '@mui/material/Drawer';
import { useTheme, useColorScheme } from '@mui/material/styles';

import { paper, varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

import { BaseOption } from './base-option';
import { Scrollbar } from '../../scrollbar';
import { useSettingsContext } from '../context';
import { FullScreenButton } from './fullscreen-button';
import { useNotificationsContext } from '../../onesignal/notifications-context';

// ----------------------------------------------------------------------

export function SettingsDrawer({ sx }) {
  const theme = useTheme();

  const settings = useSettingsContext();

  const { notificationsLoading, permissionGranted } = useNotificationsContext();

  const { mode, setMode } = useColorScheme();

  const renderHead = (
    <Box display="flex" alignItems="center" sx={{ py: 2, pr: 1, pl: 2.5 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Settings
      </Typography>

      <FullScreenButton />

      <Tooltip title="Close">
        <IconButton onClick={settings.onCloseDrawer}>
          <Iconify icon="mingcute:close-line" />
        </IconButton>
      </Tooltip>
    </Box>
  );

  const renderMode = (
    <BaseOption
      label="Dark mode"
      icon="moon"
      selected={settings.colorScheme === 'dark'}
      onClick={() => {
        settings.onUpdateField('colorScheme', mode === 'light' ? 'dark' : 'light');
        setMode(mode === 'light' ? 'dark' : 'light');
      }}
    />
  );

  const renderContrast = (
    <BaseOption
      label="Contrast"
      icon="contrast"
      selected={settings.contrast === 'hight'}
      onClick={() =>
        settings.onUpdateField('contrast', settings.contrast === 'default' ? 'hight' : 'default')
      }
    />
  );

  const renderNotifications = (
    <BaseOption
      label="Notificaciones"
      icon="notification"
      selected={settings.notificationsEnabled && permissionGranted}
      loading={notificationsLoading}
      onClick={() => {
        if (settings.notificationsEnabled) {
          settings.onUpdateField('notificationsEnabled', false);
        } else {
          localStorage.removeItem('onesignal-asked');
          settings.onUpdateField('notificationsEnabled', true);
        }
      }}
    />
  );

  return (
    <Drawer
      anchor="right"
      open={settings.openDrawer}
      onClose={settings.onCloseDrawer}
      slotProps={{ backdrop: { invisible: true } }}
      sx={{
        [`& .${drawerClasses.paper}`]: {
          ...paper({
            theme,
            color: varAlpha(theme.vars.palette.background.defaultChannel, 0.9),
          }),
          width: 360,
          ...sx,
        },
      }}
    >
      {renderHead}

      <Scrollbar>
        <Stack spacing={6} sx={{ px: 2.5, pb: 5 }}>
          <Box gap={2} display="grid" gridTemplateColumns="repeat(2, 1fr)">
            {renderMode}
            {renderContrast}
            {renderNotifications}
          </Box>
        </Stack>
      </Scrollbar>
    </Drawer>
  );
}
