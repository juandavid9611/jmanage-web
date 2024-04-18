import { useState } from 'react';
import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';

import { bgGradient } from 'src/theme/css';
import LogoAnimated from 'src/layouts/auth/logo-animated';

// ----------------------------------------------------------------------

export default function AppWelcome({ title, description, action, img, ...other }) {
  const theme = useTheme();
  const [count, setCount] = useState(0);

  return (
    <Stack
      flexDirection={{ xs: 'column', md: 'row' }}
      sx={{
        ...bgGradient({
          direction: '135deg',
          startColor: alpha(theme.palette.primary.light, 0.2),
          endColor: alpha(theme.palette.primary.main, 0.2),
        }),
        height: { md: 1 },
        borderRadius: 2,
        position: 'relative',
        color: 'primary.darker',
        backgroundColor: 'common.white',
      }}
      {...other}
    >
      <Stack
        flexGrow={1}
        justifyContent="center"
        alignItems={{ xs: 'center', md: 'flex-start' }}
        sx={{
          p: {
            xs: theme.spacing(5, 3, 0, 3),
            md: theme.spacing(5),
          },
          textAlign: { xs: 'center', md: 'left' },
        }}
      >
        <Typography variant="h4" sx={{ mb: 2, whiteSpace: 'pre-line' }}>
          {title}
        </Typography>

        <Typography
          variant="body2"
          sx={{
            opacity: 0.8,
            maxWidth: 360,
            mb: { xs: 3, xl: 5 },
          }}
        >
          {description}
        </Typography>

        {action && action}
      </Stack>

      {img && (
        <Stack
          component="span"
          justifyContent="center"
          sx={{
            p: { xs: 5, md: 5 },
            maxWidth: 360,
            mx: 'auto',
          }}
          onClick={() => Notification.requestPermission().then((result) => {
            if (result === "granted") {
              const notifTitle = "Check this out!]";
              const notifBody = `You might like this game!`;
              const options = {
                body: notifBody,
              };
              const a = new Notification(notifTitle, options);
              setTimeout(a, 30000);
              console.log('New notification');
            }
          })}
        >
          <LogoAnimated key={count}/>
        </Stack>
      )}
    </Stack>
  );
}

AppWelcome.propTypes = {
  action: PropTypes.node,
  description: PropTypes.string,
  img: PropTypes.node,
  title: PropTypes.string,
};
