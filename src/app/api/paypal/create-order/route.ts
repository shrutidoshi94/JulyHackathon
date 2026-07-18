import { NextRequest, NextResponse } from 'next/server';
import { createPayPalOrder } from '@/lib/paypal-client';

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      amount: number;
      currency?: string;
      description?: string;
    };

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Valid amount required' }, { status: 400 });
    }

    const order = await createPayPalOrder(
      body.amount,
      body.currency || 'USD',
      body.description || 'WanderWheel Trip Package',
    );

    return NextResponse.json(order);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Order creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
