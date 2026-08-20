const STORAGE_KEY = 'sme_survey_admin_password';

let responses = [];

function $(selector) {
  return document.querySelector(selector);
}

function showAdminScreen(id) {
  document.querySelectorAll('#admin-view .screen').forEach((el) => el.classList.add('hidden'));
  $(`#${id}`).classList.remove('hidden');
}

async function fetchResponses(password) {
  const res = await fetch('/api/get-responses', {
    headers: { 'x-admin-password': password },
  });
  if (!res.ok) {
    throw new Error(res.status === 401 ? 'Unauthorized' : 'Failed to load');
  }
  const data = await res.json();
  return data.responses || [];
}

function countSingle(rows, field) {
  const counts = {};
  rows.forEach((row) => {
    const value = row[field];
    if (!value) return;
    counts[value] = (counts[value] || 0) + 1;
  });
  return counts;
}

function countArray(rows, field) {
  const counts = {};
  rows.forEach((row) => {
    const values = row[field];
    if (!Array.isArray(values)) return;
    values.forEach((value) => {
      if (!value) return;
      counts[value] = (counts[value] || 0) + 1;
    });
  });
  return counts;
}

function renderBarChart(containerId, counts, limit = 8) {
  const container = document.getElementById(containerId);
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, limit);

  if (entries.length === 0) {
    container.innerHTML = '<p class="bar-empty">No data yet</p>';
    return;
  }

  const max = entries[0][1];
  container.innerHTML = entries
    .map(([label, count]) => {
      const pct = Math.max(4, Math.round((count / max) * 100));
      return `
        <div class="bar-row">
          <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
          <span class="bar-track"><span class="bar-fill" style="width:${pct}%"></span></span>
          <span class="bar-count">${count}</span>
        </div>`;
    })
    .join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderStats(rows) {
  const total = rows.length;
  const whatsappCount = rows.filter((r) => r.utm_source === 'whatsapp').length;
  const followupCount = rows.filter((r) => r.followup_permission).length;
  const avgVisibility = average(rows.map((r) => r.business_visibility_score).filter(Number.isFinite));
  const avgBriefValue = average(rows.map((r) => r.daily_brief_value_score).filter(Number.isFinite));

  const stats = [
    { label: 'Total Responses', value: total },
    { label: 'From WhatsApp', value: whatsappCount },
    { label: 'Open to Follow-up', value: followupCount },
    { label: 'Avg. Visibility Score', value: avgVisibility ? avgVisibility.toFixed(1) : '-' },
    { label: 'Avg. Daily Brief Value', value: avgBriefValue ? avgBriefValue.toFixed(1) : '-' },
  ];

  $('#stat-grid').innerHTML = stats
    .map((s) => `
      <div class="stat-card">
        <div class="stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`)
    .join('');
}

function average(nums) {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

const HOURS_MIDPOINT = {
  'Less than 5 hours': 2.5,
  '5-10 hours': 7.5,
  '11-20 hours': 15.5,
  '21-30 hours': 25.5,
  'More than 30 hours': 35,
};

const WTP_VALUE = {
  "Nothing - I'd need it to be free": 0,
  'Under $50/month': 25,
  '$50-150/month': 100,
  '$150-500/month': 325,
  '$500+/month': 600,
};

function renderOpportunities(rows) {
  const fields = ['manual_work_areas', 'desired_specialist_support', 'desired_outcomes'];
  const tagStats = {};

  rows.forEach((row) => {
    const hoursScore = HOURS_MIDPOINT[row.hours_lost_per_week] || 0;
    const wtpScore = WTP_VALUE[row.willingness_to_pay] || 0;

    fields.forEach((field) => {
      const values = Array.isArray(row[field]) ? row[field] : [];
      values.forEach((tag) => {
        if (!tagStats[tag]) {
          tagStats[tag] = { frequency: 0, hoursTotal: 0, wtpTotal: 0 };
        }
        tagStats[tag].frequency += 1;
        tagStats[tag].hoursTotal += hoursScore;
        tagStats[tag].wtpTotal += wtpScore;
      });
    });
  });

  const ranked = Object.entries(tagStats)
    .map(([tag, stat]) => {
      const avgHours = stat.hoursTotal / stat.frequency;
      const avgWtp = stat.wtpTotal / stat.frequency;
      const score = stat.frequency * 10 + avgHours * 2 + avgWtp * 0.1;
      return { tag, score, frequency: stat.frequency, avgHours, avgWtp };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const list = $('#opportunities-list');
  if (ranked.length === 0) {
    list.innerHTML = '<li class="bar-empty">No data yet</li>';
    return;
  }

  list.innerHTML = ranked
    .map(
      (item) => `
      <li>
        <strong>${escapeHtml(item.tag)}</strong>
        <div class="opp-score">
          Mentioned by ${item.frequency} respondent${item.frequency === 1 ? '' : 's'} &middot;
          ~${item.avgHours.toFixed(0)} hrs/week lost on average &middot;
          avg. willingness to pay $${item.avgWtp.toFixed(0)}/mo
        </div>
      </li>`
    )
    .join('');
}

function renderTable(rows) {
  const tbody = $('#responses-table-body');
  if (rows.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8">No responses yet</td></tr>';
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const date = row.submitted_at ? new Date(row.submitted_at).toLocaleString() : '-';
      const contact = row.contact_name || row.contact_email
        ? `${escapeHtml(row.contact_name || '')} ${row.contact_email ? `(${escapeHtml(row.contact_email)})` : ''}`.trim()
        : '-';
      return `
        <tr>
          <td>${date}</td>
          <td>${escapeHtml(row.industry || '-')}</td>
          <td>${escapeHtml(row.company_size || '-')}</td>
          <td>${escapeHtml(row.role || '-')}</td>
          <td>${escapeHtml(row.hours_lost_per_week || '-')}</td>
          <td>${escapeHtml(row.willingness_to_pay || '-')}</td>
          <td>${escapeHtml(row.utm_source || 'organic')}</td>
          <td>${contact}</td>
        </tr>`;
    })
    .join('');
}

function renderDashboard(rows) {
  responses = rows;
  renderStats(rows);
  renderBarChart('chart-company-size', countSingle(rows, 'company_size'));
  renderBarChart('chart-industry', countSingle(rows, 'industry'));
  renderBarChart('chart-manual-work', countArray(rows, 'manual_work_areas'));
  renderBarChart('chart-hours-lost', countSingle(rows, 'hours_lost_per_week'));
  renderBarChart('chart-specialist-support', countArray(rows, 'desired_specialist_support'));
  renderBarChart('chart-systems-used', countArray(rows, 'systems_used'));
  renderBarChart('chart-desired-outcomes', countArray(rows, 'desired_outcomes'));
  renderBarChart('chart-ai-comfort', countSingle(rows, 'ai_action_comfort'));
  renderBarChart('chart-willingness', countSingle(rows, 'willingness_to_pay'));
  renderBarChart('chart-source', countSingle(rows, 'utm_source'));
  renderOpportunities(rows);
  renderTable(rows);
}

function exportCsv() {
  if (responses.length === 0) return;

  const columns = [
    'response_id', 'submitted_at', 'industry', 'company_size', 'role',
    'time_consuming_tasks', 'manual_work_areas', 'tasks_being_missed', 'hours_lost_per_week',
    'desired_specialist_support', 'ideal_additional_role', 'systems_used', 'named_software',
    'business_visibility_score', 'daily_brief_value_score', 'desired_outcomes',
    'ai_action_comfort', 'willingness_to_pay', 'definition_of_value', 'biggest_frustration',
    'contact_name', 'contact_email', 'contact_company', 'followup_permission', 'utm_source',
  ];

  const escapeCsv = (value) => {
    if (Array.isArray(value)) value = value.join('; ');
    if (value === null || value === undefined) value = '';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const lines = [columns.join(',')];
  responses.forEach((row) => {
    lines.push(columns.map((col) => escapeCsv(row[col])).join(','));
  });

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `sme-survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function setupWhatsappTools() {
  const surveyUrl = new URL(window.location.href);
  surveyUrl.search = '';
  surveyUrl.searchParams.set('utm_source', 'whatsapp');
  $('#survey-link').value = surveyUrl.toString();

  $('#copy-link-btn').addEventListener('click', () => copyToClipboard($('#survey-link').value));

  $('#generate-wa-link-btn').addEventListener('click', () => {
    const template = $('#wa-message-template').value || '{LINK}';
    const message = template.replace('{LINK}', surveyUrl.toString());
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    $('#wa-generated-link').value = waLink;
  });

  $('#copy-wa-link-btn').addEventListener('click', () => copyToClipboard($('#wa-generated-link').value));
}

async function copyToClipboard(text) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // clipboard API unavailable; silently ignore
  }
}

async function loadDashboard(password) {
  const rows = await fetchResponses(password);
  showAdminScreen('admin-dashboard-screen');
  renderDashboard(rows);
}

async function handleLogin(event) {
  event.preventDefault();
  const password = $('#admin-password').value;
  const errorEl = $('#admin-login-error');
  errorEl.classList.add('hidden');

  try {
    await loadDashboard(password);
    sessionStorage.setItem(STORAGE_KEY, password);
  } catch {
    errorEl.classList.remove('hidden');
  }
}

function handleLogout() {
  sessionStorage.removeItem(STORAGE_KEY);
  showAdminScreen('admin-login-screen');
  $('#admin-password').value = '';
}

export function initAdmin() {
  $('#admin-login-form').addEventListener('submit', handleLogin);
  $('#admin-logout-btn').addEventListener('click', handleLogout);
  $('#export-csv-btn').addEventListener('click', exportCsv);
  setupWhatsappTools();

  const savedPassword = sessionStorage.getItem(STORAGE_KEY);
  if (savedPassword) {
    loadDashboard(savedPassword).catch(() => {
      sessionStorage.removeItem(STORAGE_KEY);
      showAdminScreen('admin-login-screen');
    });
  }
}
