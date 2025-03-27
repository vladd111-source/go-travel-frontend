document.addEventListener("DOMContentLoaded", function () {
  let currentLang = "ru";

  const translations = {
    ru: {
      flights: "✈️ Авиабилеты",
      hotels: "🏨 Отели",
      sights: "🌍 Места",
      findFlights: "Найти рейсы",
      roundTrip: "Туда и обратно",
      departure: "Дата вылета",
      return: "Дата возвращения",
      hotelResults: "Результаты:",
      noHotelsFound: "Ничего не найдено по заданным фильтрам."
    },
    en: {
      flights: "✈️ Flights",
      hotels: "🏨 Hotels",
      sights: "🌍 Places",
      findFlights: "Search Flights",
      roundTrip: "Round Trip",
      departure: "Departure Date",
      return: "Return Date",
      hotelResults: "Results:",
      noHotelsFound: "Nothing found for the selected filters."
    }
  };

  const hotDeals = [
    { from: "Киев", to: "Барселона", price: 79, date: "12.04" },
    { from: "Варшава", to: "Рим", price: 55, date: "19.04" },
    { from: "Будапешт", to: "Париж", price: 63, date: "25.04" },
    { from: "Берлин", to: "Милан", price: 49, date: "10.05" },
    { from: "Прага", to: "Амстердам", price: 59, date: "17.05" },
    { from: "Вена", to: "Лондон", price: 68, date: "22.05" },
    { from: "Мюнхен", to: "Мадрид", price: 72, date: "29.05" }
  ];

  const hotDealsContainer = document.getElementById("hotDeals");
  if (hotDealsContainer) {
    hotDealsContainer.innerHTML = hotDeals.map((deal) => `
      <div class="bg-white p-4 rounded-xl shadow">
        ✈️ <strong>${deal.from}</strong> → <strong>${deal.to}</strong><br>
        📅 ${deal.date}<br>
        <span class="text-red-600 font-semibold">$${deal.price}</span><br>
        <button class="btn mt-2 w-full">Забронировать</button>
      </div>`).join("");
  }

  window.showTab = function (id) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  };

  const roundTripCheckbox = document.getElementById("roundTrip");
  if (roundTripCheckbox) {
    roundTripCheckbox.addEventListener("change", function () {
      const wrapper = document.getElementById("returnDateWrapper");
      const input = document.getElementById("returnDate");
      wrapper.classList.toggle("hidden", !this.checked);
      input.required = this.checked;
      if (!this.checked) input.value = "";
    });
  }

  function applyTranslations(lang) {
    const t = translations[lang];
    document.querySelector('[onclick*="flights"]').textContent = t.flights;
    document.querySelector('[onclick*="hotels"]').textContent = t.hotels;
    document.querySelector('[onclick*="sights"]').textContent = t.sights;
    document.querySelector('#search-form button[type="submit"]').textContent = t.findFlights;
    document.querySelector('label[for="departureDate"]').textContent = t.departure;
    document.getElementById("returnDateLabel").textContent = t.return;
    document.getElementById("roundTripText").textContent = t.roundTrip;
  }

  document.getElementById("langSwitcher").addEventListener("change", (e) => {
    currentLang = e.target.value;
    applyTranslations(currentLang);
  });

  applyTranslations(currentLang);

const hotelForm = document.getElementById("hotelForm");
hotelForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = document.getElementById("hotelCity").value.trim();
  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
  const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  const minRating = parseFloat(document.getElementById("minRating").value) || 0;

  const mockHotels = [
    { name: "Hotel Sunrise", city, price: 85, rating: 8.9 },
    { name: "Ocean View", city, price: 120, rating: 9.1 },
    { name: "Budget Stay", city, price: 40, rating: 7.5 },
    { name: "Luxury Palace", city, price: 200, rating: 9.8 },
    { name: "Comfort Inn", city, price: 70, rating: 8.2 },
  ];

  const filtered = mockHotels.filter(h =>
    h.price >= minPrice &&
    h.price <= maxPrice &&
    h.rating >= minRating
  );

  // Отправка отеля в Telegram
  if (window.Telegram && Telegram.WebApp) {
    const topHotel = filtered[0];
    if (topHotel) {
      const hotelMessage = `🏨 ${topHotel.name}\n📍 Город: ${topHotel.city}\n💵 Цена: $${topHotel.price}\n⭐ Рейтинг: ${topHotel.rating}`;
      Telegram.WebApp.sendData(hotelMessage);
    }
  }

  const t = translations[currentLang];
  const resultBlock = document.getElementById("hotelsResult");
  resultBlock.innerHTML = `<h3 class='font-semibold mb-2'>${t.hotelResults}</h3>` + (
    filtered.length ? filtered.map(hotel => `
      <div class="bg-white border p-4 rounded-xl mb-2">
        <strong>${hotel.name}</strong> (${hotel.city})<br>
        Цена: $${hotel.price} / ночь<br>
        Рейтинг: ${hotel.rating}
      </div>`).join("") :
    `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
  );
});

// 🚀 Обработчик рейсов — ОТДЕЛЬНО!
const flightForm = document.getElementById("search-form");
flightForm?.addEventListener("submit", (e) => {
  e.preventDefault();

  const from = flightForm.from.value.trim();
  const to = flightForm.to.value.trim();
  const departureDate = flightForm.departureDate.value;

  const bestFlight = {
    from,
    to,
    price: 99,
    date: departureDate
  };

  // Отправка рейса в Telegram
  if (window.Telegram && Telegram.WebApp) {
    const flightMessage = `✈️ Лучший рейс\n🛫 ${bestFlight.from} → 🛬 ${bestFlight.to}\n📅 ${bestFlight.date}\n💰 $${bestFlight.price}`;
    Telegram.WebApp.sendData(flightMessage);
  }
});
    

    const filtered = mockHotels.filter(h =>
      h.price >= minPrice &&
      h.price <= maxPrice &&
      h.rating >= minRating
    );

   const t = translations[currentLang];
const resultBlock = document.getElementById("hotelsResult");

// ⬇️ Сначала отправляем лучший отель в Telegram
if (window.Telegram && Telegram.WebApp) {
  const topHotel = filtered[0];
  if (topHotel) {
    const hotelMessage = `🏨 ${topHotel.name}\n📍 Город: ${topHotel.city}\n💵 Цена: $${topHotel.price}\n⭐ Рейтинг: ${topHotel.rating}`;
    Telegram.WebApp.sendData(hotelMessage);
  }
}

// ⬇️ Потом отображаем отели на странице
resultBlock.innerHTML = `<h3 class='font-semibold mb-2'>${t.hotelResults}</h3>` + (
  filtered.length
    ? filtered.map(hotel => `
      <div class="bg-white border p-4 rounded-xl mb-2">
        <strong>${hotel.name}</strong> (${hotel.city})<br>
        Цена: $${hotel.price} / ночь<br>
        Рейтинг: ${hotel.rating}
      </div>`).join("")
    : `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
);

  // ⬇️ Активируем вкладку "Отели" и скроллим к фильтрам
  showTab("flights");
 // document.getElementById("hotelForm")?.scrollIntoView({ behavior: "smooth" });
});
