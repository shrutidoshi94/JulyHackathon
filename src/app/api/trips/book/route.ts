import { NextRequest, NextResponse } from 'next/server';
import { bookOption } from '@/lib/trip-engine';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      option: number;
      phone?: string;
    };

    if (!body.option || body.option < 1 || body.option > 3) {
      return NextResponse.json(
        { error: 'option must be 1, 2, or 3' },
        { status: 400 },
      );
    }

    const result = await bookOption(
      body.sessionId || 'default',
      body.option,
      body.phone,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Booking failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
