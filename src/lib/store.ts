import type { BookingRecord, DisruptionAlert, TripConstraints, TripOption } from './types';

/**
 * In-memory session store for the hackathon demo.
 * Swap for Redis / Postgres in production.
 */
type SessionState = {
  sessionId: string;
  constraints?: TripConstraints;
  options: TripOption[];
  seenCodes: string[];
  booking?: BookingRecord;
  disruption?: DisruptionAlert;
  updatedAt: string;
};

const g = globalThis as unknown as {
  __wanderStore?: Map<string, SessionState>;
  __wanderBookings?: Map<string, BookingRecord>;
  __wanderOrders?: Map<string, { bookingId: string; status: string }>;
};

const sessions = g.__wanderStore ?? new Map<string, SessionState>();
const bookings = g.__wanderBookings ?? new Map<string, BookingRecord>();
const orders = g.__wanderOrders ?? new Map<string, { bookingId: string; status: string }>();

g.__wanderStore = sessions;
g.__wanderBookings = bookings;
g.__wanderOrders = orders;

export function getSession(sessionId: string): SessionState {
  let s = sessions.get(sessionId);
  if (!s) {
    s = {
      sessionId,
      options: [],
      seenCodes: [],
      updatedAt: new Date().toISOString(),
    };
    sessions.set(sessionId, s);
  }
  return s;
}

export function saveSession(state: SessionState) {
  state.updatedAt = new Date().toISOString();
  sessions.set(state.sessionId, state);
}

export function saveBooking(booking: BookingRecord) {
  bookings.set(booking.id, booking);
  if (booking.paypalOrderId) {
    orders.set(booking.paypalOrderId, {
      bookingId: booking.id,
      status: booking.status,
    });
  }
}

export function getBooking(id: string) {
  return bookings.get(id);
}

export function getBookingByOrderId(orderId: string) {
  const ref = orders.get(orderId);
  if (!ref) return undefined;
  return bookings.get(ref.bookingId);
}

export function listBookings() {
  return Array.from(bookings.values());
}

export function updateBookingStatus(
  id: string,
  status: BookingRecord['status'],
  extras?: Partial<BookingRecord>,
) {
  const b = bookings.get(id);
  if (!b) return undefined;
  const next = { ...b, ...extras, status };
  bookings.set(id, next);
  if (next.paypalOrderId) {
    orders.set(next.paypalOrderId, { bookingId: next.id, status: next.status });
  }
  return next;
}
