import { NextRequest, NextResponse } from 'next/server';
import { spinRoulette } from '@/lib/trip-engine';
import { getSession } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: string };
    const sessionId = body.sessionId || 'default';
    const session = getSession(sessionId);

    if (!session.constraints) {
      return NextResponse.json(
        { error: 'No prior search. Provide constraints first.' },
        { status: 400 },
      );
    }

    const result = await spinRoulette(sessionId, session.constraints, true);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reroll failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
