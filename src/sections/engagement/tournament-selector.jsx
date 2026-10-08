import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

// items: [{ id, name, category }]. xs/sm: horizontally scrollable chips above
// the detail; md+: vertical list of cards for the left column.
export function TournamentSelector({ items, value, onChange }) {
  return (
    <>
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          gap: 1,
          overflowX: 'auto',
          pb: 1,
          mx: { xs: -2, sm: -3 },
          px: { xs: 2, sm: 3 },
          scrollbarWidth: 'thin',
        }}
      >
        {items.map((t) => {
          const selected = t.id === value;
          return (
            <Chip
              key={t.id}
              clickable
              onClick={() => onChange(t.id)}
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              icon={<Iconify icon="solar:medal-star-bold" width={16} />}
              label={t.category ? `${t.name} · ${t.category}` : t.name}
              sx={{ flexShrink: 0 }}
            />
          );
        })}
      </Box>

      <Stack spacing={1} sx={{ display: { xs: 'none', md: 'flex' } }}>
        {items.map((t) => {
          const selected = t.id === value;
          return (
            <Card
              key={t.id}
              onClick={() => onChange(t.id)}
              sx={{
                p: 2,
                cursor: 'pointer',
                boxShadow: 'none',
                transition: (th) => th.transitions.create(['border-color', 'background-color']),
                border: (th) =>
                  `1px solid ${selected ? th.palette.primary.main : alpha(th.palette.grey[500], 0.16)}`,
                bgcolor: selected ? (th) => alpha(th.palette.primary.main, 0.06) : 'transparent',
                '&:hover': { bgcolor: (th) => alpha(th.palette.grey[500], selected ? 0.08 : 0.06) },
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Iconify
                  icon="solar:medal-star-bold"
                  width={20}
                  sx={{ flexShrink: 0, color: selected ? 'primary.main' : 'text.disabled' }}
                />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="subtitle2" noWrap>
                    {t.name}
                  </Typography>
                  <Typography variant="caption" noWrap sx={{ color: 'text.secondary', display: 'block' }}>
                    {t.category || 'Sin categoría'}
                  </Typography>
                </Box>
              </Stack>
            </Card>
          );
        })}
      </Stack>
    </>
  );
}
