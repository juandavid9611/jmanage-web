import { useTranslation } from 'react-i18next';

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
const NOTIFICATIONS_VIDEO_URL =
  'https://jmanage-bucket.s3.us-west-2.amazonaws.com/notifications_guide.mp4';

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
  const { t } = useTranslation();
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
          {t('label_video_coming_soon')}
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
  const { t } = useTranslation();
  return (
    <Container maxWidth="lg">
      <Stack spacing={3}>
        <CustomBreadcrumbs
          heading={t('label_guide_title')}
          links={[{ name: t('label_guide_title') }]}
        />

        <GuideCard
          title={t('label_install_as_app_title')}
          description={t('label_install_as_app_desc')}
          videoUrl={PWA_VIDEO_URL}
          videoTitle={t('label_install_as_app_video_title')}
          sections={[
            {
              heading: t('label_guide_android_chrome'),
              steps: [
                t('label_guide_android_step1'),
                t('label_guide_android_step2'),
                t('label_guide_android_step3'),
                t('label_guide_android_step4'),
              ],
            },
            {
              heading: t('label_guide_iphone_safari'),
              steps: [
                t('label_guide_iphone_step1'),
                t('label_guide_iphone_step2'),
                t('label_guide_iphone_step3'),
                t('label_guide_iphone_step4'),
              ],
            },
            {
              heading: t('label_guide_desktop_chrome_edge'),
              steps: [
                t('label_guide_desktop_step1'),
                t('label_guide_desktop_step2'),
                t('label_guide_desktop_step3'),
              ],
            },
          ]}
        />

        <GuideCard
          title={t('label_push_notifications_title')}
          description={t('label_push_notifications_desc')}
          videoUrl={NOTIFICATIONS_VIDEO_URL}
          videoTitle={t('label_push_notifications_video_title')}
          sections={[
            {
              heading: t('label_guide_first_time_heading'),
              steps: [
                t('label_guide_first_time_step1'),
                t('label_guide_first_time_step2'),
                t('label_guide_first_time_step3'),
              ],
            },
            {
              heading: t('label_guide_rejected_android_heading'),
              steps: [
                t('label_guide_rejected_android_step1'),
                t('label_guide_rejected_android_step2'),
                t('label_guide_rejected_android_step3'),
              ],
            },
            {
              heading: t('label_guide_rejected_iphone_heading'),
              steps: [
                t('label_guide_rejected_iphone_step1'),
                t('label_guide_rejected_iphone_step2'),
                t('label_guide_rejected_iphone_step3'),
                t('label_guide_rejected_iphone_step4'),
              ],
            },
          ]}
        />
        <Card>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="h6" gutterBottom>
              {t('label_next_steps_title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {t('label_next_steps_desc')}
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
                    <Typography variant="subtitle2">{t('nav_documents')}</Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                    {t('label_next_steps_documents_desc')}
                  </Typography>
                  <Button
                    component={RouterLink}
                    href={paths.dashboard.fileManager}
                    size="small"
                    variant="outlined"
                    endIcon={<Iconify icon="solar:arrow-right-linear" />}
                    sx={{ alignSelf: 'flex-start', mt: 1 }}
                  >
                    {t('label_go_to_documents')}
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
