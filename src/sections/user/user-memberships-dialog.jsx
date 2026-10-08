import { useState, useCallback } from 'react';
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

const ROLE_OPTIONS = ['admin', 'user', 'team_owner', 'coach'];
const ROLE_COLORS = {
  admin: 'info',
  user: 'default',
  team_owner: 'warning',
  coach: 'success',
};

export function UserMembershipsDialog({ user, open, onClose }) {
  const { t } = useTranslation();
  const { allWorkspaces } = useGetAllWorkspaces(true);
  const { memberships, membershipsLoading } = useGetUserMemberships(open ? user?.id : null);

  // Optimistic overlay: workspaceId -> membership | null (removed). Kept until
  // the dialog closes so a stale refetch can never flicker a toggle back.
  const [overrides, setOverrides] = useState({});
  const [pending, setPending] = useState(0);
  const [dirty, setDirty] = useState(false);

  const setOverride = useCallback((workspaceId, value) => {
    setOverrides((prev) => {
      const next = { ...prev };
      if (value === undefined) delete next[workspaceId];
      else next[workspaceId] = value;
      return next;
    });
  }, []);

  const trackSave = useCallback(async (fn) => {
    setPending((n) => n + 1);
    try {
      await fn();
      setDirty(true);
      return true;
    } catch (err) {
      toast.error(err?.detail || t('something_went_wrong'));
      return false;
    } finally {
      setPending((n) => n - 1);
    }
  }, [t]);

  const handleClose = () => {
    setOverrides({});
    setDirty(false);
    onClose();
  };

  const byWorkspace = new Map(memberships.map((m) => [m.workspace_id, m]));
  Object.entries(overrides).forEach(([id, m]) => {
    if (m) byWorkspace.set(id, m);
    else byWorkspace.delete(id);
  });

  return (
    <Dialog fullWidth open={open} onClose={handleClose} PaperProps={{ sx: { maxWidth: 520 } }}>
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
          <Stack
            divider={<Box sx={{ borderTop: (theme) => `dashed 1px ${theme.palette.divider}` }} />}
          >
            {allWorkspaces.map((ws) => (
              <MembershipRow
                key={ws.id}
                workspace={ws}
                membership={byWorkspace.get(ws.id)}
                userId={user.id}
                setOverride={setOverride}
                trackSave={trackSave}
              />
            ))}
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.75}
          sx={{ flexGrow: 1, pl: 1, color: 'text.secondary', typography: 'caption' }}
        >
          {pending > 0 ? (
            <>
              <CircularProgress size={12} />
              <span>{t('memberships_saving')}</span>
            </>
          ) : (
            dirty && (
              <>
                <Iconify icon="eva:checkmark-fill" width={14} sx={{ color: 'success.main' }} />
                <span>{t('memberships_saved')}</span>
              </>
            )
          )}
        </Stack>

        <Button variant="soft" onClick={handleClose}>
          {t('close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function MembershipRow({ workspace, membership, userId, setOverride, trackSave }) {
  const { t } = useTranslation();
  const rolePopover = usePopover();
  // Brief lock per row so rapid double-clicks can't race two requests.
  const [busy, setBusy] = useState(false);

  const isMember = !!membership;
  const role = membership?.role || 'user';
  const roleEditable = isMember && !busy;

  const run = async (optimistic, fn) => {
    setBusy(true);
    setOverride(workspace.id, optimistic);
    const ok = await trackSave(fn);
    if (!ok) setOverride(workspace.id, undefined); // revert to server state
    setBusy(false);
  };

  const handleToggle = () => {
    if (busy) return;
    if (isMember) {
      run(null, () => deleteMembership(userId, workspace.id));
    } else {
      run({ workspace_id: workspace.id, role: 'user' }, () =>
        createMembership(userId, workspace.id, 'user')
      );
    }
  };

  const handleRolePick = (newRole) => {
    rolePopover.onClose();
    if (newRole === role || busy) return;
    run({ ...membership, role: newRole }, () =>
      updateMembershipRole(userId, workspace.id, newRole)
    );
  };

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ py: 1.5 }}
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

        <Switch checked={isMember} onChange={handleToggle} />
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
