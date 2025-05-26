import { renderHotels, renderFlights, renderPlaces } from './render.js';
import { fetchPlaces, showLoading, hideLoading, askGptAdvisor } from './globals.js';
import { parsePlacesFromGpt } from './globals.js';

export async function searchHotels(city, checkIn, checkOut) {
  try {
    const query = new URLSearchParams({ city, checkIn, checkOut });

    const res = await fetch(`https://go-travel-backend.vercel.app/api/hotels?${query.toString()}`);

    if (!res.ok) {
      const errText = await res.text();
      alert(`❌ Ошибка загрузки отелей: ${res.status} — ${errText}`);
      throw new Error(`Ошибка сервера: ${res.status} — ${errText}`);
    }

    const hotels = await res.json();
    return Array.isArray(hotels) ? hotels : [];
  } catch (err) {
    console.error("❌ Ошибка получения отелей:", err.message || err);
    alert(`⚠️ Произошла ошибка при поиске отелей:\n${err.message || "Неизвестная ошибка"}`);
    return [];
  }
}

let lastSearchTime = 0;

// 🔁 Повтор при 429 (без async/await)
function retryFetch(url, options = {}, retries = 6, backoff = 2000) {
  return new Promise((resolve, reject) => {
    function attempt(tryIndex, currentDelay) {
      fetch(url, options)
        .then(res => {
          if (res.status !== 429) {
            resolve(res);
          } else if (tryIndex < retries - 1) {
            console.warn(`⚠️ Повтор (${tryIndex + 1}) из-за 429`);
            setTimeout(() => attempt(tryIndex + 1, currentDelay * 1.5), currentDelay);
          } else {
            reject(new Error("❌ Превышен лимит запросов (после повторов)"));
          }
        })
        .catch(err => {
          if (tryIndex < retries - 1) {
            console.warn(`⚠️ Ошибка запроса, повтор (${tryIndex + 1})`, err);
            setTimeout(() => attempt(tryIndex + 1, currentDelay * 1.5), currentDelay);
          } else {
            reject(err);
          }
        });
    }

    attempt(0, backoff);
  });
}


async function getIataCode(cityName) {
  try {
    const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(cityName)}&locale=ru&types[]=city`;
    const res = await fetch(url);
    const data = await res.json();
    return data?.[0]?.code || null;
  } catch (err) {
    console.error("❌ Ошибка при получении IATA-кода:", err);
    return null;
  }
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

    // ✅ Установка языка и переключатель
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
    if (lastTab === "sights") {
      lastTab = "places";
      localStorage.setItem("activeTab", "places");
    }
    showTab(lastTab);

    // ✅ Автофокус безопасно
    setTimeout(() => {
      if (typeof window.focusFirstInputIn === "function") {
        window.focusFirstInputIn(lastTab);
      } else {
        console.warn("⚠️ focusFirstInputIn пока не доступна");
      }
    }, 200);

    // ✅ Плавное появление
    setTimeout(() => {
      document.body.classList.remove("opacity-0");
    }, 100);

    // 💡 Ограничение поля рейтинга
    const ratingInput = document.getElementById("minRating");
    if (ratingInput) {
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

    // 📊 Отправка события
    trackEvent("Загрузка приложения", {
      lang: window._appLang,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("❌ Ошибка при инициализации:", e);
  }
});

// ✅ Логика для чекбокса "Туда и обратно"
const roundTripCheckbox = document.getElementById("roundTrip");
const returnDateWrapper = document.getElementById("returnDateWrapper");
const returnDateInput = document.getElementById("returnDate");

if (roundTripCheckbox && returnDateWrapper && returnDateInput) {
  function updateReturnDateVisibility() {
    const show = roundTripCheckbox.checked;

    // Показываем/скрываем безопасно
    returnDateWrapper.classList.toggle("hidden", !show);

    if (show) {
      returnDateInput.removeAttribute("disabled");
      returnDateInput.setAttribute("required", "true");
      returnDateInput.setAttribute("name", "returnDate");
    } else {
      returnDateInput.setAttribute("disabled", "true");
      returnDateInput.removeAttribute("required");
      returnDateInput.removeAttribute("name");
      returnDateInput.value = ""; // сброс значения
    }
  }

  // 👇 Сделаем доступной глобально, чтобы вызывать при сабмите формы
  window.updateReturnDateVisibility = updateReturnDateVisibility;

  // Восстанавливаем из localStorage
  const saved = localStorage.getItem("roundTripChecked");
  if (saved === "1") roundTripCheckbox.checked = true;

  updateReturnDateVisibility(); // инициализация при загрузке

  // ✅ Ограничение: дата возврата не может быть раньше даты вылета
  const departureDateInput = document.getElementById("departureDate");
  if (departureDateInput && returnDateInput) {
    departureDateInput.addEventListener("change", () => {
      const depValue = departureDateInput.value;
      if (depValue) {
        returnDateInput.setAttribute("min", depValue);
        if (returnDateInput.value && returnDateInput.value < depValue) {
          returnDateInput.value = "";
        }
      }
    });
  }

  roundTripCheckbox.addEventListener("change", () => {
    updateReturnDateVisibility();
    localStorage.setItem("roundTripChecked", roundTripCheckbox.checked ? "1" : "0");
  });
}

// ✅ Показ/скрытие фильтров
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
  toggleVisibility();
}

// ✅ Инициализация ползунка и tooltip
const priceRange = document.getElementById("priceRange");
if (priceRange) {
  priceRange.value = 250;
  priceRange.addEventListener("input", updatePriceTooltip);
  window.addEventListener("resize", updatePriceTooltip);
  window.addEventListener("load", updatePriceTooltip);
}

// ✅ Поиск отелей
const hotelCityInput = document.getElementById("hotelCity");

if (hotelCityInput) {
  const cachedCity = localStorage.getItem("lastHotelCity");
  if (cachedCity) hotelCityInput.value = cachedCity;

  hotelCityInput.setAttribute("autofocus", "autofocus");

// Новый обработчик поиска отелей с проверками
document.getElementById('hotelForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const city = document.getElementById('hotelCity')?.value.trim();
  const checkIn = document.getElementById('checkIn')?.value;
  const checkOut = document.getElementById('checkOut')?.value;

  if (!city) {
    alert('⚠️ Введите город');
    return;
  }

  if (!checkIn || !checkOut) {
    alert("⚠️ Укажите даты заезда и выезда");
    return;
  }

  const now = new Date();
  const dateIn = new Date(checkIn);
  const dateOut = new Date(checkOut);

  if (dateIn < now.setHours(0, 0, 0, 0)) {
    alert("⛔ Дата заезда не может быть в прошлом");
    return;
  }

  if (dateOut <= dateIn) {
    alert("⛔ Дата выезда должна быть позже даты заезда");
    return;
  }

  showLoading();

  try {
   const hotelsRaw = await searchHotels(city, checkIn, checkOut);
console.log("📦 Hotels from API (raw):", hotelsRaw);

// Правка: убедимся, что hotelId всегда есть
  const dateIn = new Date(checkIn);
const dateOut = new Date(checkOut);
const nights = Math.max(1, (dateOut - dateIn) / (1000 * 60 * 60 * 24));


    
const hotels = hotelsRaw
  .filter(h => (h.hotelId || h.id)) // ID обязателен, но не цена
  .map(h => {
    const hotelId = h.hotelId || h.id;
    const rawPrice = h.priceFrom || h.fullPrice || h.minPrice || 0;

    return {
      id: hotelId,
      hotelId,
      name: h.hotelName || h.name || "Без названия",
      city: h.city || h.location?.name || city || "Город неизвестен",
      fullPrice: rawPrice,
      pricePerNight: nights > 0 ? rawPrice / nights : rawPrice,
      rating: h.rating || (h.stars ? h.stars * 2 : 0),
      image: h.image || `https://photo.hotellook.com/image_v2/crop/${hotelId}/2048/1536.auto`,
      property_type: h.property_type || ""
    };
  })
  .filter(h => h.fullPrice > 0); // фильтрация только после нормализации


    
    renderHotels(hotels);
  } catch (err) {
    console.error('❌ Ошибка поиска отелей:', err);
    alert('Ошибка загрузки отелей. Попробуйте позже.');
  } finally {
    hideLoading();
  }
});
}


// ✅ Поиск рейсов (включая "Туда и обратно")
document.getElementById("search-form")?.addEventListener("submit", async (e) => {
   e.preventDefault();
  // Обновляем видимость и доступность returnDate перед валидацией
window.updateReturnDateVisibility?.();
  const isHotOnly = document.getElementById("hotOnly")?.checked;

  if (isHotOnly) {
    const fromInput = document.getElementById("from");
    const from = fromInput?.value.trim().toUpperCase();

    if (!from) {
      alert("Укажите город отправления.");
      return;
    }

    localStorage.setItem("lastFrom", from);
    await loadHotDeals(); // уже должен быть у тебя
    return;
  }
  const fromInput = document.getElementById("from");
  const toInput = document.getElementById("to");
  const departureInput = document.getElementById("departureDate");
  const returnInput = document.getElementById("returnDate");
  const roundTripCheckbox = document.getElementById("roundTrip");

  const fromCity = fromInput?.value.trim();
  const toCity = toInput?.value.trim();
  const departureDate = departureInput?.value;
  const returnDate = returnInput?.value;
  const isRoundTrip = roundTripCheckbox?.checked;

  if (!fromCity || !toCity || !departureDate || (isRoundTrip && !returnDate)) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  // Получаем IATA коды через API
  const from = fromCity.length === 3 ? fromCity.toUpperCase() : await getIataCode(fromCity);
  const to = toCity.length === 3 ? toCity.toUpperCase() : await getIataCode(toCity);

  if (!from || !to) {
    alert("⛔ Не удалось определить IATA-коды для указанных городов.");
    return;
  }

  const now = Date.now();
  if (now - lastSearchTime < 1000) {
    alert("⏳ Подождите немного перед новым запросом.");
    return;
  }
  lastSearchTime = now;

  localStorage.setItem("lastFrom", fromCity);
  localStorage.setItem("lastTo", toCity);
  localStorage.setItem("lastDepartureDate", departureDate);
  if (isRoundTrip) {
    localStorage.setItem("lastReturnDate", returnDate);
  }

  showLoading();
  const hotDeals = document.getElementById("hotDeals");
  hotDeals.innerHTML = "";

  let flightsOut = [];
  let flightsBack = [];

  const encode = str => encodeURIComponent(str.trim());

try {
  // ✈️ Запрос рейсов туда
  const urlOut = `https://go-travel-backend.vercel.app/api/flights?from=${encode(from)}&to=${encode(to)}&date=${departureDate}`;
  const resOut = await retryFetch(urlOut);
  if (!resOut.ok) throw new Error(`Ошибка рейсов туда: ${resOut.status}`);
  flightsOut = await resOut.json();
  await renderFlights(flightsOut, from, to, "Рейсы туда", "hotDeals", true); // очищаем контейнер

  // 🔁 Запрос рейсов обратно
  if (isRoundTrip && returnDate) {
    await new Promise(r => setTimeout(r, 1200)); // небольшая задержка

    const urlBack = `https://go-travel-backend.vercel.app/api/flights?from=${encode(to)}&to=${encode(from)}&date=${returnDate}`;
    const resBack = await retryFetch(urlBack);
    if (!resBack.ok) throw new Error(`Ошибка рейсов обратно: ${resBack.status}`);
    flightsBack = await resBack.json();
    await renderFlights(flightsBack, to, from, "Рейсы обратно", "hotDeals", false); // НЕ очищаем
  }

  // 📲 Telegram WebApp аналитика
  if (Array.isArray(flightsOut) && flightsOut.length > 0) {
    const top = flightsOut[0];
    const msg = `✈️ Нашли рейс\n🛫 ${top.origin || top.from || "?"} → 🛬 ${top.destination || top.to || "?"}\n📅 ${top.date || top.departure_at?.split("T")[0] || "?"}\n💰 $${top.price || top.value || "?"}`;
    Telegram.WebApp?.sendData?.(msg);
    trackEvent("Поиск рейса", msg);
  } else {
    Telegram.WebApp?.sendData?.("😢 Рейсы не найдены.");
    trackEvent("Поиск рейса", "Ничего не найдено");
  }

} catch (err) {
  console.error("❌ Ошибка при загрузке рейсов:", err);
  Telegram.WebApp?.sendData?.("❌ Ошибка загрузки рейсов.");
  trackEvent("Ошибка загрузки рейсов", err.message);

} finally {
  hideLoading();
}
});
// ✅ Горячие предложения (по умолчанию из MOW или другого города)
document.getElementById("loadHotDeals")?.addEventListener("click", async () => {
  await loadHotDeals(); // загружаем предложения
});

// 🧠 Загрузка горячих предложений (по городу отправления)
async function loadHotDeals() {
  showLoading();
  try {
    const fromInput = document.getElementById("from");
    const fromCity = fromInput?.value.trim();

    if (!fromCity) {
      alert("Введите город отправления.");
      hideLoading();
      return;
    }

    const origin = fromCity.length === 3 ? fromCity.toUpperCase() : await getIataCode(fromCity);

    if (!origin) {
      alert("Не удалось определить IATA-код для указанного города.");
      hideLoading();
      return;
    }

    localStorage.setItem("lastFrom", origin);

    const url = `https://go-travel-backend.vercel.app/api/hot-deals?origin=${origin}`;
    const res = await fetch(url);
    const { deals, title } = await res.json();

    renderFlights(deals, origin, "Популярные направления", title || "🔥 Горячие предложения");
  } catch (err) {
    console.error("❌ Ошибка загрузки hot deals:", err);
    alert("Не удалось загрузить горячие предложения.");
  } finally {
    hideLoading();
  }
}

// 🧼 Обработчик кнопки "Очистить"
document.getElementById("clearFlights")?.addEventListener("click", () => {
  document.getElementById("from").value = "";
  document.getElementById("to").value = "";
  document.getElementById("departureDate").value = "";
  document.getElementById("returnDate").value = "";
  document.getElementById("roundTrip").checked = false;

  document.getElementById("hotDeals").innerHTML = "";

  localStorage.removeItem("lastFrom");
  localStorage.removeItem("lastTo");
  localStorage.removeItem("lastDepartureDate");
  localStorage.removeItem("lastReturnDate");

  console.log("🧼 Очищено: поля, localStorage, и результаты");
});

// ✅ Поиск мест
const placeCityInput = document.getElementById("placeCity");
const placeMoodSelect = document.getElementById("placeMood");
const resultBlock = document.getElementById("placesResult");

if (placeCityInput) {
  const cachedCity = localStorage.getItem("placeCity");
  if (cachedCity) placeCityInput.value = cachedCity;
  placeCityInput.addEventListener("input", (e) => {
    localStorage.setItem("placeCity", e.target.value.trim());
  });
}

if (placeMoodSelect) {
  const cachedMood = localStorage.getItem("placeMood");
  if (cachedMood) placeMoodSelect.value = cachedMood;
  placeMoodSelect.addEventListener("change", (e) => {
    localStorage.setItem("placeMood", e.target.value);
  });
}

placeCityInput.setAttribute("autofocus", "autofocus");

document.getElementById("placeForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const city = placeCityInput.value.trim().toLowerCase();
  const mood = placeMoodSelect.value;

  localStorage.setItem("placeCity", city);
  localStorage.setItem("placeMood", mood);

  resultBlock.classList.remove("visible");
  resultBlock.innerHTML = "";

  try {
    const gptRaw = await askGptAdvisor(`
Ты местный инсайдер, знаешь самые атмосферные, нестандартные и редкие точки. Составь подборку для насыщенного дня в городе "${city}" под настроение "${mood}". 

Включи:
— топовые маршруты, 
— уникальные места, 
— секретные локации и события (если есть).

Формат ответа строго такой:
1. Название
Описание: ...
Адрес (на английском языке): ...
Фото (реальная прямая ссылка на изображение в .jpg или .png, без редиректов и без example.com): https://...

Без текста вне списка. Только 3 карточки.`);

    const parsedPlaces = parsePlacesFromGpt(gptRaw).slice(0, 3);

    const gptCardsArr = [];

    for (const p of parsedPlaces) {
      const favPlaces = JSON.parse(localStorage.getItem("favorites_places") || "[]");
      const isFav = favPlaces.some(fav => fav.name === p.name && fav.city === city);

      const { url: imageUrl } = await getUnsplashImage(`${p.name} ${city}`);

      const mapLink = p.address
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`
        : "#";

      gptCardsArr.push(`
        <div class="card bg-white p-4 rounded-xl shadow hover:shadow-md transition-all duration-300 opacity-0 transform scale-95">
          <img 
            src="${imageUrl}" 
            alt="${p.name}" 
            class="w-full h-40 object-cover rounded-md mb-3 bg-gray-100"
            referrerpolicy="no-referrer"
            loading="lazy"
            onerror="this.onerror=null;this.src='https://placehold.co/300x180?text=No+Image';"
          />
          <h3 class="text-lg font-semibold mb-1">${p.name}</h3>
          <p class="text-sm text-gray-600 mb-1">${p.description}</p>
          <a href="${mapLink}" target="_blank" class="text-sm text-blue-600 underline">
            ${p.address || "Адрес не указан"}
          </a>
          <div class="flex justify-between items-center mt-2">
            <a href="${mapLink}" target="_blank" class="btn mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded">
              📍 Подробнее
            </a>
            <button 
              onclick="toggleFavoritePlaceFromEncoded('${encodeURIComponent(JSON.stringify({ ...p, city, mood }))}', this)" 
              class="text-xl ml-2"
            >
              ${isFav ? "💙" : "🤍"}
            </button>
          </div>
        </div>
      `);
    }

    resultBlock.innerHTML = gptCardsArr.join("");
    animateCards("#placesResult .card");
    updateHearts("places");
    Telegram.WebApp?.sendData?.(`🌍 Места в ${city}, настроение "${mood}" получены`);
  } catch (err) {
    console.warn("❌ GPT карточки мест не получены:", err);
    resultBlock.innerHTML = `<p class="text-sm text-gray-500">Не удалось получить рекомендации. Попробуйте позже.</p>`;
  }

  resultBlock.classList.add("visible");
  trackEvent("Поиск мест", { city, mood });
});


// ✅ Сохранение длительности сессии
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - window.appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});

document.getElementById("hotOnly")?.addEventListener("change", (e) => {
  const isChecked = e.target.checked;

  // Находим обёртки (родители input'ов)
  const toGroup = document.getElementById("to")?.parentElement;
  const departureGroup = document.getElementById("departureDate")?.parentElement;
  const returnGroup = document.getElementById("returnDate")?.parentElement;
  const roundTripGroup = document.getElementById("roundTrip")?.parentElement;
  const clearBtn = document.getElementById("clearFlights");

  const toggle = (el, show) => {
    if (el) el.style.display = show ? "" : "none";
  };

  // Показываем/скрываем группы
  toggle(toGroup, !isChecked);
  toggle(departureGroup, !isChecked);
  toggle(returnGroup, !isChecked);
  toggle(roundTripGroup, !isChecked);
  toggle(clearBtn, !isChecked);

  // ✂️ required
  const toInput = document.getElementById("to");
  const departureInput = document.getElementById("departureDate");

  if (isChecked) {
    toInput?.removeAttribute("required");
    departureInput?.removeAttribute("required");
  } else {
    toInput?.setAttribute("required", "true");
    departureInput?.setAttribute("required", "true");
  }
});
