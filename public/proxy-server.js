import express from 'express';
import fetch from 'node-fetch';

const app = express();

app.get('/api/hotels', async (req, res) => {
  const { city, checkIn, checkOut } = req.query;
  const token = '067df6a5f1de28c8a898bc83744dfdcd'; // твой API token

  try {
    const lookupUrl = `https://engine.hotellook.com/api/v2/lookup.json?query=${encodeURIComponent(city)}&token=${token}&marker=618281`;
    const lookupRes = await fetch(lookupUrl);
    const lookupData = await lookupRes.json();
    const locationId = lookupData?.results?.locations?.[0]?.id;

    if (!locationId) return res.status(400).json({ error: 'Локация не найдена' });

    const hotelsUrl = `https://engine.hotellook.com/api/v2/cache.json?locationId=${locationId}&checkIn=${checkIn}&checkOut=${checkOut}&limit=100&token=${token}&marker=618281`;
    const hotelsRes = await fetch(hotelsUrl);
    const hotels = await hotelsRes.json();

    res.json(hotels);
  } catch (error) {
    console.error('❌ Прокси-сервер ошибка:', error);
    res.status(500).json({ error: 'Ошибка на сервере' });
  }
});

app.listen(3000, () => {
  console.log('🚀 Прокси-сервер запущен на http://localhost:3000');
});
