import { NextRequest, NextResponse } from 'next/server';
import { runDisruptionShield } from '@/lib/trip-engine';
import { listBookings } from '@/lib/store';

export async function GET() {
  const paid = listBookings().filter((b) => b.status === 'paid' || b.status === 'disrupted');
  return NextResponse.json({ bookings: paid });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { bookingId?: string };
    let bookingId = body.bookingId;

    if (!bookingId) {
      const paid = listBookings().find((b) => b.status === 'paid');
      bookingId = paid?.id;
    }

    if (!bookingId) {
      return NextResponse.json(
        { error: 'No paid booking to monitor. Book a trip first.' },
        { status: 400 },
      );
    }

    const result = await runDisruptionShield(bookingId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monitor failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
