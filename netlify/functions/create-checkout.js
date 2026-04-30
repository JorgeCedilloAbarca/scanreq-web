const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_IDS = {
  usd: process.env.PRICE_ID_USD,
  eur: process.env.PRICE_ID_EUR
};

const ALLOWED_ORIGINS = [
  'https://scanreq.com',
  'https://www.scanreq.com'
];

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Protección de origen — solo scanreq.com puede crear sesiones de checkout
  const origin = event.headers['origin'] || '';
  if (!ALLOWED_ORIGINS.includes(origin)) {
    console.warn('Forbidden origin:', origin);
    return { statusCode: 403, body: 'Forbidden' };
  }

  try {
    const { currency = 'usd' } = JSON.parse(event.body || '{}');
    const priceId = PRICE_IDS[currency] ?? PRICE_IDS.usd;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: 'https://scanreq.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://scanreq.com/pricing',
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: { currency }
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'Content-Type'
      },
      body: JSON.stringify({ url: session.url })
    };
  } catch (error) {
    console.error('create-checkout error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
