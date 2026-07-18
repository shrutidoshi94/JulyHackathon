import { NextResponse } from 'next/server';
import { isVocalBridgeConfigured, mintVocalBridgeToken } from '@/lib/vocal-bridge';

export const runtime = 'nodejs';

/** GET — safe status for the UI (never returns secrets). */
export async function GET() {
  return NextResponse.json({
    configured: isVocalBridgeConfigured(),
    agentIdSet: Boolean(process.env.VOCAL_BRIDGE_AGENT_ID),
    baseUrl: process.env.VOCAL_BRIDGE_BASE_URL || 'https://vocalbridgeai.com',
  });
}

/**
 * POST — proxy for @vocalbridgeai/sdk tokenUrl auth.
 * Keeps VOCAL_BRIDGE_API_KEY server-side.
 */
export async function POST(req: Request) {
  if (!isVocalBridgeConfigured()) {
    return NextResponse.json(
      {
        error:
          'Vocal Bridge is not configured. Set VOCAL_BRIDGE_API_KEY (and optionally VOCAL_BRIDGE_AGENT_ID) in .env.local.',
      },
      { status: 503 },
    );
  }

  let body: { participant_name?: string; session_id?: string } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const token = await mintVocalBridgeToken({
      participantName: body.participant_name || 'Wanderer',
      sessionId: body.session_id,
    });
    return NextResponse.json(token);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token mint failed';
    const status = message.includes('404') ? 404 : message.includes('403') ? 403 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}
