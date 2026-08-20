const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const TEXT_FIELDS = [
  'industry',
  'company_size',
  'role',
  'time_consuming_tasks',
  'tasks_being_missed',
  'hours_lost_per_week',
  'ideal_additional_role',
  'named_software',
  'ai_action_comfort',
  'willingness_to_pay',
  'definition_of_value',
  'biggest_frustration',
  'contact_name',
  'contact_email',
  'contact_company',
];

const ARRAY_FIELDS = [
  'manual_work_areas',
  'desired_specialist_support',
  'systems_used',
  'desired_outcomes',
];

const SCORE_FIELDS = ['business_visibility_score', 'daily_brief_value_score'];

function sanitizeText(value, maxLength = 2000) {
  if (typeof value !== 'string') return null;
  return value.trim().slice(0, maxLength) || null;
}

function sanitizeArray(value, maxItems = 20) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim().slice(0, 200))
    .filter(Boolean)
    .slice(0, maxItems);
}

function sanitizeScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(10, Math.max(1, Math.round(n)));
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const record = { response_id: crypto.randomUUID() };

  for (const field of TEXT_FIELDS) {
    record[field] = sanitizeText(payload[field]);
  }
  for (const field of ARRAY_FIELDS) {
    record[field] = sanitizeArray(payload[field]);
  }
  for (const field of SCORE_FIELDS) {
    record[field] = sanitizeScore(payload[field]);
  }

  record.followup_permission = Boolean(payload.followup_permission);

  const allowedSources = ['organic', 'whatsapp', 'email', 'direct'];
  const source = typeof payload.utm_source === 'string' ? payload.utm_source.trim().toLowerCase() : 'organic';
  record.utm_source = allowedSources.includes(source) ? source : 'organic';

  if (record.contact_email) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(record.contact_email)) {
      record.contact_email = null;
    }
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { error } = await supabase.from('survey_responses').insert(record);

  if (error) {
    console.error('Supabase insert error:', error.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to save response' }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, response_id: record.response_id }),
  };
};
