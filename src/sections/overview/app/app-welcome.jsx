import { useState } from 'react';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { LogoClub } from 'src/components/logo';

// ----------------------------------------------------------------------

export function AppWelcome({ title, description, action, sx, ...other }) {
  const theme = useTheme();
  const [count, setCount] = useState(0);

  return (
    <Box
      sx={{
        ...bgGradient({
          color: `to right, ${varAlpha(
            theme.vars.palette.grey['900Channel'],
            0.88
          )} 0%, ${theme.vars.palette.grey[900]} 75%`,
          imgUrl: `${CONFIG.site.basePath}/assets/background/background-5.webp`,
        }),
        pt: 5,
        pb: 5,
        pr: 3,
        gap: 5,
        borderRadius: 2,
        display: 'flex',
        height: { md: 1 },
        position: 'relative',
        pl: { xs: 3, md: 5 },
        alignItems: 'center',
        color: 'common.white',
        textAlign: { xs: 'center', md: 'left' },
        flexDirection: { xs: 'column', md: 'row' },
        border: `solid 1px ${theme.vars.palette.grey[800]}`,
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          display: 'flex',
          flex: '1 1 auto',
          flexDirection: 'column',
          alignItems: { xs: 'center', md: 'flex-start' },
        }}
      >
        <Typography variant="h4" sx={{ whiteSpace: 'pre-line', mb: 1 }}>
          {title}
        </Typography>

        {action && action}
      </Box>

      <Box sx={{ maxWidth: 260 }} onClick={() => setCount(count + 1)}>
        <LogoClub key={count} />
      </Box>
    </Box>
  );
}
