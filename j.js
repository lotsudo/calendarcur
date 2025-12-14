const loginError = document.getElementById("loginError");
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
const eventForm = document.getElementById("eventForm");

const eventDate = document.getElementById("eventDate");
const eventTitle = document.getElementById("eventTitle");
const saveEvent = document.getElementById("saveEvent");

const PASSWORD = "curator123";
let isLoggedIn = localStorage.getItem("login") === "true";

let currentDate = new Date();
let selectedDate = null;

let holidaysDB = [];
let collegeEvents = JSON.parse(localStorage.getItem("collegeEvents")) || [];

fetch("holidays.json")
    .then(r => r.json())
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
    return holidaysDB.map(h => {
        let date;
        if (h.type === "fixed") date = `${year}-${h.date}`;
        if (h.type === "floating") {
            const d = getFirstSunday(year, h.month);
            date = d.toISOString().slice(0,10);
        }
        return { ...h, date };
    });
}

function updateLoginUI() {
    loginStatus.textContent = isLoggedIn ? "✔ Редактирование" : "🔒 Просмотр";
    eventForm.style.display = isLoggedIn ? "block" : "none";
}

loginBtn.onclick = () => {
    if (isLoggedIn) {
        isLoggedIn = false;
        localStorage.removeItem("login");
    } else if (passwordInput.value === PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem("login", "true");
        passwordInput.value = "";
    }
    updateLoginUI();
};

function renderCalendar() {
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const events = [...getHolidaysForYear(year), ...collegeEvents];

    title.textContent = currentDate.toLocaleString("ru", { month: "long", year: "numeric" });

    const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const trHead = document.createElement("tr");
    days.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let tr = document.createElement("tr");

    for (let i = 0; i < firstDay; i++) tr.appendChild(document.createElement("td"));

    for (let day = 1; day <= daysInMonth; day++) {
        if (tr.children.length === 7) {
            tbody.appendChild(tr);
            tr = document.createElement("tr");
        }

        const td = document.createElement("td");
        const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

        td.innerHTML = `<div class="day-number">${day}</div>`;

        const dayEvents = events.filter(e => e.date === dateStr);
        if (dayEvents.length) td.classList.add(dayEvents[0].category);

        td.onclick = () => showEvents(dayEvents, dateStr);
        tr.appendChild(td);
    }

    tbody.appendChild(tr);
}

function showEvents(list, date) {
    selectedDate = date;
    eventList.innerHTML = "";

    if (!list.length) {
        eventList.innerHTML = "<li>Событий нет</li>";
    } else {
        list.forEach((e, i) => {
            const li = document.createElement("li");
            li.textContent = e.title;

            if (isLoggedIn && e.category === "college") {
                const del = document.createElement("button");
                del.textContent = "❌";
                del.onclick = () => {
                    collegeEvents.splice(collegeEvents.indexOf(e), 1);
                    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
                    renderCalendar();
                    showEvents([], date);
                };
                li.appendChild(del);
            }

            eventList.appendChild(li);
        });
    }

    if (isLoggedIn) eventDate.value = date;
}

saveEvent.onclick = () => {
    if (!eventDate.value || !eventTitle.value) return;

    collegeEvents.push({
        date: eventDate.value,
        title: eventTitle.value,
        category: "college"
    });

    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
    eventTitle.value = "";
    renderCalendar();
};

prevMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};
nextMonth.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

updateLoginUI();

