// ✅ Переводы (перенесено из app.js сюда)
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
const lang = localStorage.getItem("lang") || "ru";
const t = window.translations[lang] || window.translations["ru"];

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
    <a href="${link}" target="_blank"
       class="btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition text-center">
       ${t.bookNow || "Перейти к бронированию"}
    </a>
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

export function renderHotels(hotels) {
  const container = document.getElementById("hotelsResult");
  container.innerHTML = "";

  if (!hotels || !hotels.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Отели не найдены</div>`;
    return;
  }

  const propertyTypeFilter = document.getElementById("propertyTypeFilter");
  if (propertyTypeFilter) {
    const propertyType = propertyTypeFilter.value;
    if (propertyType) {
      hotels = hotels.filter(hotel => {
        const type = (hotel.property_type || "").toLowerCase();
        if (propertyType === "hotel") return type.includes("hotel");
        if (propertyType === "apartment") return type.includes("apartment");
        return true;
      });
    }
  }

  hotels.forEach(hotel => {
    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4";

    const hotelId = hotel.hotelId || hotel.id;
    const imageUrl = hotel.image 
      ? hotel.image 
      : (hotelId ? `https://photo.hotellook.com/image_v2/limit/${hotelId}/800/520.auto` : `https://via.placeholder.com/800x520?text=No+Image`);

    const bookingUrl = `https://tp.media/r?marker=618281&trs=402148&p=4115&u=${encodeURIComponent('https://search.hotellook.com/?location=' + encodeURIComponent(hotel.city) + '&name=' + encodeURIComponent(hotel.name))}&campaign_id=101`;

    card.innerHTML = `
      <img src="${imageUrl}" alt="${hotel.name}" class="rounded-lg mb-3 w-full h-48 object-cover" />
      <h3 class="text-lg font-semibold mb-1">${hotel.name}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${hotel.city || 'Город неизвестен'}</p>
      <p class="text-sm text-gray-600 mb-1">💰 Цена: $${hotel.price || 'Нет данных'}</p>
      <a href="${bookingUrl}" target="_blank" 
         class="btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded block text-center mt-2">
         🔗 Забронировать
      </a>
    `;

    container.appendChild(card);
  });

  // ✨ После создания всех карточек анимируем
  animateCards("#hotelsResult .card");
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
// Сделать функции глобально доступными
window.generateAviasalesLink = generateAviasalesLink;
