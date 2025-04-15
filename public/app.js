import { getAmadeusToken, fetchCityIATA, fetchAmadeusFlights } from './amadeus.js';
import { fetchLocation, fetchAviasalesFlights } from './api.js';
import { renderFlights } from './render.js';

// ─── DOMContentLoaded и инициализация ─────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Инициализация
    initTelegram();
    initLanguageSwitcher();
    restoreLastTab();
    initFocus(lastTab);
    fadeInBody();
    initRatingInputValidation();

    // 🎯 Элементы формы
    const form = document.getElementById('search-form');
    const fromInput = document.getElementById('from');
    const toInput = document.getElementById('to');
    const departureInput = document.getElementById('departureDate');

    if (!form || !fromInput || !toInput || !departureInput) {
      throw new Error("❌ Один из элементов формы не найден!");
    }

// ✈️ Обработка сабмита формы
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const fromCity = fromInput.value.trim();
  const toCity = toInput.value.trim();
  const date = departureInput.value.trim();

  // ⛽ Получаем IATA коды через Amadeus
  const fromIATA = await fetchCityIATA(fromCity);
  const toIATA = await fetchCityIATA(toCity);

  if (!fromIATA || !toIATA) {
    console.warn("❌ Не удалось найти IATA коды для городов", { fromCity, toCity });
    return;
  }

  const rawFlights = await fetchAmadeusFlights(fromIATA.code, toIATA.code, date);
  const flights = rawFlights.filter(f => f.origin && f.destination && f.departure_at);
  renderFlights(flights);

  trackEvent("Поиск рейсов", {
    from: fromIATA.code,
    to: toIATA.code,
    departureDate: date,
    count: flights.length,
    isRoundTrip: false,
  });
});

// 📦 Аналитика загрузки
trackEvent("Загрузка приложения", {
  lang: window._appLang,
  timestamp: new Date().toISOString(),
});

// 🔍 Доступ для отладки из консоли
window.fetchLocation = fetchLocation;
window.fetchAviasalesFlights = fetchAviasalesFlights;

// ─── Telegram WebApp Init ─────────────────────────────────────────
function initTelegram() {
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
}

// ─── Язык и переключатель ────────────────────────────────────────
function initLanguageSwitcher() {
  window._appLang = localStorage.getItem("lang") || "ru";
  applyTranslations(window._appLang);

  const langSwitcher = document.getElementById("langSwitcher");
  if (langSwitcher) {
    langSwitcher.value = window._appLang;
    langSwitcher.addEventListener("change", (e) => {
      const newLang = e.target.value;
      window._appLang = newLang;
      localStorage.setItem("lang", newLang);
      applyTranslations(newLang);
      trackEvent("Смена языка", newLang);
    });
  }
}

// ─── Вкладка ─────────────────────────────────────────────────────
let lastTab = localStorage.getItem("activeTab") || "flights";

function restoreLastTab() {
  if (lastTab === "sights") {
    lastTab = "places";
    localStorage.setItem("activeTab", "places");
  }
  showTab(lastTab);
}

// ─── Автофокус на вкладке ────────────────────────────────────────
function initFocus(tab) {
  setTimeout(() => {
    if (typeof window.focusFirstInputIn === "function") {
      window.focusFirstInputIn(tab);
    } else {
      console.warn("⚠️ focusFirstInputIn пока не доступна");
    }
  }, 200);
}

// ─── Плавное появление ───────────────────────────────────────────
function fadeInBody() {
  setTimeout(() => {
    document.body.classList.remove("opacity-0");
  }, 100);
}

// ─── Валидация рейтинга ──────────────────────────────────────────
function initRatingInputValidation() {
  const ratingInput = document.getElementById("minRating");
  if (!ratingInput) return;

  ratingInput.addEventListener("input", () => {
    let val = parseInt(ratingInput.value);
    if (val > 10) ratingInput.value = 10;
    if (val < 0 || isNaN(val)) ratingInput.value = '';
  });

  ratingInput.addEventListener("keydown", (e) => {
    const invalidKeys = ["e", "E", "+", "-", ".", ","];
    if (invalidKeys.includes(e.key)) {
      e.preventDefault();
    }
  });
}

// ─── Чекбокс "Туда и обратно" ────────────────────────────────────
const roundTripCheckbox = document.getElementById("roundTrip");
const returnDateWrapper = document.getElementById("returnDateWrapper");
const returnDateInput = document.getElementById("returnDate");

if (roundTripCheckbox && returnDateWrapper && returnDateInput) {
  const updateReturnDateVisibility = () => {
    returnDateWrapper.classList.toggle("hidden", !roundTripCheckbox.checked);
    returnDateInput.required = roundTripCheckbox.checked;
    if (!roundTripCheckbox.checked) returnDateInput.value = "";
  };

  roundTripCheckbox.checked = localStorage.getItem("roundTripChecked") === "1";
  updateReturnDateVisibility();

  roundTripCheckbox.addEventListener("change", () => {
    updateReturnDateVisibility();
    localStorage.setItem("roundTripChecked", roundTripCheckbox.checked ? "1" : "0");
  });
}

// ─── Показ/скрытие фильтров отелей ───────────────────────────────
const hotelFiltersToggle = document.getElementById("toggleFilters");
const hotelFiltersSection = document.getElementById("hotelFilters");

if (hotelFiltersToggle && hotelFiltersSection) {
  const toggleVisibility = () => {
    const isVisible = hotelFiltersToggle.checked;
    hotelFiltersSection.classList.toggle("hidden", !isVisible);
    if (isVisible) setTimeout(updatePriceTooltip, 100);
  };

  hotelFiltersToggle.addEventListener("change", toggleVisibility);
  toggleVisibility();
}

// ─── Ползунок цены ───────────────────────────────────────────────
const priceRange = document.getElementById("priceRange");
if (priceRange) {
  priceRange.value = 250;
  priceRange.addEventListener("input", updatePriceTooltip);
  window.addEventListener("resize", updatePriceTooltip);
  window.addEventListener("load", updatePriceTooltip);
}

// ─── Поиск отелей ────────────────────────────────────────────────
const hotelCityInput = document.getElementById("hotelCity");

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
          }).join("") : `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );

        updateHotelHearts();
        resultBlock.classList.add("visible");
        animateCards("#hotelsResult .card");

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

// ─── Инициализация полей рейсов ──────────────────────────────────
if (fromInput && toInput && departureInput) {
  fromInput.value = localStorage.getItem("lastFrom") || "";
  toInput.value = localStorage.getItem("lastTo") || "";
  departureInput.value = localStorage.getItem("lastDepartureDate") || "";
  fromInput.setAttribute("autofocus", "autofocus");
}
    
// ─── Обработка формы поиска рейсов ──────────────────────────────
document.getElementById("search-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const departureDate = departureInput.value;
  const isRoundTrip = document.getElementById("roundTrip").checked;
  const returnDate = document.getElementById("returnDate")?.value;

  // ─── Проверка на заполнение обязательных полей ────────────────
  if (!from || !to || !departureDate || (isRoundTrip && !returnDate)) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  // ─── Сохраняем значения в localStorage ────────────────────────
  localStorage.setItem("lastFrom", from);
  localStorage.setItem("lastTo", to);
  localStorage.setItem("lastDepartureDate", departureDate);
  if (isRoundTrip) localStorage.setItem("lastReturnDate", returnDate);

  showLoading();

  try {
    // 🔐 Получаем access token для Amadeus
    const token = await getAmadeusToken();

    // 🔍 Ищем IATA-коды по названиям городов
    const fromCode = await fetchCityIATA(from, token);
    const toCode = await fetchCityIATA(to, token);

    console.log("📍 IATA:", fromCode, toCode);

    if (!fromCode || !toCode) {
      alert("Города не найдены.");
      return;
    }

// ✈️ Запрашиваем рейсы туда
let departureFlights = await fetchAmadeusFlights(fromCode.code, toCode.code, departureDate, token);
console.log("🛫 Найдено рейсов туда (Amadeus):", departureFlights);

// 🔁 Fallback на Aviasales, если Amadeus ничего не вернул
if (!Array.isArray(departureFlights) || !departureFlights.length) {
  console.warn("🔁 Fallback: запрашиваем рейсы из Aviasales");
  const fallback = await fetchAviasalesFlights(fromCode.code, toCode.code, departureDate);

  if (Array.isArray(fallback) && fallback[0]?.departure_at) {
    departureFlights = fallback;
    console.log("🛫 Найдено рейсов туда (Aviasales):", departureFlights);
  } else {
    console.error("❌ Ошибка: некорректный ответ от Aviasales:", fallback);
    departureFlights = [];
  }
}

let returnFlights = [];
if (isRoundTrip) {
  returnFlights = await fetchAmadeusFlights(toCode.code, fromCode.code, returnDate, token);
  console.log("🛬 Найдено рейсов обратно (Amadeus):", returnFlights);

  if (!Array.isArray(returnFlights) || !returnFlights.length) {
    console.warn("🔁 Fallback: запрашиваем обратные рейсы из Aviasales");
    const fallbackReturn = await fetchAviasalesFlights(toCode.code, fromCode.code, returnDate);

    if (Array.isArray(fallbackReturn) && fallbackReturn[0]?.departure_at) {
      returnFlights = fallbackReturn;
      console.log("🛬 Найдено рейсов обратно (Aviasales):", returnFlights);
    } else {
      console.warn("❌ Ошибка: некорректный ответ от Aviasales:", fallbackReturn);
      returnFlights = [];
    }
  }
}

const container = document.getElementById("hotDeals");
container.innerHTML = "";
  
if (departureFlights?.length) {
  const title = document.createElement("h3");
  title.textContent = "Рейсы туда:";
  title.className = "text-lg font-semibold mb-2 mt-4";
  container.appendChild(title);
  renderFlights(departureFlights);
}

if (isRoundTrip && returnFlights?.length) {
  const titleBack = document.createElement("h3");
  titleBack.textContent = "Рейсы обратно:";
  titleBack.className = "text-lg font-semibold mb-2 mt-4";
  container.appendChild(titleBack);
  renderFlights(returnFlights);
}

if (!departureFlights?.length && (!isRoundTrip || !returnFlights?.length)) {
  container.innerHTML = `<div class="text-center text-gray-500 mt-4">Рейсы не найдены</div>`;
  Telegram.WebApp.sendData?.("😢 Рейсы не найдены.");
} else {
  Telegram.WebApp.sendData?.(`✈️ Найдены рейсы: ${from} → ${to}${isRoundTrip ? " и обратно" : ""}`);
}

trackEvent("Поиск рейсов", {
  from,
  to,
  departureDate,
  returnDate: isRoundTrip ? returnDate : null,
  isRoundTrip,
  count: (departureFlights.length || 0) + (returnFlights.length || 0)
});

  } catch (err) {
    console.error("❌ Ошибка при поиске рейсов:", err);
    Telegram.WebApp.sendData?.("❌ Ошибка загрузки рейсов.");
    trackEvent("Ошибка загрузки рейсов", err.message);
  } finally {
    hideLoading();
  }
});

// ─── Очистка формы рейсов ───────────────────────────────────────
document.getElementById('clearFlights')?.addEventListener('click', () => {
  fromInput.value = '';
  toInput.value = '';
  departureInput.value = '';
  document.getElementById('returnDate').value = '';
  document.getElementById('roundTrip').checked = false;

  document.getElementById('returnDateWrapper')?.classList.add('hidden');
  document.getElementById('hotDeals').innerHTML = '';

  localStorage.removeItem("lastFrom");
  localStorage.removeItem("lastTo");
  localStorage.removeItem("lastDepartureDate");
  localStorage.removeItem("lastReturnDate");

  fromInput.focus();

  trackEvent?.("Очистка формы рейсов", "Пользователь сбросил поля и кэш");
});

// ─── Поиск достопримечательностей ───────────────────────────────
const placeCityInput = document.getElementById("placeCity");
const placeCategorySelect = document.getElementById("placeCategory");
const resultBlock = document.getElementById("placesResult");

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

placeCityInput?.setAttribute("autofocus", "autofocus");

document.getElementById("placeForm")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const city = placeCityInput.value.trim().toLowerCase();
  const category = placeCategorySelect.value;

  localStorage.setItem("placeCity", city);
  localStorage.setItem("placeCategory", category);

  const dummyPlaces = [
    { name: "Castelo de São Jorge", description: "Древняя крепость с видом на Лиссабон", city: "лиссабон", category: "culture", image: "https://picsum.photos/300/180?random=1" },
    { name: "Miradouro da Senhora do Monte", description: "Лучший панорамный вид на город", city: "лиссабон", category: "nature", image: "https://picsum.photos/300/180?random=2" },
    { name: "Oceanário de Lisboa", description: "Современный океанариум", city: "лиссабон", category: "fun", image: "https://picsum.photos/300/180?random=3" },
    { name: "Time Out Market", description: "Фудкорт и рынок в центре города", city: "лиссабон", category: "food", image: "https://picsum.photos/300/180?random=4" },
    { name: "Centro Colombo", description: "Крупный торговый центр", city: "лиссабон", category: "shopping", image: "https://picsum.photos/300/180?random=5" }
  ];

  resultBlock.classList.remove("visible");
  resultBlock.innerHTML = "";

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

  renderPlaces(firstBatch, resultBlock);

  if (remaining.length > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.textContent = "Показать ещё";
    moreBtn.className = "btn w-full mt-4 bg-blue-500 text-white text-sm rounded py-2 px-4";

    moreBtn.addEventListener("click", () => {
      renderPlaces(remaining, resultBlock);
      animateCards("#placesResult .card");
      updateHearts("places");
      moreBtn.remove();

      setTimeout(() => {
        resultBlock.querySelectorAll(".card")[3]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    });

    resultBlock.appendChild(moreBtn);
  }

  resultBlock.classList.add("visible");
  animateCards("#placesResult .card");

  trackEvent("Поиск мест", { city, category });
});

// ─── Рендер карточек мест ────────────────────────────────────────
function renderPlaces(places, container) {
  const t = translations?.[window._appLang] || {};
  const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");

  const html = places.map(p => {
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
            data-place-id="${encodeURIComponent(JSON.stringify(p))}">
            ${isFav ? "💙" : "🤍"}
          </button>
        </div>
      </div>
    `;
  }).join("");

  container.insertAdjacentHTML("beforeend", html);
}

// ─── Вспомогательные утилиты ─────────────────────────────────────
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatCategory(cat) {
  const map = {
    culture: "Культура",
    nature: "Природа",
    fun: "Развлечения",
    food: "Еда",
    shopping: "Шопинг"
  };
  return map[cat] || cat;
}

function animateCards(selector) {
  const cards = document.querySelectorAll(selector);
  cards.forEach((card, i) => {
    setTimeout(() => {
      card.classList.remove("opacity-0", "scale-95");
      card.classList.add("opacity-100", "scale-100");
    }, i * 100);
  });
}

function updateHearts(type) {
  const items = document.querySelectorAll(`[data-${type.slice(0, -1)}-id]`);
  const storage = JSON.parse(localStorage.getItem(`favorites_${type}`) || "[]");

  items.forEach(item => {
    const data = decodeURIComponent(item.dataset[`${type.slice(0, -1)}Id`]);
    const parsed = JSON.parse(data);
    const isFav = storage.some(f => f.name === parsed.name && f.city === parsed.city);
    item.innerHTML = isFav ? "💙" : "🤍";
  });
}

function toggleFavoritePlaceFromEncoded(encoded, element) {
  const place = JSON.parse(decodeURIComponent(encoded));
  const key = "favorites_places";
  const favs = JSON.parse(localStorage.getItem(key) || "[]");

  const exists = favs.find(f => f.name === place.name && f.city === place.city);
  const updated = exists ? favs.filter(f => !(f.name === place.name && f.city === place.city)) : [...favs, place];

  localStorage.setItem(key, JSON.stringify(updated));
  element.innerHTML = exists ? "🤍" : "💙";

  trackEvent("Избранное", {
    type: "place",
    action: exists ? "remove" : "add",
    place: place.name,
  });
}
// ─── Лог выхода (длительность сессии) ────────────────────────────
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - window.appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});
