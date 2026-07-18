import type { Mood, TripConstraints, VoiceIntent } from './types';

const MOOD_ALIASES: Record<string, Mood> = {
  adventure: 'adventure',
  adventurous: 'adventure',
  hike: 'adventure',
  hiking: 'adventure',
  kayak: 'adventure',
  beach: 'beach',
  beaches: 'beach',
  ocean: 'beach',
  sun: 'beach',
  foodie: 'foodie',
  food: 'foodie',
  eat: 'foodie',
  culinary: 'foodie',
  relax: 'relax',
  chill: 'relax',
  spa: 'relax',
  culture: 'culture',
  museum: 'culture',
  art: 'culture',
  nightlife: 'nightlife',
  party: 'nightlife',
  music: 'nightlife',
};

function extractBudget(text: string): number | null {
  const patterns = [
    /\$\s?([\d,]+)/,
    /([\d,]+)\s*(?:dollars|bucks|usd)/i,
    /budget\s*(?:of|is|around)?\s*\$?\s*([\d,]+)/i,
    /have\s*\$?\s*([\d,]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return parseInt(m[1].replace(/,/g, ''), 10);
  }
  return null;
}

function extractDays(text: string): number | null {
  const m =
    text.match(/(\d+)\s*-?\s*days?/i) ||
    text.match(/for\s+(\d+)\s+nights?/i) ||
    text.match(/weekend/i);
  if (m?.[0]?.toLowerCase() === 'weekend') return 3;
  if (m?.[1]) return parseInt(m[1], 10);
  return null;
}

function extractMood(text: string): Mood | null {
  const lower = text.toLowerCase();
  for (const [alias, mood] of Object.entries(MOOD_ALIASES)) {
    if (lower.includes(alias)) return mood;
  }
  return null;
}

function extractOptionNumber(text: string): number | null {
  const named: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    first: 1,
    second: 2,
    third: 3,
  };
  const digit = text.match(/option\s*(\d)/i) || text.match(/\b([123])\b/);
  if (digit) return parseInt(digit[1], 10);
  for (const [word, n] of Object.entries(named)) {
    if (new RegExp(`\\b${word}\\b`, 'i').test(text)) return n;
  }
  return null;
}

function nextThursdayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

function extractDepartAfter(text: string): string | undefined {
  const lower = text.toLowerCase();
  if (lower.includes('thursday') || lower.includes('next week')) {
    return nextThursdayISO();
  }
  if (lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString();
  }
  if (lower.includes('friday')) {
    const d = new Date();
    const day = d.getDay();
    d.setDate(d.getDate() + ((5 - day + 7) % 7 || 7));
    return d.toISOString();
  }
  return undefined;
}

export function parseVoiceIntent(raw: string): VoiceIntent {
  const text = raw.trim();
  const lower = text.toLowerCase();

  if (
    /reroll|re-roll|don't like|dont like|not these|show me (other|new|different)|try again|spin again/.test(
      lower,
    )
  ) {
    return { type: 'reroll', raw: text };
  }

  if (/approve|switch|rebook|take the later|yes,? switch/.test(lower)) {
    return { type: 'approve_rebook', raw: text };
  }

  if (
    /confirm (payment|pay|booking)|pay (now|with paypal)|yes,? (pay|book)|complete payment|approve payment/.test(
      lower,
    ) ||
    lower === 'pay' ||
    lower === 'confirm'
  ) {
    return { type: 'pay_confirm', raw: text };
  }

  if (/cancel payment|don't pay|dont pay|never ?mind|stop payment/.test(lower)) {
    return { type: 'pay_cancel', raw: text };
  }

  if (/book|take option|choose option|i'll take|ill take|go with|let's do|lets do/.test(lower)) {
    const option = extractOptionNumber(lower) ?? 1;
    return { type: 'book', option, raw: text };
  }

  if (/tell me more|details|more about|what's option|whats option/.test(lower)) {
    const option = extractOptionNumber(lower) ?? 1;
    return { type: 'details', option, raw: text };
  }

  if (/help|what can you|how do i|instructions/.test(lower)) {
    return { type: 'help', raw: text };
  }

  const budget = extractBudget(lower);
  const days = extractDays(lower);
  const mood = extractMood(lower);

  if (budget || mood || /trip|travel|getaway|vacation|fly|weekend/.test(lower)) {
    const constraints: TripConstraints = {
      budget: budget ?? 800,
      days: days ?? 3,
      mood: mood ?? 'adventure',
      departAfter: extractDepartAfter(lower),
      origin: process.env.DEFAULT_ORIGIN || 'SFO',
    };
    return { type: 'search', constraints, raw: text };
  }

  return { type: 'unknown', raw: text };
}

export function speakTripOptionsSummary(
  options: Array<{ rank: number; title: string; destination: string; totalPrice: number }>,
): string {
  const lines = options.map(
    (o) =>
      `Option ${o.rank}: ${o.title} in ${o.destination}, about $${o.totalPrice}.`,
  );
  return `I spun up three spontaneous trips. ${lines.join(' ')} Say book option one, two, or three — or say reroll for a fresh spin.`;
}
