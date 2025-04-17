import { fetchAviasalesFlights, fetchLocation } from './api.js';
import { renderFlights } from './render.js';

let fromInput, toInput, departureInput;

document.addEventListener("DOMContentLoaded", () => {
  fromInput = document.getElementById("from");
  toInput = document.getElementById("to");
  departureInput = document.getElementById("departureDate");

  const form = document.getElementById("search-form");

  if (!form || !fromInput || !toInput || !departureInput) {
    console.error("❌ Один из элементов формы не найден!");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fromCity = fromInput.value.trim();
    const toCity = toInput.value.trim();
    const date = departureInput.value.trim();

    if (!fromCity || !toCity || !date) {
      alert("Пожалуйста, заполните все поля.");
      return;
    }

    showLoading();

    try {
      const from = await fetchLocation(fromCity);
      const to = await fetchLocation(toCity);

      if (!from || !to) {
        alert("❌ Не удалось определить города");
        hideLoading();
        return;
      }

      const flights = await fetchAviasalesFlights(from.code, to.code, date);

      const container = document.getElementById("hotDeals");
      container.innerHTML = "";

      if (!flights.length) {
        container.innerHTML = `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
        Telegram.WebApp?.sendData?.("😢 Рейсы не найдены.");
      } else {
        renderFlights(flights, fromCity, toCity);
        Telegram.WebApp?.sendData?.(`✈️ Найдено ${flights.length} рейсов: ${fromCity} → ${toCity}`);
      }

      trackEvent("Поиск рейсов", {
        from: from.code,
        to: to.code,
        departureDate: date,
        count: flights.length
      });

    } catch (err) {
      console.error("❌ Ошибка при загрузке рейсов:", err);
      Telegram.WebApp?.sendData?.("❌ Ошибка загрузки рейсов.");
    } finally {
      hideLoading();
    }
  });
});
