const TOTAL_QUESTIONS = 19;

let currentQuestion = 1;

function $(selector) {
  return document.querySelector(selector);
}

function getUtmSource() {
  const params = new URLSearchParams(window.location.search);
  const source = (params.get('utm_source') || '').toLowerCase();
  return ['whatsapp', 'email', 'direct'].includes(source) ? source : 'organic';
}

function buildShareUrl() {
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('utm_source', 'whatsapp');
  return url.toString();
}

function shareViaWhatsApp() {
  const link = buildShareUrl();
  const message = `We're running a quick 5-minute survey on the challenges SMEs face day-to-day. Would love your input: ${link}`;
  const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank', 'noopener');
}

function showScreen(id) {
  document.querySelectorAll('#survey-view .screen').forEach((el) => el.classList.add('hidden'));
  $(`#${id}`).classList.remove('hidden');
}

function updateQuestionVisibility() {
  document.querySelectorAll('.question').forEach((el) => {
    const num = Number(el.dataset.question);
    el.classList.toggle('hidden', num !== currentQuestion);
  });

  const fill = $('#progress-fill');
  const label = $('#progress-label');
  const pct = (currentQuestion / TOTAL_QUESTIONS) * 100;
  fill.style.width = `${pct}%`;
  label.textContent = `Question ${currentQuestion} of ${TOTAL_QUESTIONS}`;

  $('#back-btn').classList.toggle('hidden', currentQuestion === 1);
  $('#next-btn').classList.toggle('hidden', currentQuestion === TOTAL_QUESTIONS);
  $('#submit-btn').classList.toggle('hidden', currentQuestion !== TOTAL_QUESTIONS);
}

function collectFormData() {
  const form = $('#survey-form');
  const data = {};

  const singleFields = [
    'industry', 'company_size', 'role', 'time_consuming_tasks', 'tasks_being_missed',
    'hours_lost_per_week', 'ideal_additional_role', 'named_software',
    'ai_action_comfort', 'willingness_to_pay', 'definition_of_value', 'biggest_frustration',
    'contact_name', 'contact_email', 'contact_company',
  ];
  singleFields.forEach((name) => {
    const el = form.elements[name];
    data[name] = el ? el.value : '';
  });

  const scoreFields = ['business_visibility_score', 'daily_brief_value_score'];
  scoreFields.forEach((name) => {
    const el = form.elements[name];
    data[name] = el ? Number(el.value) : null;
  });

  document.querySelectorAll('.checkbox-group[data-field]').forEach((group) => {
    const field = group.dataset.field;
    data[field] = Array.from(group.querySelectorAll('input[type="checkbox"]:checked')).map((cb) => cb.value);
  });

  data.followup_permission = form.elements['followup_permission']
    ? form.elements['followup_permission'].checked
    : false;

  data.utm_source = getUtmSource();

  return data;
}

async function submitSurvey(event) {
  event.preventDefault();
  const submitBtn = $('#submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/api/submit-response', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collectFormData()),
    });

    if (!response.ok) {
      throw new Error('Submission failed');
    }

    showScreen('thanks-screen');
  } catch (err) {
    $('#error-message').textContent = "We couldn't submit your response. Please check your connection and try again.";
    showScreen('error-screen');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit survey';
  }
}

export function initSurvey() {
  document.querySelectorAll('input[type="range"]').forEach((range) => {
    const output = document.getElementById(`${range.id}_out`);
    if (output) {
      output.textContent = range.value;
      range.addEventListener('input', () => {
        output.textContent = range.value;
      });
    }
  });

  $('#start-btn').addEventListener('click', () => {
    showScreen('form-screen');
    currentQuestion = 1;
    updateQuestionVisibility();
  });

  $('#next-btn').addEventListener('click', () => {
    if (currentQuestion < TOTAL_QUESTIONS) {
      currentQuestion += 1;
      updateQuestionVisibility();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $('#back-btn').addEventListener('click', () => {
    if (currentQuestion > 1) {
      currentQuestion -= 1;
      updateQuestionVisibility();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  $('#survey-form').addEventListener('submit', submitSurvey);

  $('#retry-btn').addEventListener('click', () => {
    showScreen('form-screen');
  });

  $('#whatsapp-share-intro').addEventListener('click', shareViaWhatsApp);
  $('#whatsapp-share-thanks').addEventListener('click', shareViaWhatsApp);
}
