import paypal from '@paypal/checkout-server-sdk';

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
  return process.env.NODE_ENV === 'production'
    ? new paypal.core.LiveEnvironment(clientId, clientSecret)
    : new paypal.core.SandboxEnvironment(clientId, clientSecret);
}

function getClient() {
  return new paypal.core.PayPalHttpClient(environment());
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

export async function createPayPalOrder(
  amount: number,
  currency: string = 'USD',
  description: string = 'WanderWheel Trip Package',
) {
  if (!isPayPalConfigured()) {
    const mockId = `MOCK-ORDER-${Date.now()}`;
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    return {
      orderId: mockId,
      approvalUrl: `${base}/payment/success?token=${mockId}&demo=1`,
      demo: true as const,
    };
  }

  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer('return=representation');
  request.requestBody({
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description,
      },
    ],
    application_context: {
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`,
      brand_name: 'WanderWheel',
      user_action: 'PAY_NOW',
    },
  });

  const response = await getClient().execute(request);
  const approval = response.result.links?.find(
    (l: { rel: string; href: string }) => l.rel === 'approve',
  );

  return {
    orderId: response.result.id as string,
    approvalUrl: approval?.href as string,
    demo: false as const,
  };
}

export async function capturePayPalOrder(orderId: string) {
  if (orderId.startsWith('MOCK-ORDER-') || !isPayPalConfigured()) {
    return {
      transactionId: `MOCK-TXN-${Date.now()}`,
      status: 'COMPLETED' as const,
      demo: true as const,
    };
  }

  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  // Empty body is valid for simple capture (PayPal JS SDK types are overly strict).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  request.requestBody({} as any);
  const response = await getClient().execute(request);

  if (response.result.status !== 'COMPLETED') {
    throw new Error(`Payment capture failed: ${response.result.status}`);
  }

  return {
    transactionId: response.result.purchase_units[0].payments.captures[0]
      .id as string,
    status: response.result.status as string,
    demo: false as const,
  };
}

async function getPayPalAccessToken(): Promise<string | null> {
  if (!isPayPalConfigured()) return null;
  const base =
    process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';
  const creds = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`,
  ).toString('base64');

  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export async function verifyPayPalWebhook(
  headers: Record<string, string | undefined>,
  body: unknown,
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId || !isPayPalConfigured()) {
    // Demo / local: accept verified payload shape
    return Boolean(body && typeof body === 'object');
  }

  const token = await getPayPalAccessToken();
  if (!token) return false;

  const base =
    process.env.NODE_ENV === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

  const res = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      auth_algo: headers['paypal-auth-algo'] || '',
      cert_url: headers['paypal-cert-url'] || '',
      transmission_id: headers['paypal-transmission-id'] || '',
      transmission_sig: headers['paypal-transmission-sig'] || '',
      transmission_time: headers['paypal-transmission-time'] || '',
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { verification_status?: string };
  return data.verification_status === 'SUCCESS';
}
