import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export const SCOPE_ALL = 'all';
export const SCOPE_UNASSIGNED = 'unassigned';

/**
 * Client-side category scope above the users table:
 * "Todas las categorías | <each category> | Sin asignar".
 * `counts` maps scope value -> number of users.
 */
export function UserCategoryScope({ value, onChange, workspaces, counts, onDeleteCategory }) {
  const { t } = useTranslation();

  const options = [
    { value: SCOPE_ALL, label: t('all_categories') },
    ...workspaces.map((ws) => ({ value: ws.id, label: ws.name })),
    // Only offered when someone is actually unassigned.
    ...(counts[SCOPE_UNASSIGNED] ? [{ value: SCOPE_UNASSIGNED, label: t('unassigned_scope') }] : []),
  ];

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ px: 2.5, py: 2, overflowX: 'auto', flexShrink: 0, '& > *': { flexShrink: 0 } }}
    >
      {options.map((opt) => (
        <Chip
          key={opt.value}
          clickable
          size="small"
          label={`${opt.label} (${counts[opt.value] ?? 0})`}
          color={value === opt.value ? 'primary' : 'default'}
          variant={value === opt.value ? 'filled' : 'outlined'}
          onClick={() => onChange(opt.value)}
        />
      ))}
      {onDeleteCategory && (
        <Tooltip title={t('label_delete_category')}>
          <IconButton size="small" color="error" onClick={onDeleteCategory}>
            <Iconify icon="solar:trash-bin-trash-bold" width={18} />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );
}
