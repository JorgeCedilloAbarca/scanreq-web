const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const { email, currency = 'usd' } = JSON.parse(event.body || '{}');

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Email inválido.' })
      };
    }

    const { error } = await supabase
      .from('waitlist')
      .insert({ email: email.trim().toLowerCase(), currency });

    // Si el email ya existe (UNIQUE constraint) lo tratamos como éxito
    if (error && error.code !== '23505') {
      console.error('Supabase insert error:', error);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ success: false, message: 'Error del servidor.' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true })
    };
  } catch (error) {
    console.error('notify error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Error del servidor.' })
    };
  }
};
