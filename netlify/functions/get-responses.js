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

const CHECKBOX_FIELDS = ['manual_work_areas', 'desired_specialist_support', 'systems_used', 'desired_outcomes'];
const SCORE_FIELDS = ['business_visibility_score', 'daily_brief_value_score'];
const IGNORED_FIELDS = ['form-name', 'bot-field'];

function mapSubmission(submission) {
  const data = submission.data || {};
  const row = { response_id: submission.id, submitted_at: submission.created_at };

  Object.keys(data).forEach((key) => {
    if (IGNORED_FIELDS.includes(key)) return;
    if (CHECKBOX_FIELDS.includes(key)) {
      row[key] = String(data[key]).split(',').map((v) => v.trim()).filter(Boolean);
    } else if (SCORE_FIELDS.includes(key)) {
      row[key] = Number(data[key]) || null;
    } else if (key === 'followup_permission') {
      row[key] = data[key] === 'on' || data[key] === true || data[key] === 'true';
    } else {
      row[key] = data[key];
    }
  });

  CHECKBOX_FIELDS.forEach((field) => {
    if (!(field in row)) row[field] = [];
  });
  if (!('followup_permission' in row)) row.followup_permission = false;
  if (!('utm_source' in row) || !row.utm_source) row.utm_source = 'organic';

  return row;
}

function parseNextLink(linkHeader) {
  if (!linkHeader) return null;
  const match = linkHeader.split(',').find((part) => part.includes('rel="next"'));
  if (!match) return null;
  const urlMatch = match.match(/<([^>]+)>/);
  return urlMatch ? urlMatch[1] : null;
}

async function fetchAllSubmissions(formId, token) {
  const results = [];
  let url = `https://api.netlify.com/api/v1/forms/${formId}/submissions?per_page=100`;
  let pages = 0;

  while (url && pages < 50) {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      throw new Error(`Netlify API error (${res.status})`);
    }
    const page = await res.json();
    results.push(...page);
    url = parseNextLink(res.headers.get('link'));
    pages += 1;
  }

  return results;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const { ADMIN_PASSWORD, NETLIFY_ACCESS_TOKEN, NETLIFY_SITE_ID } = process.env;
  if (!ADMIN_PASSWORD) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Admin password not configured' }) };
  }

  const suppliedPassword = event.headers['x-admin-password'] || event.headers['X-Admin-Password'] || '';
  if (!suppliedPassword || !timingSafeEqual(suppliedPassword, ADMIN_PASSWORD)) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  if (!NETLIFY_ACCESS_TOKEN || !NETLIFY_SITE_ID) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured' }) };
  }

  try {
    const formsRes = await fetch(`https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/forms`, {
      headers: { Authorization: `Bearer ${NETLIFY_ACCESS_TOKEN}` },
    });
    if (!formsRes.ok) {
      throw new Error(`Netlify API error (${formsRes.status})`);
    }
    const forms = await formsRes.json();
    const surveyForm = forms.find((f) => f.name === 'survey');

    if (!surveyForm) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: [] }),
      };
    }

    const submissions = await fetchAllSubmissions(surveyForm.id, NETLIFY_ACCESS_TOKEN);
    const responses = submissions
      .map(mapSubmission)
      .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses }),
    };
  } catch (err) {
    console.error('Failed to load submissions:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Failed to load responses' }) };
  }
};
