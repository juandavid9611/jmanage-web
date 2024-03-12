import PropTypes from 'prop-types';

import Card from '@mui/material/Card';
import Timeline from '@mui/lab/Timeline';
import TimelineDot from '@mui/lab/TimelineDot';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import { Paid, OtherHouses, EmojiEvents, SportsSoccer } from '@mui/icons-material';

import { fDateTime } from 'src/utils/format-time';


// ----------------------------------------------------------------------

export default function AnalyticsOrderTimeline({ title, subheader, list, ...other }) {
  return (
    <Card {...other}>
      <CardHeader title={title} subheader={subheader} />

      <Timeline
        sx={{
          m: 0,
          p: 3,
          [`& .${timelineItemClasses.root}:before`]: {
            flex: 0,
            padding: 0,
          },
        }}
      >
        {list.map((item, index) => (
          <OrderItem key={item.id} item={item} lastTimeline={index === list.length - 1} />
        ))}
      </Timeline>
    </Card>
  );
}

AnalyticsOrderTimeline.propTypes = {
  list: PropTypes.array,
  subheader: PropTypes.string,
  title: PropTypes.string,
};

// ----------------------------------------------------------------------

function OrderItem({ item, lastTimeline }) {
  const { title, start, color, category} = item;
  return (
    <TimelineItem>
      <TimelineSeparator>
        <TimelineDot
          sx={{
            color,
          }}
          variant="outlined"
        >
          {(() => {
            switch (category) {
              case 'training':
                return <SportsSoccer sx={{ width: 20, height: 20 }} />;
              case 'money':
                return <Paid sx={{ width: 20, height: 20 }} />;
              case 'match':
                return <EmojiEvents sx={{ width: 20, height: 20 }} />;
              default:
                return <OtherHouses sx={{ width: 20, height: 20 }} />;
            }
          })()}
        </TimelineDot>
        {lastTimeline ? null : <TimelineConnector />}
      </TimelineSeparator>

      <TimelineContent>
        <Typography variant="subtitle2">{title}</Typography>

        <Typography variant="caption" sx={{ color: 'text.disabled' }}>
          {fDateTime(start)}
        </Typography>
      </TimelineContent>
    </TimelineItem>
  );
}

OrderItem.propTypes = {
  item: PropTypes.object,
  lastTimeline: PropTypes.bool,
};
