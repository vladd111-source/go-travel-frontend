// ✅ Получение билетов через Aviasales API
export async function fetchAviasalesFlights(from, to, date) {
  const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${from}&destination=${to}&departure_at=${date}&currency=usd&token=067df6a5f1de28c8a898bc83744dfdcd`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.data || [];
  } catch (err) {
    console.error("Ошибка загрузки рейсов от Aviasales:", err);
    return [];
  }
}

export async function fetchLocation(query) {
  const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(query)}&locale=en&types[]=city`;

  try {
    console.log("🔍 Запрос города:", query);
    const res = await fetch(url);
    const data = await res.json();

    console.log("📦 Ответ от API:", data); // лог полного ответа

    const match = data.find(item =>
      item.name.toLowerCase().includes(query.toLowerCase()) &&
      item.iata
    );

    if (!match) {
      console.warn("❌ Город не найден:", query);
      return null;
    }

    console.log("✅ Найден город:", match.name, "—", match.iata);
    return {
      code: match.iata
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
