'use client';

/** Full-bleed sea stage: sky, waves, and sailing ships for adventure feel. */

function Ship({
  className,
  hull,
  sail,
  flag,
}: {
  className: string;
  hull: string;
  sail: string;
  flag: string;
}) {
  return (
    <div className={`sea-ship absolute ${className}`} aria-hidden>
      <svg viewBox="0 0 120 70" className="h-full w-full drop-shadow-md">
        {/* Mast */}
        <rect x="56" y="8" width="3" height="42" fill="#3d2914" />
        {/* Mainsail */}
        <path d="M59 12 L59 46 L92 40 Z" fill={sail} opacity="0.95" />
        {/* Jib */}
        <path d="M56 18 L56 42 L28 38 Z" fill="#f7f1e4" opacity="0.9" />
        {/* Flag */}
        <path d="M59 8 L74 12 L59 16 Z" fill={flag} />
        {/* Hull */}
        <path
          d="M18 48 Q60 62 104 48 L96 56 Q60 66 24 56 Z"
          fill={hull}
          stroke="#2a1a0c"
          strokeWidth="1.2"
        />
        {/* Anchor mark on hull */}
        <circle cx="48" cy="52" r="2.2" fill="#f2e6c8" />
      </svg>
    </div>
  );
}

export function SeaAdventureBackdrop() {
  return (
    <div className="sea-stage pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Sky */}
      <div className="sea-sky absolute inset-0" />

      {/* Sun */}
      <div className="sea-sun absolute right-[12%] top-[8%] h-20 w-20 rounded-full md:h-28 md:w-28" />

      {/* Soft clouds */}
      <div className="sea-cloud sea-cloud-a absolute left-[-10%] top-[14%] h-10 w-40 rounded-full bg-white/35 blur-[1px]" />
      <div className="sea-cloud sea-cloud-b absolute left-[40%] top-[10%] h-8 w-32 rounded-full bg-white/25 blur-[1px]" />

      {/* Distant islands */}
      <div className="absolute bottom-[38%] left-[8%] h-16 w-40 rounded-[100%] bg-[#1a4a3a]/55 blur-[0.5px] md:bottom-[36%]" />
      <div className="absolute bottom-[40%] right-[14%] h-12 w-28 rounded-[100%] bg-[#245448]/45 md:bottom-[38%]" />

      {/* Ships — different lanes / speeds */}
      <Ship
        className="sea-ship-a bottom-[34%] h-14 w-24 md:h-20 md:w-36"
        hull="#8b2e2e"
        sail="#f4f0e4"
        flag="#2f8f4e"
      />
      <Ship
        className="sea-ship-b bottom-[30%] h-10 w-16 opacity-90 md:h-14 md:w-24"
        hull="#1f3d5c"
        sail="#ffe8a3"
        flag="#c23b2e"
      />
      <Ship
        className="sea-ship-c bottom-[36%] h-12 w-20 md:h-16 md:w-28"
        hull="#2f6b3a"
        sail="#fff8ea"
        flag="#e8a020"
      />

      {/* Wave layers */}
      <div className="sea-wave sea-wave-1 absolute inset-x-0 bottom-0 h-[42%]" />
      <div className="sea-wave sea-wave-2 absolute inset-x-0 bottom-0 h-[36%]" />
      <div className="sea-wave sea-wave-3 absolute inset-x-0 bottom-0 h-[28%]" />

      {/* Foam sparkle strip */}
      <div className="sea-foam absolute inset-x-0 bottom-[26%] h-8 opacity-40" />

      {/* Soft vignette so wheel stays readable */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_42%,rgba(6,30,40,0.15)_0%,rgba(6,22,28,0.55)_70%,rgba(4,14,18,0.78)_100%)]" />
    </div>
  );
}
