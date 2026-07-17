// server.js
// Простой backend-прокси для TikTok Downloader.
// Прячет API_KEY от клиента и обходит CORS-ограничения браузера.

const express = require('express');
const path = require('path');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

// Убирает лишние query-параметры (is_from_webapp, sender_device и т.д.),
// которые иногда мешают сторонним API распознать ссылку.
function cleanTikTokUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return u.origin + u.pathname;
  } catch {
    return rawUrl;
  }
}

app.get('/api/download', async (req, res) => {
  const videoUrl = req.query.url;

  if (!videoUrl || !/tiktok\.com/i.test(videoUrl)) {
    return res.status(400).json({ error: 'Некорректная ссылка TikTok.' });
  }

  const cleanUrl = cleanTikTokUrl(videoUrl);

  try {
    const apiUrl = config.API_BASE_URL + '?url=' + encodeURIComponent(cleanUrl) + '&hd=1';

    const response = await fetch(apiUrl, {
      headers: { 'X-Api-Key': config.API_KEY }
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Сервис-источник вернул ошибку (' + response.status + ').' });
    }

    const data = await response.json();

    if (data.code !== 0 || !data.data || !data.data.play) {
      return res.status(422).json({ error: 'Не удалось получить видео. Проверь, что оно публичное.' });
    }

    res.json({
      videoUrl: data.data.play,
      title: data.data.title || 'Без названия',
      author: data.data.author ? data.data.author.nickname : ''
    });
  } catch (err) {
    console.error('Ошибка запроса к API:', err.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
});

app.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
});
