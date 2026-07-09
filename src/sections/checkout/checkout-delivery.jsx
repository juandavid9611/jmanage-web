import { useTranslation } from 'react-i18next';
import { Controller, useFormContext } from 'react-hook-form';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export function CheckoutDelivery({ name, options, onApplyShipping, sx, ...other }) {
  const { t } = useTranslation();
  const { control } = useFormContext();

  return (
    <Card sx={sx} {...other}>
      <CardHeader title={t('label_delivery')} />

      <Controller
        name={name}
        control={control}
        render={({ field: { value, onChange } }) => (
          <Box
            columnGap={2}
            rowGap={2.5}
            display="grid"
            gridTemplateColumns={{ xs: 'repeat(1, 1fr)', sm: 'repeat(2, 1fr)' }}
            sx={{ p: 3 }}
          >
            {options.map((option) => (
              <OptionItem
                key={option.label}
                option={option}
                selected={value === option.value}
                disabled={option.disabled}
                onClick={() => {
                  if (option.disabled) return;
                  onChange(option.value);
                  onApplyShipping(option.value);
                }}
              />
            ))}
          </Box>
        )}
      />
    </Card>
  );
}

// ----------------------------------------------------------------------

function OptionItem({ option, selected, disabled, sx, ...other }) {
  const { t } = useTranslation();
  return (
    <Box
      display="flex"
      sx={{
        p: 2.5,
        gap: 2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        borderRadius: 1.5,
        border: (theme) => `solid 1px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.24)}`,
        transition: (theme) =>
          theme.transitions.create(['box-shadow'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.shortest,
          }),
        ...(selected && {
          boxShadow: (theme) => `0 0 0 2px ${theme.vars.palette.text.primary}`,
        }),
        ...(disabled && {
          opacity: 0.5,
          pointerEvents: 'auto',
        }),
        ...sx,
      }}
      {...other}
    >
      <Iconify
        width={28}
        icon={
          (option.value === 10 && 'carbon:delivery') ||
          (option.value === 20 && 'carbon:rocket') ||
          (option.value === 'pickup' && 'carbon:location') ||
          'carbon:bicycle'
        }
      />

      <Box flex="1 1 auto">
        <Box display="flex" alignItems="center" sx={{ mb: 0.5, typography: 'h6' }}>
          <Box component="span" flexGrow={1} sx={{ typography: 'subtitle1' }}>
            {t(option.label)}
          </Box>
          {option.value === 'pickup' ? t('word_free') : `$${option.value}`}
        </Box>
        <Box component="span" display="flex" sx={{ typography: 'body2', color: 'text.secondary' }}>
          {t(option.description)}
        </Box>
      </Box>
    </Box>
  );
}
