'use client';

import type { TripOption } from '@/lib/types';

type Props = {
  options: TripOption[];
  activeIndex: number;
  onSelect: (rank: number) => void;
  onHover: (index: number) => void;
};

export function TripRoulette({ options, activeIndex, onSelect, onHover }: Props) {
  if (!options.length) return null;

  return (
    <section
      className="relative z-10 mx-auto w-full max-w-5xl px-4 pb-10 pt-4"
      aria-label="Trip options"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="font-display text-sm uppercase tracking-[0.28em] text-[var(--accent)]">
            Roulette
          </p>
          <h2 className="font-display text-2xl text-[var(--sand)] md:text-3xl">
            Three spontaneous spins
          </h2>
        </div>
        <p className="hidden max-w-xs text-right text-sm text-[var(--sand)]/70 md:block">
          Say “book option two” or tap a destination. Say “reroll” for a fresh set.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {options.map((opt, i) => {
          const active = i === activeIndex;
          return (
            <button
              key={opt.id}
              type="button"
              onMouseEnter={() => onHover(i)}
              onFocus={() => onHover(i)}
              onClick={() => onSelect(opt.rank)}
              className={`group relative overflow-hidden text-left transition-all duration-500 ${
                active
                  ? 'md:-translate-y-1'
                  : 'opacity-85 hover:opacity-100'
              }`}
            >
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${opt.imageUrl})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(8,28,34,0.95)] via-[rgba(8,28,34,0.45)] to-transparent" />
              <div className="relative flex min-h-[220px] flex-col justify-end p-5">
                <span className="mb-2 inline-flex w-fit font-display text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
                  Option {opt.rank}
                </span>
                <h3 className="font-display text-xl leading-tight text-[var(--sand)]">
                  {opt.title}
                </h3>
                <p className="mt-1 text-sm text-[var(--sand)]/75">
                  {opt.destination} · {opt.vibe}
                </p>
                <p className="mt-3 font-display text-2xl text-[var(--accent)]">
                  ${opt.totalPrice}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
