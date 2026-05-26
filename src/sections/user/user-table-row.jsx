import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Select from '@mui/material/Select';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';

import { useBoolean } from 'src/hooks/use-boolean';

import { updateMembershipRole } from 'src/actions/memberships';
import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { ConfirmDialog } from 'src/components/custom-dialog';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

import { useAuthContext } from 'src/auth/hooks';

import { UserQuickEditForm } from './user-quick-edit-form';

const ROLE_OPTIONS = ['admin', 'user'];

// ----------------------------------------------------------------------

export function UserTableRow({ row, selected, onEditRow, onSelectRow, onDeleteRow }) {
  const confirm = useBoolean();

  const popover = usePopover();

  const quickEdit = useBoolean();

  const { t } = useTranslation();

  const { user } = useAuthContext();
  const { selectedWorkspace } = useWorkspace();

  const [role, setRole] = useState(row.role || 'user');
  const [updatingRole, setUpdatingRole] = useState(false);

  const isSelf = user?.id === row.id;

  const handleRoleChange = async (event) => {
    const newRole = event.target.value;
    const prevRole = role;
    setRole(newRole);
    setUpdatingRole(true);
    try {
      await updateMembershipRole(row.id, selectedWorkspace.id, newRole);
      toast.success(t('role_updated'));
    } catch (err) {
      setRole(prevRole);
      toast.error(err?.detail || t('something_went_wrong'));
    } finally {
      setUpdatingRole(false);
    }
  };
  return (
    <>
      <TableRow hover selected={selected} aria-checked={selected} tabIndex={-1}>
        <TableCell padding="checkbox">
          <Checkbox id={row.id} checked={selected} onClick={onSelectRow} />
        </TableCell>

        <TableCell>
          <Stack spacing={2} direction="row" alignItems="center">
            <Avatar alt={row.name} src={row.avatarUrl} />

            <Stack sx={{ typography: 'body2', flex: '1 1 auto', alignItems: 'flex-start' }}>
              <Link color="inherit" onClick={onEditRow} sx={{ cursor: 'pointer' }}>
                {row.name}
              </Link>
              <Box component="span" sx={{ color: 'text.disabled' }}>
                {row.email}
              </Box>
            </Stack>
          </Stack>
        </TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.phoneNumber}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{t(row.identityCardNumber)}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{t(row.shirtNumber)}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.eps}</TableCell>

        <TableCell sx={{ whiteSpace: 'nowrap' }}>
          <Select
            size="small"
            value={role}
            onChange={handleRoleChange}
            disabled={isSelf || updatingRole}
            sx={{ minWidth: 110 }}
          >
            {ROLE_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {t(option)}
              </MenuItem>
            ))}
          </Select>
        </TableCell>

        <TableCell>
          <Label
            variant="soft"
            color={
              (row.status === 'disabled' && 'error') ||
              (row.confirmationStatus === 'confirmed' && 'success') ||
              (row.confirmationStatus === 'pending' && 'warning') ||
              'default'
            }
          >
            {t(row.status === 'disabled' ? row.status : row.confirmationStatus)}
          </Label>
        </TableCell>

        <TableCell>
          <Stack direction="row" alignItems="center">
            <Tooltip title="Quick Edit" placement="top" arrow>
              <IconButton
                color={quickEdit.value ? 'inherit' : 'default'}
                onClick={quickEdit.onTrue}
              >
                <Iconify icon="solar:pen-bold" />
              </IconButton>
            </Tooltip>

            <IconButton color={popover.open ? 'inherit' : 'default'} onClick={popover.onOpen}>
              <Iconify icon="eva:more-vertical-fill" />
            </IconButton>
          </Stack>
        </TableCell>
      </TableRow>

      <UserQuickEditForm currentUser={row} open={quickEdit.value} onClose={quickEdit.onFalse} />

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'right-top' } }}
      >
        <MenuList>
          <MenuItem
            onClick={() => {
              confirm.onTrue();
              popover.onClose();
            }}
            sx={{ color: 'error.main' }}
          >
            <Iconify icon="solar:trash-bin-trash-bold" />
            {t('delete')}
          </MenuItem>

          <MenuItem
            onClick={() => {
              onEditRow();
              popover.onClose();
            }}
          >
            <Iconify icon="solar:pen-bold" />
            {t('edit')}
          </MenuItem>
        </MenuList>
      </CustomPopover>

      <ConfirmDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        title="Delete"
        content={`${t('delete_confirmation')}, ${t('delete_confirmation_2')}`}
        action={
          <Button variant="contained" color="error" onClick={onDeleteRow}>
            {t('delete')}
          </Button>
        }
      />
    </>
  );
}
