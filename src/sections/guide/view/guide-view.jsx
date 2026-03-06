import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Unstable_Grid2';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import CardContent from '@mui/material/CardContent';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { Iconify } from 'src/components/iconify';
import { CustomBreadcrumbs } from 'src/components/custom-breadcrumbs';

// ----------------------------------------------------------------------

// Replace these with the actual S3 URLs once the videos are uploaded
const PWA_VIDEO_URL = 'https://jmanage-bucket.s3.us-west-2.amazonaws.com/pwa-guide.mp4';
const NOTIFICATIONS_VIDEO_URL = '';

// ----------------------------------------------------------------------

function StepList({ steps }) {
  return (
    <Stack component="ol" spacing={1} sx={{ pl: 2.5, mt: 0.5, mb: 0 }}>
      {steps.map((step, index) => (
        <Typography key={index} component="li" variant="body2" color="text.secondary">
          {step}
        </Typography>
      ))}
    </Stack>
  );
}

function VideoPlayer({ src, title }) {
  if (!src) {
    return (
      <Box
        sx={{
          width: '100%',
          height: 260,
          bgcolor: 'background.neutral',
          borderRadius: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="body2" color="text.disabled">
          Video proximamente
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      component="video"
      src={src}
      title={title}
      controls
      sx={{ width: '100%', borderRadius: 1.5, display: 'block', maxHeight: 400 }}
    />
  );
}

function GuideCard({ title, description, videoUrl, videoTitle, sections }) {
  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {description}
        </Typography>

        <Grid container spacing={3} alignItems="flex-start">
          <Grid xs={12} md={5}>
            <VideoPlayer src={videoUrl} title={videoTitle} />
          </Grid>

          <Grid xs={12} md={7}>
            <Stack spacing={2.5}>
              {sections.map((section) => (
                <Box key={section.heading}>
                  <Typography variant="subtitle2" gutterBottom>
                    {section.heading}
                  </Typography>
                  <StepList steps={section.steps} />
                </Box>
              ))}
            </Stack>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}

// ----------------------------------------------------------------------

export function GuideView() {
  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <CustomBreadcrumbs heading="Guia de inicio" links={[{ name: 'Guia de inicio' }]} />

        <GuideCard
          title="Instalar como aplicacion"
          description="Puedes instalar SportsManage en tu dispositivo para acceder rapidamente desde la pantalla de inicio, sin necesidad de abrir el navegador."
          videoUrl={PWA_VIDEO_URL}
          videoTitle="Como instalar SportsManage como aplicacion"
          sections={[
            {
              heading: 'Android (Chrome)',
              steps: [
                'Abre SportsManage en Chrome.',
                'Toca el menu de tres puntos (arriba a la derecha).',
                'Selecciona "Agregar a pantalla de inicio".',
                'Confirma tocando "Agregar".',
              ],
            },
            {
              heading: 'iPhone / iPad (Safari)',
              steps: [
                'Abre SportsManage en Safari.',
                'Toca el boton de compartir (cuadrado con flecha hacia arriba).',
                'Desplazate y selecciona "Agregar a inicio".',
                'Toca "Agregar" en la esquina superior derecha.',
              ],
            },
            {
              heading: 'Computadora (Chrome o Edge)',
              steps: [
                'Abre SportsManage en tu navegador.',
                'Haz clic en el icono de instalacion en la barra de direcciones.',
                'Selecciona "Instalar" en el dialogo que aparece.',
              ],
            },
          ]}
        />

        <GuideCard
          title="Activar notificaciones push"
          description="Las notificaciones push te avisan sobre eventos importantes como partidos, pagos y actualizaciones del equipo, incluso cuando no tienes la app abierta."
          videoUrl={NOTIFICATIONS_VIDEO_URL}
          videoTitle="Como activar notificaciones push"
          sections={[
            {
              heading: 'Activar al ingresar por primera vez',
              steps: [
                'Al abrir la app, el navegador mostrara un mensaje solicitando permiso.',
                'Toca o haz clic en "Permitir".',
                'Listo, comenzaras a recibir notificaciones.',
              ],
            },
            {
              heading: 'Si rechazaste el permiso (Android / Computadora)',
              steps: [
                'Haz clic en el candado o la "i" a la izquierda de la direccion web.',
                'Busca "Notificaciones" y cambia el valor a "Permitir".',
                'Recarga la pagina.',
              ],
            },
            {
              heading: 'Si rechazaste el permiso (iPhone / iPad)',
              steps: [
                'Ve a Configuracion del iPhone.',
                'Desplazate hasta Safari y toca "Notificaciones".',
                'Busca SportsManage y activa las notificaciones.',
                'Vuelve a la app y recarga la pagina.',
              ],
            },
          ]}
        />
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              Proximos pasos
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Ya tienes la app instalada y las notificaciones activas. Ahora explora todo lo que
              SportsManage tiene para ofrecerte.
            </Typography>

            <Grid container spacing={2} justifyContent="center">
              <Grid xs={12} sm={6} md={4}>
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Iconify icon="solar:folder-bold" width={22} color="primary.main" />
                    <Typography variant="subtitle2">Documentos</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    Accede a todos los archivos y documentos compartidos por tu club.
                  </Typography>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.fileManager}
                    size="small"
                    variant="outlined"
                    endIcon={<Iconify icon="solar:arrow-right-linear" />}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    Ir a Documentos
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
