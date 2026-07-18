'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SuccessInner() {
  const params = useSearchParams();
  const token = params.get('token') || params.get('orderId');
  const demo = params.get('demo');
  const [status, setStatus] = useState<'capturing' | 'done' | 'error'>('capturing');
  const [message, setMessage] = useState('Capturing your PayPal payment…');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Missing PayPal order token.');
      return;
    }

    void (async () => {
      try {
        const res = await fetch('/api/paypal/capture', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: token }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Capture failed');
        setStatus('done');
        setMessage(
          data.speech ||
            'Your trip is booked! Your PayPal receipt has been emailed to you.',
        );
      } catch (err) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Payment failed');
      }
    })();
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--ink)] px-6 text-[var(--sand)]">
      <p className="font-display text-xs uppercase tracking-[0.28em] text-[var(--accent)]">
        WanderWheel
      </p>
      <h1 className="mt-3 font-display text-4xl">
        {status === 'done' ? 'You are booked' : status === 'error' ? 'Payment issue' : 'Almost there'}
      </h1>
      <p className="mt-4 max-w-md text-center text-[var(--sand)]/75">{message}</p>
      {demo && (
        <p className="mt-2 text-xs text-[var(--sand)]/45">Demo PayPal capture (sandbox keys not set).</p>
      )}
      <Link
        href="/"
        className="mt-8 bg-[var(--accent)] px-5 py-3 font-display text-xs uppercase tracking-[0.18em] text-[var(--ink)]"
      >
        Back to agent
      </Link>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--ink)] text-[var(--sand)]">
          Confirming payment…
        </main>
      }
    >
      <SuccessInner />
    </Suspense>
  );
}
