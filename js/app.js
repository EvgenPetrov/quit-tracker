/* =============================================
   Quit Tracker — App Logic
   ============================================= */

// ---- Data: Health Milestones ----
const MILESTONES = [
  { days: 1,    label: "1 день",    health: "Пульс и давление начинают нормализоваться" },
  { days: 2,    label: "2 дня",     health: "Обоняние и вкус начинают восстанавливаться" },
  { days: 3,    label: "3 дня",     health: "Никотин полностью выведен из организма" },
  { days: 7,    label: "1 неделя",  health: "Лёгкие начинают очищаться" },
  { days: 14,   label: "2 недели",  health: "Кровообращение заметно улучшилось" },
  { days: 21,   label: "3 недели",  health: "Физическая зависимость от никотина ушла" },
  { days: 30,   label: "1 месяц",   health: "Функция лёгких улучшилась на 30%" },
  { days: 60,   label: "2 месяца",  health: "Кожа начинает выглядеть свежее" },
  { days: 90,   label: "3 месяца",  health: "Риск сердечного приступа начал снижаться" },
  { days: 180,  label: "6 месяцев", health: "Кашель курильщика значительно уменьшился" },
  { days: 270,  label: "9 месяцев", health: "Лёгкие восстановились, дышать стало легче" },
  { days: 365,  label: "1 год",     health: "Риск болезней сердца снизился вдвое" },
  { days: 730,  label: "2 года",    health: "Риск инсульта как у некурящего" },
  { days: 1825, label: "5 лет",     health: "Риск рака лёгких снизился вдвое" },
  { days: 3650, label: "10 лет",    health: "Риск рака лёгких как у некурящего" },
];

// ---- State Management ----
let state = {
  screen: "setup",
  quitDate: "2025-03-17",
  cigsPerDay: 20,
  packPrice: 7,
  cigsInPack: 20,
  added: {},
};

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("quit_tracker_state"));
    if (saved && saved.quitDate) {
      Object.assign(state, saved);
      state.screen = "dashboard";
    }
  } catch (e) {
    /* first visit — use defaults */
  }
}

function saveState() {
  localStorage.setItem(
    "quit_tracker_state",
    JSON.stringify({
      quitDate: state.quitDate,
      cigsPerDay: state.cigsPerDay,
      packPrice: state.packPrice,
      cigsInPack: state.cigsInPack,
      added: state.added,
    })
  );
}

// ---- Helpers ----
function dailyCost() {
  return (state.packPrice / state.cigsInPack) * state.cigsPerDay;
}

function elapsed() {
  return Date.now() - new Date(state.quitDate).getTime();
}

function fmtDur(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return {
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    mins: Math.floor((s % 3600) / 60),
    secs: s % 60,
  };
}

function pad(n) {
  return String(n).padStart(2, "0");
}

function lifeString(avoided) {
  const lifeMin = avoided * 11;
  if (lifeMin >= 1440) return `${(lifeMin / 1440).toFixed(1)}д`;
  if (lifeMin >= 60) return `${Math.floor(lifeMin / 60)}ч`;
  return `${lifeMin}м`;
}

// ---- Google Calendar ----
function calUrl(m) {
  const d = new Date(state.quitDate);
  d.setDate(d.getDate() + m.days);
  const ds = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const saved = (m.days * dailyCost()).toFixed(0);
  const title = `🚭 Без сигарет уже ${m.label}!`;
  const details = `${m.health}\n\nСэкономлено: ~$${saved}\n\nТак держать! 💪`;
  return `https://calendar.google.com/calendar/r/eventedit?text=${encodeURIComponent(title)}&dates=${ds}T090000/${ds}T093000&details=${encodeURIComponent(details)}`;
}

function openCal(url) {
  const w = window.open("about:blank", "_blank");
  if (w) {
    w.location.href = url;
  } else {
    window.location.href = url;
  }
}

function milestoneDate(m) {
  const d = new Date(state.quitDate);
  d.setDate(d.getDate() + m.days);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

// ---- Render: Setup Screen ----
const app = document.getElementById("app");

function renderSetup() {
  app.innerHTML = `
    <div class="setup-wrap">
      <div class="setup-card">
        <div class="setup-icon">🚭</div>
        <div class="setup-title">Трекер без сигарет</div>
        <div class="setup-sub">Настройте под себя — данные сохранятся в браузере</div>

        <div class="field">
          <label>Дата отказа от курения</label>
          <input type="date" id="f-date" value="${state.quitDate}">
        </div>
        <div class="field">
          <label>Сигарет в день</label>
          <input type="number" id="f-cigs" value="${state.cigsPerDay}" min="1">
        </div>
        <div class="field-row">
          <div class="field">
            <label>Цена пачки ($)</label>
            <input type="number" id="f-price" value="${state.packPrice}" min="0.5" step="0.5">
          </div>
          <div class="field">
            <label>Штук в пачке</label>
            <input type="number" id="f-inpack" value="${state.cigsInPack}" min="1">
          </div>
        </div>

        <button class="btn-start" id="btn-go">Начать →</button>
      </div>
    </div>
  `;

  document.getElementById("btn-go").onclick = () => {
    state.quitDate = document.getElementById("f-date").value;
    state.cigsPerDay = +document.getElementById("f-cigs").value || 20;
    state.packPrice = +document.getElementById("f-price").value || 7;
    state.cigsInPack = +document.getElementById("f-inpack").value || 20;
    state.screen = "dashboard";
    saveState();
    renderDashboard();
  };
}

// ---- Render: Dashboard ----
function renderDashboard() {
  const ms = elapsed();
  const d = fmtDur(ms);
  const elDays = ms / 86400000;
  const saved = (elDays * dailyCost()).toFixed(0);
  const avoided = Math.floor(elDays * state.cigsPerDay);
  const lifeStr = lifeString(avoided);

  const passedMs = MILESTONES.filter((m) => m.days <= elDays);
  const futureMs = MILESTONES.filter((m) => m.days > elDays);
  const next = futureMs[0] || null;

  let nextProg = 100;
  if (next) {
    const prev = passedMs.length ? passedMs[passedMs.length - 1].days : 0;
    nextProg = Math.min(100, Math.max(2, ((elDays - prev) / (next.days - prev)) * 100));
  }

  const milestonesHtml = MILESTONES.map((m) => {
    const passed = m.days <= elDays;
    const isAdded = state.added[m.days];
    return `
      <div class="milestone ${passed ? "passed" : ""} animate-in">
        <div class="ms-dot">${passed ? "✓" : ""}</div>
        <div class="ms-body">
          <div class="ms-name">${m.label}<span class="ms-date">${milestoneDate(m)}</span></div>
          <div class="ms-detail">${m.health} · 💰 ~$${(m.days * dailyCost()).toFixed(0)}</div>
        </div>
        <div class="ms-action">
          ${
            passed
              ? '<span class="passed-badge">Пройдено ✨</span>'
              : `<button class="btn-remind ${isAdded ? "added" : ""}"
                   data-days="${m.days}"
                   data-url="${calUrl(m).replace(/"/g, "&quot;")}">
                   ${isAdded ? "✓ Добавлено" : "📅 Напомнить"}
                 </button>`
          }
        </div>
      </div>
    `;
  }).join("");

  const hasFuture = futureMs.length > 0;
  const allAdded = futureMs.every((m) => state.added[m.days]);

  app.innerHTML = `
    <div class="container">
      <div class="header-label">Без сигарет</div>
      <div class="timer-row">
        <div class="timer-unit"><div class="timer-val big" id="t-d">${pad(d.days)}</div><div class="timer-lbl">дн</div></div>
        <span class="timer-sep">:</span>
        <div class="timer-unit"><div class="timer-val" id="t-h">${pad(d.hours)}</div><div class="timer-lbl">ч</div></div>
        <span class="timer-sep">:</span>
        <div class="timer-unit"><div class="timer-val" id="t-m">${pad(d.mins)}</div><div class="timer-lbl">мин</div></div>
        <span class="timer-sep">:</span>
        <div class="timer-unit"><div class="timer-val" id="t-s">${pad(d.secs)}</div><div class="timer-lbl">сек</div></div>
      </div>

      <div class="stats-row">
        <div class="stat-card animate-in">
          <div class="stat-icon">💰</div>
          <div class="stat-val" style="color:var(--accent-green)" id="s-money">$${saved}</div>
          <div class="stat-lbl">сэкономлено</div>
        </div>
        <div class="stat-card animate-in" style="animation-delay:.05s">
          <div class="stat-icon">🚬</div>
          <div class="stat-val" style="color:var(--accent-yellow)" id="s-cigs">${avoided}</div>
          <div class="stat-lbl">не выкурено</div>
        </div>
        <div class="stat-card animate-in" style="animation-delay:.1s">
          <div class="stat-icon">❤️</div>
          <div class="stat-val" style="color:var(--accent-orange)" id="s-life">${lifeStr}</div>
          <div class="stat-lbl">жизни +</div>
        </div>
      </div>

      ${
        next
          ? `
      <div class="next-box animate-in" style="animation-delay:.12s">
        <div class="next-top">
          <div>
            <div class="next-label">Следующая веха</div>
            <div class="next-name">${next.label}</div>
          </div>
          <div class="next-remain">${Math.ceil(next.days - elDays)} дн. осталось</div>
        </div>
        <div class="next-health">${next.health}</div>
        <div class="progress-track"><div class="progress-fill" style="width:${nextProg}%"></div></div>
      </div>
      `
          : ""
      }

      <div class="section-title">Календарь вех</div>

      ${hasFuture && !allAdded ? '<button class="btn-add-all" id="btn-all">📅 Добавить все напоминания в календарь</button>' : ""}

      ${milestonesHtml}

      <button class="btn-settings" id="btn-reset">⚙ Изменить настройки</button>
    </div>
  `;

  bindDashboardEvents(futureMs);
}

// ---- Event Binding ----
function bindDashboardEvents(futureMs) {
  // Remind buttons — toggle on/off
  document.querySelectorAll(".btn-remind").forEach((btn) => {
    btn.addEventListener("click", () => {
      const days = +btn.dataset.days;
      if (state.added[days]) {
        delete state.added[days];
        saveState();
        btn.classList.remove("added");
        btn.textContent = "📅 Напомнить";
      } else {
        openCal(btn.dataset.url);
        state.added[days] = true;
        saveState();
        btn.classList.add("added");
        btn.textContent = "✓ Добавлено";
      }
    });
  });

  // Add all button
  const btnAll = document.getElementById("btn-all");
  if (btnAll) {
    btnAll.onclick = () => {
      futureMs.forEach((m, i) => {
        state.added[m.days] = true;
        setTimeout(() => openCal(calUrl(m)), i * 800);
      });
      saveState();
      renderDashboard();
    };
  }

  // Settings button
  document.getElementById("btn-reset").onclick = () => {
    state.screen = "setup";
    renderSetup();
  };
}

// ---- Live Timer (lightweight DOM update, no re-render) ----
function tickTimer() {
  if (state.screen !== "dashboard") return;

  const d = fmtDur(elapsed());
  const td = document.getElementById("t-d");
  if (!td) return;

  td.textContent = pad(d.days);
  document.getElementById("t-h").textContent = pad(d.hours);
  document.getElementById("t-m").textContent = pad(d.mins);
  document.getElementById("t-s").textContent = pad(d.secs);

  const elDays = elapsed() / 86400000;
  const saved = (elDays * dailyCost()).toFixed(0);
  const avoided = Math.floor(elDays * state.cigsPerDay);

  document.getElementById("s-money").textContent = `$${saved}`;
  document.getElementById("s-cigs").textContent = avoided;
  document.getElementById("s-life").textContent = lifeString(avoided);
}

setInterval(tickTimer, 1000);

// ---- Init ----
loadState();

if (state.screen === "dashboard") {
  renderDashboard();
} else {
  renderSetup();
}
