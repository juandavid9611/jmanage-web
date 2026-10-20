import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
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
} from 'src/actions/engagement';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------
// A Tour's own "bookers" are strictly real-user entries (tour.bookers is a
// dict keyed by user id — see src/actions/tours.js). A coach can only call
// up a player with no account yet through "Torneos del Club" (src/actions/
// engagement.js), when this match's calendar event is linked to a club
// tournament (event.clubMatchId). This surfaces those guest call-ups here
// too, read-only, so this screen stops under-reporting who was actually
// convocado — the roster/lineup themselves still live and get edited over
// there.

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

  const guestCalled = useMemo(() => {
    if (!match?.lineup) return [];
    const entriesById = new Map(match.lineup.entries.map((entry) => [entry.roster_entry_id, entry]));
    return roster
      .filter((player) => player.isGuest)
      .map((player) => ({ player, entry: entriesById.get(player.id) }))
      .filter(({ entry }) => entry?.called_up);
  }, [roster, match]);

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
          <Stack key={player.id} direction="row" alignItems="center" spacing={2} sx={{ px: 2.5, py: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, fontSize: '0.85rem', fontWeight: 700 }}>
              {player.name?.charAt(0)}
            </Avatar>

            <Stack sx={{ flexGrow: 1, minWidth: 0 }}>
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
        ))}
      </Stack>
    </Card>
  );
}
