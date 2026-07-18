/** Casino-style roulette click via Web Audio — no asset files needed. */

import { getAudioContext, unlockAudio } from './audio-context';

export function unlockRouletteAudio() {
  unlockAudio();
}

/**
 * Short wood/metal tick that rises slightly with spin speed.
 * `intensity` 0–1 controls pitch and volume.
 */
export function playRouletteClick(intensity = 0.5) {
  const ctx = getAudioContext();
  if (!ctx) return;
  unlockAudio();

  const t = ctx.currentTime;
  const i = Math.max(0.15, Math.min(1, intensity));

  const noiseLen = 0.028;
  const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * noiseLen), ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let n = 0; n < data.length; n++) {
    data[n] = (Math.random() * 2 - 1) * Math.pow(1 - n / data.length, 2);
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.12 * i, t);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + noiseLen);
  const band = ctx.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 1800 + i * 900;
  band.Q.value = 1.2;
  noise.connect(band);
  band.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noise.start(t);
  noise.stop(t + noiseLen);

  const osc = ctx.createOscillator();
  const tickGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(920 + i * 480, t);
  osc.frequency.exponentialRampToValueAtTime(280, t + 0.045);
  tickGain.gain.setValueAtTime(0.18 * i, t);
  tickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  osc.connect(tickGain);
  tickGain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.055);
}
