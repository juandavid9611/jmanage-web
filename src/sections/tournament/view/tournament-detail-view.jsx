import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Drawer from '@mui/material/Drawer';
import { alpha } from '@mui/material/styles';
import Skeleton from '@mui/material/Skeleton';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetTeams,
  useGetStats,
  useGetGroups,
  useGetMatches,
  useGetPlayers,
  useGetTournament,
  deleteTournament,
  updateTournament,
  generateSchedule,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

import { TeamList } from '../team-list';
import { BracketView } from '../bracket-view';
import { StatsOverview } from '../stats-overview';
import { StandingsSidebar } from '../standings-sidebar';
import { MatchweekTimeline } from '../matchweek-timeline';
import { PlayerRankingTable } from '../player-ranking-table';
import { MatchList, MatchScheduleDialog } from '../match-row';
import { TeamDisciplineTable } from '../team-discipline-table';
import { TournamentUsersTable } from '../tournament-users-table';
import { getPhases, TournamentBanner } from '../tournament-banner';
import { TournamentConfigSummary } from '../tournament-config-summary';

// ----------------------------------------------------------------------

/**
 * Determine the default active phase based on tournament state.
 */
function getDefaultPhase(tournament, teams, t) {
  const phases = getPhases(tournament, teams, undefined, undefined, t);

  // Find the first 'active' phase
  const activePhase = phases.find((p) => p.state === 'active');
  if (activePhase) return activePhase.key;

  // If all done, show last done phase
  const lastDone = [...phases].reverse().find((p) => p.state === 'done');
  if (lastDone) return lastDone.key;

  // Fallback
  return phases[0]?.key || 'configuracion';
}

// ----------------------------------------------------------------------

export function TournamentDetailView() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { user } = useAuthContext();
  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams, teamsLoading } = useGetTeams(id);
  const { groups } = useGetGroups(id);
  const { stats } = useGetStats(id);
  const { matches: allMatches, matchesLoading } = useGetMatches(id);
  const { players } = useGetPlayers(id);

  const { workspaceRole } = useWorkspace();
  const isAdmin = workspaceRole === 'admin';
  // GET /payment_requests is gated by ACCOUNT role, not workspace role (unlike the
  // workspace-scoped mutations below), so it needs the same account-role fallback
  // used for the account-role-gated "Generar Cobros" endpoint in match-detail-view.jsx.
  const isAccountAdmin = user?.accountsRoles?.[user?.activeAccountId] === 'admin';
  const canViewTournamentPayments = isAdmin || isAccountAdmin;

  const [activePhase, setActivePhase] = useState(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [finishDialog, setFinishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [disciplineOpen, setDisciplineOpen] = useState(false);
  const [usersOpen, setUsersOpen] = useState(false);
  const [scheduleMatch, setScheduleMatch] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    match_interval_days: 7,
    default_venue: '',
    group_id: '',
  });

  // Resolve active phase (lazy init after tournament loads)
  const currentPhase =
    activePhase || (tournament ? getDefaultPhase(tournament, teams, t) : 'configuracion');

  // Derive current matchweek
  const currentMw = tournament?.current_matchweek || 1;
  const totalMw =
    tournament?.rules?.total_matchweeks ||
    (allMatches.length > 0 ? Math.max(...allMatches.map((m) => m.matchweek || 0)) : 0);
  // undefined = default to currentMw; null = show all; number = specific matchweek
  const activeMw = selectedMatchweek === undefined ? currentMw : selectedMatchweek;

  // Filter matches by selected matchweek (null = all)
  const currentMatches = useMemo(
    () => (activeMw === null ? allMatches : allMatches.filter((m) => m.matchweek === activeMw)),
    [allMatches, activeMw]
  );

  // Next pending match for sidebar action
  const nextPendingMatch = useMemo(
    () =>
      allMatches.find(
        (m) => m.matchweek === currentMw && m.status !== 'finished' && m.status !== 'cancelled'
      ),
    [allMatches, currentMw]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteTournament(id);
      toast.success(t('label_tournament_deleted'));
      navigate(paths.dashboard.tournament.root);
    } catch (error) {
      toast.error(t('label_error_deleting'));
    }
  }, [id, navigate, t]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      try {
        setIsSubmitting(true);
        await updateTournament(id, { status: newStatus });
        setActivateDialog(false);
        setFinishDialog(false);
        toast.success(
          newStatus === 'active'
            ? t('label_tournament_activated')
            : newStatus === 'finished'
              ? t('label_tournament_finished')
              : t('label_status_updated')
        );
      } catch (error) {
        toast.error(error.message || t('label_error_changing_status'));
      } finally {
        setIsSubmitting(false);
      }
    },
    [id, t]
  );

  const handleAdvanceMatchweek = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const mw = tournament?.current_matchweek || 0;

      if (mw > 0) {
        const { default: axios } = await import('src/utils/axios');
        const res = await axios.get(
          `${import.meta.env.VITE_HOST_API}/tournaments/${id}/matches?matchweek=${mw}`
        );
        const mwMatches = res.data || [];
        const unfinished = mwMatches.filter((m) => m.status !== 'finished');
        if (unfinished.length > 0) {
          toast.error(
            `${t('label_missing_matches_prefix')} ${unfinished.length} ${t('label_matches_pending_finish_suffix')} ${t('label_matchday')} ${mw}`
          );
          return;
        }
      }

      const nextMw = mw + 1;
      await updateTournament(id, { current_matchweek: nextMw });
      toast.success(`${t('label_advanced_to')} ${t('label_matchday')} ${nextMw}`);
    } catch (error) {
      toast.error(error.message || t('label_error_generic'));
    } finally {
      setIsSubmitting(false);
    }
  }, [id, tournament, t]);

  const handleGenerateSchedule = useCallback(async () => {
    try {
      setIsSubmitting(true);
      const payload = {
        start_date: new Date(scheduleForm.start_date).toISOString(),
        match_interval_days: scheduleForm.match_interval_days,
        default_venue: scheduleForm.default_venue,
      };
      if (scheduleForm.group_id) {
        payload.group_id = scheduleForm.group_id;
      }
      const result = await generateSchedule(id, payload);
      setScheduleDialog(false);
      toast.success(
        `${result.matches_created} ${t('label_matches_lowercase')} ${t('label_generated_plural')} (${result.matchweeks_generated} ${t('label_matchdays_lowercase')})`
      );
    } catch (error) {
      toast.error(error.message || t('label_error_generating_schedule'));
    } finally {
      setIsSubmitting(false);
    }
  }, [id, scheduleForm, t]);

  const handleMatchClick = useCallback(
    (match) => {
      navigate(paths.dashboard.tournament.matchDetail(id, match.id));
    },
    [id, navigate]
  );

  const handleScoreClick = useCallback(
    (match) => {
      navigate(paths.dashboard.tournament.matchDetail(id, match.id));
    },
    [id, navigate]
  );

  const handlePhaseClick = useCallback((phaseKey) => {
    setActivePhase(phaseKey);
  }, []);

  if (tournamentLoading) return <LoadingScreen />;
  if (!tournament) return <Typography>{t('label_tournament_not_found')}</Typography>;

  const isLeague = tournament.type === 'league';
  const isHybrid = tournament.type === 'hybrid';
  const isKnockoutPhase = ['eliminatorias'].includes(currentPhase);

  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      {/* ═══ Banner + Phase Stepper ═══ */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        activePhase={currentPhase}
        isSubmitting={isSubmitting}
        totalMatchweeks={totalMw}
        allMatches={allMatches}
        onPhaseClick={handlePhaseClick}
        onActivate={() => setActivateDialog(true)}
        onFinish={() => setFinishDialog(true)}
        onDelete={() => setDeleteDialog(true)}
        onAdvanceMatchweek={handleAdvanceMatchweek}
        onNavigateEdit={() => navigate(paths.dashboard.tournament.edit(id))}
        onOpenDiscipline={() => setDisciplineOpen(true)}
        onOpenUsers={canViewTournamentPayments ? () => setUsersOpen(true) : undefined}
      />

      {/* ═══ Phase Content ═══ */}
      <Box sx={{ bgcolor: (theme) => alpha(theme.palette.grey[500], 0.02), minHeight: 400 }}>
        {/* ── CONFIGURACIÓN: Tournament overview, stats ── */}
        {currentPhase === 'configuracion' && (
          <Stack spacing={2.5} sx={{ p: { xs: 2, md: 3 } }}>
            <StatsOverview tournamentId={id} tournament={tournament} />
            <TournamentConfigSummary tournament={tournament} />
          </Stack>
        )}

        {/* ── INSCRIPCIÓN: Teams ── */}
        {currentPhase === 'inscripcion' && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <TeamList tournamentId={id} tournament={tournament} teams={teams} groups={groups} />
          </Box>
        )}

        {/* ── FASE GRUPOS: [selector + matches | standings] 50/50 ── */}
        {currentPhase === 'fase_grupos' && (
          <Grid container>
            {/* Left: jornada selector + match list */}
            <Grid
              xs={12}
              md={6}
              sx={{
                borderRight: (theme) => ({
                  md: `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
                }),
              }}
            >
              {(isLeague || isHybrid) && totalMw > 0 && (
                <MatchweekTimeline
                  totalMatchweeks={totalMw}
                  currentMatchweek={currentMw}
                  allMatches={allMatches}
                  selectedMatchweek={activeMw}
                  onSelect={(mw) => setSelectedMatchweek(mw)}
                  onViewAll={() => setSelectedMatchweek(null)}
                />
              )}

              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
                    {activeMw === null
                      ? t('label_all_matches')
                      : `${t('label_matchday')} ${activeMw}`}
                  </Typography>
                  <Box
                    sx={{
                      flex: 1,
                      height: 1,
                      bgcolor: (theme) => alpha(theme.palette.grey[500], 0.08),
                    }}
                  />
                </Stack>

                {matchesLoading ? (
                  <Stack spacing={1.5}>
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={64} />
                    ))}
                  </Stack>
                ) : allMatches.length === 0 ? (
                  <EmptyContent
                    filled
                    title={t('label_no_matches')}
                    description={t('label_no_group_stage_schedule_yet')}
                    action={
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="mdi:auto-fix" />}
                        onClick={() => setScheduleDialog(true)}
                        disabled={teams.length < 2 || isSubmitting}
                      >
                        {t('label_generate_schedule')}
                      </Button>
                    }
                    sx={{ py: 6 }}
                  />
                ) : (
                  <MatchList
                    matches={currentMatches}
                    teams={teams}
                    players={players}
                    tournamentId={id}
                    grouped
                    onMatchClick={handleMatchClick}
                    onScoreClick={isAdmin ? handleScoreClick : undefined}
                    onEditSchedule={isAdmin ? (m) => setScheduleMatch(m) : undefined}
                  />
                )}
              </Box>
            </Grid>

            {/* Right: standings */}
            <Grid xs={12} md={6}>
              <StandingsSidebar
                tournamentId={id}
                teams={teams}
                allMatches={allMatches}
                nextPendingMatch={nextPendingMatch}
                currentMatchweek={currentMw}
                totalMatchweeks={totalMw}
                onNextAction={
                  isAdmin && nextPendingMatch ? () => handleScoreClick(nextPendingMatch) : undefined
                }
              />
            </Grid>
          </Grid>
        )}

        {/* ── KNOCKOUT PHASES: Bracket view ── */}
        {isKnockoutPhase && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BracketView
              tournamentId={id}
              teams={teams}
              tournament={tournament}
              allMatches={allMatches}
              readOnly={!isAdmin}
            />
          </Box>
        )}

        {/* ── ESTADÍSTICAS: per-player rankings (goals, assists, cards) ── */}
        {currentPhase === 'estadisticas' && (
          <Stack spacing={3} sx={{ p: { xs: 2, md: 3 } }}>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_top_scorers')}
              </Typography>
              <PlayerRankingTable tournamentId={id} metric="goals" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_assists')}
              </Typography>
              <PlayerRankingTable tournamentId={id} metric="assists" />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ mb: 1.5 }}>
                {t('label_disciplinary_record')}
              </Typography>
              <PlayerRankingTable tournamentId={id} metric="cards" />
            </Box>
          </Stack>
        )}
      </Box>

      {/* ═══ Dialogs ═══ */}

      {/* Activate confirmation */}
      <Dialog
        open={activateDialog}
        onClose={() => setActivateDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('label_activate_tournament')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('label_activate_tournament_warning')} <strong>{tournament.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialog(false)}>{t('cancel')}</Button>
          <LoadingButton
            variant="contained"
            color="success"
            loading={isSubmitting}
            onClick={() => handleStatusChange('active')}
          >
            {t('label_activate')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Finish confirmation */}
      <Dialog open={finishDialog} onClose={() => setFinishDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('label_finish_tournament')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('label_finish_tournament_warning')} <strong>{t('status_finished')}</strong>.{' '}
            {t('label_reopen_hint_and_confirm')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishDialog(false)}>{t('cancel')}</Button>
          <LoadingButton
            variant="contained"
            color="info"
            loading={isSubmitting}
            onClick={() => handleStatusChange('finished')}
          >
            {t('label_finish')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation (existing) */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{t('label_delete_tournament')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('label_action_cannot_be_undone')} <strong>{tournament.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>{t('cancel')}</Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={isSubmitting}
            onClick={handleDelete}
          >
            {t('delete')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Schedule Generation Dialog */}
      <Dialog
        open={scheduleDialog}
        onClose={() => setScheduleDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('label_generate_schedule')}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="date"
              label={t('label_start_date')}
              value={scheduleForm.start_date}
              onChange={(e) => setScheduleForm((f) => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label={t('label_days_between_matchdays')}
              value={scheduleForm.match_interval_days}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, match_interval_days: Number(e.target.value) }))
              }
            />
            <TextField
              fullWidth
              label={t('label_default_venue_optional')}
              value={scheduleForm.default_venue}
              onChange={(e) => setScheduleForm((f) => ({ ...f, default_venue: e.target.value }))}
            />
            {isHybrid && groups.length > 0 && (
              <TextField
                fullWidth
                select
                label={t('label_group_optional')}
                value={scheduleForm.group_id}
                onChange={(e) => setScheduleForm((f) => ({ ...f, group_id: e.target.value }))}
                helperText={t('label_leave_empty_for_all_teams_hint')}
              >
                <MenuItem value="">{t('label_all_teams')}</MenuItem>
                {groups.map((g) => (
                  <MenuItem key={g.id} value={g.id}>
                    {g.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialog(false)}>{t('cancel')}</Button>
          <LoadingButton
            variant="contained"
            loading={isSubmitting}
            onClick={handleGenerateSchedule}
          >
            {t('label_generate')}
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Match Schedule Dialog */}
      <MatchScheduleDialog
        open={!!scheduleMatch}
        match={scheduleMatch}
        tournamentId={id}
        onClose={() => setScheduleMatch(null)}
      />

      {/* Discipline drawer (Sanciones) */}
      <Drawer
        anchor="right"
        open={disciplineOpen}
        onClose={() => setDisciplineOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520, md: 640 } } }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack>
              <Typography variant="h6">{t('label_sanctions')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('label_cards_by_team_player_match')}
              </Typography>
            </Stack>
            <IconButton onClick={() => setDisciplineOpen(false)}>
              <Iconify icon="eva:close-fill" width={20} />
            </IconButton>
          </Stack>
        </Box>
        <Box sx={{ p: 2 }}>
          <TeamDisciplineTable
            tournamentId={id}
            onNavigateToMatch={(matchId) => {
              setDisciplineOpen(false);
              navigate(paths.dashboard.tournament.matchDetail(id, matchId));
            }}
          />
        </Box>
      </Drawer>

      {/* Usuarios drawer — team managers/contacts billed by this tournament */}
      <Drawer
        anchor="right"
        open={usersOpen}
        onClose={() => setUsersOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 520, md: 640 } } }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: (theme) => `1px solid ${alpha(theme.palette.grey[500], 0.12)}`,
          }}
        >
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack>
              <Typography variant="h6">{t('label_users')}</Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                {t('label_tournament_team_managers')}
              </Typography>
            </Stack>
            <IconButton onClick={() => setUsersOpen(false)}>
              <Iconify icon="eva:close-fill" width={20} />
            </IconButton>
          </Stack>
        </Box>
        <Box sx={{ p: 2 }}>
          <TournamentUsersTable teams={teams} teamsLoading={teamsLoading} />
        </Box>
      </Drawer>
    </DashboardContent>
  );
}
