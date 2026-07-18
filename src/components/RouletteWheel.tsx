'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { playRouletteClick, unlockRouletteAudio } from '@/lib/roulette-sound';

export type WheelSegment = {
  id: string;
  label: string;
  sublabel?: string;
};

type Props = {
  segments: WheelSegment[];
  /** Increment to trigger a spin (e.g. while searching). */
  spinKey?: number;
  disabled?: boolean;
  size?: number;
  onSpinRequest?: () => void;
  onLanded?: (segment: WheelSegment, index: number) => void;
  /** When set, next spin lands on this segment index (modulo length). */
  forcedIndex?: number | null;
};

export const DEFAULT_WHEEL_DESTINATIONS: WheelSegment[] = [
  { id: 'lisbon', label: 'Lisbon' },
  { id: 'bali', label: 'Bali' },
  { id: 'tokyo', label: 'Tokyo' },
  { id: 'marrakech', label: 'Marrakech' },
  { id: 'austin', label: 'Austin' },
  { id: 'reykjavik', label: 'Reykjavik' },
  { id: 'cdmx', label: 'CDMX' },
  { id: 'bangkok', label: 'Bangkok' },
  { id: 'asheville', label: 'Asheville' },
  { id: 'porto', label: 'Porto' },
  { id: 'maui', label: 'Maui' },
  { id: 'seoul', label: 'Seoul' },
];

/* Sailor roulette: spinach / navy / coral / brass */
const WEDGE_A = '#1e3a5f';
const WEDGE_B = '#2f8f4e';
const WEDGE_C = '#c23b2e';
const WEDGE_D = '#c4891e';

function wedgeColor(i: number) {
  const palette = [WEDGE_A, WEDGE_B, WEDGE_C, WEDGE_D];
  return palette[i % palette.length];
}

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function wedgePath(cx: number, cy: number, r: number, start: number, end: number) {
  const a = polar(cx, cy, r, start);
  const b = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y} Z`;
}

export function RouletteWheel({
  segments,
  spinKey = 0,
  disabled = false,
  size = 420,
  onSpinRequest,
  onLanded,
  forcedIndex = null,
}: Props) {
  const [rotation, setRotation] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null);
  const animRef = useRef<number | null>(null);
  const rotationRef = useRef(0);
  const lastClickSeg = useRef(-1);
  const lastSpinKey = useRef(0);
  const forcedRef = useRef(forcedIndex);
  forcedRef.current = forcedIndex;

  const count = Math.max(segments.length, 1);
  const slice = 360 / count;

  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.46;
  const innerR = size * 0.14;
  const labelR = size * 0.32;

  useEffect(() => {
    rotationRef.current = rotation;
  }, [rotation]);

  useEffect(() => {
    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const indexAtPointer = useCallback(
    (deg: number) => {
      // Pointer sits at top (0°). Wheel rotation moves segments under it.
      const normalized = ((-deg % 360) + 360) % 360;
      return Math.floor(normalized / slice) % count;
    },
    [count, slice],
  );

  const runSpin = useCallback(
    (targetIndex: number) => {
      if (!segments.length) return;
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      unlockRouletteAudio();
      setIsAnimating(true);
      setHighlightIndex(null);

      const start = rotationRef.current;
      // Land so the chosen segment's center sits under the top pointer.
      const centerOfTarget = targetIndex * slice + slice / 2;
      const currentMod = ((start % 360) + 360) % 360;
      const desiredMod =
        (360 - centerOfTarget + Math.random() * slice * 0.35 - slice * 0.175 + 360) % 360;
      let delta = desiredMod - currentMod;
      if (delta <= 0) delta += 360;
      const fullSpins = 4 + Math.floor(Math.random() * 3);
      const end = start + fullSpins * 360 + delta;

      const duration = 4200 + Math.random() * 800;
      const t0 = performance.now();
      lastClickSeg.current = indexAtPointer(start);

      const tick = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        const eased = easeOutCubic(p);
        const rot = start + (end - start) * eased;
        setRotation(rot);
        rotationRef.current = rot;

        const seg = indexAtPointer(rot);
        if (seg !== lastClickSeg.current) {
          lastClickSeg.current = seg;
          // Louder/faster early; soft ticks near the end
          playRouletteClick(0.35 + (1 - p) * 0.65);
        }

        if (p < 1) {
          animRef.current = requestAnimationFrame(tick);
        } else {
          animRef.current = null;
          setIsAnimating(false);
          setHighlightIndex(targetIndex);
          onLanded?.(segments[targetIndex], targetIndex);
        }
      };

      animRef.current = requestAnimationFrame(tick);
    },
    [indexAtPointer, onLanded, segments, slice],
  );

  // External spin trigger (e.g. while searching / after options load)
  useEffect(() => {
    if (!spinKey || spinKey === lastSpinKey.current || !segments.length) return;
    lastSpinKey.current = spinKey;
    const forced = forcedRef.current;
    const idx =
      forced != null ? ((forced % count) + count) % count : Math.floor(Math.random() * count);
    runSpin(idx);
  }, [spinKey, segments, count, runSpin]);

  const handleSpinClick = () => {
    if (disabled || isAnimating) return;
    unlockRouletteAudio();
    if (onSpinRequest) {
      onSpinRequest();
      return;
    }
    const forced = forcedRef.current;
    const idx =
      forced != null ? ((forced % count) + count) % count : Math.floor(Math.random() * count);
    runSpin(idx);
  };

  const wedges = useMemo(() => {
    return segments.map((seg, i) => {
      const start = i * slice;
      const end = start + slice;
      const mid = start + slice / 2;
      const labelPos = polar(cx, cy, labelR, mid);
      const highlighted = highlightIndex === i;
      return (
        <g key={seg.id}>
          <path
            d={wedgePath(cx, cy, outerR, start, end)}
            fill={wedgeColor(i)}
            stroke="rgba(243,239,230,0.18)"
            strokeWidth={1.25}
            className={highlighted ? 'wheel-wedge-lit' : undefined}
          />
          <text
            x={labelPos.x}
            y={labelPos.y}
            fill="var(--sand)"
            fontSize={size < 340 ? 9 : 11}
            fontFamily="var(--font-fraunces), Georgia, serif"
            textAnchor="middle"
            dominantBaseline="middle"
            transform={`rotate(${mid}, ${labelPos.x}, ${labelPos.y})`}
            style={{ pointerEvents: 'none', opacity: highlighted ? 1 : 0.92 }}
          >
            {seg.label.length > 12 ? `${seg.label.slice(0, 11)}…` : seg.label}
          </text>
        </g>
      );
    });
  }, [cx, cy, highlightIndex, labelR, outerR, segments, size, slice]);

  const busy = isAnimating || disabled;

  return (
    <div className="wheel-stage relative mx-auto select-none" style={{ width: size, height: size }}>
      {/* Soft sea glow under the wheel */}
      <div
        className="pointer-events-none absolute inset-[-10%] rounded-full opacity-90"
        style={{
          background:
            'radial-gradient(circle, rgba(47,143,78,0.28) 0%, rgba(232,160,32,0.14) 40%, transparent 68%)',
        }}
      />

      {/* Anchor pointer */}
      <div className="wheel-pointer absolute top-0 z-20">
        <svg width="32" height="40" viewBox="0 0 32 40" aria-hidden>
          <path
            d="M16 38 L4 10 Q16 16 28 10 Z"
            fill="var(--accent)"
            stroke="#062028"
            strokeWidth="1.4"
          />
          <circle cx="16" cy="9" r="5" fill="var(--sand)" stroke="var(--navy)" strokeWidth="1.5" />
          <path
            d="M16 14 V26 M10 20 H22 M16 26 L10 32 M16 26 L22 32"
            stroke="var(--navy)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <button
        type="button"
        onClick={handleSpinClick}
        disabled={busy}
        aria-label={isAnimating ? 'Wheel spinning' : 'Spin the WanderWheel'}
        className={`relative z-10 block w-full cursor-pointer disabled:cursor-wait ${
          isAnimating ? '' : 'wheel-breathe'
        }`}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="wheel-idle"
          style={{
            transform: `rotate(${rotation}deg)`,
            filter: 'drop-shadow(0 18px 40px rgba(0,0,0,0.45))',
          }}
        >
          {/* Rope rim */}
          <circle
            cx={cx}
            cy={cy}
            r={outerR + size * 0.038}
            fill="#3d2914"
            stroke="var(--accent)"
            strokeWidth={size * 0.02}
          />
          <circle
            cx={cx}
            cy={cy}
            r={outerR + size * 0.014}
            fill="none"
            stroke="rgba(245,240,230,0.35)"
            strokeWidth={2.5}
            strokeDasharray="5 6"
          />

          <g>{wedges}</g>

          {/* Hub — spinach can energy */}
          <circle cx={cx} cy={cy} r={innerR} fill="var(--navy)" stroke="var(--accent)" strokeWidth={3} />
          <circle cx={cx} cy={cy} r={innerR * 0.72} fill="var(--spinach)" />
          <text
            x={cx}
            y={cy - 4}
            textAnchor="middle"
            fill="var(--sand)"
            fontSize={size * 0.045}
            fontFamily="var(--font-fraunces), Georgia, serif"
            letterSpacing="0.08em"
          >
            SPIN
          </text>
          <text
            x={cx}
            y={cy + size * 0.038}
            textAnchor="middle"
            fill="rgba(245,240,230,0.7)"
            fontSize={size * 0.026}
            fontFamily="var(--font-outfit), system-ui, sans-serif"
            letterSpacing="0.16em"
          >
            AYE!
          </text>
        </svg>
      </button>
    </div>
  );
}
