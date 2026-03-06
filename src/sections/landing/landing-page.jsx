import { useRef, useState, useEffect, useCallback } from 'react';
import {
  m,
  useSpring,
  useTransform,
  useMotionValue,
  AnimatePresence,
} from 'framer-motion';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Unstable_Grid2';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { varAlpha, textGradient } from 'src/theme/styles';

import { Logo } from 'src/components/logo';
import { Iconify } from 'src/components/iconify';
import { BackToTop } from 'src/components/animate/back-to-top';
import { AnimateCountUp } from 'src/components/animate/animate-count-up';
import { varFade, MotionViewport, MotionContainer } from 'src/components/animate';
import { ScrollProgress, useScrollProgress } from 'src/components/animate/scroll-progress';

// ─── DATA ───────────────────────────────────────────────────────────

const TOURNAMENT_FEATURES = [
  {
    icon: 'solar:cup-star-bold-duotone',
    title: 'Constructor de Torneos',
    desc: 'Crea formatos de liga, eliminación directa o híbridos en segundos. Generación automática de fixtures y siembra.',
    color: 'primary',
  },
  {
    icon: 'solar:chart-bold-duotone',
    title: 'Resultados en Vivo',
    desc: 'Actualizaciones de resultados en tiempo real visibles para todos. Notificaciones push tras cada gol.',
    color: 'info',
  },
  {
    icon: 'solar:ranking-bold-duotone',
    title: 'Fase de Grupos',
    desc: 'Tablas de posiciones dinámicas con desempates configurables, puntos y diferencia de goles calculados automáticamente.',
    color: 'warning',
  },
  {
    icon: 'solar:graph-new-bold-duotone',
    title: 'Estadísticas de Jugadores',
    desc: 'Goles, asistencias, tarjetas, valoraciones — todo se rastrea automáticamente. Tablas de líderes actualizadas tras cada partido.',
    color: 'error',
  },
  {
    icon: 'solar:calendar-bold-duotone',
    title: 'Programación Inteligente',
    desc: 'Programación de partidos sin conflictos. Reprograma jornadas con un clic y notifica a todos al instante.',
    color: 'success',
  },
  {
    icon: 'solar:route-bold-duotone',
    title: 'Llaves y Finales',
    desc: 'Visualización de llaves con siembra automática desde grupos. Un clic para coronar al campeón.',
    color: 'secondary',
  },
];

const CLUB_FEATURES = [
  {
    icon: 'solar:card-bold-duotone',
    title: 'Pagos y Cuotas',
    desc: 'Cobra cuotas mensuales, registra abonos y lleva el control financiero de cada miembro desde un solo panel.',
    color: 'success',
  },
  {
    icon: 'solar:calendar-bold-duotone',
    title: 'Calendario de Eventos',
    desc: 'Programa entrenamientos, partidos y reuniones. Notificaciones automáticas para que nadie se pierda nada.',
    color: 'info',
  },
  {
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Control de Asistencias',
    desc: 'Registra la asistencia a cada sesión. Consulta el historial por jugador y detecta patrones de ausencia.',
    color: 'warning',
  },
  {
    icon: 'solar:bag-bold-duotone',
    title: 'Tienda del Club',
    desc: 'Vende uniformes, equipamiento y merchandising directamente desde la plataforma. Gestión de stock incluida.',
    color: 'primary',
  },
  {
    icon: 'solar:file-text-bold-duotone',
    title: 'Documentos',
    desc: 'Centraliza contratos, fichas médicas y licencias. Control de versiones y acceso por roles para tu staff.',
    color: 'error',
  },
  {
    icon: 'solar:football-bold-duotone',
    title: 'Gestión de Partidos',
    desc: 'Convocatorias, alineaciones, resultados y estadísticas. Todo el seguimiento del rendimiento del equipo.',
    color: 'secondary',
  },
];

const FEAT_TABS = [
  { key: 'tournaments', label: 'Torneos', icon: 'solar:cup-star-bold-duotone', color: 'primary' },
  { key: 'clubs', label: 'Clubes', icon: 'solar:shield-bold-duotone', color: 'info' },
];

const STATS = [
  { value: 2, suffix: '+', label: 'Paises alcanzados', icon: 'solar:cup-star-bold-duotone', color: 'primary' },
  { value: 400, suffix: '+', label: 'Jugadores Activos', icon: 'solar:users-group-rounded-bold-duotone', color: 'info' },
  { value: 4, suffix: '+', label: 'Clubes Registrados', icon: 'solar:shield-bold-duotone', color: 'warning' },
  { value: 98, suffix: '%', label: 'Satisfacción del Usuario', icon: 'solar:star-bold-duotone', color: 'success' },
  { value: 120, suffix: '+', label: 'Partidos Jugados', icon: 'solar:football-bold-duotone', color: 'error' },
];

const TESTIMONIALS = [
  {
    quote: 'SportsManagement transformó la forma en que gestionamos nuestra liga. Lo que antes tomaba horas, ahora lo hacemos en minutos.',
    author: 'Carlos Mendoza',
    role: 'Director · Liga Bogotá FC',
    avatar: 'CM',
    color: 'primary',
  },
  {
    quote: 'El control de asistencias y los pagos en un solo lugar es increíble. Nuestros jugadores también aman la plataforma.',
    author: 'Luis García',
    role: 'Administrador · Club Deportivo Vittoria',
    avatar: 'LG',
    color: 'info',
  },
  {
    quote: 'Generamos el fixture de 32 equipos en segundos. La fase de grupos y las llaves funcionan perfectamente.',
    author: 'Pedro Torres',
    role: 'Organizador · Copa Regional 2025',
    avatar: 'PT',
    color: 'success',
  },
];

const NAV_LINKS = [
  { label: 'Torneos', href: '#lifecycle' },
  { label: 'Clubes', href: '#clubs' },
  { label: 'Funciones', href: '#features' },
  { label: 'Resultados', href: '#stats' },
];

const LIFECYCLE_STEPS = [
  {
    key: 'configure',
    icon: 'solar:settings-bold-duotone',
    title: 'Configurar Torneo',
    desc: 'Elige el formato, establece reglas de puntuación y define desempates. Tu torneo, tus reglas.',
    color: 'primary',
  },
  {
    key: 'teams',
    icon: 'solar:shield-bold-duotone',
    title: 'Registrar Equipos',
    desc: 'Invita equipos, gestiona plantillas y rastrea el progreso del registro hasta completar la escuadra.',
    color: 'info',
  },
  {
    key: 'groups',
    icon: 'solar:ranking-bold-duotone',
    title: 'Fase de Grupos',
    desc: 'Fixtures autogenerados, tablas en vivo y cronogramas de jornadas. Posiciones actualizadas en tiempo real.',
    color: 'warning',
  },
  {
    key: 'knockout',
    icon: 'solar:cup-star-bold-duotone',
    title: 'Eliminatorias y Finales',
    desc: 'Visualización de llaves con siembra automática desde grupos. Un clic para coronar al campeón.',
    color: 'success',
  },
];

const CLUB_STEPS = [
  {
    key: 'payments',
    icon: 'solar:card-bold-duotone',
    title: 'Pagos y Cuotas',
    desc: 'Gestiona cuotas, cobra pagos online y lleva el control financiero de cada miembro.',
    color: 'success',
  },
  {
    key: 'calendar',
    icon: 'solar:calendar-bold-duotone',
    title: 'Calendario de Eventos',
    desc: 'Programa entrenamientos, partidos y eventos. Todos al tanto con notificaciones automáticas.',
    color: 'info',
  },
  {
    key: 'assists',
    icon: 'solar:users-group-rounded-bold-duotone',
    title: 'Control de Asistencias',
    desc: 'Registra la asistencia a entrenamientos y partidos. Estadísticas por jugador en tiempo real.',
    color: 'warning',
  },
  {
    key: 'shop',
    icon: 'solar:bag-bold-duotone',
    title: 'Tienda del Club',
    desc: 'Vende uniformes, equipamiento y merchandising directamente desde la plataforma.',
    color: 'primary',
  },
  {
    key: 'documents',
    icon: 'solar:file-text-bold-duotone',
    title: 'Documentos',
    desc: 'Centraliza contratos, fichas médicas y documentos del club con acceso controlado.',
    color: 'error',
  },
  {
    key: 'matches',
    icon: 'solar:football-bold-duotone',
    title: 'Gestión de Partidos',
    desc: 'Convocatorias, resultados y estadísticas por partido para hacer seguimiento del rendimiento.',
    color: 'secondary',
  },
];

// ─── HERO DASHBOARD DATA ─────────────────────────────────────────────

const HERO_STANDINGS = [
  { pos: 1, name: 'SportsManagement FC', pts: 9, q: 'primary' },
  { pos: 2, name: 'Águilas FC', pts: 6, q: 'info' },
  { pos: 3, name: 'Rayo Azul', pts: 3, q: null },
  { pos: 4, name: 'Inter Club', pts: 0, q: null },
];

const HERO_SCORERS = [
  { name: 'T. Müller', goals: 5, avatar: 'TM', color: 'warning' },
  { name: 'R. Gómez', goals: 3, avatar: 'RG', color: 'primary' },
  { name: 'A. Silva', goals: 2, avatar: 'AS', color: 'info' },
];

const HERO_CLUB_PAYMENTS = [
  { name: 'Carlos Mendoza', avatar: 'CM', paid: true },
  { name: 'Luis García', avatar: 'LG', paid: true },
  { name: 'Ana Ruiz', avatar: 'AR', paid: true },
  { name: 'Pedro Torres', avatar: 'PT', paid: false },
];

const HERO_CLUB_EVENTS = [
  { day: 'Hoy', time: '18:00', label: 'Entrenamiento', color: 'info', icon: 'solar:running-round-bold-duotone' },
  { day: 'Mié', time: '20:00', label: 'Partido vs Tigres', color: 'warning', icon: 'solar:football-bold-duotone' },
  { day: 'Sáb', time: '10:00', label: 'Reunión Directiva', color: 'primary', icon: 'solar:users-group-rounded-bold-duotone' },
];

const HERO_ATT_BARS = [72, 68, 80, 75, 83, 87];
const HERO_ATT_LABELS = ['Oct', 'Nov', 'Dic', 'Ene', 'Feb', 'Mar'];

// ─── HERO DASHBOARD COMPONENTS ───────────────────────────────────────

function HeroDashboardTournament() {
  const [liveScore, setLiveScore] = useState({ h: 2, a: 1 });
  const [goalFlash, setGoalFlash] = useState(false);
  const [minute, setMinute] = useState(67);

  useEffect(() => {
    const minInterval = setInterval(() => setMinute((prev) => Math.min(prev + 1, 90)), 1500);
    const goalTimeout = setTimeout(() => {
      setGoalFlash(true);
      setTimeout(() => {
        setLiveScore({ h: 3, a: 1 });
        setGoalFlash(false);
      }, 900);
    }, 3500);
    return () => {
      clearInterval(minInterval);
      clearTimeout(goalTimeout);
    };
  }, []);

  return (
    <>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Copa Verano 2026</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.63rem' }}>16 equipos · Fase de grupos</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75}>
            <Chip label="Jornada 3" size="small" color="primary" variant="soft" sx={{ height: 20, fontSize: '0.6rem' }} />
            <Chip label="Activo" size="small" color="success" variant="soft" sx={{ height: 20, fontSize: '0.6rem' }} />
          </Stack>
        </Stack>
      </Box>

      {/* Stats strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
        {[
          { label: 'Equipos', value: '16', icon: 'solar:shield-bold-duotone', color: 'primary' },
          { label: 'Partidos', value: '48', icon: 'solar:football-bold-duotone', color: 'info' },
          { label: 'Goles', value: '127', icon: 'solar:cup-star-bold-duotone', color: 'warning' },
          { label: 'Jugadores', value: '224', icon: 'solar:users-group-rounded-bold-duotone', color: 'success' },
        ].map((s, i) => (
          <Box key={s.label} sx={{ p: 1.25, borderRight: i < 3 ? '1px solid' : 'none', borderColor: 'divider', textAlign: 'center' }}>
            <Iconify icon={s.icon} width={16} sx={{ color: `${s.color}.main`, mb: 0.25 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.52rem' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Two-column: standings + scorers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid', borderColor: 'divider' }}>
        {/* Standings */}
        <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
            Posiciones
          </Typography>
          <Stack spacing={0.5}>
            {HERO_STANDINGS.map((team) => (
              <Box key={team.pos} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 16, height: 16, borderRadius: 0.5, bgcolor: (th) => team.q ? varAlpha(th.vars.palette[team.q].mainChannel, 0.15) : varAlpha(th.vars.palette.grey['500Channel'], 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Typography sx={{ fontSize: '0.48rem', fontWeight: 800, color: team.q ? `${team.q}.main` : 'text.disabled' }}>{team.pos}</Typography>
                </Box>
                <Typography variant="caption" sx={{ flex: 1, fontSize: '0.6rem', fontWeight: team.pos === 1 ? 700 : 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</Typography>
                <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, color: team.q ? `${team.q}.main` : 'text.primary', fontFamily: 'monospace' }}>{team.pts}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Top scorers */}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
            Goleadores
          </Typography>
          <Stack spacing={0.75}>
            {HERO_SCORERS.map((player) => (
              <Box key={player.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: (th) => varAlpha(th.vars.palette[player.color].mainChannel, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.44rem', fontWeight: 800, color: `${player.color}.dark`, flexShrink: 0 }}>
                  {player.avatar}
                </Box>
                <Typography variant="caption" sx={{ flex: 1, fontSize: '0.6rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{player.name}</Typography>
                <Stack direction="row" alignItems="center" spacing={0.25}>
                  <Iconify icon="solar:football-bold-duotone" width={10} sx={{ color: 'text.disabled' }} />
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, fontFamily: 'monospace' }}>{player.goals}</Typography>
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Live match */}
      <Box sx={{ p: 1.5, position: 'relative', overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mb: 1 }}>
          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'error.main', animation: 'pulse2 1s ease-in-out infinite', '@keyframes pulse2': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
          <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main', fontSize: '0.6rem' }}>EN VIVO</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.58rem' }}>min {minute}&apos;</Typography>
        </Stack>

        {/* Goal flash overlay */}
        <AnimatePresence>
          {goalFlash && (
            <Box
              component={m.div}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              sx={{ position: 'absolute', inset: 0, borderRadius: 1, bgcolor: (th) => varAlpha(th.vars.palette.warning.mainChannel, 0.18), display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 }}
            >
              <Typography sx={{ fontWeight: 900, fontSize: '0.75rem', color: 'warning.dark', textTransform: 'uppercase', letterSpacing: 1 }}>Gol!</Typography>
            </Box>
          )}
        </AnimatePresence>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 1, px: 1, py: 0.75, borderRadius: 1.5, bgcolor: (th) => varAlpha(th.vars.palette.error.mainChannel, 0.05), border: '1px solid', borderColor: (th) => varAlpha(th.vars.palette.error.mainChannel, 0.1) }}>
          <Stack alignItems="flex-end" spacing={0.25}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.63rem' }} noWrap>SportsManagement FC</Typography>
            <Chip label="Local" size="small" sx={{ height: 14, fontSize: '0.46rem', bgcolor: (th) => varAlpha(th.vars.palette.primary.mainChannel, 0.1), color: 'primary.main' }} />
          </Stack>

          <Stack alignItems="center" spacing={0.25}>
            <Stack direction="row" alignItems="center" spacing={0.5}>
              <AnimatePresence mode="popLayout">
                <Box
                  component={m.span}
                  key={liveScore.h}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.1rem', color: 'success.main', lineHeight: 1 }}
                >
                  {liveScore.h}
                </Box>
              </AnimatePresence>
              <Typography sx={{ fontWeight: 800, opacity: 0.3, fontSize: '0.9rem' }}>-</Typography>
              <AnimatePresence mode="popLayout">
                <Box
                  component={m.span}
                  key={`a${liveScore.a}`}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 12, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  sx={{ fontWeight: 900, fontFamily: 'monospace', fontSize: '1.1rem', color: 'text.secondary', lineHeight: 1 }}
                >
                  {liveScore.a}
                </Box>
              </AnimatePresence>
            </Stack>
            <Typography variant="caption" sx={{ color: 'error.main', fontSize: '0.5rem', fontWeight: 700 }}>EN VIVO</Typography>
          </Stack>

          <Stack alignItems="flex-start" spacing={0.25}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.63rem' }} noWrap>Águilas FC</Typography>
            <Chip label="Visitante" size="small" sx={{ height: 14, fontSize: '0.46rem', bgcolor: (th) => varAlpha(th.vars.palette.grey['500Channel'], 0.08), color: 'text.secondary' }} />
          </Stack>
        </Box>
      </Box>
    </>
  );
}

function HeroDashboardClub() {
  const [barsReady, setBarsReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 300);
    return () => clearTimeout(t);
  }, []);

  const paidCount = HERO_CLUB_PAYMENTS.filter((p) => p.paid).length;
  const paidPct = Math.round((paidCount / HERO_CLUB_PAYMENTS.length) * 100);

  return (
    <>
      {/* Header */}
      <Box sx={{ px: 2.5, pt: 2, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Club Los Tigres</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.63rem' }}>Temporada 2026 · 24 miembros</Typography>
          </Stack>
          <Stack direction="row" spacing={0.75}>
            <Chip label="Abr 2026" size="small" color="info" variant="soft" sx={{ height: 20, fontSize: '0.6rem' }} />
            <Chip label="Activo" size="small" color="success" variant="soft" sx={{ height: 20, fontSize: '0.6rem' }} />
          </Stack>
        </Stack>
      </Box>

      {/* Stats strip */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: '1px solid', borderColor: 'divider' }}>
        {[
          { label: 'Miembros', value: '24', icon: 'solar:users-group-rounded-bold-duotone', color: 'info' },
          { label: 'Cuotas OK', value: '20', icon: 'solar:card-bold-duotone', color: 'success' },
          { label: 'Asistencia', value: '87%', icon: 'solar:chart-bold-duotone', color: 'warning' },
          { label: 'Partidos', value: '8', icon: 'solar:football-bold-duotone', color: 'primary' },
        ].map((s, i) => (
          <Box key={s.label} sx={{ p: 1.25, borderRight: i < 3 ? '1px solid' : 'none', borderColor: 'divider', textAlign: 'center' }}>
            <Iconify icon={s.icon} width={16} sx={{ color: `${s.color}.main`, mb: 0.25 }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: '0.8rem' }}>{s.value}</Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.52rem' }}>{s.label}</Typography>
          </Box>
        ))}
      </Box>

      {/* Two-column: payments + events */}
      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid', borderColor: 'divider' }}>
        {/* Payments */}
        <Box sx={{ p: 1.5, borderRight: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase' }}>Cuotas</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', color: 'success.main' }}>{paidCount}/{HERO_CLUB_PAYMENTS.length}</Typography>
          </Stack>
          {/* Progress bar */}
          <Box sx={{ height: 5, borderRadius: 99, bgcolor: (th) => varAlpha(th.vars.palette.success.mainChannel, 0.12), mb: 1.25, overflow: 'hidden' }}>
            <Box
              component={m.div}
              initial={{ width: 0 }}
              animate={{ width: `${paidPct}%` }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
              sx={{ height: '100%', borderRadius: 99, bgcolor: 'success.main' }}
            />
          </Box>
          <Stack spacing={0.5}>
            {HERO_CLUB_PAYMENTS.map((p) => (
              <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: (th) => varAlpha(th.vars.palette[p.paid ? 'success' : 'warning'].mainChannel, 0.15), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.42rem', fontWeight: 800, color: p.paid ? 'success.main' : 'warning.dark', flexShrink: 0 }}>
                  {p.avatar}
                </Box>
                <Typography variant="caption" sx={{ flex: 1, fontSize: '0.58rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</Typography>
                <Iconify icon={p.paid ? 'solar:check-circle-bold' : 'solar:clock-circle-bold'} width={11} sx={{ color: p.paid ? 'success.main' : 'warning.main', flexShrink: 0 }} />
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Upcoming events */}
        <Box sx={{ p: 1.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase', display: 'block', mb: 0.75 }}>
            Próximos
          </Typography>
          <Stack spacing={0.75}>
            {HERO_CLUB_EVENTS.map((ev) => (
              <Box key={ev.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.75, pl: 0.75, borderLeft: '2px solid', borderColor: `${ev.color}.main` }}>
                <Stack sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.label}</Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.52rem' }}>{ev.day} · {ev.time}</Typography>
                </Stack>
                <Iconify icon={ev.icon} width={13} sx={{ color: `${ev.color}.main`, flexShrink: 0 }} />
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      {/* Attendance sparkline */}
      <Box sx={{ px: 1.5, pt: 1.25, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.58rem', color: 'text.disabled', textTransform: 'uppercase' }}>Asistencia mensual</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.6rem', color: 'warning.main' }}>87% promedio</Typography>
        </Stack>
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 0.5, height: 36 }}>
          {HERO_ATT_BARS.map((val, idx) => (
            <Box key={HERO_ATT_LABELS[idx]} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.25, height: '100%', justifyContent: 'flex-end' }}>
              <Box
                component={m.div}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: barsReady ? 1 : 0 }}
                transition={{ duration: 0.55, delay: idx * 0.08, ease: 'easeOut' }}
                sx={{
                  width: '100%',
                  height: `${val}%`,
                  transformOrigin: 'bottom',
                  borderRadius: '2px 2px 0 0',
                  bgcolor: idx === HERO_ATT_BARS.length - 1 ? 'warning.main' : (th) => varAlpha(th.vars.palette.warning.mainChannel, 0.35),
                }}
              />
              <Typography sx={{ fontSize: '0.42rem', color: 'text.disabled', lineHeight: 1 }}>{HERO_ATT_LABELS[idx]}</Typography>
            </Box>
          ))}
        </Box>
      </Box>
    </>
  );
}

// ─── STICKY NAV ─────────────────────────────────────────────────────

function StickyNav() {
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
          <Logo />

          <Stack direction="row" spacing={3.5} sx={{ display: { xs: 'none', md: 'flex' } }}>
            {NAV_LINKS.map((link) => (
              <Typography
                key={link.label}
                component="a"
                href={link.href}
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

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              size="small"
              variant="contained"
              color="primary"
              href="/dashboard"
              sx={{
                borderRadius: 1.5, fontWeight: 700, px: 2,
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

// ─── FLOATING CARD (3D TILT) ────────────────────────────────────────

function FloatingCard({ src, altText, sx }) {
  const ref = useRef(null);
  const xVal = useMotionValue(0);
  const yVal = useMotionValue(0);

  const rotateX = useSpring(useTransform(yVal, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 30 });
  const rotateY = useSpring(useTransform(xVal, [-0.5, 0.5], [-8, 8]), { stiffness: 200, damping: 30 });

  const handleMouse = useCallback(
    (e) => {
      const rect = ref.current?.getBoundingClientRect();
      if (!rect) return;
      xVal.set((e.clientX - rect.left) / rect.width - 0.5);
      yVal.set((e.clientY - rect.top) / rect.height - 0.5);
    },
    [xVal, yVal]
  );

  const handleLeave = useCallback(() => {
    xVal.set(0);
    yVal.set(0);
  }, [xVal, yVal]);

  return (
    <Box
      ref={ref}
      component={m.div}
      onMouseMove={handleMouse}
      onMouseLeave={handleLeave}
      initial={{ opacity: 0, y: 60, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
      style={{ perspective: 800, rotateX, rotateY }}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        cursor: 'grab',
        willChange: 'transform',
        boxShadow: (theme) =>
          `0 24px 48px ${varAlpha(theme.vars.palette.common.blackChannel, 0.24)}`,
        border: (theme) =>
          `1px solid ${varAlpha(theme.vars.palette.grey['500Channel'], 0.12)}`,
        ...sx,
      }}
    >
      <Box component="img" src={src} alt={altText} sx={{ display: 'block', width: 1 }} />
    </Box>
  );
}

// ─── TOURNAMENT LIFECYCLE STEP PREVIEW CARDS ────────────────────────

function ConfigPreview({ theme }) {
  const [activeStep, setActiveStep] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [teamCount, setTeamCount] = useState(0);
  const [groupCount, setGroupCount] = useState(0);
  const [tieBreakers, setTieBreakers] = useState([
    { id: 'dg', label: 'Diferencia goles' },
    { id: 'gf', label: 'Goles a favor' },
    { id: 'rp', label: 'Resultado particular' },
  ]);

  const FULL_NAME = 'Copa Verano 2025';

  useEffect(() => {
    if (activeStep === 0) {
      setTypedName('');
      setTeamCount(0);
      setGroupCount(0);
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep >= 0 && typedName.length < FULL_NAME.length) {
      if (typedName.length === 0) {
        const startTimer = setTimeout(() => setTypedName(FULL_NAME.slice(0, 1)), 300);
        return () => clearTimeout(startTimer);
      }
      const typeTimer = setTimeout(() => setTypedName(FULL_NAME.slice(0, typedName.length + 1)), 50);
      return () => clearTimeout(typeTimer);
    }
    return undefined;
  }, [activeStep, typedName]);

  useEffect(() => {
    let teamTimer;
    let groupTimer;
    let startTimer;

    if (activeStep >= 1) {
      if (teamCount === 0 && groupCount === 0) {
        startTimer = setTimeout(() => {
          setTeamCount(1);
          setGroupCount(1);
        }, 600);
        return () => clearTimeout(startTimer);
      }

      if (teamCount < 16) {
        teamTimer = setTimeout(() => setTeamCount((prev) => Math.min(prev + 1, 16)), 60);
      }
      // Group count runs at same time, but slower
      if (groupCount > 0 && groupCount < 4) {
        groupTimer = setTimeout(() => setGroupCount((prev) => Math.min(prev + 1, 4)), 250);
      }

      return () => {
        if (teamTimer) clearTimeout(teamTimer);
        if (groupTimer) clearTimeout(groupTimer);
      };
    }
    return undefined;
  }, [activeStep, teamCount, groupCount]);

  useEffect(() => {
    if (activeStep === 3) {
      const timer = setTimeout(() => {
        setTieBreakers([
          { id: 'gf', label: 'Goles a favor' },
          { id: 'dg', label: 'Diferencia goles' },
          { id: 'rp', label: 'Resultado particular' },
        ]);
      }, 700);
      return () => clearTimeout(timer);
    }
    if (activeStep < 3) {
      setTieBreakers([
        { id: 'dg', label: 'Diferencia goles' },
        { id: 'gf', label: 'Goles a favor' },
        { id: 'rp', label: 'Resultado particular' },
      ]);
    }
    return undefined;
  }, [activeStep]);

  useEffect(() => {
    // Master progression timer
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 1500); // 1.5s per step
    return () => clearInterval(timer);
  }, []);

  const CONFIG_SUBSTEPS = [
    { key: 'identidad', label: 'Identidad', icon: 'mdi:shield-account-outline', color: 'primary' },
    { key: 'formato', label: 'Formato', icon: 'mdi:tournament', color: 'info' },
    { key: 'puntuacion', label: 'Puntuación', icon: 'mdi:numeric-3-box-outline', color: 'warning' },
    { key: 'desempates', label: 'Desempates', icon: 'mdi:format-list-numbered', color: 'error' },
    { key: 'opciones', label: 'Opciones', icon: 'mdi:cog-outline', color: 'success' },
  ];

  const getVisibility = (stepIndex) => ({
    opacity: activeStep >= stepIndex ? 1 : 0,
    transform: activeStep >= stepIndex ? 'translateY(0)' : 'translateY(8px)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  const currentFormat = activeStep > 1 ? 2 : (groupCount === 0 ? 0 : (groupCount < 3 ? 1 : 2));

  return (
    <Box>
      {/* Horizontal mini-stepper */}
      <Stack direction="row" spacing={0} sx={{ mb: 2.5 }}>
        {CONFIG_SUBSTEPS.map((sub, idx) => {
          const isDone = activeStep > idx;
          const isActive = activeStep === idx;
          
          return (
            <Stack key={sub.key} direction="row" alignItems="center" sx={{ flex: 1 }}>
              <Stack alignItems="center" spacing={0.25} sx={{ flex: 1 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  bgcolor: (t) => isDone ? varAlpha(t.vars.palette[sub.color].mainChannel, 0.12) : 'transparent',
                  border: (t) => `2px solid ${isDone || isActive ? t.palette[sub.color].main : varAlpha(t.vars.palette.grey['500Channel'], 0.2)}`,
                  transition: 'all 0.3s ease',
                }}>
                  {isDone ? (
                    <Iconify icon="eva:checkmark-fill" width={14} sx={{ color: `${sub.color}.main` }} />
                  ) : (
                    <Iconify icon={sub.icon} width={14} sx={{ color: isActive ? `${sub.color}.main` : 'text.disabled' }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: isActive || isDone ? 700 : 500, color: isActive || isDone ? `${sub.color}.main` : 'text.disabled', transition: 'color 0.3s', mt: 0.5 }} noWrap>
                  {sub.label}
                </Typography>
              </Stack>
              {idx < CONFIG_SUBSTEPS.length - 1 && (
                <Box sx={{
                  height: '2px', flex: '0 0 10px', mt: -2,
                  bgcolor: (t) => isDone ? varAlpha(t.vars.palette[sub.color].mainChannel, 0.4) : varAlpha(t.vars.palette.grey['500Channel'], 0.16),
                  transition: 'background-color 0.3s ease',
                }} />
              )}
            </Stack>
          );
        })}
      </Stack>

      {/* Form Summary Cards */}
      <Stack spacing={1.5}>
        {/* Identidad */}
        <Card sx={{ ...getVisibility(0), p: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`, bgcolor: 'background.paper' }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
             <Box sx={{ width: 36, height: 36, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <Iconify icon="mdi:trophy" width={20} sx={{ color: 'primary.main' }} />
             </Box>
             <Box sx={{ flex: 1, height: 40, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.8rem', minHeight: '1.2rem', display: 'flex', alignItems: 'center' }}>
                  {typedName}
                  {activeStep === 0 && typedName.length < FULL_NAME.length && (
                    <Box component="span" sx={{ width: 2, height: 14, bgcolor: 'primary.main', ml: 0.5, animation: 'blink 1s step-end infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5, opacity: typedName.length > 5 ? 1 : 0, transition: 'opacity 0.3s' }}>
                  <Iconify icon="mdi:soccer" width={14} /> Fútbol
                  <Box component="span" sx={{ mx: 0.5 }}>•</Box>
                  <Iconify icon="mdi:map-marker-outline" width={14} /> Bogotá
                </Typography>
             </Box>
          </Stack>
        </Card>

        {/* Formato */}
        <Card sx={{ ...getVisibility(1), p: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`, bgcolor: 'background.paper' }}>
          {/* Format Options Grid */}
          <Stack direction="row" spacing={1} sx={{ mb: 1.5 }}>
            {/* Liga Option */}
            <Box sx={{ 
              flex: 1, p: 0.75, borderRadius: 1, position: 'relative', overflow: 'hidden',
              bgcolor: (t) => currentFormat === 0 ? varAlpha(t.vars.palette.info.mainChannel, 0.08) : 'transparent',
              border: (t) => `1px solid ${currentFormat === 0 ? t.palette.info.main : varAlpha(t.vars.palette.grey['500Channel'], 0.2)}`,
              transition: 'all 0.3s ease', opacity: currentFormat === 0 ? 1 : 0.6
            }}>
              {currentFormat === 0 && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, color: 'info.main' }} />}
              <Stack alignItems="center" spacing={0.25}>
                <Iconify icon="mdi:format-list-bulleted" width={16} sx={{ color: currentFormat === 0 ? 'info.main' : 'text.disabled' }} />
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, color: currentFormat === 0 ? 'info.dark' : 'text.secondary', textAlign: 'center' }}>LIGA</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.45rem', color: 'text.disabled', textAlign: 'center', lineHeight: 1.1 }}>Todos vs<br/>Todos</Typography>
              </Stack>
            </Box>
            
            {/* Grupos Option */}
            <Box sx={{ 
              flex: 1, p: 0.75, borderRadius: 1, position: 'relative', overflow: 'hidden',
              bgcolor: (t) => currentFormat === 1 ? varAlpha(t.vars.palette.info.mainChannel, 0.08) : 'transparent',
              border: (t) => `1px solid ${currentFormat === 1 ? t.palette.info.main : varAlpha(t.vars.palette.grey['500Channel'], 0.2)}`,
              transition: 'all 0.3s ease', opacity: currentFormat === 1 ? 1 : 0.6
            }}>
              {currentFormat === 1 && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, color: 'info.main' }} />}
              <Stack alignItems="center" spacing={0.25}>
                <Iconify icon="mdi:view-grid-outline" width={16} sx={{ color: currentFormat === 1 ? 'info.main' : 'text.disabled' }} />
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, color: currentFormat === 1 ? 'info.dark' : 'text.secondary', textAlign: 'center' }}>GRUPOS</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.45rem', color: 'text.disabled', textAlign: 'center', lineHeight: 1.1 }}>Fases<br/>Clasif.</Typography>
              </Stack>
            </Box>

            {/* Grupos + KO Option */}
            <Box sx={{ 
              flex: 1, p: 0.75, borderRadius: 1, position: 'relative', overflow: 'hidden',
              bgcolor: (t) => currentFormat === 2 ? varAlpha(t.vars.palette.info.mainChannel, 0.08) : 'transparent',
              border: (t) => `1px solid ${currentFormat === 2 ? t.palette.info.main : varAlpha(t.vars.palette.grey['500Channel'], 0.2)}`,
              transition: 'all 0.3s ease', opacity: currentFormat === 2 ? 1 : 0.6
            }}>
              {currentFormat === 2 && <Iconify icon="eva:checkmark-circle-2-fill" sx={{ position: 'absolute', top: 4, right: 4, width: 12, height: 12, color: 'info.main' }} />}
              <Stack alignItems="center" spacing={0.25}>
                <Iconify icon="mdi:tournament" width={16} sx={{ color: currentFormat === 2 ? 'info.main' : 'text.disabled' }} />
                <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, color: currentFormat === 2 ? 'info.dark' : 'text.secondary', textAlign: 'center' }}>GRUPOS + KO</Typography>
                <Typography variant="caption" sx={{ fontSize: '0.45rem', color: 'text.disabled', textAlign: 'center', lineHeight: 1.1 }}>Grupos y<br/>Fase Final</Typography>
              </Stack>
            </Box>
          </Stack>
          
          <Divider sx={{ borderStyle: 'dashed', mb: 1.5, borderColor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.2) }} />

          <Stack direction="row" spacing={1}>
             <Box sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.info.mainChannel, 0.04), border: (t) => `1px solid ${varAlpha(t.vars.palette.info.mainChannel, 0.1)}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Iconify icon="mdi:shield-outline" width={16} sx={{ color: 'info.main' }} />
                <Typography variant="subtitle2" sx={{ color: 'info.dark' }}>{teamCount} Equipos</Typography>
             </Box>
             <Box sx={{ flex: 1, p: 1, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04), display: 'flex', alignItems: 'center', gap: 1, opacity: activeStep >= 1 ? 1 : 0.4, transition: 'opacity 0.3s' }}>
                <Iconify icon="mdi:account-group-outline" width={16} sx={{ color: 'text.secondary' }} />
                <Typography variant="subtitle2">{activeStep >= 1 ? groupCount : 0} Grupos</Typography>
             </Box>
          </Stack>
        </Card>

        {/* Reglas & Opciones */}
        <Stack direction="row" spacing={1.5}>
            <Card sx={{ ...getVisibility(2), flex: 1, p: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`, bgcolor: 'background.paper', display: 'flex', flexDirection: 'column' }}>
               <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', display: 'block', mb: 1.5 }}>PUNTUACIÓN</Typography>
               <Stack direction="row" justifyContent="space-between" sx={{ px: 0, flex: 1, alignItems: 'center' }}>
                  <Stack alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: (t) => varAlpha(t.vars.palette.success.mainChannel, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.6rem' }}>V</Typography>
                    </Box>
                    <Typography variant="subtitle2">3 <Box component="span" sx={{ fontSize: '0.55rem', color: 'text.secondary', fontWeight: 400 }}>pts</Box></Typography>
                  </Stack>
                  <Stack alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'warning.main', fontWeight: 700, fontSize: '0.6rem' }}>E</Typography>
                    </Box>
                    <Typography variant="subtitle2">1 <Box component="span" sx={{ fontSize: '0.55rem', color: 'text.secondary', fontWeight: 400 }}>pt</Box></Typography>
                  </Stack>
                  <Stack alignItems="center" spacing={0.5}>
                    <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: (t) => varAlpha(t.vars.palette.error.mainChannel, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.6rem' }}>D</Typography>
                    </Box>
                    <Typography variant="subtitle2">0 <Box component="span" sx={{ fontSize: '0.55rem', color: 'text.secondary', fontWeight: 400 }}>pts</Box></Typography>
                  </Stack>
               </Stack>
            </Card>
            
            <Card sx={{ ...getVisibility(3), flex: 1.2, p: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`, bgcolor: 'background.paper' }}>
               <Typography variant="caption" sx={{ fontWeight: 700, color: 'info.main', display: 'block', mb: 1 }}>DESEMPATES</Typography>
               <Stack spacing={0.75}>
                  <AnimatePresence mode="popLayout">
                    {tieBreakers.map((rule, i) => (
                      <m.div
                        key={rule.id}
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 300, 
                          damping: 30,
                          opacity: { duration: 0.2 } 
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={1}>
                           <Box sx={{ 
                             width: 14, height: 14, borderRadius: '50%', 
                             bgcolor: (t) => activeStep >= 3 ? 'info.main' : 'text.disabled',
                             display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
                           }}>
                              <Typography variant="caption" sx={{ color: 'common.white', fontWeight: 700, fontSize: '0.55rem' }}>{i + 1}</Typography>
                           </Box>
                           <Typography variant="caption" sx={{ fontSize: '0.6rem', color: activeStep >= 3 ? 'text.primary' : 'text.disabled', fontWeight: i === 0 && activeStep >= 3 ? 700 : 400 }}>{rule.label}</Typography>
                           {i === 0 && activeStep >= 3 && (
                             <Iconify icon="mdi:chevron-double-up" width={12} sx={{ color: 'info.main', animation: 'bounce 2s infinite', '@keyframes bounce': { '0%, 20%, 50%, 80%, 100%': { transform: 'translateY(0)' }, '40%': { transform: 'translateY(-2px)' }, '60%': { transform: 'translateY(-1px)' } } }} />
                           )}
                        </Stack>
                      </m.div>
                    ))}
                  </AnimatePresence>
               </Stack>
            </Card>

            <Card sx={{ ...getVisibility(4), flex: 1.2, p: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`, bgcolor: 'background.paper' }}>
               <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', display: 'block', mb: 1 }}>OPCIONES</Typography>
               <Stack spacing={0.5}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                     <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Inscripción abierta</Typography>
                     <Iconify icon={activeStep >= 4 ? "mdi:toggle-switch" : "mdi:toggle-switch-off"} sx={{ color: activeStep >= 4 ? 'success.main' : 'text.disabled', transform: 'scale(1.2)', transition: 'all 0.3s' }} />
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                     <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Notificaciones push</Typography>
                     <Iconify icon={activeStep >= 5 ? "mdi:toggle-switch" : "mdi:toggle-switch-off"} sx={{ color: activeStep >= 5 ? 'success.main' : 'text.disabled', transform: 'scale(1.2)', transition: 'all 0.3s' }} />
                  </Stack>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                     <Typography variant="caption" sx={{ fontSize: '0.6rem' }}>Visibilidad pública</Typography>
                     <Iconify icon={activeStep >= 6 ? "mdi:toggle-switch" : "mdi:toggle-switch-off"} sx={{ color: activeStep >= 6 ? 'success.main' : 'text.disabled', transform: 'scale(1.2)', transition: 'all 0.3s' }} />
                  </Stack>
               </Stack>
            </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

function TeamsPreview() {
  const [activeStep, setActiveStep] = useState(0);
  const [typedName, setTypedName] = useState('');
  const [playerCount, setPlayerCount] = useState(0);
  const [posCounts, setPosCounts] = useState({ POR: 0, DEF: 0, MED: 0, DEL: 0 });

  const FULL_NAME = 'SportsManagement FC';

  useEffect(() => {
    if (activeStep === 0) {
      setTypedName('');
    }
  }, [activeStep]);

  useEffect(() => {
    if (activeStep >= 0 && typedName.length < FULL_NAME.length) {
      if (typedName.length === 0) {
        const startTimer = setTimeout(() => setTypedName(FULL_NAME.slice(0, 1)), 250);
        return () => clearTimeout(startTimer);
      }
      const typeTimer = setTimeout(() => setTypedName(FULL_NAME.slice(0, typedName.length + 1)), 60);
      return () => clearTimeout(typeTimer);
    }
    return undefined;
  }, [activeStep, typedName]);

  useEffect(() => {
    if (activeStep === 1) {
      if (playerCount < 14) {
        const timer = setTimeout(() => {
          const nextCount = playerCount + 1;
          setPlayerCount(nextCount);
          
          const newPosCounts = { POR: 0, DEF: 0, MED: 0, DEL: 0 };
          newPosCounts.POR = Math.min(nextCount, 2);
          if (nextCount > 2) newPosCounts.DEF = Math.min(nextCount - 2, 4);
          if (nextCount > 6) newPosCounts.MED = Math.min(nextCount - 6, 5);
          if (nextCount > 11) newPosCounts.DEL = Math.min(nextCount - 11, 3);
          setPosCounts(newPosCounts);
        }, 80);
        return () => clearTimeout(timer);
      }
    } else if (activeStep < 1) {
      setPlayerCount(0);
      setPosCounts({ POR: 0, DEF: 0, MED: 0, DEL: 0 });
    }
    return undefined;
  }, [activeStep, playerCount]);

  useEffect(() => {
    // 1.5s per step
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev >= 6 ? 0 : prev + 1));
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const TEAM_SUBSTEPS = [
    {
      key: 'identidad',
      label: 'Identidad',
      icon: 'mdi:shield-account-outline',
      color: 'primary',
    },
    {
      key: 'plantilla',
      label: 'Plantilla',
      icon: 'mdi:account-group-outline',
      color: 'info',
    },
    {
      key: 'documentos',
      label: 'Documentos',
      icon: 'mdi:file-document-check-outline',
      color: 'warning',
    },
    {
      key: 'reglamento',
      label: 'Reglamento',
      icon: 'mdi:gavel',
      color: 'error',
    },
  ];

  const getVisibility = (stepIndex) => ({
    opacity: activeStep >= stepIndex ? 1 : 0,
    transform: activeStep >= stepIndex ? 'translateY(0)' : 'translateY(8px)',
    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
  });

  return (
    <Box>
      {/* Horizontal mini-stepper */}
      <Stack direction="row" spacing={0} sx={{ mb: 2.5 }}>
        {TEAM_SUBSTEPS.map((sub, idx) => {
          const isDone = activeStep > idx;
          const isActive = activeStep === idx;
          return (
            <Stack key={sub.key} direction="row" alignItems="center" sx={{ flex: 1 }}>
              <Stack alignItems="center" spacing={0.25} sx={{ flex: 1 }}>
                <Box sx={{
                  width: 28, height: 28, borderRadius: '50%', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  bgcolor: (t) => isDone ? varAlpha(t.vars.palette[sub.color].mainChannel, 0.12) : 'transparent',
                  border: (t) => `2px solid ${isDone || isActive ? t.palette[sub.color].main : varAlpha(t.vars.palette.grey['500Channel'], 0.2)}`,
                  transition: 'all 0.3s ease',
                }}>
                  {isDone ? (
                    <Iconify icon="eva:checkmark-fill" width={14} sx={{ color: `${sub.color}.main` }} />
                  ) : (
                    <Iconify icon={sub.icon} width={14} sx={{ color: isActive ? `${sub.color}.main` : 'text.disabled' }} />
                  )}
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: isActive || isDone ? 700 : 500, color: isActive || isDone ? `${sub.color}.main` : 'text.disabled', transition: 'color 0.3s', mt: 0.5 }} noWrap>
                  {sub.label}
                </Typography>
              </Stack>
              {idx < TEAM_SUBSTEPS.length - 1 && (
                <Box sx={{
                  height: '2px', flex: '0 0 16px', mt: -2,
                  bgcolor: (t) => isDone ? varAlpha(t.vars.palette[sub.color].mainChannel, 0.4) : varAlpha(t.vars.palette.grey['500Channel'], 0.16),
                  transition: 'background-color 0.3s ease',
                }} />
              )}
            </Stack>
          );
        })}
      </Stack>

      <Stack spacing={1.5}>
        {/* Sub-step 1: Identidad */}
        <Card sx={{
          ...getVisibility(0),
          p: 1.5, boxShadow: 'none',
          border: (t) => `1px solid ${varAlpha(t.vars.palette.primary.mainChannel, 0.2)}`,
          bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.02),
        }}>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700, color: 'common.white',
            }}>
              SM
            </Box>
            <Box sx={{ flex: 1, minWidth: 0, height: 32, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', minHeight: '1.2rem' }}>
                {typedName}
                {activeStep === 0 && typedName.length < FULL_NAME.length && (
                  <Box component="span" sx={{ width: 2, height: 12, bgcolor: 'primary.main', ml: 0.5, animation: 'blink 1s step-end infinite', '@keyframes blink': { '0%, 100%': { opacity: 1 }, '50%': { opacity: 0 } } }} />
                )}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.25, opacity: typedName.length > 3 ? 1 : 0, transition: 'opacity 0.3s' }}>
                <Chip label="SMFC" size="small" variant="outlined" sx={{ height: 16, fontSize: '0.55rem' }} />
                <Chip label="Seed 1" size="small" variant="soft" color="primary" sx={{ height: 16, fontSize: '0.55rem' }} />
              </Stack>
            </Box>
            <Iconify icon="eva:checkmark-circle-2-fill" width={18} sx={{ color: 'success.main', opacity: activeStep > 0 ? 1 : 0, transition: 'opacity 0.3s' }} />
          </Stack>
        </Card>

        {/* Sub-step 2: Plantilla */}
        <Card sx={{
          ...getVisibility(1),
          p: 1.5, boxShadow: 'none',
          border: (t) => `1px solid ${varAlpha(t.vars.palette.info.mainChannel, 0.2)}`,
          bgcolor: (t) => varAlpha(t.vars.palette.info.mainChannel, 0.02),
        }}>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
            <Iconify icon="mdi:account-group" width={14} sx={{ color: 'info.main' }} />
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.main', fontSize: '0.65rem' }}>
              {playerCount} jugadores
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.75}>
            {[
              { pos: 'POR', count: posCounts.POR, icon: 'mdi:hand-back-right' },
              { pos: 'DEF', count: posCounts.DEF, icon: 'mdi:shield-outline' },
              { pos: 'MED', count: posCounts.MED, icon: 'mdi:strategy' },
              { pos: 'DEL', count: posCounts.DEL, icon: 'mdi:soccer' },
            ].map((p) => (
              <Card key={p.pos} sx={{
                flex: 1, py: 0.75, textAlign: 'center', boxShadow: 'none',
                bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04),
                border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.06)}`,
                transition: 'all 0.3s'
              }}>
                <Iconify icon={p.icon} width={14} sx={{ color: p.count > 0 ? 'info.main' : 'text.disabled', mb: 0.25, transition: 'color 0.3s' }} />
                <Typography variant="subtitle2" sx={{ fontSize: '0.8rem', fontWeight: 700, color: p.count > 0 ? 'text.primary' : 'text.disabled' }}>{p.count}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem' }}>{p.pos}</Typography>
              </Card>
            ))}
          </Stack>
        </Card>

        <Stack direction="row" spacing={1.5}>
          {/* Sub-step 3: Documentos */}
          <Card sx={{
            ...getVisibility(2),
            flex: 1.2, p: 1.5, boxShadow: 'none',
            border: (t) => `1px solid ${varAlpha(t.vars.palette.warning.mainChannel, 0.2)}`,
            bgcolor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.02),
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main', display: 'block', mb: 1 }}>DOCUMENTOS</Typography>
            <Stack spacing={0.5}>
              {[
                { label: 'Identificación', icon: 'mdi:card-account-details-outline', baseDone: true },
                { label: 'Póliza seguro', icon: 'mdi:shield-check-outline', baseDone: true },
                { label: 'Cert. médicos', icon: 'mdi:hospital-box-outline', baseDone: false },
              ].map((doc, idx) => {
                // The later docs only get checked near the end of the step
                const isChecked = doc.baseDone || (activeStep > 2);
                return (
                  <Stack key={doc.label} direction="row" alignItems="center" spacing={0.75} sx={{ py: 0.25 }}>
                    <Iconify
                      icon={isChecked ? 'eva:checkmark-circle-2-fill' : 'eva:radio-button-off-outline'}
                      width={14}
                      sx={{ color: isChecked ? 'success.main' : 'text.disabled', flexShrink: 0, transition: 'color 0.3s' }}
                    />
                    <Typography variant="caption" sx={{
                      fontSize: '0.6rem', flex: 1,
                      fontWeight: isChecked ? 500 : 400,
                      color: isChecked ? 'text.primary' : 'text.secondary',
                      transition: 'color 0.3s'
                    }} noWrap>
                      {doc.label}
                    </Typography>
                  </Stack>
                );
              })}
            </Stack>
          </Card>

          {/* Sub-step 4: Reglamento */}
          <Card sx={{
            ...getVisibility(3),
            flex: 1, p: 1.5, boxShadow: 'none', display: 'flex', flexDirection: 'column',
            border: (t) => `1px solid ${varAlpha(t.vars.palette.success.mainChannel, 0.3)}`,
            bgcolor: (t) => varAlpha(t.vars.palette.success.mainChannel, 0.04),
          }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.dark', display: 'block', mb: 1 }}>REGLAMENTO</Typography>
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Stack alignItems="center" spacing={0.5}>
                <Box sx={{ position: 'relative', width: 24, height: 24 }}>
                  <Iconify icon="mdi:gavel" width={24} sx={{ color: 'text.secondary', opacity: activeStep > 3 ? 0 : 1, position: 'absolute', transition: 'opacity 0.3s' }} />
                  <Iconify icon="eva:checkmark-circle-2-fill" width={24} sx={{ color: 'success.main', opacity: activeStep > 3 ? 1 : 0, position: 'absolute', transition: 'all 0.3s', transform: activeStep > 3 ? 'scale(1)' : 'scale(0.8)' }} />
                </Box>
                <Typography variant="caption" sx={{ fontSize: '0.55rem', color: activeStep > 3 ? 'success.main' : 'text.secondary', fontWeight: activeStep > 3 ? 700 : 500, textAlign: 'center', transition: 'color 0.3s' }}>
                  {activeStep > 3 ? 'Aceptado' : 'Pendiente'}
                </Typography>
              </Stack>
            </Box>
          </Card>
        </Stack>
      </Stack>
    </Box>
  );
}

function GroupsPreview() {
  const [phase, setPhase] = useState('generating'); // 'generating' | 'live'
  const [matchA, setMatchA] = useState('0_0');
  const [matchB, setMatchB] = useState('0_0');

  useEffect(() => {
    if (phase === 'generating') {
      const timer = setTimeout(() => setPhase('live'), 1800);
      return () => clearTimeout(timer);
    }

    // Phase: Live
    const timerA = setTimeout(() => setMatchA('1_0'), 600);
    const timerB = setTimeout(() => setMatchB('1_0'), 1400);
    
    const loopTimer = setInterval(() => {
      setMatchA((prev) => (prev === '0_0' ? '1_0' : '0_0'));
      setTimeout(() => {
        setMatchB((prev) => (prev === '0_0' ? '1_0' : '0_0'));
      }, 500);
    }, 3500);

    return () => {
      clearTimeout(timerA);
      clearTimeout(timerB);
      clearInterval(loopTimer);
    };
  }, [phase]);

  const TEAMS = [
    'SportsManagement FC', 'Águilas FC', 'Rayo Azul', 'Inter Club',
    'Galaxy XI', 'Titans FC', 'Stellar FC', 'Nebula SC'
  ];

  const getStandings = (isGoal, type) => {
    // ... existing getStandings logic ...
    if (type === 'A') {
      if (isGoal) {
        return [
          { name: 'SportsManagement FC', w: 2, d: 0, l: 1, gd: '+3', pts: 6 },
          { name: 'Águilas FC', w: 2, d: 0, l: 0, gd: '+2', pts: 6 },
          { name: 'Rayo Azul', w: 1, d: 0, l: 1, gd: '-1', pts: 3 },
          { name: 'Inter Club', w: 0, d: 0, l: 3, gd: '-4', pts: 0 },
        ];
      }
      return [
        { name: 'Águilas FC', w: 2, d: 0, l: 0, gd: '+2', pts: 6 },
        { name: 'Rayo Azul', w: 1, d: 0, l: 1, gd: '-1', pts: 3 },
        { name: 'SportsManagement FC', w: 1, d: 1, l: 1, gd: '+2', pts: 4 },
        { name: 'Inter Club', w: 0, d: 1, l: 2, gd: '-3', pts: 1 },
      ];
    }
    // Group B Standings
    if (isGoal) {
      return [
        { name: 'Galaxy XI', w: 2, d: 1, l: 0, gd: '+4', pts: 7 },
        { name: 'Titans FC', w: 1, d: 1, l: 1, gd: '+1', pts: 4 },
        { name: 'Stellar FC', w: 1, d: 0, l: 2, gd: '-2', pts: 3 },
        { name: 'Nebula SC', w: 0, d: 2, l: 1, gd: '-3', pts: 2 },
      ];
    }
    return [
      { name: 'Titans FC', w: 1, d: 2, l: 0, gd: '+1', pts: 5 },
      { name: 'Galaxy XI', w: 1, d: 2, l: 0, gd: '+3', pts: 5 },
      { name: 'Stellar FC', w: 1, d: 0, l: 2, gd: '-2', pts: 3 },
      { name: 'Nebula SC', w: 0, d: 2, l: 1, gd: '-3', pts: 2 },
    ];
  };

  return (
    <AnimatePresence mode="wait">
      {phase === 'generating' ? (
        <Box
          key="generating"
          component={m.div}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 3 }}
        >
          <Stack alignItems="center" spacing={1}>
             <Iconify icon="solar:magic-stick-3-bold-duotone" width={48} sx={{ color: 'primary.main', animation: 'spin 3s linear infinite', '@keyframes spin': { from: { rotate: '0deg' }, to: { rotate: '360deg' } } }} />
             <Typography variant="h6" sx={{ color: 'text.primary', fontWeight: 800 }}>Generando Grupos</Typography>
             <Typography variant="caption" sx={{ color: 'text.disabled' }}>Sorteando 16 equipos automáticamente...</Typography>
          </Stack>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, width: '100%', maxWidth: 300 }}>
            {TEAMS.map((team, i) => (
              <Box
                key={team}
                component={m.div}
                animate={{ 
                  scale: [1, 1.05, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ 
                  duration: 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.1 
                }}
                sx={{ 
                  p: 1, borderRadius: 1, border: '1px solid', borderColor: 'divider',
                  bgcolor: 'background.paper', fontSize: '0.6rem', fontWeight: 700,
                  textAlign: 'center', color: 'text.secondary'
                }}
              >
                {team}
              </Box>
            ))}
          </Box>

          <Box sx={{ width: '100%', maxWidth: 240, height: 4, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.1), borderRadius: 2, overflow: 'hidden' }}>
             <Box component={m.div} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 1.5, ease: 'easeInOut' }} sx={{ height: '100%', bgcolor: 'primary.main' }} />
          </Box>
        </Box>
      ) : (
        <Stack key="live" component={m.div} initial={{ opacity: 0 }} animate={{ opacity: 1 }} spacing={2.5}>
          <GroupCard 
            name="Grupo A" 
            match={{ home: 'SportsManagement FC', away: 'Inter Club', score: matchA }} 
            standings={getStandings(matchA === '1_0', 'A')}
            color="warning.main"
          />
          <GroupCard 
            name="Grupo B" 
            match={{ home: 'Galaxy XI', away: 'Titans FC', score: matchB }} 
            standings={getStandings(matchB === '1_0', 'B')}
            color="info.main"
          />
        </Stack>
      )}
    </AnimatePresence>
  );
}

function GroupCard({ name, match, standings, color }) {
  const isGoalScored = match.score === '1_0';

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
        <Stack direction="row" alignItems="center" spacing={0.75}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{name}</Typography>
        </Stack>
      </Stack>

      {/* Live Match Card */}
      <Card sx={{
        mb: 1.25, p: 1, boxShadow: 'none',
        border: (t) => `1px solid ${varAlpha(t.vars.palette.error.mainChannel, 0.2)}`,
        bgcolor: (t) => varAlpha(t.vars.palette.error.mainChannel, 0.02),
        position: 'relative', overflow: 'hidden',
      }}>
        <Box sx={{ position: 'absolute', top: 4, left: 6, display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{
            width: 5, height: 5, borderRadius: '50%', bgcolor: 'error.main',
            animation: 'pulse 1s ease-in-out infinite',
            '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } },
          }} />
          <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700, fontSize: '0.5rem', letterSpacing: 0.5 }}>
            EN VIVO
          </Typography>
        </Box>

        <AnimatePresence>
          {isGoalScored && (
            <Box component={m.div} initial={{ opacity: 0.6 }} animate={{ opacity: 0 }} transition={{ duration: 1 }}
              sx={{ position: 'absolute', inset: 0, zIndex: 0, background: (t) => `linear-gradient(90deg, transparent, ${varAlpha(t.vars.palette.success.mainChannel, 0.15)}, transparent)` }} />
          )}
        </AnimatePresence>

        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
          <Typography variant="caption" sx={{ fontWeight: isGoalScored ? 700 : 500, flex: 1, textAlign: 'right', color: isGoalScored ? 'success.main' : 'text.primary', transition: 'color 0.3s', fontSize: '0.7rem' }}>
            {match.home}
          </Typography>
          <Box sx={{ position: 'relative' }}>
            <AnimatePresence>
              {isGoalScored && (
                <Box component={m.div} initial={{ opacity: 0, scale: 0.5, y: 5 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.5 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 20 }} sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
                  <Chip label="¡GOL!" size="small" color="success" sx={{ height: 14, fontSize: '0.45rem', fontWeight: 800, px: 0.25 }} />
                </Box>
              )}
            </AnimatePresence>
            <Box sx={{ px: 1, py: 0.25, borderRadius: 0.5, bgcolor: (t) => varAlpha(t.vars.palette.error.mainChannel, 0.08), display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <AnimatePresence mode="popLayout">
                <Box component={m.span} key={isGoalScored ? '1' : '0'} initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.8rem', color: isGoalScored ? 'success.main' : 'text.primary' }}>
                  {isGoalScored ? '1' : '0'}
                </Box>
              </AnimatePresence>
              <Typography variant="caption" sx={{ fontWeight: 700, opacity: 0.3 }}>-</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.8rem' }}>0</Typography>
            </Box>
          </Box>
          <Typography variant="caption" sx={{ fontWeight: 500, flex: 1, fontSize: '0.7rem' }}>
            {match.away}
          </Typography>
        </Stack>
      </Card>

      {/* Standings Table */}
      <Card sx={{ boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.1)}`, overflow: 'hidden' }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', px: 1, py: 0.5, gap: 0.5, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.03) }}>
          {['Equipo', 'PG', 'PE', 'PP', 'PTS'].map((h) => (
            <Typography key={h} variant="caption" sx={{ fontSize: '0.55rem', fontWeight: h === 'PTS' ? 700 : 500, color: 'text.disabled', textAlign: h === 'Equipo' ? 'left' : 'center' }}>{h}</Typography>
          ))}
        </Box>
        {standings.map((row, idx) => {
          const isScorer = row.name === match.home && isGoalScored;
          return (
            <Box component={m.div} layout key={row.name} transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              sx={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', px: 1, py: 0.5, gap: 0.5, alignItems: 'center',
                bgcolor: isScorer ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.08) : 'transparent',
                transition: 'background-color 0.5s'
              }}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {idx < 2 && <Box sx={{ width: 2, height: 10, borderRadius: 0.25, bgcolor: 'success.main' }} />}
                <Typography variant="caption" sx={{ fontWeight: idx < 2 ? 600 : 400, fontSize: '0.6rem', color: isScorer ? 'success.main' : 'text.primary' }} noWrap>{row.name}</Typography>
              </Stack>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>{row.w}</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>{row.d}</Typography>
              <Typography variant="caption" sx={{ fontSize: '0.6rem', textAlign: 'center' }}>{row.l}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', textAlign: 'center', color: idx < 2 ? 'success.main' : 'text.primary' }}>{row.pts}</Typography>
            </Box>
          );
        })}
      </Card>
    </Box>
  );
}

const SF1 = { home: 'SportsManagement FC', away: 'Titanes', scoreH: 2, scoreA: 0, mvp: 'T. Müller' };
const SF2 = { home: 'Rayo Azul', away: 'Galaxy XI', scoreH: 2, scoreA: 1, mvp: 'L. Díaz' };
const FINAL = { home: 'SportsManagement FC', away: 'Rayo Azul', scoreH: 3, scoreA: 1, mvp: 'R. Lewandowski' };
const CHAMP = 'SportsManagement FC';

const Sunburst = () => (
  <Box
    component={m.div}
    animate={{ rotate: 360 }}
    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
    sx={{
      position: 'absolute', inset: -20, zIndex: -1,
      background: (t) => `repeating-conic-gradient(${varAlpha(t.vars.palette.warning.mainChannel, 0)}, ${varAlpha(t.vars.palette.warning.mainChannel, 0.1)} 10deg, ${varAlpha(t.vars.palette.warning.mainChannel, 0)} 20deg)`,
      borderRadius: '50%',
    }}
  />
);

const Confetti = () => (
  <Box sx={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
    {[...Array(12)].map((_, i) => (
      <Box
        key={i}
        component={m.div}
        initial={{ opacity: 0, y: 0, x: 0, scale: 0 }}
        animate={{ 
          opacity: [0, 1, 0], 
          y: [0, -40 - Math.random() * 40], 
          x: [-20 + Math.random() * 40],
          scale: [0, 1, 0] 
        }}
        transition={{ duration: 1, repeat: Infinity, delay: Math.random() * 2 }}
        sx={{
          position: 'absolute', top: '50%', left: '50%',
          width: 4, height: 4, borderRadius: '50%',
          bgcolor: i % 2 === 0 ? 'warning.main' : 'success.main',
        }}
      />
    ))}
  </Box>
);

// ─── PREMIUM HELPERS ────────────────────────────────────────────────

const RollingScore = ({ val, revealed }) => (
  <AnimatePresence mode="wait">
    <Box
      component={m.div}
      key={revealed ? val : 'hidden'}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.3 }}
      sx={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.75rem' }}
    >
      {revealed ? val : 0}
    </Box>
  </AnimatePresence>
);

const MVPBadge = ({ name, show }) => (
  <AnimatePresence>
    {show && (
      <Box
        component={m.div}
        initial={{ opacity: 0, scale: 0, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 0.5 }}
        sx={{
          position: 'absolute', top: -8, right: -4, zIndex: 10,
          bgcolor: 'warning.main', color: 'warning.contrastText',
          px: 0.75, py: 0.15, borderRadius: 0.5,
          display: 'flex', alignItems: 'center', gap: 0.25,
          boxShadow: (t) => `0 2px 4px ${varAlpha(t.vars.palette.warning.mainChannel, 0.4)}`,
        }}
      >
        <Iconify icon="solar:star-bold" width={10} />
        <Typography variant="caption" sx={{ fontSize: '0.5rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
          MVP: {name}
        </Typography>
      </Box>
    )}
  </AnimatePresence>
);

const NodeCard = ({ match, index, revealedCount }) => {
  const isRevealing = revealedCount === index;
  const isRevealed = revealedCount >= index;
  const isWinner = match.home === CHAMP && isRevealed;
  const homeWinner = match.scoreH > match.scoreA;

  return (
    <Box sx={{ width: '100%', px: 0.5, position: 'relative' }}>
      <Tooltip 
        title={isRevealed ? `Tiros: 12 - Posesión: 54%` : ''} 
        arrow placement="top"
        slotProps={{ tooltip: { sx: { bgcolor: 'common.black', fontSize: '0.6rem' } } }}
      >
        <Box component={m.div} animate={{ scale: isRevealing ? 1.05 : 1 }} transition={{ type: 'spring' }}>
          <MVPBadge name={match.mvp} show={isRevealed} />
          <Card sx={{ 
            height: 52,
            border: '1px solid',
            borderColor: isRevealing ? 'success.main' : (isRevealed ? (isWinner ? 'warning.main' : 'divider') : 'divider'),
            bgcolor: isWinner ? (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.03) : (isRevealing ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.05) : 'background.paper'),
            boxShadow: isRevealing ? (t) => `0 0 12px ${varAlpha(t.vars.palette.success.mainChannel, 0.4)}` : (isWinner ? (t) => `0 0 8px ${varAlpha(t.vars.palette.warning.mainChannel, 0.2)}` : 'none'),
            borderRadius: 1,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            transition: 'all 0.3s ease',
            opacity: isRevealed ? 1 : 0.6,
          }}>
            <Stack direction="row" alignItems="stretch" sx={{ flex: 1, borderBottom: '1px solid', borderColor: 'divider', bgcolor: isRevealed && homeWinner ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.08) : 'transparent', transition: 'background-color 0.5s ease' }}>
              <Box sx={{ width: 3, bgcolor: isRevealed && homeWinner ? 'success.main' : 'transparent', transition: 'background-color 0.5s ease' }} />
              <Typography variant="caption" sx={{ flex: 1, px: 0.75, py: 0.25, fontSize: '0.6rem', fontWeight: isRevealed && homeWinner ? 700 : 500, display: 'flex', alignItems: 'center', color: isRevealed && homeWinner ? (isWinner && match.home === CHAMP ? 'warning.dark' : 'success.main') : 'text.primary', opacity: isRevealed ? 1 : 0, transition: 'all 0.5s ease' }} noWrap>{match.home}</Typography>
              <Box sx={{ minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid', borderColor: 'divider', bgcolor: isRevealed && homeWinner ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.16) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04), color: isRevealed && homeWinner ? 'success.main' : 'text.primary', transition: 'all 0.5s ease' }}>
                <RollingScore val={match.scoreH} revealed={isRevealed} />
              </Box>
            </Stack>
            <Stack direction="row" alignItems="stretch" sx={{ flex: 1, bgcolor: isRevealed && !homeWinner ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.08) : 'transparent', transition: 'background-color 0.5s ease' }}>
              <Box sx={{ width: 3, bgcolor: isRevealed && !homeWinner ? 'success.main' : 'transparent', transition: 'background-color 0.5s ease' }} />
              <Typography variant="caption" sx={{ flex: 1, px: 0.75, py: 0.25, fontSize: '0.6rem', fontWeight: isRevealed && !homeWinner ? 700 : 500, display: 'flex', alignItems: 'center', color: isRevealed && !homeWinner ? 'success.main' : 'text.primary', opacity: isRevealed ? 1 : 0, transition: 'all 0.5s ease' }} noWrap>{match.away}</Typography>
              <Box sx={{ minWidth: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid', borderColor: 'divider', bgcolor: isRevealed && !homeWinner ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.16) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04), color: isRevealed && !homeWinner ? 'success.main' : 'text.primary', transition: 'all 0.5s ease' }}>
                <RollingScore val={match.scoreA} revealed={isRevealed} />
              </Box>
            </Stack>
          </Card>
        </Box>
      </Tooltip>
    </Box>
  );
};

// (Skipping to the relevant KnockoutPreview section in this chunk)
function KnockoutPreview() {
  const [revealedCount, setRevealedCount] = useState(0);

  useEffect(() => {
    let timer;

    const run = (count) => {
      setRevealedCount(count);
      
      // If we are at the Champion step (4), wait much longer (5s)
      // Otherwise use a normal 1s delay
      const delay = count === 4 ? 5000 : 1000;
      
      timer = setTimeout(() => {
        run(count >= 4 ? 0 : count + 1);
      }, delay);
    };

    // Start the reveal sequence
    timer = setTimeout(() => run(1), 200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Iconify icon="solar:route-bold-duotone" width={18} sx={{ color: 'success.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Fase Final
        </Typography>
      </Stack>

      <Stack direction="row" sx={{ height: 180, width: '100%', alignItems: 'stretch' }}>
         
         {/* Semifinals */}
         <Stack justifyContent="space-between" sx={{ py: 1, flex: 2.5 }}>
            <NodeCard match={SF1} index={1} revealedCount={revealedCount} />
            <NodeCard match={SF2} index={2} revealedCount={revealedCount} />
         </Stack>

         {/* Connectors SF -> Final */}
         <Box sx={{ position: 'relative', flex: 0.5, minWidth: 16 }}>
            {/* Top right-angle line */}
            <Box sx={{ position: 'absolute', top: 34, bottom: '50%', left: 0, right: '50%', borderTop: '2px solid', borderRight: '2px solid', borderColor: 'divider', borderTopRightRadius: 6 }} />
            {/* Bottom right-angle line */}
            <Box sx={{ position: 'absolute', top: '50%', bottom: 34, left: 0, right: '50%', borderBottom: '2px solid', borderRight: '2px solid', borderColor: 'divider', borderBottomRightRadius: 6 }} />
            {/* Center stem */}
            <Box sx={{ position: 'absolute', top: '50%', left: '50%', width: '50%', borderBottom: '2px solid', borderColor: 'divider', mt: '-1px' }} />

            {/* Lit lines - Golden Path for SF1 */}
            {revealedCount >= 1 && (
              <Box component={m.div} animate={{ opacity: 1 }} sx={{ 
                position: 'absolute', top: 34, bottom: '50%', left: 0, right: '50%', 
                borderTop: '2px solid', borderRight: '2px solid', borderColor: 'warning.main', 
                borderTopRightRadius: 6, opacity: 0, transition: 'all 0.4s',
                boxShadow: (t) => `0 -2px 8px ${varAlpha(t.vars.palette.warning.mainChannel, 0.4)}`
              }} />
            )}
            {revealedCount >= 2 && <Box component={m.div} animate={{ opacity: 1 }} sx={{ position: 'absolute', top: '50%', bottom: 34, left: 0, right: '50%', borderBottom: '2px solid', borderRight: '2px solid', borderColor: 'success.main', borderBottomRightRadius: 6, opacity: 0, transition: 'all 0.4s' }} />}
            {revealedCount >= 2 && (
              <Box component={m.div} initial={{ width: 0 }} animate={{ width: '50%' }} sx={{ 
                position: 'absolute', top: '50%', left: '50%', borderBottom: '2px solid', 
                borderColor: 'warning.main', mt: '-1px',
                boxShadow: (t) => `2px 0 8px ${varAlpha(t.vars.palette.warning.mainChannel, 0.4)}`
              }} />
            )}
         </Box>

         {/* Final */}
         <Stack justifyContent="center" sx={{ flex: 2.5, position: 'relative' }}>
            <NodeCard match={FINAL} index={3} revealedCount={revealedCount} />
         </Stack>

         {/* Connector Final -> Champ */}
         <Box sx={{ position: 'relative', flex: 0.4, minWidth: 12 }}>
            <Box sx={{ position: 'absolute', top: '50%', left: 0, width: '100%', borderBottom: '2px solid', borderColor: 'divider', mt: '-1px' }} />
            {revealedCount >= 3 && (
              <Box component={m.div} initial={{ width: 0 }} animate={{ width: '100%' }} sx={{ 
                position: 'absolute', top: '50%', left: 0, borderBottom: '2px solid', 
                borderColor: 'warning.main', mt: '-1px',
                boxShadow: (t) => `0 4px 12px ${varAlpha(t.vars.palette.warning.mainChannel, 0.5)}`
              }} />
            )}
         </Box>

         {/* Champion Box */}
         <Stack justifyContent="center" sx={{ flex: 1.5, pl: 0.5 }}>
            <AnimatePresence>
               {revealedCount >= 4 && (
                  <Box
                    component={m.div}
                    initial={{ scale: 0.5, opacity: 0, x: -10 }}
                    animate={{ scale: 1.1, opacity: 1, x: 0 }}
                    exit={{ scale: 0.5, opacity: 0, x: -10 }}
                    transition={{ type: 'spring', damping: 15 }}
                    sx={{ position: 'relative', textAlign: 'center', bgcolor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.1), border: '2px solid', borderColor: 'warning.main', borderRadius: 1.5, py: 1.5, px: 0.5, boxShadow: (t) => `0 8px 32px ${varAlpha(t.vars.palette.warning.mainChannel, 0.4)}` }}
                  >
                     <Sunburst />
                     <Confetti />
                     <Iconify icon="solar:cup-star-bold" width={32} sx={{ color: 'warning.main', mb: 1, animation: 'bounce 2s infinite', '@keyframes bounce': { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } } }} />
                     <Typography variant="caption" sx={{ display: 'block', fontWeight: 900, color: 'warning.dark', mt: 0.5, lineHeight: 1.1, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 1 }}>
                        ¡Campeón!
                     </Typography>
                     <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, mt: 0.5, fontSize: '0.75rem', color: 'text.primary' }} noWrap>
                        {CHAMP}
                     </Typography>
                  </Box>
               )}
            </AnimatePresence>
         </Stack>

      </Stack>
    </Box>
  );
}

const STEP_PREVIEWS = { configure: ConfigPreview, teams: TeamsPreview, groups: GroupsPreview, knockout: KnockoutPreview };

// ─── CLUB PREVIEW COMPONENTS ─────────────────────────────────────────

const PAYMENT_MEMBERS = [
  { name: 'Carlos Mendoza', amount: 45000, avatar: 'CM' },
  { name: 'Luis García', amount: 45000, avatar: 'LG' },
  { name: 'Pedro Torres', amount: 45000, avatar: 'PT' },
  { name: 'Juan Ramírez', amount: 45000, avatar: 'JR' },
  { name: 'Diego López', amount: 45000, avatar: 'DL' },
];

function PaymentsPreview() {
  const [paidCount, setPaidCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPaidCount((prev) => (prev >= PAYMENT_MEMBERS.length ? 0 : prev + 1));
    }, 1100);
    return () => clearInterval(timer);
  }, []);

  const total = paidCount * 45000;
  const pct = Math.round((paidCount / PAYMENT_MEMBERS.length) * 100);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', fontSize: '0.65rem' }}>
          Cuota Mensual · Abril 2026
        </Typography>
        <Box sx={{ px: 1.25, py: 0.5, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.success.mainChannel, 0.1), border: (t) => `1px solid ${varAlpha(t.vars.palette.success.mainChannel, 0.2)}` }}>
          <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.65rem' }}>
            ${total.toLocaleString()} recaudados
          </Typography>
        </Box>
      </Stack>

      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
        <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.12), overflow: 'hidden' }}>
          <Box
            component={m.div}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            sx={{ height: '100%', bgcolor: 'success.main', borderRadius: 3 }}
          />
        </Box>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main', fontSize: '0.7rem', flexShrink: 0 }}>
          {pct}%
        </Typography>
      </Stack>

      <Stack spacing={0.85}>
        {PAYMENT_MEMBERS.map((member, idx) => {
          const isPaid = idx < paidCount;
          return (
            <Stack
              key={member.name}
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 0.875, borderRadius: 1,
                bgcolor: isPaid ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.05) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04),
                border: '1px solid',
                borderColor: isPaid ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.18) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.1),
                transition: 'all 0.4s ease',
              }}
            >
              <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: isPaid ? 'success.main' : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: isPaid ? 'common.white' : 'text.disabled', flexShrink: 0, transition: 'all 0.4s' }}>
                {member.avatar}
              </Box>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: isPaid ? 600 : 400, color: isPaid ? 'text.primary' : 'text.secondary', fontSize: '0.7rem', transition: 'all 0.4s' }}>
                {member.name}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem', color: isPaid ? 'success.main' : 'text.disabled', transition: 'color 0.4s' }}>
                ${member.amount.toLocaleString()}
              </Typography>
              <AnimatePresence mode="wait">
                {isPaid ? (
                  <Box component={m.div} key="paid" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                    <Iconify icon="eva:checkmark-circle-2-fill" width={16} sx={{ color: 'success.main' }} />
                  </Box>
                ) : (
                  <Box component={m.div} key="pending">
                    <Iconify icon="eva:clock-fill" width={16} sx={{ color: 'text.disabled' }} />
                  </Box>
                )}
              </AnimatePresence>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

const CALENDAR_DAYS_HEADER = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const CALENDAR_EVENTS = [
  { day: 7, type: 'training', label: 'Entrenamiento', color: 'info', time: '18:00' },
  { day: 10, type: 'match', label: 'vs Águilas FC', color: 'error', time: '16:00' },
  { day: 14, type: 'training', label: 'Entrenamiento', color: 'info', time: '18:00' },
  { day: 17, type: 'match', label: 'vs Rayo Azul', color: 'error', time: '15:00' },
  { day: 21, type: 'training', label: 'Entrenamiento', color: 'info', time: '18:00' },
  { day: 24, type: 'event', label: 'Reunión directiva', color: 'warning', time: '19:30' },
];

function CalendarPreview() {
  const [revealedEvents, setRevealedEvents] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRevealedEvents((prev) => (prev >= CALENDAR_EVENTS.length ? 0 : prev + 1));
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const getDayEvent = (day) => CALENDAR_EVENTS.find((ev, i) => ev.day === day && i < revealedEvents);

  // 5-week grid offset: April 2026 starts on Wednesday (offset=2)
  const GRID = Array.from({ length: 35 }, (_, i) => {
    const day = i - 1;
    return day >= 1 && day <= 30 ? day : null;
  });

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Abril 2026</Typography>
        <Stack direction="row" spacing={0.5}>
          <Iconify icon="eva:arrow-ios-back-fill" width={16} sx={{ color: 'text.disabled' }} />
          <Iconify icon="eva:arrow-ios-forward-fill" width={16} sx={{ color: 'text.disabled' }} />
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.75 }}>
        {CALENDAR_DAYS_HEADER.map((d) => (
          <Typography key={d} variant="caption" sx={{ textAlign: 'center', fontSize: '0.55rem', color: 'text.disabled', fontWeight: 600 }}>{d}</Typography>
        ))}
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.25 }}>
        {GRID.map((day, i) => {
          const event = day ? getDayEvent(day) : null;
          return (
            <Box key={i} sx={{
              height: 26, borderRadius: 0.75, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
              bgcolor: event ? (t) => varAlpha(t.vars.palette[event.color].mainChannel, 0.12) : 'transparent',
              border: event ? '1px solid' : '1px solid transparent',
              borderColor: event ? (t) => varAlpha(t.vars.palette[event.color].mainChannel, 0.3) : 'transparent',
              transition: 'all 0.35s ease',
            }}>
              {day && (
                <Typography variant="caption" sx={{ fontSize: '0.58rem', fontWeight: event ? 700 : 400, color: event ? `${event.color}.main` : 'text.secondary', transition: 'color 0.3s' }}>
                  {day}
                </Typography>
              )}
              {event && (
                <Box sx={{ position: 'absolute', bottom: 2, left: '50%', transform: 'translateX(-50%)', width: 3, height: 3, borderRadius: '50%', bgcolor: `${event.color}.main` }} />
              )}
            </Box>
          );
        })}
      </Box>

      <Divider sx={{ my: 1.5, borderStyle: 'dashed', borderColor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.2) }} />

      <Stack spacing={0.75}>
        <AnimatePresence>
          {CALENDAR_EVENTS.slice(0, Math.min(revealedEvents, 3)).map((ev, i) => (
            <Box
              component={m.div}
              key={ev.day}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ delay: i * 0.08 }}
              sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 0.75, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette[ev.color].mainChannel, 0.06) }}
            >
              <Box sx={{ width: 3, height: 24, borderRadius: 2, bgcolor: `${ev.color}.main`, flexShrink: 0 }} />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', display: 'block' }} noWrap>{ev.label}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem' }}>Día {ev.day} · {ev.time}</Typography>
              </Box>
              <Chip
                label={ev.type === 'match' ? 'PARTIDO' : ev.type === 'training' ? 'ENTREN.' : 'EVENTO'}
                size="small"
                color={ev.color}
                variant="soft"
                sx={{ height: 16, fontSize: '0.45rem', fontWeight: 700 }}
              />
            </Box>
          ))}
        </AnimatePresence>
      </Stack>
    </Box>
  );
}

const ASSISTS_PLAYERS = [
  { name: 'Carlos Mendoza', pos: 'POR', avatar: 'CM' },
  { name: 'Luis García', pos: 'DEF', avatar: 'LG' },
  { name: 'Pedro Torres', pos: 'DEF', avatar: 'PT' },
  { name: 'Juan Ramírez', pos: 'MED', avatar: 'JR' },
  { name: 'Diego López', pos: 'MED', avatar: 'DL' },
  { name: 'Miguel Ángel', pos: 'DEL', avatar: 'MA' },
];

function AssistsPreview() {
  const [markedCount, setMarkedCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMarkedCount((prev) => (prev >= ASSISTS_PLAYERS.length ? 0 : prev + 1));
    }, 900);
    return () => clearInterval(timer);
  }, []);

  const pct = Math.round((markedCount / ASSISTS_PLAYERS.length) * 100);
  const pctColor = pct > 80 ? 'success' : pct > 50 ? 'warning' : 'error';

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
        <Stack>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>Entrenamiento · Martes</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>7 Abril 2026 · 18:00</Typography>
        </Stack>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: `${pctColor}.main`, lineHeight: 1, transition: 'color 0.4s' }}>{pct}%</Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem' }}>asistencia</Typography>
        </Box>
      </Stack>

      <Box sx={{ mb: 2, height: 5, borderRadius: 3, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.1), overflow: 'hidden' }}>
        <Box
          component={m.div}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          sx={{ height: '100%', bgcolor: `${pctColor}.main`, borderRadius: 3, transition: 'background-color 0.4s' }}
        />
      </Box>

      <Stack spacing={0.75}>
        {ASSISTS_PLAYERS.map((player, idx) => {
          const isPresent = idx < markedCount;
          return (
            <Stack
              key={player.name}
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 0.75, borderRadius: 1,
                bgcolor: isPresent ? (t) => varAlpha(t.vars.palette.success.mainChannel, 0.04) : 'transparent',
                transition: 'background-color 0.4s',
              }}
            >
              <Box sx={{ width: 24, height: 24, borderRadius: '50%', bgcolor: isPresent ? 'success.main' : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.5rem', fontWeight: 700, color: isPresent ? 'common.white' : 'text.disabled', flexShrink: 0, transition: 'all 0.4s' }}>
                {player.avatar}
              </Box>
              <Typography variant="caption" sx={{ flex: 1, fontWeight: isPresent ? 600 : 400, color: isPresent ? 'text.primary' : 'text.secondary', fontSize: '0.68rem', transition: 'all 0.4s' }} noWrap>{player.name}</Typography>
              <Chip label={player.pos} size="small" variant="soft" color={isPresent ? 'success' : 'default'} sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700, transition: 'all 0.4s' }} />
              <AnimatePresence mode="wait">
                {isPresent ? (
                  <Box component={m.div} key="yes" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                    <Iconify icon="eva:checkmark-circle-2-fill" width={16} sx={{ color: 'success.main' }} />
                  </Box>
                ) : (
                  <Box component={m.div} key="no">
                    <Iconify icon="eva:radio-button-off-outline" width={16} sx={{ color: 'text.disabled' }} />
                  </Box>
                )}
              </AnimatePresence>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

const SHOP_PRODUCTS = [
  { name: 'Camiseta Local', price: 85000, icon: 'mdi:tshirt-crew', color: 'primary', stock: 24 },
  { name: 'Short Oficial', price: 45000, icon: 'mdi:human-male', color: 'info', stock: 18 },
  { name: 'Medias Club', price: 15000, icon: 'mdi:shoe-cleat', color: 'warning', stock: 42 },
  { name: 'Chaqueta Banca', price: 120000, icon: 'mdi:jacket', color: 'success', stock: 8 },
];

function ShopPreview() {
  const [cartCount, setCartCount] = useState(0);
  const [activeProduct, setActiveProduct] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveProduct((prev) => (prev + 1) % SHOP_PRODUCTS.length);
      setCartCount((prev) => (prev >= SHOP_PRODUCTS.length ? 0 : prev + 1));
    }, 1300);
    return () => clearInterval(timer);
  }, []);

  const cartTotal = SHOP_PRODUCTS.slice(0, cartCount).reduce((sum, p) => sum + p.price, 0);

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2, p: 1.25, borderRadius: 1.5, bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.06), border: (t) => `1px solid ${varAlpha(t.vars.palette.primary.mainChannel, 0.16)}` }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="solar:bag-bold-duotone" width={18} sx={{ color: 'primary.main' }} />
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Carrito del Club</Typography>
        </Stack>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Chip label={`${cartCount} items`} size="small" color="primary" variant="soft" sx={{ height: 18, fontSize: '0.6rem', fontWeight: 700 }} />
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', color: 'primary.main' }}>${cartTotal.toLocaleString()}</Typography>
        </Stack>
      </Stack>

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1 }}>
        {SHOP_PRODUCTS.map((product, idx) => {
          const inCart = idx < cartCount;
          const isActive = idx === activeProduct;
          return (
            <Card
              key={product.name}
              component={m.div}
              animate={{ scale: isActive ? 1.03 : 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              sx={{
                p: 1.25, boxShadow: 'none', position: 'relative', overflow: 'hidden',
                border: '1px solid',
                borderColor: inCart ? (t) => varAlpha(t.vars.palette[product.color].mainChannel, 0.3) : 'divider',
                bgcolor: inCart ? (t) => varAlpha(t.vars.palette[product.color].mainChannel, 0.04) : 'background.paper',
                transition: 'all 0.4s ease',
              }}
            >
              {inCart && (
                <Box
                  component={m.div}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 12 }}
                  sx={{ position: 'absolute', top: 4, right: 4 }}
                >
                  <Iconify icon="eva:checkmark-circle-2-fill" width={14} sx={{ color: `${product.color}.main` }} />
                </Box>
              )}
              <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette[product.color].mainChannel, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 0.75 }}>
                <Iconify icon={product.icon} width={16} sx={{ color: `${product.color}.main` }} />
              </Box>
              <Typography variant="caption" sx={{ display: 'block', fontWeight: 700, fontSize: '0.65rem', lineHeight: 1.2, mb: 0.25 }} noWrap>{product.name}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', color: `${product.color}.main` }}>${product.price.toLocaleString()}</Typography>
              <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled', fontSize: '0.55rem' }}>Stock: {product.stock}</Typography>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
}

const CLUB_DOCS = [
  { name: 'Contrato temporada', icon: 'mdi:file-sign', color: 'primary', size: '245 KB' },
  { name: 'Fichas médicas', icon: 'mdi:hospital-box-outline', color: 'error', size: '1.2 MB' },
  { name: 'Reglamento interno', icon: 'mdi:gavel', color: 'warning', size: '88 KB' },
  { name: 'Póliza de seguro', icon: 'mdi:shield-check-outline', color: 'success', size: '420 KB' },
  { name: 'Licencias jugadores', icon: 'mdi:card-account-details', color: 'info', size: '3.1 MB' },
];

function DocumentsPreview() {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [verifiedCount, setVerifiedCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          setVerifiedCount((vc) => {
            const next = vc + 1;
            return next > CLUB_DOCS.length ? 0 : next;
          });
          return 0;
        }
        return prev + 25;
      });
    }, 350);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box>
      <Box sx={{ mb: 2, p: 1.25, borderRadius: 1.5, border: '2px dashed', borderColor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.3), bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.04), textAlign: 'center' }}>
        <Iconify icon="solar:upload-minimalistic-bold-duotone" width={22} sx={{ color: 'primary.main', mb: 0.5 }} />
        <Typography variant="caption" sx={{ display: 'block', fontWeight: 600, fontSize: '0.65rem', mb: 0.75 }}>Subiendo documento...</Typography>
        <Box sx={{ height: 4, borderRadius: 2, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.12), overflow: 'hidden' }}>
          <Box
            component={m.div}
            animate={{ width: `${uploadProgress}%` }}
            transition={{ duration: 0.3 }}
            sx={{ height: '100%', bgcolor: 'primary.main', borderRadius: 2 }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>{uploadProgress}% completado</Typography>
      </Box>

      <Stack spacing={0.75}>
        {CLUB_DOCS.map((doc, idx) => {
          const isVerified = idx < verifiedCount;
          return (
            <Stack
              key={doc.name}
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{
                p: 0.75, borderRadius: 1,
                bgcolor: isVerified ? (t) => varAlpha(t.vars.palette[doc.color].mainChannel, 0.04) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04),
                border: '1px solid',
                borderColor: isVerified ? (t) => varAlpha(t.vars.palette[doc.color].mainChannel, 0.2) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.1),
                transition: 'all 0.4s ease',
              }}
            >
              <Box sx={{ width: 28, height: 28, borderRadius: 0.75, bgcolor: (t) => varAlpha(t.vars.palette[doc.color].mainChannel, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Iconify icon={doc.icon} width={16} sx={{ color: `${doc.color}.main` }} />
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="caption" sx={{ fontWeight: isVerified ? 600 : 400, fontSize: '0.68rem', display: 'block' }} noWrap>{doc.name}</Typography>
                <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.55rem' }}>{doc.size}</Typography>
              </Box>
              <AnimatePresence mode="wait">
                {isVerified ? (
                  <Box component={m.div} key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', damping: 12 }}>
                    <Chip label="Verificado" size="small" color={doc.color} variant="soft" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700 }} />
                  </Box>
                ) : (
                  <Box component={m.div} key="pending">
                    <Chip label="Pendiente" size="small" variant="soft" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 600 }} />
                  </Box>
                )}
              </AnimatePresence>
            </Stack>
          );
        })}
      </Stack>
    </Box>
  );
}

const CLUB_MATCHES = [
  { date: 'Sáb 10 Abr', time: '16:00', opponent: 'Águilas FC', venue: 'Estadio El Campin' },
  { date: 'Sáb 17 Abr', time: '15:00', opponent: 'Rayo Azul', venue: 'Cancha Norte' },
  { date: 'Dom 24 Abr', time: '11:00', opponent: 'Inter Club', venue: 'Campo Sur' },
];
const CLUB_SQUAD = ['C. Mendoza', 'L. García', 'P. Torres', 'J. Ramírez', 'D. López', 'M. Ángel', 'R. Soto', 'F. Castro', 'A. Vega', 'E. Mora', 'G. Reyes'];

function ClubMatchesPreview() {
  const [activeMatch, setActiveMatch] = useState(0);
  const [convocados, setConvocados] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMatch((prev) => (prev + 1) % CLUB_MATCHES.length);
      setConvocados(0);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (convocados < 11) {
      const timer = setTimeout(() => setConvocados((prev) => prev + 1), 180);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [convocados, activeMatch]);

  const match = CLUB_MATCHES[activeMatch];

  return (
    <Box>
      <Stack direction="row" spacing={0.75} sx={{ mb: 2 }}>
        {CLUB_MATCHES.map((mt, idx) => (
          <Box
            key={idx}
            onClick={() => { setActiveMatch(idx); setConvocados(0); }}
            sx={{
              flex: 1, p: 0.75, borderRadius: 1, cursor: 'pointer', textAlign: 'center',
              bgcolor: idx === activeMatch ? (t) => varAlpha(t.vars.palette.error.mainChannel, 0.08) : 'transparent',
              border: '1px solid',
              borderColor: idx === activeMatch ? (t) => varAlpha(t.vars.palette.error.mainChannel, 0.3) : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.12),
              transition: 'all 0.3s',
            }}
          >
            <Typography variant="caption" sx={{ fontSize: '0.55rem', fontWeight: 700, color: idx === activeMatch ? 'error.main' : 'text.disabled', display: 'block' }}>
              {mt.date.split(' ')[0]}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: '0.6rem', fontWeight: idx === activeMatch ? 700 : 500, color: idx === activeMatch ? 'text.primary' : 'text.secondary' }} noWrap>
              {mt.opponent}
            </Typography>
          </Box>
        ))}
      </Stack>

      <AnimatePresence mode="wait">
        <Box
          component={m.div}
          key={activeMatch}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
        >
          <Card sx={{ p: 1.5, mb: 1.5, boxShadow: 'none', border: (t) => `1px solid ${varAlpha(t.vars.palette.error.mainChannel, 0.2)}`, bgcolor: (t) => varAlpha(t.vars.palette.error.mainChannel, 0.02) }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.25 }}>
              <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem', color: 'error.main' }}>{match.date} · {match.time}</Typography>
              <Chip label="PRÓXIMO" size="small" color="error" variant="soft" sx={{ height: 16, fontSize: '0.5rem', fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 0.5 }}>
                  <Typography sx={{ color: 'common.white', fontWeight: 800, fontSize: '0.55rem' }}>SM</Typography>
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem' }} noWrap>SportsManagement FC</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'text.disabled', fontSize: '0.9rem' }}>vs</Typography>
              <Box sx={{ flex: 1, textAlign: 'center' }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.16), display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 0.5 }}>
                  <Iconify icon="mdi:shield-outline" width={16} sx={{ color: 'text.disabled' }} />
                </Box>
                <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.65rem' }} noWrap>{match.opponent}</Typography>
              </Box>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Iconify icon="mdi:map-marker-outline" width={12} sx={{ color: 'text.disabled' }} />
              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>{match.venue}</Typography>
            </Stack>
          </Card>

          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', color: 'text.secondary', textTransform: 'uppercase' }}>Convocatoria</Typography>
            <Typography variant="caption" sx={{ color: 'success.main', fontWeight: 700, fontSize: '0.65rem' }}>{convocados}/11</Typography>
          </Stack>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {CLUB_SQUAD.map((player, idx) => (
              <AnimatePresence key={player}>
                {idx < convocados && (
                  <Box
                    component={m.div}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', damping: 15, delay: idx * 0.04 }}
                  >
                    <Chip label={player} size="small" variant="soft" color="success" sx={{ height: 18, fontSize: '0.5rem', fontWeight: 600 }} />
                  </Box>
                )}
              </AnimatePresence>
            ))}
          </Box>
        </Box>
      </AnimatePresence>
    </Box>
  );
}

const CLUB_STEP_PREVIEWS = {
  payments: PaymentsPreview,
  calendar: CalendarPreview,
  assists: AssistsPreview,
  shop: ShopPreview,
  documents: DocumentsPreview,
  matches: ClubMatchesPreview,
};

// ─── ANIMATED DIV HELPER ─────────────────────────────────────────────

function AnimatedDiv({ children }) {
  return (
    <Box component={m.div} variants={varFade({ distance: 24 }).inUp}>
      {children}
    </Box>
  );
}

// ─── MAIN LANDING PAGE ──────────────────────────────────────────────

export function LandingPage() {
  const theme = useTheme();
  const pageProgress = useScrollProgress();

  // Hero domain auto-cycle
  const [heroDomain, setHeroDomain] = useState('tournaments');

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroDomain((prev) => (prev === 'tournaments' ? 'clubs' : 'tournaments'));
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  // Features tab toggle + auto-cycle
  const [featTab, setFeatTab] = useState('tournaments');

  useEffect(() => {
    const timer = setInterval(() => {
      setFeatTab((prev) => (prev === 'tournaments' ? 'clubs' : 'tournaments'));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Tournament lifecycle auto-cycle
  const [activeStep, setActiveStep] = useState(0);

  // Club features auto-cycle
  const [activeClubStep, setActiveClubStep] = useState(0);

  return (
    <>
      <ScrollProgress
        variant="linear"
        progress={pageProgress.scrollYProgress}
        sx={{ position: 'fixed' }}
      />

      <BackToTop />

      <StickyNav />

      {/* ── HERO ── */}
      <Box
        component="section"
        sx={{
          overflow: 'hidden',
          position: 'relative',
          minHeight: { md: 760 },
          display: 'flex',
          alignItems: 'center',
          pt: { xs: 18, md: 0 },
          pb: { xs: 10, md: 0 },
          height: { md: '100vh' },
          maxHeight: { md: 1440 },
        }}
      >
        <Container component={MotionContainer} sx={{ position: 'relative', zIndex: 9 }}>
          <Grid container columnSpacing={{ xs: 0, md: 8 }} alignItems="center">
            {/* Text */}
            <Grid xs={12} md={6}>
              <Stack spacing={3}>
                <AnimatedDiv>
                  <Box
                    component="h1"
                    sx={{
                      ...theme.typography.h2,
                      m: 0,
                      fontFamily: theme.typography.fontSecondaryFamily,
                      fontSize: { xs: 40, md: 56, lg: 64 },
                      lineHeight: 1.1,
                    }}
                  >
                    Gestiona tu{' '}
                    <Box
                      component="span"
                      sx={(t) => ({
                        ...textGradient(
                          `135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.info.main} 100%`
                        ),
                      })}
                    >
                      Club
                    </Box>{' '}
                    y tus
                    <br />
                    <Box
                      component="span"
                      sx={(t) => ({
                        ...textGradient(
                          `135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.info.main} 100%`
                        ),
                      })}
                    >
                      Torneos
                    </Box>{' '}
                    como nunca antes
                  </Box>
                </AnimatedDiv>

                <AnimatedDiv>
                  <Typography
                    variant="body1"
                    sx={{ color: 'text.secondary', maxWidth: 480, fontSize: { md: 18 } }}
                  >
                    La plataforma todo-en-uno para clubes y torneos deportivos. Crea torneos, sigue resultados
                    en tiempo real y gestiona toda tu liga — con estilo.
                  </Typography>
                </AnimatedDiv>

                <AnimatedDiv>
                  <Stack direction="row" spacing={2} flexWrap="wrap">
                    <Button
                      size="large"
                      variant="contained"
                      color="primary"
                      href="/auth/amplify/sign-up"
                      startIcon={<Iconify icon="solar:rocket-bold" width={20} />}
                      sx={{
                        px: 3, borderRadius: 2,
                        boxShadow: (t) => `0 8px 24px ${varAlpha(t.vars.palette.primary.mainChannel, 0.36)}`,
                      }}
                    >
                      Empieza ahora
                    </Button>
                    <Button
                      size="large"
                      variant="outlined"
                      color="inherit"
                      href="#lifecycle"
                      startIcon={<Iconify icon="solar:play-circle-bold" width={20} />}
                      sx={{ px: 3, borderRadius: 2 }}
                    >
                      Ver cómo funciona
                    </Button>
                  </Stack>
                </AnimatedDiv>

                <AnimatedDiv>
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    {[
                      { icon: 'solar:star-bold', label: 'Gestión guiada' },
                      { icon: 'solar:shield-check-bold', label: 'Sin tarjeta de crédito' },
                      { icon: 'solar:lock-password-bold', label: 'Datos seguros' },
                    ].map((badge) => (
                      <Stack key={badge.label} direction="row" alignItems="center" spacing={0.75}>
                        <Iconify icon={badge.icon} width={14} sx={{ color: 'text.disabled' }} />
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>
                          {badge.label}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </AnimatedDiv>
              </Stack>
            </Grid>

            {/* Hero visual — live mini-dashboard */}
            <Grid xs={12} md={6} sx={{ mt: { xs: 5, md: 0 }, position: 'relative' }}>
              <Box
                component={m.div}
                initial={{ opacity: 0, y: 48, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.9, delay: 0.3, ease: 'easeOut' }}
                sx={{ position: 'relative', zIndex: 2 }}
              >
                <Card sx={{
                  borderRadius: 3, overflow: 'hidden',
                  border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                  boxShadow: (t) => `0 32px 64px -12px ${varAlpha(t.vars.palette.common.blackChannel, 0.22)}`,
                }}>
                  {/* Window chrome */}
                  <Box sx={{ px: 2, py: 1.25, borderBottom: '1px solid', borderColor: 'divider', bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.04), display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {['error', 'warning', 'success'].map((c) => (
                      <Box key={c} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: `${c}.main`, opacity: 0.7 }} />
                    ))}
                    <Box sx={{ flex: 1, height: 22, mx: 2, borderRadius: 0.75, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.6rem' }}>app.sportsmanagement.co</Typography>
                    </Box>
                    <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: 'error.main', flexShrink: 0, animation: 'pulse 1s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                  </Box>

                  {/* Domain tabs */}
                  <Box sx={{ px: 2, borderBottom: '1px solid', borderColor: 'divider', bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.02) }}>
                    <Stack direction="row">
                      {[
                        { key: 'tournaments', label: 'Torneos', icon: 'solar:cup-star-bold-duotone', color: 'primary' },
                        { key: 'clubs', label: 'Clubes', icon: 'solar:shield-bold-duotone', color: 'info' },
                      ].map((tab) => {
                        const isActive = heroDomain === tab.key;
                        return (
                          <Box
                            key={tab.key}
                            onClick={() => setHeroDomain(tab.key)}
                            sx={{
                              px: 2, py: 1, cursor: 'pointer', position: 'relative',
                              borderBottom: '2px solid',
                              borderColor: isActive ? `${tab.color}.main` : 'transparent',
                              transition: 'border-color 0.25s',
                            }}
                          >
                            <Stack direction="row" alignItems="center" spacing={0.75}>
                              <Iconify icon={tab.icon} width={13} sx={{ color: isActive ? `${tab.color}.main` : 'text.disabled', transition: 'color 0.25s' }} />
                              <Typography variant="caption" sx={{ fontWeight: isActive ? 700 : 500, color: isActive ? 'text.primary' : 'text.secondary', fontSize: '0.65rem', transition: 'color 0.25s' }}>
                                {tab.label}
                              </Typography>
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>

                  {/* Swappable content — rich dashboard components */}
                  <AnimatePresence mode="wait">
                    <Box
                      component={m.div}
                      key={heroDomain}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.28 }}
                    >
                      {heroDomain === 'tournaments' ? <HeroDashboardTournament /> : <HeroDashboardClub />}
                    </Box>
                  </AnimatePresence>
                </Card>

                {/* Floating badge — swaps with domain */}
                <Box
                  component={m.div}
                  initial={{ opacity: 0, scale: 0.8, x: 20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.1, type: 'spring', damping: 16 }}
                  sx={{ position: 'absolute', top: -16, right: { xs: 0, md: -16 }, zIndex: 10 }}
                >
                  <AnimatePresence mode="wait">
                    <Box component={m.div} key={heroDomain} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.25 }}>
                      {heroDomain === 'tournaments' ? (
                        <Card sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.3), bgcolor: (t) => varAlpha(t.vars.palette.warning.mainChannel, 0.08), backdropFilter: 'blur(16px)' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'warning.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon="solar:cup-star-bold" width={18} sx={{ color: 'common.white' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', display: 'block', color: 'warning.dark' }}>¡Campeón!</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>SportsManagement FC</Typography>
                            </Box>
                          </Stack>
                        </Card>
                      ) : (
                        <Card sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.success.mainChannel, 0.3), bgcolor: (t) => varAlpha(t.vars.palette.success.mainChannel, 0.08), backdropFilter: 'blur(16px)' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 32, height: 32, borderRadius: '50%', bgcolor: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon="solar:card-bold" width={18} sx={{ color: 'common.white' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 800, fontSize: '0.7rem', display: 'block', color: 'success.dark' }}>Pago recibido</Typography>
                              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.6rem' }}>+$45.000 · Carlos M.</Typography>
                            </Box>
                          </Stack>
                        </Card>
                      )}
                    </Box>
                  </AnimatePresence>
                </Box>

                {/* Floating notification — swaps with domain */}
                <Box
                  component={m.div}
                  initial={{ opacity: 0, scale: 0.8, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 1.4, type: 'spring', damping: 16 }}
                  sx={{ position: 'absolute', bottom: -16, left: { xs: 0, md: -16 }, zIndex: 10 }}
                >
                  <AnimatePresence mode="wait">
                    <Box component={m.div} key={heroDomain} initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={{ duration: 0.25 }}>
                      {heroDomain === 'tournaments' ? (
                        <Card sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.2), backdropFilter: 'blur(16px)' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon="solar:bell-bold-duotone" width={16} sx={{ color: 'primary.main' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>¡Nuevo gol!</Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.58rem' }}>T. Müller · min 67</Typography>
                            </Box>
                          </Stack>
                        </Card>
                      ) : (
                        <Card sx={{ p: 1.5, borderRadius: 2, border: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.info.mainChannel, 0.2), backdropFilter: 'blur(16px)' }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: (t) => varAlpha(t.vars.palette.info.mainChannel, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Iconify icon="solar:calendar-bold-duotone" width={16} sx={{ color: 'info.main' }} />
                            </Box>
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.65rem', display: 'block' }}>Entrenamiento hoy</Typography>
                              <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.58rem' }}>Campo Norte · 18:00</Typography>
                            </Box>
                          </Stack>
                        </Card>
                      )}
                    </Box>
                  </AnimatePresence>
                </Box>
              </Box>

              {/* Ambient glow — color shifts with domain */}
              <Box sx={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', filter: 'blur(100px)', top: '5%', right: '5%', pointerEvents: 'none', background: (t) => varAlpha(heroDomain === 'tournaments' ? t.vars.palette.primary.mainChannel : t.vars.palette.info.mainChannel, 0.1), zIndex: 0, transition: 'background 1s ease' }} />
              <Box sx={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', filter: 'blur(100px)', bottom: '10%', left: '5%', pointerEvents: 'none', background: (t) => varAlpha(heroDomain === 'tournaments' ? t.vars.palette.info.mainChannel : t.vars.palette.success.mainChannel, 0.08), zIndex: 0, transition: 'background 1s ease' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ── SOCIAL PROOF STRIP ── */}
      <Box sx={{ borderTop: '1px solid', borderBottom: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.06), py: 4, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.02) }}>
        <Container>
          <Stack direction={{ xs: 'column', md: 'row' }} alignItems="center" spacing={{ xs: 2.5, md: 5 }} justifyContent="center">
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.5, flexShrink: 0 }}>
              Con la confianza de
            </Typography>
            <Stack direction="row" spacing={{ xs: 4, md: 6 }} alignItems="center" flexWrap="wrap" justifyContent="center">
              {['Club Deportivo Vittoria', 'Rimberio Club Deportivo', 'Torneo Federativo Rosario', 'Borcelle escuela de Baloncesto'].map((name) => (
                <Typography key={name} variant="subtitle2" sx={{ color: (t) => varAlpha(t.vars.palette.text.primaryChannel, 0.28), fontWeight: 800, whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                  {name}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* ── REST OF PAGE ── */}
      <Stack sx={{ position: 'relative', bgcolor: 'background.default' }}>

        {/* ── FEATURES ── */}
        <Box component="section" id="features" sx={{ overflow: 'hidden', position: 'relative', py: { xs: 10, md: 16 }, bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.02) }}>
          <MotionViewport>
            <Container>
              {/* Header */}
              <Stack spacing={3} sx={{ mb: { xs: 5, md: 8 }, textAlign: 'center' }}>
                <AnimatedDiv>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    Funciones Principales
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="h2">
                    Todo lo que necesitas.{' '}
                    <Box component="span" sx={(t) => ({
                      ...textGradient(`to right, ${t.vars.palette.text.primary}, ${varAlpha(t.vars.palette.text.primaryChannel, 0.2)}`),
                    })}>
                      Nada que no.
                    </Box>
                  </Typography>
                </AnimatedDiv>

                {/* Pill toggle */}
                <AnimatedDiv>
                  <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Box sx={{
                      display: 'inline-flex', p: 0.625, borderRadius: 2.5,
                      bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.08),
                      border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                    }}>
                      {FEAT_TABS.map((tab) => {
                        const isActive = featTab === tab.key;
                        return (
                          <Box
                            key={tab.key}
                            onClick={() => setFeatTab(tab.key)}
                            sx={{ position: 'relative', px: { xs: 2.5, md: 3.5 }, py: 1.25, borderRadius: 2, cursor: 'pointer', userSelect: 'none' }}
                          >
                            {isActive && (
                              <Box
                                component={m.div}
                                layoutId="feat-tab-bg"
                                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                                sx={{
                                  position: 'absolute', inset: 0, borderRadius: 2,
                                  bgcolor: 'background.paper',
                                  boxShadow: (t) => `0 2px 8px ${varAlpha(t.vars.palette.common.blackChannel, 0.1)}`,
                                }}
                              />
                            )}
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ position: 'relative', zIndex: 1 }}>
                              <Iconify
                                icon={tab.icon}
                                width={18}
                                sx={{ color: isActive ? `${tab.color}.main` : 'text.disabled', transition: 'color 0.25s' }}
                              />
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: isActive ? 'text.primary' : 'text.secondary', transition: 'color 0.25s' }}>
                                {tab.label}
                              </Typography>
                            </Stack>
                            {/* Auto-cycle progress bar */}
                            {isActive && (
                              <Box
                                component={m.div}
                                key={featTab}
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 5, ease: 'linear' }}
                                sx={{
                                  position: 'absolute', bottom: 4, left: 8, right: 8, height: 2,
                                  bgcolor: `${tab.color}.main`, borderRadius: 1,
                                  transformOrigin: 'left', opacity: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                </AnimatedDiv>

                {/* Dynamic subtitle */}
                <AnimatedDiv>
                  <AnimatePresence mode="wait">
                    <Box
                      component={m.div}
                      key={featTab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520, mx: 'auto' }}>
                        {featTab === 'tournaments'
                          ? 'Desde fixtures automáticos hasta llaves finales — cada fase de tu torneo bajo control.'
                          : 'Pagos, asistencias, tienda y documentos — administra tu club sin salir de la plataforma.'}
                      </Typography>
                    </Box>
                  </AnimatePresence>
                </AnimatedDiv>
              </Stack>

              {/* Animated grid */}
              <Grid container spacing={3}>
                {(featTab === 'tournaments' ? TOURNAMENT_FEATURES : CLUB_FEATURES).map((feat, idx) => (
                  <Grid xs={12} sm={6} md={4} key={`${featTab}-${feat.title}`}>
                    <Card
                      sx={{
                        p: 4, height: 1, borderRadius: 3, cursor: 'default',
                        bgcolor: (th) => varAlpha(th.vars.palette.background.defaultChannel, 0.9),
                        backdropFilter: 'blur(20px)',
                        border: (th) => `1px solid ${varAlpha(th.vars.palette.grey['500Channel'], 0.08)}`,
                        transition: 'box-shadow 0.2s, transform 0.2s, border-color 0.2s',
                        '&:hover': {
                          transform: 'translateY(-8px)',
                          borderColor: (th) => varAlpha(th.vars.palette[feat.color].mainChannel, 0.24),
                          boxShadow: (th) => `0 12px 24px -4px ${varAlpha(th.vars.palette[feat.color].mainChannel, 0.12)}`,
                        },
                      }}
                    >
                      <Box sx={{
                        width: 56, height: 56, mb: 3, display: 'flex',
                        borderRadius: 2, alignItems: 'center', justifyContent: 'center',
                        background: (th) => `linear-gradient(135deg, ${varAlpha(th.vars.palette[feat.color].mainChannel, 0.16)} 0%, ${varAlpha(th.vars.palette[feat.color].mainChannel, 0.04)} 100%)`,
                      }}>
                        <Iconify icon={feat.icon} width={28} sx={{ color: `${feat.color}.main` }} />
                      </Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>{feat.title}</Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{feat.desc}</Typography>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </MotionViewport>
        </Box>

        {/* ── TOURNAMENT LIFECYCLE ── */}
        <Box component="section" id="lifecycle" sx={{ overflow: 'hidden', position: 'relative', py: { xs: 10, md: 16 } }}>
          <MotionViewport>
            <Container>
              <Stack spacing={3} sx={{ mb: { xs: 5, md: 8 }, textAlign: { xs: 'center', md: 'left' } }}>
                <AnimatedDiv>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    Ciclo de Vida del Torneo
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="h2">
                    Cuatro pasos a la{' '}
                    <Box component="span" sx={(t) => ({
                      ...textGradient(`135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.success.main} 100%`),
                    })}>
                      gloria
                    </Box>
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500 }}>
                    Desde la creación hasta el campeón — mira cómo SportsManagementment te guía en cada fase
                    de tu torneo.
                  </Typography>
                </AnimatedDiv>
              </Stack>

              <Grid container columnSpacing={{ xs: 0, md: 6 }} sx={{ position: 'relative', zIndex: 9, minHeight: 420 }}>
                {/* Left — Stepper */}
                <Grid xs={12} md={4}>
                  <Box component={m.div} variants={varFade({ distance: 24 }).inLeft}>
                    <Stack spacing={0.5}>
                      {LIFECYCLE_STEPS.map((step, idx) => {
                        const isActive = activeStep === idx;
                        const isDone = idx < activeStep;
                        return (
                          <Box key={step.key}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                              onClick={() => setActiveStep(idx)}
                              sx={{
                                px: 2,
                                py: 1.5,
                                borderRadius: 1.5,
                                cursor: 'pointer',
                                bgcolor: isActive
                                  ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.08)
                                  : 'transparent',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                  bgcolor: (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.04),
                                },
                              }}
                            >
                              {/* Step indicator */}
                              <Box sx={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: (t) => `2px solid ${
                                  isDone || isActive
                                    ? t.palette[step.color].main
                                    : varAlpha(t.vars.palette.grey['500Channel'], 0.24)
                                }`,
                                bgcolor: isDone ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.12) : 'transparent',
                                color: isDone || isActive ? `${step.color}.main` : 'text.disabled',
                                transition: 'all 0.3s',
                                ...(isActive && {
                                  boxShadow: (t) => `0 0 0 4px ${varAlpha(t.vars.palette[step.color].mainChannel, 0.12)}`,
                                }),
                              }}>
                                {isDone ? (
                                  <Iconify icon="eva:checkmark-fill" width={16} />
                                ) : (
                                  <Iconify icon={step.icon} width={18} />
                                )}
                              </Box>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{
                                  fontWeight: isActive || isDone ? 700 : 500,
                                  color: isActive || isDone ? 'text.primary' : 'text.secondary',
                                }}>
                                  {step.title}
                                </Typography>
                                {isActive && (
                                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                    {step.desc}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>

                            {/* Connector */}
                            {idx < LIFECYCLE_STEPS.length - 1 && (
                              <Box sx={{
                                width: '2px', height: 16, ml: '35px',
                                bgcolor: isDone
                                  ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.3)
                                  : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.12),
                                transition: 'background-color 0.3s',
                              }} />
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Grid>

                {/* Right — Preview card */}
                <Grid xs={12} md={8} sx={{ mt: { xs: 4, md: 0 } }}>
                  <Box component={m.div} variants={varFade({ distance: 24 }).inRight}>
                    <Card sx={{
                      p: 3,
                      borderRadius: 3,
                      minHeight: 360,
                      bgcolor: (t) => varAlpha(t.vars.palette.background.defaultChannel, 0.9),
                      backdropFilter: 'blur(20px)',
                      border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: 1, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          bgcolor: (t) => varAlpha(t.vars.palette[LIFECYCLE_STEPS[activeStep].color].mainChannel, 0.12),
                        }}>
                          <Iconify
                            icon={LIFECYCLE_STEPS[activeStep].icon}
                            width={18}
                            sx={{ color: `${LIFECYCLE_STEPS[activeStep].color}.main` }}
                          />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {LIFECYCLE_STEPS[activeStep].title}
                        </Typography>
                        <Chip
                          label={`Paso ${activeStep + 1}/4`}
                          size="small"
                          color={LIFECYCLE_STEPS[activeStep].color}
                          variant="soft"
                          sx={{ ml: 'auto', height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      </Stack>

                      <AnimatePresence mode="wait">
                        <Box
                          component={m.div}
                          key={LIFECYCLE_STEPS[activeStep].key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.35 }}
                        >
                          {(() => {
                            const Preview = STEP_PREVIEWS[LIFECYCLE_STEPS[activeStep].key];
                            return <Preview theme={theme} />;
                          })()}
                        </Box>
                      </AnimatePresence>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </MotionViewport>
        </Box>

        {/* ── CLUB FEATURES ── */}
        <Box component="section" id="clubs" sx={{ overflow: 'hidden', position: 'relative', py: { xs: 10, md: 16 } }}>
          <MotionViewport>
            <Container>
              <Stack spacing={3} sx={{ mb: { xs: 5, md: 8 }, textAlign: { xs: 'center', md: 'right' } }}>
                <AnimatedDiv>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    Gestión de Clubes
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="h2">
                    Tu club,{' '}
                    <Box component="span" sx={(t) => ({
                      ...textGradient(`135deg, ${t.vars.palette.info.main} 0%, ${t.vars.palette.success.main} 100%`),
                    })}>
                      todo en uno
                    </Box>
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 500, ml: { md: 'auto' } }}>
                    Pagos, asistencias, documentos, tienda y más — SportsManagement centraliza todo lo que
                    necesitas para administrar tu club sin complicaciones.
                  </Typography>
                </AnimatedDiv>
              </Stack>

              <Grid container columnSpacing={{ xs: 0, md: 6 }} sx={{ position: 'relative', zIndex: 9, minHeight: 480 }} direction={{ md: 'row-reverse' }}>
                {/* Right (reversed) — Stepper */}
                <Grid xs={12} md={4}>
                  <Box component={m.div} variants={varFade({ distance: 24 }).inRight}>
                    <Stack spacing={0.5}>
                      {CLUB_STEPS.map((step, idx) => {
                        const isActive = activeClubStep === idx;
                        const isDone = idx < activeClubStep;
                        return (
                          <Box key={step.key}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              spacing={1.5}
                              onClick={() => setActiveClubStep(idx)}
                              sx={{
                                px: 2, py: 1.5, borderRadius: 1.5, cursor: 'pointer',
                                bgcolor: isActive
                                  ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.08)
                                  : 'transparent',
                                transition: 'all 0.25s ease',
                                '&:hover': {
                                  bgcolor: (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.04),
                                },
                              }}
                            >
                              <Box sx={{
                                width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: (t) => `2px solid ${isDone || isActive ? t.palette[step.color].main : varAlpha(t.vars.palette.grey['500Channel'], 0.24)}`,
                                bgcolor: isDone ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.12) : 'transparent',
                                color: isDone || isActive ? `${step.color}.main` : 'text.disabled',
                                transition: 'all 0.3s',
                                ...(isActive && {
                                  boxShadow: (t) => `0 0 0 4px ${varAlpha(t.vars.palette[step.color].mainChannel, 0.12)}`,
                                }),
                              }}>
                                {isDone ? (
                                  <Iconify icon="eva:checkmark-fill" width={16} />
                                ) : (
                                  <Iconify icon={step.icon} width={18} />
                                )}
                              </Box>

                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="subtitle2" sx={{
                                  fontWeight: isActive || isDone ? 700 : 500,
                                  color: isActive || isDone ? 'text.primary' : 'text.secondary',
                                }}>
                                  {step.title}
                                </Typography>
                                {isActive && (
                                  <Typography variant="caption" sx={{ color: 'text.disabled', display: 'block' }}>
                                    {step.desc}
                                  </Typography>
                                )}
                              </Box>
                            </Stack>

                            {idx < CLUB_STEPS.length - 1 && (
                              <Box sx={{
                                width: '2px', height: 16, ml: '35px',
                                bgcolor: isDone
                                  ? (t) => varAlpha(t.vars.palette[step.color].mainChannel, 0.3)
                                  : (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.12),
                                transition: 'background-color 0.3s',
                              }} />
                            )}
                          </Box>
                        );
                      })}
                    </Stack>
                  </Box>
                </Grid>

                {/* Left (reversed) — Preview card */}
                <Grid xs={12} md={8} sx={{ mt: { xs: 4, md: 0 } }}>
                  <Box component={m.div} variants={varFade({ distance: 24 }).inLeft}>
                    <Card sx={{
                      p: 3, borderRadius: 3, minHeight: 400,
                      bgcolor: (t) => varAlpha(t.vars.palette.background.defaultChannel, 0.9),
                      backdropFilter: 'blur(20px)',
                      border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.12)}`,
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: 1, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          bgcolor: (t) => varAlpha(t.vars.palette[CLUB_STEPS[activeClubStep].color].mainChannel, 0.12),
                        }}>
                          <Iconify
                            icon={CLUB_STEPS[activeClubStep].icon}
                            width={18}
                            sx={{ color: `${CLUB_STEPS[activeClubStep].color}.main` }}
                          />
                        </Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {CLUB_STEPS[activeClubStep].title}
                        </Typography>
                        <Chip
                          label={`${activeClubStep + 1}/${CLUB_STEPS.length}`}
                          size="small"
                          color={CLUB_STEPS[activeClubStep].color}
                          variant="soft"
                          sx={{ ml: 'auto', height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                        />
                      </Stack>

                      <AnimatePresence mode="wait">
                        <Box
                          component={m.div}
                          key={CLUB_STEPS[activeClubStep].key}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          transition={{ duration: 0.35 }}
                        >
                          {(() => {
                            const Preview = CLUB_STEP_PREVIEWS[CLUB_STEPS[activeClubStep].key];
                            return <Preview />;
                          })()}
                        </Box>
                      </AnimatePresence>
                    </Card>
                  </Box>
                </Grid>
              </Grid>
            </Container>
          </MotionViewport>
        </Box>

        {/* ── STATS ── */}
        <Box component="section" id="stats" sx={{ py: { xs: 10, md: 16 }, overflow: 'hidden', position: 'relative' }}>
          {/* Background decoration */}
          <Box sx={{ position: 'absolute', inset: 0, background: (t) => `linear-gradient(180deg, transparent 0%, ${varAlpha(t.vars.palette.primary.mainChannel, 0.03)} 50%, transparent 100%)`, pointerEvents: 'none' }} />
          <MotionViewport>
            <Container>
              <Stack spacing={3} sx={{ mb: { xs: 6, md: 10 }, textAlign: 'center' }}>
                <AnimatedDiv>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    Impacto Real
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="h2">
                    Números que{' '}
                    <Box component="span" sx={(t) => ({
                      ...textGradient(`135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.info.main} 100%`),
                    })}>
                      hablan solos
                    </Box>
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto' }}>
                    Cientos de clubes y organizadores ya confían en SportsManagement para llevar su deporte al siguiente nivel.
                  </Typography>
                </AnimatedDiv>
              </Stack>

              <Grid container spacing={3}>
                {STATS.map((stat) => (
                  <Grid xs={12} sm={6} md={12 / 5} key={stat.label}>
                    <Box component={m.div} variants={varFade({ distance: 24 }).inUp}>
                      <Card sx={{
                        p: { xs: 3, md: 4 }, textAlign: 'center', borderRadius: 3, height: 1,
                        border: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}`,
                        transition: (t) => t.transitions.create(['border-color', 'box-shadow', 'transform'], { duration: t.transitions.duration.shorter }),
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: (t) => varAlpha(t.vars.palette[stat.color].mainChannel, 0.24),
                          boxShadow: (t) => `0 12px 32px -4px ${varAlpha(t.vars.palette[stat.color].mainChannel, 0.16)}`,
                        },
                      }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2, mx: 'auto', mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', background: (t) => `linear-gradient(135deg, ${varAlpha(t.vars.palette[stat.color].mainChannel, 0.16)} 0%, ${varAlpha(t.vars.palette[stat.color].mainChannel, 0.04)} 100%)` }}>
                          <Iconify icon={stat.icon} width={24} sx={{ color: `${stat.color}.main` }} />
                        </Box>
                        <Typography variant="h3" sx={(t) => ({ mb: 0.5, ...textGradient(`135deg, ${t.vars.palette[stat.color].main} 0%, ${t.vars.palette[stat.color].dark} 100%`) })}>
                          <AnimateCountUp to={stat.value} duration={2.5} unit={stat.suffix} />
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          {stat.label}
                        </Typography>
                      </Card>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </MotionViewport>
        </Box>

        {/* ── TESTIMONIALS ── */}
        <Box component="section" sx={{ py: { xs: 10, md: 16 }, overflow: 'hidden' }}>
          <MotionViewport>
            <Container>
              <Stack spacing={3} sx={{ mb: { xs: 6, md: 10 }, textAlign: 'center' }}>
                <AnimatedDiv>
                  <Typography variant="overline" sx={{ color: 'text.disabled' }}>
                    Historias de Éxito
                  </Typography>
                </AnimatedDiv>
                <AnimatedDiv>
                  <Typography variant="h2">
                    Lo que dicen{' '}
                    <Box component="span" sx={(t) => ({
                      ...textGradient(`135deg, ${t.vars.palette.warning.main} 0%, ${t.vars.palette.error.main} 100%`),
                    })}>
                      nuestros usuarios
                    </Box>
                  </Typography>
                </AnimatedDiv>
              </Stack>

              <Grid container spacing={3}>
                {TESTIMONIALS.map((item) => (
                  <Grid xs={12} md={4} key={item.author}>
                    <Box component={m.div} variants={varFade({ distance: 24 }).inUp} sx={{ height: 1 }}>
                      <Card sx={{
                        p: 4, height: 1, borderRadius: 3, display: 'flex', flexDirection: 'column',
                        border: (th) => `1px solid ${varAlpha(th.vars.palette.grey['500Channel'], 0.08)}`,
                        transition: (th) => th.transitions.create(['border-color', 'box-shadow', 'transform'], { duration: th.transitions.duration.shorter }),
                        '&:hover': {
                          transform: 'translateY(-6px)',
                          borderColor: (th) => varAlpha(th.vars.palette[item.color].mainChannel, 0.24),
                          boxShadow: (th) => `0 16px 40px -8px ${varAlpha(th.vars.palette[item.color].mainChannel, 0.14)}`,
                        },
                      }}>
                        {/* Stars */}
                        <Stack direction="row" spacing={0.25} sx={{ mb: 2.5 }}>
                          {[...Array(5)].map((_, i) => (
                            <Iconify key={i} icon="solar:star-bold" width={16} sx={{ color: 'warning.main' }} />
                          ))}
                        </Stack>

                        {/* Quote */}
                        <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.7, flex: 1, mb: 3 }}>
                          &ldquo;{item.quote}&rdquo;
                        </Typography>

                        <Divider sx={{ mb: 2.5, borderStyle: 'dashed', borderColor: (th) => varAlpha(th.vars.palette.grey['500Channel'], 0.16) }} />

                        {/* Author */}
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Box sx={{
                            width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                            bgcolor: (th) => varAlpha(th.vars.palette[item.color].mainChannel, 0.12),
                            border: (th) => `2px solid ${varAlpha(th.vars.palette[item.color].mainChannel, 0.24)}`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.65rem', fontWeight: 800, color: `${item.color}.main`,
                          }}>
                            {item.avatar}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{item.author}</Typography>
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>{item.role}</Typography>
                          </Box>
                        </Stack>
                      </Card>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </MotionViewport>
        </Box>

        {/* ── CTA ── */}
        <Box component="section" sx={{ py: { xs: 10, md: 14 } }}>
          <Container>
            <MotionViewport>
              <Box component={m.div} variants={varFade({ distance: 24 }).inUp}>
                <Card sx={{
                  p: { xs: 5, md: 10 }, textAlign: 'center', borderRadius: 4,
                  background: (t) => `linear-gradient(135deg, ${varAlpha(t.vars.palette.primary.mainChannel, 0.08)} 0%, ${varAlpha(t.vars.palette.info.mainChannel, 0.08)} 100%)`,
                  border: (t) => `1px solid ${varAlpha(t.vars.palette.primary.mainChannel, 0.2)}`,
                  position: 'relative', overflow: 'hidden',
                }}>
                  {/* Decorative orbs */}
                  <Box sx={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', filter: 'blur(120px)', top: '-20%', left: '-10%', background: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.12), pointerEvents: 'none' }} />
                  <Box sx={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', filter: 'blur(100px)', bottom: '-15%', right: '-5%', background: (t) => varAlpha(t.vars.palette.info.mainChannel, 0.1), pointerEvents: 'none' }} />

                  <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Chip
                      icon={<Iconify icon="solar:rocket-bold" width={14} />}
                      label="Gestión Inteligente a tu alcance"
                      size="small"
                      color="primary"
                      variant="soft"
                      sx={{ mb: 3, fontWeight: 600 }}
                    />

                    <Typography variant="h2" sx={{ mb: 2, maxWidth: 600, mx: 'auto' }}>
                      ¿Listo para dar un salto{' '}
                      <Box component="span" sx={(t) => ({ ...textGradient(`135deg, ${t.vars.palette.primary.main} 0%, ${t.vars.palette.info.main} 100%`) })}>
                        en la gestión deportiva?
                      </Box>
                    </Typography>

                    <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 480, mx: 'auto', mb: 5 }}>
                      Únete a cientos de gestores deportivos que confían en SportsManagement para llevar sus torneos y clubes al siguiente nivel — sin complicaciones.
                    </Typography>

                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 4 }}>
                      <Button
                        size="large"
                        variant="contained"
                        color="primary"
                        href="/auth/amplify/sign-up"
                        startIcon={<Iconify icon="solar:rocket-bold" width={22} />}
                        sx={{ px: 4, py: 1.5, fontSize: 16, borderRadius: 3, boxShadow: (t) => `0 8px 32px ${varAlpha(t.vars.palette.primary.mainChannel, 0.4)}` }}
                      >
                        Empezieza Ahora
                      </Button>
                      <Button
                        size="large"
                        variant="outlined"
                        color="inherit"
                        href="/auth/amplify/sign-in"
                        sx={{ px: 4, py: 1.5, fontSize: 16, borderRadius: 3 }}
                      >
                        Ya tengo cuenta
                      </Button>
                    </Stack>

                    <Stack direction="row" spacing={3} justifyContent="center" flexWrap="wrap">
                      {[
                        { icon: 'solar:star-bold', label: 'Gestión guiada' },
                        { icon: 'solar:shield-check-bold', label: 'Sin tarjetas de crédito' },
                        { icon: 'solar:users-group-rounded-bold', label: 'Configuración en 5 min' },
                      ].map((badge) => (
                        <Stack key={badge.label} direction="row" alignItems="center" spacing={0.75}>
                          <Iconify icon={badge.icon} width={15} sx={{ color: 'text.disabled' }} />
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 500 }}>{badge.label}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>
                </Card>
              </Box>
            </MotionViewport>
          </Container>
        </Box>

        {/* ── FOOTER ── */}
        <Box
          component="footer"
          sx={{
            borderTop: (t) => `1px solid ${varAlpha(t.vars.palette.grey['500Channel'], 0.08)}`,
            bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.02),
          }}
        >
          <Container>
            {/* Main footer grid */}
            <Grid container spacing={4} sx={{ py: { xs: 6, md: 10 } }}>
              {/* Brand column */}
              <Grid xs={12} md={4}>
                <Stack spacing={2.5}>
                  <Logo />
                  <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, lineHeight: 1.7 }}>
                    La plataforma todo-en-uno para clubes deportivos. Torneos, pagos, asistencias y más — todo en un solo lugar.
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {[
                      { icon: 'mdi:instagram', label: 'Instagram' },
                      { icon: 'mdi:twitter', label: 'Twitter' },
                      { icon: 'mdi:facebook', label: 'Facebook' },
                      { icon: 'mdi:linkedin', label: 'LinkedIn' },
                    ].map((social) => (
                      <Box
                        key={social.label}
                        component="a"
                        href="#"
                        aria-label={social.label}
                        sx={{
                          width: 36, height: 36, borderRadius: 1.5, display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          bgcolor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.08),
                          color: 'text.secondary', textDecoration: 'none',
                          transition: 'all 0.2s',
                          '&:hover': { bgcolor: (t) => varAlpha(t.vars.palette.primary.mainChannel, 0.12), color: 'primary.main' },
                        }}
                      >
                        <Iconify icon={social.icon} width={18} />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Grid>

              {/* Links columns */}
              {[
                {
                  title: 'Plataforma',
                  links: [
                    { label: 'Torneos', href: '#lifecycle' },
                    { label: 'Gestión de Clubes', href: '#clubs' },
                    { label: 'Funciones', href: '#features' },
                    { label: 'Resultados en Vivo', href: '#' },
                    { label: 'Estadísticas', href: '#' },
                  ],
                },
                {
                  title: 'Empresa',
                  links: [
                    { label: 'Acerca de', href: '#' },
                    { label: 'Blog', href: '#' },
                    { label: 'Contacto', href: '#' },
                    { label: 'Empleo', href: '#' },
                  ],
                },
                {
                  title: 'Legal',
                  links: [
                    { label: 'Términos de Uso', href: '#' },
                    { label: 'Privacidad', href: '#' },
                    { label: 'Cookies', href: '#' },
                  ],
                },
              ].map((col) => (
                <Grid xs={6} sm={4} md={8 / 3} key={col.title}>
                  <Typography variant="overline" sx={{ color: 'text.disabled', display: 'block', mb: 2 }}>
                    {col.title}
                  </Typography>
                  <Stack spacing={1.25}>
                    {col.links.map((link) => (
                      <Typography
                        key={link.label}
                        component="a"
                        href={link.href}
                        variant="body2"
                        sx={{
                          color: 'text.secondary', textDecoration: 'none', fontWeight: 500,
                          transition: 'color 0.2s', '&:hover': { color: 'text.primary' },
                          display: 'block',
                        }}
                      >
                        {link.label}
                      </Typography>
                    ))}
                  </Stack>
                </Grid>
              ))}
            </Grid>

            {/* Bottom bar */}
            <Box sx={{ borderTop: '1px solid', borderColor: (t) => varAlpha(t.vars.palette.grey['500Channel'], 0.08), py: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                  © 2026 SportsManagement. Todos los derechos reservados.
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s ease-in-out infinite', '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.3 } } }} />
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    Todos los sistemas operativos
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Container>
        </Box>
      </Stack>
    </>
  );
}
