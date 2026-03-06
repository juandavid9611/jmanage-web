import { m } from 'framer-motion';
import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Badge from '@mui/material/Badge';
import Drawer from '@mui/material/Drawer';
import SvgIcon from '@mui/material/SvgIcon';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { varHover } from 'src/components/animate';
import { Scrollbar } from 'src/components/scrollbar';
import { CustomTabs } from 'src/components/custom-tabs';
import { useNotificationsContext } from 'src/components/onesignal/notifications-context';

import { NotificationItem } from './notification-item';

// ----------------------------------------------------------------------

export function NotificationsDrawer({ sx, ...other }) {
  const drawer = useBoolean();

  const { notifications, markAllAsRead, markAsRead } = useNotificationsContext();

  const [currentTab, setCurrentTab] = useState('all');

  const handleChangeTab = useCallback((event, newValue) => {
    setCurrentTab(newValue);
  }, []);

  const totalUnRead = notifications.filter((n) => n.isUnRead).length;

  const filtered = {
    all: notifications,
    unread: notifications.filter((n) => n.isUnRead),
  }[currentTab] ?? notifications;

  const TABS = [
    { value: 'all', label: 'Todos', count: notifications.length },
    { value: 'unread', label: 'Sin leer', count: totalUnRead },
  ];

  const renderHead = (
    <Stack direction="row" alignItems="center" sx={{ py: 2, pl: 2.5, pr: 1, minHeight: 68 }}>
      <Typography variant="h6" sx={{ flexGrow: 1 }}>
        Notificaciones
      </Typography>

      {!!totalUnRead && (
        <Tooltip title="Marcar todas como leídas">
          <IconButton color="primary" onClick={markAllAsRead}>
            <Iconify icon="eva:done-all-fill" />
          </IconButton>
        </Tooltip>
      )}

      <IconButton onClick={drawer.onFalse} sx={{ display: { xs: 'inline-flex', sm: 'none' } }}>
        <Iconify icon="mingcute:close-line" />
      </IconButton>
    </Stack>
  );

  const renderTabs = (
    <CustomTabs variant="fullWidth" value={currentTab} onChange={handleChangeTab}>
      {TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            <Label
              variant={((tab.value === 'all' || tab.value === currentTab) && 'filled') || 'soft'}
              color={tab.value === 'unread' ? 'info' : 'default'}
            >
              {tab.count}
            </Label>
          }
        />
      ))}
    </CustomTabs>
  );

  const renderEmpty = (
    <Box sx={{ py: 8, textAlign: 'center', color: 'text.disabled' }}>
      <Iconify icon="solar:bell-off-bold-duotone" width={48} sx={{ mb: 1, opacity: 0.5 }} />
      <Typography variant="body2">Sin notificaciones</Typography>
    </Box>
  );

  const renderList = (
    <Scrollbar>
      {filtered.length === 0 ? (
        renderEmpty
      ) : (
        <Box component="ul">
          {filtered.map((notification) => (
            <Box component="li" key={notification.id} sx={{ display: 'flex' }}>
              <NotificationItem
                notification={notification}
                onMarkRead={() => markAsRead(notification.id)}
              />
            </Box>
          ))}
        </Box>
      )}
    </Scrollbar>
  );

  return (
    <>
      <IconButton
        component={m.button}
        whileTap="tap"
        whileHover="hover"
        variants={varHover(1.05)}
        onClick={drawer.onTrue}
        sx={sx}
        {...other}
      >
        <Badge badgeContent={totalUnRead} color="error">
          <SvgIcon>
            <path
              fill="currentColor"
              d="M18.75 9v.704c0 .845.24 1.671.692 2.374l1.108 1.723c1.011 1.574.239 3.713-1.52 4.21a25.794 25.794 0 0 1-14.06 0c-1.759-.497-2.531-2.636-1.52-4.21l1.108-1.723a4.393 4.393 0 0 0 .693-2.374V9c0-3.866 3.022-7 6.749-7s6.75 3.134 6.75 7"
              opacity="0.5"
            />
            <path
              fill="currentColor"
              d="M12.75 6a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0zM7.243 18.545a5.002 5.002 0 0 0 9.513 0c-3.145.59-6.367.59-9.513 0"
            />
          </SvgIcon>
        </Badge>
      </IconButton>

      <Drawer
        open={drawer.value}
        onClose={drawer.onFalse}
        anchor="right"
        slotProps={{ backdrop: { invisible: true } }}
        PaperProps={{ sx: { width: 1, maxWidth: 420 } }}
      >
        {renderHead}
        {renderTabs}
        {renderList}
      </Drawer>
    </>
  );
}
