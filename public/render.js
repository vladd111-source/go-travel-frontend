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
    const flightClass = document.getElementById("flightClass")?.value || "Y";

  const searchParams = new URLSearchParams({
  marker: "618281",
  travel_class: flightClass
});

return `https://www.aviasales.ru/search/${fromCode}${formattedDate}${toCode}1?${searchParams.toString()}`;
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
  if (!container) return;

  if (clear) container.innerHTML = "";

  if (title) {
    const heading = document.createElement("h3");
    heading.className = "text-lg font-semibold mt-4 mb-2";
    heading.textContent = title;
    container.appendChild(heading);
  }

  if (!Array.isArray(flights) || flights.length === 0) {
    container.innerHTML += `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
    return;
  }

  console.log(`✈️ Всего рейсов получено: ${flights.length}`);

  const sortedFlights = [...flights]
    .filter(f => f.price || f.value) // отфильтровываем "пустые" предложения
    .sort((a, b) => (a.price || a.value || 0) - (b.price || b.value || 0));

  if (sortedFlights.length === 0) {
    container.innerHTML += `<div class="text-center text-gray-500 mt-4">Нет подходящих предложений</div>`;
    return;
  }

  const favorites = JSON.parse(localStorage.getItem("favorites_flights") || "[]");

  for (const [i, flight] of sortedFlights.entries()) {
    const fromCode = flight.from || flight.origin || "—";
    const toCode = flight.to || flight.destination || "—";

    const from = await getCityName(fromCode, lang);
    const to = await getCityName(toCode, lang);

    const rawDate = flight.date || flight.departure_at || "";
    const date = rawDate.split("T")[0] || "—";
    const departureTime = window.formatTime(flight.departure_at);

    let duration = flight.duration || flight.duration_to || flight.duration_minutes;
    if (!duration && flight.return_at && flight.departure_at) {
      const dep = new Date(flight.departure_at);
      const ret = new Date(flight.return_at);
      duration = Math.round((ret - dep) / 60000);
    }

    let arrivalTime = "—";
    if (flight.departure_at && duration) {
      const departure = new Date(flight.departure_at);
      const arrival = new Date(departure.getTime() + duration * 60000);
      arrivalTime = window.formatTime(arrival.toISOString());
    }

    const durationText = window.formatDuration(duration);
    const airline = flight.airline || "Авиакомпания";
    const price = parseFloat(flight.price || flight.value || 0);
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

    card.innerHTML = `
      <div class="flex items-center gap-2 mb-1">
        <h3 class="text-xl font-bold">${airline}</h3>
        ${isHot ? `<span class="text-lg font-bold text-orange-600">🔥 ${t.hotDeal}</span>` : ""}
      </div>
      <div class="text-sm font-semibold text-gray-700 mb-1">🛫 ${from} → 🛬 ${to}</div>
      <div class="text-sm text-gray-600 mb-1">📅 ${date}</div>
      <div class="text-sm text-gray-600 mb-1">⏰ ${t.time}: ${departureTime} — ${arrivalTime}</div>
      <div class="text-sm text-gray-600 mb-1">🕒 ${t.duration}: ${durationText}</div>
      <div class="text-lg font-bold text-gray-800 mb-1">💰 $${price}</div>
      <div class="flex justify-between items-center gap-2 mt-2">
        <a href="${link}" target="_blank"
          class="btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded transition text-center">
          ${t.bookNow}
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

    // ✅ Отдельная кнопка для избранного блока
    if (container.id === "favContent-flights") {
      const moreBtn = document.createElement("a");
      moreBtn.textContent = "Подробнее";
      moreBtn.href = link;
      moreBtn.target = "_blank";
      moreBtn.className = "btn bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded transition w-full text-center block mt-2";
      card.appendChild(moreBtn);
    }
  }

  if (typeof animateCards === "function") {
    animateCards(`#${containerId} .card`);
  }
}
//}

//Отели
export function renderHotels(hotels) {
  const container = document.getElementById("hotelsResult");
  if (!container) {
    console.error("❌ Элемент #hotelsResult не найден в DOM");
    return;
  }

  console.log("➡️ Вызов renderHotels, перед фильтрацией:", hotels);

  container.innerHTML = "";

  const propertyTypeFilter = document.getElementById("propertyTypeFilter");
  const priceRange = document.getElementById("priceRange");

  let maxPrice = 500;
  if (priceRange) {
    const parsed = parseFloat(priceRange.value);
    if (!isNaN(parsed)) maxPrice = parsed;
  }

  const checkIn = document.getElementById("checkIn")?.value;
  const checkOut = document.getElementById("checkOut")?.value;

  let nights = 1;
  if (checkIn && checkOut) {
    const dateIn = new Date(checkIn);
    const dateOut = new Date(checkOut);
    nights = Math.max(1, (dateOut - dateIn) / (1000 * 60 * 60 * 24));
  }

  hotels.forEach(hotel => {
    const fallbackPrice = hotel.priceFrom || hotel.fullPrice || 0;
    hotel.fullPrice = fallbackPrice;
    hotel.pricePerNight = nights > 0 ? fallbackPrice / nights : fallbackPrice;
    hotel.price = Math.floor(hotel.pricePerNight);
  });

  
 hotels = hotels.filter(hotel => {
  const selectedType = propertyTypeFilter?.value || "all";
  const rawType = (hotel.property_type || "hotel").toLowerCase();

  const skipRoomsCheck = true; // 👉 для отладки можно включить true

const hasAvailableRooms = skipRoomsCheck || (
  Array.isArray(hotel.rooms) &&
  hotel.rooms.length > 0 &&
  hotel.rooms.some(room =>
    room.options?.available > 0 &&
    typeof room.price === "number" &&
    room.price > 0
  )
);
   
  const matchesType =
    selectedType === "all" ||
    (selectedType === "hotel" && rawType.includes("hotel")) ||
    (selectedType === "apartment" && rawType.includes("apartment"));

  const matchesPrice =
    !isNaN(hotel.pricePerNight) &&
    hotel.pricePerNight > 0 &&
    hotel.pricePerNight <= maxPrice;

  return hasAvailableRooms && matchesType && matchesPrice;
});
  

  console.log("🧪 Отели после фильтрации:", hotels.length, hotels);

  if (!Array.isArray(hotels) || hotels.length === 0) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Отели не найдены</div>`;
    return;
  }

  hotels.sort((a, b) => a.pricePerNight - b.pricePerNight);

  hotels.forEach(hotel => {
    const hotelId = hotel.hotelId || hotel.id;
    const hotelName = hotel.name || "Без названия";
    const hotelCity = hotel.city || "Город неизвестен";
    const hotelPrice = `$${Math.floor(hotel.pricePerNight)}`;
    const totalPrice = `$${Math.floor(hotel.fullPrice || 0)}`;

    let imageUrl = hotel.image && typeof hotel.image === "string"
      ? hotel.image
      : "https://placehold.co/800x520?text=No+Image";

    console.log("🏨 HOTEL", hotelName, imageUrl);

    const baseUrl = hotelId
      ? `https://search.hotellook.com/?hotelId=${hotelId}`
      : `https://search.hotellook.com/?location=${encodeURIComponent(hotelCity)}&name=${encodeURIComponent(hotelName)}`;

    const dateParams =
      checkIn && checkOut
        ? `&checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}`
        : "";

    const bookingUrl = `https://tp.media/r?marker=618281&trs=402148&p=4115&u=${encodeURIComponent(baseUrl + dateParams)}&campaign_id=101`;

    hotel.link = bookingUrl;

    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4 opacity-0 scale-95 transition-all duration-300";

    const isFav = checkFavoriteHotel(hotel);

    card.innerHTML = `
      <img src="${imageUrl}" alt="${hotelName}"
          class="rounded-lg mb-3 w-full h-48 object-cover bg-gray-200"
          loading="lazy"
          referrerpolicy="no-referrer"
          crossorigin="anonymous"
          onerror="this.onerror=null;this.src='https://placehold.co/800x520?text=No+Image';" />

      <h3 class="text-lg font-semibold mb-1">${hotelName}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${hotelCity}</p>
      <p class="text-sm text-gray-600 mb-1">💰 Цена за ночь: ${hotelPrice}</p>
      <p class="text-sm text-gray-600 mb-1">💵 Всего за период: ${totalPrice}</p>

      <div class="flex justify-between items-center mt-2">
        <a href="${bookingUrl}" target="_blank"
          class="btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded block text-center">
          🔗 Забронировать
        </a>
        <button 
          onclick="toggleFavoriteHotelFromEncoded('${encodeURIComponent(JSON.stringify(hotel))}', this)" 
          class="text-xl ml-2"
          data-hotel-id="${encodeURIComponent(JSON.stringify(hotel))}">
          ${isFav ? "💙" : "🤍"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  container.classList.add("visible");
  animateCards("#hotelsResult .card");

  const bookingAll = document.createElement("div");
  bookingAll.className = "text-center mt-6";

  const bookingCity = document.getElementById("hotelCity")?.value || hotelCity;
  const guestsCount = document.getElementById("guests")?.value || 1;

  const bookingAllUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(bookingCity)}&checkin=${checkIn}&checkout=${checkOut}&group_adults=${guestsCount}&group_children=0&no_rooms=1`;

  bookingAll.innerHTML = `
   <div class="pb-20 sm:pb-10">
    <a href="${bookingAllUrl}" target="_blank" rel="noopener"
      class="block w-full sm:w-auto mx-auto mt-6 text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-full shadow-lg transition duration-300">
      🔍 Смотреть на Booking.com
    </a>
  </div>
  `;

  container.appendChild(bookingAll);
}


//Места
export function renderPlaces(places = []) {
  const container = document.getElementById("placesResult");
  container.innerHTML = "";

  if (!places.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Ничего не найдено</div>`;
    return;
  }

  const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");

  places.forEach(place => {
    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4 opacity-0 scale-95 transition-all duration-300";

    const name = place.name || "Без названия";
    const description = place.description || "Описание отсутствует.";
    const address = place.address || "Адрес не указан";
    const city = place.city || "";
    const mood = place.mood || "";

    const isFav = favPlaces.some(fav => fav.name === name && fav.city === city);

    // 🧼 Картинка (проверка и fallback на Unsplash)
    let imageUrl = (place.image || "").trim();
    if (
      !/^https?:\/\/.*\.(jpe?g|png|webp)$/i.test(imageUrl) ||
      imageUrl.includes("example.com") ||
      imageUrl.includes("bit.ly") ||
      imageUrl.includes("wikipedia") ||
      imageUrl.includes("wikimedia") ||
      imageUrl.includes("pixabay")
    ) {
      const query = `${name} ${city}`.replace(/[^\w\s]/gi, '').replace(/[а-яА-ЯёЁ]/g, '').replace(/\s+/g, ',');
      imageUrl = `https://source.unsplash.com/600x400/?${query || "travel"}`;
    }

    const mapLink = place.address
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.address)}`
      : "#";

    card.innerHTML = `
      <img 
        src="${imageUrl}" 
        alt="${name}" 
        class="w-full h-40 object-cover rounded-md mb-3 bg-gray-100"
        referrerpolicy="no-referrer"
        loading="lazy"
        onerror="this.onerror=null;this.src='https://placehold.co/300x180?text=No+Image';"
      />
      <h3 class="text-lg font-semibold mb-1">${name}</h3>
      <p class="text-sm text-gray-600 mb-1">${description}</p>
      <a href="${mapLink}" target="_blank" class="text-sm text-blue-600 underline">${address}</a>
      <div class="flex justify-between items-center mt-2">
        <a href="${mapLink}" target="_blank" class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">
          📍 Подробнее
        </a>
        <button 
          onclick="toggleFavoritePlaceFromEncoded('${encodeURIComponent(JSON.stringify({ ...place, city, mood }))}', this)" 
          class="text-xl ml-2"
        >
          ${isFav ? "💙" : "🤍"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  animateCards("#placesResult .card");
}

function checkFavoriteHotel(hotel) {
  const favs = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
  return favs.some(h => h.name === hotel.name && h.city === hotel.city);
}

window.toggleFavoriteHotelFromEncoded = function(encoded, btn) {
  try {
    const hotel = JSON.parse(decodeURIComponent(encoded));
    window.toggleFavoriteItem("hotels", hotel, btn);
  } catch (e) {
    console.error("❌ Ошибка при декодировании отеля:", e);
  }
};

// Сделать функции глобально доступными
window.generateAviasalesLink = generateAviasalesLink;
