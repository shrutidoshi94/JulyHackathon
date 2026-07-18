'use client';

type Props = {
  message: string;
  onApprove: () => void;
  onDismiss: () => void;
};

export function DisruptionBanner({ message, onApprove, onDismiss }: Props) {
  return (
    <div className="relative z-30 border-b border-[var(--accent)]/40 bg-[rgba(242,169,59,0.12)] px-4 py-3">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.25em] text-[var(--accent)]">
            Disruption Shield
          </p>
          <p className="mt-1 text-sm text-[var(--sand)]">{message}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onApprove}
            className="bg-[var(--accent)] px-4 py-2 font-display text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={onDismiss}
            className="border border-[var(--sand)]/30 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[var(--sand)]"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
