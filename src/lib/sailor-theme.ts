/**
 * Original jaunty sailor cartoon loop (Web Audio).
 * Homage energy only — not the copyrighted Popeye theme melody/recording.
 */

import { getAudioContext, unlockAudio } from './audio-context';

type Note = { freq: number; beats: number; gap?: number };

const BPM = 148;
const BEAT = 60 / BPM;

// Bright major bounce — original melody
const LEAD: Note[] = [
  { freq: 523.25, beats: 0.5 }, // C5
  { freq: 659.25, beats: 0.5 }, // E5
  { freq: 783.99, beats: 0.5 }, // G5
  { freq: 659.25, beats: 0.5 },
  { freq: 587.33, beats: 0.5 }, // D5
  { freq: 698.46, beats: 0.5 }, // F5
  { freq: 880.0, beats: 0.75 }, // A5
  { freq: 783.99, beats: 0.25 },
  { freq: 659.25, beats: 0.5 },
  { freq: 523.25, beats: 0.5 },
  { freq: 392.0, beats: 0.5 }, // G4
  { freq: 523.25, beats: 0.5 },
  { freq: 587.33, beats: 0.25 },
  { freq: 659.25, beats: 0.25 },
  { freq: 783.99, beats: 0.5 },
  { freq: 1046.5, beats: 0.75 }, // C6
  { freq: 0, beats: 0.25 },
  { freq: 880.0, beats: 0.5 },
  { freq: 783.99, beats: 0.5 },
  { freq: 659.25, beats: 0.5 },
  { freq: 523.25, beats: 1 },
  { freq: 0, beats: 0.5 },
];

const BASS: Note[] = [
  { freq: 130.81, beats: 1 }, // C3
  { freq: 164.81, beats: 1 }, // E3
  { freq: 174.61, beats: 1 }, // F3
  { freq: 196.0, beats: 1 }, // G3
  { freq: 130.81, beats: 1 },
  { freq: 146.83, beats: 1 }, // D3
  { freq: 174.61, beats: 1 },
  { freq: 196.0, beats: 1 },
  { freq: 130.81, beats: 1 },
  { freq: 164.81, beats: 1 },
  { freq: 174.61, beats: 1 },
  { freq: 196.0, beats: 1 },
  { freq: 146.83, beats: 1 },
  { freq: 196.0, beats: 1 },
];

let masterGain: GainNode | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let playing = false;
let muted = false;

function playTone(
  ctx: AudioContext,
  dest: AudioNode,
  freq: number,
  start: number,
  dur: number,
  type: OscillatorType,
  vol: number,
) {
  if (freq <= 0) return;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(vol, start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(g);
  g.connect(dest);
  osc.start(start);
  osc.stop(start + dur + 0.02);
}

function playToot(ctx: AudioContext, dest: AudioNode, start: number) {
  // Cartoon pipe toot — original flourish, not a sample of any recording
  const freqs = [698.46, 880.0];
  freqs.forEach((f, i) => {
    playTone(ctx, dest, f, start + i * 0.12, 0.14, 'square', 0.045);
  });
}

function scheduleLoop() {
  const ctx = getAudioContext();
  if (!ctx || !masterGain || !playing) return;

  const t0 = ctx.currentTime + 0.05;
  let leadT = t0;
  for (const n of LEAD) {
    const dur = n.beats * BEAT * 0.92;
    playTone(ctx, masterGain, n.freq, leadT, dur, 'square', 0.055);
    leadT += n.beats * BEAT;
  }

  let bassT = t0;
  for (const n of BASS) {
    const dur = n.beats * BEAT * 0.9;
    playTone(ctx, masterGain, n.freq, bassT, dur, 'triangle', 0.07);
    // light oom-pah
    playTone(ctx, masterGain, n.freq * 1.5, bassT + BEAT * 0.5, BEAT * 0.35, 'triangle', 0.03);
    bassT += n.beats * BEAT;
  }

  // Mid-loop cartoon toots
  playToot(ctx, masterGain, t0 + BEAT * 4);
  playToot(ctx, masterGain, t0 + BEAT * 12);

  const loopMs = LEAD.reduce((s, n) => s + n.beats, 0) * BEAT * 1000;
  timer = setTimeout(scheduleLoop, loopMs - 40);
}

export function isSailorThemePlaying() {
  return playing && !muted;
}

export function startSailorTheme() {
  unlockAudio();
  const ctx = getAudioContext();
  if (!ctx) return;

  if (!masterGain) {
    masterGain = ctx.createGain();
    masterGain.gain.value = muted ? 0 : 0.55;
    masterGain.connect(ctx.destination);
  }

  if (playing) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.55, ctx.currentTime, 0.05);
    return;
  }

  playing = true;
  masterGain.gain.setValueAtTime(muted ? 0 : 0.55, ctx.currentTime);
  scheduleLoop();
}

export function stopSailorTheme() {
  playing = false;
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const ctx = getAudioContext();
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
  }
}

export function setSailorThemeMuted(next: boolean) {
  muted = next;
  const ctx = getAudioContext();
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted || !playing ? 0 : 0.55, ctx.currentTime, 0.05);
  }
}

export function toggleSailorTheme(): boolean {
  if (!playing) {
    muted = false;
    startSailorTheme();
    return true;
  }
  muted = !muted;
  setSailorThemeMuted(muted);
  return !muted;
}
