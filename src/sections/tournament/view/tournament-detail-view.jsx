import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

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

export function TournamentDetailView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams } = useGetTeams(id);
  const { groups } = useGetGroups(id);

  const [currentTab, setCurrentTab] = useState('overview');
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        toast.success(`Torneo ${STATUS_LABEL[newStatus]?.toLowerCase() || newStatus}`);
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

      // Validate all current matchweek matches are finished
      if (currentMw > 0) {
        const { default: axios } = await import('src/utils/axios');
        const res = await axios.get(
          `${import.meta.env.VITE_HOST_API}/tournaments/${id}/matches?matchweek=${currentMw}`
        );
        const mwMatches = res.data || [];
        const unfinished = mwMatches.filter((m) => m.status !== 'finished');
        if (unfinished.length > 0) {
          toast.error(`Faltan ${unfinished.length} partido(s) por finalizar en Jornada ${currentMw}`);
          setIsSubmitting(false);
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
            <Button
              variant="outlined"
              startIcon={<Iconify icon="solar:pen-bold" />}
              onClick={() => navigate(paths.dashboard.tournament.edit(id))}
            >
              Editar
            </Button>
            <Button
              variant="soft"
              color="error"
              startIcon={<Iconify icon="solar:trash-bin-trash-bold" />}
              onClick={handleDelete}
            >
              Eliminar
            </Button>
          </Stack>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      {/* Tournament Management Panel */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="center" justifyContent="space-between">
          {/* Status & Info */}
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <Chip
              label={STATUS_LABEL[tournament.status] || tournament.status}
              color={STATUS_COLOR[tournament.status] || 'default'}
              size="medium"
            />
            <Typography variant="body2" color="text.secondary">
              {TYPE_LABEL[tournament.type] || tournament.type} · Temporada {tournament.season}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teams.length} equipos
            </Typography>
            {tournament.status === 'active' && totalMw > 0 && (
              <Chip
                icon={<Iconify icon="mdi:calendar-today" width={16} />}
                label={`Jornada ${currentMw} / ${totalMw}`}
                variant="outlined"
                color="primary"
              />
            )}
          </Stack>

          {/* Actions */}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            {tournament.status === 'draft' && (
              <LoadingButton
                variant="contained"
                color="success"
                startIcon={<Iconify icon="mdi:play" />}
                loading={isSubmitting}
                onClick={() => handleStatusChange('active')}
                disabled={teams.length < 2}
              >
                Activar Torneo
              </LoadingButton>
            )}

            {tournament.status === 'active' && (
              <>
                {totalMw > 0 && currentMw < totalMw && (
                  <LoadingButton
                    variant="outlined"
                    startIcon={<Iconify icon="mdi:skip-next" />}
                    loading={isSubmitting}
                    onClick={handleAdvanceMatchweek}
                  >
                    Avanzar Jornada
                  </LoadingButton>
                )}
                <LoadingButton
                  variant="contained"
                  color="info"
                  startIcon={<Iconify icon="mdi:flag-checkered" />}
                  loading={isSubmitting}
                  onClick={() => handleStatusChange('finished')}
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
      </Card>

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
        <TeamList tournamentId={id} teams={teams} groups={groups} />
      )}

      {currentTab === 'standings' && (
        <StandingsTable tournamentId={id} groups={groups} teams={teams} />
      )}

      {currentTab === 'scorers' && (
        <TopScorersTable tournamentId={id} />
      )}

      {currentTab === 'bracket' && (
        <BracketView tournamentId={id} teams={teams} tournament={tournament} />
      )}
    </DashboardContent>
  );
}
