const calendar = document.getElementById("calendar");
const title = document.getElementById("calendarTitle");
const eventList = document.getElementById("eventList");
const filterCategory = document.getElementById("filterCategory");

const prev = document.getElementById("prevMonth");
const next = document.getElementById("nextMonth");

/* ---------- АВТОРИЗАЦИЯ ---------- */
const PASSWORD = "curator123";
let isLoggedIn = localStorage.getItem("curatorLogin") === "true";

const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const loginStatus = document.getElementById("loginStatus");
const eventForm = document.getElementById("eventForm");

function updateLoginUI() {
    if (isLoggedIn) {
        loginStatus.textContent = "✔ Режим редактирования";
        passwordInput.style.display = "none";
        eventForm.style.display = "block";
        loginBtn.textContent = "Выйти";
    } else {
        loginStatus.textContent = "🔒 Только просмотр";
        passwordInput.style.display = "inline-block";
        eventForm.style.display = "none";
        loginBtn.textContent = "Войти";
    }
}

loginBtn.onclick = () => {
    if (isLoggedIn) {
        isLoggedIn = false;
        localStorage.removeItem("curatorLogin");
    } else {
        if (passwordInput.value === PASSWORD) {
            isLoggedIn = true;
            localStorage.setItem("curatorLogin", "true");
            passwordInput.value = "";
        } else {
            alert("Неверный пароль");
        }
    }
    updateLoginUI();
};

/* ---------- ДАННЫЕ ---------- */
let currentDate = new Date();
let holidaysDB = [];
let collegeEvents = JSON.parse(localStorage.getItem("collegeEvents")) || [];

fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        holidaysDB = data;
        renderCalendar();
    });

function getFirstSunday(year, month) {
    const d = new Date(year, month - 1, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return d;
}

function getHolidaysForYear(year) {
    const result = [];

    holidaysDB.forEach(h => {
        let date = null;

        if (h.type === "fixed") date = `${year}-${h.date}`;
        if (h.type === "floating") {
            const d = getFirstSunday(year, h.month);
            date = d.toISOString().slice(0,10);
        }

        if (date) {
            result.push({ ...h, date });
        }
    });

    return result;
}

/* ---------- КАЛЕНДАРЬ ---------- */
function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const events = [...getHolidaysForYear(year), ...collegeEvents];

    title.textContent = currentDate.toLocaleString("ru", { month: "long", year: "numeric" });

    const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    let tr = document.createElement("tr");
    days.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        tr.appendChild(th);
    });
    calendar.appendChild(tr);

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    tr = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) tr.appendChild(document.createElement("td"));

    for (let day = 1; day <= daysInMonth; day++) {
        if (tr.children.length === 7) {
            calendar.appendChild(tr);
            tr = document.createElement("tr");
        }

        const td = document.createElement("td");
        td.className = "day-cell";

        const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

        td.innerHTML = `<div class="day-number">${day}</div>`;

        const dayEvents = events.filter(e => e.date === dateStr)
            .filter(e => filterCategory.value === "all" || e.category === filterCategory.value);

        if (dayEvents.length) td.classList.add(dayEvents[0].category);

        td.onclick = () => showEvents(dayEvents, dateStr);
        tr.appendChild(td);
    }

    calendar.appendChild(tr);
}

/* ---------- СОБЫТИЯ ДНЯ ---------- */
function showEvents(list, date) {
    eventList.innerHTML = `<li><strong>${date}</strong></li>`;
    if (!list.length) {
        eventList.innerHTML += "<li>Событий нет</li>";
    } else {
        list.forEach(e => {
            eventList.innerHTML += `<li>${e.title}</li>`;
        });
    }
}

/* ---------- ДОБАВЛЕНИЕ СОБЫТИЯ ---------- */
document.getElementById("addEvent").onclick = () => {
    if (!isLoggedIn) return;

    const date = document.getElementById("eventDate").value;
    const title = document.getElementById("eventTitle").value;

    if (!date || !title) {
        alert("Заполните все поля");
        return;
    }

    collegeEvents.push({ date, title, category: "college" });
    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));

    document.getElementById("eventTitle").value = "";
    renderCalendar();
};

/* ---------- НАВИГАЦИЯ ---------- */
prev.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};
next.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};
filterCategory.onchange = renderCalendar;

updateLoginUI();
