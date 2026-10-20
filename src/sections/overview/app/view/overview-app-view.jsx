import { useState, useEffect } from 'react';

import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';
import { Box, Stack, Alert, Button } from '@mui/material';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { orderBy } from 'src/utils/helper';

import { useTranslate } from 'src/locales';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';
import {
  markTourSeen,
  useGetTourPreferences,
  useGetUserAssistsStats,
  useGetTopGoalsAndAssists,
} from 'src/actions/user';

import { Iconify } from 'src/components/iconify';
import { Walktour, useWalktour } from 'src/components/walktour';
import { WalktourWorkspaceSelector } from 'src/components/walktour/walktour-workspace-selector';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { NextEvents } from '../next-events';
import { FileUpgrade } from '../file-upgrade';
import { AppTopAuthors } from '../app-top-authors';
import { AppNewInvoice } from '../app-new-invoice';
import { CourseWidgetSummary } from '../course-widget-summary';

// ----------------------------------------------------------------------

export function OverviewAppView() {
  const { t } = useTranslate();
  const theme = useTheme();
  const router = useRouter();

  const { user } = useAuthContext();
  const { selectedWorkspace, selectWorkspace, allWorkspaces } = useWorkspace();

  // Tournament accounts don't have the club league features (calendar, voting,
  // late-arrival points, workspace goals/assists) — mirrors filterClubOnlyNav
  // in src/layouts/dashboard/layout.jsx.
  const accountType = user?.accounts?.[user?.activeAccountId]?.settings?.account_type ?? 'club';
  const isTournamentAccount = accountType === 'tournament';

  const { paymentRequests } = useGetPaymentRequestsByUser(user.id);
  const { stadistics } =
    useGetUserAssistsStats(isTournamentAccount ? null : selectedWorkspace) || [];
  const { events } = useGetEvents(isTournamentAccount ? null : selectedWorkspace);
  const { topGoalsAndAssists } =
    useGetTopGoalsAndAssists(isTournamentAccount ? null : selectedWorkspace) || [];

  const pendingOrOverduePaymentRequests = paymentRequests?.filter(
    (request) => request.status === 'pending' || request.status === 'overdue'
  );

  // Fast-path: same browser already has the flag
  const [hasSeenTour, setHasSeenTour] = useState(
    () => !!localStorage.getItem('documents-feature-seen')
  );

  // Only hit the API when the local flag is absent (new browser / incognito)
  const { tourPreferences, tourPrefsLoading } = useGetTourPreferences(
    !hasSeenTour ? user.id : null
  );

  const [tourHelpers, setTourHelpers] = useState(null);
  const [pendingWorkspace, setPendingWorkspace] = useState(null);

  const handlePendingSelect = (workspace) => {
    setPendingWorkspace(workspace);
  };

  const workspaceChanged = pendingWorkspace && pendingWorkspace.id !== selectedWorkspace?.id;

  const walktourSteps = [
    {
      target: 'body',
      title: `🏟️ ${t('label_walktour_select_workspace_title')}`,
      placement: 'center',
      hideCloseButton: true,
      nextButtonText: workspaceChanged ? t('label_save') : undefined,
      content: (
        <Stack spacing={1.5}>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            {t('label_walktour_select_workspace_body')}
          </Box>
          <WalktourWorkspaceSelector
            workspaces={allWorkspaces}
            selectedWorkspace={selectedWorkspace}
            pendingWorkspace={pendingWorkspace}
            onSelect={handlePendingSelect}
          />
        </Stack>
      ),
    },
    {
      target: 'body',
      title: `🎉 ${t('label_walktour_documents_feature_title')}`,
      placement: 'center',
      hideCloseButton: true,
      content: (
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
          {t('label_walktour_documents_feature_body')}
        </Box>
      ),
    },
    {
      target: 'body',
      title: `${t('label_walktour_find_sidebar_title')} 📁`,
      placement: 'center',
      content: (
        <Stack spacing={1.5} sx={{ typography: 'body2', color: 'text.secondary' }}>
          <Box>
            {t('label_walktour_find_sidebar_body_prefix')}{' '}
            <strong>&quot;{t('nav_documents')}&quot;</strong>{' '}
            {t('label_walktour_find_sidebar_body_suffix')}
          </Box>
          <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
            👈 {t('label_walktour_sidebar_hint')}
          </Box>
        </Stack>
      ),
    },
    {
      target: 'body',
      title: `${t('label_walktour_view_download_title')} ⚡`,
      placement: 'center',
      content: (
        <Stack spacing={1} sx={{ typography: 'body2', color: 'text.secondary' }}>
          <Box>
            <strong>{t('label_view')}:</strong> {t('label_walktour_preview_body')}
          </Box>
          <Box>
            <strong>{t('label_download_colon_prefix')}:</strong> {t('label_walktour_download_body')}
          </Box>
        </Stack>
      ),
    },
    {
      target: 'body',
      title: `¿${t('label_walktour_ready_explore_title')}? 🚀`,
      placement: 'center',
      content: (
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
          {t('label_walktour_click_documents_prefix')} &quot;{t('nav_documents')}&quot;{' '}
          {t('label_walktour_click_documents_suffix')}
        </Box>
      ),
    },
  ];

  const walktour = useWalktour({
    defaultRun: false,
    steps: walktourSteps,
  });

  // Start the tour once the API check resolves (only runs when local flag was absent)
  useEffect(() => {
    if (hasSeenTour) return;
    if (tourPrefsLoading) return;

    if (tourPreferences['documents-feature']) {
      localStorage.setItem('documents-feature-seen', 'true');
      setHasSeenTour(true);
    } else {
      walktour.setRun(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourPrefsLoading]);

  const handleTourCallback = (data) => {
    const { action, index, lifecycle } = data;

    // When leaving the workspace step (step 0), commit the pending workspace change
    if (index === 0 && action === 'next' && lifecycle === 'complete' && pendingWorkspace) {
      if (pendingWorkspace.id !== selectedWorkspace?.id) {
        selectWorkspace(pendingWorkspace);
      }
    }

    // When tour completes, 'reset' action fires (before 'stop')
    if (action === 'reset') {
      localStorage.setItem('documents-feature-seen', 'true');
      setHasSeenTour(true);
      markTourSeen(user.id, 'documents-feature');
      router.push(paths.dashboard.guide);
    }

    walktour.onCallback(data);
  };

  const handleSetHelpers = (helpers) => {
    setTourHelpers(helpers);
    walktour.setHelpers(helpers);
  };

  return (
    <>
      <Walktour
        run={walktour.run}
        steps={walktour.steps}
        callback={handleTourCallback}
        getHelpers={handleSetHelpers}
        scrollToFirstStep
        disableBeacon
        disableOverlayClose
      />
      <DashboardContent maxWidth="xl">
        <Grid container spacing={3}>
          {/* Votaciones Banner */}
          {!isTournamentAccount && (
            <Grid xs={12}>
              <Alert
                severity="primary"
                variant="standard"
                icon={<Iconify icon="mdi:vote" width={24} />}
                action={
                  <Button
                    color="primary"
                    size="small"
                    variant="outlined"
                    onClick={() => router.push(paths.dashboard.votaciones.root)}
                    endIcon={<Iconify icon="eva:arrow-ios-forward-fill" />}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {t('label_vote_now')}
                  </Button>
                }
                sx={{
                  alignItems: 'center',
                  bgcolor: 'primary.lighter',
                  color: 'primary.darker',
                }}
              >
                {t('label_join_active_votes')}
              </Alert>
            </Grid>
          )}

          {/* Welcome / hero */}
          <Grid xs={12} md={6}>
            <AppWelcome
              title={`${t('welcome_back')} ${user?.displayName}`}
              description={t('we_re_vittoria')}
            />
          </Grid>

          {/* Pending / overdue payments */}
          <Grid xs={12} md={6}>
            <AppNewInvoice
              title={t('label_pending_or_overdue_payments')}
              tableData={pendingOrOverduePaymentRequests}
              headLabel={[
                { id: 'status', label: t('label_status') },
                { id: 'totalAmount', label: t('label_amount') },
                { id: 'concept', label: t('label_concept') },
                { id: 'dueDate', label: t('label_due_date') },
                { id: 'id', label: t('label_payment_id') },
              ]}
            />
          </Grid>

          {/* Next events + upload voucher */}
          <Grid xs={12} md={isTournamentAccount ? 6 : 4}>
            <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
              {!isTournamentAccount && <NextEvents title={t('next_events')} list={events} />}
              <FileUpgrade userId={user.id} />
            </Box>
          </Grid>

          {/* Featured content + stats (club league only — tournaments have their own stats page) */}
          {!isTournamentAccount && (
            <Grid xs={12} md={8}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Grid container spacing={3}>
                  <Grid xs={12} md={6}>
                    <CourseWidgetSummary title={t('label_late_arrival_points')} list={stadistics} />
                  </Grid>

                  <Grid xs={12} md={6}>
                    <AppTopAuthors
                      title={`${t('goals_and_assits')} ${selectedWorkspace?.name}`}
                      list={orderBy(topGoalsAndAssists, ['goals'], ['desc']).slice(0, 3)}
                    />
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </DashboardContent>
    </>
  );
}
