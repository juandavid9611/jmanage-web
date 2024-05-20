import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { fDateTime } from 'src/utils/format-time';

import Carousel, { useCarousel, CarouselArrows } from 'src/components/carousel';

// ----------------------------------------------------------------------

export default function LateArrivesReviews({ title, playersList, ...other }) {
  const carousel = useCarousel({
    adaptiveHeight: true,
  });

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={
          playersList.length > 0
            ? `${playersList.length} jugadores`
            : 'No hay jugadores con llegadas tarde'
        }
        action={<CarouselArrows onNext={carousel.onNext} onPrev={carousel.onPrev} />}
      />

      <Carousel ref={carousel.carouselRef} {...carousel.carouselSettings}>
        {playersList.map((item) => (
          <ReviewItem key={item.id} item={item} />
        ))}
      </Carousel>

      <Divider sx={{ borderStyle: 'dashed' }} />
    </Card>
  );
}

LateArrivesReviews.propTypes = {
  playersList: PropTypes.array,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function ReviewItem({ item }) {
  const { avatarUrl, name, description, rating, postedAt } = item;

  return (
    <Stack
      spacing={2}
      sx={{
        p: 3,
        position: 'relative',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar alt={name} src={avatarUrl} sx={{ width: 48, height: 48 }} />

        <ListItemText
          primary={name}
          secondary={`Posted ${fDateTime(postedAt)}`}
          secondaryTypographyProps={{
            component: 'span',
            typography: 'caption',
            mt: 0.5,
            color: 'text.disabled',
          }}
        />
      </Stack>

      <Rating value={rating} size="small" readOnly precision={0.5} max={3} />

      <Typography variant="body2">{description}</Typography>
    </Stack>
  );
}

ReviewItem.propTypes = {
  item: PropTypes.object,
};
