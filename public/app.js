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

// ✅ DOMContentLoaded и инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  try {
    // Telegram и язык
    if (window.Telegram && Telegram.WebApp) {
      Telegram.WebApp.ready();
      const user = Telegram.WebApp.initDataUnsafe?.user;
      if (user?.id) {
        window._telegramId = user.id.toString();
      }
    }
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

    // Восстановление вкладки и автофокус
    const lastTab = localStorage.getItem("activeTab") || "flights";
    showTab(lastTab);
    setTimeout(() => {
      const tabEl = document.getElementById(lastTab);
      const firstInput = tabEl?.querySelector("input");
      firstInput?.focus();
    }, 200);

    // Показ/скрытие даты возврата
    const roundTripCheckbox = document.getElementById("roundTrip");
    const returnDateWrapper = document.getElementById("returnDateWrapper");
    const returnDateInput = document.getElementById("returnDate");
    if (roundTripCheckbox && returnDateWrapper && returnDateInput) {
      const updateReturn = () => {
        returnDateWrapper.classList.toggle("hidden", !roundTripCheckbox.checked);
        returnDateInput.required = roundTripCheckbox.checked;
        if (!roundTripCheckbox.checked) returnDateInput.value = "";
      };
      const saved = localStorage.getItem("roundTripChecked");
      roundTripCheckbox.checked = saved === "1";
      updateReturn();
      roundTripCheckbox.addEventListener("change", () => {
        updateReturn();
        localStorage.setItem("roundTripChecked", roundTripCheckbox.checked ? "1" : "0");
      });
    }

    // Кэширование для вкладки "Места"
    const placeCityInput = document.getElementById("placeCity");
    const placeCategorySelect = document.getElementById("placeCategory");
    if (placeCityInput) {
      const cached = localStorage.getItem("placeCity");
      if (cached) placeCityInput.value = cached;
      placeCityInput.addEventListener("input", (e) => {
        localStorage.setItem("placeCity", e.target.value.trim());
      });
    }
    if (placeCategorySelect) {
      const cached = localStorage.getItem("placeCategory");
      if (cached) placeCategorySelect.value = cached;
      placeCategorySelect.addEventListener("change", (e) => {
        localStorage.setItem("placeCategory", e.target.value);
      });
    }
  } catch (e) {
    console.error("Ошибка DOMContentLoaded:", e);
  }
});

// ✅ Обработка ошибок
window.onerror = function (msg, url, line, col, error) {
  logEventToAnalytics("Ошибка JS", { msg, url, line, col, stack: error?.stack || null });
};

// ✅ Отслеживание длительности сессии
const appStart = Date.now();
window.addEventListener("beforeunload", () => {
  const duration = Math.round((Date.now() - appStart) / 1000);
  logEventToAnalytics("Сессия завершена", { duration_seconds: duration });
});
