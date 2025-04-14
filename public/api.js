// ✅ Получение билетов через собственный backend (обход CORS)
export async function fetchAviasalesFlights(from, to, date) {
  const url = `https://go-travel-backend.vercel.app/api/flights?from=${from}&to=${to}&date=${date}`;

  try {
    const res = await fetch(url);
    const data = await res.json();

    console.log("📦 Ответ от backend:", data);

    // ✅ Обработка разных форматов: массив или объект
    if (Array.isArray(data)) {
      return data;
    } else if (data && typeof data === "object") {
      return Object.values(data);
    } else {
      console.warn("⚠️ Неподдерживаемый формат ответа:", data);
      return [];
    }
  } catch (err) {
    console.error("❌ Ошибка загрузки рейсов с backend:", err.message || err);
    return [];
  }
}

// ✅ Устойчивый поиск города по названию через Aviasales (TravelPayouts) API с поддержкой русского языка
export async function fetchLocation(query) {
  const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(query)}&locale=ru&types[]=city`;

  const normalize = (s) => (s || "").trim().toLowerCase();
  const normQuery = normalize(query);

  try {
    console.log("🔍 Запрос города:", query);
    const res = await fetch(url);
    const data = await res.json();

    console.log("📦 Ответ от API:", data);

    // 1. Ищем точное совпадение по name/code
    let match = data.find(item =>
      (normalize(item.name) === normQuery || normalize(item.code) === normQuery) &&
      item.code
    );

    // 2. Если не найдено — ищем по вхождению в name, city_name, code
    if (!match) {
      match = data.find(item =>
        (normalize(item.name).includes(normQuery) ||
         normalize(item.city_name)?.includes(normQuery) ||
         normalize(item.code) === normQuery) &&
        item.code
      );
    }

    if (!match) {
      console.warn("❌ Город не найден:", query);
      return null;
    }

    console.log(`✅ Найден город: ${match.name || match.city_name} (${match.code})`);
    return {
      code: match.code
    };
  } catch (err) {
    console.error('❌ Ошибка поиска города:', err);
    return null;
  }
}

// ✅ Альтернатива — прямой поиск рейсов через Skyscanner
export async function fetchFlights(fromCode, fromId, toCode, toId) {
  const url = `https://skyscanner89.p.rapidapi.com/flights/one-way/list?origin=${fromCode}&originId=${fromId}&destination=${toCode}&destinationId=${toId}`;

  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    return await res.json();
  } catch (err) {
    console.error('Ошибка загрузки рейсов:', err);
    return null;
  }
}
