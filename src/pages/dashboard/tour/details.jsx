import { Helmet } from 'react-helmet-async';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetTour } from 'src/actions/tours';

import { SplashScreen } from 'src/components/loading-screen';

import { TourDetailsView } from 'src/sections/tour/view';

// ----------------------------------------------------------------------

const metadata = { title: `Tour details | Dashboard - ${CONFIG.site.name}` };

export default function Page() {
  const { id = '' } = useParams();

  const { tour, tourLoading } = useGetTour(id);

  return (
    <>
      <Helmet>
        <title> {metadata.title}</title>
      </Helmet>

      {tourLoading ? <SplashScreen /> : <TourDetailsView tour={tour} />}
    </>
  );
}
