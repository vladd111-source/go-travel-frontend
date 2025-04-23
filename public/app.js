import { showLoading, hideLoading } from './globals.js';
import {
  renderHotels,
  renderFlights,
  renderPlaces,
  renderFavoriteHotels,
  trackHotelClick,
  generateTripLink,
} from './render.js';

const iataCache = {};

async function getIataCode(city) {
  const lang = localStorage.getItem("lang") || "ru";
  const normalized = city.trim().toLowerCase();
  const cacheKey = `${normalized}_${lang}`;

  if (iataCache[cacheKey]) return iataCache[cacheKey];

  const url = `https://autocomplete.travelpayouts.com/places2?term=${encodeURIComponent(city)}&locale=${lang}&types[]=city`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    const match = json.find(item => 
      item.name?.toLowerCase() === normalized ||
      item.city_name?.toLowerCase().includes(normalized)
    );

    const code = match?.code?.toUpperCase();
    if (code) iataCache[cacheKey] = code;
    return code || null;
  } catch (err) {
    console.error("❌ Ошибка при получении IATA:", err);
    return null;
  }
}

let lastSearchTime = 0;

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

window.translations = window.translations || {};
window.translations = {
  ru: {
    hotelResults: "Результаты отелей",
    noHotelsFound: "Отели не найдены.",
    bookNow: "Забронировать"
  },
  en: {
    hotelResults: "Hotel Results",
    noHotelsFound: "No hotels found.",
    bookNow: "Book Now"
  }
};


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

  document.getElementById("hotelForm")?.addEventListener("submit", (e) => {
    e.preventDefault();
    showLoading();

    const city = hotelCityInput.value.trim();
    const checkIn = document.getElementById("checkIn")?.value || "";
    const checkOut = document.getElementById("checkOut")?.value || "";
    const useFilters = document.getElementById("toggleFilters")?.checked;

    const maxPrice = parseFloat(priceRange.value) || Infinity;
    const minRating = parseFloat(document.getElementById("minRating").value) || 0;

    localStorage.setItem("lastHotelCity", city);

    const query = new URLSearchParams({ city, checkIn, checkOut }).toString();

    fetch(`https://go-travel-backend.vercel.app/api/hotels?${query}`)
      .then(res => res.json())
      .then(data => {
        console.log("🧾 Ответ от API:", data);

        if (!Array.isArray(data)) {
          throw new Error("API вернул не массив отелей");
        }

        const filtered = data.filter(h => {
          if (!useFilters) return true; // 🔓 если фильтры отключены — не фильтруем

          return (
            h.price <= maxPrice &&
            h.rating >= minRating &&
            (!city || h.city.toLowerCase().includes(city.toLowerCase()))
          );
        });

        const t = window.translations?.[window._appLang] || {};
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
                     <button 
  class="text-xl ml-2"
  data-hotel="${encodeURIComponent(JSON.stringify(h))}"
  data-hotel-id="${hotelId}"
  onclick="toggleFavoriteHotelFromAttr(this)">
  ${isFav ? "💙" : "🤍"}
</button>
                    </div>
                  </div>
                `;
              }).join("")
            : `<p class='text-sm text-gray-500'>${t.noHotelsFound}</p>`
        );

        updateHearts("hotels");
        resultBlock.classList.add("visible");
        animateCards("#hotelsResult .card");

        trackEvent("Поиск отеля", {
          city,
          checkIn,
          checkOut,
          maxPrice,
          minRating,
          filtersUsed: useFilters,
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

lastSearchTime = 0;

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

placeCityInput.setAttribute("autofocus", "autofocus");

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

  updateHearts("places");

  if (remaining.length > 0) {
    const moreBtn = document.createElement("button");
    moreBtn.textContent = "Показать ещё";
    moreBtn.className = "btn w-full mt-4 bg-blue-500 text-white text-sm rounded py-2 px-4";

    moreBtn.addEventListener("click", () => {
      const remainingCards = remaining.map(p => {
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
                data-place-id="${encodeURIComponent(JSON.stringify(p))}"
              >
                ${isFav ? "💙" : "🤍"}
              </button>
            </div>
          </div>
        `;
      }).join("");

      resultBlock.insertAdjacentHTML("beforeend", remainingCards);
      animateCards("#placesResult .card");
      updateHearts("places");

      setTimeout(() => {
        const cards = resultBlock.querySelectorAll(".card");
        cards[3]?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

      moreBtn.remove();
    });

    resultBlock.appendChild(moreBtn);
  }

  resultBlock.classList.add("visible");
  animateCards("#placesResult .card");

  trackEvent("Поиск мест", { city, category });
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
