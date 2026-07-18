import { NextRequest, NextResponse } from 'next/server';
import { verifyPayPalWebhook } from '@/lib/paypal-client';
import { getBookingByOrderId, updateBookingStatus } from '@/lib/store';

type WebhookEvent = {
  event_type?: string;
  resource?: {
    id?: string;
    status?: string;
    supplementary_data?: {
      related_ids?: { order_id?: string };
    };
  };
};

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let body: WebhookEvent;

  try {
    body = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const headers: Record<string, string | undefined> = {
    'paypal-auth-algo': req.headers.get('paypal-auth-algo') || undefined,
    'paypal-cert-url': req.headers.get('paypal-cert-url') || undefined,
    'paypal-transmission-id': req.headers.get('paypal-transmission-id') || undefined,
    'paypal-transmission-sig': req.headers.get('paypal-transmission-sig') || undefined,
    'paypal-transmission-time': req.headers.get('paypal-transmission-time') || undefined,
  };

  const valid = await verifyPayPalWebhook(headers, body);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  if (body.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
    const orderId =
      body.resource?.supplementary_data?.related_ids?.order_id ||
      body.resource?.id;

    if (orderId) {
      const booking = getBookingByOrderId(orderId);
      if (booking) {
        updateBookingStatus(booking.id, 'paid', {
          paypalCaptureId: body.resource?.id,
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
