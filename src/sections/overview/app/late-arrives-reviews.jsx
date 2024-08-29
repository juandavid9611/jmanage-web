import AutoHeight from 'embla-carousel-auto-height';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Rating from '@mui/material/Rating';
import Avatar from '@mui/material/Avatar';
import { Button, Divider } from '@mui/material';
import CardHeader from '@mui/material/CardHeader';
import Typography from '@mui/material/Typography';
import ListItemText from '@mui/material/ListItemText';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { fDateTime } from 'src/utils/format-time';

import { Iconify } from 'src/components/iconify';
import { Carousel, useCarousel, CarouselArrowBasicButtons } from 'src/components/carousel';

// ----------------------------------------------------------------------

export function LateArrivesReviews({ title, list, ...other }) {
  const carousel = useCarousel({ align: 'start' }, [AutoHeight()]);
  const router = useRouter();

  return (
    <Card {...other}>
      <CardHeader
        title={title}
        subheader={
          list.length > 0 ? `${list.length} jugadores` : 'No hay jugadores con llegadas tarde'
        }
        action={<CarouselArrowBasicButtons {...carousel.arrows} />}
      />
      {list.length > 0 && (
        <Carousel carousel={carousel}>
          {list.map((item) => (
            <Item key={item.id} item={item} />
          ))}
        </Carousel>
      )}

      <Divider sx={{ borderStyle: 'dashed' }} />

      <Box sx={{ p: 2, textAlign: 'right' }}>
        <Button
          size="medium"
          color="inherit"
          endIcon={<Iconify icon="eva:arrow-ios-forward-fill" width={18} sx={{ ml: -0.5 }} />}
          onClick={() => router.push(paths.dashboard.analytics.lateArrives)}
        >
          View all
        </Button>
      </Box>
    </Card>
  );
}

function Item({ item, sx, ...other }) {
  return (
    <Box
      sx={{
        p: 3,
        gap: 2,
        display: 'flex',
        position: 'relative',
        flexDirection: 'column',
        ...sx,
      }}
      {...other}
    >
      <Box
        sx={{
          gap: 2,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Avatar alt={item.name} src={item.avatarUrl} sx={{ width: 48, height: 48 }} />

        <ListItemText
          primary={item.name}
          secondary={`Posted ${fDateTime(item.postedAt)}`}
          secondaryTypographyProps={{
            mt: 0.5,
            component: 'span',
            typography: 'caption',
            color: 'text.disabled',
          }}
        />
      </Box>

      <Rating value={item.rating} size="small" readOnly precision={0.5} />

      <Typography variant="body2">{item.description}</Typography>
    </Box>
  );
}
