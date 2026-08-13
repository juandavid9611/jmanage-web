import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter, usePathname } from 'src/routes/hooks';

import { varAlpha } from 'src/theme/styles';
import { languages, fallbackLng } from 'src/locales/config-locales';
import { LanguagePopover } from 'src/layouts/components/language-popover';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

const NAV_LINKS = [
  { label: 'tournaments', href: '#lifecycle' },
  { label: 'clubs', href: '#clubs' },
  { label: 'footer_link_features', href: '#features' },
  { label: 'nav_results', href: '#stats' },
  { label: 'nav_donations', href: paths.publicDonations.root, absolute: true },
];

const LANGS = [
  { value: 'es', label: 'Spanish', countryCode: 'CO' },
  { value: 'en', label: 'English', countryCode: 'GB' },
];

// ----------------------------------------------------------------------

/**
 * Shared sticky nav used by the landing page and public tournament pages.
 *
 * @param {string} basePath - Prefix for anchor links. Empty string on the
 *   landing page itself; '/' on other pages so links become '/#lifecycle' etc.
 */
export function LandingNav({ basePath = '' }) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const activeLanguage = languages.includes(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : fallbackLng;
  const donationPath = paths.publicDonations.localized(activeLanguage);
  const isDonationPage = /^\/(en|es)\/donations\/?$/.test(pathname);

  const handleLanguageChange = (newLanguage) => {
    if (isDonationPage) {
      router.replace(`${paths.publicDonations.localized(newLanguage)}${window.location.hash}`);
    }
  };

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        width: '100%',
        maxWidth: '100vw',
        overflow: 'hidden',
        zIndex: 1000,
        transition: 'all 0.35s ease',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.6)' : 'none',
        bgcolor: scrolled
          ? (th) => varAlpha(th.vars.palette.background.defaultChannel, 0.88)
          : 'transparent',
        borderBottom: '1px solid',
        borderColor: scrolled
          ? (th) => varAlpha(th.vars.palette.grey['500Channel'], 0.1)
          : 'transparent',
        boxShadow: scrolled
          ? (th) => `0 1px 24px ${varAlpha(th.vars.palette.common.blackChannel, 0.08)}`
          : 'none',
      }}
    >
      <Container sx={{ width: '100%', minWidth: 0 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ height: 64, minWidth: 0 }}
        >
          <Logo href="/" />

          <Stack direction="row" spacing={3.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.label}
                component="a"
                href={
                  link.label === 'nav_donations'
                    ? donationPath
                    : link.absolute
                      ? link.href
                      : `${basePath}${link.href}`
                }
                variant="body2"
                sx={{
                  fontWeight: 500,
                  color: 'text.secondary',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                  '&:hover': { color: 'text.primary' },
                }}
              >
                {t(link.label)}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <LanguagePopover data={LANGS} onLanguageChange={handleLanguageChange} />

            <Tooltip title={t('nav_donations')}>
              <IconButton
                component="a"
                href={donationPath}
                aria-label={t('nav_donations')}
                sx={{ display: { xs: 'inline-flex', md: 'none' }, color: 'warning.dark' }}
              >
                <Iconify icon="solar:hand-heart-bold-duotone" />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              variant="contained"
              color="error"
              href="/tournaments"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderRadius: 1.5,
                fontWeight: 700,
                px: 2,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                boxShadow: (th) => `0 4px 12px ${varAlpha(th.vars.palette.error.mainChannel, 0.3)}`,
              }}
            >
              {t('nav_live_tournaments')}
            </Button>

            <Button
              size="small"
              variant="contained"
              color="primary"
              href="/dashboard"
              sx={{
                display: { xs: 'none', sm: 'inline-flex' },
                borderRadius: 1.5,
                fontWeight: 700,
                px: 2,
                fontSize: '0.8125rem',
                whiteSpace: 'nowrap',
                boxShadow: (th) =>
                  `0 4px 12px ${varAlpha(th.vars.palette.primary.mainChannel, 0.3)}`,
              }}
            >
              {t('nav_go_to_portal')}
            </Button>

            <Tooltip title={t('nav_go_to_portal')}>
              <IconButton
                component="a"
                href="/dashboard"
                color="primary"
                aria-label={t('nav_go_to_portal')}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <Iconify icon="solar:login-3-bold-duotone" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
