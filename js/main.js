document.addEventListener("DOMContentLoaded", function () {
  const hotDeals = [
    { from: "Киев", to: "Барселона", price: 79, date: "12.04" },
    { from: "Варшава", to: "Рим", price: 55, date: "19.04" },
    { from: "Будапешт", to: "Париж", price: 63, date: "25.04" },
    { from: "Берлин", to: "Милан", price: 49, date: "10.05" },
    { from: "Прага", to: "Амстердам", price: 59, date: "17.05" },
    { from: "Вена", to: "Лондон", price: 68, date: "22.05" },
    { from: "Мюнхен", to: "Мадрид", price: 72, date: "29.05" }
  ];

  // Рендерим горячие предложения
  const hotDealsContainer = document.getElementById("hotDeals");
  if (hotDealsContainer) {
    hotDealsContainer.innerHTML = hotDeals.map((deal) => `
      <div class="bg-white p-4 rounded-xl shadow">
        ✈️ <strong>${deal.from}</strong> → <strong>${deal.to}</strong><br>
        📅 ${deal.date}<br>
        <span class="text-red-600 font-semibold">$${deal.price}</span><br>
        <button class="btn mt-2 w-full">Забронировать</button>
      </div>
    `).join("");
  }

  // Переключение вкладок
  window.showTab = function (id) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  };

  // Скрытие / показ "Дата возвращения"
  const roundTripCheckbox = document.getElementById("roundTrip");
  if (roundTripCheckbox) {
    roundTripCheckbox.addEventListener("change", function () {
      const wrapper = document.getElementById("returnDateWrapper");
      const input = document.getElementById("returnDate");
      if (this.checked) {
        wrapper.classList.remove("hidden");
        input.required = true;
      } else {
        wrapper.classList.add("hidden");
        input.required = false;
        input.value = "";
      }
    });
  }

  // Локализация
  const translations = {
    ru: {
      flights: "✈️ Авиабилеты",
      hotels: "🏨 Отели",
      sights: "🌍 Места",
      findFlights: "Найти рейсы",
      roundTrip: "Туда и обратно",
      departure: "Дата вылета",
      return: "Дата возвращения"
    },
    en: {
      flights: "✈️ Flights",
      hotels: "🏨 Hotels",
      sights: "🌍 Places",
      findFlights: "Search Flights",
      roundTrip: "Round Trip",
      departure: "Departure Date",
      return: "Return Date"
    }
  };

  function applyTranslations(lang) {
    const t = translations[lang];
    document.querySelector('[onclick*="flights"]').textContent = t.flights;
    document.querySelector('[onclick*="hotels"]').textContent = t.hotels;
    document.querySelector('[onclick*="sights"]').textContent = t.sights;
    document.querySelector('button[type="submit"]').textContent = t.findFlights;
    document.querySelector('label[for="departureDate"]').textContent = t.departure;
    document.getElementById("returnDateLabel").textContent = t.return;
    document.getElementById("roundTripText").textContent = t.roundTrip;
  }

  const langSwitcher = document.getElementById("langSwitcher");
  langSwitcher.addEventListener("change", (e) => {
    applyTranslations(e.target.value);
  });

  applyTranslations("ru");
});
