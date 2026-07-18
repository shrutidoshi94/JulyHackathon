/**
 * Vocal Bridge integration layer.
 *
 * Production: WebRTC live streaming via Vocal Bridge SDK.
 * Demo / local: Web Speech API (recognition + synthesis) on the client,
 * with this module providing outbound-call + TTS helpers for the
 * Disruption Shield.
 */

export type VocalBridgeCallResult = {
  callId: string;
  status: 'queued' | 'ringing' | 'completed' | 'demo';
  message: string;
};

export function isVocalBridgeConfigured(): boolean {
  return Boolean(process.env.VOCAL_BRIDGE_API_KEY && process.env.VOCAL_BRIDGE_BASE_URL);
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

  const base = process.env.VOCAL_BRIDGE_BASE_URL!.replace(/\/$/, '');
  const res = await fetch(`${base}/v1/calls`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.VOCAL_BRIDGE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: params.phone,
      voice: 'wanderwheel-agent',
      script: params.script,
      metadata: params.metadata,
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

/** Client-side Vocal Bridge / WebRTC session config for the browser SDK. */
export function getClientVoiceConfig() {
  return {
    mode: isVocalBridgeConfigured() ? ('vocal-bridge' as const) : ('web-speech' as const),
    publicKey: process.env.NEXT_PUBLIC_VOCAL_BRIDGE_KEY || null,
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
  };
}
