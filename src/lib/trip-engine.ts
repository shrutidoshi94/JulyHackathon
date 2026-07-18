import { v4 as uuidv4 } from 'uuid';
import { createPayPalOrder, capturePayPalOrder } from './paypal-client';
import {
  checkFlightDisruption,
  createSabreReservation,
  searchBargainPackages,
} from './sabre-client';
import { enrichOptionsWithImages } from './unsplash-client';
import {
  getBooking,
  getBookingByOrderId,
  getSession,
  listBookings,
  saveBooking,
  saveSession,
  updateBookingStatus,
} from './store';
import { speakTripOptionsSummary } from './intent-parser';
import type { BookingRecord, TripConstraints, TripOption } from './types';
import {
  buildDisruptionScript,
  placeOutboundCall,
} from './vocal-bridge';

export async function spinRoulette(
  sessionId: string,
  constraints: TripConstraints,
  reroll = false,
) {
  const session = getSession(sessionId);
  const exclude = reroll ? session.seenCodes : [];
  const nextConstraints = constraints || session.constraints;

  if (!nextConstraints) {
    throw new Error('Missing trip constraints. Tell me your budget, dates, and mood.');
  }

  let options = await searchBargainPackages(nextConstraints, exclude);
  options = await enrichOptionsWithImages(options);

  session.constraints = nextConstraints;
  session.options = options;
  session.seenCodes = [
    ...new Set([...session.seenCodes, ...options.map((o) => o.destinationCode)]),
  ];
  saveSession(session);

  return {
    options,
    speech: speakTripOptionsSummary(options),
    constraints: nextConstraints,
  };
}

export async function bookOption(
  sessionId: string,
  optionRank: number,
  phone?: string,
) {
  const session = getSession(sessionId);
  const option = session.options.find((o) => o.rank === optionRank);
  if (!option) {
    throw new Error(`Option ${optionRank} is not available. Ask me to spin again.`);
  }

  const reservation = await createSabreReservation(option);
  const paypal = await createPayPalOrder(
    option.totalPrice,
    option.currency,
    `WanderWheel: ${option.title} — ${option.destination}`,
  );

  const booking: BookingRecord = {
    id: uuidv4(),
    tripOption: option,
    sabrePnr: reservation.pnr,
    paypalOrderId: paypal.orderId,
    status: 'awaiting_payment',
    createdAt: new Date().toISOString(),
    phone,
  };

  saveBooking(booking);
  session.booking = booking;
  saveSession(session);

  return {
    booking,
    approvalUrl: paypal.approvalUrl,
    orderId: paypal.orderId,
    demo: paypal.demo,
    speech: `I've reserved ${option.title} in ${option.destination} for $${option.totalPrice}. Your Sabre confirmation is ${reservation.pnr}. Say confirm payment to complete with PayPal — no typing needed.`,
  };
}

export async function confirmPayment(orderId: string) {
  const capture = await capturePayPalOrder(orderId);

  let existing = getBookingByOrderId(orderId);
  if (!existing) {
    existing = listBookings().find((b) => b.paypalOrderId === orderId);
  }

  if (!existing) {
    return {
      capture,
      booking: null as BookingRecord | null,
      speech: 'Payment complete. Your PayPal receipt has been emailed to you.',
    };
  }

  const resolved = updateBookingStatus(existing.id, 'paid', {
    paypalCaptureId: capture.transactionId,
  })!;

  return {
    capture,
    booking: resolved,
    speech: `Your trip to ${resolved.tripOption.destination} is booked! Your PayPal receipt has been emailed to you. Confirmation ${resolved.sabrePnr}.`,
  };
}

export function getOptionDetails(sessionId: string, optionRank: number): {
  option: TripOption;
  speech: string;
} {
  const session = getSession(sessionId);
  const option = session.options.find((o) => o.rank === optionRank);
  if (!option) throw new Error(`I don't have option ${optionRank} right now.`);

  const depart = new Date(option.flight.departAt).toLocaleString([], {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const speech = `Option ${option.rank}: ${option.title} in ${option.destination}, ${option.country}. You fly ${option.flight.airline} ${option.flight.flightNumber} from ${option.flight.origin} on ${depart}. You'll stay ${option.hotel.nights} nights at ${option.hotel.name} in ${option.hotel.neighborhood}. Highlights include ${option.activities.join(', ')}. Total package price is $${option.totalPrice}.`;

  return { option, speech };
}

export async function runDisruptionShield(bookingId: string) {
  const booking = getBooking(bookingId);
  if (!booking) throw new Error('Booking not found');

  const check = await checkFlightDisruption(booking.sabrePnr);
  if (!check.disrupted) {
    return { disrupted: false as const, speech: 'Your flight looks on time. Safe travels!' };
  }

  const script = buildDisruptionScript({
    destination: booking.tripOption.destination,
    type: check.type!,
    alternateDepart: check.alternate?.departAt,
  });

  const call = await placeOutboundCall({
    phone: booking.phone || process.env.DEMO_USER_PHONE || '+15555550100',
    script,
    metadata: {
      bookingId: booking.id,
      pnr: booking.sabrePnr,
    },
  });

  updateBookingStatus(booking.id, 'disrupted');

  const session = getSession('default');
  session.disruption = {
    id: uuidv4(),
    bookingId: booking.id,
    type: check.type!,
    message: check.message || script,
    alternateFlight: check.alternate,
    createdAt: new Date().toISOString(),
    resolved: false,
  };
  saveSession(session);

  return {
    disrupted: true as const,
    call,
    alternate: check.alternate,
    speech: script,
  };
}
