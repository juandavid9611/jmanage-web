import { m } from 'framer-motion';
import { toPng } from 'html-to-image';
import useEmblaCarousel from 'embla-carousel-react';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import { alpha, darken, useTheme } from '@mui/material/styles';

import { Iconify } from 'src/components/iconify';
import { Logo, LogoClub } from 'src/components/logo';

// ----------------------------------------------------------------------

// Animation variants
const varFadeInUp = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1, transition: { duration: 0.5 } },
};

const varScaleIn = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export function Wrap2025Dialog({ open, onClose, list, user }) {
  const theme = useTheme();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const shareCardRef = useRef(null);

  // 1. Base Variables via Strict Logic (Training Only)
  const trainingList = list.filter(item => item.title.toLowerCase().includes('entrena'));
  const totalTrainings = trainingList.reduce((acc, item) => acc + item.current, 0);
  const totalMinutes = totalTrainings * 120; // Constant duration 120 min

  // 2. Fun Facts Formulas (New Logic: Tokio, Books, FIFA)
  // Buenos Aires Trips (Approx 6 hours flight = 360 mins)
  const baTrips = Math.round(totalMinutes / 360);
  // Books Read (Approx 10 hours per book = 600 mins)
  const booksRead = Math.round(totalMinutes / 600);
  // FIFA Matches (Approx 12 mins per match)
  const fifaMatches = Math.round(totalMinutes / 12);

  // 3. Archetypes Logic (Percentage-based ranges)
  const totalPossible = trainingList.reduce((acc, item) => acc + item.total, 0);
  const attendancePercent = totalPossible > 0 ? (totalTrainings / totalPossible) * 100 : 0;
  
  let archetypeTitle = 'El Cumplidor';
  let archetypeDesc = 'El pilar del equipo. Siempre se puede contar contigo.';
  let archetypeIcon = '🛡️';
  let archetypeColor = theme.palette.info.main;

  if (attendancePercent <= 25) {
     archetypeTitle = 'El Fantasma';
     archetypeDesc = 'Te vimos poco... pero cuando vas, ¡se nota! (Mentira, ven más en 2026).';
     archetypeIcon = '👻';
     archetypeColor = theme.palette.text.secondary;
  } else if (attendancePercent > 75) {
     archetypeTitle = 'El Iron Man';
     archetypeDesc = '¡No te perdiste NADA! Eres una máquina.';
     archetypeIcon = '🤖';
     archetypeColor = theme.palette.error.main;
  } else if (attendancePercent > 50) {
     archetypeTitle = 'El Abonado';
     archetypeDesc = 'Vives aquí. ¿Pagas alquiler en la cancha? Tu dedicación es de otro planeta.';
     archetypeIcon = '🎟️';
     archetypeColor = theme.palette.warning.main;
  }
  
  // 4. Conditional Emotional Quote based on Minutes
  const quote = useMemo(() => {
    let pool = [];
    
    // Tier 1: Improver (< 1800 mins / roughly < 15 sessions)
    if (totalMinutes < 1800) {
      pool = [
        "Todo gran viaje comienza con un primer paso. ¡Vamos por más en 2026!",
        "Lo importante es haber empezado. ¡El próximo año rompes tu récord!",
        "Poco a poco se llega lejos. ¡No te detengas!"
      ];
    } 
    // Tier 2: Consistent (1800 - 6600 mins / 15 - 55 sessions)
    else if (totalMinutes < 6600) {
      pool = [
        "Tu constancia es tu mejor talento. ¡Sigue así!",
        "No fue suerte, fue disciplina. ¡Buen trabajo!",
        "Hiciste lo que tenías que hacer. ¡Orgullo total!",
        "Cada minuto en la cancha sumó. ¡Bien jugado!"
      ];
    } 
    // Tier 3: Elite (> 6600 mins / 55+ sessions)
    else {
      pool = [
        "Mientras otros dormían, tú estabas entrenando. ¡Qué año!",
        "Demostraste que las excusas no existen en tu vocabulario.",
        "Eres la prueba de que el esfuerzo paga. ¡Máquina!",
        "Hiciste lo que pocos se atreven a hacer: no rendirte nunca."
      ];
    }

    const randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
  }, [totalMinutes]);
  
  const fNumber = (num) => new Intl.NumberFormat('en-US').format(Math.round(num));

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  const handleDownloadImage = useCallback(async () => {
    if (!shareCardRef.current) return;
    
    try {
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: 'transparent'
      });
      
      const link = document.createElement('a');
      link.download = `${user?.displayName || 'wrap'}-2025.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
    }
  }, [user?.displayName]);

  const onSelect = useCallback((api) => {
    setSelectedIndex(api.selectedScrollSnap());
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
  }, [emblaApi, onSelect]);

  // Re-init carousel when dialog opens to handle transition/dimension issues
  useEffect(() => {
    if (open && emblaApi) {
      setTimeout(() => {
        emblaApi.reInit();
        emblaApi.scrollTo(0);
        setSelectedIndex(0);
      }, 300);
    }
  }, [open, emblaApi]);

  const slides = [
    // Slide 1: Total
    {
      id: 'total',
      content: (
        <StackSpacing>
          <m.div variants={varFadeInUp} initial="initial" animate="animate">
            <Typography variant="h3" sx={{ color: 'common.white', textShadow: '0px 2px 4px rgba(0,0,0,0.2)' }}>El Gran Total</Typography>
          </m.div>

          <m.div 
             initial={{ scale: 0.5, opacity: 0 }} 
             animate={{ scale: 1, opacity: 1 }} 
             transition={{ duration: 0.8, type: 'spring', bounce: 0.5 }}
          >
            <Typography variant="h1" sx={{ fontSize: '5rem !important', fontWeight: 900, color: 'common.white' }}>
              {fNumber(totalMinutes)}
            </Typography>
          </m.div>

          <m.div variants={varFadeInUp} initial="initial" animate="animate" transition={{ delay: 0.3 }}>
            <Typography variant="h5" sx={{ color: 'common.white', textTransform: 'lowercase' }}>minutos entrenando</Typography>
            <Typography variant="body1" sx={{ opacity: 0.9, maxWidth: 350, mx: 'auto', fontWeight: 'bold', mt: 2 }}>
              &quot;{quote}&quot;
            </Typography>
          </m.div>
        </StackSpacing>
      ),
    },
    // Slide 2: Datos Curiosos
    {
      id: 'funfacts',
      content: (
        <StackSpacing>
          <m.div variants={varFadeInUp} initial="initial" animate="animate">
             <Typography variant="h3" sx={{ color: 'common.white', textShadow: '0px 2px 4px rgba(0,0,0,0.2)' }}>¿Sabías que...</Typography>
          </m.div>

          <Box sx={{ display: 'grid', gap: 3, textAlign: 'left', width: '100%', maxWidth: 360 }}>
            <m.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.3 }}>
               <EquivalenceItem icon="✈️" text={`Podrías haber volado de Bogotá a Buenos Aires ${baTrips} veces.`} />
            </m.div>
            <m.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
               <EquivalenceItem icon="📚" text={`Podrías haber leído ${booksRead} libros enteros.`} />
            </m.div>
            <m.div initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
               <EquivalenceItem icon="🎮" text={`Podrías haber jugado ${fifaMatches} partidos de FC 25.`} />
            </m.div>
          </Box>
        </StackSpacing>
      ),
    },
    // Slide 3: Arquetipo
    {
      id: 'archetype',
      content: (
        <StackSpacing>
          <m.div variants={varFadeInUp} initial="initial" animate="animate">
            <Typography variant="h3" sx={{ color: 'common.white', textShadow: '0px 2px 4px rgba(0,0,0,0.2)' }}>Tu Arquetipo 2025</Typography>
          </m.div>

          {/* Attendance Stats */}
          <m.div variants={varScaleIn} initial="initial" animate="animate" transition={{ delay: 0.3 }}>
            <Box sx={{ 
              mt: 2, 
              px: 3, 
              py: 1.5, 
              borderRadius: 2, 
              bgcolor: alpha(archetypeColor, 0.15),
              border: `2px solid ${alpha(archetypeColor, 0.3)}`,
              display: 'inline-block'
            }}>
              <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1, fontSize: '0.7rem' }}>
                Asistencia
              </Typography>
              <Typography variant="h4" sx={{ color: archetypeColor, fontWeight: 800, lineHeight: 1 }}>
                {Math.round(attendancePercent)}%
              </Typography>
              <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.6, fontSize: '0.65rem' }}>
                {totalTrainings} de {totalPossible} entrenamientos
              </Typography>
            </Box>
          </m.div>

          {/* All Archetypes - Vertical List */}
          <m.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 400, mx: 'auto', mt: 4 }}>
              {/* El Fantasma */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.text.secondary, archetypeTitle === 'El Fantasma' ? 0.25 : 0.08),
                border: `2px solid ${alpha(theme.palette.text.secondary, archetypeTitle === 'El Fantasma' ? 0.6 : 0.2)}`,
                opacity: archetypeTitle === 'El Fantasma' ? 1 : 0.5,
                transform: archetypeTitle === 'El Fantasma' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="h3" sx={{ minWidth: 50 }}>👻</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: 'common.white', fontWeight: 700 }}>El Fantasma</Typography>
                  <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.7 }}>Te vimos poco... pero cuando vas, ¡se nota! (Mentira, ven más en 2026).</Typography>
                </Box>
                {archetypeTitle === 'El Fantasma' && (
                  <Typography variant="h4" sx={{ color: theme.palette.text.secondary }}>✓</Typography>
                )}
              </Box>

              {/* El Cumplidor */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.info.main, archetypeTitle === 'El Cumplidor' ? 0.25 : 0.08),
                border: `2px solid ${alpha(theme.palette.info.main, archetypeTitle === 'El Cumplidor' ? 0.6 : 0.2)}`,
                opacity: archetypeTitle === 'El Cumplidor' ? 1 : 0.5,
                transform: archetypeTitle === 'El Cumplidor' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="h3" sx={{ minWidth: 50 }}>🛡️</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: 'common.white', fontWeight: 700 }}>El Cumplidor</Typography>
                  <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.7 }}>El pilar del equipo. Siempre se puede contar contigo.</Typography>
                </Box>
                {archetypeTitle === 'El Cumplidor' && (
                  <Typography variant="h4" sx={{ color: theme.palette.info.main }}>✓</Typography>
                )}
              </Box>

              {/* El Abonado */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.warning.main, archetypeTitle === 'El Abonado' ? 0.25 : 0.08),
                border: `2px solid ${alpha(theme.palette.warning.main, archetypeTitle === 'El Abonado' ? 0.6 : 0.2)}`,
                opacity: archetypeTitle === 'El Abonado' ? 1 : 0.5,
                transform: archetypeTitle === 'El Abonado' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="h3" sx={{ minWidth: 50 }}>🎟️</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: 'common.white', fontWeight: 700 }}>El Abonado</Typography>
                  <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.7 }}>Vives aquí. ¿Pagas alquiler en la cancha? Tu dedicación es de otro planeta.</Typography>
                </Box>
                {archetypeTitle === 'El Abonado' && (
                  <Typography variant="h4" sx={{ color: theme.palette.warning.main }}>✓</Typography>
                )}
              </Box>

              {/* El Iron Man */}
              <Box sx={{ 
                p: 2, 
                borderRadius: 2, 
                bgcolor: alpha(theme.palette.error.main, archetypeTitle === 'El Iron Man' ? 0.25 : 0.08),
                border: `2px solid ${alpha(theme.palette.error.main, archetypeTitle === 'El Iron Man' ? 0.6 : 0.2)}`,
                opacity: archetypeTitle === 'El Iron Man' ? 1 : 0.5,
                transform: archetypeTitle === 'El Iron Man' ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <Typography variant="h3" sx={{ minWidth: 50 }}>🤖</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="body1" sx={{ color: 'common.white', fontWeight: 700 }}>El Iron Man</Typography>
                  <Typography variant="caption" sx={{ color: 'common.white', opacity: 0.7 }}>¡No te perdiste NADA! Eres una máquina.</Typography>
                </Box>
                {archetypeTitle === 'El Iron Man' && (
                  <Typography variant="h4" sx={{ color: theme.palette.error.main }}>✓</Typography>
                )}
              </Box>
            </Box>
          </m.div>
        </StackSpacing>
      ),
    },
    // Slide 4: Share
    {
      id: 'share',
      content: (
        <StackSpacing>
           {/* Emotional Title - NOT included in image */}
           <m.div variants={varFadeInUp} initial="initial" animate="animate">
             <Typography variant="h3" sx={{ color: 'common.white', textShadow: '0px 2px 4px rgba(0,0,0,0.2)', mb: 3 }}>
               ¡Qué año increíble!
             </Typography>
           </m.div>

           <m.div 
             initial={{ y: 50, opacity: 0, rotateX: 20 }}
             animate={{ y: 0, opacity: 1, rotateX: 0 }}
             transition={{ duration: 0.8, type: 'spring' }}
           >
             <Box 
               ref={shareCardRef}
               sx={{ 
                 background: `linear-gradient(135deg, ${darken(theme.palette.primary.darker, 0.2)} 0%, ${theme.palette.primary.main} 100%)`,
                 p: 2, 
                 borderRadius: 3, 
                 boxShadow: theme.customShadows.z24, 
                 width: '100%',
                 maxWidth: 360,
                 position: 'relative',
                 overflow: 'hidden'
               }}
             >
               <Box sx={{ bgcolor: 'background.paper', borderRadius: 2, p: 2.5, display: 'flex', flexDirection: 'column' }}>
                {/* Header (Logo + LogoClub) */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, position: 'relative', zIndex: 1 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                     <Logo disabledLink sx={{ width: 55, height: 55 }} />
                   </Box>
                   <LogoClub disabledLink sx={{ width: 60, height: 60 }} />
                </Box>

                {/* User Info & Archetype */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, position: 'relative', zIndex: 1 }}>
                  <Avatar 
                    src={user?.photoURL} 
                    alt={user?.displayName} 
                    sx={{ width: 64, height: 64, border: `3px solid ${theme.palette.background.paper}`, boxShadow: theme.customShadows.z8 }} 
                  />
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'text.primary', lineHeight: 1.2 }}>{user?.displayName}</Typography>
                    <Box sx={{ mt: 0.5, px: 1, py: 0.25, borderRadius: 1, bgcolor: alpha(archetypeColor, 0.1), color: archetypeColor, fontWeight: 'bold', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <span>{archetypeIcon}</span> {archetypeTitle}
                    </Box>
                  </Box>
                </Box>

                {/* Main Stats */}
                <Box sx={{ py: 2, mb: 1, borderTop: `1px dashed ${theme.palette.divider}`, borderBottom: `1px dashed ${theme.palette.divider}`, position: 'relative', zIndex: 1 }}>
                  <Typography variant="h2" sx={{ color: 'primary.main', fontWeight: 900 }}>
                    {fNumber(totalMinutes)}
                  </Typography>
                  <Typography variant="subtitle2" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
                    MINUTOS ENTRENANDO
                  </Typography>
                  <Typography variant="body2" sx={{ fontStyle: 'italic', opacity: 0.8, color: 'text.primary', mb: 2 }}>
                    &quot;{quote}&quot;
                  </Typography>
                </Box>
                
                <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', color: 'text.secondary', fontStyle: 'italic', mb: 1 }}>
                  O lo que es lo mismo...
                </Typography>

                {/* Equivalencies Row (Columns) */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, mt: 3, mb: 1 }}>
                   <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0.5 }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>✈️</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                        <strong>{baTrips}</strong> Viajes a Buenos Aires
                      </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0.5 }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>📚</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                        <strong>{booksRead}</strong> Libros Leídos
                      </Typography>
                   </Box>
                   <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 0.5 }}>
                      <Typography variant="h5" sx={{ mb: 0.5 }}>🎮</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.2 }}>
                        <strong>{fifaMatches}</strong> Partidos FIFA
                      </Typography>
                   </Box>
                </Box>
              </Box>
             </Box>
           </m.div>
           
           <m.div 
             initial={{ scale: 0 }} 
             animate={{ scale: 1 }} 
             transition={{ delay: 0.8, type: 'spring' }}
           >
             <Button
                variant="contained"
                size="large"
                color="primary"
                startIcon={<Iconify icon="mdi:download" />}
                onClick={handleDownloadImage}
                sx={{ mt: 4, borderRadius: 30, px: 4, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
              >
                Descargar para Story
              </Button>
            </m.div>
        </StackSpacing>
      ),
    }
  ];

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: 'background.default',
          backgroundImage: `linear-gradient(135deg, ${alpha(theme.palette.primary.darker, 0.95)} 0%, ${alpha(theme.palette.primary.main, 0.9)} 100%)`,
        },
      }}
    >
      <Box sx={{ position: 'absolute', top: 20, right: 20, zIndex: 9 }}>
        <IconButton onClick={onClose} sx={{ color: 'common.white', bgcolor: 'rgba(255,255,255,0.1)' }}>
          <Iconify icon="mingcute:close-line" width={32} />
        </IconButton>
      </Box>

      {/* Animated Background */}
      <AnimatedBackground />

      <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', position: 'relative', zIndex: 1 }} ref={emblaRef}>
        <Box sx={{ display: 'flex', width: '100%', height: '100%' }}>
          {slides.map((slide, index) => (
            <Box 
              key={slide.id} 
              sx={{ 
                flex: '0 0 100%', 
                minWidth: 0, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                px: 2
              }}
            >
              {/* Only animate if slide is active (simple optimization) or just keep all active */}
              {index === selectedIndex ? slide.content : null}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Navigation Dots */}
      <Box sx={{ position: 'absolute', bottom: 40, width: '100%', display: 'flex', justifyContent: 'center', gap: 1, zIndex: 2 }}>
        {slides.map((_, index) => (
          <Box
            key={index}
            onClick={() => emblaApi && emblaApi.scrollTo(index)}
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: index === selectedIndex ? 'primary.main' : 'common.white',
              opacity: index === selectedIndex ? 1 : 0.3,
              cursor: 'pointer',
              transition: 'all 0.3s',
              ...(index === selectedIndex && { width: 24, borderRadius: 4, bgcolor: 'common.white' })
            }}
          />
        ))}
      </Box>
    </Dialog>
  );
}

function AnimatedBackground() {
  const theme = useTheme();
  
  // Floating Blobs
  return (
    <Box sx={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', overflow: 'hidden', zIndex: 0 }}>
       {/* Blob 1 */}
       <m.div
         animate={{
            y: [0, -100, 0],
            x: [0, 50, 0],
            scale: [1, 1.2, 1],
         }}
         transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
         style={{
           position: 'absolute',
           top: '-10%',
           left: '-10%',
           width: '50%',
           height: '50%',
           borderRadius: '50%',
           background: alpha(theme.palette.primary.lighter, 0.2),
           filter: 'blur(80px)',
         }}
       />
       
       {/* Blob 2 */}
       <m.div
         animate={{
            y: [0, 100, 0],
            x: [0, -50, 0],
            scale: [1, 1.5, 1],
         }}
         transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
         style={{
           position: 'absolute',
           bottom: '-10%',
           right: '-10%',
           width: '60%',
           height: '60%',
           borderRadius: '50%',
           background: alpha(theme.palette.secondary.lighter, 0.2),
           filter: 'blur(100px)',
         }}
       />

       {/* Blob 3 */}
       <m.div
         animate={{
            y: [0, -50, 0],
            x: [0, 50, 0],
         }}
         transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
         style={{
           position: 'absolute',
           top: '40%',
           left: '40%',
           width: '30%',
           height: '30%',
           borderRadius: '50%',
           background: alpha(theme.palette.info.light, 0.15),
           filter: 'blur(60px)',
         }}
       />
    </Box>
  )
}

function StackSpacing({ children }) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      textAlign: 'center', 
      width: '100%',
      gap: 2,
      color: 'common.white'
    }}>
      {children}
    </Box>
  );
}

function EquivalenceItem({ icon, text }) {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 2, 
        bgcolor: 'rgba(255, 255, 255, 0.9)', 
        backdropFilter: 'blur(10px)',
        p: 2.5, 
        borderRadius: 2, 
        color: 'text.primary',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
    >
      <Typography variant="h3">{icon}</Typography>
      <Typography variant="body1" sx={{ fontWeight: 600 }}>{text}</Typography>
    </Box>
  )
}

function StatBox({ label, value, color }) {
  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h4" sx={{ color: color || 'common.white', fontWeight: 800 }}>{value}</Typography>
      <Typography variant="body2" sx={{ color: 'common.white', opacity: 0.8 }}>{label}</Typography>
    </Box>
  )
}
