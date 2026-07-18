import { NextRequest, NextResponse } from 'next/server';
import { placeOutboundCall, buildDisruptionScript } from '@/lib/vocal-bridge';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      phone: string;
      destination: string;
      type: 'delay' | 'cancellation';
      alternateDepart?: string;
    };

    const script = buildDisruptionScript({
      destination: body.destination,
      type: body.type || 'delay',
      alternateDepart: body.alternateDepart,
    });

    const call = await placeOutboundCall({
      phone: body.phone,
      script,
      metadata: { destination: body.destination },
    });

    return NextResponse.json({ call, script });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Call failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
