export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error('SLACK_WEBHOOK_URL is not set');
    return { statusCode: 500, body: 'Slack webhook not configured' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body).payload;
  } catch (err) {
    return { statusCode: 400, body: 'Invalid payload' };
  }

  const data = payload.data || {};
  const text = `🎉 Someone just completed the SME Business Survey (response #${payload.number ?? '?'}, ${data.industry || 'unknown industry'} / ${data.company_size || 'unknown size'}).`;

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    console.error('Slack webhook failed', res.status, await res.text());
    return { statusCode: 502, body: 'Slack webhook failed' };
  }

  return { statusCode: 200, body: 'ok' };
}
