import { useState, useCallback } from 'react';

import { paths } from 'src/routes/paths';

import { useWorkspaceChangeRedirect } from 'src/hooks/use-workspace-change-redirect';

import { TOUR_PUBLISH_OPTIONS } from 'src/_mock';
import { DashboardContent } from 'src/layouts/dashboard';

import { SplashScreen } from 'src/components/loading-screen';

import { TourDetailsContent } from '../tour-details-content';
import { TourDetailsBookers } from '../tour-details-bookers';
import { TourDetailsToolbar } from '../tour-details-toolbar';

// ----------------------------------------------------------------------

export function TourDetailsView({ tour }) {
  const [publish, setPublish] = useState(tour?.publish);

  const { isRedirecting } = useWorkspaceChangeRedirect(paths.dashboard.admin.tour.root);

  const handleChangePublish = useCallback((newValue) => {
    setPublish(newValue);
  }, []);

  if (isRedirecting) {
    return <SplashScreen />;
  }

  return (
    <DashboardContent>
      <TourDetailsToolbar
        backLink={paths.dashboard.admin.tour.root}
        editLink={paths.dashboard.admin.tour.edit(`${tour?.id}`)}
        liveLink="#"
        publish={publish || ''}
        onChangePublish={handleChangePublish}
        publishOptions={TOUR_PUBLISH_OPTIONS}
      />

      <TourDetailsContent tour={tour} />

      <TourDetailsBookers
        tourId={tour?.id}
        bookers={Object.values(tour?.bookers || {})}
      />
    </DashboardContent>
  );
}
