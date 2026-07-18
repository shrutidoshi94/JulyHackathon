'use client';

import { useEffect, useState } from 'react';

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (hidden || !deferred) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-xs border border-[var(--sand)]/20 bg-[rgba(8,28,34,0.92)] p-4 text-[var(--sand)] shadow-xl backdrop-blur">
      <p className="font-display text-sm">Install WanderWheel</p>
      <p className="mt-1 text-xs text-[var(--sand)]/70">
        Add to your home screen — no app store needed.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          className="bg-[var(--accent)] px-3 py-1.5 text-xs uppercase tracking-[0.15em] text-[var(--ink)]"
          onClick={async () => {
            await deferred.prompt();
            setHidden(true);
          }}
        >
          Install
        </button>
        <button
          type="button"
          className="px-3 py-1.5 text-xs text-[var(--sand)]/60"
          onClick={() => setHidden(true)}
        >
          Not now
        </button>
      </div>
    </div>
  );
}
