import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

import { useParams } from 'src/routes/hooks';

import { CONFIG } from 'src/config-global';
import { useGetTour } from 'src/actions/tours';

import { SplashScreen } from 'src/components/loading-screen';

import { TourDetailsView } from 'src/sections/tour/view';

// ----------------------------------------------------------------------

export default function Page() {
  const { t } = useTranslation();
  const metadata = {
    title: `${t('page_title_tour_details')} | ${t('label_dashboard')} - ${CONFIG.site.name}`,
  };

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
