import { useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import { alpha } from '@mui/material/styles';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';

import { fDateTime } from 'src/utils/format-time';

import { TOUR_SERVICE_OPTIONS } from 'src/_mock';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Markdown } from 'src/components/markdown';
import { Lightbox, useLightBox } from 'src/components/lightbox';

import { TourPerformanceChart } from './tour-performance-chart';

// ----------------------------------------------------------------------

function computeAIInsights(tour, bookers) {
  const insights = [];
  const yellowCards = bookers.filter((b) => b.yellowCard).length;
  const redCards    = bookers.filter((b) => b.redCard).length;
  const lateCount   = bookers.filter((b) => b.late).length;
  const topScorer   = [...bookers].sort((a, b) => b.goals - a.goals)[0];
  const topAssist   = [...bookers].filter((b) => b.assists > 0).sort((a, b) => b.assists - a.assists)[0];
  const { home, away } = tour.scores;
  const margin      = home - away;
  const result      = margin > 0 ? 'victory' : margin === 0 ? 'draw' : 'loss';

  if (result === 'victory') {
    if (margin >= 3) {
      insights.push({ color: 'success', icon: 'mdi:trophy', title: 'Victoria Dominante', body: `El equipo arrasó con ${margin} goles de ventaja. Una exhibición de juego colectivo.` });
    } else {
      insights.push({ color: 'success', icon: 'mdi:trophy', title: 'Victoria Trabajada', body: `Tres puntos conseguidos con determinación. El equipo supo mantener el marcador en momentos clave.` });
    }
  } else if (result === 'draw') {
    insights.push({ color: 'info', icon: 'mdi:handshake', title: 'Partido Equilibrado', body: 'Empate que refleja un duelo parejo. El equipo mostró solidez para no encajar más goles.' });
  } else {
    const gap = Math.abs(margin);
    insights.push({ color: 'error', icon: 'mdi:trending-down', title: 'Resultado a Analizar', body: `Derrota por ${gap}. Es fundamental revisar las transiciones defensivas y la presión alta.` });
  }

  if (topScorer?.goals > 0) {
    const assistLine = topAssist && topAssist.id !== topScorer.id && topAssist.assists > 0
      ? `, asistido por ${topAssist.name} (${topAssist.assists} ast.)`
      : '';
    insights.push({
      color: 'primary',
      icon: 'mdi:star-shooting',
      title: 'Figura del Partido',
      body: `${topScorer.name} lideró la ofensiva con ${topScorer.goals} gol${topScorer.goals > 1 ? 'es' : ''}${assistLine}. Su intervención fue decisiva.`,
    });
  }

  if (redCards > 0) {
    insights.push({ color: 'error', icon: 'mdi:alert-circle', title: 'Alerta Disciplinaria', body: `${redCards} expulsión${redCards > 1 ? 'es' : ''} y ${yellowCards} amarilla${yellowCards !== 1 ? 's' : ''}. El equipo jugó en inferioridad, lo que condicionó el resultado.` });
  } else if (yellowCards >= 4) {
    insights.push({ color: 'warning', icon: 'mdi:card', title: 'Disciplina en Riesgo', body: `${yellowCards} amonestaciones acumuladas. Varios jugadores están en riesgo de sanción si acumulan otra amarilla.` });
  } else if (yellowCards === 0) {
    insights.push({ color: 'success', icon: 'mdi:shield-check', title: 'Juego Limpio', body: 'Partido sin tarjetas. La disciplina del equipo fue impecable, lo que refuerza la imagen del club.' });
  }

  if (lateCount >= 3) {
    insights.push({ color: 'warning', icon: 'mdi:clock-alert', title: 'Problema de Puntualidad', body: `${lateCount} llegadas tarde al partido. La preparación previa puede estar afectando la concentración del equipo.` });
  } else if (lateCount === 0) {
    insights.push({ color: 'success', icon: 'mdi:clock-check', title: 'Equipo Comprometido', body: 'Todo el equipo llegó a tiempo. El compromiso y la preparación antes del partido fueron excelentes.' });
  }

  return insights;
}

// ----------------------------------------------------------------------

export function TourDetailsContent({ tour }) {
  const [notesOpen, setNotesOpen] = useState(false);

  const slides       = tour?.images?.map((s) => ({ src: s })) || [];
  const bookers      = useMemo(() => Object.values(tour?.bookers || {}), [tour?.bookers]);
  const mvp          = bookers.find((b) => b.mvp);
  const yellowList   = bookers.filter((b) => b.yellowCard);
  const redList      = bookers.filter((b) => b.redCard);
  const lateList     = bookers.filter((b) => b.late);
  const totalGoals   = bookers.reduce((s, b) => s + b.goals, 0);
  const totalAssists = bookers.reduce((s, b) => s + b.assists, 0);
  const aiInsights   = useMemo(() => computeAIInsights(tour, bookers), [tour, bookers]);

  const { home, away }  = tour.scores;
  const resultType      = home > away ? 'victory' : home === away ? 'draw' : 'loss';
  const resultLabel     = { victory: 'Victoria', draw: 'Empate', loss: 'Derrota' }[resultType];
  const resultColor     = { victory: 'success', draw: 'default', loss: 'error' }[resultType];

  const {
    selected: selectedImage,
    open:     openLightbox,
    onOpen:   handleOpenLightbox,
    onClose:  handleCloseLightbox,
  } = useLightBox(slides);

  // ── Hero ────────────────────────────────────────────────────────────

  const renderHero = (
    <Box
      sx={{
        bgcolor: 'grey.800',
        borderRadius: 2,
        overflow: 'hidden',
        mb: 3,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background: resultType === 'victory'
            ? 'radial-gradient(ellipse 55% 70% at 50% 100%, rgba(34,197,94,0.14) 0%, transparent 70%)'
            : resultType === 'loss'
            ? 'radial-gradient(ellipse 55% 70% at 50% 100%, rgba(255,86,48,0.12) 0%, transparent 70%)'
            : 'radial-gradient(ellipse 55% 70% at 50% 100%, rgba(12,104,233,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Match result verdict stripe */}
      <Box
        sx={{
          height: 4,
          bgcolor: resultType === 'victory' ? 'success.main' : resultType === 'loss' ? 'error.main' : 'grey.500',
        }}
      />

      <Box sx={{ px: { xs: 3, md: 5 }, pt: 3, pb: 4 }}>
        {/* Date + location */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Iconify icon="solar:calendar-date-bold" width={14} sx={{ color: 'rgba(255,255,255,0.4)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
              {fDateTime(tour?.available?.startDate)}
            </Typography>
          </Stack>
          <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)' }} />
          <Stack direction="row" alignItems="center" spacing={0.75}>
            <Iconify icon="mingcute:location-fill" width={14} sx={{ color: 'rgba(255,255,255,0.4)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>
              {tour?.location}
            </Typography>
          </Stack>
        </Stack>

        {/* Score */}
        <Stack alignItems="center" spacing={0.5} sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={3}>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', minWidth: 60, textAlign: 'right' }}>
              Local
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Typography sx={{ color: 'common.white', fontSize: { xs: '3.5rem', md: '5rem' }, fontWeight: 900, lineHeight: 1, textShadow: resultType === 'victory' ? '0 0 40px rgba(34,197,94,0.3)' : 'none' }}>
                {home}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.25)', fontSize: { xs: '2rem', md: '3rem' }, fontWeight: 300, lineHeight: 1 }}>
                —
              </Typography>
              <Typography sx={{ color: 'common.white', fontSize: { xs: '3.5rem', md: '5rem' }, fontWeight: 900, lineHeight: 1 }}>
                {away}
              </Typography>
            </Stack>
            <Typography sx={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', minWidth: 60 }}>
              Visita
            </Typography>
          </Stack>

          <Chip
            label={resultLabel}
            size="small"
            color={resultColor}
            sx={{
              fontWeight: 800,
              fontSize: '0.7rem',
              letterSpacing: 1.5,
              textTransform: 'uppercase',
              ...(resultType === 'draw' && { bgcolor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)' }),
            }}
          />
        </Stack>

        {/* Technical staff */}
        {tour?.tourGuides?.length > 0 && (
          <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
            <Iconify icon="solar:flag-bold" width={14} sx={{ color: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
              Cuerpo técnico: {tour.tourGuides.map((g) => g.name).join(', ')}
            </Typography>
          </Stack>
        )}
      </Box>
    </Box>
  );

  // ── KPI strip ────────────────────────────────────────────────────────

  const kpis = [
    { label: 'Goles', value: totalGoals,       icon: 'mdi:soccer',          color: '#22C55E' },
    { label: 'Asistencias', value: totalAssists, icon: 'mdi:shoe-cleat',      color: '#0C68E9' },
    { label: 'Jugadores', value: bookers.length, icon: 'mdi:account-group',   color: '#61F3F3' },
    { label: 'Amarillas', value: yellowList.length, icon: 'mdi:card',         color: '#FFAB00' },
    { label: 'Rojas', value: redList.length,    icon: 'mdi:card',            color: '#FF5630' },
    { label: 'Tarde', value: lateList.length,   icon: 'mdi:clock-alert',     color: '#C684FF' },
  ];

  const renderKpis = (
    <Box
      display="grid"
      gap={1.5}
      gridTemplateColumns={{ xs: 'repeat(3, 1fr)', sm: 'repeat(6, 1fr)' }}
      sx={{ mb: 3 }}
    >
      {kpis.map((k) => (
        <Card
          key={k.label}
          sx={{
            p: 1.5,
            textAlign: 'center',
            borderTop: `3px solid ${k.color}`,
            transition: 'transform 0.15s, box-shadow 0.15s',
            '&:hover': { transform: 'translateY(-2px)', boxShadow: (t) => t.shadows[4] },
          }}
        >
          <Iconify icon={k.icon} width={18} sx={{ color: k.color, mb: 0.5 }} />
          <Typography sx={{ fontSize: '1.5rem', fontWeight: 900, lineHeight: 1, color: 'text.primary' }}>
            {k.value}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, display: 'block' }}>
            {k.label}
          </Typography>
        </Card>
      ))}
    </Box>
  );

  // ── AI Insights ──────────────────────────────────────────────────────

  const renderAI = (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2.5 }}>
        <Box
          sx={{
            width: 28,
            height: 28,
            borderRadius: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0C68E9 0%, #8E33FF 100%)',
          }}
        >
          <Iconify icon="mdi:creation" width={16} sx={{ color: 'white' }} />
        </Box>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Análisis IA
        </Typography>
        <Chip
          label="IA"
          size="small"
          sx={{
            height: 18,
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: 0.5,
            background: 'linear-gradient(135deg, #0C68E9 0%, #8E33FF 100%)',
            color: 'white',
          }}
        />
      </Stack>

      <Stack spacing={1.5}>
        {aiInsights.map((ins, idx) => {
          const colorMap = { success: '#22C55E', error: '#FF5630', warning: '#FFAB00', info: '#00B8D9', primary: '#0C68E9' };
          const accent = colorMap[ins.color] || '#0C68E9';
          return (
            <Box
              key={idx}
              sx={{
                px: 1.75,
                py: 1.5,
                borderRadius: 1.5,
                bgcolor: (t) => alpha(t.palette.grey[500], 0.04),
                border: (t) => `1px solid ${alpha(t.palette.grey[500], 0.1)}`,
                borderLeft: `3px solid ${accent}`,
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Iconify icon={ins.icon} width={16} sx={{ color: accent, mt: 0.25, flexShrink: 0 }} />
                <Stack spacing={0.25}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: accent, lineHeight: 1, letterSpacing: 0.3 }}>
                    {ins.title.toUpperCase()}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                    {ins.body}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </Card>
  );

  // ── MVP card ─────────────────────────────────────────────────────────

  const renderMVP = mvp && (
    <Card
      sx={{
        p: 2,
        background: (t) => `linear-gradient(135deg, ${alpha(t.palette.warning.main, 0.08)} 0%, ${alpha(t.palette.warning.light, 0.03)} 100%)`,
        border: (t) => `1px solid ${alpha(t.palette.warning.main, 0.2)}`,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Iconify icon="solar:star-bold" width={18} sx={{ color: 'warning.main' }} />
        <Typography variant="caption" sx={{ fontWeight: 800, color: 'warning.dark', letterSpacing: 1 }}>
          MVP DEL PARTIDO
        </Typography>
      </Stack>
      <Stack direction="row" alignItems="center" spacing={1.5}>
        <Avatar
          src={mvp.avatarUrl}
          alt={mvp.name}
          sx={{ width: 44, height: 44, border: (t) => `2px solid ${alpha(t.palette.warning.main, 0.4)}` }}
        >
          {mvp.name?.charAt(0)}
        </Avatar>
        <Stack spacing={0}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
            {mvp.name}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {mvp.goals > 0 ? `${mvp.goals} gol${mvp.goals > 1 ? 'es' : ''}` : ''}
            {mvp.goals > 0 && mvp.assists > 0 ? ' · ' : ''}
            {mvp.assists > 0 ? `${mvp.assists} asist.` : ''}
            {mvp.goals === 0 && mvp.assists === 0 ? 'Mejor actuación' : ''}
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );

  // ── Discipline panel ─────────────────────────────────────────────────

  const renderDiscipline = (yellowList.length > 0 || redList.length > 0 || lateList.length > 0) && (
    <Card sx={{ p: 2.5 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <Iconify icon="mdi:shield-alert" width={18} sx={{ color: 'error.main' }} />
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          Incidencias
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {[
          { list: yellowList, label: 'Tarjetas Amarillas', icon: 'mdi:card', color: '#FFAB00' },
          { list: redList,    label: 'Tarjetas Rojas',     icon: 'mdi:card', color: '#FF5630' },
          { list: lateList,   label: 'Llegadas Tarde',     icon: 'mdi:clock-alert', color: '#C684FF' },
        ].filter((row) => row.list.length > 0).map((row) => (
          <Stack key={row.label} spacing={1}>
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Iconify icon={row.icon} width={14} sx={{ color: row.color }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', letterSpacing: 0.3 }}>
                {row.label.toUpperCase()}
              </Typography>
              <Chip label={row.list.length} size="small" sx={{ height: 16, fontSize: '0.62rem', fontWeight: 800, bgcolor: alpha(row.color, 0.12), color: row.color }} />
            </Stack>
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {row.list.map((b) => (
                <Tooltip key={b.id} title={b.name}>
                  <Chip
                    avatar={<Avatar src={b.avatarUrl}>{b.name?.charAt(0)}</Avatar>}
                    label={b.name.split(' ')[0]}
                    size="small"
                    variant="soft"
                    sx={{ fontWeight: 600 }}
                  />
                </Tooltip>
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Card>
  );

  // ── Services ─────────────────────────────────────────────────────────

  const renderServices = (
    <Card sx={{ p: 2.5 }}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.secondary', letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.7rem' }}>
        Tipo de Partido
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={0.75}>
        {TOUR_SERVICE_OPTIONS.map((service) => {
          const active = tour?.services?.includes(service.label);
          return (
            <Chip
              key={service.label}
              icon={<Iconify icon="eva:checkmark-circle-2-outline" width={14} />}
              label={service.label}
              size="small"
              variant={active ? 'filled' : 'outlined'}
              color={active ? 'primary' : 'default'}
              sx={{ ...(active ? {} : { opacity: 0.35 }), fontWeight: 600 }}
            />
          );
        })}
      </Stack>
    </Card>
  );

  // ── Gallery ───────────────────────────────────────────────────────────

  const renderGallery = slides.length > 0 && (
    <Card sx={{ overflow: 'hidden' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 2.5, py: 1.75, borderBottom: (t) => `1px solid ${alpha(t.palette.grey[500], 0.1)}` }}>
        <Iconify icon="mdi:image-multiple" width={18} sx={{ color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Fotos del Partido
        </Typography>
        <Chip label={slides.length} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
      </Stack>
      <Box
        gap={0.5}
        display="grid"
        gridTemplateColumns={{ xs: 'repeat(3, 1fr)', sm: 'repeat(4, 1fr)', md: 'repeat(5, 1fr)' }}
        sx={{ p: 0.5 }}
      >
        {slides.slice(0, 10).map((slide, i) => (
          <Image
            key={slide.src}
            alt={slide.src}
            src={slide.src}
            ratio="1/1"
            onClick={() => handleOpenLightbox(slide.src)}
            sx={{
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'opacity 0.2s',
              '&:hover': { opacity: 0.8 },
            }}
          />
        ))}
      </Box>
      <Lightbox
        index={selectedImage}
        slides={slides}
        open={openLightbox}
        close={handleCloseLightbox}
      />
    </Card>
  );

  // ── Notes ─────────────────────────────────────────────────────────────

  const renderNotes = tour?.content && (
    <Card sx={{ overflow: 'hidden' }}>
      <Button
        fullWidth
        onClick={() => setNotesOpen((v) => !v)}
        endIcon={<Iconify icon={notesOpen ? 'mdi:chevron-up' : 'mdi:chevron-down'} />}
        sx={{
          justifyContent: 'space-between',
          px: 2.5,
          py: 1.75,
          fontWeight: 700,
          color: 'text.primary',
          borderRadius: 0,
          '&:hover': { bgcolor: (t) => alpha(t.palette.grey[500], 0.06) },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Iconify icon="mdi:notebook-outline" width={18} sx={{ color: 'text.secondary' }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
            Notas del Partido
          </Typography>
        </Stack>
      </Button>
      <Collapse in={notesOpen}>
        <Divider />
        <Box sx={{ px: 3, py: 2.5 }}>
          <Markdown>{tour.content}</Markdown>
        </Box>
      </Collapse>
    </Card>
  );

  // ── Layout ────────────────────────────────────────────────────────────

  return (
    <>
      {renderHero}
      {renderKpis}

      <Box
        display="grid"
        gap={3}
        gridTemplateColumns={{ xs: '1fr', md: '1fr 340px' }}
        sx={{ mb: 3 }}
      >
        {/* Left column */}
        <Stack spacing={3}>
          <TourPerformanceChart bookers={bookers} />
          {renderDiscipline}
          {renderGallery}
          {renderNotes}
        </Stack>

        {/* Right column */}
        <Stack spacing={2.5}>
          {renderAI}
          {renderMVP}
          {renderServices}
        </Stack>
      </Box>
    </>
  );
}
