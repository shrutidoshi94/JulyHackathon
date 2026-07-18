import { NextRequest, NextResponse } from 'next/server';
import { spinRoulette } from '@/lib/trip-engine';
import type { Mood, TripConstraints } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<TripConstraints> & {
      sessionId?: string;
    };

    const constraints: TripConstraints = {
      budget: Number(body.budget) || 800,
      days: Number(body.days) || 3,
      mood: (body.mood as Mood) || 'adventure',
      departAfter: body.departAfter,
      origin: body.origin || 'SFO',
    };

    const result = await spinRoulette(body.sessionId || 'default', constraints, false);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Search failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
