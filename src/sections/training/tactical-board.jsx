import { useTranslation } from 'react-i18next';
import { useRef, useState, forwardRef, useCallback, useImperativeHandle } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { uuidv4 } from 'src/utils/uuidv4';

import { Iconify } from 'src/components/iconify';

import { HsvColorPicker } from './hsv-color-picker';

// ----------------------------------------------------------------------
// All shapes on the board (players, equipment, zones) are drawn as plain
// SVG primitives defined in this file — no third-party icon set or asset
// pack is used for the diagram itself, since equivalents from tactics
// software like TacticalPad are copyrighted and can't be reused here.

const PITCH = {
  full: { width: 680, height: 440 },
  half: { width: 340, height: 440 },
};

const SWATCH_COLORS = [
  '#ffca28',
  '#ff7043',
  '#ef5350',
  '#ec407a',
  '#ab47bc',
  '#42a5f5',
  '#26c6da',
  '#66bb6a',
];

const DEFAULT_ZONE_COLOR = '#ab47bc';
const DEFAULT_MARKER_COLOR = SWATCH_COLORS[0];

const TOKEN_TYPES = [
  { type: 'player_own', color: '#1565c0', icon: 'mdi:account', labelKey: 'label_player_own' },
  {
    type: 'player_rival',
    color: '#c62828',
    icon: 'mdi:account-outline',
    labelKey: 'label_player_rival',
  },
  { type: 'goalkeeper', color: '#f9a825', icon: 'mdi:account-star', labelKey: 'label_goalkeeper' },
  { type: 'cone', color: '#fb8c00', icon: 'mdi:triangle-outline', labelKey: 'label_cone' },
  { type: 'ball', color: '#212121', icon: 'mdi:soccer', labelKey: 'label_ball' },
  {
    type: 'mini_goal',
    color: '#455a64',
    icon: 'emojione-monotone:goal-net',
    labelKey: 'label_mini_goal',
  },
  { type: 'hurdle', color: '#e64a19', icon: 'mdi:fence', labelKey: 'label_hurdle' },
  { type: 'pole', color: '#fbc02d', icon: 'mdi:map-marker', labelKey: 'label_pole' },
  { type: 'ladder', color: '#78909c', icon: 'mdi:ladder', labelKey: 'label_ladder' },
  { type: 'marker', color: DEFAULT_MARKER_COLOR, icon: 'mdi:circle', labelKey: 'label_marker' },
  { type: 'agility_ring', color: '#f9a825', icon: 'mdi:vector-circle-variant', labelKey: 'label_agility_ring' },
  { type: 'mat', color: '#6d4c41', icon: 'mdi:rectangle-outline', labelKey: 'label_mat' },
  { type: 'dummy', color: '#e65100', icon: 'mdi:human', labelKey: 'label_dummy' },
];

const ZONE_TYPES = [
  { type: 'zone_rect', color: DEFAULT_ZONE_COLOR, icon: 'mdi:square-outline', labelKey: 'label_zone_rect' },
  {
    type: 'zone_circle',
    color: DEFAULT_ZONE_COLOR,
    icon: 'mdi:circle-outline',
    labelKey: 'label_zone_circle',
  },
];

const ARROW_TYPES = [
  { type: 'run', color: '#212121', icon: 'solar:route-bold-duotone', labelKey: 'label_arrow_run' },
  {
    type: 'pass',
    color: '#1565c0',
    dash: '6 4',
    icon: 'eva:arrow-forward-fill',
    labelKey: 'label_arrow_pass',
  },
  {
    type: 'dribble',
    color: '#e65100',
    zigzag: true,
    icon: 'mdi:soccer',
    labelKey: 'label_arrow_dribble',
  },
];

const FREEHAND_CONFIG = { type: 'freehand', color: '#212121', icon: 'solar:pen-bold', labelKey: 'label_freehand' };

const CATEGORIES = [
  { key: 'players', labelKey: 'label_category_players', tools: TOKEN_TYPES.slice(0, 3).map((i) => i.type) },
  { key: 'equipment', labelKey: 'label_category_equipment', tools: TOKEN_TYPES.slice(3).map((i) => i.type) },
  { key: 'zones', labelKey: 'label_category_zones', tools: ZONE_TYPES.map((i) => i.type) },
  {
    key: 'arrows',
    labelKey: 'label_category_arrows',
    tools: [...ARROW_TYPES.map((i) => `arrow_${i.type}`), 'freehand'],
  },
];

const TOKEN_MAP = Object.fromEntries(TOKEN_TYPES.map((item) => [item.type, item]));
const ZONE_MAP = Object.fromEntries(ZONE_TYPES.map((item) => [item.type, item]));
const ARROW_MAP = Object.fromEntries(ARROW_TYPES.map((item) => [item.type, item]));
const ZONE_STYLE_OPTIONS = [
  { value: 'solid', icon: 'mdi:square', labelKey: 'label_zone_style_solid' },
  { value: 'outline', icon: 'mdi:square-outline', labelKey: 'label_zone_style_outline' },
  { value: 'hatch', icon: 'mdi:texture-box', labelKey: 'label_zone_style_hatch' },
];
const TOOL_CONFIG = {
  ...TOKEN_MAP,
  ...ZONE_MAP,
  ...Object.fromEntries(ARROW_TYPES.map((item) => [`arrow_${item.type}`, item])),
  freehand: FREEHAND_CONFIG,
};

const PLAYER_TYPES = ['player_own', 'player_rival', 'goalkeeper'];

// Preset formations: 10 outfield "player_own" slots + 1 goalkeeper, laid out
// in percent-of-pitch coordinates (x = depth from own goal, y = width).
const FORMATIONS = {
  '4-3-3': [
    { type: 'goalkeeper', x: 8, y: 50 },
    { type: 'player_own', x: 26, y: 15 },
    { type: 'player_own', x: 26, y: 38 },
    { type: 'player_own', x: 26, y: 62 },
    { type: 'player_own', x: 26, y: 85 },
    { type: 'player_own', x: 50, y: 28 },
    { type: 'player_own', x: 50, y: 50 },
    { type: 'player_own', x: 50, y: 72 },
    { type: 'player_own', x: 76, y: 20 },
    { type: 'player_own', x: 76, y: 50 },
    { type: 'player_own', x: 76, y: 80 },
  ],
  '4-4-2': [
    { type: 'goalkeeper', x: 8, y: 50 },
    { type: 'player_own', x: 26, y: 15 },
    { type: 'player_own', x: 26, y: 38 },
    { type: 'player_own', x: 26, y: 62 },
    { type: 'player_own', x: 26, y: 85 },
    { type: 'player_own', x: 54, y: 15 },
    { type: 'player_own', x: 54, y: 38 },
    { type: 'player_own', x: 54, y: 62 },
    { type: 'player_own', x: 54, y: 85 },
    { type: 'player_own', x: 78, y: 35 },
    { type: 'player_own', x: 78, y: 65 },
  ],
  '3-5-2': [
    { type: 'goalkeeper', x: 8, y: 50 },
    { type: 'player_own', x: 26, y: 25 },
    { type: 'player_own', x: 26, y: 50 },
    { type: 'player_own', x: 26, y: 75 },
    { type: 'player_own', x: 52, y: 10 },
    { type: 'player_own', x: 52, y: 30 },
    { type: 'player_own', x: 52, y: 50 },
    { type: 'player_own', x: 52, y: 70 },
    { type: 'player_own', x: 52, y: 90 },
    { type: 'player_own', x: 78, y: 35 },
    { type: 'player_own', x: 78, y: 65 },
  ],
  '4-2-3-1': [
    { type: 'goalkeeper', x: 8, y: 50 },
    { type: 'player_own', x: 25, y: 15 },
    { type: 'player_own', x: 25, y: 38 },
    { type: 'player_own', x: 25, y: 62 },
    { type: 'player_own', x: 25, y: 85 },
    { type: 'player_own', x: 45, y: 35 },
    { type: 'player_own', x: 45, y: 65 },
    { type: 'player_own', x: 65, y: 20 },
    { type: 'player_own', x: 65, y: 50 },
    { type: 'player_own', x: 65, y: 80 },
    { type: 'player_own', x: 85, y: 50 },
  ],
};
const TOKEN_RADIUS = 14;
const BALL_RADIUS = 7;
const EMPTY_ARRAY = [];
const EMPTY_DIAGRAM = {
  pitchMode: 'half',
  tokens: EMPTY_ARRAY,
  arrows: EMPTY_ARRAY,
  zones: EMPTY_ARRAY,
  drawings: EMPTY_ARRAY,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pointFromEvent(svgEl, evt) {
  const rect = svgEl.getBoundingClientRect();
  return {
    x: clamp(((evt.clientX - rect.left) / rect.width) * 100, 0, 100),
    y: clamp(((evt.clientY - rect.top) / rect.height) * 100, 0, 100),
  };
}

function toViewBox(point, dims) {
  return { x: (point.x / 100) * dims.width, y: (point.y / 100) * dims.height };
}

function zigzagPath(x1, y1, x2, y2, segments = 6, amplitude = 6) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const px = -dy / len;
  const py = dx / len;
  let d = `M ${x1} ${y1}`;
  for (let i = 1; i <= segments; i += 1) {
    const t = i / segments;
    const bx = x1 + dx * t;
    const by = y1 + dy * t;
    const offset = i === segments ? 0 : i % 2 === 0 ? -amplitude : amplitude;
    d += ` L ${bx + px * offset} ${by + py * offset}`;
  }
  return d;
}

function defaultLabel(type, tokens) {
  if (type === 'goalkeeper') return 'GK';
  if (type === 'player_own' || type === 'player_rival') {
    const count = tokens.filter((token) => token.type === type).length;
    return String(count + 1);
  }
  return '';
}

function pathFromPoints(points, dims) {
  if (!points.length) return '';
  return points
    .map((point, index) => {
      const p = toViewBox(point, dims);
      return `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
    })
    .join(' ');
}

function zoneHandlePoint(zone, dims) {
  if (zone.type === 'zone_rect') {
    return toViewBox({ x: zone.x + zone.w, y: zone.y + zone.h }, dims);
  }
  return toViewBox({ x: zone.x + zone.r, y: zone.y }, dims);
}

const MIN_TOKEN_SCALE = 0.55;
const MAX_TOKEN_SCALE = 2.2;

// Base "footprint" radius (at scale 1) used to place each token's resize
// handle and to derive a new scale from how far the handle is dragged.
const TOKEN_FOOTPRINT = {
  ball: BALL_RADIUS + 5,
  cone: 16,
  mini_goal: 19,
  hurdle: 20,
  pole: 16,
  ladder: 23,
  marker: 13,
  agility_ring: 17,
  mat: 20,
  dummy: 21,
};

function tokenFootprint(type) {
  return TOKEN_FOOTPRINT[type] || TOKEN_RADIUS + 5;
}

function tokenHandlePoint(center, type, scale) {
  const offset = tokenFootprint(type) * scale * Math.SQRT1_2;
  return { x: center.x + offset, y: center.y + offset };
}

// The rotate handle sits above the token (angle 0 == pointing up) and turns
// with it, so it always shows the current facing direction while dragging.
function tokenRotateAnchor(center, type, scale, rotation) {
  const rad = ((rotation - 90) * Math.PI) / 180;
  const dist = tokenFootprint(type) * scale;
  return { x: center.x + dist * Math.cos(rad), y: center.y + dist * Math.sin(rad) };
}

function tokenRotateHandlePoint(center, type, scale, rotation) {
  const rad = ((rotation - 90) * Math.PI) / 180;
  const dist = tokenFootprint(type) * scale + 16;
  return { x: center.x + dist * Math.cos(rad), y: center.y + dist * Math.sin(rad) };
}

function pentagonPoints(cx, cy, r, rotationDeg = -90) {
  const pts = [];
  for (let i = 0; i < 5; i += 1) {
    const angle = ((rotationDeg + i * 72) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
}

// ----------------------------------------------------------------------

function PitchBackground({ mode }) {
  const { width, height } = PITCH[mode];
  const stroke = 'rgba(255,255,255,0.75)';
  const stripes = [];
  const stripeCount = 8;
  const stripeWidth = width / stripeCount;
  for (let i = 0; i < stripeCount; i += 1) {
    stripes.push(
      <rect
        key={i}
        x={i * stripeWidth}
        y={0}
        width={stripeWidth}
        height={height}
        fill={i % 2 === 0 ? '#2e7d32' : '#33862f'}
      />
    );
  }

  const boxWidth = width * 0.16;
  const boxHeight = height * 0.42;
  const goalAreaWidth = width * 0.06;
  const goalAreaHeight = height * 0.2;
  const goalDepth = width * 0.012;
  const goalHeight = height * 0.09;

  return (
    <g>
      {stripes}
      <rect x={0} y={0} width={width} height={height} fill="none" stroke={stroke} strokeWidth={2} />

      {mode === 'full' && (
        <>
          <line x1={width / 2} y1={0} x2={width / 2} y2={height} stroke={stroke} strokeWidth={2} />
          <circle
            cx={width / 2}
            cy={height / 2}
            r={height * 0.13}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          <circle cx={width / 2} cy={height / 2} r={2.5} fill={stroke} />
        </>
      )}

      <rect
        x={0}
        y={height / 2 - boxHeight / 2}
        width={boxWidth}
        height={boxHeight}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
      />
      <rect
        x={0}
        y={height / 2 - goalAreaHeight / 2}
        width={goalAreaWidth}
        height={goalAreaHeight}
        fill="none"
        stroke={stroke}
        strokeWidth={2}
      />
      <rect
        x={-goalDepth}
        y={height / 2 - goalHeight / 2}
        width={goalDepth}
        height={goalHeight}
        fill="none"
        stroke={stroke}
        strokeWidth={3}
      />

      {mode === 'full' && (
        <>
          <rect
            x={width - boxWidth}
            y={height / 2 - boxHeight / 2}
            width={boxWidth}
            height={boxHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          <rect
            x={width - goalAreaWidth}
            y={height / 2 - goalAreaHeight / 2}
            width={goalAreaWidth}
            height={goalAreaHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          <rect
            x={width}
            y={height / 2 - goalHeight / 2}
            width={goalDepth}
            height={goalHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={3}
          />
        </>
      )}

      {mode === 'half' && (
        <>
          <rect
            x={width - boxWidth}
            y={height / 2 - boxHeight / 2}
            width={boxWidth}
            height={boxHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          <rect
            x={width - goalAreaWidth}
            y={height / 2 - goalAreaHeight / 2}
            width={goalAreaWidth}
            height={goalAreaHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
          <rect
            x={width}
            y={height / 2 - goalHeight / 2}
            width={goalDepth}
            height={goalHeight}
            fill="none"
            stroke={stroke}
            strokeWidth={3}
          />
          <path
            d={`M 0 ${height / 2 - height * 0.13} A ${height * 0.13} ${height * 0.13} 0 0 1 0 ${height / 2 + height * 0.13}`}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
          />
        </>
      )}
    </g>
  );
}

function TokenShape({ token, dims, selected }) {
  const config = TOKEN_MAP[token.type];
  const { x: cx, y: cy } = toViewBox(token, dims);

  if (token.type === 'cone') {
    const s = 11;
    return (
      <g>
        <polygon
          points={`${cx},${cy - s} ${cx - s},${cy + s} ${cx + s},${cy + s}`}
          fill={config.color}
          stroke="#fff"
          strokeWidth={1.5}
        />
        {selected && (
          <circle cx={cx} cy={cy} r={s + 5} fill="none" stroke="#fff" strokeDasharray="3 2" />
        )}
      </g>
    );
  }

  if (token.type === 'ball') {
    const r = BALL_RADIUS;
    const pentR = r * 0.42;
    const pentagon = pentagonPoints(cx, cy, pentR);
    const seams = pentagon.map((p, i) => {
      const angle = ((-90 + i * 72) * Math.PI) / 180;
      const ex = cx + r * 0.94 * Math.cos(angle);
      const ey = cy + r * 0.94 * Math.sin(angle);
      return (
        <line
          key={i}
          x1={p[0]}
          y1={p[1]}
          x2={ex}
          y2={ey}
          stroke="#212121"
          strokeWidth={r * 0.13}
          strokeLinecap="round"
        />
      );
    });
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="#fdfdfd" stroke="#212121" strokeWidth={r * 0.14} />
        {seams}
        <polygon points={pentagon.map((p) => p.join(',')).join(' ')} fill="#212121" />
        {selected && (
          <circle
            cx={cx}
            cy={cy}
            r={BALL_RADIUS + 5}
            fill="none"
            stroke="#212121"
            strokeDasharray="3 2"
          />
        )}
      </g>
    );
  }

  if (token.type === 'mini_goal') {
    const w = 26;
    const h = 14;
    return (
      <g>
        <path
          d={`M ${cx - w / 2} ${cy + h / 2} L ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 2}`}
          fill="none"
          stroke={config.color}
          strokeWidth={3}
        />
        {selected && (
          <rect
            x={cx - w / 2 - 5}
            y={cy - h / 2 - 5}
            width={w + 10}
            height={h + 10}
            fill="none"
            stroke="#212121"
            strokeDasharray="3 2"
          />
        )}
      </g>
    );
  }

  if (token.type === 'hurdle') {
    const w = 24;
    const barH = 5;
    const legH = 10;
    return (
      <g>
        <rect x={cx - w / 2} y={cy - legH / 2} width={4} height={legH} fill="#455a64" />
        <rect x={cx + w / 2 - 4} y={cy - legH / 2} width={4} height={legH} fill="#455a64" />
        <rect
          x={cx - w / 2}
          y={cy - legH / 2 - barH}
          width={w}
          height={barH}
          fill={config.color}
          stroke="#fff"
          strokeWidth={1}
        />
        {selected && (
          <rect
            x={cx - w / 2 - 5}
            y={cy - legH / 2 - barH - 5}
            width={w + 10}
            height={legH + barH + 10}
            fill="none"
            stroke="#212121"
            strokeDasharray="3 2"
          />
        )}
      </g>
    );
  }

  if (token.type === 'pole') {
    const h = 22;
    return (
      <g>
        <line
          x1={cx}
          y1={cy + h / 2}
          x2={cx}
          y2={cy - h / 2}
          stroke={config.color}
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy - h / 2} r={3} fill={config.color} />
        {selected && (
          <circle cx={cx} cy={cy} r={h / 2 + 5} fill="none" stroke="#212121" strokeDasharray="3 2" />
        )}
      </g>
    );
  }

  if (token.type === 'ladder') {
    const w = 34;
    const h = 12;
    const rungs = 4;
    const rungEls = [];
    for (let i = 1; i < rungs; i += 1) {
      const rx = cx - w / 2 + (w / rungs) * i;
      rungEls.push(
        <line key={i} x1={rx} y1={cy - h / 2} x2={rx} y2={cy + h / 2} stroke={config.color} strokeWidth={1.5} />
      );
    }
    return (
      <g>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} fill="none" stroke={config.color} strokeWidth={2} />
        {rungEls}
        {selected && (
          <rect
            x={cx - w / 2 - 5}
            y={cy - h / 2 - 5}
            width={w + 10}
            height={h + 10}
            fill="none"
            stroke="#212121"
            strokeDasharray="3 2"
          />
        )}
      </g>
    );
  }

  if (token.type === 'marker') {
    const r = 8;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill={token.color || config.color} stroke="#fff" strokeWidth={1.5} />
        {selected && (
          <circle cx={cx} cy={cy} r={r + 5} fill="none" stroke="#212121" strokeDasharray="3 2" />
        )}
      </g>
    );
  }

  if (token.type === 'agility_ring') {
    const r = 11;
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={config.color} strokeWidth={4} />
        {selected && (
          <circle cx={cx} cy={cy} r={r + 6} fill="none" stroke="#212121" strokeDasharray="3 2" />
        )}
      </g>
    );
  }

  if (token.type === 'mat') {
    const w = 26;
    const h = 15;
    return (
      <g>
        <rect x={cx - w / 2} y={cy - h / 2} width={w} height={h} rx={2} fill={config.color} stroke="#fff" strokeWidth={1.5} />
        {selected && (
          <rect
            x={cx - w / 2 - 5}
            y={cy - h / 2 - 5}
            width={w + 10}
            height={h + 10}
            fill="none"
            stroke="#212121"
            strokeDasharray="3 2"
          />
        )}
      </g>
    );
  }

  if (token.type === 'dummy') {
    return (
      <g>
        <circle cx={cx} cy={cy - 9} r={5} fill={config.color} stroke="#fff" strokeWidth={1} />
        <rect x={cx - 6} y={cy - 4} width={12} height={16} rx={4} fill={config.color} stroke="#fff" strokeWidth={1} />
        {selected && (
          <circle cx={cx} cy={cy} r={16} fill="none" stroke="#212121" strokeDasharray="3 2" />
        )}
      </g>
    );
  }

  return (
    <g>
      {token.bibColor && (
        <circle cx={cx} cy={cy} r={TOKEN_RADIUS + 4} fill="none" stroke={token.bibColor} strokeWidth={4} />
      )}
      <circle cx={cx} cy={cy} r={TOKEN_RADIUS} fill={config.color} stroke="#fff" strokeWidth={2} />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={11}
        fontWeight={700}
      >
        {token.label}
      </text>
      {selected && (
        <circle
          cx={cx}
          cy={cy}
          r={TOKEN_RADIUS + 5}
          fill="none"
          stroke="#212121"
          strokeDasharray="3 2"
        />
      )}
    </g>
  );
}

function zoneFillProps(zone) {
  const style = zone.style || 'solid';
  if (style === 'outline') return { fill: 'none' };
  if (style === 'hatch') return { fill: 'url(#zone-hatch)', style: { color: zone.color } };
  return { fill: zone.color, fillOpacity: 0.22 };
}

function ZoneShape({ zone, dims, selected }) {
  const strokeWidth = selected ? 3 : 2;
  const strokeDasharray = selected ? undefined : '4 3';
  const fillProps = zoneFillProps(zone);

  if (zone.type === 'zone_rect') {
    const p = toViewBox({ x: zone.x, y: zone.y }, dims);
    const w = (zone.w / 100) * dims.width;
    const h = (zone.h / 100) * dims.height;
    return (
      <rect
        x={p.x}
        y={p.y}
        width={w}
        height={h}
        stroke={zone.color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        {...fillProps}
      />
    );
  }

  const c = toViewBox({ x: zone.x, y: zone.y }, dims);
  const r = (zone.r / 100) * dims.width;
  return (
    <circle
      cx={c.x}
      cy={c.y}
      r={r}
      stroke={zone.color}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
      {...fillProps}
    />
  );
}

function DrawingShape({ drawing, dims, selected }) {
  const d = pathFromPoints(drawing.points, dims);
  return (
    <g>
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" />
      <path
        d={d}
        fill="none"
        stroke={selected ? '#fff' : drawing.color}
        strokeWidth={selected ? 4.5 : 2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

function ArrowShape({ arrow, dims, selected }) {
  const config = ARROW_MAP[arrow.type];
  const p1 = toViewBox({ x: arrow.x1, y: arrow.y1 }, dims);
  const p2 = toViewBox({ x: arrow.x2, y: arrow.y2 }, dims);
  const d = config.zigzag
    ? zigzagPath(p1.x, p1.y, p2.x, p2.y)
    : `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;

  return (
    <g>
      <path d={d} fill="none" stroke="transparent" strokeWidth={14} />
      <path
        d={d}
        fill="none"
        stroke={selected ? '#fff' : config.color}
        strokeWidth={selected ? 4.5 : 2.5}
        strokeDasharray={config.dash}
        markerEnd={`url(#arrowhead-${arrow.type})`}
      />
    </g>
  );
}

// ----------------------------------------------------------------------

export const TacticalBoard = forwardRef(
  ({ value, onChange, readOnly = false, fileName = 'diagrama' }, ref) => {
  const { t } = useTranslation();
  const svgRef = useRef(null);
  const [activeCategory, setActiveCategory] = useState('players');
  const [tool, setTool] = useState('select');
  const [selectedId, setSelectedId] = useState(null);
  const [draggingId, setDraggingId] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [arrowStart, setArrowStart] = useState(null);
  const [zoneDraft, setZoneDraft] = useState(null);
  const [preview, setPreview] = useState(null);
  const [freehandPoints, setFreehandPoints] = useState(null);
  const [freehandColor, setFreehandColor] = useState('#212121');
  const [equipmentAnchor, setEquipmentAnchor] = useState(null);
  const [formationAnchor, setFormationAnchor] = useState(null);
  const [history, setHistory] = useState(EMPTY_ARRAY);
  const [future, setFuture] = useState(EMPTY_ARRAY);
  const historyLockRef = useRef(false);
  const [multiSelectedIds, setMultiSelectedIds] = useState(EMPTY_ARRAY);
  const [marquee, setMarquee] = useState(null);
  const [groupDragStart, setGroupDragStart] = useState(null);

  const diagram = value || EMPTY_DIAGRAM;
  const { pitchMode } = diagram;
  const tokens = diagram.tokens || EMPTY_ARRAY;
  const arrows = diagram.arrows || EMPTY_ARRAY;
  const zones = diagram.zones || EMPTY_ARRAY;
  const drawings = diagram.drawings || EMPTY_ARRAY;
  const dims = PITCH[pitchMode] || PITCH.half;

  // Snapshots the diagram as it is right now, before a change is applied —
  // used so a single Ctrl+Z step corresponds to one user gesture (one drag,
  // one click-to-add), not one state update per pointermove event.
  const pushHistorySnapshot = useCallback(() => {
    setHistory((prev) => [...prev.slice(-49), { pitchMode, tokens, arrows, zones, drawings }]);
    setFuture(EMPTY_ARRAY);
  }, [pitchMode, tokens, arrows, zones, drawings]);

  const emitChange = useCallback(
    (patch) => {
      if (!historyLockRef.current) pushHistorySnapshot();
      onChange?.({ pitchMode, tokens, arrows, zones, drawings, ...patch });
    },
    [onChange, pitchMode, tokens, arrows, zones, drawings, pushHistorySnapshot]
  );

  const addToken = useCallback(
    (type, point) => {
      const newToken = {
        id: uuidv4(),
        type,
        x: point.x,
        y: point.y,
        label: defaultLabel(type, tokens),
        ...(type === 'marker' && { color: DEFAULT_MARKER_COLOR }),
      };
      emitChange({ tokens: [...tokens, newToken] });
    },
    [tokens, emitChange]
  );

  const addZone = useCallback(
    (zone) => {
      emitChange({ zones: [...zones, { id: uuidv4(), ...zone }] });
    },
    [zones, emitChange]
  );

  const addArrow = useCallback(
    (type, start, end) => {
      const newArrow = { id: uuidv4(), type, x1: start.x, y1: start.y, x2: end.x, y2: end.y };
      emitChange({ arrows: [...arrows, newArrow] });
    },
    [arrows, emitChange]
  );

  const addDrawing = useCallback(
    (points, color) => {
      emitChange({ drawings: [...drawings, { id: uuidv4(), points, color }] });
    },
    [drawings, emitChange]
  );

  const moveElement = useCallback(
    (id, point) => {
      if (tokens.some((token) => token.id === id)) {
        emitChange({
          tokens: tokens.map((token) => (token.id === id ? { ...token, ...point } : token)),
        });
      } else if (zones.some((zone) => zone.id === id)) {
        emitChange({
          zones: zones.map((zone) => (zone.id === id ? { ...zone, x: point.x, y: point.y } : zone)),
        });
      }
    },
    [tokens, zones, emitChange]
  );

  const resizeZone = useCallback(
    (id, point) => {
      const zone = zones.find((item) => item.id === id);
      if (!zone) return;
      if (zone.type === 'zone_rect') {
        const w = clamp(point.x - zone.x, 3, 100);
        const h = clamp(point.y - zone.y, 3, 100);
        emitChange({ zones: zones.map((item) => (item.id === id ? { ...item, w, h } : item)) });
      } else {
        const r = clamp(Math.hypot(point.x - zone.x, point.y - zone.y), 3, 60);
        emitChange({ zones: zones.map((item) => (item.id === id ? { ...item, r } : item)) });
      }
    },
    [zones, emitChange]
  );

  const resizeToken = useCallback(
    (id, point) => {
      const token = tokens.find((item) => item.id === id);
      if (!token) return;
      const centerPx = toViewBox(token, dims);
      const pointPx = toViewBox(point, dims);
      const dist = Math.hypot(pointPx.x - centerPx.x, pointPx.y - centerPx.y);
      const scale = clamp(dist / (tokenFootprint(token.type) * Math.SQRT1_2), MIN_TOKEN_SCALE, MAX_TOKEN_SCALE);
      emitChange({ tokens: tokens.map((item) => (item.id === id ? { ...item, scale } : item)) });
    },
    [tokens, dims, emitChange]
  );

  const rotateToken = useCallback(
    (id, point) => {
      const token = tokens.find((item) => item.id === id);
      if (!token) return;
      const centerPx = toViewBox(token, dims);
      const pointPx = toViewBox(point, dims);
      const angleDeg = (Math.atan2(pointPx.y - centerPx.y, pointPx.x - centerPx.x) * 180) / Math.PI;
      const rotation = ((angleDeg + 90) % 360 + 360) % 360;
      emitChange({ tokens: tokens.map((item) => (item.id === id ? { ...item, rotation } : item)) });
    },
    [tokens, dims, emitChange]
  );

  const updateTokenField = useCallback(
    (id, field, value2) => {
      emitChange({
        tokens: tokens.map((token) => (token.id === id ? { ...token, [field]: value2 } : token)),
      });
    },
    [tokens, emitChange]
  );

  const updateZoneColor = useCallback(
    (id, color) => {
      emitChange({ zones: zones.map((zone) => (zone.id === id ? { ...zone, color } : zone)) });
    },
    [zones, emitChange]
  );

  const updateZoneStyle = useCallback(
    (id, style) => {
      emitChange({ zones: zones.map((zone) => (zone.id === id ? { ...zone, style } : zone)) });
    },
    [zones, emitChange]
  );

  const deleteSelected = useCallback(() => {
    if (!selectedId && !multiSelectedIds.length) return;
    emitChange({
      tokens: tokens.filter((token) => token.id !== selectedId && !multiSelectedIds.includes(token.id)),
      arrows: arrows.filter((arrow) => arrow.id !== selectedId),
      zones: zones.filter((zone) => zone.id !== selectedId),
      drawings: drawings.filter((drawing) => drawing.id !== selectedId),
    });
    setSelectedId(null);
    setMultiSelectedIds(EMPTY_ARRAY);
  }, [selectedId, multiSelectedIds, tokens, arrows, zones, drawings, emitChange]);

  const undo = useCallback(() => {
    if (!history.length) return;
    const last = history[history.length - 1];
    setFuture((prev) => [...prev, { pitchMode, tokens, arrows, zones, drawings }]);
    setHistory((prev) => prev.slice(0, -1));
    setSelectedId(null);
    setMultiSelectedIds(EMPTY_ARRAY);
    onChange?.(last);
  }, [history, pitchMode, tokens, arrows, zones, drawings, onChange]);

  const redo = useCallback(() => {
    if (!future.length) return;
    const last = future[future.length - 1];
    setHistory((prev) => [...prev, { pitchMode, tokens, arrows, zones, drawings }]);
    setFuture((prev) => prev.slice(0, -1));
    setSelectedId(null);
    setMultiSelectedIds(EMPTY_ARRAY);
    onChange?.(last);
  }, [future, pitchMode, tokens, arrows, zones, drawings, onChange]);

  const DUPLICATE_OFFSET = 4;

  const duplicateSelected = useCallback(() => {
    if (multiSelectedIds.length) {
      const newIds = [];
      const cloned = tokens
        .filter((token) => multiSelectedIds.includes(token.id))
        .map((token) => {
          const newId = uuidv4();
          newIds.push(newId);
          return {
            ...token,
            id: newId,
            x: clamp(token.x + DUPLICATE_OFFSET, 0, 100),
            y: clamp(token.y + DUPLICATE_OFFSET, 0, 100),
          };
        });
      emitChange({ tokens: [...tokens, ...cloned] });
      setMultiSelectedIds(newIds);
      return;
    }
    if (!selectedId) return;
    const token = tokens.find((item) => item.id === selectedId);
    if (token) {
      const newToken = {
        ...token,
        id: uuidv4(),
        x: clamp(token.x + DUPLICATE_OFFSET, 0, 100),
        y: clamp(token.y + DUPLICATE_OFFSET, 0, 100),
      };
      emitChange({ tokens: [...tokens, newToken] });
      setSelectedId(newToken.id);
      return;
    }
    const zone = zones.find((item) => item.id === selectedId);
    if (zone) {
      const newZone = {
        ...zone,
        id: uuidv4(),
        x: clamp(zone.x + DUPLICATE_OFFSET, 0, 100),
        y: clamp(zone.y + DUPLICATE_OFFSET, 0, 100),
      };
      emitChange({ zones: [...zones, newZone] });
      setSelectedId(newZone.id);
      return;
    }
    const arrow = arrows.find((item) => item.id === selectedId);
    if (arrow) {
      const newArrow = {
        ...arrow,
        id: uuidv4(),
        x1: clamp(arrow.x1 + DUPLICATE_OFFSET, 0, 100),
        y1: clamp(arrow.y1 + DUPLICATE_OFFSET, 0, 100),
        x2: clamp(arrow.x2 + DUPLICATE_OFFSET, 0, 100),
        y2: clamp(arrow.y2 + DUPLICATE_OFFSET, 0, 100),
      };
      emitChange({ arrows: [...arrows, newArrow] });
      setSelectedId(newArrow.id);
      return;
    }
    const drawing = drawings.find((item) => item.id === selectedId);
    if (drawing) {
      const newDrawing = {
        ...drawing,
        id: uuidv4(),
        points: drawing.points.map((point) => ({
          x: clamp(point.x + DUPLICATE_OFFSET, 0, 100),
          y: clamp(point.y + DUPLICATE_OFFSET, 0, 100),
        })),
      };
      emitChange({ drawings: [...drawings, newDrawing] });
      setSelectedId(newDrawing.id);
    }
  }, [multiSelectedIds, selectedId, tokens, zones, arrows, drawings, emitChange]);

  const reorderElement = useCallback(
    (id, toFront) => {
      if (!id) return;
      if (tokens.some((item) => item.id === id)) {
        const item = tokens.find((token) => token.id === id);
        const rest = tokens.filter((token) => token.id !== id);
        emitChange({ tokens: toFront ? [...rest, item] : [item, ...rest] });
      } else if (zones.some((item) => item.id === id)) {
        const item = zones.find((zone) => zone.id === id);
        const rest = zones.filter((zone) => zone.id !== id);
        emitChange({ zones: toFront ? [...rest, item] : [item, ...rest] });
      } else if (arrows.some((item) => item.id === id)) {
        const item = arrows.find((arrow) => arrow.id === id);
        const rest = arrows.filter((arrow) => arrow.id !== id);
        emitChange({ arrows: toFront ? [...rest, item] : [item, ...rest] });
      } else if (drawings.some((item) => item.id === id)) {
        const item = drawings.find((drawing) => drawing.id === id);
        const rest = drawings.filter((drawing) => drawing.id !== id);
        emitChange({ drawings: toFront ? [...rest, item] : [item, ...rest] });
      }
    },
    [tokens, zones, arrows, drawings, emitChange]
  );

  const applyFormation = useCallback(
    (key) => {
      const preset = FORMATIONS[key];
      if (!preset) return;
      const others = tokens.filter((token) => token.type !== 'player_own' && token.type !== 'goalkeeper');
      const placed = [];
      let shirt = 0;
      preset.forEach((slot) => {
        if (slot.type !== 'goalkeeper') shirt += 1;
        placed.push({
          id: uuidv4(),
          type: slot.type,
          x: slot.x,
          y: slot.y,
          label: slot.type === 'goalkeeper' ? 'GK' : String(shirt),
        });
      });
      emitChange({ tokens: [...others, ...placed] });
      setSelectedId(null);
      setMultiSelectedIds(EMPTY_ARRAY);
      setFormationAnchor(null);
    },
    [tokens, emitChange]
  );

  const clearBoard = useCallback(() => {
    if (!tokens.length && !arrows.length && !zones.length && !drawings.length) return;
    if (window.confirm(t('label_confirm_clear_board'))) {
      emitChange({ tokens: [], arrows: [], zones: [], drawings: [] });
      setSelectedId(null);
      setMultiSelectedIds(EMPTY_ARRAY);
    }
  }, [tokens.length, arrows.length, zones.length, drawings.length, emitChange, t]);

  const registerPoint = useCallback(
    (point) => {
      if (!arrowStart) {
        setArrowStart(point);
      } else {
        addArrow(tool.replace('arrow_', ''), arrowStart, point);
        setArrowStart(null);
        setPreview(null);
      }
    },
    [arrowStart, tool, addArrow]
  );

  const handleBackgroundPointerDown = useCallback(
    (evt) => {
      if (readOnly) return;
      if (tool.startsWith('zone_')) {
        const point = pointFromEvent(svgRef.current, evt);
        setZoneDraft({ subtype: tool.replace('zone_', ''), x0: point.x, y0: point.y, x1: point.x, y1: point.y });
      } else if (tool === 'freehand') {
        const point = pointFromEvent(svgRef.current, evt);
        setFreehandPoints([point]);
      } else if (tool === 'select') {
        const point = pointFromEvent(svgRef.current, evt);
        setMarquee({ x0: point.x, y0: point.y, x1: point.x, y1: point.y });
      }
    },
    [readOnly, tool]
  );

  const handleBackgroundClick = useCallback(
    (evt) => {
      if (readOnly || tool.startsWith('zone_') || tool === 'freehand') return;
      const point = pointFromEvent(svgRef.current, evt);
      if (tool === 'select') {
        setSelectedId(null);
        setMultiSelectedIds(EMPTY_ARRAY);
      } else if (tool.startsWith('arrow_')) {
        registerPoint(point);
      } else {
        addToken(tool, point);
      }
    },
    [readOnly, tool, registerPoint, addToken]
  );

  const handleTokenPointerDown = useCallback(
    (token, evt) => {
      if (readOnly) return;
      evt.stopPropagation();
      if (tool !== 'select') return;
      if (multiSelectedIds.length > 1 && multiSelectedIds.includes(token.id)) {
        const point = pointFromEvent(svgRef.current, evt);
        const positions = {};
        tokens.forEach((item) => {
          if (multiSelectedIds.includes(item.id)) positions[item.id] = { x: item.x, y: item.y };
        });
        historyLockRef.current = true;
        pushHistorySnapshot();
        setGroupDragStart({ point, positions });
        return;
      }
      setMultiSelectedIds(EMPTY_ARRAY);
      setSelectedId(token.id);
      historyLockRef.current = true;
      pushHistorySnapshot();
      setDraggingId(token.id);
    },
    [readOnly, tool, multiSelectedIds, tokens, pushHistorySnapshot]
  );

  const handleTokenClick = useCallback(
    (token, evt) => {
      if (readOnly) return;
      evt.stopPropagation();
      if (tool.startsWith('arrow_')) {
        registerPoint({ x: token.x, y: token.y });
      }
    },
    [readOnly, tool, registerPoint]
  );

  const handleZonePointerDown = useCallback(
    (zone, evt) => {
      if (readOnly) return;
      evt.stopPropagation();
      if (tool === 'select') {
        setMultiSelectedIds(EMPTY_ARRAY);
        setSelectedId(zone.id);
        historyLockRef.current = true;
        pushHistorySnapshot();
        setDraggingId(zone.id);
      }
    },
    [readOnly, tool, pushHistorySnapshot]
  );

  const handleResizeHandlePointerDown = useCallback(
    (zone, evt) => {
      evt.stopPropagation();
      setSelectedId(zone.id);
      historyLockRef.current = true;
      pushHistorySnapshot();
      setResizing({ id: zone.id, kind: 'zone' });
    },
    [pushHistorySnapshot]
  );

  const handleTokenResizeHandlePointerDown = useCallback(
    (token, evt) => {
      evt.stopPropagation();
      setSelectedId(token.id);
      historyLockRef.current = true;
      pushHistorySnapshot();
      setResizing({ id: token.id, kind: 'token' });
    },
    [pushHistorySnapshot]
  );

  const handleTokenRotateHandlePointerDown = useCallback(
    (token, evt) => {
      evt.stopPropagation();
      setSelectedId(token.id);
      historyLockRef.current = true;
      pushHistorySnapshot();
      setResizing({ id: token.id, kind: 'token-rotate' });
    },
    [pushHistorySnapshot]
  );

  const handleArrowPointerDown = useCallback(
    (arrow, evt) => {
      if (readOnly) return;
      if (tool === 'select') {
        evt.stopPropagation();
        setSelectedId(arrow.id);
      }
    },
    [readOnly, tool]
  );

  const handleDrawingPointerDown = useCallback(
    (drawing, evt) => {
      if (readOnly) return;
      if (tool === 'select') {
        evt.stopPropagation();
        setSelectedId(drawing.id);
      }
    },
    [readOnly, tool]
  );

  const handleSvgPointerMove = useCallback(
    (evt) => {
      if (readOnly) return;
      const point = pointFromEvent(svgRef.current, evt);
      if (resizing?.kind === 'token') {
        resizeToken(resizing.id, point);
      } else if (resizing?.kind === 'token-rotate') {
        rotateToken(resizing.id, point);
      } else if (resizing) {
        resizeZone(resizing.id, point);
      } else if (groupDragStart) {
        const dx = point.x - groupDragStart.point.x;
        const dy = point.y - groupDragStart.point.y;
        emitChange({
          tokens: tokens.map((item) =>
            groupDragStart.positions[item.id]
              ? {
                  ...item,
                  x: clamp(groupDragStart.positions[item.id].x + dx, 0, 100),
                  y: clamp(groupDragStart.positions[item.id].y + dy, 0, 100),
                }
              : item
          ),
        });
      } else if (draggingId) {
        moveElement(draggingId, point);
      } else if (marquee) {
        setMarquee((prev) => (prev ? { ...prev, x1: point.x, y1: point.y } : prev));
      } else if (zoneDraft) {
        setZoneDraft((prev) => (prev ? { ...prev, x1: point.x, y1: point.y } : prev));
      } else if (freehandPoints) {
        setFreehandPoints((prev) => (prev ? [...prev, point] : prev));
      } else if (arrowStart) {
        setPreview(point);
      }
    },
    [
      readOnly,
      resizing,
      groupDragStart,
      draggingId,
      marquee,
      zoneDraft,
      freehandPoints,
      arrowStart,
      resizeZone,
      resizeToken,
      rotateToken,
      moveElement,
      tokens,
      emitChange,
    ]
  );

  const handleSvgPointerUp = useCallback(() => {
    setDraggingId(null);
    setResizing(null);
    setGroupDragStart(null);
    historyLockRef.current = false;

    if (marquee) {
      const x0 = Math.min(marquee.x0, marquee.x1);
      const x1 = Math.max(marquee.x0, marquee.x1);
      const y0 = Math.min(marquee.y0, marquee.y1);
      const y1 = Math.max(marquee.y0, marquee.y1);
      const inside = tokens
        .filter((token) => token.x >= x0 && token.x <= x1 && token.y >= y0 && token.y <= y1)
        .map((token) => token.id);
      setMultiSelectedIds(inside);
      setSelectedId(null);
      setMarquee(null);
    }

    if (freehandPoints) {
      if (freehandPoints.length > 1) addDrawing(freehandPoints, freehandColor);
      setFreehandPoints(null);
    }

    if (zoneDraft) {
      const { subtype, x0, y0, x1, y1 } = zoneDraft;
      if (subtype === 'rect') {
        addZone({
          type: 'zone_rect',
          x: Math.min(x0, x1),
          y: Math.min(y0, y1),
          w: Math.max(Math.abs(x1 - x0), 3),
          h: Math.max(Math.abs(y1 - y0), 3),
          color: DEFAULT_ZONE_COLOR,
          style: 'solid',
        });
      } else {
        addZone({
          type: 'zone_circle',
          x: x0,
          y: y0,
          r: Math.max(Math.hypot(x1 - x0, y1 - y0), 3),
          color: DEFAULT_ZONE_COLOR,
          style: 'solid',
        });
      }
      setZoneDraft(null);
    }
  }, [marquee, tokens, zoneDraft, addZone, freehandPoints, addDrawing, freehandColor]);

  const getPngDataUrl = useCallback(
    () =>
      new Promise((resolve, reject) => {
        const svgEl = svgRef.current;
        if (!svgEl) {
          reject(new Error('Board not mounted'));
          return;
        }
        // Export a clean diagram: strip selection rings, resize/rotate
        // handles and the marquee box, which only make sense while editing.
        const clone = svgEl.cloneNode(true);
        clone
          .querySelectorAll(
            '[stroke-dasharray="3 2"], [stroke-dasharray="2 2"], [style*="nwse-resize"], [style*="grab"], [fill="rgba(21,101,192,0.15)"]'
          )
          .forEach((el) => el.remove());
        const serializer = new XMLSerializer();
        const svgString = serializer.serializeToString(clone);
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = dims.width * 2;
          canvas.height = dims.height * 2;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = reject;
        img.src = url;
      }),
    [dims]
  );

  const handleExportImage = useCallback(async () => {
    const dataUrl = await getPngDataUrl();
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${fileName}.png`;
    link.click();
  }, [getPngDataUrl, fileName]);

  useImperativeHandle(ref, () => ({ getPngDataUrl }), [getPngDataUrl]);

  const selectedToken = tokens.find((token) => token.id === selectedId);
  const selectedZone = zones.find((zone) => zone.id === selectedId);
  const activeCategoryDef = CATEGORIES.find((cat) => cat.key === activeCategory) || CATEGORIES[0];

  const previewLine =
    arrowStart && preview
      ? `M ${toViewBox(arrowStart, dims).x} ${toViewBox(arrowStart, dims).y} L ${toViewBox(preview, dims).x} ${toViewBox(preview, dims).y}`
      : null;

  const handleToolChange = (_, next) => {
    if (!next) return;
    setTool(next);
    setArrowStart(null);
    setZoneDraft(null);
    setFreehandPoints(null);
    setPreview(null);
    setMultiSelectedIds(EMPTY_ARRAY);
    setMarquee(null);
  };

  return (
    <Stack spacing={1.5}>
      {!readOnly && (
        <Stack spacing={1}>
          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            <ToggleButtonGroup exclusive size="small" value={tool} onChange={handleToolChange}>
              <ToggleButton value="select">
                <Tooltip title={t('label_select_move')}>
                  <Box component="span" display="flex">
                    <Iconify icon="mdi:cursor-move" />
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>

            <Tabs
              value={activeCategory}
              onChange={(_, next) => setActiveCategory(next)}
              sx={{ minHeight: 32 }}
            >
              {CATEGORIES.map((cat) => (
                <Tab
                  key={cat.key}
                  value={cat.key}
                  label={t(cat.labelKey)}
                  sx={{ minHeight: 32, py: 0, minWidth: 'auto', px: 1.5 }}
                />
              ))}
            </Tabs>

            <ToggleButtonGroup
              exclusive
              size="small"
              value={pitchMode}
              onChange={(_, next) => next && emitChange({ pitchMode: next })}
            >
              <ToggleButton value="half">{t('label_half_pitch')}</ToggleButton>
              <ToggleButton value="full">{t('label_full_pitch')}</ToggleButton>
            </ToggleButtonGroup>

            <Tooltip title={t('label_undo')}>
              <span>
                <IconButton size="small" disabled={!history.length} onClick={undo}>
                  <Iconify icon="mdi:undo" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_redo')}>
              <span>
                <IconButton size="small" disabled={!future.length} onClick={redo}>
                  <Iconify icon="mdi:redo" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_duplicate_selected')}>
              <span>
                <IconButton
                  size="small"
                  disabled={!selectedId && !multiSelectedIds.length}
                  onClick={duplicateSelected}
                >
                  <Iconify icon="mdi:content-duplicate" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_bring_to_front')}>
              <span>
                <IconButton size="small" disabled={!selectedId} onClick={() => reorderElement(selectedId, true)}>
                  <Iconify icon="mdi:flip-to-front" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_send_to_back')}>
              <span>
                <IconButton size="small" disabled={!selectedId} onClick={() => reorderElement(selectedId, false)}>
                  <Iconify icon="mdi:flip-to-back" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_delete_selected')}>
              <span>
                <IconButton
                  size="small"
                  disabled={!selectedId && !multiSelectedIds.length}
                  onClick={deleteSelected}
                >
                  <Iconify icon="solar:trash-bin-trash-bold" />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip title={t('label_clear_board')}>
              <IconButton size="small" onClick={clearBoard}>
                <Iconify icon="solar:restart-bold" />
              </IconButton>
            </Tooltip>

            <Tooltip title={t('label_export_image')}>
              <IconButton size="small" onClick={handleExportImage}>
                <Iconify icon="solar:download-minimalistic-bold" />
              </IconButton>
            </Tooltip>

            {multiSelectedIds.length > 0 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {`${multiSelectedIds.length} ${t('label_selected_count')}`}
              </Typography>
            )}
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
            {activeCategory === 'equipment' ? (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={(evt) => setEquipmentAnchor(evt.currentTarget)}
                  startIcon={
                    <Iconify icon={TOOL_CONFIG[tool]?.icon || 'mdi:dots-grid'} sx={{ color: TOOL_CONFIG[tool]?.color }} />
                  }
                >
                  {t(TOOL_CONFIG[tool]?.labelKey || 'label_category_equipment')}
                </Button>
                <Popover
                  open={!!equipmentAnchor}
                  anchorEl={equipmentAnchor}
                  onClose={() => setEquipmentAnchor(null)}
                >
                  <Box
                    sx={{
                      p: 1.5,
                      width: 176,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 1,
                    }}
                  >
                    {activeCategoryDef.tools.map((toolKey) => {
                      const cfg = TOOL_CONFIG[toolKey];
                      return (
                        <Tooltip key={toolKey} title={t(cfg.labelKey)}>
                          <IconButton
                            onClick={() => {
                              setTool(toolKey);
                              setEquipmentAnchor(null);
                            }}
                            sx={{
                              color: cfg.color,
                              border: (theme) =>
                                `1.5px solid ${tool === toolKey ? theme.palette.primary.main : theme.palette.divider}`,
                            }}
                          >
                            <Iconify icon={cfg.icon} />
                          </IconButton>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Popover>
              </>
            ) : (
              <ToggleButtonGroup exclusive size="small" value={tool} onChange={handleToolChange}>
                {activeCategoryDef.tools.map((toolKey) => {
                  const cfg = TOOL_CONFIG[toolKey];
                  return (
                    <ToggleButton key={toolKey} value={toolKey}>
                      <Tooltip title={t(cfg.labelKey)}>
                        <Box component="span" display="flex" sx={{ color: cfg.color }}>
                          <Iconify icon={cfg.icon} />
                        </Box>
                      </Tooltip>
                    </ToggleButton>
                  );
                })}
              </ToggleButtonGroup>
            )}

            {activeCategory === 'players' && (
              <>
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<Iconify icon="mdi:account-group" />}
                  onClick={(evt) => setFormationAnchor(evt.currentTarget)}
                >
                  {t('label_formation')}
                </Button>
                <Popover
                  open={!!formationAnchor}
                  anchorEl={formationAnchor}
                  onClose={() => setFormationAnchor(null)}
                >
                  <Stack sx={{ p: 1, minWidth: 140 }}>
                    {Object.keys(FORMATIONS).map((key) => (
                      <Button
                        key={key}
                        size="small"
                        onClick={() => applyFormation(key)}
                        sx={{ justifyContent: 'flex-start' }}
                      >
                        {key}
                      </Button>
                    ))}
                  </Stack>
                </Popover>
              </>
            )}

            {selectedToken && PLAYER_TYPES.includes(selectedToken.type) && (
              <>
                <TextField
                  size="small"
                  label={t('label_jersey_number')}
                  value={selectedToken.label}
                  onChange={(evt) =>
                    updateTokenField(selectedToken.id, 'label', evt.target.value.slice(0, 3))
                  }
                  sx={{ width: 110 }}
                />
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('label_bib_color')}
                  </Typography>
                  <HsvColorPicker
                    value={selectedToken.bibColor || DEFAULT_MARKER_COLOR}
                    onChange={(color) => updateTokenField(selectedToken.id, 'bibColor', color)}
                  />
                  {selectedToken.bibColor && (
                    <Tooltip title={t('label_remove_bib')}>
                      <IconButton
                        size="small"
                        onClick={() => updateTokenField(selectedToken.id, 'bibColor', null)}
                      >
                        <Iconify icon="solar:close-circle-bold" />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              </>
            )}

            {selectedToken?.type === 'marker' && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('label_color')}
                </Typography>
                <HsvColorPicker
                  value={selectedToken.color || DEFAULT_MARKER_COLOR}
                  onChange={(color) => updateTokenField(selectedToken.id, 'color', color)}
                />
              </Stack>
            )}

            {selectedZone && (
              <Stack direction="row" spacing={1} alignItems="center">
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {t('label_color')}
                  </Typography>
                  <HsvColorPicker
                    value={selectedZone.color}
                    onChange={(color) => updateZoneColor(selectedZone.id, color)}
                  />
                </Stack>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={selectedZone.style || 'solid'}
                  onChange={(_, next) => next && updateZoneStyle(selectedZone.id, next)}
                >
                  {ZONE_STYLE_OPTIONS.map((opt) => (
                    <ToggleButton key={opt.value} value={opt.value}>
                      <Tooltip title={t(opt.labelKey)}>
                        <Box component="span" display="flex">
                          <Iconify icon={opt.icon} />
                        </Box>
                      </Tooltip>
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>
            )}

            {tool === 'freehand' && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('label_color')}
                </Typography>
                <HsvColorPicker value={freehandColor} onChange={setFreehandColor} />
              </Stack>
            )}
          </Stack>
        </Stack>
      )}

      <Box
        sx={{
          width: 1,
          maxWidth: dims.width,
          aspectRatio: `${dims.width} / ${dims.height}`,
          borderRadius: 1,
          overflow: 'hidden',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.width} ${dims.height}`}
          width={dims.width}
          height={dims.height}
          style={{ width: '100%', height: '100%', display: 'block', cursor: readOnly ? 'default' : 'crosshair' }}
          onPointerMove={handleSvgPointerMove}
          onPointerUp={handleSvgPointerUp}
          onPointerLeave={handleSvgPointerUp}
        >
          <defs>
            {ARROW_TYPES.map((item) => (
              <marker
                key={item.type}
                id={`arrowhead-${item.type}`}
                markerWidth={8}
                markerHeight={8}
                refX={6}
                refY={4}
                orient="auto"
              >
                <path d="M0,0 L8,4 L0,8 Z" fill={item.color} />
              </marker>
            ))}
            <pattern id="zone-hatch" width={6} height={6} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={6} stroke="currentColor" strokeWidth={2} />
            </pattern>
          </defs>

          <PitchBackground mode={pitchMode} />
          <rect
            x={0}
            y={0}
            width={dims.width}
            height={dims.height}
            fill="transparent"
            onPointerDown={handleBackgroundPointerDown}
            onClick={handleBackgroundClick}
          />

          {zones.map((zone) => {
            const handlePoint = zoneHandlePoint(zone, dims);
            const showHandle = !readOnly && zone.id === selectedId && tool === 'select';
            return (
              <g key={zone.id} onPointerDown={(evt) => handleZonePointerDown(zone, evt)}>
                <ZoneShape zone={zone} dims={dims} selected={zone.id === selectedId} />
                {showHandle && (
                  <rect
                    x={handlePoint.x - 5}
                    y={handlePoint.y - 5}
                    width={10}
                    height={10}
                    fill="#fff"
                    stroke="#212121"
                    strokeWidth={1.5}
                    style={{ cursor: 'nwse-resize' }}
                    onPointerDown={(evt) => handleResizeHandlePointerDown(zone, evt)}
                  />
                )}
              </g>
            );
          })}

          {zoneDraft &&
            (() => {
              const { subtype, x0, y0, x1, y1 } = zoneDraft;
              if (subtype === 'rect') {
                const p = toViewBox({ x: Math.min(x0, x1), y: Math.min(y0, y1) }, dims);
                const w = (Math.abs(x1 - x0) / 100) * dims.width;
                const h = (Math.abs(y1 - y0) / 100) * dims.height;
                return (
                  <rect x={p.x} y={p.y} width={w} height={h} fill="none" stroke="#fff" strokeDasharray="4 3" strokeWidth={2} />
                );
              }
              const c = toViewBox({ x: x0, y: y0 }, dims);
              const r = (Math.hypot(x1 - x0, y1 - y0) / 100) * dims.width;
              return <circle cx={c.x} cy={c.y} r={r} fill="none" stroke="#fff" strokeDasharray="4 3" strokeWidth={2} />;
            })()}

          {arrows.map((arrow) => (
            <g key={arrow.id} onPointerDown={(evt) => handleArrowPointerDown(arrow, evt)}>
              <ArrowShape arrow={arrow} dims={dims} selected={arrow.id === selectedId} />
            </g>
          ))}

          {drawings.map((drawing) => (
            <g key={drawing.id} onPointerDown={(evt) => handleDrawingPointerDown(drawing, evt)}>
              <DrawingShape drawing={drawing} dims={dims} selected={drawing.id === selectedId} />
            </g>
          ))}

          {freehandPoints && freehandPoints.length > 1 && (
            <path
              d={pathFromPoints(freehandPoints, dims)}
              fill="none"
              stroke={freehandColor}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={0.7}
            />
          )}

          {previewLine && (
            <path d={previewLine} fill="none" stroke="#fff" strokeDasharray="4 3" strokeWidth={2} />
          )}

          {tokens.map((token) => {
            const scale = token.scale || 1;
            const rotation = token.rotation || 0;
            const center = toViewBox(token, dims);
            const showHandle = !readOnly && token.id === selectedId && tool === 'select';
            const handlePoint = showHandle ? tokenHandlePoint(center, token.type, scale) : null;
            const rotateAnchor = showHandle
              ? tokenRotateAnchor(center, token.type, scale, rotation)
              : null;
            const rotateHandlePoint = showHandle
              ? tokenRotateHandlePoint(center, token.type, scale, rotation)
              : null;
            return (
              <g
                key={token.id}
                onPointerDown={(evt) => handleTokenPointerDown(token, evt)}
                onClick={(evt) => handleTokenClick(token, evt)}
                style={{ cursor: readOnly ? 'default' : 'pointer' }}
              >
                <g
                  transform={`translate(${center.x} ${center.y}) rotate(${rotation}) scale(${scale}) translate(${-center.x} ${-center.y})`}
                >
                  <TokenShape
                    token={token}
                    dims={dims}
                    selected={token.id === selectedId || multiSelectedIds.includes(token.id)}
                  />
                </g>
                {showHandle && (
                  <>
                    <line
                      x1={rotateAnchor.x}
                      y1={rotateAnchor.y}
                      x2={rotateHandlePoint.x}
                      y2={rotateHandlePoint.y}
                      stroke="#212121"
                      strokeWidth={1}
                      strokeDasharray="2 2"
                    />
                    <circle
                      cx={rotateHandlePoint.x}
                      cy={rotateHandlePoint.y}
                      r={5}
                      fill="#fff"
                      stroke="#212121"
                      strokeWidth={1.5}
                      style={{ cursor: 'grab' }}
                      onPointerDown={(evt) => handleTokenRotateHandlePointerDown(token, evt)}
                    />
                    <rect
                      x={handlePoint.x - 5}
                      y={handlePoint.y - 5}
                      width={10}
                      height={10}
                      fill="#fff"
                      stroke="#212121"
                      strokeWidth={1.5}
                      style={{ cursor: 'nwse-resize' }}
                      onPointerDown={(evt) => handleTokenResizeHandlePointerDown(token, evt)}
                    />
                  </>
                )}
              </g>
            );
          })}

          {marquee &&
            (() => {
              const p0 = toViewBox(
                { x: Math.min(marquee.x0, marquee.x1), y: Math.min(marquee.y0, marquee.y1) },
                dims
              );
              const p1 = toViewBox(
                { x: Math.max(marquee.x0, marquee.x1), y: Math.max(marquee.y0, marquee.y1) },
                dims
              );
              return (
                <rect
                  x={p0.x}
                  y={p0.y}
                  width={p1.x - p0.x}
                  height={p1.y - p0.y}
                  fill="rgba(21,101,192,0.15)"
                  stroke="#1565c0"
                  strokeWidth={1}
                  strokeDasharray="4 3"
                />
              );
            })()}
        </svg>
      </Box>
    </Stack>
  );
  }
);

TacticalBoard.displayName = 'TacticalBoard';
