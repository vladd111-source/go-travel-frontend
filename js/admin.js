// admin.js
const supabaseUrl = 'https://hubrgeitdvodttderspj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1YnJnZWl0ZHZvZHR0ZGVyc3BqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNzY0OTEsImV4cCI6MjA1ODc1MjQ5MX0.K44XhDzjOodHzgl_cx80taX8Vgg_thFAVEesZUvKNnA';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

async function loadAnalytics() {
  const filter = document.getElementById("filterUser").value.trim();
  const from = document.getElementById("dateFrom").value;
  const to = document.getElementById("dateTo").value;

  let query = supabase.from("analytics").select("*").order("created_at", { ascending: false }).limit(100);

  if (filter) query = query.eq("telegram_id", filter);
  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", to + 'T23:59:59');

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

async function loadStats() {
  const { data: events } = await supabase.from("analytics").select("event, telegram_id");
  if (!events) return;

  const uniqueUsers = new Set(events.map(e => e.telegram_id));
  const eventCount = events.length;

  const eventFreq = {};
  events.forEach(e => {
    eventFreq[e.event] = (eventFreq[e.event] || 0) + 1;
  });

  const topEvents = Object.entries(eventFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  document.getElementById("statsBlock").innerHTML = `
    <div class="bg-white p-4 rounded shadow mb-4">
      <h2 class="text-lg font-bold mb-2">📊 Статистика</h2>
      <p><strong>Уникальных пользователей:</strong> ${uniqueUsers.size}</p>
      <p><strong>Всего событий:</strong> ${eventCount}</p>
      <h3 class="font-semibold mt-2 mb-1">Топ-5 событий:</h3>
      <ul class="list-disc pl-5">
        ${topEvents.map(e => `<li>${e[0]} — ${e[1]} раз(а)</li>`).join('')}
      </ul>
    </div>
  `;
}

loadAnalytics();
loadStats();
