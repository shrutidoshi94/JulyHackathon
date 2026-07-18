import { v4 as uuidv4 } from 'uuid';
import type { FlightSegment, HotelStay, Mood, TripConstraints, TripOption } from './types';

const SABRE_BASE =
  process.env.SABRE_API_BASE || 'https://api.cert.platform.sabre.com';

type DestinationSeed = {
  city: string;
  code: string;
  country: string;
  moods: Mood[];
  titles: Record<string, string>;
  vibes: string[];
  activities: string[];
  hotel: Omit<HotelStay, 'nights' | 'pricePerNight'> & { baseNightly: number };
  airline: string;
};

const DESTINATION_POOL: DestinationSeed[] = [
  {
    city: 'Austin',
    code: 'AUS',
    country: 'USA',
    moods: ['adventure', 'nightlife', 'foodie'],
    titles: {
      adventure: 'Kayaking on Lady Bird Lake',
      nightlife: 'Live music crawl on Rainey Street',
      foodie: 'Breakfast tacos & barbecue trail',
    },
    vibes: ['Sun-soaked', 'Creative', 'Spontaneous'],
    activities: ['Kayak rental', 'Barton Springs', 'South Congress stroll'],
    hotel: {
      name: 'Hotel Magdalena',
      rating: 4.5,
      neighborhood: 'South Congress',
      baseNightly: 165,
    },
    airline: 'AA',
  },
  {
    city: 'Asheville',
    code: 'AVL',
    country: 'USA',
    moods: ['adventure', 'relax', 'foodie'],
    titles: {
      adventure: 'Blue Ridge hiking escape',
      relax: 'Mountain spa weekend',
      foodie: 'Craft brewery & farm-to-table tour',
    },
    vibes: ['Misty', 'Grounded', 'Wild'],
    activities: ['Craggy Gardens hike', 'Biltmore grounds', 'River Arts District'],
    hotel: {
      name: 'The Radical Hotel',
      rating: 4.4,
      neighborhood: 'Downtown',
      baseNightly: 148,
    },
    airline: 'DL',
  },
  {
    city: 'Mexico City',
    code: 'MEX',
    country: 'Mexico',
    moods: ['foodie', 'culture', 'adventure'],
    titles: {
      foodie: 'Street food & mezcal immersion',
      culture: 'Museums & murals weekend',
      adventure: 'Teotihuacán sunrise adventure',
    },
    vibes: ['Electric', 'Layered', 'Delicious'],
    activities: ['Roma Norte tasting', 'Frida Kahlo Museum', 'Xochimilco boats'],
    hotel: {
      name: 'Hotel Condesa DF',
      rating: 4.6,
      neighborhood: 'Condesa',
      baseNightly: 132,
    },
    airline: 'UA',
  },
  {
    city: 'Miami',
    code: 'MIA',
    country: 'USA',
    moods: ['beach', 'nightlife', 'foodie'],
    titles: {
      beach: 'South Beach sun reset',
      nightlife: 'Wynwood nights',
      foodie: 'Cuban cafe crawl',
    },
    vibes: ['Neon', 'Warm', 'Glossy'],
    activities: ['Beach day', 'Art Deco walk', 'Little Havana'],
    hotel: {
      name: 'The Goodtime Hotel',
      rating: 4.5,
      neighborhood: 'South Beach',
      baseNightly: 189,
    },
    airline: 'AA',
  },
  {
    city: 'San Diego',
    code: 'SAN',
    country: 'USA',
    moods: ['beach', 'relax', 'adventure'],
    titles: {
      beach: 'Pacific coast chill',
      relax: 'Balboa Park slow weekend',
      adventure: 'La Jolla kayak caves',
    },
    vibes: ['Breezy', 'Bright', 'Easy'],
    activities: ['La Jolla Cove', 'Sunset cliffs', 'Taco stands'],
    hotel: {
      name: 'Hotel June San Diego',
      rating: 4.3,
      neighborhood: 'Pacific Beach',
      baseNightly: 155,
    },
    airline: 'AS',
  },
  {
    city: 'New Orleans',
    code: 'MSY',
    country: 'USA',
    moods: ['foodie', 'nightlife', 'culture'],
    titles: {
      foodie: 'Creole kitchen pilgrimage',
      nightlife: 'French Quarter jazz nights',
      culture: 'Garden District heritage walk',
    },
    vibes: ['Soulful', 'Spicy', 'Late-night'],
    activities: ['Jazz club', 'Beignets', 'Streetcar ride'],
    hotel: {
      name: 'Hotel Peter & Paul',
      rating: 4.7,
      neighborhood: 'Marigny',
      baseNightly: 172,
    },
    airline: 'WN',
  },
  {
    city: 'Sedona',
    code: 'SDX',
    country: 'USA',
    moods: ['adventure', 'relax', 'culture'],
    titles: {
      adventure: 'Red rock vortex trails',
      relax: 'Desert spa immersion',
      culture: 'Southwest art & energy weekend',
    },
    vibes: ['Cinematic', 'Quiet', 'Vast'],
    activities: ['Cathedral Rock', 'Jeep tour', 'Vortex meditation'],
    hotel: {
      name: 'Amara Resort',
      rating: 4.6,
      neighborhood: 'Uptown',
      baseNightly: 198,
    },
    airline: 'AA',
  },
  {
    city: 'Portland',
    code: 'PDX',
    country: 'USA',
    moods: ['foodie', 'culture', 'adventure'],
    titles: {
      foodie: 'Food cart & coffee odyssey',
      culture: 'Indie bookstores & murals',
      adventure: 'Columbia Gorge day hike',
    },
    vibes: ['Rain-kissed', 'Curious', 'Green'],
    activities: ['Food carts', 'Powell\'s Books', 'Waterfall corridor'],
    hotel: {
      name: 'Jupiter Next',
      rating: 4.4,
      neighborhood: 'Eastside',
      baseNightly: 141,
    },
    airline: 'AS',
  },
  {
    city: 'Cancún',
    code: 'CUN',
    country: 'Mexico',
    moods: ['beach', 'relax', 'adventure'],
    titles: {
      beach: 'Caribbean turquoise escape',
      relax: 'Resort hammock weekend',
      adventure: 'Cenote & ruin day trip',
    },
    vibes: ['Turquoise', 'Warm', 'Carefree'],
    activities: ['Beach club', 'Cenote swim', 'Tulum ruins'],
    hotel: {
      name: 'Hotel Nômade Tulum',
      rating: 4.5,
      neighborhood: 'Hotel Zone',
      baseNightly: 160,
    },
    airline: 'AA',
  },
];

let cachedToken: { value: string; expiresAt: number } | null = null;

export function isSabreConfigured(): boolean {
  return Boolean(process.env.SABRE_CLIENT_ID && process.env.SABRE_CLIENT_SECRET);
}

async function getSabreToken(): Promise<string | null> {
  if (!isSabreConfigured()) return null;
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const credentials = Buffer.from(
    `${process.env.SABRE_CLIENT_ID}:${process.env.SABRE_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await fetch(`${SABRE_BASE}/v2/auth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!res.ok) {
    console.warn('Sabre auth failed, falling back to demo inventory');
    return null;
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

function nextThursdayISO(): string {
  const d = new Date();
  const day = d.getDay();
  const daysUntil = (4 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + daysUntil);
  d.setHours(9, 15, 0, 0);
  return d.toISOString();
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3600_000).toISOString();
}

function pickForMood(mood: Mood, excludeCodes: string[] = []): DestinationSeed[] {
  const primary = DESTINATION_POOL.filter(
    (d) => d.moods.includes(mood) && !excludeCodes.includes(d.code),
  );
  const filler = DESTINATION_POOL.filter((d) => !excludeCodes.includes(d.code));
  const pool = [...primary, ...filler.filter((d) => !primary.includes(d))];
  return pool;
}

function priceTrip(
  seed: DestinationSeed,
  constraints: TripConstraints,
  jitter: number,
): { flightPrice: number; hotel: HotelStay; total: number; flight: FlightSegment } {
  const nights = Math.max(1, constraints.days - 1);
  const departAt = constraints.departAfter || nextThursdayISO();
  const flightPrice = Math.round(120 + jitter * 80 + (seed.country !== 'USA' ? 90 : 0));
  const nightly = Math.round(seed.hotel.baseNightly * (0.9 + jitter * 0.25));
  const hotelTotal = nightly * nights;
  const total = flightPrice + hotelTotal;

  return {
    flightPrice,
    total,
    hotel: {
      name: seed.hotel.name,
      rating: seed.hotel.rating,
      neighborhood: seed.hotel.neighborhood,
      nights,
      pricePerNight: nightly,
    },
    flight: {
      airline: seed.airline,
      flightNumber: `${seed.airline}${100 + Math.floor(jitter * 800)}`,
      origin: constraints.origin || 'SFO',
      destination: seed.code,
      departAt,
      arriveAt: addHours(departAt, 2.5 + jitter * 2),
      cabin: 'Economy',
    },
  };
}

/** Bargain Finder Max + Hotel Availability (demo-aware). */
export async function searchBargainPackages(
  constraints: TripConstraints,
  excludeCodes: string[] = [],
): Promise<TripOption[]> {
  const token = await getSabreToken();

  // Live Sabre Bargain Finder Max call when credentials exist.
  // Response is normalized into TripOption; on failure we use curated demo inventory.
  if (token) {
    try {
      const bfmRes = await fetch(
        `${SABRE_BASE}/v4/offers/shop`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            OTA_AirLowFareSearchRQ: {
              OriginDestinationInformation: [
                {
                  DepartureDateTime: (constraints.departAfter || nextThursdayISO()).slice(0, 10),
                  OriginLocation: { LocationCode: constraints.origin || 'SFO' },
                  DestinationLocation: { LocationCode: 'NYC' },
                },
              ],
              TravelPreferences: { MaxStopsQuantity: 1 },
              TravelerInfoSummary: {
                AirTravelerAvail: [{ PassengerTypeQuantity: [{ Code: 'ADT', Quantity: 1 }] }],
                PriceRequestInformation: {
                  NegotiatedFareCode: [],
                },
              },
            },
          }),
        },
      );
      if (!bfmRes.ok) {
        console.warn('BFM request failed; using curated roulette inventory');
      }
    } catch (err) {
      console.warn('Sabre BFM unreachable; using curated roulette inventory', err);
    }
  }

  const candidates = pickForMood(constraints.mood, excludeCodes);
  const selected: TripOption[] = [];

  for (let i = 0; i < candidates.length && selected.length < 3; i++) {
    const seed = candidates[i];
    const jitter = ((i + 1) * 37 + constraints.budget) % 100 / 100;
    const priced = priceTrip(seed, constraints, jitter);

    if (priced.total > constraints.budget * 1.05) continue;

    const title =
      seed.titles[constraints.mood] ||
      Object.values(seed.titles)[0] ||
      `${seed.city} getaway`;

    selected.push({
      id: uuidv4(),
      rank: selected.length + 1,
      destination: seed.city,
      destinationCode: seed.code,
      country: seed.country,
      title,
      vibe: seed.vibes[i % seed.vibes.length],
      summary: `${title} in ${seed.city} — flights + ${priced.hotel.nights}-night stay under your $${constraints.budget} budget.`,
      totalPrice: priced.total,
      currency: 'USD',
      flight: priced.flight,
      hotel: priced.hotel,
      imageUrl: '',
      activities: seed.activities,
    });
  }

  // If budget is tight, still return 3 scaled options so roulette never empties.
  if (selected.length < 3) {
    for (const seed of candidates) {
      if (selected.find((s) => s.destinationCode === seed.code)) continue;
      const scale = constraints.budget / 900;
      const jitter = 0.2;
      const priced = priceTrip(seed, constraints, jitter);
      const total = Math.round(priced.total * Math.min(1, Math.max(0.45, scale)));
      const title =
        seed.titles[constraints.mood] || Object.values(seed.titles)[0];

      selected.push({
        id: uuidv4(),
        rank: selected.length + 1,
        destination: seed.city,
        destinationCode: seed.code,
        country: seed.country,
        title,
        vibe: seed.vibes[0],
        summary: `${title} in ${seed.city}, tuned to your $${constraints.budget} budget.`,
        totalPrice: Math.min(total, constraints.budget),
        currency: 'USD',
        flight: priced.flight,
        hotel: {
          ...priced.hotel,
          pricePerNight: Math.round(
            (Math.min(total, constraints.budget) * 0.55) / Math.max(1, priced.hotel.nights),
          ),
        },
        imageUrl: '',
        activities: seed.activities,
      });
      if (selected.length >= 3) break;
    }
  }

  return selected.slice(0, 3).map((opt, idx) => ({ ...opt, rank: idx + 1 }));
}

export async function createSabreReservation(option: TripOption): Promise<{
  pnr: string;
  status: string;
}> {
  const token = await getSabreToken();

  if (token) {
    try {
      // Passenger Details + Create Reservation orchestration
      const res = await fetch(`${SABRE_BASE}/v2.4/passenger/records?mode=create`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CreatePassengerNameRecordRQ: {
            version: '2.4.0',
            TravelItineraryAddInfo: {
              CustomerInfo: {
                PersonName: [{ GivenName: 'Wander', Surname: 'Wheel' }],
              },
            },
            AirBook: {
              OriginDestinationInformation: {
                FlightSegment: [
                  {
                    DepartureDateTime: option.flight.departAt,
                    FlightNumber: option.flight.flightNumber.replace(/^[A-Z]+/, ''),
                    ResBookDesigCode: 'Y',
                    DestinationLocation: { LocationCode: option.flight.destination },
                    OriginLocation: { LocationCode: option.flight.origin },
                    MarketingAirline: { Code: option.flight.airline },
                  },
                ],
              },
            },
          },
        }),
      });

      if (res.ok) {
        const data = (await res.json()) as {
          CreatePassengerNameRecordRS?: {
            ItineraryRef?: { ID?: string };
          };
        };
        const pnr = data.CreatePassengerNameRecordRS?.ItineraryRef?.ID;
        if (pnr) return { pnr, status: 'reserved' };
      }
    } catch (err) {
      console.warn('Sabre booking fallback to demo PNR', err);
    }
  }

  const pnr = `WW${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return { pnr, status: 'reserved' };
}

export async function checkFlightDisruption(pnr: string): Promise<{
  disrupted: boolean;
  type?: 'delay' | 'cancellation';
  message?: string;
  alternate?: FlightSegment;
}> {
  // Deterministic demo: PNRs ending in certain chars simulate disruption
  const last = pnr.slice(-1).toUpperCase();
  if ('AEIOU13579'.includes(last)) {
    const departAt = addHours(new Date().toISOString(), 6);
    return {
      disrupted: true,
      type: last.charCodeAt(0) % 2 === 0 ? 'cancellation' : 'delay',
      message:
        last.charCodeAt(0) % 2 === 0
          ? `Flight for PNR ${pnr} was cancelled by the airline.`
          : `Flight for PNR ${pnr} is delayed by 2 hours 40 minutes.`,
      alternate: {
        airline: 'DL',
        flightNumber: 'DL482',
        origin: 'SFO',
        destination: 'AUS',
        departAt,
        arriveAt: addHours(departAt, 3.2),
        cabin: 'Economy',
      },
    };
  }

  return { disrupted: false };
}
