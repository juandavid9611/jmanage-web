import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import CardContent from '@mui/material/CardContent';
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

import { useAuthContext } from 'src/auth/hooks';

const ROLE_OPTIONS = ['admin', 'user'];
const ROLE_COLORS = { admin: 'info', user: 'default' };

export function UserMembershipsCard({ userId }) {
  const { t } = useTranslation();
  const { user: authUser } = useAuthContext();
  const { allWorkspaces } = useGetAllWorkspaces(true);
  const { memberships, membershipsLoading } = useGetUserMemberships(userId);

  const isSelf = authUser?.id === userId;
  const membershipsByWorkspace = new Map(
    memberships.map((m) => [m.workspace_id, m])
  );

  return (
    <Card sx={{ mb: 3 }}>
      <CardHeader
        title={t('memberships')}
        subheader={t('memberships_subtitle')}
      />
      <CardContent>
        {membershipsLoading ? (
          <Stack alignItems="center" sx={{ py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : (
          <Stack spacing={1}>
            {allWorkspaces.map((ws) => (
              <MembershipRow
                key={ws.id}
                workspace={ws}
                membership={membershipsByWorkspace.get(ws.id)}
                userId={userId}
                disabled={isSelf}
              />
            ))}
            {allWorkspaces.length === 0 && (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                {t('no_workspaces')}
              </Typography>
            )}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function MembershipRow({ workspace, membership, userId, disabled }) {
  const { t } = useTranslation();
  const rolePopover = usePopover();
  const isMember = !!membership;
  const role = membership?.role || 'user';

  const [busy, setBusy] = useState(false);

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
    if (disabled || busy) return;
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

  const roleEditable = isMember && !disabled && !busy;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          px: 1.5,
          py: 1,
          borderRadius: 1.5,
          opacity: busy ? 0.6 : 1,
          transition: (theme) => theme.transitions.create('opacity'),
        }}
      >
        <Avatar src={workspace.logo} alt={workspace.name} sx={{ width: 36, height: 36 }} />

        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="subtitle2">{workspace.name}</Typography>
        </Box>

        {isMember && (
          <Label
            variant="soft"
            color={ROLE_COLORS[role] || 'default'}
            onClick={roleEditable ? rolePopover.onOpen : undefined}
            endIcon={
              roleEditable ? <Iconify icon="eva:chevron-down-fill" width={14} /> : null
            }
            sx={{
              cursor: roleEditable ? 'pointer' : 'default',
            }}
          >
            {t(role)}
          </Label>
        )}

        <Switch
          checked={isMember}
          onChange={handleToggle}
          disabled={disabled || busy}
        />
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
