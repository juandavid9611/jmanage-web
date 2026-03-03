import { useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
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
  useGetTournament,
  deleteTournament,
  updateTournament,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';

import { TeamList } from '../team-list';
import { MatchList } from '../match-row';
import { BracketView } from '../bracket-view';
import { StatsOverview } from '../stats-overview';
import { TopScorersTable } from '../top-scorers-table';
import { TournamentBanner } from '../tournament-banner';
import { StandingsSidebar } from '../standings-sidebar';
import { MatchweekTimeline } from '../matchweek-timeline';

// ----------------------------------------------------------------------

const TABS = [
  { value: 'overview', label: 'General', icon: 'mdi:view-dashboard-outline' },
  { value: 'jornada', label: 'Jornada', icon: 'mdi:calendar-text' },
  { value: 'teams', label: 'Equipos', icon: 'mdi:shield-half-full' },
  { value: 'scorers', label: 'Goleadores', icon: 'mdi:soccer' },
  { value: 'bracket', label: 'Cuadro', icon: 'mdi:tournament' },
];

// ----------------------------------------------------------------------

export function TournamentDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams } = useGetTeams(id);
  const { groups } = useGetGroups(id);
  const { stats } = useGetStats(id);
  const { matches: allMatches } = useGetMatches(id);

  const [currentTab, setCurrentTab] = useState('overview');
  const [selectedMatchweek, setSelectedMatchweek] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [finishDialog, setFinishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

  // Derive current matchweek for selection
  const currentMw = tournament?.current_matchweek || 1;
  const activeMw = selectedMatchweek || currentMw;
  const totalMw = tournament?.rules?.total_matchweeks || 0;

  // Filter matches by selected matchweek
  const currentMatches = useMemo(
    () => allMatches.filter((m) => m.matchweek === activeMw),
    [allMatches, activeMw]
  );

  // Next pending match for sidebar action
  const nextPendingMatch = useMemo(
    () => allMatches.find((m) => m.status === 'scheduled'),
    [allMatches]
  );

  // Stats for Jornada tab
  const jornadaStats = useMemo(() => {
    const live = currentMatches.filter((m) => m.status === 'live').length;
    const pending = currentMatches.filter((m) => m.status === 'scheduled').length;
    const finished = currentMatches.filter((m) => m.status === 'finished').length;
    return { live, pending, finished, total: currentMatches.length };
  }, [currentMatches]);

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

  if (tournamentLoading) return <LoadingScreen />;
  if (!tournament) return <Typography>Torneo no encontrado</Typography>;

  const isLeague = tournament.type === 'league';
  const isHybrid = tournament.type === 'hybrid';

  return (
    <DashboardContent maxWidth={false} sx={{ p: { xs: 0, md: 0 } }}>
      {/* ═══ Banner ═══ */}
      <TournamentBanner
        tournament={tournament}
        teams={teams}
        isSubmitting={isSubmitting}
        onActivate={() => setActivateDialog(true)}
        onFinish={() => setFinishDialog(true)}
        onDelete={() => setDeleteDialog(true)}
        onAdvanceMatchweek={handleAdvanceMatchweek}
        onNavigateMatches={() => navigate(paths.dashboard.tournament.matches(id))}
        onNavigateEdit={() => navigate(paths.dashboard.tournament.edit(id))}
        onTabChange={setCurrentTab}
      />

      {/* ═══ Matchweek Timeline ═══ */}
      {(isLeague || isHybrid) && totalMw > 0 && (
        <MatchweekTimeline
          totalMatchweeks={totalMw}
          currentMatchweek={currentMw}
          allMatches={allMatches}
          selectedMatchweek={activeMw}
          onSelect={(mw) => {
            setSelectedMatchweek(mw);
            if (currentTab !== 'jornada') setCurrentTab('jornada');
          }}
        />
      )}

      {/* ═══ Tabs ═══ */}
      <Box
        sx={{
          bgcolor: 'background.paper',
          borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}`,
          px: { xs: 1, md: 3.5 },
        }}
      >
        <Tabs
          value={currentTab}
          onChange={(_, v) => setCurrentTab(v)}
          sx={{
            '& .MuiTab-root': { minHeight: 44, fontSize: '0.8rem' },
          }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              value={tab.value}
              label={tab.label}
              icon={<Iconify icon={tab.icon} width={18} />}
              iconPosition="start"
            />
          ))}
        </Tabs>
      </Box>

      {/* ═══ Tab Content ═══ */}
      <Box sx={{ bgcolor: (t) => alpha(t.palette.grey[500], 0.02), minHeight: 400 }}>
        {/* OVERVIEW TAB */}
        {currentTab === 'overview' && (
          <Grid container>
            <Grid xs={12} md={8} sx={{ p: { xs: 2, md: 3 } }}>
              {/* Stats cards */}
              <Box sx={{ mb: 3 }}>
                <StatsOverview tournamentId={id} tournament={tournament} />
              </Box>

              {/* Current matchweek matches */}
              {(isLeague || isHybrid) && currentMatches.length > 0 && (
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <Typography
                      variant="overline"
                      sx={{ color: 'text.disabled', letterSpacing: 2, fontSize: '0.6rem' }}
                    >
                      Hoy · Jornada {activeMw}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        height: 1,
                        bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
                      }}
                    />
                    {jornadaStats.live > 0 && (
                      <Chip
                        label={`${jornadaStats.live} en vivo`}
                        size="small"
                        color="error"
                        variant="soft"
                        sx={{ height: 20, fontSize: '0.6rem', fontFamily: 'monospace' }}
                      />
                    )}
                    {jornadaStats.pending > 0 && (
                      <Chip
                        label={`${jornadaStats.pending} pendientes`}
                        size="small"
                        color="warning"
                        variant="soft"
                        sx={{ height: 20, fontSize: '0.6rem', fontFamily: 'monospace' }}
                      />
                    )}
                  </Stack>
                  <MatchList
                    matches={currentMatches}
                    teams={teams}
                    grouped={false}
                    onMatchClick={handleMatchClick}
                    onScoreClick={handleScoreClick}
                  />
                </Box>
              )}
            </Grid>
            <Grid xs={12} md={4}>
              <StandingsSidebar
                tournamentId={id}
                teams={teams}
                nextPendingMatch={nextPendingMatch}
                onViewAll={() => navigate(paths.dashboard.tournament.matches(id))}
                onNextAction={
                  nextPendingMatch
                    ? () => handleScoreClick(nextPendingMatch)
                    : undefined
                }
              />
            </Grid>
          </Grid>
        )}

        {/* JORNADA TAB */}
        {currentTab === 'jornada' && (
          <Grid container>
            <Grid xs={12} md={8}>
              {/* Stats bar */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 1,
                  px: { xs: 2, md: 3 },
                  py: 2,
                  bgcolor: 'background.paper',
                  borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
                }}
              >
                {[
                  { value: jornadaStats.live, label: 'En vivo', color: 'error.main' },
                  { value: jornadaStats.pending, label: 'Pendientes', color: 'warning.main' },
                  { value: jornadaStats.finished, label: 'Finalizados', color: 'success.main' },
                  { value: jornadaStats.total, label: 'Total', color: 'text.primary' },
                ].map((item) => (
                  <Card
                    key={item.label}
                    sx={{
                      py: 1.5,
                      textAlign: 'center',
                      bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                      border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
                      boxShadow: 'none',
                    }}
                  >
                    <Typography
                      variant="h4"
                      sx={{ fontFamily: 'monospace', fontWeight: 500, letterSpacing: -0.5, color: item.color, lineHeight: 1, mb: 0.5 }}
                    >
                      {item.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.6rem' }}
                    >
                      {item.label}
                    </Typography>
                  </Card>
                ))}
              </Box>

              {/* Match list grouped by status */}
              <Box sx={{ p: { xs: 2, md: 3 } }}>
                <MatchList
                  matches={currentMatches}
                  teams={teams}
                  grouped
                  onMatchClick={handleMatchClick}
                  onScoreClick={handleScoreClick}
                />
              </Box>
            </Grid>
            <Grid xs={12} md={4}>
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

        {/* TEAMS TAB */}
        {currentTab === 'teams' && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <TeamList tournamentId={id} tournament={tournament} teams={teams} groups={groups} />
          </Box>
        )}

        {/* SCORERS TAB */}
        {currentTab === 'scorers' && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <TopScorersTable tournamentId={id} />
          </Box>
        )}

        {/* BRACKET TAB */}
        {currentTab === 'bracket' && (
          <Box sx={{ p: { xs: 2, md: 3 } }}>
            <BracketView tournamentId={id} teams={teams} tournament={tournament} />
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

      {/* Delete confirmation */}
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
            onClick={handleDelete}
          >
            Eliminar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
