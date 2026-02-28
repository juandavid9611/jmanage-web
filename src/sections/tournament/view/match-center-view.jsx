import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTeams,
  useGetMatches,
  useGetTournament,
  generateSchedule,
} from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';
import { Iconify } from 'src/components/iconify';
import { EmptyContent } from 'src/components/empty-content';
import { LoadingScreen } from 'src/components/loading-screen';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

import { MatchCard } from '../match-card';

// ----------------------------------------------------------------------

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'scheduled', label: 'Programado' },
  { value: 'live', label: 'En Vivo' },
  { value: 'finished', label: 'Finalizado' },
  { value: 'postponed', label: 'Aplazado' },
];

export function MatchCenterView() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { tournament, tournamentLoading } = useGetTournament(id);
  const { teams } = useGetTeams(id);

  const [matchweekFilter, setMatchweekFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    match_interval_days: 7,
    default_venue: '',
    group_id: '',
  });

  // Default to current matchweek once tournament loads
  useEffect(() => {
    if (tournament?.current_matchweek > 0 && !matchweekFilter) {
      setMatchweekFilter(tournament.current_matchweek);
    }
  }, [tournament?.current_matchweek]); // eslint-disable-line react-hooks/exhaustive-deps

  const { matches, matchesLoading } = useGetMatches(id, {
    matchweek: matchweekFilter || undefined,
    status: statusFilter || undefined,
  });

  const handleGenerateSchedule = useCallback(async () => {
    try {
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
      toast.success(`${result.matches_created} partidos generados (${result.matchweeks_generated} jornadas)`);
    } catch (error) {
      toast.error(error.message || 'Error al generar calendario');
    }
  }, [id, scheduleForm]);

  if (tournamentLoading) return <LoadingScreen />;

  const totalMatchweeks = tournament?.rules?.total_matchweeks || 0;
  const matchweekOptions = Array.from({ length: totalMatchweeks }, (_, i) => i + 1);
  const groups = tournament?.groups || [];
  const isHybrid = tournament?.type === 'hybrid';

  return (
    <DashboardContent>
      <CustomBreadcrumbs
        heading="Partidos"
        links={[
          { name: 'Dashboard', href: paths.dashboard.root },
          { name: 'Torneos', href: paths.dashboard.tournament.root },
          { name: tournament?.name || '', href: paths.dashboard.tournament.details(id) },
          { name: 'Partidos' },
        ]}
        action={
          <Button
            variant="contained"
            startIcon={<Iconify icon="mdi:auto-fix" />}
            onClick={() => setScheduleDialog(true)}
            disabled={teams.length < 2}
          >
            Generar Calendario
          </Button>
        }
        sx={{ mb: { xs: 3, md: 5 } }}
      />

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <TextField
          select
          size="small"
          label="Jornada"
          value={matchweekFilter}
          onChange={(e) => setMatchweekFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          <MenuItem value="">Todas</MenuItem>
          {matchweekOptions.map((mw) => (
            <MenuItem key={mw} value={mw}>
              Jornada {mw}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          size="small"
          label="Estado"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150 }}
        >
          {STATUS_OPTIONS.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {matches.length === 0 && !matchesLoading && (
        <EmptyContent
          filled
          title="No hay partidos"
          description="Genera el calendario automáticamente o crea partidos manualmente"
          sx={{ py: 10 }}
        />
      )}

      <Box
        gap={2}
        display="grid"
        gridTemplateColumns={{ xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }}
      >
        {matches.map((match) => (
          <MatchCard
            key={match.id}
            match={match}
            teams={teams}
            onClick={() => navigate(paths.dashboard.tournament.matchDetail(id, match.id))}
          />
        ))}
      </Box>

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
          <Button variant="contained" onClick={handleGenerateSchedule}>
            Generar
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
