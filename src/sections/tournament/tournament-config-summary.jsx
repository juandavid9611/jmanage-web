import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const SPORT_LABELS = {
  futbol: 'Fútbol',
  baloncesto: 'Baloncesto',
  voleibol: 'Voleibol',
  tenis: 'Tenis',
  padel: 'Pádel',
  otro: 'Otro',
};

const FORMAT_LABELS = {
  league: 'Liga / Round Robin',
  knockout: 'Solo Knockout',
  hybrid: 'Grupos + Knockout',
};

const FORMAT_DESC = {
  league: 'Todos contra todos. Gana quien más puntos acumule al final.',
  knockout: 'Eliminación directa desde el inicio.',
  hybrid: 'Fase de grupos seguida de eliminación directa.',
};

const OPTION_LABELS = {
  public_registration: { label: 'Registro público', icon: 'mdi:account-plus-outline' },
  individual_stats: { label: 'Estadísticas individuales', icon: 'mdi:chart-bar' },
  public_results: { label: 'Resultados públicos', icon: 'mdi:eye-outline' },
  email_notifications: { label: 'Notificaciones por email', icon: 'mdi:email-outline' },
  extra_time: { label: 'Tiempo extra', icon: 'mdi:timer-sand' },
};

// ----------------------------------------------------------------------

export function TournamentConfigSummary({ tournament }) {
  const rules = tournament.rules || {};
  const options = tournament.options || {};
  const tiebreakers = tournament.tiebreaker_order || [];

  return (
    <Box
      display="grid"
      gridTemplateColumns={{ xs: '1fr', md: '1fr 1fr' }}
      gap={3}
    >
      {/* ── Left column ── */}
      <Stack spacing={3}>
        {/* Identity */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:badge-account-horizontal-outline" width={20} />
            <Typography variant="subtitle1">Identidad</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <ConfigRow label="Nombre" value={tournament.name} />
            <Divider />
            <ConfigRow
              label="Deporte"
              value={SPORT_LABELS[tournament.sport] || tournament.sport || '—'}
            />
            <Divider />
            <ConfigRow label="Ciudad" value={tournament.location || '—'} />
          </Stack>
        </Card>

        {/* Format */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:tournament" width={20} />
            <Typography variant="subtitle1">Formato</Typography>
          </Stack>

          <Stack spacing={1.5}>
            <ConfigRow
              label="Tipo"
              value={FORMAT_LABELS[tournament.type] || tournament.type || '—'}
            />

            {FORMAT_DESC[tournament.type] && (
              <Typography variant="caption" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {FORMAT_DESC[tournament.type]}
              </Typography>
            )}

            <Divider />
            <ConfigRow label="Número de equipos" value={tournament.num_teams || '—'} />

            {tournament.teams_per_group && (
              <>
                <Divider />
                <ConfigRow label="Equipos por grupo" value={tournament.teams_per_group} />
              </>
            )}

            {rules.total_matchweeks > 0 && (
              <>
                <Divider />
                <ConfigRow label="Total de jornadas" value={rules.total_matchweeks} />
              </>
            )}
          </Stack>
        </Card>
      </Stack>

      {/* ── Right column ── */}
      <Stack spacing={3}>
        {/* Scoring */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:scoreboard-outline" width={20} />
            <Typography variant="subtitle1">Puntuación</Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            <ScoreChip label="Victoria" value={rules.points_per_win ?? 3} color="success" />
            <ScoreChip label="Empate" value={rules.points_per_draw ?? 1} color="warning" />
            <ScoreChip label="Derrota" value={rules.points_per_loss ?? 0} color="error" />
          </Stack>
        </Card>

        {/* Tiebreakers */}
        {tiebreakers.length > 0 && (
          <Card sx={{ p: 2 }}>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <Iconify icon="mdi:sort-variant" width={20} />
              <Typography variant="subtitle1">Criterios de desempate</Typography>
            </Stack>

            <Stack spacing={1}>
              {tiebreakers.map((tb, idx) => (
                <Stack key={tb} direction="row" alignItems="center" spacing={1.5}>
                  <Chip label={idx + 1} size="small" variant="soft" color="default" />
                  <Typography variant="body2">{tb}</Typography>
                </Stack>
              ))}
            </Stack>
          </Card>
        )}

        {/* Options */}
        <Card sx={{ p: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <Iconify icon="mdi:cog-outline" width={20} />
            <Typography variant="subtitle1">Opciones</Typography>
          </Stack>

          <Stack spacing={1}>
            {Object.entries(OPTION_LABELS).map(([key, { label, icon }]) => {
              const enabled = !!options[key];
              return (
                <Stack key={key} direction="row" alignItems="center" spacing={1.5}>
                  <Iconify
                    icon={enabled ? 'eva:checkmark-circle-2-fill' : 'eva:close-circle-outline'}
                    width={20}
                    sx={{ color: enabled ? 'success.main' : 'text.disabled' }}
                  />
                  <Typography
                    variant="body2"
                    color={enabled ? 'text.primary' : 'text.disabled'}
                  >
                    {label}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </Card>
      </Stack>
    </Box>
  );
}

// ----------------------------------------------------------------------

function ConfigRow({ label, value }) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="subtitle2">{value}</Typography>
    </Stack>
  );
}

function ScoreChip({ label, value, color }) {
  return (
    <Card
      sx={{
        flex: 1,
        py: 2,
        textAlign: 'center',
        bgcolor: (t) => t.palette[color].lighter,
        boxShadow: 'none',
      }}
    >
      <Typography variant="h4" color={`${color}.dark`} sx={{ mb: 0.25 }}>
        {value}
      </Typography>
      <Typography variant="caption" color={`${color}.dark`} sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
        {label}
      </Typography>
    </Card>
  );
}
