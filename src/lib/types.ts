export type Mood = 'adventure' | 'beach' | 'foodie' | 'relax' | 'culture' | 'nightlife';

export type TripConstraints = {
  budget: number;
  days: number;
  departAfter?: string;
  mood: Mood;
  origin?: string;
};

export type FlightSegment = {
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departAt: string;
  arriveAt: string;
  cabin: string;
};

export type HotelStay = {
  name: string;
  rating: number;
  nights: number;
  pricePerNight: number;
  neighborhood: string;
};

export type TripOption = {
  id: string;
  rank: number;
  destination: string;
  destinationCode: string;
  country: string;
  title: string;
  vibe: string;
  summary: string;
  totalPrice: number;
  currency: string;
  flight: FlightSegment;
  hotel: HotelStay;
  imageUrl: string;
  imageCredit?: string;
  activities: string[];
};

export type BookingRecord = {
  id: string;
  tripOption: TripOption;
  sabrePnr: string;
  paypalOrderId?: string;
  paypalCaptureId?: string;
  status: 'reserved' | 'awaiting_payment' | 'paid' | 'cancelled' | 'disrupted';
  createdAt: string;
  phone?: string;
};

export type DisruptionAlert = {
  id: string;
  bookingId: string;
  type: 'delay' | 'cancellation';
  message: string;
  alternateFlight?: FlightSegment;
  createdAt: string;
  resolved: boolean;
};

export type ConversationPhase =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'presenting'
  | 'awaiting_choice'
  | 'booking'
  | 'awaiting_payment'
  | 'confirmed'
  | 'disruption';

export type VoiceIntent =
  | { type: 'search'; constraints: TripConstraints; raw: string }
  | { type: 'reroll'; raw: string }
  | { type: 'book'; option: number; raw: string }
  | { type: 'pay_confirm'; raw: string }
  | { type: 'pay_cancel'; raw: string }
  | { type: 'approve_rebook'; raw: string }
  | { type: 'details'; option: number; raw: string }
  | { type: 'help'; raw: string }
  | { type: 'unknown'; raw: string };
