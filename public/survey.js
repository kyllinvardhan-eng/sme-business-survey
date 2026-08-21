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

function applyUtmSourceToForm() {
  const field = document.getElementById('utm_source_field');
  if (field) field.value = getUtmSource();
}

function buildShareUrl() {
  return 'https://bit.ly/4qts3Zp';
}

function shareViaWhatsApp() {
  const link = buildShareUrl();
  const message = `We're running a quick 5-minute survey on the challenges your business or company faces day-to-day. Would love your input: ${link}`;
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

function isQuestionAnswered(questionEl) {
  if (questionEl.dataset.required === 'false') return true;

  const selects = questionEl.querySelectorAll('select');
  for (const select of selects) {
    if (!select.value) return false;
  }

  const textFields = questionEl.querySelectorAll('input[type="text"], input[type="email"], textarea');
  for (const field of textFields) {
    if (!field.value.trim()) return false;
  }

  const checkboxGroups = questionEl.querySelectorAll('.checkbox-group');
  for (const group of checkboxGroups) {
    if (!group.querySelector('input[type="checkbox"]:checked')) return false;
  }

  return true;
}

function getValidationError(questionEl) {
  let error = questionEl.querySelector('.validation-error');
  if (!error) {
    error = document.createElement('p');
    error.className = 'error-text validation-error hidden';
    error.textContent = 'Please answer this question before continuing.';
    questionEl.appendChild(error);
  }
  return error;
}

function clearValidationError(questionEl) {
  const error = questionEl.querySelector('.validation-error');
  if (error) error.classList.add('hidden');
}

function goToQuestion(num) {
  currentQuestion = num;
  updateQuestionVisibility();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function encodeFormData(form) {
  const params = new URLSearchParams();
  new FormData(form).forEach((value, key) => {
    params.append(key, value);
  });
  return params.toString();
}

async function submitSurvey(event) {
  event.preventDefault();
  const form = $('#survey-form');
  const submitBtn = $('#submit-btn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting...';

  try {
    const response = await fetch('/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: encodeFormData(form),
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
  applyUtmSourceToForm();

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
    const questionEl = document.querySelector(`.question[data-question="${currentQuestion}"]`);
    if (!isQuestionAnswered(questionEl)) {
      getValidationError(questionEl).classList.remove('hidden');
      return;
    }
    if (currentQuestion < TOTAL_QUESTIONS) {
      goToQuestion(currentQuestion + 1);
    }
  });

  $('#back-btn').addEventListener('click', () => {
    if (currentQuestion > 1) {
      goToQuestion(currentQuestion - 1);
    }
  });

  $('#survey-form').addEventListener('input', (event) => {
    const questionEl = event.target.closest('.question');
    if (questionEl) clearValidationError(questionEl);
  });

  $('#survey-form').addEventListener('submit', (event) => {
    const questionEl = document.querySelector(`.question[data-question="${currentQuestion}"]`);
    if (!isQuestionAnswered(questionEl)) {
      event.preventDefault();
      getValidationError(questionEl).classList.remove('hidden');
      return;
    }
    submitSurvey(event);
  });

  $('#retry-btn').addEventListener('click', () => {
    showScreen('form-screen');
  });

  $('#whatsapp-share-intro').addEventListener('click', shareViaWhatsApp);
  $('#whatsapp-share-thanks').addEventListener('click', shareViaWhatsApp);
}
