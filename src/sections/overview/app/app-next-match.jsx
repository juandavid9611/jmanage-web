import { useTranslation } from 'react-i18next';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function AppNextMatch({ title, subheader, match, ...other }) {
  const { t } = useTranslation();

  if (!match) {
    return null;
  }

  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Stack spacing={3} sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <TeamItem team={match.homeTeam} />
          
          <Stack alignItems="center" spacing={1}>
            <Typography variant="h6">VS</Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {fDateTime(match.date, 'dd MMM yyyy p')}
            </Typography>
            {match.venue && (
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {match.venue}
              </Typography>
            )}
          </Stack>

          <TeamItem team={match.awayTeam} />
        </Stack>

        <Button
          fullWidth
          variant="contained"
          color="primary"
          startIcon={<Iconify icon="solar:calendar-add-bold" />}
        >
          {t('add_to_calendar')}
        </Button>
      </Stack>
    </Card>
  );
}

// ----------------------------------------------------------------------

function TeamItem({ team }) {
  const fallbackLogo = '/assets/illustrations/illustration_club.png';
  
  return (
    <Stack spacing={2} alignItems="center" sx={{ width: 1 }}>
      <Avatar
        alt={team?.name}
        src={team?.logo || fallbackLogo}
        variant="rounded"
        sx={{ width: 64, height: 64 }}
      >
        {team?.name?.charAt(0).toUpperCase()}
      </Avatar>
      <Typography variant="subtitle2" noWrap>
        {team?.name}
      </Typography>
    </Stack>
  );
}
