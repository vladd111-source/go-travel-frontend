// ✅ Переводы (если не определены)
if (!window.translations) {
  window.translations = {
    ru: {
      time: "Время",
      duration: "В пути",
      hotDeal: "Горячее предложение",
      bookNow: "Перейти к бронированию"
    },
    en: {
      time: "Time",
      duration: "Duration",
      hotDeal: "Hot deal",
      bookNow: "Book now"
    }
  };
}

// Текущий язык
export const lang = localStorage.getItem("lang") || "ru";
export const t = window.translations[lang] || window.translations["ru"];

// Кэш IATA-городов
const cityNameCache = {};

export async function getCityName(iata, lang = "ru") {
  const cacheKey = `${iata}_${lang}`;
  if (cityNameCache[cacheKey]) return cityNameCache[cacheKey];

  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${iata}&locale=${lang}&types[]=city`;
    const res = await fetch(url);
    const data = await res.json();

    const match = data.find(item => item.code === iata);
    const name = match?.name || iata;
    cityNameCache[cacheKey] = name;
    return name;
  } catch (err) {
    console.warn("🌐 Ошибка получения названия города:", iata, err);
    return iata;
  }
}

export function generateAviasalesLink(flight) {
  const rawDate = flight.departure_at || flight.date || "";
  if (!rawDate) {
    console.warn("❌ Нет даты у рейса:", flight);
    return "#";
  }

  const dateParts = rawDate.split("T")[0]?.split("-");
  if (!dateParts || dateParts.length !== 3) {
    console.warn("❌ Невалидная дата:", rawDate);
    return "#";
  }

  const [year, month, day] = dateParts;
  const formattedDate = `${day}${month}`;

  let fromCode = (flight.from || flight.origin || "").trim().toUpperCase();
  let toCode = (flight.to || flight.destination || "").trim().toUpperCase();

  if (fromCode.length !== 3 || toCode.length !== 3) {
    console.warn("❌ Невалидные IATA коды:", { fromCode, toCode });
    return "#";
  }

  return `https://www.aviasales.ru/search/${fromCode}${formattedDate}${toCode}1?marker=618281`;
}

export async function renderFlights(
  flights,
  fromCity = "—",
  toCity = "—",
  title = "",
  containerId = "hotDeals",
  clear = true
) {
  const container = document.getElementById(containerId);
  if (clear) container.innerHTML = "";

  if (title) {
    const heading = document.createElement("h3");
    heading.className = "text-lg font-semibold mt-4 mb-2";
    heading.textContent = title;
    container.appendChild(heading);
  }

  if (!flights || !flights.length) {
    container.innerHTML += `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
    return;
  }

  const favorites = JSON.parse(localStorage.getItem("favorites_flights") || "[]");
  const lang = localStorage.getItem("lang") || "ru";

  const topDeals = [...flights]
    .sort((a, b) => (a.price || a.value || 0) - (b.price || b.value || 0))
    .slice(0, 10);

  for (const flight of topDeals) {
    const fromCode = flight.from || flight.origin || "—";
    const toCode = flight.to || flight.destination || "—";

    const from = await getCityName(fromCode, lang);
    const to = await getCityName(toCode, lang);

    const rawDate = flight.date || flight.departure_at || "";
    const date = rawDate.split("T")[0] || "—";
    const departureTime = window.formatTime(flight.departure_at);

    // ✅ Унифицированный duration (из API или вручную)
    let duration = flight.duration || flight.duration_to || flight.duration_minutes;
    if (!duration && flight.return_at && flight.departure_at) {
      const dep = new Date(flight.departure_at);
      const ret = new Date(flight.return_at);
      duration = Math.round((ret - dep) / 60000);
    }

    // 🔧 Расчет времени прибытия вручную
    let arrivalTime = "—";
    if (flight.departure_at && duration) {
      const departure = new Date(flight.departure_at);
      const arrival = new Date(departure.getTime() + duration * 60000);
      arrivalTime = window.formatTime(arrival.toISOString());
    }

    const durationText = window.formatDuration(duration);
    const airline = flight.airline || "Авиакомпания";
    const rawPrice = flight.price || flight.value || 0;
    const price = parseFloat(rawPrice);

    const link = generateAviasalesLink(flight);

    const dealData = { from: fromCode, to: toCode, date, price };
    const dealId = encodeURIComponent(JSON.stringify(dealData));

    const isFav = favorites.some(f =>
      f.from === from && f.to === to && f.date === date && parseFloat(f.price) === price
    );

    const isHot = flight.highlight || price < 60;

    const card = document.createElement("div");
    card.className = `
      card border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300
      ${isHot ? 'bg-yellow-100 border-yellow-300' : 'bg-white'}
    `.trim();
    
const t = window.translations[lang];
    
  card.innerHTML = `
  <div class="flex items-center gap-2 mb-1">
    <h3 class="text-xl font-bold">${airline}</h3>
    ${isHot ? `<span class="text-lg font-bold text-orange-600">🔥 ${t.hotDeal || "Горячее предложение"}</span>` : ""}
  </div>
  <div class="text-sm font-semibold text-gray-700 mb-1">🛫 ${from} → 🛬 ${to}</div>
  <div class="text-sm text-gray-600 mb-1">📅 ${date}</div>
  <div class="text-sm text-gray-600 mb-1">⏰ ${t.time || "Время"}: ${departureTime} — ${arrivalTime}</div>
  <div class="text-sm text-gray-600 mb-1">🕒 ${t.duration || "В пути"}: ${durationText}</div>
  <div class="text-lg font-bold text-gray-800 mb-1">💰 $${price}</div>
  <div class="flex justify-between items-center gap-2 mt-2">
   <button 
 onclick="window.open('${link}', '_blank')"
  class="btn btn-blue text-sm w-full rounded-xl">
  ${t.bookNow || 'Забронировать'}
</button>
    <button 
      onclick="toggleFavoriteFlight('${dealId}', this)" 
      class="text-2xl text-center text-gray-600 hover:text-blue-600 transition"
      data-flight-id="${dealId}">
      ${isFav ? "💙" : "🤍"}
    </button>
  </div>
`;

    container.appendChild(card);

    if (container.id === "favContent-flights") {
      const moreBtn = document.createElement("a");
      moreBtn.textContent = "Подробнее";
      moreBtn.href = link;
      moreBtn.target = "_blank";
      moreBtn.className = "btn bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded transition w-full text-center block mt-2";
      card.appendChild(moreBtn);
    }

    if (typeof animateCards === "function") {
      animateCards(`#${container.id} .card`);
    }
  }
}

export function renderHotels(hotels, checkIn, checkOut) {
  const container = document.getElementById("hotelsResult");
  container.innerHTML = "";

  if (!hotels || !hotels.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Отели не найдены</div>`;
    return;
  }

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  checkIn = checkIn || document.getElementById("checkIn")?.value || today.toISOString().slice(0, 10);
  checkOut = checkOut || document.getElementById("checkOut")?.value || tomorrow.toISOString().slice(0, 10);

  const t = window.translations?.[window._appLang] || {};

  hotels.forEach((hotel) => {
    if (!hotel.id) return;

    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4 opacity-0 scale-95 transform transition-all duration-300 sm:flex sm:items-start sm:gap-4";

    const bookingUrl = generateTripLink(hotel, checkIn, checkOut);
    const encodedHotel = encodeURIComponent(JSON.stringify(hotel));
    const favHotels = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
    const isFav = favHotels.some(f => f.name === hotel.name && f.city === hotel.city);

    const imageUrl = hotel.image || `https://photo.hotellook.com/image_v2/limit/${hotel.id}/800/520.auto`;
    const nights = Math.max(1, Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)));
    const totalPrice = hotel.price * nights;
    const bookingPrice = (totalPrice * (1 + (Math.random() * 0.02 + 0.02))).toFixed(2);

    card.innerHTML = `
      <img src="${imageUrl}" alt="${hotel.name}" class="rounded-lg mb-3 w-full h-48 object-cover sm:w-64 sm:h-auto" />
      <div class="flex-1">
        <h3 class="text-lg font-semibold mb-1">${hotel.name}</h3>
        <p class="text-sm text-gray-600 mb-1">📍 ${hotel.city}</p>
        <p class="text-sm text-gray-600 mb-1">⭐ Рейтинг: ${hotel.rating}</p>
        <p class="text-sm text-gray-600 mb-1">💰 Цена: $${hotel.price} / ночь</p>
        <p class="text-xs text-gray-400 italic mb-1">Итого за ${nights} ноч${nights === 1 ? 'ь' : nights < 5 ? 'и' : 'ей'} — $${totalPrice.toFixed(2)}</p>
        <p class="text-xs text-gray-400 italic mb-2">Цена на Букинге: $${bookingPrice}</p>
        <div class="flex justify-between items-center mt-2">
          <a href="${bookingUrl}" target="_blank" class="btn btn-blue text-sm" onclick="trackHotelClick('${bookingUrl}', '${hotel.name}', '${hotel.city}', '${hotel.price}', '${hotel.partner || hotel.source || 'N/A'}')">
            ${t.bookNow || 'Забронировать'}
          </a>
          <button onclick="toggleFavoriteHotelFromEncoded('${encodedHotel}', this)" class="text-xl ml-2" data-hotel-id="${encodedHotel}">
            ${isFav ? '💙' : '🤍'}
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });

  animateCards("#hotelsResult .card");
}

// Travelpayouts партнёрская ссылка:
export function generateTripLink(hotel, checkIn, checkOut) {
  const base = "https://tp.media/r";
  const marker = "618281";
  const trs = "402148";
  const p = "4115";
  const campaign = "101";

  // ➡️ Проверяем даты в самом начале
  if (!checkIn || !checkOut) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    checkIn = today.toISOString().slice(0, 10);
    checkOut = tomorrow.toISOString().slice(0, 10);
  }

  // Проверка: если нет города — fallback
  const city = encodeURIComponent(hotel.city || "Paris");
  const targetUrl = `https://search.hotellook.com/?location=${city}&checkIn=${checkIn}&checkOut=${checkOut}&currency=usd`;
  const encodedURL = encodeURIComponent(targetUrl);

  return `${base}?marker=${marker}&trs=${trs}&p=${p}&u=${encodedURL}&campaign_id=${campaign}`;
}


//Места
export function renderPlaces(places) {
  const container = document.getElementById("placesResult");
  container.innerHTML = "";

  if (!places || !places.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Ничего не найдено</div>`;
    return;
  }

  places.forEach(place => {
    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4";

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${place.name}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${place.city}</p>
      <p class="text-sm text-gray-600 mb-1">🗂️ Категория: ${place.category}</p>
      <p class="text-sm text-gray-600 mb-1">📝 ${place.description}</p>
    `;

    container.appendChild(card);
  });
}

export function renderFavoriteHotels() {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const checkIn = document.getElementById("checkIn")?.value || today.toISOString().slice(0,10);
  const checkOut = document.getElementById("checkOut")?.value || tomorrow.toISOString().slice(0,10);

  const container = document.getElementById("favContent-hotels");
  container.innerHTML = "";

  const favorites = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
  if (!favorites.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Нет избранных отелей</div>`;
    return;
  }

  favorites.forEach((hotel) => {
    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4 opacity-0 scale-95 transform transition-all duration-300";

    const bookingUrl = generateTripLink(hotel, checkIn, checkOut);
    const encodedHotel = encodeURIComponent(JSON.stringify(hotel));

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${hotel.name}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${hotel.city}</p>
      <p class="text-sm text-gray-600 mb-1">⭐ Рейтинг: ${hotel.rating}</p>
      <p class="text-sm text-gray-600 mb-1">💰 Цена: $${hotel.price}</p>
      <div class="flex justify-between items-center mt-2">
        <a href="${bookingUrl}" target="_blank" class="btn btn-blue text-sm" onclick="trackHotelClick('${bookingUrl}', '${hotel.name}', '${hotel.city}', '${hotel.price}', '${hotel.partner || hotel.source}')">
          ${t.bookNow || 'Забронировать'}
        </a>
        <button onclick="toggleFavoriteHotelFromEncoded('${encodedHotel}', this)" class="text-xl ml-2" data-hotel-id="${encodedHotel}">
          💙
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  animateCards("#favContent-hotels .card");
}


// Сделать функции глобально доступными
window.generateAviasalesLink = generateAviasalesLink;

export function trackHotelClick(url, name, city, price, source) {
  const telegramId = window.initDataUnsafe?.user?.id || 'unknown';

  trackEvent('click_hotel_booking', {
    telegram_id: telegramId,
    hotel_name: name,
    city: city,
    price: price,
    source: source,
    url: url,
    timestamp: new Date().toISOString()
  });
}
window.trackHotelClick = trackHotelClick;

