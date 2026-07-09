import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function GroupPanel({ groups, teams }) {
  const { t } = useTranslation();
  if (!groups?.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
        {t('label_no_groups_defined')}
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      {groups.map((group) => {
        const groupTeams = teams.filter((team) => team.group_id === group.id);

        return (
          <Card key={group.id} sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify icon="mdi:group" width={20} />
              <Typography variant="subtitle1">{group.name}</Typography>
              <Chip
                label={`${groupTeams.length} ${groupTeams.length !== 1 ? t('word_teams_lowercase') : t('word_team_lowercase')}`}
                size="small"
                variant="soft"
                color="primary"
              />
              {group.advancement_slots && (
                <Chip
                  label={`${t('label_advance_count_prefix')} ${group.advancement_slots}`}
                  size="small"
                  variant="soft"
                  color="info"
                />
              )}
            </Stack>

            <Stack direction="row" flexWrap="wrap" gap={1}>
              {groupTeams.map((team) => (
                <Chip key={team.id} label={team.name} variant="outlined" />
              ))}
              {groupTeams.length === 0 && (
                <Typography variant="caption" color="text.secondary">
                  {t('label_no_teams_assigned')}
                </Typography>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
