/**
 * Vocal Bridge integration layer.
 *
 * Browser: @vocalbridgeai/sdk connects via short-lived tokens from /api/voice-token.
 * Server: mint tokens + optional outbound Disruption Shield calls.
 * Fallback: Web Speech API when keys are absent.
 */

export type VocalBridgeCallResult = {
  callId: string;
  status: 'queued' | 'ringing' | 'completed' | 'demo';
  message: string;
};

export type VocalBridgeTokenResponse = {
  url: string;
  token: string;
  room_name: string;
  participant_identity: string;
  expires_in: number;
  agent_mode?: string;
  livekit_url?: string;
};

export function getVocalBridgeBaseUrl() {
  return (process.env.VOCAL_BRIDGE_BASE_URL || 'https://vocalbridgeai.com').replace(/\/$/, '');
}

export function isVocalBridgeConfigured(): boolean {
  return Boolean(process.env.VOCAL_BRIDGE_API_KEY);
}

/** Mint a short-lived LiveKit room token for the browser SDK. */
export async function mintVocalBridgeToken(params: {
  participantName?: string;
  sessionId?: string;
}): Promise<VocalBridgeTokenResponse> {
  if (!isVocalBridgeConfigured()) {
    throw new Error('VOCAL_BRIDGE_API_KEY is not set');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VOCAL_BRIDGE_API_KEY!,
  };

  const agentId = process.env.VOCAL_BRIDGE_AGENT_ID;
  if (agentId) headers['X-Agent-Id'] = agentId;

  const body: Record<string, string> = {
    participant_name: params.participantName || 'Wanderer',
  };
  if (params.sessionId) body.session_id = params.sessionId;

  const res = await fetch(`${getVocalBridgeBaseUrl()}/api/v1/token`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vocal Bridge token failed: ${res.status} ${text}`);
  }

  return (await res.json()) as VocalBridgeTokenResponse;
}

export async function placeOutboundCall(params: {
  phone: string;
  script: string;
  metadata?: Record<string, string>;
}): Promise<VocalBridgeCallResult> {
  if (!isVocalBridgeConfigured()) {
    console.info('[Vocal Bridge DEMO] Outbound call script:', params.script);
    return {
      callId: `demo-call-${Date.now()}`,
      status: 'demo',
      message: params.script,
    };
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${process.env.VOCAL_BRIDGE_API_KEY}`,
    'Content-Type': 'application/json',
    'X-API-Key': process.env.VOCAL_BRIDGE_API_KEY!,
  };
  if (process.env.VOCAL_BRIDGE_AGENT_ID) {
    headers['X-Agent-Id'] = process.env.VOCAL_BRIDGE_AGENT_ID;
  }

  const res = await fetch(`${getVocalBridgeBaseUrl()}/api/v1/calls`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to: params.phone,
      voice: 'wanderwheel-agent',
      script: params.script,
      metadata: params.metadata,
      agent_id: process.env.VOCAL_BRIDGE_AGENT_ID,
      stream: { protocol: 'webrtc' },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vocal Bridge call failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { id: string; status: string };
  return {
    callId: data.id,
    status: (data.status as VocalBridgeCallResult['status']) || 'queued',
    message: params.script,
  };
}

export function buildDisruptionScript(params: {
  destination: string;
  type: 'delay' | 'cancellation';
  alternateDepart?: string;
}): string {
  const when = params.alternateDepart
    ? new Date(params.alternateDepart).toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit',
      })
    : 'later today';

  if (params.type === 'cancellation') {
    return `Hi, this is WanderWheel. Your flight to ${params.destination} was cancelled. I found a replacement departing at ${when}. Say Approve to switch, or say Cancel to keep looking.`;
  }

  return `Hi, this is WanderWheel. Your flight to ${params.destination} is delayed. I found a later one departing at ${when}. Say Approve to switch.`;
}

/** Client-side config hints (no secrets). */
export function getClientVoiceConfig() {
  return {
    mode: isVocalBridgeConfigured() ? ('vocal-bridge' as const) : ('web-speech' as const),
    tokenUrl: '/api/voice-token',
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };
}
