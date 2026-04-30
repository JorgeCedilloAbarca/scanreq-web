const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateToken() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const segments = [8, 4, 4, 4].map(len =>
    Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  );
  return 'SCANREQ-PRO-' + segments.join('-');
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;

    if (session.payment_status !== 'paid') {
      return { statusCode: 200, body: 'Ignored - not paid' };
    }

    // Verificar que no existe ya un token para esta sesión (idempotencia)
    const { data: existing } = await supabase
      .from('licenses')
      .select('token')
      .eq('stripe_session_id', session.id)
      .single();

    if (existing) {
      console.log('Token already generated for session:', session.id);
      return { statusCode: 200, body: 'Already processed' };
    }

    const token = generateToken();

    const { error } = await supabase
      .from('licenses')
      .insert({
        token,
        stripe_session_id: session.id,
        stripe_payment_intent: session.payment_intent,
        customer_email: session.customer_details?.email ?? null,
        currency: session.currency ?? 'usd',
        amount_paid: session.amount_total ?? 0,
        is_active: true
      });

    if (error) {
      console.error('Supabase insert error:', error);
      return { statusCode: 500, body: 'Database error' };
    }

    console.log(`Token generated: ${token} for ${session.customer_details?.email}`);
  }

  return { statusCode: 200, body: 'OK' };
};
