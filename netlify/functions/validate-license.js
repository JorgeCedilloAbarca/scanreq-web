const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // CORS para el plugin de VS Code
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  try {
    const { token } = JSON.parse(event.body || '{}');

    if (!token || typeof token !== 'string') {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, message: 'Token requerido.' })
      };
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('token, is_active, customer_email, activated_at')
      .eq('token', token.trim())
      .single();

    if (error || !data) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ valid: false, message: 'Token no encontrado.' })
      };
    }

    if (!data.is_active) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ valid: false, message: 'Esta licencia ha sido desactivada.' })
      };
    }

    // Primera activación — registrar timestamp
    if (!data.activated_at) {
      await supabase
        .from('licenses')
        .update({ activated_at: new Date().toISOString() })
        .eq('token', token.trim());
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ valid: true, email: data.customer_email })
    };
  } catch (error) {
    console.error('validate-license error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, message: 'Error del servidor.' })
    };
  }
};
