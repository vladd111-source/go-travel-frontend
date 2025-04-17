/**
 * Генерирует корректную ссылку на Aviasales
 * @param {Object} flight - Объект рейса
 */
export function generateAviasalesLink(flight) {
  if (!flight || typeof flight.departure_at !== "string") {
    console.warn("⚠️ Невалидный рейс для ссылки:", flight);
    return "#";
  }

  const [date] = flight.departure_at.split("T");
  const [year, month, day] = date.split("-");
  const formattedDate = `${day}${month}`;
  const fromCode = flight.from || flight.origin;
  const toCode = flight.to || flight.destination;

  if (!fromCode || !toCode) {
    console.warn("⚠️ Невалидные IATA коды:", flight);
    return "#";
  }

  return `https://www.aviasales.ru/search/${fromCode}${formattedDate}${toCode}1?marker=618281`;
}

/**
 * Отрисовывает список рейсов на странице
 */
export function renderFlights(flights, fromCity = "—", toCity = "—") {
  const container = document.getElementById("hotDeals");
  container.innerHTML = "";

  if (!flights || !flights.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
    return;
  }

  const favorites = JSON.parse(localStorage.getItem("favorites_flights") || "[]");

  flights.forEach(flight => {
    const from = flight.from || flight.origin || "—";
    const to = flight.to || flight.destination || "—";
    const date = (flight.date || flight.departure_at || "").split("T")[0] || "—";
    const airline = flight.airline || "Авиакомпания";
    const price = parseFloat(flight.price || flight.value || 0); // ✅ безопасно
    const link = generateAviasalesLink(flight);

    const dealId = `${from}-${to}-${date}-${price}`;
    const isFav = favorites.some(f =>
      f.from === from && f.to === to && f.date === date && f.price === price
    );

    const card = document.createElement("div");
    card.className = "card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300";

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${airline}</h3>
      <div class="text-sm text-gray-600 mb-1">🛫 ${from} → 🛬 ${to}</div>
      <div class="text-sm text-gray-600 mb-1">📅 ${date}</div>
      <div class="text-sm text-gray-600 mb-1">💰 $${price}</div>
      <div class="flex justify-between items-center mt-2">
        <a href="${link}" target="_blank"
   class="btn bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded mt-2 transition w-full text-center">
   Перейти к бронированию
</a>
        <button 
          onclick="toggleFavoriteFlight('${dealId}', this)" 
          class="text-2xl ml-3 text-gray-600 hover:text-blue-600 transition"
          data-flight-id="${dealId}">
          ${isFav ? "💙" : "🤍"}
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  if (typeof animateCards === "function") {
    animateCards("#hotDeals .card");
  }
}

/**
 * Отрисовывает список отелей
 */
export function renderHotels(hotels) {
  const container = document.getElementById("hotelsResult");
  container.innerHTML = "";

  if (!hotels || !hotels.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Отели не найдены</div>`;
    return;
  }

  hotels.forEach(hotel => {
    const card = document.createElement("div");
    card.className = "card bg-white p-4 rounded-xl shadow mb-4";

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${hotel.name}</h3>
      <p class="text-sm text-gray-600 mb-1">📍 ${hotel.city}</p>
      <p class="text-sm text-gray-600 mb-1">⭐ Рейтинг: ${hotel.rating}</p>
      <p class="text-sm text-gray-600 mb-1">💰 Цена: $${hotel.price}</p>
    `;

    container.appendChild(card);
  });
}

/**
 * Отрисовывает список достопримечательностей
 */
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
