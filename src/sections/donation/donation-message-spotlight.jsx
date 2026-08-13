import { useTranslation } from 'react-i18next';
import { useMemo, useState, useEffect } from 'react';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Skeleton from '@mui/material/Skeleton';
import ButtonBase from '@mui/material/ButtonBase';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { varAlpha } from 'src/theme/styles';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const ROTATION_INTERVAL = 6500;

export function DonationMessageSpotlight({ contributions, loading, error }) {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);

  const messages = useMemo(
    () => contributions.filter((contribution) => contribution.message?.trim()).slice(0, 12),
    [contributions]
  );

  useEffect(() => {
    if (activeIndex >= messages.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, messages.length]);

  useEffect(() => {
    if (messages.length < 2 || paused || hovered || prefersReducedMotion) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % messages.length);
    }, ROTATION_INTERVAL);

    return () => window.clearInterval(timer);
  }, [hovered, messages.length, paused, prefersReducedMotion]);

  if (error) {
    return null;
  }

  const activeMessage = messages[activeIndex];
  const showControls = messages.length > 1;

  const goToMessage = (index) => {
    setActiveIndex((index + messages.length) % messages.length);
  };

  return (
    <Box component="section" sx={{ mb: { xs: 8, md: 12 } }}>
      <Stack alignItems="center" sx={{ mb: { xs: 4, md: 5 }, textAlign: 'center' }}>
        <Typography variant="overline" sx={{ color: 'warning.dark' }}>
          {t('donations_messages_eyebrow')}
        </Typography>
        <Typography variant="h3" sx={{ mt: 1 }}>
          {t('donations_messages_title')}
        </Typography>
        <Typography sx={{ mt: 1.5, maxWidth: 620, color: 'text.secondary' }}>
          {t('donations_messages_subtitle')}
        </Typography>
      </Stack>

      <Card
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          maxWidth: 880,
          minHeight: { xs: 330, sm: 300 },
          mx: 'auto',
          p: { xs: 3, sm: 5 },
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          borderRadius: 3,
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: (theme) => varAlpha(theme.vars.palette.warning.lightChannel, 0.09),
          border: (theme) => `1px solid ${varAlpha(theme.vars.palette.warning.mainChannel, 0.18)}`,
          boxShadow: (theme) =>
            `0 24px 64px ${varAlpha(theme.vars.palette.grey['500Channel'], 0.14)}`,
        }}
      >
        <Stack direction="row" sx={{ position: 'absolute', top: 0, left: 0, right: 0 }}>
          <Box sx={{ height: 5, flex: 1, bgcolor: 'warning.main' }} />
          <Box sx={{ height: 5, flex: 1, bgcolor: 'primary.main' }} />
          <Box sx={{ height: 5, flex: 1, bgcolor: 'error.main' }} />
        </Stack>

        <Box
          sx={{
            top: -70,
            right: -50,
            width: 220,
            height: 220,
            opacity: 0.08,
            position: 'absolute',
            borderRadius: '50%',
            bgcolor: 'warning.main',
          }}
        />

        {loading ? (
          <Stack spacing={2} alignItems="center" sx={{ width: 1, maxWidth: 650 }}>
            <Skeleton variant="circular" width={52} height={52} />
            <Skeleton width="90%" height={38} />
            <Skeleton width="70%" height={38} />
            <Skeleton width={150} />
          </Stack>
        ) : activeMessage ? (
          <Box sx={{ width: 1, position: 'relative' }}>
            <AnimatePresence mode="wait" initial={false}>
              <Box
                key={activeMessage.id}
                component={m.div}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -18 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.4, ease: 'easeOut' }}
              >
                <Stack spacing={3} alignItems="center" sx={{ textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      display: 'grid',
                      placeItems: 'center',
                      borderRadius: '50%',
                      color: 'warning.dark',
                      bgcolor: 'warning.lighter',
                    }}
                  >
                    <Iconify icon="solar:quote-up-square-bold-duotone" width={30} />
                  </Box>

                  <Typography
                    component="blockquote"
                    variant="h4"
                    sx={{
                      m: 0,
                      maxWidth: 700,
                      fontSize: { xs: 22, sm: 28 },
                      lineHeight: 1.45,
                      fontWeight: 600,
                      overflowWrap: 'anywhere',
                    }}
                  >
                    “{activeMessage.message.trim()}”
                  </Typography>

                  <Stack direction="row" spacing={1.25} alignItems="center">
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: '50%',
                        color: 'success.dark',
                        bgcolor: 'success.lighter',
                      }}
                    >
                      <Iconify icon="solar:heart-bold" width={19} />
                    </Box>
                    <Box sx={{ textAlign: 'left' }}>
                      <Typography variant="subtitle2" sx={{ overflowWrap: 'anywhere' }}>
                        {activeMessage.donorName || t('donations_anonymous')}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {t('donations_messages_donor_label')}
                      </Typography>
                    </Box>
                  </Stack>
                </Stack>
              </Box>
            </AnimatePresence>

            {showControls && (
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="center"
                sx={{ mt: 4 }}
              >
                <Tooltip title={t('donations_messages_previous')}>
                  <IconButton
                    size="small"
                    onClick={() => goToMessage(activeIndex - 1)}
                    aria-label={t('donations_messages_previous')}
                  >
                    <Iconify icon="eva:arrow-ios-back-fill" />
                  </IconButton>
                </Tooltip>

                <Stack direction="row" spacing={0.75}>
                  {messages.map((message, index) => (
                    <ButtonBase
                      key={message.id}
                      onClick={() => goToMessage(index)}
                      aria-label={t('donations_messages_go_to', { number: index + 1 })}
                      aria-current={index === activeIndex ? 'true' : undefined}
                      sx={{
                        width: index === activeIndex ? 22 : 7,
                        height: 7,
                        borderRadius: 4,
                        bgcolor: index === activeIndex ? 'warning.main' : 'action.disabled',
                        transition: 'width 0.25s ease, background-color 0.25s ease',
                      }}
                    />
                  ))}
                </Stack>

                <Tooltip title={t('donations_messages_next')}>
                  <IconButton
                    size="small"
                    onClick={() => goToMessage(activeIndex + 1)}
                    aria-label={t('donations_messages_next')}
                  >
                    <Iconify icon="eva:arrow-ios-forward-fill" />
                  </IconButton>
                </Tooltip>

                {!prefersReducedMotion && (
                  <Tooltip
                    title={paused ? t('donations_messages_play') : t('donations_messages_pause')}
                  >
                    <IconButton
                      size="small"
                      onClick={() => setPaused((current) => !current)}
                      aria-label={
                        paused ? t('donations_messages_play') : t('donations_messages_pause')
                      }
                    >
                      <Iconify icon={paused ? 'solar:play-bold' : 'solar:pause-bold'} width={18} />
                    </IconButton>
                  </Tooltip>
                )}
              </Stack>
            )}
          </Box>
        ) : (
          <Stack spacing={1.5} alignItems="center" sx={{ textAlign: 'center' }}>
            <Iconify
              icon="solar:chat-heart-bold-duotone"
              width={56}
              sx={{ color: 'warning.main' }}
            />
            <Typography variant="h5">{t('donations_messages_empty_title')}</Typography>
            <Typography sx={{ maxWidth: 500, color: 'text.secondary' }}>
              {t('donations_messages_empty_description')}
            </Typography>
          </Stack>
        )}
      </Card>
    </Box>
  );
}
