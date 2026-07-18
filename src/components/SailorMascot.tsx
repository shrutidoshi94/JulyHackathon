'use client';

/** Original cartoon sailor mascot — spinach-powered adventure energy (not an official character). */

export function SailorMascot({ className = '' }: { className?: string }) {
  return (
    <div className={`sailor-mascot ${className}`} aria-hidden>
      <svg viewBox="0 0 160 200" className="h-full w-full drop-shadow-xl">
        {/* Cap */}
        <ellipse cx="80" cy="48" rx="38" ry="14" fill="#1e3a5f" />
        <rect x="42" y="36" width="76" height="18" rx="4" fill="#1e3a5f" />
        <rect x="70" y="28" width="20" height="12" fill="#f5f0e6" />
        <circle cx="80" cy="28" r="6" fill="#c23b2e" />

        {/* Head */}
        <ellipse cx="80" cy="72" rx="28" ry="26" fill="#f0c9a0" />
        {/* Squint wink + bold eye */}
        <path d="M62 70 Q68 66 74 70" stroke="#1a1a1a" strokeWidth="2.5" fill="none" />
        <circle cx="94" cy="70" r="5" fill="#1a1a1a" />
        <circle cx="95.5" cy="68.5" r="1.6" fill="#fff" />
        {/* Grin */}
        <path d="M68 84 Q80 94 94 82" stroke="#8b3a2f" strokeWidth="2.5" fill="none" />
        {/* Pipe */}
        <path d="M96 86 L118 92 L122 86" stroke="#5c3a1e" strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx="124" cy="84" rx="6" ry="4" fill="#5c3a1e" />
        {/* Smoke puffs */}
        <circle className="sailor-smoke" cx="132" cy="72" r="4" fill="rgba(255,255,255,0.35)" />
        <circle className="sailor-smoke sailor-smoke-2" cx="140" cy="62" r="5" fill="rgba(255,255,255,0.28)" />

        {/* Neckerchief */}
        <path d="M58 96 L80 110 L102 96 L80 102 Z" fill="#c23b2e" />

        {/* Torso / sweater */}
        <path d="M48 104 L112 104 L118 168 L42 168 Z" fill="#2f8f4e" />
        {/* Anchor tattoo on arm */}
        <ellipse cx="40" cy="130" rx="14" ry="22" fill="#f0c9a0" />
        <path d="M40 118 L40 140 M34 128 H46 M40 140 L34 146 M40 140 L46 146" stroke="#1e3a5f" strokeWidth="2" />
        <ellipse cx="120" cy="130" rx="14" ry="22" fill="#f0c9a0" />

        {/* Spinach can badge */}
        <rect x="68" y="128" width="24" height="28" rx="3" fill="#c23b2e" stroke="#f5f0e6" strokeWidth="1.5" />
        <text
          x="80"
          y="146"
          textAnchor="middle"
          fill="#f5f0e6"
          fontSize="8"
          fontFamily="var(--font-fraunces), Georgia, serif"
        >
          SPIN
        </text>

        {/* Belt */}
        <rect x="44" y="164" width="72" height="8" fill="#1e3a5f" />
        <rect x="74" y="164" width="12" height="8" fill="#e8a020" />
      </svg>
    </div>
  );
}
