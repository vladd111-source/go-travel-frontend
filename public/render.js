// render.js

/**
 * Генерирует ссылку на бронирование в Aviasales
 * @param {Object} flight - Объект рейса с origin, destination и departure_at
 * @returns {string} - URL для перехода к бронированию
 */
function generateAviasalesLink(flight) {
  const datePart = flight.departure_at?.split("T")[0]?.replace(/-/g, "") || "";
  return `https://www.aviasales.com/search/${flight.origin}${datePart}${flight.destination}1`;
}

/**
 * Отрисовывает список рейсов на странице.
 * @param {Array} flights - Массив рейсов от Aviasales API
 */
export function renderFlights(flights) {
  const container = document.getElementById("hotDeals");
  container.innerHTML = "";

  if (!flights || !flights.length) {
    container.innerHTML = `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
    return;
  }

  flights.forEach(flight => {
    const card = document.createElement("div");
    card.className = "card";

    const departureDate = flight.departure_at?.split("T")[0] || "—";
    const link = generateAviasalesLink(flight);

    card.innerHTML = `
      <h3 class="text-lg font-semibold mb-1">${flight.airline || "Авиакомпания"}</h3>
      <div class="text-sm text-gray-600 mb-1">🛫 ${flight.origin} → 🛬 ${flight.destination}</div>
      <div class="text-sm text-gray-600 mb-1">📅 ${departureDate}</div>
      <div class="text-sm text-gray-600 mb-1">💰 $${flight.price}</div>
      <a href="${link}" target="_blank" class="btn btn-blue mt-3">Перейти к бронированию</a>
    `;

    container.appendChild(card);
  });
}
