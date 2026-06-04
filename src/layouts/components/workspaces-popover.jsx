import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';

import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

const ROLE_COLORS = {
  admin: 'info',
  user: 'default',
  team_owner: 'warning',
  coach: 'success',
};

// ----------------------------------------------------------------------

export function WorkspacesPopover({ data = [], sx, ...other }) {
  const popover = usePopover();
  const { t } = useTranslation();

  const mediaQuery = 'sm';

  const { selectedWorkspace, setSelectedWorkspace } = useWorkspace();

  const handleChangeWorkspace = useCallback(
    (newValue) => {
      setSelectedWorkspace(newValue);
      popover.onClose();
    },
    [popover, setSelectedWorkspace]
  );

  if (!selectedWorkspace) return null;

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={popover.onOpen}
        sx={{
          py: 0.5,
          gap: { xs: 0.5, [mediaQuery]: 1 },
          ...sx,
        }}
        {...other}
      >
        <Box
          component="img"
          alt={selectedWorkspace?.name}
          src={selectedWorkspace?.logo}
          sx={{ width: 24, height: 24, borderRadius: '50%' }}
        />

        <Box
          component="span"
          sx={{
            typography: 'subtitle2',
            display: { xs: 'none', [mediaQuery]: 'inline-flex' },
          }}
        >
          {selectedWorkspace?.name}
        </Box>

        <Label
          color={ROLE_COLORS[selectedWorkspace?.role] || 'default'}
          sx={{
            height: 22,
            display: { xs: 'none', [mediaQuery]: 'inline-flex' },
          }}
        >
          {selectedWorkspace?.role ? t(selectedWorkspace.role) : ''}
        </Label>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList sx={{ width: 240 }}>
          {data.map((option) => (
            <MenuItem
              key={option.id}
              selected={option.id === selectedWorkspace?.id}
              onClick={() => handleChangeWorkspace(option)}
              sx={{ height: 48 }}
            >
              <Avatar alt={option.name} src={option.logo} sx={{ width: 24, height: 24 }} />

              <Box component="span" sx={{ flexGrow: 1 }}>
                {option.name}
              </Box>

              <Label color={ROLE_COLORS[option.role] || 'default'}>
                {option.role ? t(option.role) : ''}
              </Label>
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
