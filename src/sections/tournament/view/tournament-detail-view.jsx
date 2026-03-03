import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Step from '@mui/material/Step';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Stepper from '@mui/material/Stepper';
import Tooltip from '@mui/material/Tooltip';
import StepLabel from '@mui/material/StepLabel';
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
  useGetGroups,
  useGetTournament,
  deleteTournament,
  updateTournament,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { TeamList } from '../team-list';
import { BracketView } from '../bracket-view';
import { StatsOverview } from '../stats-overview';
import { StandingsTable } from '../standings-table';
import { TopScorersTable } from '../top-scorers-table';

// ----------------------------------------------------------------------

const STATUS_LABEL = {
  draft: 'Borrador',
  active: 'Activo',
  finished: 'Finalizado',
  cancelled: 'Cancelado',
};

const STATUS_COLOR = {
  draft: 'default',
  active: 'success',
  finished: 'info',
  cancelled: 'error',
};

const TYPE_LABEL = {
  league: 'Liga',
  knockout: 'Eliminación',
  hybrid: 'Híbrido',
};

const TABS = [
  { value: 'overview', label: 'General', icon: 'mdi:information-outline' },
  { value: 'teams', label: 'Equipos', icon: 'mdi:shield-half-full' },
  { value: 'standings', label: 'Clasificación', icon: 'mdi:format-list-numbered' },
  { value: 'scorers', label: 'Goleadores', icon: 'mdi:soccer' },
  { value: 'bracket', label: 'Cuadro', icon: 'mdi:tournament' },
];

const STATUS_STEPS = ['Borrador', 'Activo', 'Finalizado'];
const STATUS_STEP_INDEX = { draft: 0, active: 1, finished: 2 };

export function TournamentDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams } = useGetTeams(id);
  const { groups } = useGetGroups(id);

  const [currentTab, setCurrentTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activateDialog, setActivateDialog] = useState(false);
  const [finishDialog, setFinishDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);

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
      const currentMw = tournament?.current_matchweek || 0;

      if (currentMw > 0) {
        const { default: axios } = await import('src/utils/axios');
        const res = await axios.get(
          `${import.meta.env.VITE_HOST_API}/tournaments/${id}/matches?matchweek=${currentMw}`
        );
        const mwMatches = res.data || [];
        const unfinished = mwMatches.filter((m) => m.status !== 'finished');
        if (unfinished.length > 0) {
          toast.error(
            `Faltan ${unfinished.length} partido(s) por finalizar en Jornada ${currentMw}`
          );
          return;
        }
      }

      const nextMw = currentMw + 1;
      await updateTournament(id, { current_matchweek: nextMw });
      toast.success(`Avanzado a Jornada ${nextMw}`);
    } catch (error) {
      toast.error(error.message || 'Error');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, tournament]);

  if (tournamentLoading) return <LoadingScreen />;

  if (!tournament) return <Typography>Torneo no encontrado</Typography>;

  const totalMw = tournament.rules?.total_matchweeks || 0;
  const currentMw = tournament.current_matchweek || 0;
  const stepIndex = STATUS_STEP_INDEX[tournament.status] ?? 0;
  const canActivate = teams.length >= 2;
  const isLeague = tournament.type === 'league';
  const isHybrid = tournament.type === 'hybrid';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading={tournament.name}
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: tournament.name },
        ]}
        action={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<Iconify icon="mdi:soccer-field" />}
              onClick={() => navigate(paths.dashboard.tournament.matches(id))}
            >
              Partidos
            </Button>
            {tournament.status !== 'finished' && (
              <Button
                variant="outlined"
                startIcon={<Iconify icon="solar:pen-bold" />}
                onClick={() => navigate(paths.dashboard.tournament.edit(id))}
              >
                Editar
              </Button>
            )}
            <Button
              variant="soft"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={() => setDeleteDialog(true)}
            >
              Eliminar
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Status Stepper Panel */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack spacing={3}>
          {/* Stepper */}
          <Stepper activeStep={stepIndex} alternativeLabel>
            {STATUS_STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* Info row */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Chip
                label={STATUS_LABEL[tournament.status] || tournament.status}
                color={STATUS_COLOR[tournament.status] || 'default'}
                size="medium"
              />
              <Typography variant="body2" color="text.secondary">
                {TYPE_LABEL[tournament.type] || tournament.type}
                {tournament.season && ` · Temporada ${tournament.season}`}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {teams.length} equipo{teams.length !== 1 ? 's' : ''}
              </Typography>
              {tournament.status === 'active' && (isLeague || isHybrid) && totalMw > 0 && (
                <Chip
                  icon={<Iconify icon="mdi:calendar-today" width={16} />}
                  label={`Jornada ${currentMw} / ${totalMw}`}
                  variant="outlined"
                  color="primary"
                  size="small"
                />
              )}
            </Stack>

            {/* Lifecycle actions */}
            <Stack direction="row" spacing={1} flexShrink={0}>
              {tournament.status === 'draft' && (
                <Tooltip
                  title={!canActivate ? 'Se necesitan al menos 2 equipos para activar el torneo' : ''}
                  arrow
                >
                  <span>
                    <LoadingButton
                      variant="contained"
                      color="success"
                      startIcon={<Iconify icon="mdi:play" />}
                      loading={isSubmitting}
                      onClick={() => setActivateDialog(true)}
                      disabled={!canActivate}
                    >
                      Activar Torneo
                    </LoadingButton>
                  </span>
                </Tooltip>
              )}

              {tournament.status === 'active' && (
                <>
                  {(isLeague || isHybrid) && totalMw > 0 && currentMw < totalMw && (
                    <LoadingButton
                      variant="outlined"
                      startIcon={<Iconify icon="mdi:skip-next" />}
                      loading={isSubmitting}
                      onClick={handleAdvanceMatchweek}
                    >
                      Avanzar Jornada
                    </LoadingButton>
                  )}
                  {(tournament.type === 'knockout' || tournament.type === 'hybrid') && (
                    <Button
                      variant="outlined"
                      startIcon={<Iconify icon="mdi:tournament" />}
                      onClick={() => setCurrentTab('bracket')}
                    >
                      Ver Cuadro
                    </Button>
                  )}
                  <LoadingButton
                    variant="contained"
                    color="info"
                    startIcon={<Iconify icon="mdi:flag-checkered" />}
                    loading={isSubmitting}
                    onClick={() => setFinishDialog(true)}
                  >
                    Finalizar Torneo
                  </LoadingButton>
                </>
              )}

              {tournament.status === 'finished' && (
                <LoadingButton
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:restore" />}
                  loading={isSubmitting}
                  onClick={() => handleStatusChange('active')}
                >
                  Reabrir
                </LoadingButton>
              )}
            </Stack>
          </Stack>

          {/* Draft guidance */}
          {tournament.status === 'draft' && !canActivate && (
            <Alert severity="info" icon={<Iconify icon="mdi:information-outline" />}>
              Agrega al menos 2 equipos en la pestaña <strong>Equipos</strong> para poder activar el torneo.
            </Alert>
          )}

          {/* Finished banner */}
          {tournament.status === 'finished' && (
            <Alert severity="success" icon={<Iconify icon="mdi:trophy" />}>
              Torneo finalizado. Los datos son de solo lectura.
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 3 }}>
        {TABS.map((tab) => (
          <Tab
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={<Iconify icon={tab.icon} width={20} />}
            iconPosition="start"
          />
        ))}
      </Tabs>

      {currentTab === 'overview' && (
        <StatsOverview tournamentId={id} tournament={tournament} />
      )}

      {currentTab === 'teams' && (
        <TeamList tournamentId={id} tournament={tournament} teams={teams} groups={groups} />
      )}

      {currentTab === 'standings' && (
        <StandingsTable tournamentId={id} groups={groups} teams={teams} />
      )}

      {currentTab === 'scorers' && <TopScorersTable tournamentId={id} />}

      {currentTab === 'bracket' && (
        <BracketView tournamentId={id} teams={teams} tournament={tournament} />
      )}

      {/* Activate confirmation dialog */}
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

      {/* Finish confirmation dialog */}
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

      {/* Delete confirmation dialog */}
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
