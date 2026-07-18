import { NextRequest, NextResponse } from 'next/server';
import { confirmPayment } from '@/lib/trip-engine';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { orderId: string };
    if (!body.orderId) {
      return NextResponse.json({ error: 'orderId required' }, { status: 400 });
    }

    const result = await confirmPayment(body.orderId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Capture failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
