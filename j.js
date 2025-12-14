/* ================== DOM ================== */
const calendar = document.getElementById("calendar");
const thead = calendar.querySelector("thead");
const tbody = calendar.querySelector("tbody");

const title = document.getElementById("calendarTitle");
const eventList = document.getElementById("eventList");

const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const loginStatus = document.getElementById("loginStatus");
const loginError = document.getElementById("loginError");

const eventForm = document.getElementById("eventForm");
const eventDate = document.getElementById("eventDate");
const eventTitle = document.getElementById("eventTitle");
const saveEvent = document.getElementById("saveEvent");

/* ================== AUTH ================== */
const PASSWORD = "curator123";
let isLoggedIn = localStorage.getItem("login") === "true";

function updateLoginUI() {
    loginStatus.textContent = isLoggedIn ? "✔ Режим редактирования" : "🔒 Только просмотр";
    eventForm.style.display = isLoggedIn ? "block" : "none";
}

loginBtn.onclick = () => {
    if (isLoggedIn) {
        isLoggedIn = false;
        localStorage.removeItem("login");
    } else {
        if (passwordInput.value === PASSWORD) {
            isLoggedIn = true;
            localStorage.setItem("login", "true");
            passwordInput.value = "";
            loginError.style.display = "none";
        } else {
            loginError.textContent = "Неверный пароль. Попробуйте ещё раз.";
            loginError.style.display = "block";
        }
    }
    updateLoginUI();
};

passwordInput.oninput = () => {
    loginError.style.display = "none";
};

/* ================== DATA ================== */
let currentDate = new Date();
let selectedDate = null;

let holidaysDB = [];
let collegeEvents = JSON.parse(localStorage.getItem("collegeEvents")) || [];

fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        holidaysDB = data;
        renderCalendar();
        renderCountdown();
    });

/* ================== DATE HELPERS ================== */
function getFirstSunday(year, month) {
    const d = new Date(year, month - 1, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return d;
}

function getHolidaysForYear(year) {
    return holidaysDB.map(h => {
        let date = null;

        if (h.type === "fixed") {
            date = `${year}-${h.date}`;
        }

        if (h.type === "floating" && h.rule === "firstSunday") {
            const d = getFirstSunday(year, h.month);
            date = d.toISOString().slice(0, 10);
        }

        return { ...h, date };
    });
}

/* ================== CALENDAR ================== */
function renderCalendar() {
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const events = [...getHolidaysForYear(year), ...collegeEvents];

    title.textContent = currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

    /* Days header */
    const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const trHead = document.createElement("tr");
    days.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    /* Dates */
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let tr = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) {
        tr.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if (tr.children.length === 7) {
            tbody.appendChild(tr);
            tr = document.createElement("tr");
        }

        const td = document.createElement("td");
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        td.innerHTML = `<div class="day-number">${day}</div>`;

        const dayEvents = events.filter(e => e.date === dateStr);

        if (dayEvents.length) {
            td.classList.add(dayEvents[0].category);
        }

        td.onclick = () => showEvents(dayEvents, dateStr);
        tr.appendChild(td);
    }

    tbody.appendChild(tr);
}

/* ================== EVENTS OF DAY ================== */
function showEvents(list, date) {
    selectedDate = date;
    eventList.innerHTML = "";

    if (!list.length) {
        eventList.innerHTML = "<li>Событий нет</li>";
    } else {
        list.forEach(e => {
            const li = document.createElement("li");
            li.textContent = e.title;

            if (isLoggedIn && e.category === "college") {
                const del = document.createElement("button");
                del.textContent = " ❌";
                del.onclick = () => {
                    collegeEvents = collegeEvents.filter(x => x !== e);
                    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
                    renderCalendar();
                    showEvents([], date);
                };
                li.appendChild(del);
            }

            eventList.appendChild(li);
        });
    }

    if (isLoggedIn) {
        eventDate.value = date;
    }
}

/* ================== ADD EVENT ================== */
saveEvent.onclick = () => {
    if (!isLoggedIn) return;

    if (!eventDate.value || !eventTitle.value) {
        alert("Заполните все поля");
        return;
    }

    collegeEvents.push({
        date: eventDate.value,
        title: eventTitle.value,
        category: "college"
    });

    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
    eventTitle.value = "";
    renderCalendar();
};

/* ================== NAVIGATION ================== */
prevMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

nextMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

/* ================== COUNTDOWN ================== */
function renderCountdown() {
    const today = new Date();
    let nearest = null;

    for (let y = today.getFullYear(); y <= today.getFullYear() + 1; y++) {
        getHolidaysForYear(y).forEach(h => {
            const d = new Date(h.date);
            if (d >= today && (!nearest || d < new Date(nearest.date))) {
                nearest = h;
            }
        });
    }

    if (!nearest) return;

    const diff = Math.ceil(
        (new Date(nearest.date) - today) / (1000 * 60 * 60 * 24)
    );

    const block = document.createElement("div");
    block.style.maxWidth = "420px";
    block.style.margin = "15px auto";
    block.style.padding = "12px";
    block.style.background = "white";
    block.style.borderRadius = "14px";
    block.style.boxShadow = "0 6px 15px rgba(0,0,0,0.1)";
    block.style.textAlign = "center";

    block.innerHTML = `
        <strong>Ближайший праздник:</strong><br>
        ${nearest.title}<br>
        Через ${diff} дн.
    `;

    document.body.insertBefore(block, document.querySelector(".calendar-controls"));
}

/* ================== INIT ================== */
updateLoginUI();
