import { forwardRef } from 'react';

import Box from '@mui/material/Box';
import NoSsr from '@mui/material/NoSsr';

import { RouterLink } from 'src/routes/components';

import { useAuthContext } from 'src/auth/hooks';

import { logoClasses } from './classes';


// ----------------------------------------------------------------------

export const LogoClub = forwardRef(
  ({ width = 100, height = 40, disableLink = false, className, href = '/', sx, ...other }, ref) => {
    const { user } = useAuthContext();

    const activeAccountId = user?.activeAccountId;
    const account = user?.accounts?.[activeAccountId];
    const logoUrl = account?.branding?.logo_url;

    return (
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
          width={width + 70}
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
            src={
              logoUrl ||
              'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg'
            }
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
    );
  }
);
