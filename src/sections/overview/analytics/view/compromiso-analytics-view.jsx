import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import Tabs from '@mui/material/Tabs';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import { alpha } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

import { useGetUsers } from 'src/actions/user';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import {
  useGetEngagementRoster,
  useGetEngagementMatches,
  createEngagementTournament,
  deleteEngagementTournament,
  useGetEngagementTournaments,
} from 'src/actions/engagement';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';

import { RosterPanel } from 'src/sections/engagement/roster-panel';
import { MatchesPanel } from 'src/sections/engagement/matches-panel';
import { CompromisoTable } from 'src/sections/engagement/compromiso-table';
import { CompromisoCharts } from 'src/sections/engagement/compromiso-charts';

// ----------------------------------------------------------------------

export function CompromisoAnalyticsView() {
  const { selectedWorkspace } = useWorkspace();
  const { users } = useGetUsers(selectedWorkspace);
  const { tournaments } = useGetEngagementTournaments();
  const [tournamentId, setTournamentId] = useState('');
  const [newDialog, setNewDialog] = useState(false);
  const [tab, setTab] = useState('plantilla');

  useEffect(() => {
    if (!tournamentId && tournaments.length) setTournamentId(tournaments[0].id);
  }, [tournaments, tournamentId]);

  const tournament = tournaments.find((t) => t.id === tournamentId);

  const { roster } = useGetEngagementRoster(tournamentId, users);
  const { matches } = useGetEngagementMatches(tournamentId);

  const handleDeleteTournament = async () => {
    if (!tournament) return;
    if (!window.confirm(`¿Eliminar "${tournament.name}"? Se borra toda su plantilla, partidos y convocatorias.`)) return;
    try {
      await deleteEngagementTournament(tournament.id);
      setTournamentId('');
      toast.success('Torneo eliminado');
    } catch (error) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  return (
    <DashboardContent maxWidth="xl">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Typography variant="h4">Compromiso</Typography>
        <Button
          variant="contained"
          startIcon={<Iconify icon="mingcute:add-line" />}
          onClick={() => setNewDialog(true)}
        >
          Nuevo Torneo
        </Button>
      </Stack>

      {tournaments.length === 0 ? (
        <Card sx={{ p: 6, textAlign: 'center', boxShadow: 'none', border: (t) => `1px dashed ${alpha(t.palette.grey[500], 0.24)}` }}>
          <Iconify icon="solar:medal-star-bold" width={48} sx={{ color: 'text.disabled', mb: 1 }} />
          <Typography variant="body1" sx={{ mb: 0.5 }}>
            Todavía no registraste ningún torneo
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.disabled' }}>
            Ej. Lichi Cup, Ascenso Trinche 2, Master, Femenino — cualquier competencia externa donde juega tu equipo.
          </Typography>
        </Card>
      ) : (
        <Grid container spacing={3}>
          <Grid xs={12} md={3}>
            <Stack spacing={1}>
              {tournaments.map((t) => (
                <Card
                  key={t.id}
                  onClick={() => setTournamentId(t.id)}
                  sx={{
                    p: 2,
                    cursor: 'pointer',
                    boxShadow: 'none',
                    border: (th) => `1.5px solid ${t.id === tournamentId ? th.palette.primary.main : alpha(th.palette.grey[500], 0.12)}`,
                    bgcolor: t.id === tournamentId ? (th) => alpha(th.palette.primary.main, 0.04) : 'transparent',
                  }}
                >
                  <Typography variant="subtitle2" noWrap>
                    {t.name}
                  </Typography>
                  {t.category && (
                    <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                      {t.category}
                    </Typography>
                  )}
                </Card>
              ))}
            </Stack>
          </Grid>

          <Grid xs={12} md={9}>
            {tournament && (
              <Card sx={{ boxShadow: 'none', border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.12)}` }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, pt: 2 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Typography variant="h6">{tournament.name}</Typography>
                    {tournament.category && <Chip size="small" label={tournament.category} />}
                  </Stack>
                  <IconButton color="error" size="small" onClick={handleDeleteTournament}>
                    <Iconify icon="solar:trash-bin-trash-bold" width={18} />
                  </IconButton>
                </Stack>

                <Tabs
                  value={tab}
                  onChange={(_, v) => setTab(v)}
                  variant="scrollable"
                  scrollButtons="auto"
                  allowScrollButtonsMobile
                  sx={{ px: 2.5, mt: 1 }}
                >
                  <Tab value="plantilla" label={`Plantilla (${roster.length})`} />
                  <Tab value="partidos" label={`Partidos (${matches.length})`} />
                  <Tab value="compromiso" label="Compromiso" />
                </Tabs>

                <Box sx={{ p: 2.5 }}>
                  {tab === 'plantilla' && (
                    <RosterPanel tournamentId={tournamentId} users={users} roster={roster} />
                  )}
                  {tab === 'partidos' && (
                    <MatchesPanel tournamentId={tournamentId} roster={roster} matches={matches} />
                  )}
                  {tab === 'compromiso' && (
                    <Stack spacing={4}>
                      <CompromisoCharts roster={roster} matches={matches} />
                      <CompromisoTable roster={roster} matches={matches} />
                    </Stack>
                  )}
                </Box>
              </Card>
            )}
          </Grid>
        </Grid>
      )}

      <NewTournamentDialog
        open={newDialog}
        onClose={() => setNewDialog(false)}
        onCreated={(id) => setTournamentId(id)}
      />
    </DashboardContent>
  );
}

function NewTournamentDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setName('');
    setCategory('');
    onClose();
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('Escribí el nombre del torneo');
      return;
    }
    try {
      setIsSubmitting(true);
      const created = await createEngagementTournament({ name: name.trim(), category: category.trim() });
      toast.success('Torneo creado');
      onCreated?.(created.id);
      handleClose();
    } catch (error) {
      toast.error(error.message || 'Error al crear');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>Nuevo Torneo</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Nombre del torneo"
            placeholder="Ej. Lichi Cup"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Categoría (opcional)"
            placeholder="Ej. Femenino, Master"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Cancelar</Button>
        <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSave}>
          Crear
        </LoadingButton>
      </DialogActions>
    </Dialog>
  );
}
