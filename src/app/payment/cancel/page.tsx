import Link from 'next/link';

export default function PaymentCancelPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--ink)] px-6 text-[var(--sand)]">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
        WanderWheel
      </p>
      <h1 className="mt-3 font-display text-4xl">Payment cancelled</h1>
      <p className="mt-4 max-w-md text-center text-[var(--sand)]/75">
        No charge was made. Return to the agent and say “confirm payment” when you are ready,
        or ask me to reroll.
      </p>
      <Link
        href="/"
        className="mt-8 bg-[var(--accent)] px-5 py-3 font-display text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
      >
        Back to agent
      </Link>
    </main>
  );
}
