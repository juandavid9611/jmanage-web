import { useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { paths } from 'src/routes/paths';

import { useTabs } from 'src/hooks/use-tabs';
import { useWorkspaceChangeRedirect } from 'src/hooks/use-workspace-change-redirect';

import { DashboardContent } from 'src/layouts/dashboard';
import { TOUR_DETAILS_TABS, TOUR_PUBLISH_OPTIONS } from 'src/_mock';

import { Label } from 'src/components/label';
import { SplashScreen } from 'src/components/loading-screen';

import { useAuthContext } from 'src/auth/hooks';

import { TourDetailsContent } from '../tour-details-content';
import { TourDetailsBookers } from '../tour-details-bookers';
import { TourDetailsToolbar } from '../tour-details-toolbar';

// ----------------------------------------------------------------------

export function TourDetailsView({ tour }) {
  const [publish, setPublish] = useState(tour?.publish);

  const { user } = useAuthContext();
  const isAdmin = user.role === 'admin';

  const tabs = useTabs('content');

  // Redirect to tour list when workspace changes
  const { isRedirecting } = useWorkspaceChangeRedirect(paths.dashboard.admin.tour.root);

  const handleChangePublish = useCallback((newValue) => {
    setPublish(newValue);
  }, []);

  // Show splash screen during redirect (after all hooks are called)
  if (isRedirecting) {
    return <SplashScreen />;
  }

  const renderTabs = (
    <Tabs value={tabs.value} onChange={tabs.onChange} sx={{ mb: { xs: 3, md: 5 } }}>
      {TOUR_DETAILS_TABS.map((tab) => (
        <Tab
          key={tab.value}
          iconPosition="end"
          value={tab.value}
          label={tab.label}
          icon={
            tab.value === 'bookers' ? (
              <Label variant="filled">{Object.keys(tour?.bookers).length}</Label>
            ) : (
              ''
            )
          }
        />
      ))}
    </Tabs>
  );

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
      {renderTabs}

      {tabs.value === 'content' && <TourDetailsContent tour={tour} />}

      {tabs.value === 'bookers' && (
        <TourDetailsBookers tourId={tour?.id} bookers={Object.values(tour?.bookers)} />
      )}
    </DashboardContent>
  );
}
