import { useState } from 'react';

import { Box, Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Grid from '@mui/material/Unstable_Grid2';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { orderBy } from 'src/utils/helper';

import { _appFeatured } from 'src/_mock';
import { useTranslate } from 'src/locales';
import { useGetEvents } from 'src/actions/calendar';
import { DashboardContent } from 'src/layouts/dashboard';
import { useWorkspace } from 'src/workspace/workspace-provider';
import { useGetPaymentRequestsByUser } from 'src/actions/paymentRequest';
import {
  useGetUserAssistsStats,
  useGetTopGoalsAndAssists,
} from 'src/actions/user';

import { Walktour, useWalktour } from 'src/components/walktour';
import { WalktourWorkspaceSelector } from 'src/components/walktour/walktour-workspace-selector';

import { useAuthContext } from 'src/auth/hooks';

import { AppWelcome } from '../app-welcome';
import { NextEvents } from '../next-events';
import { AppFeatured } from '../app-featured';
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
  const { selectedWorkspace, changeWorkspaceMembership, allWorkspaces } = useWorkspace();

  const { paymentRequests } = useGetPaymentRequestsByUser(user.id);
  const { stadistics } = useGetUserAssistsStats(selectedWorkspace) || [];
  const { events } = useGetEvents(selectedWorkspace);
  const { topGoalsAndAssists } = useGetTopGoalsAndAssists(selectedWorkspace) || [];

  const pendingOrOverduePaymentRequests = paymentRequests?.filter(
    (request) => request.status === 'pending' || request.status === 'overdue'
  );

  // Check localStorage immediately on component creation
  const [hasSeenTour, setHasSeenTour] = useState(() => {
    const seen = localStorage.getItem('documents-feature-seen');
    return !!seen;
  });

  const [tourHelpers, setTourHelpers] = useState(null);
  const [pendingWorkspace, setPendingWorkspace] = useState(null);

  const handlePendingSelect = (workspace) => {
    setPendingWorkspace(workspace);
  };

  const workspaceChanged = pendingWorkspace && pendingWorkspace.id !== selectedWorkspace?.id;

  const walktourSteps = [
    {
      target: 'body',
      title: '🏟️ Selecciona tu Workspace',
      placement: 'center',
      hideCloseButton: true,
      nextButtonText: workspaceChanged ? 'Guardar' : undefined,
      content: (
        <Stack spacing={1.5}>
          <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
            Selecciona la categoría a la que perteneces. Puedes cambiarlo después desde tu perfil.
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
      title: '🎉 Nueva Característica: Documentos!',
      placement: 'center',
      hideCloseButton: true,
      content: (
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
          ¡Hemos agregado una potente función de Documentos! Ahora puedes ver todos los documentos 
          de tu Club al instante.
        </Box>
      ),
    },
    {
      target: 'body',
      title: 'Encuéntralo en la Barra Lateral 📁',
      placement: 'center',
      content: (
        <Stack spacing={1.5} sx={{ typography: 'body2', color: 'text.secondary' }}>
          <Box>
            Busca <strong>&quot;Documentos&quot;</strong> en la barra lateral izquierda bajo la
            sección de Gestión principal.
          </Box>
          <Box sx={{ fontSize: '0.875rem', opacity: 0.8 }}>
            👈 Está en la barra lateral a la izquierda
          </Box>
        </Stack>
      ),
    },
    {
      target: 'body',
      title: 'Ver y Descargar ⚡',
      placement: 'center',
      content: (
        <Stack spacing={1} sx={{ typography: 'body2', color: 'text.secondary' }}>
          <Box>
            <strong>Ver:</strong> Previsualiza PDFs, imágenes y videos en tu navegador
          </Box>
          <Box>
            <strong>Descargar:</strong> Guarda cualquier archivo directamente en tu dispositivo
          </Box>
        </Stack>
      ),
    },
    {
      target: 'body',
      title: '¿Listo para Explorar? 🚀',
      placement: 'center',
      content: (
        <Box sx={{ typography: 'body2', color: 'text.secondary' }}>
          Haz clic en &quot;Documentos&quot; en la barra lateral para comenzar a gestionar tus archivos. ¡Prueba
          ver un PDF o descargar un archivo!
        </Box>
      ),
    },
  ];

  const walktour = useWalktour({
    defaultRun: !hasSeenTour,
    steps: walktourSteps,
  });

  const handleTourCallback = (data) => {
    const { action, index, lifecycle } = data;

    // When leaving the workspace step (step 0), commit the pending workspace change
    if (index === 0 && action === 'next' && lifecycle === 'complete' && pendingWorkspace) {
      if (pendingWorkspace.id !== selectedWorkspace?.id) {
        changeWorkspaceMembership(pendingWorkspace);
      }
    }
    
    // When tour completes, 'reset' action fires (before 'stop')
    if (action === 'reset') {
      localStorage.setItem('documents-feature-seen', 'true');
      setHasSeenTour(true);
      router.push(paths.dashboard.fileManager);
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
            title="Pagos pendientes o vencidos"
            tableData={pendingOrOverduePaymentRequests}
            headLabel={[
              { id: 'status', label: 'Estado' },
              { id: 'totalAmount', label: 'Monto' },
              { id: 'concept', label: 'Concepto' },
              { id: 'dueDate', label: 'Vencimiento' },
              { id: 'id', label: 'ID Pago' },
            ]}
          />
        </Grid>

        {/* Next events + upload voucher */}
        <Grid xs={12} md={4}>
          <Box sx={{ gap: 3, display: 'flex', flexDirection: 'column' }}>
            <NextEvents title={t('next_events')} list={events} />
            <FileUpgrade userId={user.id} />
          </Box>
        </Grid>

        {/* Featured content + stats */}
        <Grid xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <AppFeatured list={_appFeatured} />

            <Grid container spacing={3}>
              <Grid xs={12} md={6}>
                <CourseWidgetSummary title="Puntos llegadas tarde" list={stadistics} />
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
      </Grid>
    </DashboardContent>
    </>
  );
}
