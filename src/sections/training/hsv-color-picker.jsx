import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------
// A real HSV color picker (saturation/value square + hue strip + hex/RGB
// inputs + a saved-swatches row you can add to) — built from plain CSS
// gradients and pointer events, no canvas or extra dependency.

const BLACK_RGB = { r: 0, g: 0, b: 0 };

const DEFAULT_SAVED = [
  '#ffca28',
  '#ff7043',
  '#ef5350',
  '#ec407a',
  '#ab47bc',
  '#42a5f5',
  '#26c6da',
  '#66bb6a',
  '#212121',
  '#ffffff',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hsvToRgb(h, s, v) {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255),
  };
}

function rgbToHsv(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = 60 * (((gn - bn) / d) % 6);
    else if (max === gn) h = 60 * ((bn - rn) / d + 2);
    else h = 60 * ((rn - gn) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

function rgbToHex({ r, g, b }) {
  return `#${[r, g, b].map((c) => clamp(c, 0, 255).toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return null;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return { r, g, b };
}

// ----------------------------------------------------------------------

function SatValueSquare({ hue, s, v, onChange }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateFromEvent = useCallback(
    (evt) => {
      const rect = ref.current.getBoundingClientRect();
      const nx = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
      const ny = clamp((evt.clientY - rect.top) / rect.height, 0, 1);
      onChange(nx, 1 - ny);
    },
    [onChange]
  );

  return (
    <Box
      ref={ref}
      onPointerDown={(evt) => {
        setDragging(true);
        updateFromEvent(evt);
      }}
      onPointerMove={(evt) => dragging && updateFromEvent(evt)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
      sx={{
        position: 'relative',
        width: 1,
        height: 140,
        borderRadius: 1,
        cursor: 'crosshair',
        backgroundColor: `hsl(${hue}, 100%, 50%)`,
        backgroundImage: 'linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${s * 100}%`,
          top: `${(1 - v) * 100}%`,
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

function HueSlider({ hue, onChange }) {
  const ref = useRef(null);
  const [dragging, setDragging] = useState(false);

  const updateFromEvent = useCallback(
    (evt) => {
      const rect = ref.current.getBoundingClientRect();
      const nx = clamp((evt.clientX - rect.left) / rect.width, 0, 1);
      onChange(nx * 360);
    },
    [onChange]
  );

  return (
    <Box
      ref={ref}
      onPointerDown={(evt) => {
        setDragging(true);
        updateFromEvent(evt);
      }}
      onPointerMove={(evt) => dragging && updateFromEvent(evt)}
      onPointerUp={() => setDragging(false)}
      onPointerLeave={() => setDragging(false)}
      sx={{
        position: 'relative',
        width: 1,
        height: 14,
        borderRadius: 0.75,
        cursor: 'pointer',
        background:
          'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: `${(hue / 360) * 100}%`,
          top: '50%',
          width: 14,
          height: 14,
          borderRadius: '50%',
          border: '2px solid #fff',
          boxShadow: '0 0 0 1px rgba(0,0,0,0.4)',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}
      />
    </Box>
  );
}

// ----------------------------------------------------------------------

export function HsvColorPicker({ value, onChange, savedColors = DEFAULT_SAVED, size = 22 }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [extraSaved, setExtraSaved] = useState([]);
  const [hexInput, setHexInput] = useState(value);

  const rgb = hexToRgb(value) || BLACK_RGB;
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  useEffect(() => {
    setHexInput(value);
  }, [value]);

  const setFromHsv = useCallback(
    (h, s, v) => {
      onChange(rgbToHex(hsvToRgb(h, s, v)));
    },
    [onChange]
  );

  const handleHexInput = useCallback(
    (evt) => {
      const raw = evt.target.value;
      setHexInput(raw);
      const next = raw.startsWith('#') ? raw : `#${raw}`;
      if (hexToRgb(next)) onChange(next);
    },
    [onChange]
  );

  const handleRgbInput = useCallback(
    (channel, evt) => {
      const num = clamp(Number(evt.target.value) || 0, 0, 255);
      onChange(rgbToHex({ ...rgb, [channel]: num }));
    },
    [onChange, rgb]
  );

  const allSaved = [...savedColors, ...extraSaved];

  return (
    <>
      <ButtonBase
        onClick={(evt) => setAnchorEl(evt.currentTarget)}
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          bgcolor: value,
          border: (theme) => `2px solid ${theme.palette.background.paper}`,
          boxShadow: (theme) => `0 0 0 1px ${theme.palette.divider}`,
        }}
      />
      <Popover
        open={!!anchorEl}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Stack spacing={1.5} sx={{ p: 2, width: 220 }}>
          <SatValueSquare hue={hsv.h} s={hsv.s} v={hsv.v} onChange={(s, v) => setFromHsv(hsv.h, s, v)} />
          <HueSlider hue={hsv.h} onChange={(h) => setFromHsv(h, hsv.s, hsv.v)} />

          <Stack direction="row" spacing={1} alignItems="center">
            <Box sx={{ width: 28, height: 28, borderRadius: 0.75, bgcolor: value, flexShrink: 0 }} />
            <TextField
              size="small"
              value={hexInput}
              onChange={handleHexInput}
              sx={{ flexGrow: 1 }}
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Stack>

          <Stack direction="row" spacing={1}>
            {['r', 'g', 'b'].map((channel) => (
              <TextField
                key={channel}
                size="small"
                type="number"
                label={channel.toUpperCase()}
                value={rgb[channel]}
                onChange={(evt) => handleRgbInput(channel, evt)}
                inputProps={{ min: 0, max: 255, style: { fontSize: 13 } }}
              />
            ))}
          </Stack>

          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Guardados
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={0.75}>
            {allSaved.map((swatch) => (
              <ButtonBase
                key={swatch}
                onClick={() => onChange(swatch)}
                sx={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  bgcolor: swatch,
                  border: (theme) =>
                    swatch.toLowerCase() === value.toLowerCase()
                      ? `2px solid ${theme.palette.text.primary}`
                      : `1px solid ${theme.palette.divider}`,
                }}
              />
            ))}
            <ButtonBase
              onClick={() => setExtraSaved((prev) => (prev.includes(value) ? prev : [...prev, value]))}
              sx={{
                width: 20,
                height: 20,
                borderRadius: '50%',
                border: (theme) => `1px dashed ${theme.palette.divider}`,
                typography: 'caption',
                lineHeight: 1,
              }}
            >
              +
            </ButtonBase>
          </Stack>
        </Stack>
      </Popover>
    </>
  );
}
