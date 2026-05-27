import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Switch from '@mui/material/Switch';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { useGetAllWorkspaces } from 'src/actions/workspaces';
import {
  createMembership,
  deleteMembership,
  updateMembershipRole,
  useGetUserMemberships,
} from 'src/actions/memberships';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

const ROLE_OPTIONS = ['admin', 'user'];
const ROLE_COLORS = { admin: 'info', user: 'default' };

export function UserMembershipsDialog({ user, open, onClose }) {
  const { t } = useTranslation();
  const { allWorkspaces } = useGetAllWorkspaces(true);
  const { memberships, membershipsLoading } = useGetUserMemberships(open ? user?.id : null);

  const byWorkspace = new Map(memberships.map((m) => [m.workspace_id, m]));

  return (
    <Dialog
      fullWidth
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { maxWidth: 520 } }}
    >
      <DialogTitle>{t('manage_memberships')}</DialogTitle>

      <DialogContent dividers sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
          <Avatar src={user?.avatarUrl} alt={user?.name} sx={{ width: 40, height: 40 }} />
          <Box>
            <Typography variant="subtitle2">{user?.name}</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {user?.email}
            </Typography>
          </Box>
        </Stack>

        {membershipsLoading ? (
          <Stack alignItems="center" sx={{ py: 4 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : allWorkspaces.length === 0 ? (
          <Typography variant="body2" sx={{ color: 'text.secondary', py: 2 }}>
            {t('no_workspaces')}
          </Typography>
        ) : (
          <Stack divider={<Box sx={{ borderTop: (theme) => `dashed 1px ${theme.palette.divider}` }} />}>
            {allWorkspaces.map((ws) => (
              <MembershipRow
                key={ws.id}
                workspace={ws}
                membership={byWorkspace.get(ws.id)}
                userId={user.id}
              />
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={onClose}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MembershipRow({ workspace, membership, userId }) {
  const { t } = useTranslation();
  const rolePopover = usePopover();
  const [busy, setBusy] = useState(false);

  const isMember = !!membership;
  const role = membership?.role || 'user';
  const roleEditable = isMember && !busy;

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toast.error(err?.detail || t('something_went_wrong'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggle = () => {
    if (busy) return;
    if (isMember) {
      run(async () => {
        await deleteMembership(userId, workspace.id);
        toast.success(t('membership_removed'));
      });
    } else {
      run(async () => {
        await createMembership(userId, workspace.id, 'user');
        toast.success(t('membership_added'));
      });
    }
  };

  const handleRolePick = (newRole) => {
    rolePopover.onClose();
    if (newRole === role) return;
    run(async () => {
      await updateMembershipRole(userId, workspace.id, newRole);
      toast.success(t('role_updated'));
    });
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          py: 1.5,
          opacity: busy ? 0.6 : 1,
          transition: (theme) => theme.transitions.create('opacity'),
        }}
      >
        <Avatar src={workspace.logo} alt={workspace.name} sx={{ width: 32, height: 32 }} />

        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {workspace.name}
          </Typography>
        </Box>

        {isMember && (
          <Label
            variant="soft"
            color={ROLE_COLORS[role] || 'default'}
            onClick={roleEditable ? rolePopover.onOpen : undefined}
            endIcon={roleEditable ? <Iconify icon="eva:chevron-down-fill" width={14} /> : null}
            sx={{ cursor: roleEditable ? 'pointer' : 'default' }}
          >
            {t(role)}
          </Label>
        )}

        <Switch checked={isMember} onChange={handleToggle} disabled={busy} />
      </Stack>

      <CustomPopover
        open={rolePopover.open}
        anchorEl={rolePopover.anchorEl}
        onClose={rolePopover.onClose}
        slotProps={{ arrow: { placement: 'top-center' }, paper: { sx: { minWidth: 140 } } }}
      >
        <MenuList>
          {ROLE_OPTIONS.map((option) => (
            <MenuItem
              key={option}
              selected={option === role}
              onClick={() => handleRolePick(option)}
            >
              {t(option)}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
