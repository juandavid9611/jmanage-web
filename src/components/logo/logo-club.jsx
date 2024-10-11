import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';

import { RouterLink } from 'src/routes/components';

import { logoClasses } from './classes';

// ----------------------------------------------------------------------

export const LogoClub = forwardRef(
  ({ width = 40, height = 40, disableLink = false, className, href = '/', sx, ...other }, ref) => (
    <NoSsr
      fallback={
        <Box
          width={width}
          height={height}
          className={logoClasses.root.concat(className ? ` ${className}` : '')}
          sx={{
            flexShrink: 0,
            display: 'inline-flex',
            verticalAlign: 'middle',
            ...sx,
          }}
        />
      }
    >
      <Box
        ref={ref}
        component={RouterLink}
        href={href}
        width={width + 130}
        height={height + 130}
        className={logoClasses.root.concat(className ? ` ${className}` : '')}
        aria-label="logo"
        sx={{
          flexShrink: 0,
          display: 'inline-flex',
          verticalAlign: 'middle',
          ...(disableLink && { pointerEvents: 'none' }),
          ...sx,
        }}
        {...other}
      >
        <Box
          component="img"
          alt="auth"
          src="/assets/illustrations/illustration_club.png"
          sx={{
            maxWidth: {
              xs: 480,
              lg: 560,
              xl: 720,
            },
          }}
        />
      </Box>
    </NoSsr>
  )
);
