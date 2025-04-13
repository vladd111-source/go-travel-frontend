// 🔐 Получение токена доступа от Amadeus
export async function getAmadeusToken() {
  const clientId = "10UMyGcxHVsK1sK8x1U8MCqgR7g1LuDo"; // 👉 замени на свой при необходимости
  const clientSecret = "0bXLQrqxEAyFjdkx"; // 👉 замени на свой при необходимости

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const data = await response.json();
  return data.access_token;
}

// 🌍 Поиск IATA-кода по названию города (на любом языке)
export async function fetchCityIATA(cityName) {
  const token = await getAmadeusToken();
  const response = await fetch(
    `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(cityName)}&subType=CITY`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  const data = await response.json();
  const first = data?.data?.[0];

  if (!first) {
    console.warn("⚠️ Город не найден в Amadeus:", cityName);
    return null;
  }

  return {
    code: first.iataCode,
    name: first.name
  };
}

// ✈️ Поиск рейсов через Amadeus API
export async function fetchAmadeusFlights(from, to, date) {
  const token = await getAmadeusToken();

  const response = await fetch("https://test.api.amadeus.com/v2/shopping/flight-offers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      currencyCode: "USD",
      originLocationCode: from,
      destinationLocationCode: to,
      departureDate: date,
      adults: 1,
      max: 5
    })
  });

  const data = await response.json();

  if (!data?.data?.length) {
    console.warn("⚠️ Рейсы не найдены в Amadeus");
    return [];
  }

  return data.data.map(offer => ({
    from,
    to,
    date,
    airline: offer.validatingAirlineCodes?.[0] || "—",
    price: offer.price?.total || "—"
  }));
}
