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
  }

  const saved = localStorage.getItem("roundTripChecked");
  if (saved === "1") {
    roundTripCheckbox.checked = true;
  }
  updateReturnDateVisibility();

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

document.getElementById("search-form")?.addEventListener("submit", (e) => {
  e.preventDefault();

  const from = fromInput.value.trim();
  const to = toInput.value.trim();
  const departureDate = departureInput.value;

  localStorage.setItem("lastFrom", from);
  localStorage.setItem("lastTo", to);
  localStorage.setItem("lastDepartureDate", departureDate);

  if (!from || !to || !departureDate) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  showLoading();

  const apiUrl = `https://go-travel-backend.vercel.app/api/flights?from=${from}&to=${to}&date=${departureDate}`;

  fetch(apiUrl)
    .then(res => {
      if (!res.ok) throw new Error(`Ошибка запроса: ${res.status}`);
      return res.json();
    })
    .then(flights => {
      if (!Array.isArray(flights)) {
        console.warn("❌ Ответ не массив:", flights);
        throw new Error("Некорректный формат данных");
      }

      const match = flights.find(f =>
        f.from?.toLowerCase() === from.toLowerCase() &&
        f.to?.toLowerCase() === to.toLowerCase()
      );

      const hotDeals = document.getElementById("hotDeals");
      hotDeals.innerHTML = flights.map(deal => {
        const isFav = JSON.parse(localStorage.getItem("favorites_flights") || "[]")
          .some(f => f.from === deal.from && f.to === deal.to && f.date === deal.date && f.price === deal.price);

        const dealId = `${deal.from}-${deal.to}-${deal.date}-${deal.price}`;
        return `
          <div class="card bg-white border p-4 rounded-xl mb-2 opacity-0 scale-95 transform transition-all duration-300">
            <strong>${deal.from} → ${deal.to}</strong><br>
            📅 Дата: ${deal.date}<br>
            💰 Цена: $${deal.price}
            <div class="flex justify-between items-center mt-2">
              <button class="btn w-full" onclick="bookHotel('${deal.from}', '${deal.to}', ${deal.price}, '${deal.date}')">Забронировать</button>
              <button onclick="toggleFavoriteFlight('${dealId}', this)" class="text-xl ml-3" data-flight-id="${dealId}">
                ${isFav ? "💙" : "🤍"}
              </button>
            </div>
          </div>
        `;
      }).join("");

      updateHearts("places");
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
