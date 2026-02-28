import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Unstable_Grid2';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import LoadingButton from '@mui/lab/LoadingButton';

import { paths } from 'src/routes/paths';

import { createTournament, updateTournament } from 'src/actions/tournament';

import { toast } from 'src/components/snackbar';

// ----------------------------------------------------------------------

const TOURNAMENT_TYPE_OPTIONS = [
  { value: 'league', label: 'Liga' },
  { value: 'knockout', label: 'Eliminación Directa' },
  { value: 'hybrid', label: 'Híbrido (Grupos + Eliminación)' },
];

const defaultRules = {
  points_per_win: 3,
  points_per_draw: 1,
  points_per_loss: 0,
  total_matchweeks: 6,
  legs: 1,
};

export function TournamentNewEditForm({ currentTournament }) {
  const navigate = useNavigate();

  const isEdit = !!currentTournament;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: currentTournament?.name || '',
    season: currentTournament?.season || '',
    type: currentTournament?.type || 'league',
    rules: {
      ...defaultRules,
      ...currentTournament?.rules,
    },
  });

  const handleChange = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleRuleChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      rules: { ...prev.rules, [field]: Number(value) },
    }));
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setIsSubmitting(true);
      if (isEdit) {
        await updateTournament(currentTournament.id, formData);
        toast.success('Torneo actualizado');
      } else {
        const result = await createTournament(formData);
        toast.success('Torneo creado');
        navigate(paths.dashboard.tournament.details(result.id));
        return;
      }
      navigate(paths.dashboard.tournament.root);
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  }, [isEdit, currentTournament, formData, navigate]);

  return (
    <Grid container spacing={3}>
      <Grid xs={12} md={8}>
        <Card sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Nombre del Torneo"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
            />

            <TextField
              fullWidth
              label="Temporada"
              value={formData.season}
              onChange={(e) => handleChange('season', e.target.value)}
              placeholder="2026-A"
            />

            <TextField
              fullWidth
              select
              label="Tipo de Torneo"
              value={formData.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              {TOURNAMENT_TYPE_OPTIONS.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </Card>
      </Grid>

      <Grid xs={12} md={4}>
        <Card sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 3 }}>
            Reglas
          </Typography>

          <Stack spacing={2}>
            <TextField
              fullWidth
              type="number"
              label="Puntos por Victoria"
              value={formData.rules.points_per_win}
              onChange={(e) => handleRuleChange('points_per_win', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Puntos por Empate"
              value={formData.rules.points_per_draw}
              onChange={(e) => handleRuleChange('points_per_draw', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Puntos por Derrota"
              value={formData.rules.points_per_loss}
              onChange={(e) => handleRuleChange('points_per_loss', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Total Jornadas"
              value={formData.rules.total_matchweeks}
              onChange={(e) => handleRuleChange('total_matchweeks', e.target.value)}
            />
            <TextField
              fullWidth
              type="number"
              label="Vueltas"
              value={formData.rules.legs}
              onChange={(e) => handleRuleChange('legs', e.target.value)}
              helperText="1 = ida, 2 = ida y vuelta"
            />
          </Stack>
        </Card>

        <Stack sx={{ mt: 3 }}>
          <LoadingButton
            size="large"
            variant="contained"
            loading={isSubmitting}
            onClick={handleSubmit}
            disabled={!formData.name}
          >
            {isEdit ? 'Guardar Cambios' : 'Crear Torneo'}
          </LoadingButton>
        </Stack>
      </Grid>
    </Grid>
  );
}
