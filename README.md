# WanderWheel

Spontaneous voice-first travel agent for the **Voice AI Hackathon: The Complete Trip** (July 18, 2026).

Speak a budget, date range, and mood — WanderWheel spins **3 fully bookable trip packages**, lets you **reroll**, and completes **PayPal payment by voice**. No destination shopping. No checkout friction.

## Magic flow

1. **Voice in** — *“I have $800, leave next Thursday for 3 days, feeling adventurous.”*
2. **Sabre search** — Bargain Finder Max + hotel inventory (demo inventory when Sabre keys are absent)
3. **Roulette** — exactly 3 options, with Unsplash hero imagery
4. **Reroll** — say *“reroll”* for three new destinations
5. **Book + PayPal** — say *“book option 2”* then *“confirm payment”*
6. **Disruption Shield** — monitors the PNR and can outbound-call via Vocal Bridge

## Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js App Router, TypeScript, Tailwind CSS |
| Voice | Vocal Bridge WebRTC (`@vocalbridgeai/sdk`) + Web Speech API fallback |
| Travel | Sabre REST (BFM + Passenger Name Record) |
| Payments | PayPal Orders v2 (`@paypal/checkout-server-sdk`) |
| Images | Unsplash |
| PWA | `manifest.webmanifest` + service worker |

## Quick start

```bash
cd JulyHackathon
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Works **without API keys** in demo mode (curated Sabre inventory, mock PayPal orders, cached Unsplash URLs, demo Vocal Bridge calls).

### Optional keys (`.env.local`)

See [`.env.example`](./.env.example) for:

- `PAYPAL_CLIENT_ID` / `PAYPAL_CLIENT_SECRET` / `PAYPAL_WEBHOOK_ID`
- `SABRE_CLIENT_ID` / `SABRE_CLIENT_SECRET`
- `UNSPLASH_ACCESS_KEY`
- `VOCAL_BRIDGE_API_KEY` / `VOCAL_BRIDGE_AGENT_ID` / `VOCAL_BRIDGE_BASE_URL`
  - Browser connects via `POST /api/voice-token` (key stays server-side)
  - Smoke test: `node scripts/test-vocal-bridge.mjs`

## Voice commands

| You say | Agent does |
| --- | --- |
| Budget + days + mood | Spins 3 trip options |
| *Reroll* / *I don't like these* | Fresh 3 destinations |
| *Book option 2* | Sabre reserve + PayPal order |
| *Confirm payment* | Captures PayPal order |
| *Tell me more about option 1* | Speaks itinerary details |
| *Approve* (after disruption) | Switches to alternate flight |

Text input works as a fallback when the mic is unavailable.

## API routes

| Route | Purpose |
| --- | --- |
| `POST /api/voice/intent` | Parse transcript → search / book / pay / reroll |
| `POST /api/trips/search` | Direct roulette search |
| `POST /api/trips/reroll` | New options for session |
| `POST /api/trips/book` | Sabre PNR + PayPal order |
| `POST /api/paypal/create-order` | Create CAPTURE order |
| `POST /api/paypal/capture` | Capture approved order |
| `POST /api/paypal/webhook` | `PAYMENT.CAPTURE.COMPLETED` verification |
| `POST /api/disruption/monitor` | Disruption Shield check + outbound call |
| `POST /api/disruption/call` | Manual Vocal Bridge outbound |
| `GET /api/images/destination` | Unsplash hero for a city |

## PayPal notes

- Server wrapper: [`src/lib/paypal-client.ts`](./src/lib/paypal-client.ts)
- Orders use `intent: 'CAPTURE'`
- Approval URL returned to the UI for voice *or* click confirmation
- Webhooks verify via PayPal `verify-webhook-signature` when `PAYPAL_WEBHOOK_ID` is set

## Judge magnets

- **Voice-initiated payment** — never leave the conversation to pay
- **Visual context** — full-bleed destination heroes from Unsplash
- **Disruption Shield** — proactive rebooking via Vocal Bridge outbound call
- **PWA** — installable, no app store
- **Webhook verification** — server-side payment completion even if the browser closes

## Demo script (3 minutes)

1. Click **Try demo prompt** (or speak it)
2. Hover options — watch the hero change
3. Say / type **Book option 2**
4. Say **Confirm payment**
5. Click **Disruption Shield** in the header → say **Approve**
