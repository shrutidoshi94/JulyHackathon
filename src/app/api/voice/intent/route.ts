import { NextRequest, NextResponse } from 'next/server';
import { parseVoiceIntent } from '@/lib/intent-parser';
import {
  bookOption,
  confirmPayment,
  getOptionDetails,
  runDisruptionShield,
  spinRoulette,
} from '@/lib/trip-engine';
import { getBooking, getSession, saveSession, updateBookingStatus } from '@/lib/store';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      transcript: string;
      sessionId?: string;
      phone?: string;
    };

    const sessionId = body.sessionId || 'default';
    const intent = parseVoiceIntent(body.transcript || '');

    switch (intent.type) {
      case 'search': {
        const result = await spinRoulette(sessionId, intent.constraints, false);
        return NextResponse.json({ intent, ...result, phase: 'presenting' });
      }
      case 'reroll': {
        const session = getSession(sessionId);
        if (!session.constraints) {
          return NextResponse.json({
            intent,
            speech:
              'Tell me your budget, how many days, and your mood first — then I can reroll.',
            phase: 'idle',
          });
        }
        const result = await spinRoulette(sessionId, session.constraints, true);
        return NextResponse.json({ intent, ...result, phase: 'presenting' });
      }
      case 'book': {
        const result = await bookOption(sessionId, intent.option, body.phone);
        return NextResponse.json({ intent, ...result, phase: 'awaiting_payment' });
      }
      case 'details': {
        const result = getOptionDetails(sessionId, intent.option);
        return NextResponse.json({ intent, ...result, phase: 'awaiting_choice' });
      }
      case 'pay_confirm': {
        const session = getSession(sessionId);
        const orderId = session.booking?.paypalOrderId;
        if (!orderId) {
          return NextResponse.json({
            intent,
            speech: 'I do not have an open PayPal order. Book an option first.',
            phase: 'awaiting_choice',
          });
        }
        const result = await confirmPayment(orderId);
        return NextResponse.json({ intent, ...result, phase: 'confirmed' });
      }
      case 'pay_cancel': {
        const session = getSession(sessionId);
        if (session.booking) {
          updateBookingStatus(session.booking.id, 'cancelled');
        }
        return NextResponse.json({
          intent,
          speech: 'Payment cancelled. Want me to reroll three new trips?',
          phase: 'awaiting_choice',
        });
      }
      case 'approve_rebook': {
        const session = getSession(sessionId);
        const bookingId = session.disruption?.bookingId || session.booking?.id;
        if (!bookingId) {
          return NextResponse.json({
            intent,
            speech: 'There is no disruption to approve right now.',
            phase: 'idle',
          });
        }
        const booking = getBooking(bookingId);
        if (session.disruption?.alternateFlight && booking) {
          updateBookingStatus(bookingId, 'paid', {
            tripOption: {
              ...booking.tripOption,
              flight: session.disruption.alternateFlight,
            },
          });
          session.disruption.resolved = true;
          saveSession(session);
        }
        return NextResponse.json({
          intent,
          speech:
            'Approved. I switched you to the alternate flight. Your updated itinerary is on the way.',
          phase: 'confirmed',
        });
      }
      case 'help': {
        return NextResponse.json({
          intent,
          speech:
            'Say your budget, dates, and mood — like I have 800 dollars, leave next Thursday for 3 days, feeling adventurous. I will offer three trips. Say reroll, book option two, or confirm payment.',
          phase: 'idle',
        });
      }
      default:
        return NextResponse.json({
          intent,
          speech:
            'I am WanderWheel. Tell me a budget, how long you can go, and a mood — adventure, beach, or foodie — and I will spin three spontaneous trips.',
          phase: 'idle',
        });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Something went wrong';
    return NextResponse.json({ error: message, speech: message }, { status: 400 });
  }
}

// Keep Disruption Shield reachable from the same voice orchestration surface
export async function PUT(req: NextRequest) {
  const body = (await req.json()) as { bookingId: string };
  try {
    const result = await runDisruptionShield(body.bookingId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Monitor failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
