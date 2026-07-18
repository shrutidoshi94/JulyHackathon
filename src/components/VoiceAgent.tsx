'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MicButton } from './MicButton';
import { TripRoulette } from './TripRoulette';
import { PaymentPanel } from './PaymentPanel';
import { DisruptionBanner } from './DisruptionBanner';
import { InstallPrompt } from './InstallPrompt';
import { createRecognizer, isSpeechSupported, speak, stopSpeaking } from '@/lib/speech';
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

const HERO_FALLBACK =
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80';

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

export function VoiceAgent() {
  const [phase, setPhase] = useState<ConversationPhase>('idle');
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [agentLine, setAgentLine] = useState(
    'Speak a budget, dates, and a mood. I will spin three trips.',
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
  const recognitionRef = useRef<ReturnType<typeof createRecognizer>>(null);
  const sid = useMemo(() => sessionId(), []);

  const heroUrl = options[activeIndex]?.imageUrl || HERO_FALLBACK;
  const heroTitle = options[activeIndex]?.destination;

  useEffect(() => {
    setSpeechOk(isSpeechSupported());
  }, []);

  const talk = useCallback((line: string) => {
    setAgentLine(line);
    speak(line);
  }, []);

  const sendTranscript = useCallback(
    async (raw: string) => {
      const cleaned = raw.trim();
      if (!cleaned) return;

      setTranscript(cleaned);
      setPhase('thinking');
      stopSpeaking();

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
    [sid, talk],
  );

  const startListening = useCallback(() => {
    if (!speechOk) return;
    stopSpeaking();

    const recognition = createRecognizer({
      onResult: (text) => {
        setListening(false);
        void sendTranscript(text);
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

  return (
    <div className="relative min-h-screen overflow-hidden text-[var(--sand)]">
      {/* Full-bleed hero plane */}
      <div
        key={heroUrl}
        className="hero-fade absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroUrl})` }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,22,28,0.55)_0%,rgba(6,22,28,0.35)_40%,rgba(6,22,28,0.88)_100%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_20%_20%,rgba(242,169,59,0.18),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(45,158,158,0.25),transparent_35%)]" />

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

      <header className="relative z-10 flex items-center justify-between px-5 py-5 md:px-10">
        <div className="flex items-center gap-3">
          <span className="wheel-spin inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--accent)]/50 text-[var(--accent)]">
            ✶
          </span>
          <div>
            <p className="font-display text-lg tracking-wide md:text-xl">WanderWheel</p>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--sand)]/55">
              Spontaneous voice travel
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void simulateDisruption()}
          className="text-[10px] uppercase tracking-[0.2em] text-[var(--sand)]/55 transition hover:text-[var(--accent)]"
        >
          Disruption Shield
        </button>
      </header>

      <main className="relative z-10 flex min-h-[72vh] flex-col justify-end px-5 pb-6 pt-10 md:px-10">
        <div className="max-w-2xl">
          <h1 className="font-display text-5xl leading-[0.95] tracking-tight text-[var(--sand)] md:text-7xl">
            WanderWheel
          </h1>
          <p className="mt-4 max-w-md text-base text-[var(--sand)]/80 md:text-lg">
            {heroTitle
              ? `Feeling pulled toward ${heroTitle}? Say the word and it is yours.`
              : 'Do not pick a destination. Speak a budget and a vibe — I will handle the rest.'}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-5">
            <MicButton
              listening={listening}
              thinking={phase === 'thinking'}
              onClick={toggleMic}
            />
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
                {phase === 'listening'
                  ? 'Listening'
                  : phase === 'thinking'
                    ? 'Planning'
                    : phase === 'awaiting_payment'
                      ? 'Ready to pay'
                      : phase === 'confirmed'
                        ? 'Booked'
                        : 'Your agent'}
              </p>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--sand)]/90 md:text-base">
                {agentLine}
              </p>
              {transcript && (
                <p className="mt-2 text-xs text-[var(--sand)]/50">You: “{transcript}”</p>
              )}
            </div>
          </div>

          {!speechOk && (
            <p className="mt-4 text-xs text-[var(--sand)]/55">
              Voice recognition needs Chrome/Edge. Use the text fallback below.
            </p>
          )}

          <form
            className="mt-5 flex max-w-xl gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              void sendTranscript(textInput || DEMO_PROMPT);
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

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="text-xs text-[var(--sand)]/60 underline-offset-4 hover:text-[var(--accent)] hover:underline"
              onClick={() => void sendTranscript(DEMO_PROMPT)}
            >
              Try demo prompt
            </button>
            {options.length > 0 && (
              <button
                type="button"
                className="text-xs text-[var(--sand)]/60 underline-offset-4 hover:text-[var(--accent)] hover:underline"
                onClick={() => void sendTranscript('Reroll')}
              >
                Reroll
              </button>
            )}
          </div>

          {confirmedPnr && (
            <p className="mt-5 border-l-2 border-[var(--accent)] pl-3 text-sm text-[var(--sand)]/85">
              Confirmed · Sabre PNR <span className="text-[var(--accent)]">{confirmedPnr}</span>
            </p>
          )}
        </div>
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

      <footer className="relative z-10 px-5 pb-8 text-[10px] uppercase tracking-[0.2em] text-[var(--sand)]/35 md:px-10">
        Vocal Bridge · Sabre · PayPal · Unsplash
      </footer>

      <InstallPrompt />
    </div>
  );
}
