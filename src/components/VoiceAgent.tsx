'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MicButton } from './MicButton';
import { TripRoulette } from './TripRoulette';
import {
  DEFAULT_WHEEL_DESTINATIONS,
  RouletteWheel,
  type WheelSegment,
} from './RouletteWheel';
import { SeaAdventureBackdrop } from './SeaAdventureBackdrop';
import { SailorMascot } from './SailorMascot';
import { PaymentPanel } from './PaymentPanel';
import { DisruptionBanner } from './DisruptionBanner';
import { InstallPrompt } from './InstallPrompt';
import { createRecognizer, isSpeechSupported, speak, stopSpeaking } from '@/lib/speech';
import { unlockRouletteAudio } from '@/lib/roulette-sound';
import { startSailorTheme, toggleSailorTheme } from '@/lib/sailor-theme';
import type { ConversationPhase, TripOption } from '@/lib/types';

type IntentResponse = {
  speech?: string;
  options?: TripOption[];
  phase?: ConversationPhase;
  approvalUrl?: string;
  orderId?: string;
  booking?: {
    id: string;
    tripOption: TripOption;
    sabrePnr: string;
    paypalOrderId?: string;
  };
  error?: string;
};

const DEMO_PROMPT =
  'I have $800, I want to leave next Thursday for 3 days, and I\'m feeling adventurous.';

function sessionId() {
  if (typeof window === 'undefined') return 'default';
  const key = 'ww-session';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `ww-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

function segmentsFromOptions(options: TripOption[]): WheelSegment[] {
  if (!options.length) return DEFAULT_WHEEL_DESTINATIONS;
  // Fill a classic 12-pocket wheel so the spin feels like roulette.
  const pockets = 12;
  return Array.from({ length: pockets }, (_, i) => {
    const opt = options[i % options.length];
    return {
      id: `${opt.id}-${i}`,
      label: opt.destination,
      sublabel: `$${opt.totalPrice}`,
    };
  });
}

export function VoiceAgent() {
  const [phase, setPhase] = useState<ConversationPhase>('idle');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentLine, setAgentLine] = useState(
    'Ahoy! Spin the sailor roulette — or speak a budget, dates, and a mood.',
  );
  const [options, setOptions] = useState<TripOption[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [payment, setPayment] = useState<{
    orderId: string;
    approvalUrl: string;
    destination: string;
    amount: number;
  } | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [confirmedPnr, setConfirmedPnr] = useState<string | null>(null);
  const [disruption, setDisruption] = useState<string | null>(null);
  const [speechOk, setSpeechOk] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [spinKey, setSpinKey] = useState(0);
  const [forcedIndex, setForcedIndex] = useState<number | null>(null);
  const [wheelSize, setWheelSize] = useState(400);
  const [themeOn, setThemeOn] = useState(false);
  const recognitionRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const musicStarted = useRef(false);
  const sid = useMemo(() => sessionId(), []);

  const segments = useMemo(() => segmentsFromOptions(options), [options]);

  const ensureTheme = useCallback(() => {
    if (musicStarted.current) return;
    musicStarted.current = true;
    startSailorTheme();
    setThemeOn(true);
  }, []);

  useEffect(() => {
    setSpeechOk(isSpeechSupported());
  }, []);

  useEffect(() => {
    const sync = () => {
      const w = window.innerWidth;
      if (w < 400) setWheelSize(300);
      else if (w < 768) setWheelSize(340);
      else setWheelSize(440);
    };
    sync();
    window.addEventListener('resize', sync);
    return () => window.removeEventListener('resize', sync);
  }, []);

  const talk = useCallback((line: string) => {
    setAgentLine(line);
    speak(line);
  }, []);

  const bumpSpin = useCallback((landOn?: number | null) => {
    setForcedIndex(landOn ?? null);
    setSpinKey((k) => k + 1);
  }, []);

  const sendTranscript = useCallback(
    async (raw: string, { withSpin = false }: { withSpin?: boolean } = {}) => {
      const cleaned = raw.trim();
      if (!cleaned) return;

      setTranscript(cleaned);
      setPhase('thinking');
      stopSpeaking();
      unlockRouletteAudio();
      ensureTheme();
      if (withSpin) bumpSpin(null);

      try {
        const res = await fetch('/api/voice/intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: cleaned, sessionId: sid }),
        });
        const data = (await res.json()) as IntentResponse;

        if (data.options?.length) {
          setOptions(data.options);
          setActiveIndex(0);
          setPayment(null);
          // Second spin lands on the first trip pocket once segments update
          bumpSpin(0);
        }

        if (data.approvalUrl && data.orderId && data.booking) {
          setPayment({
            orderId: data.orderId,
            approvalUrl: data.approvalUrl,
            destination: data.booking.tripOption.destination,
            amount: data.booking.tripOption.totalPrice,
          });
          setBookingId(data.booking.id);
        }

        if (data.phase === 'confirmed' && data.booking) {
          setConfirmedPnr(data.booking.sabrePnr);
          setPayment(null);
        }

        if (data.phase) setPhase(data.phase);
        else if (data.options?.length) setPhase('awaiting_choice');
        else setPhase('idle');

        talk(data.speech || data.error || 'Done.');
      } catch {
        setPhase('idle');
        talk('I hit turbulence talking to the servers. Try again.');
      }
    },
    [bumpSpin, ensureTheme, sid, talk],
  );

  const startListening = useCallback(() => {
    if (!speechOk) return;
    stopSpeaking();

    const recognition = createRecognizer({
      onResult: (text) => {
        setListening(false);
        void sendTranscript(text, { withSpin: true });
      },
      onError: () => {
        setListening(false);
        setPhase('idle');
      },
      onEnd: () => setListening(false),
    });

    if (!recognition) return;
    recognitionRef.current = recognition;
    setListening(true);
    setPhase('listening');
    recognition.start();
  }, [sendTranscript, speechOk]);

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setPhase(options.length ? 'awaiting_choice' : 'idle');
      return;
    }
    startListening();
  };

  const onWheelSpinRequest = () => {
    unlockRouletteAudio();
    ensureTheme();
    if (options.length) {
      // Re-spin among current trip pockets
      bumpSpin(Math.floor(Math.random() * options.length));
      return;
    }
    void sendTranscript(DEMO_PROMPT, { withSpin: true });
  };

  const onToggleTheme = () => {
    unlockRouletteAudio();
    musicStarted.current = true;
    setThemeOn(toggleSailorTheme());
  };

  const onWheelLanded = (segment: WheelSegment) => {
    if (!options.length) return;
    const baseId = segment.id.replace(/-\d+$/, '');
    const idx = options.findIndex((o) => o.id === baseId);
    if (idx >= 0) setActiveIndex(idx);
  };

  const bookRank = async (rank: number) => {
    await sendTranscript(`Book option ${rank}`);
  };

  const confirmPay = async () => {
    if (!payment) return;
    setPhase('thinking');
    const res = await fetch('/api/paypal/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId: payment.orderId }),
    });
    const data = (await res.json()) as IntentResponse & {
      booking?: { id?: string; sabrePnr: string; tripOption: TripOption };
      speech?: string;
    };
    if (data.booking) {
      setConfirmedPnr(data.booking.sabrePnr);
      if (data.booking.id) setBookingId(data.booking.id);
    }
    setPayment(null);
    setPhase('confirmed');
    talk(
      data.speech ||
        `Your trip is booked! Your PayPal receipt has been emailed to you.`,
    );
  };

  const simulateDisruption = async () => {
    if (!bookingId) {
      talk('Book and pay for a trip first, then I can monitor the flight.');
      return;
    }
    const res = await fetch('/api/disruption/monitor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });
    const data = (await res.json()) as {
      disrupted?: boolean;
      speech?: string;
      error?: string;
    };
    if (data.disrupted && data.speech) {
      setDisruption(data.speech);
      setPhase('disruption');
      talk(data.speech);
    } else {
      talk(data.speech || data.error || 'No disruption detected.');
    }
  };

  const landed = options[activeIndex];

  return (
    <div className="relative min-h-screen overflow-x-hidden text-[var(--sand)]">
      <SeaAdventureBackdrop />

      {disruption && (
        <DisruptionBanner
          message={disruption}
          onApprove={() => {
            void sendTranscript('Approve');
            setDisruption(null);
          }}
          onDismiss={() => setDisruption(null)}
        />
      )}

      <header className="relative z-10 flex items-center justify-between px-5 py-4 md:px-10">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--sand)]/65">
          Spinach-powered sailor roulette
        </p>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onToggleTheme}
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand)]/70 transition hover:text-[var(--accent)]"
            aria-pressed={themeOn}
          >
            {themeOn ? 'Mute theme' : 'Play sailor theme'}
          </button>
          <button
            type="button"
            onClick={() => void simulateDisruption()}
            className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand)]/55 transition hover:text-[var(--accent)]"
          >
            Disruption Shield
          </button>
        </div>
      </header>

      {/* Hero: brand + sailor wheel + sea adventure */}
      <main className="relative z-10 flex flex-col items-center px-4 pb-8 pt-2 md:px-10">
        <h1 className="font-display text-center text-5xl leading-none tracking-tight text-[var(--sand)] drop-shadow-md md:text-7xl">
          WanderWheel
        </h1>
        <p className="mt-3 max-w-md text-center text-sm text-[var(--sand)]/85 md:text-base">
          {landed
            ? `Land ho — ${landed.destination}! Say “book option ${landed.rank}” and we cast off.`
            : 'Sailor-strength adventure: spin the roulette, hear the clicks, and let the sea pick your trip.'}
        </p>

        <div className="relative mt-6 flex w-full max-w-3xl items-end justify-center md:mt-8">
          <SailorMascot className="pointer-events-none absolute -left-2 bottom-6 hidden h-36 w-28 sm:block md:-left-4 md:h-48 md:w-36 lg:left-0" />
          <RouletteWheel
            segments={segments}
            spinKey={spinKey}
            forcedIndex={forcedIndex}
            size={wheelSize}
            onSpinRequest={onWheelSpinRequest}
            onLanded={onWheelLanded}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-5">
          <button
            type="button"
            onClick={onWheelSpinRequest}
            disabled={phase === 'thinking'}
            className="bg-[var(--spinach)] px-6 py-3 font-display text-sm uppercase tracking-[0.18em] text-[var(--sand)] shadow-lg transition hover:brightness-110 disabled:opacity-50"
          >
            {options.length ? 'Spin again' : 'Spin & sail'}
          </button>
          <MicButton
            listening={listening}
            thinking={phase === 'thinking'}
            onClick={() => {
              ensureTheme();
              toggleMic();
            }}
          />
        </div>

        <div className="mt-5 max-w-lg text-center">
          <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
            {phase === 'listening'
              ? 'Listening'
              : phase === 'thinking'
                ? 'Charting a course'
                : phase === 'awaiting_payment'
                  ? 'Ready to pay'
                  : phase === 'confirmed'
                    ? 'All aboard'
                    : 'Your sailor agent'}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-[var(--sand)]/90 md:text-base">
            {agentLine}
          </p>
          {transcript && (
            <p className="mt-2 text-xs text-[var(--sand)]/50">You: “{transcript}”</p>
          )}
        </div>

        {!speechOk && (
          <p className="mt-3 text-center text-xs text-[var(--sand)]/55">
            Voice recognition needs Chrome/Edge. Use the text fallback below.
          </p>
        )}

        <form
          className="mt-5 flex w-full max-w-xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void sendTranscript(textInput || DEMO_PROMPT, { withSpin: true });
            setTextInput('');
          }}
        >
          <input
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={DEMO_PROMPT}
            className="min-w-0 flex-1 border border-[var(--sand)]/25 bg-[rgba(6,22,28,0.55)] px-3 py-2.5 text-sm text-[var(--sand)] outline-none placeholder:text-[var(--sand)]/35 focus:border-[var(--accent)]"
          />
          <button
            type="submit"
            className="bg-[var(--sand)] px-4 py-2.5 font-display text-xs uppercase tracking-[0.16em] text-[var(--ink)]"
          >
            Send
          </button>
        </form>

        <div className="mt-3 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="text-xs text-[var(--sand)]/60 underline-offset-4 hover:text-[var(--accent)] hover:underline"
            onClick={() => void sendTranscript(DEMO_PROMPT, { withSpin: true })}
          >
            Try demo prompt
          </button>
          {options.length > 0 && (
            <button
              type="button"
              className="text-xs text-[var(--sand)]/60 underline-offset-4 hover:text-[var(--accent)] hover:underline"
              onClick={() => void sendTranscript('Reroll', { withSpin: true })}
            >
              Reroll
            </button>
          )}
        </div>

        {confirmedPnr && (
          <p className="mt-5 border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--sand)]/85">
            Confirmed · Sabre PNR{' '}
            <span className="text-[var(--accent)]">{confirmedPnr}</span>
          </p>
        )}
      </main>

      <TripRoulette
        options={options}
        activeIndex={activeIndex}
        onHover={setActiveIndex}
        onSelect={(rank) => void bookRank(rank)}
      />

      {payment && (
        <PaymentPanel
          destination={payment.destination}
          amount={payment.amount}
          orderId={payment.orderId}
          approvalUrl={payment.approvalUrl}
          busy={phase === 'thinking'}
          onConfirm={() => void confirmPay()}
          onCancel={() => void sendTranscript('Cancel payment')}
        />
      )}

      <footer className="relative z-10 px-5 pb-8 text-center text-[10px] uppercase tracking-[0.2em] text-[var(--sand)]/35 md:px-10">
        Vocal Bridge · Sabre · PayPal · Unsplash
      </footer>

      <InstallPrompt />
    </div>
  );
}
