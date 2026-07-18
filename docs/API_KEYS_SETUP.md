# WanderWheel — API Keys Setup Checklist

Paste values into `.env.local` (never commit this file). When done, tell the agent: **“keys are in .env.local”**.

---

## 1. PayPal (easiest — do this first) ✅

Portal: [https://developer.paypal.com/dashboard/](https://developer.paypal.com/dashboard/)

1. Sign up / log in with a PayPal account.
2. Open **Apps & Credentials**.
3. Stay on the **Sandbox** tab.
4. Use **Default Application** or click **Create App** → name it `WanderWheel`.
5. Copy:
   - **Client ID** → `PAYPAL_CLIENT_ID` and `NEXT_PUBLIC_PAYPAL_CLIENT_ID`
   - **Secret** → `PAYPAL_CLIENT_SECRET`
6. (Optional webhooks) **Apps & Credentials** → your app → **Add Webhook**
   - URL: `https://YOUR_PUBLIC_URL/api/paypal/webhook`
   - Event: `PAYMENT.CAPTURE.COMPLETED`
   - Copy **Webhook ID** → `PAYPAL_WEBHOOK_ID`

Sandbox buyer account: **Testing Tools → Sandbox Accounts**.

---

## 2. Vocal Bridge (voice + outbound Disruption Shield) ✅

Portal: [https://vocalbridgeai.com/](https://vocalbridgeai.com/)  
Docs: [https://vocalbridgeai.com/docs/overview](https://vocalbridgeai.com/docs/overview)

1. Create a free / trial account.
2. Create a voice agent (system prompt can be WanderWheel’s travel agent persona).
3. Copy the **Agent UUID** → `VOCAL_BRIDGE_AGENT_ID`
4. Create an **API key** (account or agent key; starts with `vb_`) → `VOCAL_BRIDGE_API_KEY`
5. Set `VOCAL_BRIDGE_BASE_URL=https://vocalbridgeai.com`
6. (Recommended) In the agent dashboard, enable **AI Agent** mode so spoken questions are forwarded to WanderWheel’s `/api/voice/intent` brain via the SDK `useAIAgent` hook.
7. Restart `npm run dev`, open `/`, click **Start Vocal Bridge**, allow the mic, and talk.

Frontend wiring: `POST /api/voice-token` proxies `https://vocalbridgeai.com/api/v1/token` with `X-API-Key` (and `X-Agent-Id` when set). The browser never sees your API key.

---

## 3. Landing AI (visual intelligence) ✅

**Option A — Agentic Document Extraction (ADE)**  
Portal: [https://ade.landing.ai/](https://ade.landing.ai/)  
Docs: [https://docs.landing.ai/ade/agentic-api-key](https://docs.landing.ai/ade/agentic-api-key)

1. Log in → profile → **API Key**.
2. **Create Key** → copy → `VISION_AGENT_API_KEY` and/or `LANDINGAI_API_KEY`

**Option B — LandingLens**  
Portal: [https://app.landing.ai/](https://app.landing.ai/) → user menu → **API Key** → Create New Key.

---

## 4. Sabre (travel search / booking) ⚠️

Portal: [https://developer.sabre.com/](https://developer.sabre.com/)

1. Register for a **Sabre Dev Studio** account.
2. Create an application under **My keys / Applications**.
3. Copy **Client ID** → `SABRE_CLIENT_ID`
4. Copy **Client Secret** → `SABRE_CLIENT_SECRET`
5. Use cert/test base: `SABRE_API_BASE=https://api.cert.platform.sabre.com`  
   (some accounts use `https://api.test.sabre.com`)

**Important:** Free sandbox often covers auth + some REST APIs. **Bargain Finder Max** and live booking may need Sabre approval / a PCC. If BFM is blocked, WanderWheel keeps curated demo inventory so the demo still runs.

---

## Paste template (`.env.local`)

```bash
NEXT_PUBLIC_BASE_URL=http://localhost:3000

PAYPAL_CLIENT_ID= 
PAYPAL_CLIENT_SECRET=
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_WEBHOOK_ID=

SABRE_CLIENT_ID=
SABRE_CLIENT_SECRET=
SABRE_API_BASE=https://api.cert.platform.sabre.com

LANDINGAI_API_KEY=
VISION_AGENT_API_KEY=

VOCAL_BRIDGE_API_KEY=
VOCAL_BRIDGE_AGENT_ID=
VOCAL_BRIDGE_BASE_URL=https://vocalbridgeai.com
```
