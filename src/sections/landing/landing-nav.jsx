import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { varAlpha } from 'src/theme/styles';

import { Logo } from 'src/components/logo';

// ----------------------------------------------------------------------

const NAV_LINKS = [
  { label: 'Torneos', href: '#lifecycle' },
  { label: 'Clubes', href: '#clubs' },
  { label: 'Funciones', href: '#features' },
  { label: 'Resultados', href: '#stats' },
];

// ----------------------------------------------------------------------

/**
 * Shared sticky nav used by the landing page and public tournament pages.
 *
 * @param {string} basePath - Prefix for anchor links. Empty string on the
 *   landing page itself; '/' on other pages so links become '/#lifecycle' etc.
 */
export function LandingNav({ basePath = '' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <Box
      component="header"
      sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        transition: 'all 0.35s ease',
        backdropFilter: scrolled ? 'blur(20px) saturate(1.6)' : 'none',
        bgcolor: scrolled ? (t) => varAlpha(t.vars.palette.background.defaultChannel, 0.88) : 'transparent',
        borderBottom: '1px solid',
        borderColor: scrolled
          ? (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.1)
          : 'transparent',
        boxShadow: scrolled
          ? (t) => `0 1px 24px ${varAlpha(t.vars.palette.common.blackChannel, 0.08)}`
          : 'none',
      }}
    >
      <Container>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: 64 }}>
          <Logo href="/" />

          <Stack direction="row" spacing={3.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.label}
                component="a"
                href={`${basePath}${link.href}`}
                variant="body2"
                sx={{
                  fontWeight: 500, color: 'text.secondary', textDecoration: 'none',
                  transition: 'color 0.2s', '&:hover': { color: 'text.primary' },
                }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              size="small"
              variant="contained"
              color="error"
              href="/tournaments"
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                whiteSpace: 'nowrap',
                boxShadow: (t) => `0 4px 12px ${varAlpha(t.vars.palette.error.mainChannel, 0.3)}`,
              }}
            >
              Torneos en vivo
            </Button>

            <Button
              size="small"
              variant="contained"
              color="primary"
              href="/dashboard"
              sx={{
                borderRadius: 1.5,
                fontWeight: 700,
                px: { xs: 1, sm: 2 },
                fontSize: { xs: '0.7rem', sm: '0.8125rem' },
                whiteSpace: 'nowrap',
                boxShadow: (t) => `0 4px 12px ${varAlpha(t.vars.palette.primary.mainChannel, 0.3)}`,
              }}
            >
              Ir al portal
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
