// app.js
// Логика приложения TikTok Downloader

(function () {
  'use strict';

  const form = document.getElementById('form');
  const urlInput = document.getElementById('urlInput');
  const submitBtn = document.getElementById('submitBtn');
  const statusEl = document.getElementById('status');
  const errorEl = document.getElementById('error');
  const resultEl = document.getElementById('result');
  const preview = document.getElementById('preview');
  const meta = document.getElementById('meta');
  const dlLink = document.getElementById('dlLink');

  const TIKTOK_URL_PATTERN = /(tiktok\.com|vm\.tiktok\.com|vt\.tiktok\.com)/i;

  function setLoading(isLoading, message) {
    submitBtn.disabled = isLoading;
    submitBtn.textContent = isLoading ? 'Загрузка...' : 'Скачать';
    statusEl.textContent = message || '';
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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);

    try {
      const apiUrl = CONFIG.API_BASE_URL + '?url=' + encodeURIComponent(url) + '&hd=1';
      const res = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          // Некоторые прокси/шлюзы используют ключ для лимитов запросов
          'X-Api-Key': CONFIG.API_KEY
        }
      });

      if (!res.ok) {
        throw new Error('Сервис недоступен (код ' + res.status + '). Попробуй позже.');
      }

      const data = await res.json();

      if (data.code !== 0 || !data.data || !data.data.play) {
        throw new Error('Не удалось обработать ссылку. Проверь, что видео публичное.');
      }

      return data.data;
    } finally {
      clearTimeout(timeout);
    }
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
      const videoData = await fetchVideoData(url);

      const videoUrl = videoData.play; // прямая ссылка без вотермарки
      const title = videoData.title || 'Без названия';
      const author = videoData.author ? videoData.author.nickname : '';

      preview.src = videoUrl;
      meta.innerHTML = '<b>' + escapeHtml(title) + '</b>' + (author ? '<br>Автор: ' + escapeHtml(author) : '');
      dlLink.href = videoUrl;

      resultEl.classList.add('show');
      setLoading(false, 'Готово!');
    } catch (err) {
      const message = err.name === 'AbortError'
        ? 'Сервис не ответил вовремя. Попробуй ещё раз.'
        : (err.message || 'Что-то пошло не так.');
      showError(message);
      setLoading(false, '');
    }
  });

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
})();
