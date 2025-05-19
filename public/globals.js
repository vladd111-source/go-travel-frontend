// ❌ ничего не импортируем — просто используем window.generateAviasalesLink()
import { renderFlights, renderHotels, renderPlaces, generateAviasalesLink } from './render.js';
// ✅ Supabase init
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Глобальные переводы
window.translations = {
  ru: {
    flights: "✈️ Билеты",
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
    priceTo: "Цена",
    ratingMin: "Рейтинг",
    findHotel: "Найти отель",
    findSights: "Показать места",
    bookNow: "Забронировать",
    time: "Время",
    duration: "В пути",
    hotDeal: "Горячее предложение"
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
    bookNow: "Book Now",
    time: "Time",
    duration: "Duration",
    hotDeal: "Hot Deal"
  }
};


export async function askGptAdvisor(question) {
  const telegramId = window._telegramId || "unknown";
  const mode = document.getElementById("gptMode")?.value || "basic";

  // 🚨 Проверка данных перед отправкой
  if (!question || !telegramId) {
    console.warn("⚠️ Пропущен вопрос или Telegram ID", { question, telegramId });
    return "❌ Не хватает данных для запроса.";
  }

  try {
    const res = await fetch("https://go-travel-backend.vercel.app/api/gpt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, telegramId, mode })
    });

    // 🧪 Проверяем ответ
    const data = await res.json();
    if (res.ok && data.answer) {
      return data.answer;
    } else {
      console.warn("❌ GPT вернул ошибку:", data);
      return "🤖 Что-то пошло не так. Попробуй позже.";
    }
  } catch (err) {
    console.error("❌ GPT fetch error:", err);
    return "⚠️ Не удалось подключиться к серверу.";
  }
}


export function showFlightModal(flight) {
  // 🔧 Подстраховка: если нет departure_at, подставим date
  if (!flight.departure_at) {
    flight.departure_at = flight.date || "";
  }

  const from = flight.from || flight.origin || "—";
  const to = flight.to || flight.destination || "—";
  const date = (flight.date || flight.departure_at || "").split("T")[0] || "—";
  const price = flight.price || flight.value || "—";
  const airline = flight.airline || "Авиакомпания";

  // 🕒 Время вылета
  const departureTime = formatTime(flight.departure_at);

  // ⏱ Длительность (в минутах)
  const duration = parseInt(flight.duration || flight.flight_duration || 0, 10);

  // 🛬 Время прибытия = Вылет + Длительность
  let arrivalTime = "—";
  if (!isNaN(duration) && flight.departure_at) {
    const arrival = new Date(new Date(flight.departure_at).getTime() + duration * 60000);
    arrivalTime = formatTime(arrival);
  }

  const link = generateAviasalesLink(flight);

  const html = `
    <h2 class="text-xl font-semibold mb-2">${from} → ${to}</h2>
    <p class="mb-1 text-gray-700">📅 Дата: ${date}</p>
    <p class="mb-1 text-gray-700">🕒 Вылет: ${departureTime}</p>
    <p class="mb-1 text-gray-700">⏱ В пути: ${formatDuration(duration)}</p>
    <p class="mb-1 text-gray-700">🛬 Прибытие: ${arrivalTime}</p>
    <p class="mb-1 text-gray-700">💺 Авиакомпания: ${airline}</p>
    <p class="mb-3 text-gray-700">💰 Цена: $${price}</p>
    ${link && link !== "#" ? `
      <a href="${link}" target="_blank"
        class="btn bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded w-full block text-center">
        Перейти к бронированию на Aviasales
      </a>
    ` : `<p class="text-red-500 text-sm">⚠️ Ссылка недоступна</p>`}
  `;

  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("detailsModal").classList.remove("hidden");
}

// ✅ Формат времени и длительности
function formatTime(datetimeStr) {
  if (!datetimeStr) return "—";
  const date = new Date(datetimeStr);
  return date.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function formatDuration(minutes) {
  if (!minutes || isNaN(minutes)) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const lang = localStorage.getItem("lang") || "ru";

  return lang === "ru"
    ? `${h}ч ${m}м`
    : `${h}h ${m}m`;
}

// 👇 Сделаем глобальными
window.formatTime = formatTime;
window.formatDuration = formatDuration;

// 👇 Сделать глобально доступной, если вызываешь из HTML
window.showFlightModal = showFlightModal;

function applyTranslations(lang) {
  const fallback = translations["ru"];
  const t = translations[lang] || fallback;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    if (t[key]) {
      el.textContent = t[key];
    } else if (fallback[key]) {
      el.textContent = fallback[key];
      console.warn(`⚠️ Нет перевода для "${key}" в "${lang}", использован RU`);
    } else {
      console.warn(`❌ Нет перевода для ключа: "${key}"`);
    }
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach(el => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (t[key]) {
      el.placeholder = t[key];
    } else if (fallback[key]) {
      el.placeholder = fallback[key];
      console.warn(`⚠️ Нет placeholder перевода для "${key}" в "${lang}", использован RU`);
    } else {
      console.warn(`❌ Нет placeholder перевода для ключа: "${key}"`);
    }
  });
}
window.trackEvent = function(name, data = "") {
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
};

function logEventToAnalytics(eventName, eventData = {}) {
  const userId = window._telegramId;
  if (!userId) {
    console.warn("⚠️ Нет Telegram ID — аналитика не записана");
    return;
  }
  const sessionId = localStorage.getItem("session_id") || (window.crypto?.randomUUID?.() || Date.now().toString());
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

window.showTab = function(id) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.remove('active');
    tab.classList.add('hidden');
  });
  const selectedTab = document.getElementById(id);
  if (selectedTab) {
    selectedTab.classList.remove('hidden');
    selectedTab.classList.add('active');
  }
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('bg-blue-100', 'text-blue-600', 'shadow-md');
    btn.classList.add('bg-white', 'text-black', 'shadow');
  });
  const activeBtn = document.querySelector(`.tab-btn[onclick*="${id}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('bg-white', 'text-black', 'shadow');
    activeBtn.classList.add('bg-blue-100', 'text-black-600', 'shadow-md');
  }
  localStorage.setItem("activeTab", id);
  window.trackEvent("Переключение вкладки", id);
  if (id === "favorites") {
    window.switchFavTab?.("flights");
  }
};

// ✅ Переключение таба внутри "Избранного"
window.switchFavTab = function(subTab) {
  const tabs = ["flights", "hotels", "places"];
  const validTab = tabs.includes(subTab) ? subTab : "flights";

  const getData = (type) => JSON.parse(localStorage.getItem(`favorites_${type}`) || "[]");

  // 🧠 Если выбранный таб пустой, находим первый непустой
  let selectedTab = validTab;
  if (getData(validTab).length === 0) {
    const firstNonEmpty = tabs.find(t => getData(t).length > 0);
    if (firstNonEmpty) selectedTab = firstNonEmpty;
  }

  // 🔹 Скрываем все блоки
  document.querySelectorAll(".fav-content").forEach(c => {
    c.classList.add("hidden");
    c.innerHTML = "";
  });

  // 🔹 Показываем нужный блок
  const activeContent = document.getElementById(`favContent-${selectedTab}`);
  if (activeContent) {
    activeContent.classList.remove("hidden");
    window.renderFavorites?.(selectedTab);
  } else {
    console.warn(`⚠️ Контейнер favContent-${selectedTab} не найден`);
  }

  // 🔹 Обновляем select (если он есть)
  const select = document.querySelector("#favorites select");
  if (select) select.value = selectedTab;

  // 🔹 Сохраняем выбор
  localStorage.setItem("activeFavTab", selectedTab);

  // 🔹 Обновляем активную кнопку (если есть)
  document.querySelectorAll(".fav-tab-btn").forEach(btn => btn.classList.remove("bg-blue-100"));
  document.getElementById(`favTab-${selectedTab}`)?.classList.add("bg-blue-100");
};

// ✅ Заглавная первая буква
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ✅ Человеческий вывод категории
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

// ✅ Анимация карточек
export function animateCards(selector) {
  setTimeout(() => {
    document.querySelectorAll(selector).forEach(card => {
      card.classList.add("visible", "opacity-100", "scale-100");
      card.classList.remove("opacity-0", "scale-95");
    });
  }, 50);
}

export function showLoading() {
  document.getElementById("loadingSpinner")?.classList.remove("hidden");
}

export function hideLoading() {
  document.getElementById("loadingSpinner")?.classList.add("hidden");
}

window.capitalize = capitalize;
window.formatCategory = formatCategory;
window.animateCards = animateCards;
window.showLoading = showLoading;
window.hideLoading = hideLoading;
window.applyTranslations = applyTranslations;
window.translations = translations;
window.supabase = supabase;

// ✅ Центрируем tooltip над ползунком
window.updatePriceTooltip = function () {
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
};

window.toggleFavoriteFlight = function (encodedDeal, btn) {
  const deal = JSON.parse(decodeURIComponent(encodedDeal));
  const { from, to, date, price } = deal;

  const key = "favorites_flights";
  const list = JSON.parse(localStorage.getItem(key) || "[]");

  const match = list.find(f =>
    f.from === from &&
    f.to === to &&
    f.date === date &&
    parseFloat(f.price) === parseFloat(price)
  );

  const updated = match
    ? list.filter(f => !(f.from === from && f.to === to && f.date === date && parseFloat(f.price) === parseFloat(price)))
    : [...list, { from, to, date, price: parseFloat(price) }];

  localStorage.setItem(key, JSON.stringify(updated));
  btn.innerHTML = match ? "🤍" : "💙";

  trackEvent?.("Избранное: рейс", {
    action: match ? "удалено" : "добавлено",
    route: `${from} → ${to}`,
    date,
    price
  });
};

// 👉 Форматирование деталей
window.formatDetails = function(type, item) {
  const t = translations?.[window._appLang] || {};

  const detailsMap = {
    flights: f => `
      ${t.fromCity || 'Откуда'}: ${f.from}<br>
      ${t.toCity || 'Куда'}: ${f.to}<br>
      ${t.departure || 'Дата'}: ${f.date}<br>
      ${t.priceTo || 'Цена'}: $${f.price}
    `,
    hotels: h => `
      ${t.city || 'Город'}: ${h.city}<br>
      ${t.ratingMin || 'Рейтинг'}: ${h.rating}<br>
      ${t.priceTo || 'Цена'}: $${h.price}
    `,
    places: p => `
      ${p.description}<br>
      ${t.category || 'Категория'}: ${formatCategory(p.category)}<br>
      ${t.city || 'Город'}: ${capitalize(p.city)}
    `
  };

  return detailsMap[type] ? detailsMap[type](item) : '';
};

window.renderCard = function(type, item, index) {
  const titleMap = {
    flights: f => `${f.from} → ${f.to}`,
    hotels: h => h.name,
    places: p => p.name
  };

  const title = titleMap[type] ? titleMap[type](item) : '';
  const details = formatDetails(type, item);

  // Генерация ссылки для перелётов
const hasValidDate = item?.date && /^\d{4}-\d{2}-\d{2}$/.test(item.date);
const aviaLink = (type === "flights" && hasValidDate)
  ? window.generateAviasalesLink({ ...item, departure_at: `${item.date}T00:00:00` })
  : "#";

  return `
    <div class="card bg-white border border-gray-200 p-4 rounded-xl shadow-md mb-4 transition-all duration-300">
      <h3 class="text-lg font-semibold mb-1">${title}</h3>
      <div class="text-sm text-gray-600 mb-2">${details}</div>
      <div class="flex justify-between sm:justify-start gap-2 mt-3 flex-wrap">
        ${
          type === "flights"
            ? `<a href="${aviaLink}" target="_blank" class="btn btn-blue">🔗 Подробнее</a>`
            : `<button class="btn btn-blue" onclick="showDetails('${type}', ${index})">📄 Подробнее</button>`
        }
        <button 
          class="btn btn-delete"
          onclick="removeFavoriteItem('${type}', ${index}, this)">
          🗑 Удалить
        </button>
      </div>
    </div>
  `;
};
  
// ✅ Рендер всех карточек
window.renderFavorites = function(type) {
  const t = translations?.[window._appLang] || {};
  const key = `favorites_${type}`;
  const container = document.getElementById(`favContent-${type}`);
  if (!container) return;

  const data = JSON.parse(localStorage.getItem(key) || '[]');

  if (data.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-sm text-center mt-4">${t.noFavorites || 'Пока нет избранного.'}</p>`;
    return;
  }

  container.innerHTML = data.map((item, index) => renderCard(type, item, index)).join('');
  updateHearts(type);
};

// ✅ Обновление сердечек
window.updateHearts = function(type) {
  const config = {
    flights: {
      storageKey: "favorites_flights",
      dataAttr: "data-flight-id",
      parseItem: btn => btn.getAttribute("data-flight-id"),
      isFav: (favs, item) => favs.includes(item),
    },
    hotels: {
      storageKey: "favorites_hotels",
      dataAttr: "data-hotel-id",
      parseItem: btn => JSON.parse(decodeURIComponent(btn.getAttribute("data-hotel-id"))),
      isFav: (favs, item) => favs.some(h => h.name === item.name && h.city === item.city),
    },
    places: {
      storageKey: "favorites_places",
      dataAttr: "data-place-id",
      parseItem: btn => JSON.parse(decodeURIComponent(btn.getAttribute("data-place-id"))),
      isFav: (favs, item) => favs.some(p => p.name === item.name && p.city === item.city),
    }
  };

  const { storageKey, dataAttr, parseItem, isFav } = config[type] || {};
  if (!storageKey || !dataAttr) return;

  const favs = JSON.parse(localStorage.getItem(storageKey) || "[]");

  document.querySelectorAll(`[${dataAttr}]`).forEach(btn => {
    try {
      const item = parseItem(btn);
      btn.textContent = isFav(favs, item) ? "💙" : "🤍";
    } catch (e) {
      console.error(`Ошибка обновления сердечка [${type}]:`, e);
    }
  });
};

// ✅ Показ модалки с деталями по типу
window.showDetails = function(type, index) {
  const config = {
    flights: {
      storageKey: "favorites_flights",
      template: f => `
        <h2 class="text-xl font-bold mb-2">${f.from} → ${f.to}</h2>
        <p class="text-sm text-gray-500">Дата: ${f.date}</p>
        <p class="text-sm text-gray-500">Цена: $${f.price}</p>
      `
    },
    hotels: {
      storageKey: "favorites_hotels",
      template: h => `
        <h2 class="text-xl font-bold mb-2">${h.name}</h2>
        <p class="text-sm text-gray-500">Город: ${h.city}</p>
        <p class="text-sm text-gray-500">Цена: $${h.price}</p>
        <p class="text-sm text-gray-500">Рейтинг: ${h.rating}</p>
      `
    },
    places: {
      storageKey: "favorites_places",
      template: p => `
        <h2 class="text-xl font-bold mb-2">${p.name}</h2>
        <p class="text-sm text-gray-600 mb-1">${p.description}</p>
        <p class="text-sm text-gray-500">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      `
    }
  };

  const { storageKey, template } = config[type] || {};
  const data = JSON.parse(localStorage.getItem(storageKey) || "[]");
  const item = data[index];
  if (!item) return;

  document.getElementById("modalContent").innerHTML = template(item);
  openModal();
};

// ✅ Добавление/удаление из избранного по типу
window.toggleFavoriteItem = function(type, item, btn) {
  const storageKey = `favorites_${type}`;
  let favorites = JSON.parse(localStorage.getItem(storageKey) || "[]");

  const isSame = (a, b) => {
    if (type === "flights") return a === b;
    return a.name === b.name && a.city === b.city;
  };

  const exists = favorites.some(f => isSame(f, item));
  if (exists) {
    favorites = favorites.filter(f => !isSame(f, item));
    btn.textContent = "🤍";
  } else {
    favorites.push(item);
    btn.textContent = "💙";
  }

  localStorage.setItem(storageKey, JSON.stringify(favorites));
  trackEvent(`Избранное (${type})`, { item, action: exists ? "remove" : "add" });
};

// ✅ Добавление/удаление из избранного по закодированной строке (для мест)
window.toggleFavoritePlaceFromEncoded = function(encoded, btn) {
  try {
    const place = JSON.parse(decodeURIComponent(encoded));
    window.toggleFavoriteItem("places", place, btn);
  } catch (e) {
    console.error("❌ Ошибка при декодировании места:", e);
  }
};

// ✅ Удаление с анимацией
window.removeFavoriteItem = function(type, index, btn = null) {
  const key = `favorites_${type}`;
  let data = JSON.parse(localStorage.getItem(key) || "[]");

  if (btn) {
    const card = btn.closest('.card');
    if (card) {
      card.classList.add('opacity-0', 'scale-95');
      setTimeout(() => {
        data.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(data));
        renderFavorites(type);
      }, 300);
      return;
    }
  }

  data.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(data));
  renderFavorites(type);
};

// ✅ Модалка
window.openModal = function() {
  const modal = document.getElementById("detailsModal");
  modal.classList.remove("hidden");
  modal.classList.add("flex");
};

window.closeModal = function() {
  const modal = document.getElementById("detailsModal");
  modal.classList.remove("flex");
  modal.classList.add("hidden");
};

// ✅ Автофокус на первый input вкладки
window.focusFirstInputIn = function(tabId) {
  const el = document.getElementById(tabId);
  if (!el) return;
  const input = el.querySelector("input");
  if (input) input.focus();
};

// ✅ Загрузка мест с фильтрацией
export async function fetchPlaces(city = "", category = "") {
  try {
    const res = await fetch("https://go-travel-backend.vercel.app/api/places");
    const allPlaces = await res.json();

    const filtered = allPlaces.filter(p =>
      (!city || p.city.toLowerCase().includes(city.toLowerCase())) &&
      (!category || p.category === category)
    );

    return filtered;
  } catch (err) {
    console.error("❌ Ошибка загрузки мест:", err);
    return [];
  }
}

// 🚀 Автозагрузка горячих предложений при первом заходе
window.addEventListener("DOMContentLoaded", async () => {
  const hotDealsBtn = document.getElementById("loadHotDeals");

  const shownBefore = localStorage.getItem("hotDealsShown");

  if (!shownBefore && hotDealsBtn) {
    hotDealsBtn.click();
    localStorage.setItem("hotDealsShown", "1");
  }
});
