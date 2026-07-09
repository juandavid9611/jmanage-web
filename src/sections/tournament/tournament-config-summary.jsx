import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// label/desc values below are i18n keys, resolved via t() at render time.
const SPORT_LABELS = {
  futbol: 'label_sport_futbol',
  baloncesto: 'label_sport_baloncesto',
  voleibol: 'label_sport_voleibol',
  tenis: 'label_sport_tenis',
  padel: 'label_sport_padel',
  otro: 'label_sport_otro',
};

const FORMAT_LABELS = {
  league: 'label_format_league',
  knockout: 'label_knockout',
  hybrid: 'label_groups_and_knockout',
};

const FORMAT_DESC = {
  league: 'label_format_league_desc',
  knockout: 'label_config_format_knockout_desc',
  hybrid: 'label_config_format_hybrid_desc',
};

const OPTION_LABELS = {
  public_registration: {
    label: 'label_option_public_registration_title',
    icon: 'mdi:account-plus-outline',
  },
  individual_stats: { label: 'label_option_individual_stats_title', icon: 'mdi:chart-bar' },
  public_results: { label: 'label_option_public_results_title', icon: 'mdi:eye-outline' },
  email_notifications: {
    label: 'label_option_email_notifications_title',
    icon: 'mdi:email-outline',
  },
  extra_time: { label: 'label_extra_time', icon: 'mdi:timer-sand' },
};

// ----------------------------------------------------------------------

export function TournamentConfigSummary({ tournament }) {
  const { t } = useTranslation();
  const rules = tournament.rules || {};
  const options = tournament.options || {};
  const tiebreakers = tournament.tiebreaker_order || [];

  return (
    <Box display="grid" gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }} gap={3}>
      {/* ── Left column ── */}
      <Stack spacing={3}>
        {/* Identity */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:badge-account-horizontal-outline" width={20} />
            <Typography variant="subtitle1">{t('label_step_identity')}</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <ConfigRow label={t('label_name')} value={tournament.name} />
            <Divider />
            <ConfigRow
              label={t('label_sport')}
              value={
                SPORT_LABELS[tournament.sport]
                  ? t(SPORT_LABELS[tournament.sport])
                  : tournament.sport || '—'
              }
            />
            <Divider />
            <ConfigRow label={t('label_city')} value={tournament.location || '—'} />
          </Stack>
        </Card>

        {/* Format */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:tournament" width={20} />
            <Typography variant="subtitle1">{t('label_format')}</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <ConfigRow
              label={t('label_type')}
              value={
                FORMAT_LABELS[tournament.type]
                  ? t(FORMAT_LABELS[tournament.type])
                  : tournament.type || '—'
              }
            />

            {FORMAT_DESC[tournament.type] && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {t(FORMAT_DESC[tournament.type])}
              </Typography>
            )}

            <Divider />
            <ConfigRow label={t('label_number_of_teams')} value={tournament.num_teams || '—'} />

            {tournament.teams_per_group && (
              <>
                <Divider />
                <ConfigRow label={t('label_teams_per_group')} value={tournament.teams_per_group} />
              </>
            )}

            {rules.total_matchweeks > 0 && (
              <>
                <Divider />
                <ConfigRow label={t('label_total_matchweeks')} value={rules.total_matchweeks} />
              </>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* ── Right column ── */}
      <Stack spacing={3}>
        {/* Scoring */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:scoreboard-outline" width={20} />
            <Typography variant="subtitle1">{t('label_step_scoring')}</Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <ScoreChip
              label={t('label_victory')}
              value={rules.points_per_win ?? 3}
              color="success"
            />
            <ScoreChip label={t('label_tie')} value={rules.points_per_draw ?? 1} color="warning" />
            <ScoreChip label={t('label_defeat')} value={rules.points_per_loss ?? 0} color="error" />
          </Stack>
        </Card>

        {/* Tiebreakers */}
        {tiebreakers.length > 0 && (
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="mdi:sort-variant" width={20} />
              <Typography variant="subtitle1">{t('label_tiebreaker_criteria')}</Typography>
            </Stack>

            <Stack spacing={1}>
              {tiebreakers.map((tb, idx) => (
                <Stack key={tb} direction="row" alignItems="center" spacing={1.5}>
                  <Chip label={idx + 1} size="small" variant="soft" color="default" />
                  <Typography variant="body2">{tb}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        )}

        {/* Options */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:cog-outline" width={20} />
            <Typography variant="subtitle1">{t('label_step_options')}</Typography>
          </Stack>

          <Stack spacing={1}>
            {Object.entries(OPTION_LABELS).map(([key, { label, icon }]) => {
              const enabled = !!options[key];
              return (
                <Stack key={key} direction="row" alignItems="center" spacing={1.5}>
                  <Iconify
                    icon={enabled ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-outline'}
                    width={20}
                    sx={{ color: enabled ? 'success.main' : 'text.disabled' }}
                  />
                  <Typography variant="body2" color={enabled ? 'text.primary' : 'text.disabled'}>
                    {t(label)}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ConfigRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2">{value}</Typography>
    </Stack>
  );
}

function ScoreChip({ label, value, color }) {
  return (
    <Card
      sx={{
        flex: 1,
        py: 2,
        textAlign: 'center',
        bgcolor: (theme) => theme.palette[color].lighter,
        boxShadow: 'none',
      }}
    >
      <Typography variant="h4" color={`${color}.dark`} sx={{ mb: 0.25 }}>
        {value}
      </Typography>
      <Typography
        variant="caption"
        color={`${color}.dark`}
        sx={{ textTransform: 'uppercase', letterSpacing: 1 }}
      >
        {label}
      </Typography>
    </Card>
  );
}
