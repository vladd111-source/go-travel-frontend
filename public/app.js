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
    //hotelFilters: "🔎 Фильтры поиска",
    city: "Город",
    fromCity: "Откуда",
    toCity: "Куда",
    guests: "Гостей",
    checkIn: "Дата заезда",
    checkOut: "Дата выезда",
    priceFrom: "Цена от",
    city: "Город",
    category: "Категория",
    priceTo: "Цена",
    ratingMin: "Рейтинг",
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
    city: "City",
    category: "Category",
    departure: "Departure Date",
    return: "Return Date",
    hotelResults: "Results:",
    noHotelsFound: "Nothing found for the selected filters.",
    //hotelFilters: "🔎 Search Filters",
    city: "City",
    guests: "Guests",
    fromCity: "From",
    toCity: "To",
    checkIn: "Check-in Date",
    checkOut: "Check-out Date",
    priceFrom: "Price from",
    priceTo: "Price",
    ratingMin: "Rating",
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
  if (id === "favorites") {
    switchFavTab("flights");
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

// ✅ DOMContentLoaded и инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  try {
    // ✅ Telegram init
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      console.log("📦 initDataUnsafe:", Telegram.WebApp.initDataUnsafe);
      const user = Telegram.WebApp.initDataUnsafe?.user;
      if (user && user.id) {
        window._telegramId = user.id.toString();
        console.log("✅ Telegram ID установлен:", window._telegramId);
      } else {
        console.warn("❌ Не удалось получить Telegram ID");
      }
    }

    // ✅ Установка языка
    window._appLang = localStorage.getItem("lang") || "ru";
    applyTranslations(window._appLang);

    const langSwitcher = document.getElementById("langSwitcher");
    if (langSwitcher) {
      langSwitcher.value = window._appLang;
      langSwitcher.addEventListener("change", (e) => {
        window._appLang = e.target.value;
        localStorage.setItem("lang", window._appLang);
        applyTranslations(window._appLang);
        trackEvent("Смена языка", window._appLang);
      });
    }

   // ✅ Восстановление активной вкладки
let lastTab = localStorage.getItem("activeTab") || "flights";

// 🛠 Исправляем старое значение "sights" на новое "places"
if (lastTab === "sights") {
  lastTab = "places";
  localStorage.setItem("activeTab", "places");
}

showTab(lastTab);

    // ✅ Автофокус
    setTimeout(() => {
      const tabEl = document.getElementById(lastTab);
      if (tabEl) {
        const firstInput = tabEl.querySelector("input");
        if (firstInput) firstInput.focus();
      }
    }, 200);

    // ✅ Плавное появление
    setTimeout(() => {
      document.body.classList.remove("opacity-0");
    }, 100);

    //💡 Ограничение поля рейтинга (от 0 до 10)
const ratingInput = document.getElementById("minRating");

if (ratingInput) {
  // Ограничение: от 0 до 10
  ratingInput.addEventListener("input", () => {
    let val = parseInt(ratingInput.value);
    if (val > 10) ratingInput.value = 10;
    if (val < 0 || isNaN(val)) ratingInput.value = '';
  });

  // Блокируем символы кроме цифр
  ratingInput.addEventListener("keydown", (e) => {
    const invalidKeys = ["e", "E", "+", "-", ".", ","];

    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
    }
  });
}
    // ✅ Отправка события аналитики
    trackEvent("Загрузка приложения", {
      lang: window._appLang,
      timestamp: new Date().toISOString(),
    });

  } catch (e) {
    console.error("❌ Ошибка при инициализации:", e);
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

  // ✅ Восстанавливаем состояние при старте
  const saved = localStorage.getItem("roundTripChecked");
  if (saved === "1") {
    roundTripCheckbox.checked = true;
  }
  updateReturnDateVisibility();

  // ✅ Сохраняем изменения
  roundTripCheckbox.addEventListener("change", () => {
    updateReturnDateVisibility();
    localStorage.setItem("roundTripChecked", roundTripCheckbox.checked ? "1" : "0");
  });
}
  // ✅ Показ/скрытие фильтров + обновление tooltip
const hotelFiltersToggle = document.getElementById("toggleFilters");
const hotelFiltersSection = document.getElementById("hotelFilters");

if (hotelFiltersToggle && hotelFiltersSection) {
  const toggleVisibility = () => {
    const isVisible = hotelFiltersToggle.checked;
    hotelFiltersSection.classList.toggle("hidden", !isVisible);

    if (isVisible) {
      setTimeout(updatePriceTooltip, 100);
    }
  };

  hotelFiltersToggle.addEventListener("change", toggleVisibility);
  toggleVisibility(); // при загрузке
}
// ✅ Автофокус на первом input текущей активной вкладки
setTimeout(() => {
  const lastTab = document.querySelector(".tab.active")?.id || "flights"; // по умолчанию flights
  const tabEl = document.getElementById(lastTab);
  if (tabEl) {
    const firstInput = tabEl.querySelector("input");
    if (firstInput) firstInput.focus();
  }
}, 200);

// ✅ Плавное появление
setTimeout(() => {
  document.body.classList.remove("opacity-0");
}, 100);

    //✅ Отправка события аналитики о загрузке
    trackEvent("Загрузка приложения", {
      lang: window._appLang,
      timestamp: new Date().toISOString(),
});

// ✅ Поиск отелей
const hotelCityInput = document.getElementById("hotelCity");

// ✅ Центрируем tooltip над ползунком
function updatePriceTooltip() {
  const priceRange = document.getElementById("priceRange");
  const priceTooltip = document.getElementById("priceTooltip");

  if (!priceRange || !priceTooltip) return;

  const value = parseInt(priceRange.value);
  priceTooltip.textContent = `$${value}`;

  const percent = (value - priceRange.min) / (priceRange.max - priceRange.min);
  const sliderWidth = priceRange.offsetWidth;
  const thumbWidth = 32;
  const offset = percent * (sliderWidth - thumbWidth) + thumbWidth / 2;

  priceTooltip.style.left = `${offset}px`;
  priceTooltip.style.transform = `translateX(-50%)`;
}

// ✅ Инициализация ползунка и tooltip
const priceRange = document.getElementById("priceRange");
if (priceRange) {
  priceRange.value = 250;
  priceRange.addEventListener("input", updatePriceTooltip);
  window.addEventListener("resize", updatePriceTooltip);
  window.addEventListener("load", updatePriceTooltip);
}
  // ✅ Обновление при изменении
  priceRange.addEventListener("input", updatePriceTooltip);

  // ✅ Обновление при изменении размера окна
  window.addEventListener("resize", updatePriceTooltip);

if (hotelCityInput) {
  // ✅ Восстановление кэша города
  const cachedCity = localStorage.getItem("lastHotelCity");
  if (cachedCity) hotelCityInput.value = cachedCity;

  // ✅ Установка автофокуса
  hotelCityInput.setAttribute("autofocus", "autofocus");

  // ✅ Обработчик формы отелей
  document.getElementById("hotelForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showLoading();

    const city = hotelCityInput.value.trim();
    localStorage.setItem("lastHotelCity", city);

    const maxPrice = parseFloat(priceRange.value) || Infinity;
    const minRating = parseFloat(document.getElementById("minRating").value) || 0;

    fetch("https://go-travel-backend.vercel.app/api/hotels")
      .then(res => res.json())
      .then(hotels => {
        const filtered = hotels.filter(h =>
          h.price <= maxPrice &&
          h.rating >= minRating &&
          (!city || h.city.toLowerCase().includes(city.toLowerCase()))
        );

        const t = translations[window._appLang];
        const resultBlock = document.getElementById("hotelsResult");
        resultBlock.classList.remove("visible");
 

        resultBlock.innerHTML = `<h3 class='font-semibold mb-2'>${t.hotelResults}</h3>` + (
  filtered.length ? filtered.map(h => {
    const hotelId = `${h.name}-${h.city}-${h.price}`;
    const favHotels = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
    const isFav = favHotels.some(fav => fav.name === h.name && fav.city === h.city);

    return `
      <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
        <strong>${h.name}</strong> (${h.city})<br>
        Цена: $${h.price} / ночь<br>
        Рейтинг: ${h.rating}<br>
        <div class="flex justify-between items-center mt-2">
          <button class="btn text-sm bg-blue-600 text-white rounded px-3 py-1" onclick="bookHotel('${h.name}', '${h.city}', ${h.price}, ${h.rating})">${t.bookNow}</button>
          <button onclick='toggleFavoriteHotel(${JSON.stringify(h)}, this)' class="text-xl">${isFav ? "💙" : "🤍"}</button>
        </div>
      </div>
    `;
  }).join("") :
  `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
);
        // ✅ Вот это — добавь 👇
        resultBlock.classList.add("visible");
        // ✨ Анимация карточек
        animateCards("#hotelsResult .card");

        // 📈 Трекинг
        trackEvent("Поиск отеля", {
          city,
          maxPrice,
          minRating,
          resultCount: filtered.length
        });

        hideLoading();
      })
      .catch(err => {
        console.error("❌ Ошибка загрузки отелей:", err);
        document.getElementById("hotelsResult").innerHTML = "<p class='text-sm text-red-500'>Ошибка загрузки отелей.</p>";
        hideLoading();
      });
  });
}

// ✅ Поиск рейсов
const fromInput = document.getElementById("from");
const toInput = document.getElementById("to");
const departureInput = document.getElementById("departureDate");

if (fromInput && toInput && departureInput) {
  // ✅ Восстановление предыдущего ввода
  fromInput.value = localStorage.getItem("lastFrom") || "";
  toInput.value = localStorage.getItem("lastTo") || "";
  departureInput.value = localStorage.getItem("lastDepartureDate") || "";

  // ✅ Автофокус
  fromInput.setAttribute("autofocus", "autofocus");
}

document.getElementById("search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const departureDate = departureInput.value;

  // ✅ Сохраняем введённые значения
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
// Рендеринг в избранное
      const hotDeals = document.getElementById("hotDeals");
hotDeals.innerHTML = flights.map(deal => {
  const isFav = JSON.parse(localStorage.getItem("favorites_flights") || "[]")
    .some(f => f.from === deal.from && f.to === deal.to && f.date === deal.date && f.price === deal.price);

  return `
    <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
      <strong>${deal.from} → ${deal.to}</strong><br>
      Дата: ${deal.date}<br>
      Цена: $${deal.price}
      <div class="flex justify-between items-center mt-2">
        <button class="btn w-full" onclick="bookHotel('${deal.from}', '${deal.to}', ${deal.price}, '${deal.date}')">Забронировать</button>
        <button onclick='toggleFavoriteFlight(\`${encodeURIComponent(JSON.stringify(deal))}\`, this)' class="text-xl ml-3">${isFav ? "💙" : "🤍"}</button>
      </div>
    </div>
  `;
}).join("");

animateCards("#hotDeals .card");
      
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
      console.error("❌ Ошибка запроса рейсов:", err);
      Telegram.WebApp.sendData?.("❌ Ошибка загрузки рейсов.");
      trackEvent("Ошибка загрузки рейсов", err.message);
    })
    .finally(() => {
      hideLoading();
    });
});

// ✅ Поиск мест
const 
placeCityInput = document.getElementById("placeCity");
const 
placeCategorySelect = document.getElementById("placeCategory");
const resultBlock = document.getElementById("placesResult");
// ✅ Кэш поля "Места"
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

// ✅ Автофокус на поле города
placeCityInput.setAttribute("autofocus", "autofocus");

// ✅ Обработчик формы
document.getElementById("placeForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = placeCityInput.value.trim().toLowerCase();
  const category = placeCategorySelect.value;

  // ✅ Кэшируем значения
  localStorage.setItem("placeCity", city);
  localStorage.setItem("placeCategory", category);

// ✅ Моковые места
const dummyPlaces = [
  {
    name: "Castelo de São Jorge",
    description: "Древняя крепость с видом на Лиссабон",
    city: "лиссабон",
    category: "culture",
    image: "https://picsum.photos/300/180?random=1"
  },
  {
    name: "Miradouro da Senhora do Monte",
    description: "Лучший панорамный вид на город",
    city: "лиссабон",
    category: "nature",
    image: "https://picsum.photos/300/180?random=2"
  },
  {
    name: "Oceanário de Lisboa",
    description: "Современный океанариум",
    city: "лиссабон",
    category: "fun",
    image: "https://picsum.photos/300/180?random=3"
  },
  {
    name: "Time Out Market",
    description: "Фудкорт и рынок в центре города",
    city: "лиссабон",
    category: "food",
    image: "https://picsum.photos/300/180?random=4"
  },
  {
    name: "Centro Colombo",
    description: "Крупный торговый центр",
    city: "лиссабон",
    category: "shopping",
    image: "https://picsum.photos/300/180?random=5"
  }
];

// Очистка и скрытие старых результатов
resultBlock.classList.remove("visible");
resultBlock.innerHTML = "";

// Фильтрация
const filtered = dummyPlaces.filter(p =>
  (!city || p.city.includes(city)) &&
  (!category || p.category === category)
);

if (filtered.length === 0) {
  resultBlock.innerHTML = `<p class="text-sm text-gray-500">Ничего не найдено.</p>`;
  return;
}

const firstBatch = filtered.slice(0, 3);
const remaining = filtered.slice(3);

// Рендерим первые 3 карточки
resultBlock.innerHTML = firstBatch.map(p => {
  const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");
  const isFav = favPlaces.some(fav => fav.name === p.name && fav.city === p.city);

  return `
    <div class="card bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 opacity-0 transform scale-95">
      <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3" />
      <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-1">${p.description}</p>
      <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      <div class="flex justify-between items-center mt-2">
        <button class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">📍 Подробнее</button>
        <button onclick="toggleFavoritePlaceFromEncoded('${encodeURIComponent(JSON.stringify(p))}', this)" class="text-xl ml-2">
          ${isFav ? "💙" : "🤍"}
        </button>
      </div>
    </div>
  `;
}).join("");

// Кнопка "Показать ещё"
if (remaining.length > 0) {
  const moreBtn = document.createElement("button");
  moreBtn.textContent = "Показать ещё";
  moreBtn.className = "btn w-full mt-4 bg-blue-500 text-white text-sm rounded py-2 px-4";

 moreBtn.addEventListener("click", () => {
  const remainingCardsHTML = remaining.map(p => `
    <div class="card bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 opacity-0 transform scale-95">
      <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3" />
      <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-1">${p.description}</p>
      <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      <button class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded w-full">📍 Подробнее</button>
    </div>
  `).join("");

  // Добавляем карточки
  resultBlock.insertAdjacentHTML("beforeend", remainingCardsHTML);
  animateCards("#placesResult .card");

  // 🔽 Плавная прокрутка к первой из новых карточек
  setTimeout(() => {
    const cards = resultBlock.querySelectorAll(".card");
    const scrollTarget = cards[3]; // 0,1,2 — первые три, 3 — первая из оставшихся
    scrollTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 100);

  moreBtn.remove();
});

  resultBlock.appendChild(moreBtn);
}

resultBlock.classList.add("visible");
animateCards("#placesResult .card");

// 📊 Трекинг
trackEvent("Поиск мест", { city, category });
  });
// ✅ Форматирование категории (иконка + текст)
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

// ✅ Заглавная первая буква строки
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ✅ Анимация карточек (универсальная функция для любых блоков)
function animateCards(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(card => {
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    });
  }, 50);
}

//Обработка вкладки избранное
function switchFavTab(tab) {
  document.querySelectorAll('.fav-tab-btn').forEach(btn => btn.classList.remove('bg-blue-100'));
  document.querySelector(`#favTab-${tab}`)?.classList.add('bg-blue-100');

  document.querySelectorAll('.fav-content').forEach(div => div.classList.add('hidden'));
  document.getElementById(`favContent-${tab}`)?.classList.remove('hidden');
  
  renderFavorites(tab);
}

function renderFavorites(tab) {
  const data = JSON.parse(localStorage.getItem(`favorites_${tab}`) || '[]');
  const container = document.getElementById(`favContent-${tab}`);

  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-sm text-center mt-4">Пока нет избранного.</p>`;
    return;
  }

  if (tab === 'flights') {
    container.innerHTML = data.map(f => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${f.from} → ${f.to}</strong><br>
        Дата: ${f.date}<br>
        Цена: $${f.price}
      </div>
    `).join('');
  }

  if (tab === 'hotels') {
    container.innerHTML = data.map(h => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${h.name}</strong> (${h.city})<br>
        Рейтинг: ${h.rating} | $${h.price}
      </div>
    `).join('');
  }

  if (tab === 'places') {
    container.innerHTML = data.map(p => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${p.name}</strong><br>
        ${p.description}<br>
        Категория: ${p.category}
      </div>
    `).join('');
  }
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

 // ✅ Сохранение длительности сессии
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});
    
  // ✅ Функция для обработки лайков на рейсы
function toggleFavoriteFlight(dealId, btn) {
  let favorites = JSON.parse(localStorage.getItem("favFlights") || "[]");
  const index = favorites.indexOf(dealId);

  if (index === -1) {
    favorites.push(dealId);
    btn.textContent = "💙";
  } else {
    favorites.splice(index, 1);
    btn.textContent = "🤍";
  }

  // ✅ Логируем событие до сохранения
  trackEvent("Избранный рейс", { dealId, action: index === -1 ? "add" : "remove" });

  // ✅ Сохраняем в localStorage
  localStorage.setItem("favFlights", JSON.stringify(favorites));
}
    // ✅ Добавление/удаление отеля в избранное
function toggleFavoriteHotel(hotelData, btn) {
  let favorites = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");

  const exists = favorites.some(h => h.name === hotelData.name && h.city === hotelData.city);
  if (exists) {
    favorites = favorites.filter(h => !(h.name === hotelData.name && h.city === hotelData.city));
    btn.textContent = "🤍";
    trackEvent("Удаление из избранного (отель)", hotelData);
  } else {
    favorites.push(hotelData);
    btn.textContent = "💙";
    trackEvent("Добавление в избранное (отель)", hotelData);
  }
  localStorage.setItem("favorites_hotels", JSON.stringify(favorites));
}    
   //✅ Функция для лайка мест   
function toggleFavoritePlace(place, btn) {
  let favorites = JSON.parse(localStorage.getItem("favorites_places") || "[]");
  const exists = favorites.some(f => f.name === place.name && f.city === place.city);

  if (exists) {
    favorites = favorites.filter(f => !(f.name === place.name && f.city === place.city));
    btn.textContent = "🤍";
  } else {
    favorites.push(place);
    btn.textContent = "💙";
  }

  localStorage.setItem("favorites_places", JSON.stringify(favorites));
  trackEvent("Избранное место", { place, action: exists ? "remove" : "add" });
}
      // ✅ Функция для декодирования encoded JSON
function toggleFavoritePlaceFromEncoded(encodedStr, btn) {
  try {
    const placeObj = JSON.parse(decodeURIComponent(encodedStr));
    toggleFavoritePlace(placeObj, btn);
  } catch (e) {
    console.error("❌ Ошибка декодирования избранного места:", e);
  }
}
//Вкладка Избранноеfunction switchFavTab(tab) {
  document.querySelectorAll('.fav-tab-btn').forEach(btn => btn.classList.remove('bg-blue-100'));
  document.querySelector(`#favTab-${tab}`)?.classList.add('bg-blue-100');

  document.querySelectorAll('.fav-content').forEach(div => div.classList.add('hidden'));
  document.getElementById(`favContent-${tab}`)?.classList.remove('hidden');

  renderFavorites(tab);
}

function renderFavorites(tab) {
  const data = JSON.parse(localStorage.getItem(`favorites_${tab}`) || '[]');
  const container = document.getElementById(`favContent-${tab}`);
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-sm text-center mt-4">Пока нет избранного.</p>`;
    return;
  }

  if (tab === 'flights') {
    container.innerHTML = data.map(f => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${f.from} → ${f.to}</strong><br>
        Дата: ${f.date}<br>
        Цена: $${f.price}
      </div>
    `).join('');
  }

  if (tab === 'hotels') {
    container.innerHTML = data.map(h => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${h.name}</strong> (${h.city})<br>
        Рейтинг: ${h.rating} | $${h.price}
      </div>
    `).join('');
  }

  if (tab === 'places') {
    container.innerHTML = data.map(p => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${p.name}</strong><br>
        ${p.description}<br>
        Категория: ${formatCategory(p.category)}
      </div>
    `).join('');
  }
}
// ✅ Сохранение длительности сессии
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});
