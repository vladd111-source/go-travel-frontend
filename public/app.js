// ✅ Supabase через CDN
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
const appStart = Date.now();

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

// ✅ Глобально доступная функция showTab с подсветкой
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

  // Сброс активного стиля у всех кнопок
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-100', 'text-blue-600', 'shadow-md');
    btn.classList.add('bg-white', 'text-black', 'shadow');
  });

  // Подсветка активной кнопки
  const activeBtn = document.querySelector(`.tab-btn[onclick*="${id}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-white', 'text-black', 'shadow');
    activeBtn.classList.add('bg-blue-100', 'text-black-600', 'shadow-md');
  }
  // Сохраняем и логируем
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
            const isFav = favHotels.some(fav => fav.name === h.name && fav.city === h.city && fav.price === h.price);

            return `
      <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
        <strong>${h.name}</strong> (${h.city})<br>
        Цена: $${h.price} / ночь<br>
        Рейтинг: ${h.rating}
        <div class="flex justify-between items-center mt-2">
          <button class="btn text-sm bg-blue-600 text-white rounded px-3 py-1" onclick="bookHotel('${h.name}', '${h.city}', ${h.price}, ${h.rating})">${t.bookNow}</button>
          <button 
            onclick='toggleFavoriteHotel(${JSON.stringify(h)}, this)' 
            class="text-xl ml-2"
            data-hotel-id="${hotelId}">
            ${isFav ? "💙" : "🤍"}
          </button>
        </div>
      </div>
    `;
          }).join("") :
            `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );
        updateHotelHearts();
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
        const dealId = `${deal.from}-${deal.to}-${deal.date}-${deal.price}`;
        return `
    <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
      <strong>${deal.from} → ${deal.to}</strong><br>
      Дата: ${deal.date}<br>
      Цена: $${deal.price}
      <div class="flex justify-between items-center mt-2">
        <button class="btn w-full" onclick="bookHotel('${deal.from}', '${deal.to}', ${deal.price}, '${deal.date}')">Забронировать</button>
        <button onclick="toggleFavoriteFlight('${dealId}', this)" 
  class="text-xl ml-3"
  data-flight-id="${dealId}"
>
  ${isFav ? "💙" : "🤍"}
</button>
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

  // Показываем первую часть карточек (3), остальное — по кнопке "Показать ещё"
  const firstBatch = filtered.slice(0, 3);
  const remaining = filtered.slice(3);

  if (filtered.length === 0) {
    resultBlock.innerHTML = `<p class="text-sm text-gray-500">Ничего не найдено.</p>`;
    return;
  }

  // Рендерим первые 3 карточки
  resultBlock.innerHTML = firstBatch.map(p => {
    const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");
    const isFav = favPlaces.some(fav => fav.name === p.name && fav.city === p.city);
    const placeId = `${p.name}-${p.city}`;

    return `
    <div class="card bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 opacity-0 transform scale-95">
      <img src="${p.image}" alt="${p.name}" class="w-full h-40 object-cover rounded-md mb-3" />
      <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
      <p class="text-sm text-gray-600 mb-1">${p.description}</p>
      <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      <div class="flex justify-between items-center mt-2">
        <button class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">📍 Подробнее</button>
     <button 
  onclick="toggleFavoritePlaceFromEncoded('${encodeURIComponent(JSON.stringify(p))}', this)" 
  class="text-xl ml-2"
  data-place-id="${encodeURIComponent(JSON.stringify(p))}"
>
  ${isFav ? "💙" : "🤍"}
</button>
      </div>
    </div>
  `;
  }).join("");
  updatePlaceHearts();
  // Если есть ещё карточки — добавляем кнопку
  if (remaining.length > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.textContent = "Показать ещё";
    moreBtn.className = "btn w-full mt-4 bg-blue-500 text-white text-sm rounded py-2 px-4";

    // Обработка клика
    moreBtn.addEventListener("click", () => {
      const remainingCards = remaining.map(p => {
        const placeId = `${p.name}-${p.city}`;
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
            <button 
              onclick="toggleFavoritePlaceFromEncoded('${encodeURIComponent(JSON.stringify(p))}', this)" 
              class="text-xl ml-2"
              data-place-id="${placeId}">
              ${isFav ? "💙" : "🤍"}
            </button>
          </div>
        </div>
      `;
      }).join("");

      resultBlock.insertAdjacentHTML("beforeend", remainingCards);
      animateCards("#placesResult .card");
      updatePlaceHearts(); // обновим лайки

      // Плавно прокручиваем к первой новой карточке
      setTimeout(() => {
        const cards = resultBlock.querySelectorAll(".card");
        const scrollTarget = cards[3]; // первая из новых
        scrollTarget?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      moreBtn.remove(); // убираем кнопку
    });

    resultBlock.appendChild(moreBtn);
  }

  resultBlock.classList.add("visible");
  animateCards("#placesResult .card");

  // 📊 Трекинг
  trackEvent("Поиск мест", { city, category });

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
  
});

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
  //Вкладка Избранное
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

    if (tab === "flights") {
      container.innerHTML = data.map((f, index) => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${f.from} → ${f.to}</strong><br>
        Дата: ${f.date}<br>
        Цена: $${f.price}
        <div class="flex justify-between items-center mt-2">
          <button class="btn text-sm bg-blue-100 text-blue-600" onclick="showFlightDetails(${index})">📄 Подробнее</button>
          <button class="btn text-sm bg-red-100 text-red-600" onclick="removeFavoriteFlight(${index})">🗑 Удалить</button>
        </div>
      </div>
    `).join('');
      updateFlightHearts(); // 👈 обновляем сердечки
    }

    if (tab === "hotels") {
      container.innerHTML = data.map((h, index) => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${h.name}</strong> (${h.city})<br>
        Рейтинг: ${h.rating} | $${h.price}
        <div class="flex justify-between items-center mt-2">
          <button class="btn text-sm bg-blue-100 text-blue-600" onclick="showHotelDetails(${index})">📄 Подробнее</button>
          <button class="btn text-sm bg-red-100 text-red-600" onclick="removeFavoriteHotel(${index})">🗑 Удалить</button>
        </div>
      </div>
    `).join('');
      updateHotelHearts(); // 👈 обновляем сердечки
    }

    if (tab === "places") {
      container.innerHTML = data.map((p, index) => `
      <div class="card bg-white p-4 rounded-xl shadow mb-2">
        <strong>${p.name}</strong><br>
        ${p.description}<br>
        Категория: ${formatCategory(p.category)}<br>
        <div class="flex justify-between items-center mt-2">
          <button class="btn text-sm bg-blue-100 text-blue-600" onclick="showPlaceDetails(${index})">📄 Подробнее</button>
          <button class="btn text-sm bg-red-100 text-red-600" onclick="removeFavoritePlace(${index})">🗑 Удалить</button>
        </div>
      </div>
    `).join('');
      updatePlaceHearts(); // 👈 обновляем сердечки
    }
  }
  //Функция удаления из избранного
  function removeFavoriteFlight(index) {
    let flights = JSON.parse(localStorage.getItem("favorites_flights") || "[]");
    flights.splice(index, 1);
    localStorage.setItem("favorites_flights", JSON.stringify(flights));
    renderFavorites("flights");
    updateFlightHearts();
  }
  function removeFavoriteHotel(index) {
    let hotels = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
    hotels.splice(index, 1);
    localStorage.setItem("favorites_hotels", JSON.stringify(hotels));
    renderFavorites("hotels");
    updateHotelHearts(); // исправлено
  }
  function removeFavoritePlace(index) {
    let places = JSON.parse(localStorage.getItem("favorites_places") || "[]");
    places.splice(index, 1);
    localStorage.setItem("favorites_places", JSON.stringify(places));
    renderFavorites("places");
    updatePlaceHearts(); // исправлено
  }
  // ✅ Модальное окно для показа деталей перелета/отеля/места
  function showPlaceDetails(index) {
    const places = JSON.parse(localStorage.getItem("favorites_places") || "[]");
    const place = places[index];
    if (!place) return;

    document.getElementById("modalContent").innerHTML = `
    <h2 class="text-xl font-bold mb-2">${place.name}</h2>
    <p class="text-sm text-gray-600 mb-1">${place.description}</p>
    <p class="text-sm text-gray-500">${formatCategory(place.category)} • ${capitalize(place.city)}</p>
  `;
    openModal();
  }

  function showHotelDetails(index) {
    const hotels = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
    const hotel = hotels[index];
    if (!hotel) return;

    document.getElementById("modalContent").innerHTML = `
    <h2 class="text-xl font-bold mb-2">${hotel.name}</h2>
    <p class="text-sm text-gray-500">Город: ${hotel.city}</p>
    <p class="text-sm text-gray-500">Цена: $${hotel.price}</p>
    <p class="text-sm text-gray-500">Рейтинг: ${hotel.rating}</p>
  `;
    openModal();
  }

  function showFlightDetails(index) {
    const flights = JSON.parse(localStorage.getItem("favorites_flights") || "[]");
    const flight = flights[index];
    if (!flight) return;

    document.getElementById("modalContent").innerHTML = `
    <h2 class="text-xl font-bold mb-2">${flight.from} → ${flight.to}</h2>
    <p class="text-sm text-gray-500">Дата: ${flight.date}</p>
    <p class="text-sm text-gray-500">Цена: $${flight.price}</p>
  `;
    openModal();
  }

  function openModal() {
    const modal = document.getElementById("detailsModal");
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }

  function closeModal() {
    const modal = document.getElementById("detailsModal");
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  }

  // ✅ Обновление сердечек рейсов (по dealId)
  function updateFlightHearts() {
    const favs = JSON.parse(localStorage.getItem("favorites_flights") || "[]");
    document.querySelectorAll('[data-flight-id]').forEach(btn => {
      const dealId = btn.dataset.flightId;
      const isFav = favs.includes(dealId);
      btn.textContent = isFav ? "💙" : "🤍";
    });
  }

  // ✅ Обновление сердечек отелей
  function updateHotelHearts() {
    const favs = JSON.parse(localStorage.getItem("favorites_hotels") || "[]");
    document.querySelectorAll('[data-hotel-id]').forEach(btn => {
      const hotel = JSON.parse(decodeURIComponent(btn.dataset.hotelId));
      const isFav = favs.some(h => h.name === hotel.name && h.city === hotel.city);
      btn.textContent = isFav ? "💙" : "🤍";
    });
  }

  function updatePlaceHearts() {
    const favs = JSON.parse(localStorage.getItem("favorites_places") || "[]");
    document.querySelectorAll('[data-place-id]').forEach(btn => {
      try {
        const place = JSON.parse(decodeURIComponent(btn.dataset.placeId));
        const isFav = favs.some(p => p.name === place.name && p.city === place.city);
        btn.textContent = isFav ? "💙" : "🤍";
      } catch (e) {
        console.error("Ошибка обновления сердечка места:", e);
      }
    });
  }
