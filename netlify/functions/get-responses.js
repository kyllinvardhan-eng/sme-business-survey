const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

function timingSafeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { ADMIN_PASSWORD, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Admin password not configured' }) };
  }

  const suppliedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || '';
  if (!suppliedPassword || !timingSafeEqual(suppliedPassword, ADMIN_PASSWORD)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!SUPABASE_URL || !supabaseKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  const supabase = createClient(SUPABASE_URL, supabaseKey);
  const { data, error } = await supabase
    .from('survey_responses')
    .select('*')
    .order('submitted_at', { ascending: false });

  if (error) {
    console.error('Supabase read error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load responses' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ responses: data || [] }),
  };
};
