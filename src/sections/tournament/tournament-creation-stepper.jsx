import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function TournamentCreationStepper({ steps, activeStep, unlockedSteps, values, onStepClick }) {
  // Derive step summary values from form state
  const getStepValue = (stepKey) => {
    switch (stepKey) {
      case 'identity':
        return values.name || '—';
      case 'format': {
        const labels = { hybrid: 'Grupos + KO', league: 'Liga', knockout: 'Knockout' };
        return labels[values.type] || '—';
      }
      case 'scoring':
        return `${values.rules?.points_per_win ?? 3}-${values.rules?.points_per_draw ?? 1}-${values.rules?.points_per_loss ?? 0}`;
      case 'tiebreakers':
        return values.tiebreaker_order?.length ? `${values.tiebreaker_order.length} criterios` : '—';
      case 'options': {
        const opts = values.options || {};
        const count = Object.values(opts).filter(Boolean).length;
        return `${count} activas`;
      }
      default:
        return '—';
    }
  };

  const isStepDone = (index) => {
    if (index === 0) return !!(values.name && values.sport);
    if (index === 1) return !!(values.type && values.num_teams);
    if (index === 2) return true; // has defaults
    if (index === 3) return true; // has defaults
    if (index === 4) return true; // has defaults
    return false;
  };

  return (
    <Stack
      sx={{
        p: 3,
        height: '100%',
        position: { md: 'sticky' },
        top: { md: 0 },
      }}
    >
      <Typography
        variant="overline"
        sx={{
          color: 'text.disabled',
          letterSpacing: 2,
          mb: 2,
        }}
      >
        Nuevo torneo
      </Typography>

      <Stack spacing={0.25} sx={{ flex: 1 }}>
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = isStepDone(index);
          const isLocked = !unlockedSteps.has(index);

          return (
            <Box key={step.key}>
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.5}
                onClick={() => onStepClick(index)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  cursor: isLocked ? 'not-allowed' : 'pointer',
                  opacity: isLocked ? 0.35 : 1,
                  bgcolor: isActive
                    ? (t) => alpha(t.palette.primary.main, 0.06)
                    : 'transparent',
                  transition: 'all 0.2s',
                  '&:hover': {
                    bgcolor: isLocked
                      ? 'transparent'
                      : (t) => alpha(t.palette.primary.main, 0.04),
                  },
                }}
              >
                {/* Step indicator */}
                <Box
                  sx={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontFamily: 'monospace',
                    fontWeight: 600,
                    flexShrink: 0,
                    border: (t) =>
                      `1.5px solid ${
                        isDone || isActive
                          ? t.palette.primary.main
                          : alpha(t.palette.grey[500], 0.24)
                      }`,
                    bgcolor: isDone
                      ? (t) => alpha(t.palette.primary.main, 0.1)
                      : 'transparent',
                    color:
                      isDone || isActive
                        ? 'primary.main'
                        : 'text.disabled',
                    ...(isActive && {
                      boxShadow: (t) => `0 0 0 3px ${alpha(t.palette.primary.main, 0.08)}`,
                    }),
                  }}
                >
                  {isDone ? (
                    <Iconify icon="eva:checkmark-fill" width={14} />
                  ) : (
                    step.number
                  )}
                </Box>

                {/* Step content */}
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: isActive || isDone ? 600 : 500,
                      color: isActive || isDone ? 'text.primary' : 'text.secondary',
                    }}
                  >
                    {step.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: isDone ? 'primary.main' : 'text.disabled',
                      fontFamily: 'monospace',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {getStepValue(step.key)}
                  </Typography>
                </Box>
              </Stack>

              {/* Connector line — thin and subtle */}
              {index < steps.length - 1 && (
                <Box
                  sx={{
                    width: '1px',
                    height: 12,
                    ml: '26px',
                    bgcolor: isDone
                      ? (t) => alpha(t.palette.primary.main, 0.2)
                      : (t) => alpha(t.palette.grey[500], 0.12),
                    transition: 'background-color 0.3s',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Stack>
    </Stack>
  );
}
