import { useTranslation } from 'react-i18next';
import { useRef, useState, useCallback } from 'react';

import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { uuidv4 } from 'src/utils/uuidv4';

import { Iconify } from 'src/components/iconify';
import { ColorPicker } from 'src/components/color-utils';

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

const CATEGORIES = [
  { key: 'players', labelKey: 'label_category_players', tools: TOKEN_TYPES.slice(0, 3).map((i) => i.type) },
  { key: 'equipment', labelKey: 'label_category_equipment', tools: TOKEN_TYPES.slice(3).map((i) => i.type) },
  { key: 'zones', labelKey: 'label_category_zones', tools: ZONE_TYPES.map((i) => i.type) },
  { key: 'arrows', labelKey: 'label_category_arrows', tools: ARROW_TYPES.map((i) => `arrow_${i.type}`) },
];

const TOKEN_MAP = Object.fromEntries(TOKEN_TYPES.map((item) => [item.type, item]));
const ZONE_MAP = Object.fromEntries(ZONE_TYPES.map((item) => [item.type, item]));
const ARROW_MAP = Object.fromEntries(ARROW_TYPES.map((item) => [item.type, item]));
const TOOL_CONFIG = {
  ...TOKEN_MAP,
  ...ZONE_MAP,
  ...Object.fromEntries(ARROW_TYPES.map((item) => [`arrow_${item.type}`, item])),
};

const PLAYER_TYPES = ['player_own', 'player_rival', 'goalkeeper'];
const TOKEN_RADIUS = 14;
const BALL_RADIUS = 7;
const EMPTY_ARRAY = [];
const EMPTY_DIAGRAM = { pitchMode: 'half', tokens: EMPTY_ARRAY, arrows: EMPTY_ARRAY, zones: EMPTY_ARRAY };

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

function zoneHandlePoint(zone, dims) {
  if (zone.type === 'zone_rect') {
    return toViewBox({ x: zone.x + zone.w, y: zone.y + zone.h }, dims);
  }
  return toViewBox({ x: zone.x + zone.r, y: zone.y }, dims);
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
    return (
      <g>
        <circle cx={cx} cy={cy} r={BALL_RADIUS} fill="#fff" stroke="#212121" strokeWidth={1.5} />
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

function ZoneShape({ zone, dims, selected }) {
  const fillOpacity = 0.22;
  const strokeWidth = selected ? 3 : 2;
  const strokeDasharray = selected ? undefined : '4 3';

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
        fill={zone.color}
        fillOpacity={fillOpacity}
        stroke={zone.color}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
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
      fill={zone.color}
      fillOpacity={fillOpacity}
      stroke={zone.color}
      strokeWidth={strokeWidth}
      strokeDasharray={strokeDasharray}
    />
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

export function TacticalBoard({ value, onChange, readOnly = false, fileName = 'diagrama' }) {
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

  const diagram = value || EMPTY_DIAGRAM;
  const { pitchMode } = diagram;
  const tokens = diagram.tokens || EMPTY_ARRAY;
  const arrows = diagram.arrows || EMPTY_ARRAY;
  const zones = diagram.zones || EMPTY_ARRAY;
  const dims = PITCH[pitchMode] || PITCH.half;

  const emitChange = useCallback(
    (patch) => {
      onChange?.({ pitchMode, tokens, arrows, zones, ...patch });
    },
    [onChange, pitchMode, tokens, arrows, zones]
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

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    emitChange({
      tokens: tokens.filter((token) => token.id !== selectedId),
      arrows: arrows.filter((arrow) => arrow.id !== selectedId),
      zones: zones.filter((zone) => zone.id !== selectedId),
    });
    setSelectedId(null);
  }, [selectedId, tokens, arrows, zones, emitChange]);

  const clearBoard = useCallback(() => {
    if (!tokens.length && !arrows.length && !zones.length) return;
    if (window.confirm(t('label_confirm_clear_board'))) {
      emitChange({ tokens: [], arrows: [], zones: [] });
      setSelectedId(null);
    }
  }, [tokens.length, arrows.length, zones.length, emitChange, t]);

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
      }
    },
    [readOnly, tool]
  );

  const handleBackgroundClick = useCallback(
    (evt) => {
      if (readOnly || tool.startsWith('zone_')) return;
      const point = pointFromEvent(svgRef.current, evt);
      if (tool === 'select') {
        setSelectedId(null);
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
      if (tool === 'select') {
        setSelectedId(token.id);
        setDraggingId(token.id);
      }
    },
    [readOnly, tool]
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
        setSelectedId(zone.id);
        setDraggingId(zone.id);
      }
    },
    [readOnly, tool]
  );

  const handleResizeHandlePointerDown = useCallback((zone, evt) => {
    evt.stopPropagation();
    setSelectedId(zone.id);
    setResizing({ id: zone.id });
  }, []);

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

  const handleSvgPointerMove = useCallback(
    (evt) => {
      if (readOnly) return;
      const point = pointFromEvent(svgRef.current, evt);
      if (resizing) {
        resizeZone(resizing.id, point);
      } else if (draggingId) {
        moveElement(draggingId, point);
      } else if (zoneDraft) {
        setZoneDraft((prev) => (prev ? { ...prev, x1: point.x, y1: point.y } : prev));
      } else if (arrowStart) {
        setPreview(point);
      }
    },
    [readOnly, resizing, draggingId, zoneDraft, arrowStart, resizeZone, moveElement]
  );

  const handleSvgPointerUp = useCallback(() => {
    setDraggingId(null);
    setResizing(null);
    setZoneDraft((draft) => {
      if (draft) {
        const { subtype, x0, y0, x1, y1 } = draft;
        if (subtype === 'rect') {
          addZone({
            type: 'zone_rect',
            x: Math.min(x0, x1),
            y: Math.min(y0, y1),
            w: Math.max(Math.abs(x1 - x0), 3),
            h: Math.max(Math.abs(y1 - y0), 3),
            color: DEFAULT_ZONE_COLOR,
          });
        } else {
          addZone({
            type: 'zone_circle',
            x: x0,
            y: y0,
            r: Math.max(Math.hypot(x1 - x0, y1 - y0), 3),
            color: DEFAULT_ZONE_COLOR,
          });
        }
      }
      return null;
    });
  }, [addZone]);

  const handleExportImage = useCallback(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgEl);
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
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${fileName}.png`;
        link.click();
      });
    };
    img.src = url;
  }, [dims, fileName]);

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
    setPreview(null);
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

            <Tooltip title={t('label_delete_selected')}>
              <span>
                <IconButton size="small" disabled={!selectedId} onClick={deleteSelected}>
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
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
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
                  <ColorPicker
                    colors={SWATCH_COLORS}
                    selected={selectedToken.bibColor || ''}
                    onSelectColor={(color) => updateTokenField(selectedToken.id, 'bibColor', color)}
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
                <ColorPicker
                  colors={SWATCH_COLORS}
                  selected={selectedToken.color || DEFAULT_MARKER_COLOR}
                  onSelectColor={(color) => updateTokenField(selectedToken.id, 'color', color)}
                />
              </Stack>
            )}

            {selectedZone && (
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {t('label_color')}
                </Typography>
                <ColorPicker
                  colors={SWATCH_COLORS}
                  selected={selectedZone.color}
                  onSelectColor={(color) => updateZoneColor(selectedZone.id, color)}
                />
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

          {previewLine && (
            <path d={previewLine} fill="none" stroke="#fff" strokeDasharray="4 3" strokeWidth={2} />
          )}

          {tokens.map((token) => (
            <g
              key={token.id}
              onPointerDown={(evt) => handleTokenPointerDown(token, evt)}
              onClick={(evt) => handleTokenClick(token, evt)}
              style={{ cursor: readOnly ? 'default' : 'pointer' }}
            >
              <TokenShape token={token} dims={dims} selected={token.id === selectedId} />
            </g>
          ))}
        </svg>
      </Box>
    </Stack>
  );
}
