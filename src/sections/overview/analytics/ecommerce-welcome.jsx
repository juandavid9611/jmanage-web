import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { _mock } from 'src/_mock';
import { CONFIG } from 'src/config-global';
import { varAlpha, bgGradient } from 'src/theme/styles';

import { AnimateAvatar } from 'src/components/animate';

import { useAuthContext } from 'src/auth/hooks';

// ----------------------------------------------------------------------

export function EcommerceWelcome({
  title,
  description,
  action,
  img,
  sx,
  isGoal,
  imgIndex,
  ...other
}) {
  const theme = useTheme();
  const { user } = useAuthContext();

  return (
    <Box
      sx={{
        ...bgGradient({
          color: `to right, ${theme.vars.palette.grey[900]} 25%, ${varAlpha(
            theme.vars.palette.primary.darkerChannel,
            0.88
          )}`,
          imgUrl: `${CONFIG.site.basePath}/assets/background/background-6.webp`,
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

      <AnimateAvatar
        width={96}
        slotProps={{
          avatar: {
            src: _mock.image.avatar(imgIndex),
          },
          overlay: {
            border: 2,
            spacing: 3,
            color: `linear-gradient(135deg, ${varAlpha(theme.vars.palette.primary.mainChannel, 0)} 25%, ${theme.vars.palette.primary.main} 100%)`,
          },
        }}
      >
        {user?.displayName?.charAt(0).toUpperCase()}
      </AnimateAvatar>
    </Box>
  );
}
