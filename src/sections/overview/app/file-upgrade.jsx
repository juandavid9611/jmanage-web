import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';

import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

export function FileUpgrade({ userId, sx, ...other }) {
  const theme = useTheme();
  const router = useRouter();

  return (
    <Card
      sx={{
        p: 5,
        display: 'flex',
        alignItems: 'center',
        color: 'common.white',
        background: `radial-gradient(70% 100% at 0% 0%, ${theme.vars.palette.primary.main} 0%, ${theme.vars.palette.common.black} 100%)`,
        ...sx,
      }}
      {...other}
    >
      <Box
        component="img"
        alt="Upgrade Illustration"
        src={`${CONFIG.site.basePath}/assets/illustrations/characters/character-6.webp`}
        sx={{
          right: 50,
          zIndex: 9,
          width: 80,
          position: 'absolute',
        }}
      />

      <SvgColor
        src={`${CONFIG.site.basePath}/assets/background/shape-circle-1.svg`}
        sx={{
          zIndex: 8,
          width: 200,
          right: -32,
          height: 200,
          opacity: 0.12,
          position: 'absolute',
        }}
      />

      <Stack spacing={3} sx={{ alignItems: 'flex-start' }}>
        <Typography variant="h6" sx={{ maxWidth: 160 }}>
          No olvides actualizar tus datos personales
        </Typography>

        <Button
          color="warning"
          variant="contained"
          onClick={() => router.push(paths.dashboard.user.ownEdit(userId))}
        >
          Actualizar perfil
        </Button>
      </Stack>
    </Card>
  );
}
