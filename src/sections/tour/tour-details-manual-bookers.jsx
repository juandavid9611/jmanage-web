import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Checkbox from '@mui/material/Checkbox';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { useGetEvents } from 'src/actions/calendar';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetEngagementRoster,
  useGetCalendarEventLink,
  useGetEngagementMatches,
  useGetEngagementTournaments,
  patchEngagementLineupEntryStat,
} from 'src/actions/engagement';

import { Iconify } from 'src/components/iconify';

import { IncrementerButton } from './components/incrementer-button';

// ----------------------------------------------------------------------------
// A Tour's own "bookers" are strictly real-user entries (tour.bookers is a
// dict keyed by user id — see src/actions/tours.js). A coach can only call
// up a player with no account yet through "Torneos del Club" (src/actions/
// engagement.js), when this match's calendar event is linked to a club
// tournament (event.clubMatchId). This surfaces those guest call-ups here
// too, with the same goals/assists/incidents controls tour.bookers gets, so
// this screen stops under-reporting who was actually convocado — the
// roster/lineup themselves still live and get edited over there.

const STATUS_LABEL_KEY = { titular: 'label_starter', suplente: 'label_substitute' };

// Stable reference: a fresh `[]` each render would rebuild the roster (and the
// guestCalled memo below) on every render.
const NO_USERS = [];

export function TourDetailsManualBookers({ tourId }) {
  const { t } = useTranslation();
  const router = useRouter();
  const { selectedWorkspace } = useWorkspace();
  const workspaceId = selectedWorkspace?.id;

  const { events } = useGetEvents({ id: workspaceId });
  const linkedEvent = events?.find((event) => event.tourId === tourId);
  const clubMatchId = linkedEvent?.clubMatchId;

  const { tournaments } = useGetEngagementTournaments(workspaceId);
  const { link } = useGetCalendarEventLink(clubMatchId, tournaments, workspaceId);

  // No real players needed to join here — only guest entries are shown.
  const { roster } = useGetEngagementRoster(link?.tournament_id, NO_USERS, workspaceId);
  const { matches } = useGetEngagementMatches(link?.tournament_id, workspaceId);
  const match = matches.find((item) => item.id === link?.match_id);
  const tournament = tournaments.find((item) => item.id === link?.tournament_id);

  const [localEntries, setLocalEntries] = useState({});

  const guestCalled = useMemo(() => {
    if (!match?.lineup) return [];
    const entriesById = new Map(match.lineup.entries.map((entry) => [entry.roster_entry_id, entry]));
    return roster
      .filter((player) => player.isGuest)
      .map((player) => ({ player, entry: entriesById.get(player.id) }))
      .filter(({ entry }) => entry?.called_up);
  }, [roster, match]);

  const handleStatChange = useCallback(
    async (player, field, newValue) => {
      setLocalEntries((prev) => ({
        ...prev,
        [player.id]: { ...prev[player.id], [field]: newValue },
      }));
      try {
        await patchEngagementLineupEntryStat(
          link.tournament_id,
          link.match_id,
          player.id,
          field,
          newValue,
          workspaceId
        );
      } catch (error) {
        toast.error(t('label_error_updating_player'));
        console.error(error);
        setLocalEntries((prev) => ({
          ...prev,
          [player.id]: { ...prev[player.id], [field]: undefined },
        }));
      }
    },
    [link, workspaceId, t]
  );

  if (!clubMatchId || guestCalled.length === 0) return null;

  return (
    <Card sx={{ mt: 3 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
        sx={{ px: 2.5, py: 2, bgcolor: (theme) => alpha(theme.palette.grey[500], 0.04) }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Iconify icon="mdi:account-question" width={20} sx={{ color: 'warning.main' }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t('label_manual_bookers_title')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('label_manual_bookers_subtitle', { tournament: tournament?.name || t('label_club_tournaments') })}
            </Typography>
          </Box>
        </Stack>

        <Button
          size="small"
          variant="soft"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={16} />}
          onClick={() => router.push(paths.dashboard.clubTournaments)}
        >
          {t('label_view_in_club_tournaments')}
        </Button>
      </Stack>

      <Divider />

      <Stack divider={<Divider sx={{ mx: 2.5 }} />}>
        {guestCalled.map(({ player, entry }) => (
          <GuestBookerRow
            key={player.id}
            player={player}
            entry={{ ...entry, ...localEntries[player.id] }}
            onChange={(field, value) => handleStatChange(player, field, value)}
          />
        ))}
      </Stack>
    </Card>
  );
}

// ── GuestBookerRow ────────────────────────────────────────────────────

function GuestBookerRow({ player, entry, onChange }) {
  const { t } = useTranslation();

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      spacing={2}
      sx={{ px: 2.5, py: 1.5 }}
    >
      <Box sx={{ position: 'relative' }}>
        <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
          {player.name?.charAt(0)}
        </Avatar>
        {entry.mvp && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 14,
              height: 14,
              borderRadius: '50%',
              bgcolor: 'warning.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid',
              borderColor: 'background.paper',
            }}
          >
            <Iconify icon="solar:star-bold" width={7} sx={{ color: 'white' }} />
          </Box>
        )}
      </Box>

      <Stack sx={{ minWidth: 0, flexGrow: 1 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
          {player.name}
        </Typography>
        <Chip
          label={t('label_no_account')}
          size="small"
          color="warning"
          variant="soft"
          sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700, alignSelf: 'flex-start', mt: 0.25 }}
        />
      </Stack>

      {/* Goals + assists incrementers */}
      <Stack spacing={0.5}>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mdi:soccer" width={11} sx={{ color: 'primary.main', flexShrink: 0 }} />
          <IncrementerButton
            name="goals"
            quantity={entry.goals || 0}
            disabledDecrease={(entry.goals || 0) <= 0}
            disabledIncrease={(entry.goals || 0) >= 20}
            onIncrease={() => onChange('goals', (entry.goals || 0) + 1)}
            onDecrease={() => onChange('goals', (entry.goals || 0) - 1)}
          />
        </Stack>
        <Stack direction="row" alignItems="center" spacing={0.5}>
          <Iconify icon="mdi:shoe-cleat" width={11} sx={{ color: 'warning.main', flexShrink: 0 }} />
          <IncrementerButton
            name="assists"
            quantity={entry.assists || 0}
            disabledDecrease={(entry.assists || 0) <= 0}
            disabledIncrease={(entry.assists || 0) >= 20}
            onIncrease={() => onChange('assists', (entry.assists || 0) + 1)}
            onDecrease={() => onChange('assists', (entry.assists || 0) - 1)}
          />
        </Stack>
      </Stack>

      {/* Incidents */}
      <Stack direction="row" alignItems="center" spacing={0.25}>
        <Tooltip title="MVP">
          <Checkbox
            size="small"
            color="warning"
            checked={!!entry.mvp}
            icon={<Iconify icon="solar:star-outline" width={16} />}
            checkedIcon={<Iconify icon="solar:star-bold" width={16} />}
            onClick={() => onChange('mvp', !entry.mvp)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title={t('label_late_arrival')}>
          <Checkbox
            size="small"
            color="info"
            checked={!!entry.late}
            icon={<Iconify icon="mdi:clock-alert-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:clock-alert" width={16} />}
            onClick={() => onChange('late', !entry.late)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title={t('label_yellow_card_singular')}>
          <Checkbox
            size="small"
            color="warning"
            checked={!!entry.yellowCard}
            icon={<Iconify icon="mdi:card-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:card" width={16} />}
            onClick={() => onChange('yellowCard', !entry.yellowCard)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
        <Tooltip title={t('label_red_card_singular')}>
          <Checkbox
            size="small"
            color="error"
            checked={!!entry.redCard}
            icon={<Iconify icon="mdi:card-remove-outline" width={16} />}
            checkedIcon={<Iconify icon="mdi:card-remove" width={16} />}
            onClick={() => onChange('redCard', !entry.redCard)}
            sx={{ p: 0.5 }}
          />
        </Tooltip>
      </Stack>

      {entry.status && (
        <Chip
          label={t(STATUS_LABEL_KEY[entry.status] || entry.status)}
          size="small"
          variant="outlined"
          sx={{ fontWeight: 700 }}
        />
      )}

      {entry.minutes > 0 && (
        <Typography variant="caption" sx={{ color: 'text.secondary', minWidth: 48, textAlign: 'right' }}>
          {entry.minutes}&apos;
        </Typography>
      )}
    </Stack>
  );
}
