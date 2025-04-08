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

// ✅ Показ модалки с деталями по типу
window.showDetails = function(type, index) {
  const dataMap = {
    flights: {
      storage: "favorites_flights",
      template: (f) => `
        <h2 class=\"text-xl font-bold mb-2\">${f.from} → ${f.to}</h2>
        <p class=\"text-sm text-gray-500\">Дата: ${f.date}</p>
        <p class=\"text-sm text-gray-500\">Цена: $${f.price}</p>
      `
    },
    hotels: {
      storage: "favorites_hotels",
      template: (h) => `
        <h2 class=\"text-xl font-bold mb-2\">${h.name}</h2>
        <p class=\"text-sm text-gray-500\">Город: ${h.city}</p>
        <p class=\"text-sm text-gray-500\">Цена: $${h.price}</p>
        <p class=\"text-sm text-gray-500\">Рейтинг: ${h.rating}</p>
      `
    },
    places: {
      storage: "favorites_places",
      template: (p) => `
        <h2 class=\"text-xl font-bold mb-2\">${p.name}</h2>
        <p class=\"text-sm text-gray-600 mb-1\">${p.description}</p>
        <p class=\"text-sm text-gray-500\">${formatCategory(p.category)} • ${capitalize(p.city)}</p>
      `
    }
  };

  const config = dataMap[type];
  if (!config) return;

  const data = JSON.parse(localStorage.getItem(config.storage) || "[]");
  const item = data[index];
  if (!item) return;

  document.getElementById("modalContent").innerHTML = config.template(item);
  window.openModal();
};

// ✅ Удаление из избранного по типу
window.removeFavoriteItem = function(type, index) {
  const key = `favorites_${type}`;
  let data = JSON.parse(localStorage.getItem(key) || "[]");
  data.splice(index, 1);
  localStorage.setItem(key, JSON.stringify(data));
  window.renderFavorites?.(type);
  window.updateHearts?.(type);
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
