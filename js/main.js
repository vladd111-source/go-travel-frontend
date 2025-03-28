// ✅ Supabase через CDN
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'твой_публичный_ключ'; // обязательно публичный
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// ✅ Генерация session_id
const sessionId = localStorage.getItem("session_id") || crypto.randomUUID();
localStorage.setItem("session_id", sessionId);

// ✅ Получаем Telegram ID или тестовый
let telegramId = "test_" + crypto.randomUUID(); // по умолчанию, если нет Telegram
if (window.Telegram && Telegram.WebApp && Telegram.WebApp.initDataUnsafe?.user?.id) {
  telegramId = Telegram.WebApp.initDataUnsafe.user.id.toString();
}
console.log("👤 Telegram ID:", telegramId);

// ✅ Тестовая запись события
supabase.from("analytics").insert([{
  telegram_id: telegramId,
  event: "Test Event",
  event_data: { message: "Тестовая запись из WebApp" },
  session_id: sessionId,
  created_at: new Date().toISOString()
}])
.then(({ error }) => {
  if (error) {
    console.error("❌ Ошибка записи:", error.message);
  } else {
    console.log("✅ Запись успешна!");
  }
});
