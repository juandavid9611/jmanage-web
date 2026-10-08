import { useTranslation } from 'react-i18next';

import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';

// ----------------------------------------------------------------------

const MAX_VISIBLE = 2;

/** Compact chips for a user's categories (`memberships`), with '+N' overflow. */
export function UserCategoryChips({ memberships, workspacesById }) {
  const { t } = useTranslation();

  const names = (memberships || []).map(
    (m) => workspacesById.get(m.workspace_id ?? m.workspaceId)?.name || '—'
  );

  if (!names.length) {
    return <Chip size="small" variant="outlined" label={t('no_category')} />;
  }

  const hidden = names.slice(MAX_VISIBLE);

  return (
    <Stack direction="row" spacing={0.5} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 0.5 }}>
      {names.slice(0, MAX_VISIBLE).map((name, index) => (
        <Chip key={`${name}-${index}`} size="small" variant="soft" label={name} />
      ))}

      {hidden.length > 0 && (
        <Tooltip title={hidden.join(', ')} arrow>
          <Chip size="small" variant="outlined" label={`+${hidden.length}`} />
        </Tooltip>
      )}
    </Stack>
  );
}
