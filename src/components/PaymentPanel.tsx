'use client';

type Props = {
  destination: string;
  amount: number;
  orderId: string;
  approvalUrl: string;
  onConfirm: () => void;
  onCancel: () => void;
  busy?: boolean;
};

export function PaymentPanel({
  destination,
  amount,
  orderId,
  approvalUrl,
  onConfirm,
  onCancel,
  busy,
}: Props) {
  return (
    <div className="relative z-20 mx-auto w-full max-w-xl px-4 pb-8">
      <div className="border border-[var(--sand)]/20 bg-[rgba(8,28,34,0.72)] p-6 backdrop-blur-md">
        <p className="font-display text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
          Voice payment
        </p>
        <h3 className="mt-2 font-display text-2xl text-[var(--sand)]">
          PayPal ready for {destination}
        </h3>
        <p className="mt-2 text-[var(--sand)]/75">
          Total <span className="text-[var(--accent)]">${amount.toFixed(2)}</span>.
          Say <em>confirm payment</em> — or use PayPal visually.
        </p>
        <p className="mt-3 font-mono text-xs text-[var(--sand)]/45">Order {orderId}</p>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="bg-[var(--accent)] px-5 py-3 font-display text-sm uppercase tracking-[0.18em] text-[var(--ink)] transition hover:brightness-110 disabled:opacity-60"
          >
            {busy ? 'Capturing…' : 'Confirm payment'}
          </button>
          <a
            href={approvalUrl}
            target="_blank"
            rel="noreferrer"
            className="border border-[var(--sand)]/35 px-5 py-3 font-display text-sm uppercase tracking-[0.18em] text-[var(--sand)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            Open PayPal
          </a>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-3 text-sm text-[var(--sand)]/60 underline-offset-4 hover:underline"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
