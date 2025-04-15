// render.js

/**
 * Генерирует deeplink для бронирования на Aviasales.
 * @param {Object} flight - Объект рейса
 * @returns {string} - Ссылка на Aviasales
 */
export function generateAviasalesLink(flight) {
  if (!flight || typeof flight.departure_at !== "string") {
    console.warn("⚠️ Невалидный рейс для ссылки:", flight);
    return "#";
  }

  const [date] = flight.departure_at.split("T");
  const formattedDate = date.split("-").reverse().join(".");

  return `https://www.aviasales.ru/search/${flight.from}${formattedDate}${flight.to}1`;
}

/**
 * Отрисовывает список рейсов на странице.
 * @param {Array} flights - Массив рейсов от Amadeus API
 */
export function renderFlights(flights) {
  const container = document.getElementById("hotDeals");
  container.innerHTML = "";

  if (!flights || !flights.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
    return;
  }

  flights.forEach(flight => {
    if (!flight?.departure_at) return;

    const card = document.createElement("div");
    card.className = "card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300";

    const departureDate = flight.departure_at.split("T")[0] || "—";
    const link = generateAviasalesLink(flight);

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${flight.airline || "Авиакомпания"}</h3>
      <div class="text-sm text-gray-600 mb-1">🛫 ${flight.from} → 🛬 ${flight.to}</div>
      <div class="text-sm text-gray-600 mb-1">📅 ${departureDate}</div>
      <div class="text-sm text-gray-600 mb-1">💰 $${flight.price}</div>
      <a href="${link}" target="_blank" class="btn btn-blue mt-3">Перейти к бронированию</a>
    `;

    container.appendChild(card);
  });
}

/**
 * Отрисовывает список отелей.
 * @param {Array} hotels - Массив отелей
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
 * Отрисовывает список достопримечательностей.
 * @param {Array} places - Массив мест
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
