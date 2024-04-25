import PropTypes from 'prop-types';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { alpha } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { Grid, Button, Container } from '@mui/material';

import { useCountdownDate } from 'src/hooks/use-countdown';

import { _socials } from 'src/_mock';
import { useAuthContext } from 'src/auth/hooks';
import ComingSoonIllustration from 'src/assets/illustrations/coming-soon-illustration';

import Iconify from 'src/components/iconify';
import { useSettingsContext } from 'src/components/settings';

import BankingQuickTransfer from '../overview/app/banking-quick-transfer';

// ----------------------------------------------------------------------

export default function MonthlyPlayerComingSoonView() {
  const settings = useSettingsContext();

  const masc_monthly_players = [
    {
      id: 1,
      name: 'Adrian Villalba',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_1.jpg',
    },
    {
      id: 2,
      name: 'Alejandro Archila',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_2.jpg',
    },
    {
      id: 3,
      name: 'Cristian Medina',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_3.jpg',
    },
    {
      id: 4,
      name: 'Felipe Morales',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_4.jpg',
    },
    {
      id: 5,
      name: 'Julio Mejia',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_5.jpg',
    },
    {
      id: 6,
      name: 'Leonardo Triviño',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_6.jpg',
    },
    {
      id: 7,
      name: 'Abdulh Daza',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_7.jpg',
    },
    {
      id: 8,
      name: 'Jonathan Mindiola',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_8.jpg',
    },
    {
      id: 9,
      name: 'Cristian Lozano',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_9.jpg',
    },
    {
      id: 10,
      name: 'Juan Alarcon',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_10.jpg',
    },
    {
      id: 11,
      name: 'Santiago Motta',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/masc_11.jpg',
    },
  ];

  const fem_monthly_players = [
    {
      id: 1,
      name: 'Estefania Losada',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_1.jpg',
    },
    {
      id: 2,
      name: 'Laura Gomez',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_2.jpg',
    },
    {
      id: 3,
      name: 'Tatiana Montoya',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_3.jpg',
    },
    {
      id: 4,
      name: 'Carolina Gomez',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_4.jpg',
    },
    {
      id: 5,
      name: 'Maria Estrada',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_5.jpg',
    },
    {
      id: 6,
      name: 'Valentina Garcia',
      position: 'Defensa',
      avatarUrl: '/assets/images/avatar/fem_6.jpg',
    },
  ];

  const { days, hours, minutes, seconds } = useCountdownDate(new Date('05/05/2024 21:30'));

  const { user } = useAuthContext();

  const isAdmin = true;
  const isFem = user?.myUser.group === 'female';
  const enableVoting = false;

  return (
    <Container maxWidth={settings.themeStretch ? false : 'xl'}>
      <Stack direction="row" justifyContent="center">
        <Typography variant="h3" sx={{ mb: 2 }}>
          Nuestro jugador y jugadora del mes se acercan a su victoria!
        </Typography>
      </Stack>
      <Stack
        direction="row"
        justifyContent="center"
        divider={<Box sx={{ mx: { xs: 1, sm: 2.5 } }}>:</Box>}
      >
        <Typography sx={{ color: 'text.secondary' }}>
          Reconocemos y valoramos el esfuerzo personal de cada uno de nuestros jugadores y jugadoras
        </Typography>
      </Stack>

      {!enableVoting && <ComingSoonIllustration sx={{ my: 10, height: 240 }} />}

      {enableVoting && (
        <Grid container justifyContent="center" gap={2}>
          <Grid xs={12} md={4}>
            <BankingQuickTransfer
              disabled
              title={
                isFem ? 'Vota por nuestra jugadora del mes!' : 'Vota por nuestro jugador del mes!'
              }
              list={isFem ? fem_monthly_players : masc_monthly_players}
            />
          </Grid>
          {isAdmin && (
            <Grid xs={12} md={4}>
              <BankingQuickTransfer
                title={
                  !isFem
                    ? 'Vota por nuestra jugadora del mes!'
                    : 'Vota por nuestro jugador del mes!'
                }
                list={!isFem ? fem_monthly_players : masc_monthly_players}
              />
            </Grid>
          )}
        </Grid>
      )}

      <Stack
        direction="row"
        justifyContent="center"
        divider={<Box sx={{ mx: { xs: 1, sm: 2.5 } }}>:</Box>}
        sx={{ typography: 'h2' }}
      >
        <TimeBlock label="Days" value={days} />

        <TimeBlock label="Hours" value={hours} />

        <TimeBlock label="Minutes" value={minutes} />

        <TimeBlock label="Seconds" value={seconds} />
      </Stack>

      <Stack spacing={1} alignItems="center" justifyContent="center" direction="row" m={2}>
        <Button disabled variant="contained" size="large">
          Notify Me
        </Button>
      </Stack>

      <Stack spacing={1} alignItems="center" justifyContent="center" direction="row">
        {_socials.map((social) => (
          <IconButton
            key={social.name}
            sx={{
              color: social.color,
              '&:hover': {
                bgcolor: alpha(social.color, 0.08),
              },
            }}
          >
            <Iconify icon={social.icon} />
          </IconButton>
        ))}
      </Stack>
    </Container>
  );
}

// ----------------------------------------------------------------------

function TimeBlock({ label, value }) {
  return (
    <div>
      <Box> {value} </Box>
      <Box sx={{ color: 'text.secondary', typography: 'body1' }}>{label}</Box>
    </div>
  );
}

TimeBlock.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
};
