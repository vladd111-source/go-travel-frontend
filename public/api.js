// 🔎 Поиск города через Skyscanner (временно, если нужно авто-IATA)
export async function fetchLocation(query) {
  const url = `https://skyscanner89.p.rapidapi.com/airports/search?query=${encodeURIComponent(query)}`;
  
  const options = {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': '61654e8ea8msh81fd1f2e412c216p164556jsne7c3bbe401bf',
      'X-RapidAPI-Host': 'skyscanner89.p.rapidapi.com'
    }
  };

  try {
    const res = await fetch(url, options);
    const data = await res.json();
    const firstMatch = data?.[0];

    if (!firstMatch) return null;

    return {
      code: firstMatch.iataCode,
      id: firstMatch.entityId
    };
  } catch (err) {
    console.error('Ошибка поиска города:', err);
    return null;
  }
}

// ✈️ Поиск рейсов с монетизацией через Aviasales
export async function fetchAviasalesFlights({ origin, destination, departureDate, token }) {
  const url = `https://api.travelpayouts.com/aviasales/v3/prices_for_dates?origin=${origin}&destination=${destination}&departure_at=${departureDate}&currency=usd&token=${token}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    if (!data || !data.data) throw new Error('Пустой ответ от API');
    return data.data;
  } catch (err) {
    console.error('Ошибка загрузки Aviasales рейсов:', err);
    return null;
  }
}
