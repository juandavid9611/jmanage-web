import { useTranslation } from 'react-i18next';
import { useRef, useMemo, useState, useEffect, forwardRef, useCallback, useImperativeHandle } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { uuidv4 } from 'src/utils/uuidv4';

import { Iconify } from 'src/components/iconify';

import { TacticalBoard } from './tactical-board';

// ----------------------------------------------------------------------
// A "sequence" is several tactical-board snapshots (frames) played back in
// order, so a coach can animate a play instead of only drawing one static
// diagram. tactical-board.jsx stays a single-diagram editor, untouched —
// this wrapper manages the frame list and, for playback, feeds it a tweened
// snapshot as a read-only `value` instead of reaching into its internals.

const LEGACY_FRAME_ID = 'legacy-frame';
const FRAME_HOLD_MS = 450;
const TRANSITION_MS = 850;
const SPEED_OPTIONS = [0.5, 1, 2];

function emptyFrame(id) {
  return { id, tokens: [], arrows: [], zones: [], drawings: [] };
}

// Existing sessions only ever had a single diagram (no `frames` field) — on
// first read that single diagram becomes a one-frame sequence under a fixed
// id, so nothing about them changes until a coach adds a second step.
function framesFromDiagram(diagram) {
  const base = diagram || {};
  if (Array.isArray(base.frames) && base.frames.length) {
    const activeFrameId = base.frames.some((frame) => frame.id === base.activeFrameId)
      ? base.activeFrameId
      : base.frames[0].id;
    return { pitchMode: base.pitchMode || 'half', frames: base.frames, activeFrameId };
  }
  const frame = {
    id: LEGACY_FRAME_ID,
    tokens: base.tokens || [],
    arrows: base.arrows || [],
    zones: base.zones || [],
    drawings: base.drawings || [],
  };
  return { pitchMode: base.pitchMode || 'half', frames: [frame], activeFrameId: frame.id };
}

function buildDiagramPatch(pitchMode, frames, activeFrameId) {
  const active = frames.find((frame) => frame.id === activeFrameId) || frames[0];
  return {
    pitchMode,
    frames,
    activeFrameId,
    tokens: active.tokens,
    arrows: active.arrows,
    zones: active.zones,
    drawings: active.drawings,
  };
}

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

// Player/equipment positions glide between frames; arrows, zones and
// freehand drawings are per-step annotations, so they just swap once the
// movement finishes rather than morphing mid-transition.
function tweenFrame(from, to, t) {
  if (t >= 1) return to;
  const toMap = Object.fromEntries(to.tokens.map((token) => [token.id, token]));
  return {
    tokens: from.tokens.map((token) => {
      const target = toMap[token.id];
      if (!target) return token;
      return { ...token, x: token.x + (target.x - token.x) * t, y: token.y + (target.y - token.y) * t };
    }),
    arrows: from.arrows,
    zones: from.zones,
    drawings: from.drawings,
  };
}

export const SequenceBoard = forwardRef(
  ({ value, onChange, readOnly = false, fileName = 'diagrama' }, ref) => {
    const { t } = useTranslation();
    const editorRef = useRef(null);
    const rafRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [playbackFrame, setPlaybackFrame] = useState(null);

    const { pitchMode, frames, activeFrameId } = useMemo(() => framesFromDiagram(value), [value]);
    const activeIndex = Math.max(
      0,
      frames.findIndex((frame) => frame.id === activeFrameId)
    );
    const activeFrame = frames[activeIndex] || emptyFrame(activeFrameId);

    useEffect(
      () => () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      },
      []
    );

    const stopPlayback = useCallback(() => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setIsPlaying(false);
      setPlaybackFrame(null);
    }, []);

    const playSequence = useCallback(() => {
      if (frames.length < 2 || isPlaying) return;
      setIsPlaying(true);
      const segmentDuration = (FRAME_HOLD_MS + TRANSITION_MS) / speed;
      const holdMs = FRAME_HOLD_MS / speed;
      const transitionMs = TRANSITION_MS / speed;
      const totalDuration = segmentDuration * (frames.length - 1) + holdMs;
      const start = performance.now();

      const tick = (now) => {
        const elapsed = now - start;
        if (elapsed >= totalDuration) {
          setPlaybackFrame(frames[frames.length - 1]);
          setIsPlaying(false);
          rafRef.current = null;
          return;
        }
        const segIndex = Math.min(Math.floor(elapsed / segmentDuration), frames.length - 2);
        const segElapsed = elapsed - segIndex * segmentDuration;
        const progress = segElapsed <= holdMs ? 0 : clamp01((segElapsed - holdMs) / transitionMs);
        setPlaybackFrame(tweenFrame(frames[segIndex], frames[segIndex + 1], progress));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, [frames, isPlaying, speed]);

    const handleEditorChange = useCallback(
      (edited) => {
        const nextFrames = frames.map((frame) =>
          frame.id === activeFrameId
            ? { ...frame, tokens: edited.tokens, arrows: edited.arrows, zones: edited.zones, drawings: edited.drawings }
            : frame
        );
        onChange?.(buildDiagramPatch(edited.pitchMode || pitchMode, nextFrames, activeFrameId));
      },
      [frames, activeFrameId, pitchMode, onChange]
    );

    const handleSelectFrame = useCallback(
      (id) => {
        if (id === activeFrameId) return;
        onChange?.(buildDiagramPatch(pitchMode, frames, id));
      },
      [frames, activeFrameId, pitchMode, onChange]
    );

    const handleAddFrame = useCallback(() => {
      const newFrame = {
        id: uuidv4(),
        tokens: activeFrame.tokens,
        arrows: activeFrame.arrows,
        zones: activeFrame.zones,
        drawings: activeFrame.drawings,
      };
      const nextFrames = [...frames.slice(0, activeIndex + 1), newFrame, ...frames.slice(activeIndex + 1)];
      onChange?.(buildDiagramPatch(pitchMode, nextFrames, newFrame.id));
    }, [frames, activeIndex, activeFrame, pitchMode, onChange]);

    const handleDuplicateFrame = useCallback(
      (id) => {
        const index = frames.findIndex((frame) => frame.id === id);
        if (index === -1) return;
        const clone = { ...frames[index], id: uuidv4() };
        const nextFrames = [...frames.slice(0, index + 1), clone, ...frames.slice(index + 1)];
        onChange?.(buildDiagramPatch(pitchMode, nextFrames, clone.id));
      },
      [frames, pitchMode, onChange]
    );

    const handleDeleteFrame = useCallback(
      (id) => {
        if (frames.length <= 1) return;
        const index = frames.findIndex((frame) => frame.id === id);
        const nextFrames = frames.filter((frame) => frame.id !== id);
        const nextActiveId =
          id === activeFrameId ? (nextFrames[Math.max(0, index - 1)] || nextFrames[0]).id : activeFrameId;
        onChange?.(buildDiagramPatch(pitchMode, nextFrames, nextActiveId));
      },
      [frames, activeFrameId, pitchMode, onChange]
    );

    useImperativeHandle(ref, () => ({ getPngDataUrl: () => editorRef.current?.getPngDataUrl() }), []);

    const playbackDiagram = playbackFrame ? { pitchMode, ...playbackFrame } : null;
    const showFilmstrip = frames.length > 1 || !readOnly;

    return (
      <Stack spacing={1.5}>
        {showFilmstrip && (
          <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
            <Iconify icon="mdi:movie-open-outline" width={16} sx={{ color: 'text.disabled', flexShrink: 0 }} />

            {frames.map((frame, index) => (
              <Chip
                key={frame.id}
                size="small"
                label={index + 1}
                color={frame.id === activeFrameId && !isPlaying ? 'primary' : 'default'}
                variant={frame.id === activeFrameId && !isPlaying ? 'filled' : 'outlined'}
                onClick={isPlaying ? undefined : () => handleSelectFrame(frame.id)}
                onDelete={
                  !readOnly && frames.length > 1 && !isPlaying ? () => handleDeleteFrame(frame.id) : undefined
                }
              />
            ))}

            {!readOnly && (
              <Tooltip title={t('label_add_frame')}>
                <span>
                  <IconButton
                    size="small"
                    aria-label={t('label_add_frame')}
                    onClick={handleAddFrame}
                    disabled={isPlaying}
                  >
                    <Iconify icon="mdi:plus-box-outline" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {!readOnly && frames.length > 1 && (
              <Tooltip title={t('label_duplicate_frame')}>
                <span>
                  <IconButton
                    size="small"
                    aria-label={t('label_duplicate_frame')}
                    onClick={() => handleDuplicateFrame(activeFrameId)}
                    disabled={isPlaying}
                  >
                    <Iconify icon="mdi:content-duplicate" />
                  </IconButton>
                </span>
              </Tooltip>
            )}

            {frames.length > 1 && (
              <>
                <Box
                  sx={{ height: 20, borderLeft: (theme) => `1px solid ${theme.palette.divider}`, mx: 0.5 }}
                />

                <Tooltip title={t(isPlaying ? 'label_stop_sequence' : 'label_play_sequence')}>
                  <IconButton
                    size="small"
                    color="primary"
                    aria-label={t(isPlaying ? 'label_stop_sequence' : 'label_play_sequence')}
                    onClick={isPlaying ? stopPlayback : playSequence}
                  >
                    <Iconify icon={isPlaying ? 'solar:stop-bold' : 'solar:play-bold'} />
                  </IconButton>
                </Tooltip>

                <ToggleButtonGroup exclusive size="small" value={speed} onChange={(_, next) => next && setSpeed(next)}>
                  {SPEED_OPTIONS.map((option) => (
                    <ToggleButton key={option} value={option} sx={{ px: 1, fontSize: 11, lineHeight: 1 }}>
                      {`${option}x`}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </>
            )}
          </Stack>
        )}

        <Box sx={{ display: isPlaying ? 'none' : 'block' }}>
          <TacticalBoard
            ref={editorRef}
            value={{ pitchMode, ...activeFrame }}
            readOnly={readOnly}
            fileName={fileName}
            onChange={handleEditorChange}
          />
        </Box>

        {isPlaying && playbackDiagram && <TacticalBoard value={playbackDiagram} readOnly fileName={fileName} />}
      </Stack>
    );
  }
);

SequenceBoard.displayName = 'SequenceBoard';
