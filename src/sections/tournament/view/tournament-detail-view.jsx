import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
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

import { TeamList } from '../team-list';
import { MatchList } from '../match-row';
import { BracketView } from '../bracket-view';
import { StatsOverview } from '../stats-overview';
import { StandingsSidebar } from '../standings-sidebar';
import { MatchweekTimeline } from '../matchweek-timeline';
import { getPhases, TournamentBanner } from '../tournament-banner';
import { TournamentConfigSummary } from '../tournament-config-summary';

// ----------------------------------------------------------------------

/**
 * Determine the default active phase based on tournament state.
 */
function getDefaultPhase(tournament, teams) {
  const phases = getPhases(tournament, teams);

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
  const { id } = useParams();
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams } = useGetTeams(id);
  const { groups } = useGetGroups(id);
  const { stats } = useGetStats(id);
  const { matches: allMatches } = useGetMatches(id);
  const { players } = useGetPlayers(id);

  const [activePhase, setActivePhase] = useState(null);
  const [selectedMatchweek, setSelectedMatchweek] = useState(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [finishDialog, setFinishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    match_interval_days: 7,
    default_venue: '',
    group_id: '',
  });

  // Resolve active phase (lazy init after tournament loads)
  const currentPhase = activePhase || (tournament ? getDefaultPhase(tournament, teams) : 'configuracion');

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
    () => allMatches.find((m) => m.status === 'scheduled'),
    [allMatches]
  );

  const handleDelete = useCallback(async () => {
    try {
      await deleteTournament(id);
      toast.success('Torneo eliminado');
      navigate(paths.dashboard.tournament.root);
    } catch (error) {
      toast.error('Error al eliminar');
    }
  }, [id, navigate]);

  const handleStatusChange = useCallback(
    async (newStatus) => {
      try {
        setIsSubmitting(true);
        await updateTournament(id, { status: newStatus });
        setActivateDialog(false);
        setFinishDialog(false);
        toast.success(
          newStatus === 'active'
            ? 'Torneo activado'
            : newStatus === 'finished'
              ? 'Torneo finalizado'
              : 'Estado actualizado'
        );
      } catch (error) {
        toast.error(error.message || 'Error al cambiar estado');
      } finally {
        setIsSubmitting(false);
      }
    },
    [id]
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
            `Faltan ${unfinished.length} partido(s) por finalizar en Jornada ${mw}`
          );
          return;
        }
      }

      const nextMw = mw + 1;
      await updateTournament(id, { current_matchweek: nextMw });
      toast.success(`Avanzado a Jornada ${nextMw}`);
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, tournament]);

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
        `${result.matches_created} partidos generados (${result.matchweeks_generated} jornadas)`
      );
    } catch (error) {
      toast.error(error.message || 'Error al generar calendario');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, scheduleForm]);

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
  if (!tournament) return <Typography>Torneo no encontrado</Typography>;

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
        onPhaseClick={handlePhaseClick}
        onActivate={() => setActivateDialog(true)}
        onFinish={() => setFinishDialog(true)}
        onDelete={() => setDeleteDialog(true)}
        onAdvanceMatchweek={handleAdvanceMatchweek}
        onNavigateEdit={() => navigate(paths.dashboard.tournament.edit(id))}
      />

      {/* ═══ Phase Content ═══ */}
      <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.02), minHeight: 400 }}>

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
              sx={{ borderRight: (t) => ({ md: `1px solid ${alpha(t.palette.grey[500], 0.12)}` }) }}
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
                    {activeMw === null ? 'Todos los partidos' : `Jornada ${activeMw}`}
                  </Typography>
                  <Box sx={{ flex: 1, height: 1, bgcolor: (t) => alpha(t.palette.grey[500], 0.08) }} />
                </Stack>

                {allMatches.length === 0 ? (
                  <EmptyContent
                    filled
                    title="No hay partidos"
                    description="Aún no se ha generado el calendario de la fase de grupos"
                    action={
                      <Button
                        variant="contained"
                        startIcon={<Iconify icon="mdi:auto-fix" />}
                        onClick={() => setScheduleDialog(true)}
                        disabled={teams.length < 2 || isSubmitting}
                      >
                        Generar Calendario
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
                    onScoreClick={handleScoreClick}
                  />
                )}
              </Box>
            </Grid>

              {/* Right: standings */}
              <Grid xs={12} md={6}>
                <StandingsSidebar
                  tournamentId={id}
                  teams={teams}
                  nextPendingMatch={nextPendingMatch}
                  onNextAction={
                    nextPendingMatch
                      ? () => handleScoreClick(nextPendingMatch)
                      : undefined
                  }
                />
              </Grid>
            </Grid>
        )}

        {/* ── KNOCKOUT PHASES: Bracket view ── */}
        {isKnockoutPhase && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BracketView tournamentId={id} teams={teams} tournament={tournament} allMatches={allMatches} />
          </Box>
        )}
      </Box>

      {/* ═══ Dialogs ═══ */}

      {/* Activate confirmation */}
      <Dialog open={activateDialog} onClose={() => setActivateDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Activar Torneo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Al activar el torneo no podrás agregar ni eliminar equipos. ¿Confirmas que deseas activar{' '}
            <strong>{tournament.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivateDialog(false)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            color="success"
            loading={isSubmitting}
            onClick={() => handleStatusChange('active')}
          >
            Activar
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Finish confirmation */}
      <Dialog open={finishDialog} onClose={() => setFinishDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Finalizar Torneo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esto marcará el torneo como <strong>Finalizado</strong>. Podrás reabrirlo si es necesario.
            ¿Confirmas?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFinishDialog(false)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            color="info"
            loading={isSubmitting}
            onClick={() => handleStatusChange('finished')}
          >
            Finalizar
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation (existing) */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Eliminar Torneo</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Esta acción no se puede deshacer. ¿Confirmas que deseas eliminar{' '}
            <strong>{tournament.name}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>Cancelar</Button>
          <LoadingButton
            variant="contained"
            color="error"
            loading={isSubmitting}
            onClick={handleDelete}
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>

      {/* Schedule Generation Dialog */}
      <Dialog open={scheduleDialog} onClose={() => setScheduleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generar Calendario</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Fecha de inicio"
              value={scheduleForm.start_date}
              onChange={(e) => setScheduleForm((f) => ({ ...f, start_date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              type="number"
              label="Días entre jornadas"
              value={scheduleForm.match_interval_days}
              onChange={(e) =>
                setScheduleForm((f) => ({ ...f, match_interval_days: Number(e.target.value) }))
              }
            />
            <TextField
              fullWidth
              label="Sede por defecto (opcional)"
              value={scheduleForm.default_venue}
              onChange={(e) => setScheduleForm((f) => ({ ...f, default_venue: e.target.value }))}
            />
            {isHybrid && groups.length > 0 && (
              <TextField
                fullWidth
                select
                label="Grupo (opcional)"
                value={scheduleForm.group_id}
                onChange={(e) => setScheduleForm((f) => ({ ...f, group_id: e.target.value }))}
                helperText="Dejar vacío para generar para todos los equipos"
              >
                <MenuItem value="">Todos los equipos</MenuItem>
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
          <Button onClick={() => setScheduleDialog(false)}>Cancelar</Button>
          <LoadingButton variant="contained" loading={isSubmitting} onClick={handleGenerateSchedule}>
            Generar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
