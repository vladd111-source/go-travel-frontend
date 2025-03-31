// ✅ Supabase через CDN
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Генерация session_id
const sessionId = localStorage.getItem("session_id") ||
  (window.crypto?.randomUUID?.() || Date.now().toString());
localStorage.setItem("session_id", sessionId);

// ✅ Глобальные переменные
window._telegramId = null;
window._appLang = localStorage.getItem("lang") || "ru";

// ✅ Плавное появление body
setTimeout(() => {
  document.body.classList.remove("opacity-0");
}, 100);

// ✅ Автофокус на первом input активной вкладки
setTimeout(() => {
  const currentTab = localStorage.getItem("activeTab") || "flights";
  const firstInput = document.querySelector(`#${currentTab} input`);
  if (firstInput) firstInput.focus();
}, 200);

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
    findSights: "Показать места",
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
    findSights: "Show Places",
    bookNow: "Book Now"
  }
};

// ✅ Функция перевода элементов
function applyTranslations(lang) {
  const t = translations[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) el.placeholder = t[key];
  });
}

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

// ✅ Трекер событий (обновлен: защита вне Telegram)
function trackEvent(name, data = "") {
  const message = `📈 Событие: ${name}` + (data ? `\n➡️ ${typeof data === "string" ? data : JSON.stringify(data)}` : "");
  console.log(message);
  if (window.Telegram?.WebApp?.sendData) {
    Telegram.WebApp.sendData(message);
  }
  logEventToAnalytics(name, {
    info: data,
    lang: window._appLang,
    activeTab: localStorage.getItem("activeTab") || "flights",
    timestamp: new Date().toISOString(),
  });
}
// ✅ DOMContentLoaded
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
   // ⏳ Плавное появление после полной инициализации
window.addEventListener("load", () => {
  setTimeout(() => {
    document.body.classList.remove("opacity-0");
  }, 100);
});

// 🎯 Автофокус на первом input текущей вкладки
setTimeout(() => {
  const currentTab = localStorage.getItem("activeTab") || "flights";
  const tabEl = document.getElementById(currentTab);
  if (tabEl) {
    const firstInput = tabEl.querySelector("input");
    if (firstInput) firstInput.focus();
  }
}, 200);
  }

 // ✅ Переключение языка
  const langSwitcher = document.getElementById("langSwitcher");
  langSwitcher.value = window._appLang;
  langSwitcher.addEventListener("change", (e) => {
    window._appLang = e.target.value;
    localStorage.setItem("lang", window._appLang);
    applyTranslations(window._appLang);
    trackEvent("Смена языка", window._appLang);
  });
  // ✅ Восстановление активной вкладки из кэша
  const lastTab = localStorage.getItem("activeTab") || "flights";
  showTab(lastTab);
});

  // Кэш поля "Места"
  const placeCityInput = document.getElementById("placeCity");
  const placeCategorySelect = document.getElementById("placeCategory");

  if (placeCityInput) {
    const cachedCity = localStorage.getItem("placeCity");
    if (cachedCity) placeCityInput.value = cachedCity;
    placeCityInput.addEventListener("input", (e) => {
      localStorage.setItem("placeCity", e.target.value.trim());
    });
  }

  if (placeCategorySelect) {
    const cachedCategory = localStorage.getItem("placeCategory");
    if (cachedCategory) placeCategorySelect.value = cachedCategory;
    placeCategorySelect.addEventListener("change", (e) => {
      localStorage.setItem("placeCategory", e.target.value);
    });
  }

  const lastTab = localStorage.getItem("activeTab") || "flights";
    showTab(lastTab);
  } catch (e) {
    console.error("❌ Ошибка при инициализации DOMContentLoaded:", e);
  }
});

  // ✅ Чекбокс "Туда и обратно"
  const roundTripCheckbox = document.getElementById("roundTrip");
  const returnDateWrapper = document.getElementById("returnDateWrapper");
  const returnDateInput = document.getElementById("returnDate");
  if (roundTripCheckbox && returnDateWrapper && returnDateInput) {
    const updateReturnDateVisibility = () => {
      if (roundTripCheckbox.checked) {
        returnDateWrapper.classList.remove("hidden");
      } else {
        returnDateWrapper.classList.add("hidden");
      }
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
        <div class="card bg-white p-4 rounded-xl shadow transition-all duration-300 transform opacity-0 scale-95">
          ✈️ <strong>${deal.from}</strong> → <strong>${deal.to}</strong><br>
          📅 ${deal.date}<br>
          <span class="text-red-600 font-semibold">$${deal.price}</span><br>
          <button class="btn mt-2 w-full" onclick="bookFlight('${deal.from}', '${deal.to}', '${deal.date}', ${deal.price})">${t.bookNow}</button>
        </div>
      `).join("");

      // ✨ Плавная анимация появления карточек
      setTimeout(() => {
        document.querySelectorAll("#hotDeals .card").forEach(card => {
          card.classList.remove("opacity-0", "scale-95");
          card.classList.add("opacity-100", "scale-100");
        });
      }, 50);
    })
    .catch(err => {
      hotDealsContainer.innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки рейсов.</p>";
    });
}

  // ✅ Поиск отелей
const hotelCityInput = document.getElementById("hotelCity");
if (hotelCityInput) {
  hotelCityInput.value = localStorage.getItem("lastHotelCity") || "";
  hotelCityInput.setAttribute("autofocus", "autofocus");
}

document.getElementById("hotelForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  showLoading();

  const city = hotelCityInput.value.trim();
  localStorage.setItem("lastHotelCity", city);

  const minPrice = parseFloat(document.getElementById("minPrice").value) || 0;
  const maxPrice = parseFloat(document.getElementById("maxPrice").value) || Infinity;
  const minRating = parseFloat(document.getElementById("minRating").value) || 0;

  fetch("https://go-travel-backend.vercel.app/api/hotels")
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
          <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
            <strong>${h.name}</strong> (${h.city})<br>
            Цена: $${h.price} / ночь<br>
            Рейтинг: ${h.rating}<br>
            <button class="btn mt-2 w-full" onclick="bookHotel('${h.name}', '${h.city}', ${h.price}, ${h.rating})">${t.bookNow}</button>
          </div>
        `).join("") :
        `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
      );

      // ✨ Анимация появления
      setTimeout(() => {
        document.querySelectorAll("#hotelsResult .card").forEach(card => {
          card.classList.remove("opacity-0", "scale-95");
          card.classList.add("opacity-100", "scale-100");
        });
      }, 50);

      trackEvent("Поиск отеля", `Город: ${city}, Цена: $${minPrice}–${maxPrice}, Рейтинг: от ${minRating}`);
      hideLoading();
    })
    .catch(err => {
      document.getElementById("hotelsResult").innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки отелей.</p>";
      hideLoading();
    });
});

  // ✅ Поиск рейсов
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const departureInput = document.getElementById("departureDate");

if (fromInput && toInput && departureInput) {
  fromInput.value = localStorage.getItem("lastFrom") || "";
  toInput.value = localStorage.getItem("lastTo") || "";
  departureInput.value = localStorage.getItem("lastDepartureDate") || "";
  fromInput.setAttribute("autofocus", "autofocus");
}

document.getElementById("search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const departureDate = departureInput.value;

  localStorage.setItem("lastFrom", from);
  localStorage.setItem("lastTo", to);
  localStorage.setItem("lastDepartureDate", departureDate);

  showLoading();

fetch("https://go-travel-backend.vercel.app/api/flights")
    .then(res => res.json())
    .then(flights => {
      const match = flights.find(f =>
        f.from.toLowerCase() === from.toLowerCase() &&
        f.to.toLowerCase() === to.toLowerCase()
      );

      if (match) {
        const msg = `✈️ Нашли рейс\n🛫 ${match.from} → 🛬 ${match.to}\n📅 ${match.date}\n💰 $${match.price}`;
        Telegram.WebApp.sendData?.(msg);
        trackEvent("Поиск рейса", msg);
      } else {
        Telegram.WebApp.sendData?.("😢 Рейсы не найдены по заданным параметрам.");
        trackEvent("Поиск рейса", `Не найдено: ${from} → ${to}, ${departureDate}`);
      }
    })
    .catch(err => {
      console.error("Ошибка запроса рейсов:", err);
      Telegram.WebApp.sendData?.("❌ Ошибка загрузки рейсов.");
      trackEvent("Ошибка загрузки рейсов", err.message);
    })
    .finally(() => {
      hideLoading();
    });
});

 // ✅ Поиск мест
const placeCityInput = document.getElementById("placeCity");
const placeCategorySelect = document.getElementById("placeCategory");
const resultBlock = document.getElementById("placesResult");

// Автозаполнение и фокус
if (placeCityInput && placeCategorySelect) {
  placeCityInput.value = localStorage.getItem("lastPlaceCity") || "";
  placeCategorySelect.value = localStorage.getItem("lastPlaceCategory") || "";
  placeCityInput.setAttribute("autofocus", "autofocus");
}
// ✅ Поиск мест
document.getElementById("placeForm")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const cityInput = document.getElementById("placeCity");
  const categoryInput = document.getElementById("placeCategory");

  const city = cityInput.value.trim().toLowerCase();
  const category = categoryInput.value;

  // ✅ Кэшируем значения
  localStorage.setItem("place_city", city);
  localStorage.setItem("place_category", category);

  const resultBlock = document.getElementById("placesResult");

  const dummyPlaces = [
    {
      name: "Castelo de São Jorge",
      description: "Древняя крепость с видом на Лиссабон",
      city: "лиссабон",
      category: "culture",
      image: "https://via.placeholder.com/300x180?text=Castle"
    },
    {
      name: "Miradouro da Senhora do Monte",
      description: "Лучший панорамный вид на город",
      city: "лиссабон",
      category: "nature",
      image: "https://via.placeholder.com/300x180?text=Viewpoint"
    },
    {
      name: "Oceanário de Lisboa",
      description: "Современный океанариум",
      city: "лиссабон",
      category: "fun",
      image: "https://via.placeholder.com/300x180?text=Oceanarium"
    },
    {
      name: "Time Out Market",
      description: "Фудкорт и рынок в центре города",
      city: "лиссабон",
      category: "food",
      image: "https://via.placeholder.com/300x180?text=Food+Market"
    },
    {
      name: "Centro Colombo",
      description: "Крупный торговый центр",
      city: "лиссабон",
      category: "shopping",
      image: "https://via.placeholder.com/300x180?text=Shopping+Mall"
    }
  ];

  const filtered = dummyPlaces.filter(p =>
    (!city || p.city.includes(city)) &&
    (!category || p.category === category)
  );

  if (filtered.length === 0) {
    resultBlock.innerHTML = `<p class="text-sm text-gray-500">Ничего не найдено.</p>`;
    return;
  }

  resultBlock.innerHTML = filtered.map(p => `
    <div class="card bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 opacity-0 transform scale-95">
      <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3" />
      <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-1">${p.description}</p>
      <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      <button class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded w-full">📍 Подробнее</button>
    </div>
  `).join("");

  // ✨ Анимация появления карточек
  setTimeout(() => {
    document.querySelectorAll("#placesResult .card").forEach(card => {
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    });
  }, 50);
});

// ✅ Восстановление значений из кэша
document.getElementById("placeCity").value = localStorage.getItem("place_city") || "";
document.getElementById("placeCategory").value = localStorage.getItem("place_category") || "";

// ⏳ Плавное появление
setTimeout(() => {
  document.body.classList.remove("opacity-0");
}, 100);

// ✅ Автофокус на первом input во вкладке
const currentTab = localStorage.getItem("activeTab") || "flights";
setTimeout(() => {
  const firstInput = document.querySelector(`#${currentTab} input`);
  if (firstInput) firstInput.focus();
}, 200);
  
  function formatCategory(code) {
    const map = {
      nature: "🏞 Природа",
      culture: "🏰 Культура",
      fun: "🎢 Развлечения",
      shopping: "🛍 Шопинг",
      food: "🍽 Еда"
    };
    return map[code] || code;
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  // Loader
  function showLoading() {
    document.getElementById("loadingSpinner")?.classList.remove("hidden");
  }
  function hideLoading() {
    document.getElementById("loadingSpinner")?.classList.add("hidden");
  }

  // Обработка ошибок
  window.onerror = function (msg, url, line, col, error) {
    logEventToAnalytics("Ошибка JS", { msg, url, line, col, stack: error?.stack || null });
  };

  // Время сессии
  const appStart = Date.now();
  window.addEventListener("beforeunload", () => {
    const duration = Math.round((Date.now() - appStart) / 1000);
    logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
  });
