const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store'
  };

  const sessionId = event.queryStringParameters?.session_id;

  if (!sessionId) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ token: null, message: 'session_id required' })
    };
  }

  try {
    // Esperar hasta 10s a que el webhook de Stripe haya procesado el pago
    // (el webhook puede tardar unos segundos en llegar después del redirect)
    let data = null;
    let attempts = 0;
    const maxAttempts = 5;

    while (!data && attempts < maxAttempts) {
      const result = await supabase
        .from('licenses')
        .select('token')
        .eq('stripe_session_id', sessionId)
        .single();

      if (result.data) {
        data = result.data;
      } else {
        attempts++;
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    if (!data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          token: null,
          message: 'Token not found. The payment may still be processing — please refresh in a few seconds.'
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ token: data.token })
    };
  } catch (error) {
    console.error('get-token error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ token: null, message: 'Server error' })
    };
  }
};
