// ✅ Supabase через CDN
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const appStart = Date.now();

// ✅ Сессия
const sessionId = localStorage.getItem("session_id") || crypto.randomUUID?.() || Date.now().toString();
localStorage.setItem("session_id", sessionId);

// ✅ Глобальные переменные
window._telegramId = null;
window._appLang = localStorage.getItem("lang") || "ru";

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
    fromCity: "Откуда",
    toCity: "Куда",
    guests: "Гостей",
    checkIn: "Дата заезда",
    checkOut: "Дата выезда",
    priceFrom: "Цена от",
    priceTo: "Цена до",
    ratingMin: "Рейтинг",
    category: "Категория",
    hotelResults: "Результаты:",
    noHotelsFound: "Ничего не найдено по заданным фильтрам.",
    findHotel: "Найти отель",
    findSights: "Показать места",
    bookNow: "Забронировать",
    city: "Город"
  },
  en: {
    flights: "✈️ Flights",
    hotels: "🏨 Hotels",
    sights: "🌍 Places",
    findFlights: "Search Flights",
    roundTrip: "Round Trip",
    departure: "Departure Date",
    return: "Return Date",
    fromCity: "From",
    toCity: "To",
    guests: "Guests",
    checkIn: "Check-in Date",
    checkOut: "Check-out Date",
    priceFrom: "Price from",
    priceTo: "Price to",
    ratingMin: "Rating",
    category: "Category",
    hotelResults: "Results:",
    noHotelsFound: "Nothing found for the selected filters.",
    findHotel: "Find Hotel",
    findSights: "Show Places",
    bookNow: "Book Now",
    city: "City"
  }
};

// ✅ Применение переводов
function applyTranslations(lang) {
  const t = translations[lang];
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (t[key]) el.textContent = t[key];
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (t[key]) el.placeholder = t[key];
  });
}

// ✅ Утилиты
const normalize = str => str.toLowerCase().trim();
const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

// ✅ Логгирование аналитики в Supabase
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
    created_at: new Date().toISOString()
  };

  supabase
    .from("analytics")
    .insert([payload])
    .then(({ error }) => {
      if (error) {
        console.error("❌ Supabase insert error:", error.message);
      } else {
        console.log("✅ Событие записано:", eventName);
      }
    });
}

// ✅ Трекинг действий
function trackEvent(name, data = "") {
  const message =
    `📈 Событие: ${name}` +
    (data ? `\n➡️ ${typeof data === "string" ? data : JSON.stringify(data)}` : "");
  console.log(message);

  if (window.Telegram?.WebApp?.sendData) {
    Telegram.WebApp.sendData(message);
  }

  logEventToAnalytics(name, {
    info: data,
    lang: window._appLang,
    activeTab: localStorage.getItem("activeTab") || "flights",
    timestamp: new Date().toISOString()
  });
}

function switchFavTab(tab) {
  // Переключение кнопок избранного
  document.querySelectorAll('.fav-tab-btn').forEach(btn => btn.classList.remove('bg-blue-100'));
  const activeTab = document.querySelector(`#favTab-${tab}`);
  if (activeTab) activeTab.classList.add('bg-blue-100');

  // Переключение контента
  document.querySelectorAll('.fav-content').forEach(div => div.classList.add('hidden'));
  const contentBlock = document.getElementById(`favContent-${tab}`);
  if (contentBlock) contentBlock.classList.remove('hidden');

  renderFavorites(tab);
}
function renderFavorites(type) {
  const favorites = JSON.parse(localStorage.getItem(`favorites_${type}`) || '[]');
  const container = document.getElementById(`favContent-${type}`);
  if (!container) return;

  if (favorites.length === 0) {
    container.innerHTML = `<p class="text-sm text-gray-500">Нет избранного.</p>`;
    return;
  }

  if (type === "flights") {
    container.innerHTML = favorites.map(f => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        ✈️ ${f.from} → ${f.to}<br>
        📅 ${f.date} — 💰 $${f.price}
      </div>
    `).join("");
  } else if (type === "hotels") {
    container.innerHTML = favorites.map(h => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        🏨 ${h.name} (${h.city})<br>
        💰 $${h.price} / ночь — ⭐ ${h.rating}
      </div>
    `).join("");
  } else if (type === "places") {
    container.innerHTML = favorites.map(p => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        🌍 ${p.name} (${p.city})<br>
        ${p.description}
      </div>
    `).join("");
  }
}

// ✅ Обработка переключения вкладки
window.showTab = function (id) {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.classList.remove("active");
    tab.classList.add("hidden");
  });

  const selectedTab = document.getElementById(id);
  if (selectedTab) {
    selectedTab.classList.remove("hidden");
    selectedTab.classList.add("active");
  }

  document.querySelectorAll(".tab-btn").forEach(btn => {
    btn.classList.remove("bg-blue-100", "text-blue-600", "shadow-md");
    btn.classList.add("bg-white", "text-black", "shadow");
  });

  const activeBtn = document.querySelector(`.tab-btn[onclick*="${id}"]`);
  if (activeBtn) {
    activeBtn.classList.remove("bg-white", "text-black", "shadow");
    activeBtn.classList.add("bg-blue-100", "text-black-600", "shadow-md");
  }

  localStorage.setItem("activeTab", id);
  trackEvent("Переключение вкладки", id);

  if (id === "favorites") {
    switchFavTab("flights");
  }
};

// ✅ Инициализация при загрузке
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const user = Telegram.WebApp.initDataUnsafe?.user;
      if (user?.id) {
        window._telegramId = user.id.toString();
        console.log("✅ Telegram ID установлен:", window._telegramId);
      } else {
        console.warn("❌ Не удалось получить Telegram ID");
      }
    }

    // Язык интерфейса
    window._appLang = localStorage.getItem("lang") || "ru";
    applyTranslations(window._appLang);

    const langSwitcher = document.getElementById("langSwitcher");
    if (langSwitcher) {
      langSwitcher.value = window._appLang;
      langSwitcher.addEventListener("change", (e) => {
        const lang = e.target.value;
        window._appLang = lang;
        localStorage.setItem("lang", lang);
        applyTranslations(lang);
        trackEvent("Смена языка", lang);
      });
    }

    // Последняя активная вкладка
    let lastTab = localStorage.getItem("activeTab") || "flights";
    if (lastTab === "sights") {
      lastTab = "places";
      localStorage.setItem("activeTab", "places");
    }
    showTab(lastTab);

    // Автофокус на первое поле
    setTimeout(() => {
      const tabEl = document.getElementById(lastTab);
      const firstInput = tabEl?.querySelector("input");
      firstInput?.focus();
    }, 200);

    // Плавное появление
    document.body.classList.remove("opacity-0");

    // Первая инициализация
    trackEvent("Загрузка приложения", {
      lang: window._appLang,
      timestamp: new Date().toISOString()
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
    const isChecked = roundTripCheckbox.checked;
    returnDateWrapper.classList.toggle("hidden", !isChecked);
    returnDateInput.required = isChecked;
    if (!isChecked) returnDateInput.value = "";
  };

  // Восстанавливаем состояние
  if (localStorage.getItem("roundTripChecked") === "1") {
    roundTripCheckbox.checked = true;
  }

  updateReturnDateVisibility();

  roundTripCheckbox.addEventListener("change", () => {
    localStorage.setItem("roundTripChecked", roundTripCheckbox.checked ? "1" : "0");
    updateReturnDateVisibility();
  });
}

// ✅ Ползунок цен
const priceRange = document.getElementById("priceRange");
const priceTooltip = document.getElementById("priceTooltip");

function updatePriceTooltip() {
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

if (priceRange) {
  priceRange.value = 250;
  priceRange.addEventListener("input", updatePriceTooltip);
  window.addEventListener("resize", updatePriceTooltip);
  window.addEventListener("load", updatePriceTooltip);
}

// ✅ Поиск отелей
const hotelCityInput = document.getElementById("hotelCity");
const ratingInput = document.getElementById("minRating");

// ✅ Показ/скрытие фильтров по чекбоксу
const filtersToggle = document.getElementById("showFiltersCheckbox");
const hotelFilters = document.getElementById("hotelFilters");

filtersToggle?.addEventListener("change", (e) => {
  const show = e.target.checked;
  hotelFilters.classList.toggle("hidden", !show);

  if (show) {
    updatePriceTooltip(); // 👈 тултип покажется правильно
  }
});

if (hotelCityInput) {
  const cachedCity = localStorage.getItem("lastHotelCity");
  if (cachedCity) hotelCityInput.value = cachedCity;

  hotelCityInput.setAttribute("autofocus", "autofocus");

  document.getElementById("hotelForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showLoading();

    const city = hotelCityInput.value.trim();
    localStorage.setItem("lastHotelCity", city);

    const maxPrice = parseFloat(priceRange.value) || Infinity;
    const minRating = parseFloat(ratingInput?.value) || 0;

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
          filtered.length
            ? filtered.map(h => {
                const hotelId = `${h.name}-${h.city}-${h.price}`;
                const favHotels = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
                const isFav = favHotels.some(fav => fav.name === h.name && fav.city === h.city && fav.price === h.price);
                return `
                  <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
                    <strong>${h.name}</strong> (${h.city})<br>
                    Цена: $${h.price} / ночь<br>
                    Рейтинг: ${h.rating}
                    <div class="flex justify-between items-center mt-2">
                      <button class="btn text-sm bg-blue-600 text-white rounded px-3 py-1" onclick="bookHotel('${h.name}', '${h.city}', ${h.price}, ${h.rating})">${t.bookNow}</button>
                      <button onclick='toggleFavoriteHotel(${JSON.stringify(h)}, this)' class="text-xl ml-2" data-hotel-id="${hotelId}">${isFav ? "💙" : "🤍"}</button>
                    </div>
                  </div>
                `;
              }).join("")
            : `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );

        updateHotelHearts();
        resultBlock.classList.add("visible");
        animateCards("#hotelsResult .card");

        trackEvent("Поиск отеля", { city, maxPrice, minRating, resultCount: filtered.length });
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
  fromInput.value = localStorage.getItem("lastFrom") || "";
  toInput.value = localStorage.getItem("lastTo") || "";
  departureInput.value = localStorage.getItem("lastDepartureDate") || "";

  fromInput.setAttribute("autofocus", "autofocus");

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

        const hotDeals = document.getElementById("hotDeals");
        hotDeals.innerHTML = flights.map(deal => {
          const isFav = JSON.parse(localStorage.getItem("favorites_flights") || "[]")
            .some(f => f.from === deal.from && f.to === deal.to && f.date === deal.date && f.price === deal.price);
          const dealId = `${deal.from}-${deal.to}-${deal.date}-${deal.price}`;
          return `
            <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
              <strong>${deal.from} → ${deal.to}</strong><br>
              Дата: ${deal.date}<br>
              Цена: $${deal.price}
              <div class="flex justify-between items-center mt-2">
                <button class="btn w-full" onclick="bookHotel('${deal.from}', '${deal.to}', ${deal.price}, '${deal.date}')">Забронировать</button>
                <button onclick="toggleFavoriteFlight('${dealId}', this)" class="text-xl ml-3" data-flight-id="${dealId}">${isFav ? "💙" : "🤍"}</button>
              </div>
            </div>
          `;
        }).join("");

        updatePlaceHearts();
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
}

// ✅ Кнопка "Показать места"
const placeCityInput = document.getElementById("placeCity");
const placeCategorySelect = document.getElementById("placeCategory");
const resultBlock = document.getElementById("placesResult");

if (placeCityInput && placeCategorySelect && resultBlock) {
  const dummyPlaces = [
    { name: "Oceanário", description: "Современный океанариум", city: "лиссабон", category: "fun", image: "https://picsum.photos/300/180?random=1" },
    { name: "Time Out Market", description: "Фудкорт и рынок", city: "лиссабон", category: "food", image: "https://picsum.photos/300/180?random=2" },
    { name: "Castelo", description: "Замок с видом на город", city: "лиссабон", category: "culture", image: "https://picsum.photos/300/180?random=3" },
    { name: "Miradouro", description: "Панорама города", city: "лиссабон", category: "nature", image: "https://picsum.photos/300/180?random=4" },
    { name: "Centro Colombo", description: "ТЦ", city: "лиссабон", category: "shopping", image: "https://picsum.photos/300/180?random=5" }
  ];

  document.getElementById("placeForm")?.addEventListener("submit", (e) => {
    e.preventDefault();

    const city = placeCityInput.value.trim().toLowerCase();
    const category = placeCategorySelect.value;

    const filtered = dummyPlaces.filter(p =>
      (!city || p.city.includes(city)) &&
      (!category || p.category === category)
    );

    resultBlock.innerHTML = "";
    resultBlock.classList.remove("visible");

    if (filtered.length === 0) {
      resultBlock.innerHTML = `<p class="text-sm text-gray-500">Ничего не найдено.</p>`;
      return;
    }

    const firstBatch = filtered.slice(0, 3);
    const remaining = filtered.slice(3);

    resultBlock.innerHTML = firstBatch.map(p => renderPlaceCard(p)).join("");
    resultBlock.classList.add("visible");
    animateCards("#placesResult .card");

    if (remaining.length > 0) {
      const moreBtn = document.createElement("button");
      moreBtn.textContent = "Показать ещё";
      moreBtn.className = "btn w-full mt-4 bg-blue-500 text-white text-sm rounded py-2 px-4";

      moreBtn.addEventListener("click", () => {
        resultBlock.insertAdjacentHTML("beforeend", remaining.map(p => renderPlaceCard(p)).join(""));
        animateCards("#placesResult .card");
        updatePlaceHearts();
        moreBtn.remove();
      });

      resultBlock.appendChild(moreBtn);
    }

    updatePlaceHearts();
    trackEvent("Поиск мест", { city, category });
  });
}

// ✅ Вспомогательные функции
function renderPlaceCard(p) {
  const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");
  const isFav = favPlaces.some(f => f.name === p.name && f.city === p.city);
  const encoded = encodeURIComponent(JSON.stringify(p));

  return `
    <div class="card bg-white p-4 rounded-xl shadow mb-2 opacity-0 transform scale-95">
      <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3" />
      <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-1">${p.description}</p>
      <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      <div class="flex justify-between items-center mt-2">
        <button class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">📍 Подробнее</button>
        <button onclick="toggleFavoritePlaceFromEncoded('${encoded}', this)" class="text-xl ml-2" data-place-id="${encoded}">${isFav ? "💙" : "🤍"}</button>
      </div>
    </div>
  `;
}

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

function animateCards(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(card => {
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    });
  }, 50);
}

function showLoading() {
  document.getElementById("loadingSpinner")?.classList.remove("hidden");
}

function hideLoading() {
  document.getElementById("loadingSpinner")?.classList.add("hidden");
}

// ✅ Работа с избранным
function toggleFavoritePlaceFromEncoded(encodedStr, btn) {
  try {
    const place = JSON.parse(decodeURIComponent(encodedStr));
    toggleFavoritePlace(place, btn);
  } catch (e) {
    console.error("❌ Ошибка декодирования:", e);
  }
}

function toggleFavoritePlace(place, btn) {
  let favorites = JSON.parse(localStorage.getItem("favorites_places") || "[]");
  const exists = favorites.some(p => p.name === place.name && p.city === place.city);

  if (exists) {
    favorites = favorites.filter(p => !(p.name === place.name && p.city === place.city));
    btn.textContent = "🤍";
  } else {
    favorites.push(place);
    btn.textContent = "💙";
  }

  localStorage.setItem("favorites_places", JSON.stringify(favorites));
  trackEvent("Избранное место", { place, action: exists ? "remove" : "add" });
}

function updatePlaceHearts() {
  const favs = JSON.parse(localStorage.getItem("favorites_places") || "[]");
  document.querySelectorAll('[data-place-id]').forEach(btn => {
    try {
      const place = JSON.parse(decodeURIComponent(btn.dataset.placeId));
      const isFav = favs.some(p => p.name === place.name && p.city === place.city);
      btn.textContent = isFav ? "💙" : "🤍";
    } catch (e) {
      console.error("Ошибка сердечка:", e);
    }
  });
}

// ✅ Модальное окно
function openModal() {
  document.getElementById("detailsModal")?.classList.replace("hidden", "flex");
}

function closeModal() {
  document.getElementById("detailsModal")?.classList.replace("flex", "hidden");
}

// ✅ Завершение сессии
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});

// ✅ Глобальный JS error catcher
window.onerror = function (msg, url, line, col, error) {
  logEventToAnalytics("Ошибка JS", {
    msg, url, line, col,
    stack: error?.stack || null
  });
};
// ✅ Фильтры при включении чекбокса
document.addEventListener("DOMContentLoaded", () => {
  const filtersToggle = document.getElementById("showFiltersCheckbox");
  const hotelFilters = document.getElementById("hotelFilters");

  if (!filtersToggle || !hotelFilters) {
    console.warn("⛔ Не найден чекбокс или блок фильтров");
    return;
  }

  filtersToggle.addEventListener("change", (e) => {
    const show = e.target.checked;
    hotelFilters.classList.toggle("hidden", !show);

    if (show) {
      updatePriceTooltip(); // Позиционируем цену над ползунком
    }
  });
});
