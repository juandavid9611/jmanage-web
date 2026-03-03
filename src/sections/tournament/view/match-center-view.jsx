import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { paths } from 'src/routes/paths';

import { DashboardContent } from 'src/layouts/dashboard';
import {
  useGetTeams,
  updateMatch,
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
  const [scoreDialog, setScoreDialog] = useState({ open: false, match: null });
  const [scoreForm, setScoreForm] = useState({ score_home: 0, score_away: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    match_interval_days: 7,
    default_venue: '',
    group_id: '',
  });

  // Default to current matchweek for league/hybrid tournaments (both have a group phase with matchweeks)
  // Pure knockout has no matchweeks — bracket matches use matchweek 0 and must not be hidden
  useEffect(() => {
    if (tournament?.type !== 'knockout' && tournament?.current_matchweek > 0 && !matchweekFilter) {
      setMatchweekFilter(String(tournament.current_matchweek));
    }
  }, [tournament?.type, tournament?.current_matchweek]); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.success(
        `${result.matches_created} partidos generados (${result.matchweeks_generated} jornadas)`
      );
    } catch (error) {
      toast.error(error.message || 'Error al generar calendario');
    }
  }, [id, scheduleForm]);

  const handleOpenScore = useCallback((match) => {
    setScoreForm({
      score_home: match.score_home >= 0 ? match.score_home : 0,
      score_away: match.score_away >= 0 ? match.score_away : 0,
    });
    setScoreDialog({ open: true, match });
  }, []);

  const handleSaveScore = useCallback(async () => {
    const { match } = scoreDialog;
    if (!match) return;
    try {
      setIsSubmitting(true);
      const updateData = {
        score_home: Number(scoreForm.score_home),
        score_away: Number(scoreForm.score_away),
      };
      // Only transition to finished if the match isn't already finished
      // (finished → finished is not a valid transition and returns 400)
      if (match.status !== 'finished') {
        updateData.status = 'finished';
      }
      await updateMatch(id, match.id, updateData);
      toast.success('Marcador guardado');
      setScoreDialog({ open: false, match: null });
    } catch (error) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  }, [id, scoreDialog, scoreForm]);

  if (tournamentLoading) return <LoadingScreen />;

  const totalMatchweeks = tournament?.rules?.total_matchweeks || 0;
  const matchweekOptions = Array.from({ length: totalMatchweeks }, (_, i) => String(i + 1));
  const groups = tournament?.groups || [];
  const isHybrid = tournament?.type === 'hybrid';

  const homeTeam = scoreDialog.match
    ? teams.find((t) => t.id === scoreDialog.match.home_team_id)
    : null;
  const awayTeam = scoreDialog.match
    ? teams.find((t) => t.id === scoreDialog.match.away_team_id)
    : null;

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

      {/* Matchweek navigator */}
      {matchweekOptions.length > 0 && (
        <Box sx={{ mb: 2 }}>
          <Tabs
            value={matchweekFilter}
            onChange={(_, v) => setMatchweekFilter(v)}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab value="" label="Todas" />
            {matchweekOptions.map((mw) => (
              <Tab key={mw} value={mw} label={`J${mw}`} />
            ))}
          </Tabs>
        </Box>
      )}

      {/* Status filter */}
      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
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
            onScoreClick={
              match.status !== 'scheduled' ? () => handleOpenScore(match) : undefined
            }
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

      {/* Inline score recording dialog */}
      <Dialog
        open={scoreDialog.open}
        onClose={() => setScoreDialog({ open: false, match: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Registrar Marcador</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Stack direction="row" alignItems="center" spacing={2}>
              <Stack alignItems="center" sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {homeTeam?.short_name || homeTeam?.name || 'Local'}
                </Typography>
                <TextField
                  type="number"
                  value={scoreForm.score_home}
                  onChange={(e) =>
                    setScoreForm((f) => ({ ...f, score_home: Math.max(0, Number(e.target.value)) }))
                  }
                  inputProps={{ min: 0, style: { textAlign: 'center', fontSize: 32, fontWeight: 700 } }}
                  sx={{ width: 80 }}
                />
              </Stack>

              <Divider orientation="vertical" flexItem sx={{ my: 1 }}>
                <Typography variant="h5" color="text.secondary">
                  -
                </Typography>
              </Divider>

              <Stack alignItems="center" sx={{ flex: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {awayTeam?.short_name || awayTeam?.name || 'Visitante'}
                </Typography>
                <TextField
                  type="number"
                  value={scoreForm.score_away}
                  onChange={(e) =>
                    setScoreForm((f) => ({ ...f, score_away: Math.max(0, Number(e.target.value)) }))
                  }
                  inputProps={{ min: 0, style: { textAlign: 'center', fontSize: 32, fontWeight: 700 } }}
                  sx={{ width: 80 }}
                />
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScoreDialog({ open: false, match: null })}>Cancelar</Button>
          <LoadingButton variant="contained" loading={isSubmitting} onClick={handleSaveScore}>
            Guardar
          </LoadingButton>
        </DialogActions>
      </Dialog>
    </DashboardContent>
  );
}
