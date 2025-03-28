// ✅ Supabase через CDN (без import/export)
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA'; // твой ключ
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener("DOMContentLoaded", function () {
  let currentLang = localStorage.getItem("lang") || "ru";

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
      findHotel: "Найти отель",
      bookNow: "Забронировать"
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
      findHotel: "Find Hotel",
      bookNow: "Book Now"
    }
  };

  function showLoading() {
    document.getElementById("loadingSpinner")?.classList.remove("hidden");
  }

  function hideLoading() {
    document.getElementById("loadingSpinner")?.classList.add("hidden");
  }

 function logEventToAnalytics(eventName, eventData = {}) {
  const userId = Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (!userId) {
    console.warn("Нет Telegram ID — аналитика не записана");
    return;
  }

  const payload = {
    telegram_id: userId.toString(),
    event: eventName,
    data: eventData,
    created_at: new Date().toISOString(),
  };

  supabase.from('analytics').insert([payload])
    .then(({ error }) => {
      if (error) {
        console.error("❌ Ошибка записи в аналитику:", error.message);
      } else {
        console.log("📊 Событие аналитики записано:", eventName);
      }
    });
}

function trackEvent(name, data = "") {
  const message = `📈 Событие: ${name}` + (data ? `\n➡️ ${data}` : "");
  console.log(message);
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.sendData(message);
  }

  logEventToAnalytics(name, { info: data });
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
  }

  window.showTab = function (id) {
    document.querySelectorAll('.tab').forEach(tab => {
      tab.classList.remove('active');
      tab.classList.add('hidden');
    });

    const selectedTab = document.getElementById(id);
    if (selectedTab) {
      selectedTab.classList.remove('hidden');
      selectedTab.classList.add('active');
    }

    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('bg-blue-100'));
    const activeBtn = document.querySelector(`.tab-btn[onclick*="${id}"]`);
    activeBtn?.classList.add('bg-blue-100');

    localStorage.setItem("activeTab", id);
    trackEvent("Переключение вкладки", id);
  };

  document.getElementById("langSwitcher").value = currentLang;
  document.getElementById("langSwitcher").addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem("lang", currentLang);
    applyTranslations(currentLang);
    trackEvent("Смена языка", currentLang);
  });

  // ✈️ Загрузка рейсов из Supabase
  const hotDealsContainer = document.getElementById("hotDeals");
  if (hotDealsContainer && typeof supabase !== 'undefined') {
    supabase.from("go_travel").select("*")
      .then(({ data, error }) => {
        if (error) throw error;

        const t = translations[currentLang];
        hotDealsContainer.innerHTML = data.map((deal) => `
          <div class="bg-white p-4 rounded-xl shadow">
            ✈️ <strong>${deal.from}</strong> → <strong>${deal.to}</strong><br>
            📅 ${deal.date}<br>
            <span class="text-red-600 font-semibold">$${deal.price}</span><br>
            <button class="btn mt-2 w-full" onclick="bookFlight('${deal.from}', '${deal.to}', '${deal.date}', ${deal.price})">${t.bookNow}</button>
          </div>
        `).join("");
      })
      .catch(err => {
        console.error("Ошибка Supabase:", err.message);
        hotDealsContainer.innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки рейсов.</p>";
      });
  }

  window.bookFlight = function (from, to, date, price) {
    const message = `✈️ *Рейс из ${from} в ${to}*\n📅 ${date}\n💵 $${price}`;
    trackEvent("Клик по брони (рейс)", `${from} → ${to}, $${price}`);
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.sendData(message);
    }
  };

  window.bookHotel = function (name, city, price, rating) {
    const message = `🏨 *${name}*\n📍 ${city}\n💵 $${price}\n⭐ ${rating}`;
    trackEvent("Клик по брони (отель)", `${name} в ${city}, $${price}`);
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.sendData(message);
    }
  };

  const hotelForm = document.getElementById("hotelForm");
  hotelForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    showLoading();

    const city = document.getElementById("hotelCity").value.trim();
    const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
    const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
    const minRating = parseFloat(document.getElementById("minRating").value) || 0;

    fetch("http://localhost:3000/api/hotels")
      .then(res => res.json())
      .then(hotels => {
        const filtered = hotels.filter(h =>
          h.price >= minPrice &&
          h.price <= maxPrice &&
          h.rating >= minRating &&
          (!city || h.city.toLowerCase().includes(city.toLowerCase()))
        );

        const t = translations[currentLang];
        const resultBlock = document.getElementById("hotelsResult");
        resultBlock.classList.remove("visible");

        resultBlock.innerHTML = `<h3 class='font-semibold mb-2'>${t.hotelResults}</h3>` + (
          filtered.length ? filtered.map(hotel => `
            <div class="card bg-white border p-4 rounded-xl mb-2">
              <strong>${hotel.name}</strong> (${hotel.city})<br>
              Цена: $${hotel.price} / ночь<br>
              Рейтинг: ${hotel.rating}<br>
              <button class="btn mt-2 w-full" onclick="bookHotel('${hotel.name}', '${hotel.city}', ${hotel.price}, ${hotel.rating})">${t.bookNow}</button>
            </div>`).join("") :
          `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );

        setTimeout(() => resultBlock.classList.add("visible"), 50);
        trackEvent("Поиск отеля", `Город: ${city}, Цена: $${minPrice}–${maxPrice}, Рейтинг: от ${minRating}`);
        hideLoading();
      })
      .catch(err => {
        console.error("Ошибка загрузки отелей:", err);
        document.getElementById("hotelsResult").innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки отелей.</p>";
        hideLoading();
      });
  });

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

  const flightForm = document.getElementById("search-form");
  flightForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const from = flightForm.from.value.trim();
    const to = flightForm.to.value.trim();
    const departureDate = flightForm.departureDate.value;

    const msg = `✈️ Лучший рейс\n🛫 ${from} → 🛬 ${to}\n📅 ${departureDate}\n💰 $99`;
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.sendData(msg);
    }

    trackEvent("Поиск рейса", `Из: ${from} → В: ${to}, Дата: ${departureDate}`);
  });

  const savedTab = localStorage.getItem("activeTab") || "flights";
  showTab(savedTab);
});
