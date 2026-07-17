// app.js
// Клиентская логика TikTok Downloader.
// Все запросы идут через собственный backend (/api/download),
// который прячет API-ключ и обходит CORS.

(function () {
  'use strict';

  const form = document.getElementById('form');
  const urlInput = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const statusEl = document.getElementById('status');
  const statusTextEl = document.getElementById('statusText');
  const spinnerEl = document.getElementById('spinner');
  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');
  const preview = document.getElementById('preview');
  const meta = document.getElementById('meta');
  const dlLink = document.getElementById('dlLink');

  const TIKTOK_URL_PATTERN = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i;

  function setLoading(isLoading, message) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Загрузка...' : 'Скачать';
    statusTextEl.textContent = message || '';
    spinnerEl.classList.toggle('show', isLoading);
  }

  function showError(message) {
    errorEl.textContent = message;
    errorEl.classList.add('show');
  }

  function clearError() {
    errorEl.classList.remove('show');
    errorEl.textContent = '';
  }

  function validateUrl(url) {
    if (!url) return 'Вставь ссылку на видео.';
    if (!TIKTOK_URL_PATTERN.test(url)) return 'Это не похоже на ссылку TikTok.';
    return null;
  }

  async function fetchVideoData(url) {
    const res = await fetch('/api/download?url=' + encodeURIComponent(url));
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Не удалось получить видео.');
    }

    return data;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearError();
    resultEl.classList.remove('show');

    const url = urlInput.value.trim();
    const validationError = validateUrl(url);
    if (validationError) {
      showError(validationError);
      return;
    }

    setLoading(true, 'Получаю ссылку на видео...');

    try {
      const data = await fetchVideoData(url);

      preview.src = data.videoUrl;
      meta.innerHTML = '<b>' + escapeHtml(data.title) + '</b>' +
        (data.author ? '<br>Автор: ' + escapeHtml(data.author) : '');
      dlLink.href = data.videoUrl;

      resultEl.classList.add('show');
      setLoading(false, 'Готово!');
    } catch (err) {
      showError(err.message || 'Что-то пошло не так.');
      setLoading(false, '');
    }
  });
})();
