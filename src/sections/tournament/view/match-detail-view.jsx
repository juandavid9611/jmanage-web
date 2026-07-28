import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { paths } from 'src/routes/paths';

import { fDateTime } from 'src/utils/format-time';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetMatch,
  useGetTeams,
  updateMatch,
  deleteMatch,
  advanceWinner,
  useGetPlayers,
  useGetTournament,
  createMatchEvent,
  deleteMatchEvent,
  createMatchCharges,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { useAuthContext } from 'src/auth/hooks';

import { EventBadge, EVENT_CONFIG, MatchScheduleDialog } from '../match-row';

// ----------------------------------------------------------------------

// label values below are i18n keys, resolved via t() at render time.
const STATUS_ACTIONS = {
  scheduled: { next: 'live', label: 'label_start_match', icon: 'mdi:play' },
  live: { next: 'finished', label: 'label_finish', icon: 'mdi:whistle' },
};

const STATUS_CHIP = {
  live: { label: 'label_live', color: 'error' },
  finished: { label: 'label_finished', color: 'success' },
  scheduled: { label: 'label_scheduled', color: 'default' },
};

const EVENT_TYPES = [
  { value: 'goal', label: 'label_goal_singular' },
  { value: 'own_goal', label: 'label_own_goal' },
  { value: 'yellow_card', label: 'label_yellow_card_full' },
  { value: 'red_card', label: 'label_red_card_full' },
  { value: 'substitution', label: 'label_substitution' },
  { value: 'penalty_scored', label: 'label_penalty_scored_full' },
  { value: 'penalty_missed', label: 'label_penalty_missed' },
];

export function MatchDetailView() {
  const { t } = useTranslation();
  const { id: tournamentId, matchId } = useParams();
  const navigate = useNavigate();

  const { tournament } = useGetTournament(tournamentId);
  const { match, matchLoading } = useGetMatch(tournamentId, matchId);
  const { teams } = useGetTeams(tournamentId);
  const { players } = useGetPlayers(tournamentId);

  const { workspaceRole } = useWorkspace();
  const { user } = useAuthContext();
  const isAccountAdmin = user?.accountsRoles?.[user?.activeAccountId] === 'admin';
  const isAdmin = workspaceRole === 'admin' || isAccountAdmin;

  const [eventDialog, setEventDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventForm, setEventForm] = useState({
    type: 'goal',
    minute: '',
    player_id: '',
    team_id: '',
    assist_player_id: '',
  });

  const [notes, setNotes] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [chargesLoading, setChargesLoading] = useState(false);

  useEffect(() => {
    if (match) setNotes(match.notes || '');
  }, [match]);

  if (matchLoading) return <LoadingScreen />;
  if (!match) return <Typography>{t('label_match_not_found')}</Typography>;

  const homeTeam = teams.find((team) => team.id === match.home_team_id);
  const awayTeam = teams.find((team) => team.id === match.away_team_id);
  const homeName = homeTeam?.short_name || homeTeam?.name || t('label_tbd');
  const awayName = awayTeam?.short_name || awayTeam?.name || t('label_tbd');
  const events = match.events || [];
  const statusAction = STATUS_ACTIONS[match.status];
  const chipCfg = STATUS_CHIP[match.status] || STATUS_CHIP.scheduled;

  const isLive = match.status === 'live';
  const isFinished = match.status === 'finished';
  const isPending = match.status === 'scheduled';

  const matchPlayers = players.filter(
    (p) => p.team_id === match.home_team_id || p.team_id === match.away_team_id
  );

  // ── Handlers ───────────────────────────────────────────────────────
  const handleStatusTransition = async () => {
    try {
      setIsSubmitting(true);
      await updateMatch(tournamentId, matchId, { status: statusAction.next });
      toast.success(
        statusAction.next === 'finished'
          ? t('label_match_finished_score_calculated')
          : t('label_status_updated')
      );
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReopen = async () => {
    try {
      setIsSubmitting(true);
      await updateMatch(tournamentId, matchId, { status: 'live' });
      toast.success(t('label_match_reopened'));
    } catch (error) {
      toast.error(error.message || t('label_error_reopening_match'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      setIsSubmitting(true);
      await createMatchEvent(matchId, { ...eventForm, minute: Number(eventForm.minute) });
      setEventDialog(false);
      setEventForm({ type: 'goal', minute: '', player_id: '', team_id: '', assist_player_id: '' });
      toast.success(t('label_event_registered'));
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMatch(tournamentId, matchId);
      toast.success(t('label_match_deleted'));
      navigate(paths.dashboard.tournament.details(tournamentId));
    } catch (error) {
      toast.error(t('label_error_deleting'));
    }
  };

  const handleCreateCharges = async () => {
    try {
      setChargesLoading(true);
      const {
        created,
        card_events_found: cardEventsFound,
        skipped_already_charged: alreadyCharged,
        skipped_no_team: noTeam,
        skipped_no_manager: noManager,
        skipped_fee_zero: feeZero,
      } = await createMatchCharges(tournamentId, matchId);

      if (created > 0) {
        toast.success(
          `${created} ${created !== 1 ? t('label_charges_plural') : t('label_charge_singular')} ${created !== 1 ? t('label_generated_plural') : t('label_generated_singular')}`
        );
      } else if (cardEventsFound === 0) {
        toast.info(t('label_match_has_no_card_events'));
      } else if (alreadyCharged > 0 && alreadyCharged === cardEventsFound) {
        toast.info(t('label_charges_already_generated'));
      } else if (noManager > 0) {
        toast.warning(t('label_no_charges_generated_no_manager'));
      } else if (noTeam > 0) {
        toast.warning(t('label_no_charges_generated_no_team'));
      } else if (feeZero > 0) {
        toast.warning(t('label_no_charges_generated_fees_not_configured'));
      } else {
        toast.warning(t('label_no_charges_generated'));
      }
    } catch (err) {
      toast.error(err.message || t('label_error_generating_charges'));
    } finally {
      setChargesLoading(false);
    }
  };

  const handleSaveNotes = async () => {
    try {
      setIsSubmitting(true);
      await updateMatch(tournamentId, matchId, { notes });
      toast.success(t('label_notes_saved_successfully'));
    } catch (error) {
      toast.error(error.message || t('label_error_saving_notes'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await deleteMatchEvent(matchId, eventId);
      toast.success(t('label_event_deleted'));
    } catch (error) {
      toast.error(t('label_error_deleting_event'));
    }
  };

  // ── Compute live score & mocked pending payments ─────────────────────────────────────────────
  const goalTypes = new Set(['goal', 'penalty_scored']);
  let liveScoreHome = 0;
  let liveScoreAway = 0;
  let yellowCardsCount = 0;
  let redCardsCount = 0;

  events.forEach((ev) => {
    if (goalTypes.has(ev.type)) {
      if (ev.team_id === match.home_team_id) liveScoreHome += 1;
      if (ev.team_id === match.away_team_id) liveScoreAway += 1;
    } else if (ev.type === 'own_goal') {
      if (ev.team_id === match.home_team_id) liveScoreAway += 1;
      if (ev.team_id === match.away_team_id) liveScoreHome += 1;
    } else if (ev.type === 'yellow_card') {
      yellowCardsCount += 1;
    } else if (ev.type === 'red_card' || ev.type === 'second_yellow') {
      redCardsCount += 1;
    }
  });

  const pendingAmount = yellowCardsCount * 15000 + redCardsCount * 30000;

  const scoreHome = isLive ? liveScoreHome : match.score_home === -1 ? '-' : match.score_home;
  const scoreAway = isLive ? liveScoreAway : match.score_away === -1 ? '-' : match.score_away;

  // ── Sort events ─────────────────────────────────────────────────
  const sortedEvents = [...events].sort((a, b) => (a.minute || 0) - (b.minute || 0));

  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      <CustomBreadcrumbs
        heading={t('label_match_detail')}
        links={[
          { name: t('label_dashboard'), href: paths.dashboard.root },
          { name: t('tournaments'), href: paths.dashboard.tournament.root },
          { name: tournament?.name || '', href: paths.dashboard.tournament.details(tournamentId) },
          { name: `${homeName} ${t('label_vs')} ${awayName}` },
        ]}
        sx={{ px: { xs: 2, md: 3.5 }, pt: { xs: 2, md: 2.75 }, pb: 0 }}
      />

      {/* ── Score Header ───────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          px: { xs: 2, md: 3.5 },
          py: { xs: 3, md: 4 },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            maxWidth: 600,
            mx: 'auto',
          }}
        >
          {/* Home */}
          <Stack alignItems="center" spacing={0.75}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -0.5, textAlign: 'center' }}
            >
              {homeTeam?.name || t('label_home_team')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {homeName}
            </Typography>
          </Stack>

          {/* Score center */}
          <Stack alignItems="center" spacing={1} sx={{ px: 3 }}>
            <Stack direction="row" alignItems="baseline" spacing={1.5}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  ...(isLive && { color: 'error.main' }),
                }}
              >
                {scoreHome}
              </Typography>
              <Typography variant="h4" sx={{ color: 'text.disabled', lineHeight: 1 }}>
                ·
              </Typography>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'monospace',
                  lineHeight: 1,
                  ...(isLive && { color: 'error.main' }),
                }}
              >
                {scoreAway}
              </Typography>
            </Stack>

            <Chip
              label={t(chipCfg.label)}
              color={chipCfg.color}
              size="small"
              variant="soft"
              sx={{
                fontWeight: 600,
                ...(isLive && {
                  animation: 'pulse 2s ease-in-out infinite',
                  '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
                }),
              }}
            />

            {/* Meta row */}
            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{ mt: 0.5, flexWrap: 'wrap' }}
            >
              {match.matchweek && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {t('label_matchday')} {match.matchweek}
                </Typography>
              )}
              {match.round && (
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  {match.round}
                </Typography>
              )}
              {match.date && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Iconify
                    icon="solar:calendar-date-bold"
                    width={13}
                    sx={{ color: 'text.disabled' }}
                  />
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {fDateTime(match.date, 'DD MMM YYYY · HH:mm')}
                  </Typography>
                </Stack>
              )}
              {match.venue && (
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Iconify icon="solar:map-point-bold" width={13} sx={{ color: 'text.disabled' }} />
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {match.venue}
                  </Typography>
                </Stack>
              )}
              {isAdmin && (
                <IconButton
                  size="small"
                  onClick={() => setScheduleDialogOpen(true)}
                  sx={{ opacity: 0.4, '&:hover': { opacity: 1 }, p: 0.25 }}
                >
                  <Iconify icon="mdi:pencil" width={13} />
                </IconButton>
              )}
            </Stack>
          </Stack>

          {/* Away */}
          <Stack alignItems="center" spacing={0.75}>
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -0.5, textAlign: 'center' }}
            >
              {awayTeam?.name || t('label_away_team')}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {awayName}
            </Typography>
          </Stack>
        </Box>
      </Box>

      {/* ── Actions Toolbar ────────────────────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
          px: { xs: 2, md: 3.5 },
          py: 1.25,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
          {statusAction && (
            <LoadingButton
              variant="contained"
              size="small"
              startIcon={<Iconify icon={statusAction.icon} width={16} />}
              loading={isSubmitting}
              onClick={handleStatusTransition}
            >
              {t(statusAction.label)}
            </LoadingButton>
          )}
          {isAdmin && isFinished && (
            <LoadingButton
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="mdi:refresh" width={16} />}
              loading={isSubmitting}
              onClick={handleReopen}
            >
              {t('label_reopen_match')}
            </LoadingButton>
          )}
          {isLive && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Iconify icon="mdi:plus" width={16} />}
              onClick={() => setEventDialog(true)}
            >
              {t('label_event_singular')}
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Iconify icon="solar:download-minimalistic-bold" width={16} />}
            onClick={() => {
              const esc = (s) => {
                const v = String(s ?? '');
                return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
              };
              const POSITION_LABELS = {
                Goalkeeper: t('label_position_goalkeeper'),
                Defender: t('label_position_defender'),
                Midfielder: t('label_position_midfielder'),
                Forward: t('label_position_forward'),
              };
              const rosterFor = (teamId) => (players || []).filter((p) => p.team_id === teamId);
              const rows = [
                [
                  t('team'),
                  t('label_player_singular'),
                  t('label_id_number'),
                  t('label_jersey_number'),
                  t('label_position'),
                ].join(','),
                ...rosterFor(match.home_team_id).map((p) =>
                  [
                    homeTeam?.name || homeName,
                    p.name,
                    p.id_number || '',
                    p.number ?? '',
                    POSITION_LABELS[p.position] || p.position || '',
                  ]
                    .map(esc)
                    .join(',')
                ),
                ...rosterFor(match.away_team_id).map((p) =>
                  [
                    awayTeam?.name || awayName,
                    p.name,
                    p.id_number || '',
                    p.number ?? '',
                    POSITION_LABELS[p.position] || p.position || '',
                  ]
                    .map(esc)
                    .join(',')
                ),
              ];
              // U+FEFF BOM so Excel auto-detects UTF-8.
              const BOM = String.fromCharCode(0xfeff);
              const blob = new Blob([`${BOM}${rows.join('\n')}`], {
                type: 'text/csv;charset=utf-8',
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `${t('label_rosters_filename')}-${homeName}-vs-${awayName}.csv`.replace(
                /\s+/g,
                '_'
              );
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
          >
            {t('label_download_rosters')}
          </Button>

          {isFinished && match.round && (
            <Button
              variant="contained"
              color="success"
              size="small"
              startIcon={<Iconify icon="mdi:trophy" width={16} />}
              onClick={async () => {
                try {
                  const winnerId =
                    match.score_home > match.score_away ? match.home_team_id : match.away_team_id;
                  await advanceWinner(tournamentId, matchId, winnerId);
                  toast.success(t('label_winner_advanced_to_next_round'));
                  navigate(paths.dashboard.tournament.details(tournamentId));
                } catch (error) {
                  toast.error(error.message || t('label_error_advancing_winner'));
                }
              }}
            >
              {t('label_advance_winner')} (
              {match.score_home > match.score_away ? homeTeam?.short_name : awayTeam?.short_name})
            </Button>
          )}

          {isAdmin && tournament?.payments_enabled && isFinished && (
            <LoadingButton
              size="small"
              variant="soft"
              color="warning"
              loading={chargesLoading}
              startIcon={<Iconify icon="solar:dollar-minimalistic-bold" width={16} />}
              onClick={handleCreateCharges}
            >
              {t('label_generate_charges')}
            </LoadingButton>
          )}

          <Box sx={{ flex: 1 }} />

          <Button
            variant="soft"
            color="error"
            size="small"
            startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={16} />}
            onClick={handleDelete}
          >
            {t('delete')}
          </Button>
        </Stack>
      </Box>

      {/* ── Events Timeline (two-column) ───────────────────────────── */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          px: { xs: 2, md: 3.5 },
          py: 3,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'text.disabled',
            letterSpacing: 2,
            fontSize: '0.65rem',
            mb: 2,
            display: 'block',
          }}
        >
          {t('label_match_timeline')}
        </Typography>

        {sortedEvents.length === 0 ? (
          <Typography
            variant="caption"
            sx={{ color: 'text.disabled', display: 'block', textAlign: 'center', py: 4 }}
          >
            {t('label_no_events_recorded')}
          </Typography>
        ) : (
          <Box sx={{ maxWidth: 640, mx: 'auto' }}>
            {/* Column headers */}
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '1fr 52px 1fr',
                mb: 1.5,
                pb: 1,
                borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.08)}`,
              }}
            >
              <Typography
                variant="caption"
                sx={{ fontSize: '0.65rem', color: 'text.disabled', fontWeight: 600 }}
              >
                {homeName}
              </Typography>
              <Box />
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.65rem',
                  color: 'text.disabled',
                  fontWeight: 600,
                  textAlign: 'right',
                }}
              >
                {awayName}
              </Typography>
            </Box>

            {/* Event rows */}
            <Stack spacing={0}>
              {sortedEvents.map((event) => {
                const isHome = event.team_id === match.home_team_id;
                const cfg = EVENT_CONFIG[event.type] || EVENT_CONFIG.goal;
                const player = players?.find((p) => p.id === event.player_id);
                const assist = event.assist_player_id
                  ? players?.find((p) => p.id === event.assist_player_id)
                  : null;

                const editable = isLive;

                const eventContent = (
                  <Stack
                    direction={isHome ? 'row' : 'row-reverse'}
                    alignItems="center"
                    spacing={0.5}
                    sx={{ flex: 1 }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <EventBadge
                        cfg={cfg}
                        player={player}
                        assist={assist}
                        align={isHome ? 'left' : 'right'}
                      />
                    </Box>
                    {editable && (
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteEvent(event.id)}
                        sx={{ opacity: 0.4, '&:hover': { opacity: 1 } }}
                      >
                        <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                      </IconButton>
                    )}
                  </Stack>
                );

                return (
                  <Box
                    key={event.id}
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 52px 1fr',
                      alignItems: 'center',
                      py: 0.75,
                      borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.04)}`,
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Box>{isHome && eventContent}</Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="caption"
                        sx={{ fontWeight: 700, fontSize: '0.7rem', color: 'text.disabled' }}
                      >
                        {event.minute}
                        {event.stoppage_time ? `+${event.stoppage_time}` : ''}&#39;
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      {!isHome && eventContent}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          </Box>
        )}
      </Box>

      {/* ── Observaciones (Comments & Mocked Payments) ────────────────────── */}
      <Box
        sx={{
          px: { xs: 2, md: 3.5 },
          py: 4,
          bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02),
        }}
      >
        <Typography
          variant="overline"
          sx={{
            color: 'text.disabled',
            letterSpacing: 2,
            fontSize: '0.65rem',
            mb: 2,
            display: 'block',
          }}
        >
          {t('label_match_official_observations')}
        </Typography>

        <Box sx={{ maxWidth: 640, mx: 'auto' }}>
          {pendingAmount > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              {t('label_pending_charges_intro')}{' '}
              <strong>
                {yellowCardsCount} {t('label_yellow_cards_plural_short')}
              </strong>{' '}
              {t('label_and')}{' '}
              <strong>
                {redCardsCount} {t('label_reds_or_second_yellow')}
              </strong>
              , {t('label_total_of')} <strong>${pendingAmount.toLocaleString()}</strong>{' '}
              {t('label_pending_payment_collection')}.
            </Alert>
          )}

          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t('label_add_match_notes_placeholder')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1.5 }}>
            <LoadingButton
              variant="contained"
              size="small"
              loading={isSubmitting}
              onClick={handleSaveNotes}
              disabled={notes === (match.notes || '')}
            >
              {t('label_save_notes')}
            </LoadingButton>
          </Box>
        </Box>
      </Box>

      {/* ── Add Event Dialog ───────────────────────────────────────── */}
      <MatchScheduleDialog
        open={scheduleDialogOpen}
        match={match}
        tournamentId={tournamentId}
        onClose={() => setScheduleDialogOpen(false)}
      />

      <Dialog open={eventDialog} onClose={() => setEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('label_register_event')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              select
              fullWidth
              label={t('label_type')}
              value={eventForm.type}
              onChange={(e) => setEventForm((f) => ({ ...f, type: e.target.value }))}
            >
              {EVENT_TYPES.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {t(opt.label)}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label={t('label_minute')}
              value={eventForm.minute}
              onChange={(e) => setEventForm((f) => ({ ...f, minute: e.target.value }))}
            />
            <TextField
              select
              fullWidth
              label={t('team')}
              value={eventForm.team_id}
              onChange={(e) => setEventForm((f) => ({ ...f, team_id: e.target.value }))}
            >
              {[homeTeam, awayTeam].filter(Boolean).map((team) => (
                <MenuItem key={team.id} value={team.id}>
                  {team.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label={
                eventForm.type === 'substitution'
                  ? t('label_player_out')
                  : t('label_player_singular')
              }
              value={eventForm.player_id}
              onChange={(e) => setEventForm((f) => ({ ...f, player_id: e.target.value }))}
            >
              {matchPlayers
                .filter((p) => !eventForm.team_id || p.team_id === eventForm.team_id)
                .map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    #{p.number} {p.name}
                  </MenuItem>
                ))}
            </TextField>
            {['goal', 'penalty_scored', 'substitution'].includes(eventForm.type) && (
              <TextField
                select
                fullWidth
                label={
                  eventForm.type === 'substitution'
                    ? t('label_player_in')
                    : t('label_assist_optional')
                }
                value={eventForm.assist_player_id}
                onChange={(e) => setEventForm((f) => ({ ...f, assist_player_id: e.target.value }))}
              >
                {eventForm.type !== 'substitution' && (
                  <MenuItem value="">{t('label_no_assist')}</MenuItem>
                )}
                {matchPlayers
                  .filter((p) => !eventForm.team_id || p.team_id === eventForm.team_id)
                  .filter((p) => p.id !== eventForm.player_id)
                  .map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      #{p.number} {p.name}
                    </MenuItem>
                  ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEventDialog(false)}>{t('cancel')}</Button>
          <LoadingButton
            variant="contained"
            loading={isSubmitting}
            disabled={eventForm.type === 'substitution' && !eventForm.assist_player_id}
            onClick={handleAddEvent}
          >
            {t('label_register')}
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
