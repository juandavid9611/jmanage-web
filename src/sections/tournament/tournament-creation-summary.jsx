import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const REQUIREMENTS = [
  { key: 'name', label: 'Nombre del torneo', check: (v) => !!v.name },
  { key: 'sport', label: 'Deporte', check: (v) => !!v.sport },
  { key: 'format', label: 'Formato', check: (v) => !!v.type },
  { key: 'scoring', label: 'Sistema de puntuación', check: () => true },
  { key: 'tiebreak', label: 'Criterios de desempate', check: () => true },
];

// ----------------------------------------------------------------------

export function TournamentCreationSummary({ values, structurePreview }) {
  // Calculate completeness
  const completedCount = REQUIREMENTS.filter((r) => r.check(values)).length;
  const percentage = Math.round((completedCount / REQUIREMENTS.length) * 100);

  return (
    <Stack
      sx={{
        p: 3,
        height: '100%',
        position: { md: 'sticky' },
        top: { md: 0 },
        gap: 2.5,
        overflowY: { md: 'auto' },
        maxHeight: { md: 'calc(100vh - 64px)' },
      }}
    >
      {/* Completeness bar */}
      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Configuración completa
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: 'primary.main', fontFamily: 'monospace', fontWeight: 600 }}
          >
            {percentage}%
          </Typography>
        </Stack>
        <LinearProgress
          variant="determinate"
          value={percentage}
          sx={{
            height: 3,
            borderRadius: 1,
            bgcolor: (t) => alpha(t.palette.grey[500], 0.08),
            '& .MuiLinearProgress-bar': {
              borderRadius: 1,
              bgcolor: 'primary.main',
            },
          }}
        />
      </Box>

      <Divider />

      {/* Structure visual */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Estructura del torneo
        </Typography>
        <Card
          sx={{
            p: 2,
            border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
            boxShadow: 'none',
          }}
        >
          <Stack
            spacing={0}
            divider={
              <Box
                sx={{ borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.06)}` }}
              />
            }
          >
            {(structurePreview?.phases?.length > 0
              ? structurePreview.phases
              : [
                  { name: 'Inscripción', detail: 'Esperando configuración', active: false },
                  { name: 'Fase de grupos', detail: '—', active: false },
                  { name: 'Knockout', detail: '—', active: false },
                ]
            ).map((phase) => (
              <Stack
                key={phase.name}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ py: 1 }}
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: phase.active
                      ? 'primary.main'
                      : phase.pending
                        ? 'info.main'
                        : (t) => alpha(t.palette.grey[500], 0.2),
                    flexShrink: 0,
                  }}
                />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 600, display: 'block', color: 'text.primary' }}
                  >
                    {phase.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: 11 }}>
                    {phase.detail}
                  </Typography>
                </Box>
              </Stack>
            ))}
          </Stack>
        </Card>

        {/* Persistent structure preview text */}
        {structurePreview?.text && (
          <Box
            sx={{
              mt: 1.5,
              px: 1.5,
              py: 1,
              borderRadius: 1,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.04),
              borderLeft: (t) => `2px solid ${alpha(t.palette.primary.main, 0.3)}`,
            }}
          >
            <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
              {structurePreview.text}
            </Typography>
          </Box>
        )}
      </Box>

      <Divider />

      {/* Requirements */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Pendiente
        </Typography>
        <Stack spacing={0.5}>
          {REQUIREMENTS.map((req) => {
            const done = req.check(values);
            return (
              <Stack key={req.key} direction="row" alignItems="center" spacing={1} sx={{ py: 0.5 }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: done
                      ? 'primary.main'
                      : (t) => alpha(t.palette.grey[500], 0.2),
                    flexShrink: 0,
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: done ? 'text.secondary' : 'text.disabled',
                    flex: 1,
                  }}
                >
                  {req.label}
                </Typography>
                {done && (
                  <Iconify
                    icon="eva:checkmark-fill"
                    width={14}
                    sx={{ color: 'primary.main' }}
                  />
                )}
              </Stack>
            );
          })}
        </Stack>
      </Box>

      {/* Status message instead of duplicate CTA */}
      <Box sx={{ mt: 'auto', pt: 2, borderTop: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}` }}>
        <Typography
          variant="caption"
          sx={{
            color: percentage === 100 ? 'primary.main' : 'text.disabled',
            textAlign: 'center',
            display: 'block',
            fontWeight: percentage === 100 ? 600 : 400,
          }}
        >
          {percentage === 100
            ? '✓ Listo para crear el torneo'
            : 'Completa los campos requeridos para continuar'}
        </Typography>
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

function Divider() {
  return (
    <Box
      sx={{
        borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.08)}`,
      }}
    />
  );
}
