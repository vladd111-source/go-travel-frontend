// ✅ Подключение к Supabase
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function loadAnalytics() {
  const filter = document.getElementById("filterUser").value.trim();
  let query = supabase
    .from("analytics")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filter) {
    query = supabase
      .from("analytics")
      .select("*")
      .eq("telegram_id", filter)
      .order("created_at", { ascending: false })
      .limit(100);
  }

  const { data, error } = await query;
  const table = document.getElementById("analyticsTable");
  table.innerHTML = "";

  if (error) {
    table.innerHTML = `<tr><td colspan="4" class="p-2 text-red-600">Ошибка загрузки: ${error.message}</td></tr>`;
    return;
  }

  if (!data || data.length === 0) {
    table.innerHTML = `<tr><td colspan="4" class="p-2 text-gray-500">Нет данных</td></tr>`;
    return;
  }

  data.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="border-t p-2">${row.telegram_id}</td>
      <td class="border-t p-2">${row.event}</td>
      <td class="border-t p-2 whitespace-pre-wrap text-xs">${JSON.stringify(row.event_data, null, 2)}</td>
      <td class="border-t p-2">${new Date(row.created_at).toLocaleString()}</td>
    `;
    table.appendChild(tr);
  });
}

// Загрузка данных при открытии страницы
document.addEventListener("DOMContentLoaded", loadAnalytics);
