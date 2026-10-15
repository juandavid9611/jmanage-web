import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import MenuList from '@mui/material/MenuList';
import MenuItem from '@mui/material/MenuItem';
import ButtonBase from '@mui/material/ButtonBase';

import { useWorkspace } from 'src/workspace/workspace-provider';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { usePopover, CustomPopover } from 'src/components/custom-popover';

// `value: null` is "exit preview, show my real admin view" — always first in the menu.
const PREVIEW_OPTIONS = [
  { value: null, labelKey: 'role_preview_own', color: 'info' },
  { value: 'coach', labelKey: 'coach', color: 'success' },
  { value: 'user', labelKey: 'role_preview_athlete', color: 'default' },
];

// ----------------------------------------------------------------------

export function RolePreviewPopover({ sx, ...other }) {
  const { t } = useTranslation();
  const popover = usePopover();
  const { canPreviewRole, previewRole, setPreviewRole } = useWorkspace();

  const handleSelect = useCallback(
    (value) => {
      setPreviewRole(value);
      popover.onClose();
    },
    [setPreviewRole, popover]
  );

  if (!canPreviewRole) return null;

  const current = PREVIEW_OPTIONS.find((option) => option.value === previewRole) ?? PREVIEW_OPTIONS[0];

  return (
    <>
      <ButtonBase
        disableRipple
        onClick={popover.onOpen}
        sx={{
          py: 0.5,
          gap: 0.75,
          display: { xs: 'none', sm: 'inline-flex' },
          ...sx,
        }}
        {...other}
      >
        <Iconify width={16} icon={previewRole ? 'solar:eye-bold' : 'solar:eye-closed-linear'} />

        <Label color={previewRole ? current.color : 'default'} sx={{ height: 22 }}>
          {t(current.labelKey)}
        </Label>

        <Iconify width={16} icon="carbon:chevron-sort" sx={{ color: 'text.disabled' }} />
      </ButtonBase>

      <CustomPopover
        open={popover.open}
        anchorEl={popover.anchorEl}
        onClose={popover.onClose}
        slotProps={{ arrow: { placement: 'top-left' } }}
      >
        <MenuList sx={{ minWidth: 220 }}>
          {PREVIEW_OPTIONS.map((option) => (
            <MenuItem
              key={option.labelKey}
              selected={option.value === previewRole}
              onClick={() => handleSelect(option.value)}
              sx={{ minHeight: 44, gap: 1.5 }}
            >
              {t(option.labelKey)}
            </MenuItem>
          ))}
        </MenuList>
      </CustomPopover>
    </>
  );
}
