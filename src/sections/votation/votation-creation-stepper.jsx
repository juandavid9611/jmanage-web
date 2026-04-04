import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function VotationCreationStepper({ steps, activeStep, unlockedSteps, stepValues, onStepClick }) {
  const isStepDone = (index) => {
    if (index === 0) return !!stepValues?.config && stepValues.config !== '—';
    if (index === 1) return !!stepValues?.candidatos && stepValues.candidatos !== '—';
    if (index === 2) return false;
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
        sx={{ color: 'text.disabled', letterSpacing: 2, mb: 2 }}
      >
        Nueva votación
      </Typography>

      <Stack spacing={0.25} sx={{ flex: 1 }}>
        {steps.map((step, index) => {
          const isActive = activeStep === index;
          const isDone = isStepDone(index);
          const isLocked = !unlockedSteps.has(index);
          const valueKey = step.key;
          const valueText = stepValues?.[valueKey] || '—';

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
                    color: isDone || isActive ? 'primary.main' : 'text.disabled',
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
                    {valueText}
                  </Typography>
                </Box>
              </Stack>

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
