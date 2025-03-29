// ✅ Supabase через CDN
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA'; // 🔁 Твой ключ
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Генерация session_id
const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
localStorage.setItem("session_id", sessionId);

// ✅ Глобальные переменные
window._telegramId = null;
window._appLang = localStorage.getItem("lang") || "ru";

// ✅ Глобально доступная функция showTab
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

// ✅ Переводы
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

// ✅ Логирование аналитики
function logEventToAnalytics(eventName, eventData = {}) {
  const userId = window._telegramId;
  if (!userId) {
    console.warn("⚠️ Нет Telegram ID — аналитика не записана");
    return;
  }

  const payload = {
    telegram_id: userId.toString(),
    event: eventName,
    event_data: eventData,
    session_id: sessionId,
    created_at: new Date().toISOString(),
  };

  supabase.from('analytics').insert([payload])
    .then(({ error }) => {
      if (error) {
        console.error("❌ Supabase insert error:", error.message);
      } else {
        console.log("✅ Событие записано:", eventName);
      }
    });
}

// ✅ Трекер событий
function trackEvent(name, data = "") {
  const message = `📈 Событие: ${name}` + (data ? `
➡️ ${typeof data === "string" ? data : JSON.stringify(data)}` : "");
  console.log(message);
  Telegram.WebApp.sendData?.(message);
  logEventToAnalytics(name, {
    info: data,
    lang: window._appLang,
    activeTab: localStorage.getItem("activeTab") || "flights",
    timestamp: new Date().toISOString(),
  });
}

document.addEventListener("DOMContentLoaded", () => {
  if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.ready();
    console.log("📦 initDataUnsafe:", Telegram.WebApp.initDataUnsafe);

    const user = Telegram.WebApp.initDataUnsafe?.user;
    if (user && user.id) {
      window._telegramId = user.id.toString();
      console.log("✅ Telegram ID установлен:", window._telegramId);

      window._appLang = localStorage.getItem("lang") || "ru";
      applyTranslations(window._appLang);

      trackEvent("Загрузка приложения", {
        lang: window._appLang,
        timestamp: new Date().toISOString(),
      });
    } else {
      console.warn("❌ Не удалось получить Telegram ID — аналитика не будет записана");
    }
  }

  // ✅ Язык
  const langSwitcher = document.getElementById("langSwitcher");
  langSwitcher.value = window._appLang;
  langSwitcher.addEventListener("change", (e) => {
    window._appLang = e.target.value;
    localStorage.setItem("lang", window._appLang);
    applyTranslations(window._appLang);
    trackEvent("Смена языка", window._appLang);
  });

  // ✅ Вкладка
  const lastTab = localStorage.getItem("activeTab") || "flights";
  showTab(lastTab);

  // ✅ Чекбокс "Туда и обратно"
  const roundTripCheckbox = document.getElementById("roundTrip");
  const returnDateWrapper = document.getElementById("returnDateWrapper");
  const returnDateInput = document.getElementById("returnDate");
  if (roundTripCheckbox && returnDateWrapper && returnDateInput) {
    const updateReturnDateVisibility = () => {
      returnDateWrapper.classList.toggle("hidden", !roundTripCheckbox.checked);
      returnDateInput.required = roundTripCheckbox.checked;
      if (!roundTripCheckbox.checked) returnDateInput.value = "";
    };
    updateReturnDateVisibility();
    roundTripCheckbox.addEventListener("change", updateReturnDateVisibility);
  }

  // ✅ Горячие предложения
  const hotDealsContainer = document.getElementById("hotDeals");
  if (hotDealsContainer) {
    supabase.from("go_travel").select("*")
      .then(({ data, error }) => {
        if (error) throw error;
        const t = translations[window._appLang];
        hotDealsContainer.innerHTML = data.map(deal => `
          <div class="bg-white p-4 rounded-xl shadow">
            ✈️ <strong>${deal.from}</strong> → <strong>${deal.to}</strong><br>
            📅 ${deal.date}<br>
            <span class="text-red-600 font-semibold">$${deal.price}</span><br>
            <button class="btn mt-2 w-full" onclick="bookFlight('${deal.from}', '${deal.to}', '${deal.date}', ${deal.price})">${t.bookNow}</button>
          </div>
        `).join("");
      })
      .catch(err => {
        hotDealsContainer.innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки рейсов.</p>";
      });
  }

  // ✅ Поиск отелей
  document.getElementById("hotelForm")?.addEventListener("submit", (e) => {
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

        const t = translations[window._appLang];
        const resultBlock = document.getElementById("hotelsResult");
        resultBlock.classList.remove("visible");
        resultBlock.innerHTML = `<h3 class='font-semibold mb-2'>${t.hotelResults}</h3>` + (
          filtered.length ? filtered.map(h => `
            <div class="card bg-white border p-4 rounded-xl mb-2">
              <strong>${h.name}</strong> (${h.city})<br>
              Цена: $${h.price} / ночь<br>
              Рейтинг: ${h.rating}<br>
              <button class="btn mt-2 w-full" onclick="bookHotel('${h.name}', '${h.city}', ${h.price}, ${h.rating})">${t.bookNow}</button>
            </div>`).join("") :
          `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );
        setTimeout(() => resultBlock.classList.add("visible"), 50);
        trackEvent("Поиск отеля", `Город: ${city}, Цена: $${minPrice}–${maxPrice}, Рейтинг: от ${minRating}`);
        hideLoading();
      })
      .catch(err => {
        document.getElementById("hotelsResult").innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки отелей.</p>";
        hideLoading();
      });
  });

  // ✅ Поиск рейсов
  document.getElementById("search-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const from = e.target.from.value.trim();
    const to = e.target.to.value.trim();
    const departureDate = e.target.departureDate.value;
    const msg = `✈️ Лучший рейс\n🛫 ${from} → 🛬 ${to}\n📅 ${departureDate}\n💰 $99`;
    Telegram.WebApp.sendData?.(msg);
    trackEvent("Поиск рейса", `Из: ${from} → В: ${to}, Дата: ${departureDate}`);
  });
});

// Глобальный обработчик ошибок
window.onerror = function (msg, url, line, col, error) {
  logEventToAnalytics("Ошибка JS", { msg, url, line, col, stack: error?.stack || null });
};

// Длительность сессии
const appStart = Date.now();
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});

// Loader
function showLoading() {
  document.getElementById("loadingSpinner")?.classList.remove("hidden");
}
function hideLoading() {
  document.getElementById("loadingSpinner")?.classList.add("hidden");
}
