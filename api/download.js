// api/download.js
// Vercel serverless-функция. Доступна по адресу /api/download
// Прячет API_KEY от клиента и обходит CORS-ограничения браузера.

const config = require('../config');

function cleanTikTokUrl(rawUrl) {
  try {
    const u = new URL(rawUrl);
    return u.origin + u.pathname;
  } catch {
    return rawUrl;
  }
}

module.exports = async function handler(req, res) {
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

    res.status(200).json({
      videoUrl: data.data.play,
      title: data.data.title || 'Без названия',
      author: data.data.author ? data.data.author.nickname : ''
    });
  } catch (err) {
    console.error('Ошибка запроса к API:', err.message);
    res.status(500).json({ error: 'Внутренняя ошибка сервера.' });
  }
};
