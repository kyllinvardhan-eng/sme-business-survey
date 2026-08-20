const params = new URLSearchParams(window.location.search);

if (params.get('admin') === 'true') {
  document.getElementById('survey-view').classList.add('hidden');
  document.getElementById('admin-view').classList.remove('hidden');
  import('./admin.js').then((mod) => mod.initAdmin());
} else {
  document.getElementById('admin-view').classList.add('hidden');
  document.getElementById('survey-view').classList.remove('hidden');
  import('./survey.js').then((mod) => mod.initSurvey());
}
