import PropTypes from 'prop-types';
import { useState, useCallback } from 'react';

import Box from '@mui/material/Box';
import { Card } from '@mui/material';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Dialog from '@mui/material/Dialog';
import Tooltip from '@mui/material/Tooltip';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import CardHeader from '@mui/material/CardHeader';
import DialogTitle from '@mui/material/DialogTitle';
import ListItemText from '@mui/material/ListItemText';
import DialogActions from '@mui/material/DialogActions';

import { useBoolean } from 'src/hooks/use-boolean';

import Carousel, { useCarousel, CarouselArrows } from 'src/components/carousel';

// ----------------------------------------------------------------------

const AVATAR_SIZE = 40;

// ----------------------------------------------------------------------

export default function BankingQuickTransfer({ title, subheader, list, sx, ...other }) {
  const theme = useTheme();

  const carousel = useCarousel({
    centerMode: true,
    swipeToSlide: true,
    focusOnSelect: true,
    centerPadding: '0px',
    slidesToShow: list.length > 5 ? 5 : list.length,
    responsive: [
      {
        // Down 1600
        breakpoint: 1600,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        // Down 1400
        breakpoint: 1400,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        // Down 900
        breakpoint: theme.breakpoints.values.md,
        settings: {
          slidesToShow: 5,
        },
      },
      {
        // Down 400
        breakpoint: 400,
        settings: {
          slidesToShow: 3,
        },
      },
    ],
  });

  const confirm = useBoolean();

  const [message, setMessage] = useState('');

  const getContactInfo = list.find((_, index) => index === carousel.currentIndex);

  const handleOnSubmit = useCallback(() => {
    console.log('Votar por:', getContactInfo);
    console.log('Mensaje:', message);
  }, [getContactInfo, message]);

  const renderCarousel = (
    <Box sx={{ position: 'relative' }}>
      <CarouselArrows
        filled
        onPrev={carousel.onPrev}
        onNext={carousel.onNext}
        leftButtonProps={{
          sx: {
            p: 0.5,
            mt: -1.5,
            left: -8,
            '& svg': { width: 16, height: 16 },
          },
        }}
        rightButtonProps={{
          sx: {
            p: 0.5,
            mt: -1.5,
            right: -8,
            '& svg': { width: 16, height: 16 },
          },
        }}
      >
        <Box
          component={Carousel}
          ref={carousel.carouselRef}
          {...carousel.carouselSettings}
          sx={{
            width: 1,
            mx: 'auto',
            maxWidth: AVATAR_SIZE * 5 + 160,
          }}
        >
          {list.map((contact, index) => (
            <Box key={contact.id} sx={{ py: 5 }}>
              <Tooltip key={contact.id} title={contact.name} arrow placement="top">
                <Avatar
                  src={contact.avatarUrl}
                  sx={{
                    mx: 'auto',
                    opacity: 0.48,
                    cursor: 'pointer',
                    transition: theme.transitions.create('all'),
                    ...(index === carousel.currentIndex && {
                      opacity: 1,
                      transform: 'scale(1.25)',
                      boxShadow: '-4px 12px 24px 0 rgb(0,0,0,0.24)',
                    }),
                  }}
                />
              </Tooltip>
            </Box>
          ))}
        </Box>
      </CarouselArrows>
    </Box>
  );

  const renderInput = (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" sx={{ typography: 'subtitle1' }}>
        <Box component="span" sx={{ flexGrow: 1 }}>
          Tu voto:
        </Box>
        {getContactInfo?.name}
      </Stack>

      <Button size="large" color="inherit" variant="contained" onClick={confirm.onTrue}>
        Votar Ahora
      </Button>
    </Stack>
  );

  return (
    <>
      <Card {...other}>
        <CardHeader title={title} subheader={subheader} />

        <Stack sx={{ p: 3 }}>
          {renderCarousel}

          {renderInput}
        </Stack>
      </Card>

      <ConfirmTransferDialog
        open={confirm.value}
        onClose={confirm.onFalse}
        contactInfo={getContactInfo}
        onSubmit={handleOnSubmit}
        message={message}
        onMessageChange={(e) => setMessage(e.target.value)}
      />
    </>
  );
}

BankingQuickTransfer.propTypes = {
  list: PropTypes.array,
  subheader: PropTypes.string,
  sx: PropTypes.object,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function ConfirmTransferDialog({ open, message, onMessageChange, contactInfo, onClose, onSubmit }) {
  return (
    <Dialog open={open} fullWidth maxWidth="xs" onClose={onClose}>
      <DialogTitle>Votar por:</DialogTitle>

      <Stack spacing={3} sx={{ px: 3 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Avatar src={contactInfo?.avatarUrl} sx={{ width: 48, height: 48 }} />

          <ListItemText
            primary={contactInfo?.name}
            secondary={contactInfo?.position}
            secondaryTypographyProps={{ component: 'span', mt: 0.5 }}
          />
        </Stack>

        <TextField
          fullWidth
          onChange={onMessageChange}
          value={message}
          multiline
          rows={3}
          placeholder="Escribe un mensaje..."
        />
      </Stack>

      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>

        <Button variant="contained" onClick={onSubmit}>
          Confirmar y Votar
        </Button>
      </DialogActions>
    </Dialog>
  );
}

ConfirmTransferDialog.propTypes = {
  contactInfo: PropTypes.object,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  onMessageChange: PropTypes.func,
  open: PropTypes.bool,
  message: PropTypes.string,
};
