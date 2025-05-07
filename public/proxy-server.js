import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/hotels', async (req, res) => {
  const { city, checkIn, checkOut } = req.query;
  const token = '067df6a5f1de28c8a898bc83744dfdcd';
  const marker = 618281;

  try {
    // Шаг 1: старт поиска
    const startRes = await fetch('https://engine.hotellook.com/api/v2/search/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: city,
        checkIn,
        checkOut,
        adultsCount: 2,
        language: 'ru',
        currency: 'usd',
        marker,
        token
      })
    });

    const startData = await startRes.json();
    const searchId = startData.searchId;
    if (!searchId) throw new Error('Не удалось получить searchId');

    // Шаг 2: получение результатов
    const resultsUrl = `https://engine.hotellook.com/api/v2/search/results.json?searchId=${searchId}`;
    const resultsRes = await fetch(resultsUrl);
    const resultsData = await resultsRes.json();

    const hotels = (resultsData.results || []).filter(h => h.available);
    res.json(hotels);
  } catch (err) {
    console.error('❌ Прокси-сервер ошибка:', err);
    res.status(500).json({ error: 'Ошибка получения отелей' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Прокси работает на http://localhost:${PORT}`);
});
