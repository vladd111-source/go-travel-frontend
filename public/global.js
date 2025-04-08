// ✅ Универсальное обновление сердечек
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

// ✅ Универсальный рендеринг карточек избранного
window.renderFavorites = function(type) {
  const config = {
    flights: {
      storageKey: "favorites_flights",
      getTitle: f => `${f.from} → ${f.to}`,
      getDetails: f => `Дата: ${f.date}<br>Цена: $${f.price}`,
    },
    hotels: {
      storageKey: "favorites_hotels",
      getTitle: h => h.name,
      getDetails: h => `(${h.city})<br>Рейтинг: ${h.rating} | $${h.price}`,
    },
    places: {
      storageKey: "favorites_places",
      getTitle: p => p.name,
      getDetails: p => `${p.description}<br>Категория: ${formatCategory(p.category)}`,
    },
  };

  const container = document.getElementById(`favContent-${type}`);
  if (!container) return;

  const { storageKey, getTitle, getDetails } = config[type] || {};
  const data = JSON.parse(localStorage.getItem(storageKey) || "[]");

  if (data.length === 0) {
    container.innerHTML = `<p class="text-gray-500 text-sm text-center mt-4">Пока нет избранного.</p>`;
    return;
  }

  container.innerHTML = data.map((item, index) => `
    <div class="card bg-white p-4 rounded-xl shadow mb-2">
      <strong>${getTitle(item)}</strong><br>
      ${getDetails(item)}
      <div class="flex justify-between items-center mt-2">
        <button class="btn text-sm bg-blue-100 text-blue-600" onclick="showDetails('${type}', ${index})">📄 Подробнее</button>
        <button class="btn text-sm bg-red-100 text-red-600" onclick="removeFavoriteItem('${type}', ${index})">🗑 Удалить</button>
      </div>
    </div>
  `).join("");

  updateHearts(type);
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

// ✅ Удаление из избранного по типу
window.removeFavoriteItem = function(type, index) {
  const key = `favorites_${type}`;
  let data = JSON.parse(localStorage.getItem(key) || "[]");
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
