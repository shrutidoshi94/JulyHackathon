'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  useAIAgent,
  useTranscript,
  useVocalBridge,
} from '@vocalbridgeai/react';
import { ConnectionState } from '@vocalbridgeai/sdk';

type Props = {
  sessionId: string;
  /**
   * Process a user utterance through WanderWheel intent.
   * Must return the spoken reply (used by Vocal Bridge AI Agent mode).
   */
  onUserUtterance: (text: string) => Promise<string>;
  onConnectionChange?: (connected: boolean) => void;
};

export function VocalBridgeControls({
  sessionId,
  onUserUtterance,
  onConnectionChange,
}: Props) {
  const {
    state,
    connect,
    disconnect,
    error,
    isMicrophoneEnabled,
    toggleMicrophone,
    agentMode,
  } = useVocalBridge();
  const { transcript } = useTranscript();
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  const onUserRef = useRef(onUserUtterance);
  onUserRef.current = onUserUtterance;

  const recentRef = useRef<{ text: string; answer: string; at: number } | null>(null);

  const handleUtterance = useCallback(async (text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return 'I did not catch that.';

    const recent = recentRef.current;
    if (recent && recent.text === cleaned && Date.now() - recent.at < 10_000) {
      return recent.answer;
    }

    const answer = await onUserRef.current(cleaned);
    recentRef.current = { text: cleaned, answer, at: Date.now() };
    return answer;
  }, []);

  useEffect(() => {
    void fetch('/api/voice-token')
      .then((r) => r.json())
      .then((d: { configured?: boolean }) => setConfigured(Boolean(d.configured)))
      .catch(() => setConfigured(false));
  }, []);

  const live =
    state === ConnectionState.Connected ||
    state === ConnectionState.WaitingForAgent ||
    state === ConnectionState.Connecting ||
    state === ConnectionState.Reconnecting;

  useEffect(() => {
    onConnectionChange?.(state === ConnectionState.Connected);
  }, [state, onConnectionChange]);

  // Dashboard "AI Agent" mode → Vocal Bridge asks our app for domain answers.
  useAIAgent({
    onQuery: async (query) => handleUtterance(query),
  });

  // If AI Agent mode is not active, still drive trip search from user transcripts.
  const aiAgentActive = Boolean(agentMode && /agent|ai/i.test(agentMode));
  useEffect(() => {
    if (aiAgentActive) return;
    if (state !== ConnectionState.Connected) return;

    const lastUser = [...transcript].reverse().find((t) => t.role === 'user');
    if (!lastUser?.text?.trim()) return;
    void handleUtterance(lastUser.text);
  }, [transcript, aiAgentActive, state, handleUtterance]);

  if (configured === false) {
    return (
      <div className="rounded border border-[var(--sand)]/20 bg-[rgba(6,22,28,0.45)] px-3 py-2 text-left text-xs text-[var(--sand)]/70">
        Vocal Bridge not configured — using browser speech. Add{' '}
        <code className="text-[var(--accent)]">VOCAL_BRIDGE_API_KEY</code> (and{' '}
        <code className="text-[var(--accent)]">VOCAL_BRIDGE_AGENT_ID</code>) in{' '}
        <code>.env.local</code>.
      </div>
    );
  }

  if (configured === null) {
    return (
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--sand)]/50">
        Checking Vocal Bridge…
      </p>
    );
  }

  const statusLabel =
    state === ConnectionState.Connected
      ? 'Live with Vocal Bridge'
      : state === ConnectionState.WaitingForAgent
        ? 'Waiting for agent…'
        : state === ConnectionState.Connecting
          ? 'Connecting…'
          : state === ConnectionState.Reconnecting
            ? 'Reconnecting…'
            : 'Vocal Bridge ready';

  const toggle = async () => {
    setBusy(true);
    try {
      if (live) await disconnect();
      else await connect();
    } finally {
      setBusy(false);
    }
  };

  const latest = transcript.slice(-4);

  return (
    <div className="w-full max-w-xl rounded border border-[var(--spinach)]/40 bg-[rgba(6,32,40,0.55)] px-4 py-3 text-left backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--spinach)]">
            Vocal Bridge
          </p>
          <p className="mt-0.5 text-sm text-[var(--sand)]/90">{statusLabel}</p>
          <p className="mt-0.5 text-[10px] text-[var(--sand)]/45">
            session {sessionId}
            {agentMode ? ` · mode ${agentMode}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void toggle()}
            className="bg-[var(--spinach)] px-3 py-2 font-display text-xs uppercase tracking-[0.14em] text-[var(--sand)] disabled:opacity-50"
          >
            {live ? 'End voice' : 'Start Vocal Bridge'}
          </button>
          {state === ConnectionState.Connected && (
            <button
              type="button"
              onClick={() => void toggleMicrophone()}
              className="border border-[var(--sand)]/30 px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--sand)]/85"
            >
              {isMicrophoneEnabled ? 'Mute mic' : 'Unmute mic'}
            </button>
          )}
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-[var(--coral)]">
          {error.message || 'Vocal Bridge connection error'}
        </p>
      )}

      {latest.length > 0 && (
        <ul className="mt-3 max-h-28 space-y-1 overflow-y-auto text-xs text-[var(--sand)]/75">
          {latest.map((line, i) => (
            <li key={`${line.timestamp}-${i}`}>
              <span className="text-[var(--accent)]">
                {line.role === 'agent' ? 'Agent' : 'You'}:
              </span>{' '}
              {line.text}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
