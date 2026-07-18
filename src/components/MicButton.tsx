'use client';

type Props = {
  listening: boolean;
  thinking: boolean;
  onClick: () => void;
  disabled?: boolean;
};

export function MicButton({ listening, thinking, onClick, disabled }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || thinking}
      aria-pressed={listening}
      aria-label={listening ? 'Stop listening' : 'Start voice input'}
      className="group relative flex h-20 w-20 items-center justify-center rounded-full transition-transform duration-300 hover:scale-105 disabled:opacity-60"
    >
      <span
        className={`absolute inset-0 rounded-full bg-[var(--accent)]/30 ${
          listening ? 'animate-pulse-ring' : ''
        }`}
      />
      <span
        className={`absolute inset-2 rounded-full ${
          listening
            ? 'bg-[var(--accent)] shadow-[0_0_40px_rgba(242,169,59,0.45)]'
            : 'bg-[var(--ink)]'
        } transition-colors duration-300`}
      />
      <svg
        viewBox="0 0 24 24"
        className="relative z-10 h-8 w-8 text-[var(--sand)]"
        fill="currentColor"
        aria-hidden
      >
        <path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2Z" />
      </svg>
      {thinking && (
        <span className="absolute -bottom-8 text-xs uppercase tracking-[0.2em] text-[var(--sand)]/80">
          Thinking
        </span>
      )}
    </button>
  );
}
