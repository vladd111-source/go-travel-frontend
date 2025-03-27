
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
      noHotelsFound: "Ничего не найдено по заданным фильтрам.",
      hotelFilters: "🔎 Фильтры поиска",
      city: "Город",
      guests: "Гостей",
      checkIn: "Дата заезда",
      checkOut: "Дата выезда",
      priceFrom: "Цена от",
      priceTo: "Цена до",
      ratingMin: "Минимальный рейтинг",
      findHotel: "Найти отель"
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
      noHotelsFound: "Nothing found for the selected filters.",
      hotelFilters: "🔎 Search Filters",
      city: "City",
      guests: "Guests",
      checkIn: "Check-in Date",
      checkOut: "Check-out Date",
      priceFrom: "Price from",
      priceTo: "Price to",
      ratingMin: "Min Rating",
      findHotel: "Find Hotel"
    }
  };

  function trackEvent(name, data = "") {
    const message = `📈 Событие: ${name}` + (data ? `\n➡️ ${data}` : "");
    console.log(message);
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.sendData(message);
    }
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
    document.querySelector("#hotelForm h3").textContent = t.hotelFilters;
    document.getElementById("hotelCity").placeholder = t.city;
    document.querySelector('label[for="checkIn"]').textContent = t.checkIn;
    document.querySelector('label[for="checkOut"]').textContent = t.checkOut;
    document.querySelector('label[for="minPrice"]').textContent = t.priceFrom;
    document.querySelector('label[for="maxPrice"]').textContent = t.priceTo;
    document.querySelector('label[for="minRating"]').textContent = t.ratingMin;
    document.querySelector('label[for="guests"]').textContent = t.guests;
    document.querySelector('#hotelForm button[type="submit"]').textContent = t.findHotel;
  }

  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    const userId = Telegram.WebApp.initDataUnsafe?.user?.id;
    console.log("👤 Telegram ID:", userId);
    window.showTab = function (id) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
      document.getElementById(id).classList.remove('hidden');
      trackEvent("Переключение вкладки", id);
    };
  } else {
    window.showTab = function (id) {
      document.querySelectorAll('.tab').forEach(tab => tab.classList.add('hidden'));
      document.getElementById(id).classList.remove('hidden');
    };
  }

  applyTranslations(currentLang);
  document.getElementById("langSwitcher").addEventListener("change", (e) => {
    currentLang = e.target.value;
    applyTranslations(currentLang);
    trackEvent("Смена языка", currentLang);
  });

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

    if (window.Telegram && Telegram.WebApp && filtered[0]) {
      const h = filtered[0];
      const msg = `🏨 ${h.name}\n📍 Город: ${h.city}\n💵 Цена: $${h.price}\n⭐ Рейтинг: ${h.rating}`;
      Telegram.WebApp.sendData(msg);
    }

    trackEvent("Поиск отеля", `Город: ${city}, Цена: $${minPrice}–${maxPrice}, Рейтинг: от ${minRating}`);

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

    if (window.Telegram && Telegram.WebApp) {
      const msg = `✈️ Лучший рейс\n🛫 ${bestFlight.from} → 🛬 ${bestFlight.to}\n📅 ${bestFlight.date}\n💰 $${bestFlight.price}`;
      Telegram.WebApp.sendData(msg);
    }

    trackEvent("Поиск рейса", `Из: ${from} → В: ${to}, Дата: ${departureDate}`);
  });

  // По умолчанию показываем вкладку с рейсами
  showTab("flights");
});
