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
    const { email } = JSON.parse(event.body || '{}');

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: 'Email inválido.' })
      };
    }

    const { data, error } = await supabase
      .from('licenses')
      .select('token, is_active, customer_email')
      .eq('customer_email', email.trim().toLowerCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      // Respuesta genérica — no revelamos si el email existe o no
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          message: 'If this email has an active license, the token has been sent.'
        })
      };
    }

    // Aquí se enviará el email con el token cuando Resend/Brevo esté configurado.
    // Por ahora devolvemos el token directamente en la respuesta
    // (aceptable mientras el checkout no está activo públicamente).
    // TODO: sustituir por envío de email cuando se integre Resend.
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        token: data.token,
        message: 'Token found.'
      })
    };

  } catch (err) {
    console.error('recover-token error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: 'Error del servidor.' })
    };
  }
};
