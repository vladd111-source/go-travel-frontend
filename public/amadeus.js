// 🔤 Транслитерация с кириллицы на латиницу
function transliterate(text) {
  const map = {
    А: "A", Б: "B", В: "V", Г: "G", Д: "D", Е: "E", Ё: "E", Ж: "Zh", З: "Z", И: "I", Й: "Y",
    К: "K", Л: "L", М: "M", Н: "N", О: "O", П: "P", Р: "R", С: "S", Т: "T", У: "U", Ф: "F",
    Х: "Kh", Ц: "Ts", Ч: "Ch", Ш: "Sh", Щ: "Shch", Ъ: "", Ы: "Y", Ь: "", Э: "E", Ю: "Yu", Я: "Ya",
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "y",
    к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
    х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya"
  };
  return text.split('').map(char => map[char] || char).join('');
}

// 🧠 Ручной маппинг для нестандартных названий
const manualMap = {
  "Прага": "Prague",
  "Варшава": "Warsaw",
  "Киев": "Kyiv",
  "Мюнхен": "Munich",
  "Копенгаген": "Copenhagen",
  "Неаполь": "Naples"
};

// 🔐 Получение токена доступа от Amadeus
export async function getAmadeusToken() {
  const clientId = "10UMyGcxHVsK1sK8x1U8MCqgR7g1LuDo";
  const clientSecret = "0bXLQrqxEAyFjdkx";

  const response = await fetch("https://test.api.amadeus.com/v1/security/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret
    })
  });

  const data = await response.json();
  return data.access_token;
}

// 🌍 Поиск IATA-кода по названию города (через аэропорты)
export async function fetchCityIATA(cityName) {
  const token = await getAmadeusToken();
  const mapped = manualMap[cityName] || cityName;
  const translit = transliterate(mapped);

  const url = `https://test.api.amadeus.com/v1/reference-data/locations?keyword=${encodeURIComponent(translit)}&subType=AIRPORT`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Accept-Language": "ru"
      }
    });

    const data = await res.json();
    const airport = data?.data?.find(loc => loc.iataCode && loc.subType === "AIRPORT");

    if (!airport) {
      console.warn("⚠️ Город не найден в Amadeus:", cityName);
      return null;
    }

    return {
      code: airport.iataCode.toUpperCase().trim(),
      name: airport.name
    };
  } catch (err) {
    console.error("❌ Ошибка получения IATA:", err);
    return null;
  }
}

// ✈️ Поиск рейсов через Amadeus API
export async function fetchAmadeusFlights(from, to, date) {
  const token = await getAmadeusToken();

  const cleanFrom = from?.toUpperCase().trim();
  const cleanTo = to?.toUpperCase().trim();
  const cleanDate = typeof date === "string" && date.match(/^\d{4}-\d{2}-\d{2}$/) ? date : null;

  if (!cleanFrom || !cleanTo || !cleanDate) {
    console.warn("❌ Недостаточно данных для запроса рейсов", { from, to, date });
    return [];
  }

  const payload = {
    currencyCode: "USD",
    originLocationCode: cleanFrom,
    destinationLocationCode: cleanTo,
    departureDate: cleanDate,
    adults: 1
    // ❌ НЕ добавляем `max`: это недопустимый параметр
  };

  try {
    console.log("📤 Запрос в Amadeus:", JSON.stringify(payload, null, 2));

    const response = await fetch("https://test.api.amadeus.com/v2/shopping/flight-offers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();

    if (!response.ok) {
      console.warn(`⚠️ Ошибка Amadeus API ${response.status}:`, text);
      return [];
    }

    const data = JSON.parse(text);

    if (!data?.data?.length) {
      console.warn("⚠️ Рейсы не найдены в Amadeus:", data);
      return [];
    }

    return data.data.map(offer => ({
      from: cleanFrom,
      to: cleanTo,
      date: cleanDate,
      airline: offer.validatingAirlineCodes?.[0] || "—",
      price: offer.price?.total || "—"
    }));
  } catch (err) {
    console.error("❌ Ошибка запроса к Amadeus:", err);
    return [];
  }
}
