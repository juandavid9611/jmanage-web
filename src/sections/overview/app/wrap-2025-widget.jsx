import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';

import { fNumber } from 'src/utils/format-number';

import { Iconify } from 'src/components/iconify';

import { Wrap2025Dialog } from './wrap-2025-dialog';

// ----------------------------------------------------------------------

export function Wrap2025Widget({ list, user, ...other }) {
  const theme = useTheme();
  const [openWrap, setOpenWrap] = useState(false);

  const totalMinutes = list.reduce((acc, item) => {
    const titleLower = item.title.toLowerCase();
    if (titleLower.includes('entrena')) {
      return acc + item.current * 120;
    }
    return acc;
  }, 0);

  let message = '';
  if (totalMinutes <= 2280) {
    // 0-25% (El Fantasma range)
    message = '¡Apenas calentando motores! 🐢';
  } else if (totalMinutes <= 4560) {
    // 26-50% (El Cumplidor range)
    message = '¡Estás en racha! 🏃‍♂️💨';
  } else if (totalMinutes <= 6960) {
    // 51-75% (El Abonado range)
    message = '¡Eres una máquina! 🤖';
  } else {
    // 76-100% (El Iron Man range)
    message = '¡Vives en la cancha! 🏟️👑';
  }

  return (
    <>
      <Card {...other}>
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
            color: 'common.white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            gap: 2,
          }}
        >
          <Box>
            <Box sx={{ typography: 'h6', mb: 0.5 }}>¡Tu 2025 en movimiento! 🚀</Box>
            <Box sx={{ typography: 'body2', opacity: 0.8 }}>
              Has acumulado <strong>{fNumber(totalMinutes)}</strong> minutos de puro fútbol este año.
              <br />
              {message}
            </Box>
          </Box>

          <Button
            variant="contained"
            color="warning"
            startIcon={<Iconify icon="mdi:gift-open-outline" />}
            onClick={() => setOpenWrap(true)}
          >
            Ver mi 2025 Wrap
          </Button>
        </Box>
      </Card>

      <Wrap2025Dialog 
        open={openWrap} 
        onClose={() => setOpenWrap(false)} 
        list={list}
        user={user}
      />
    </>
  );
}
