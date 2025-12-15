document.addEventListener("DOMContentLoaded", () => {

let selectedCell = null;
const PASSWORD = "curator123";

let isLoggedIn = localStorage.getItem("login") === "true";
let collegeEvents = JSON.parse(localStorage.getItem("collegeEvents")) || [];
let holidaysDB = [];
let currentDate = new Date();
let editingIndex = null; // для редактирования события

/* Элементы DOM */
const calendar = document.querySelector("#calendar");
const thead = calendar.querySelector("thead");
const tbody = calendar.querySelector("tbody");
const title = document.getElementById("calendarTitle");
const eventList = document.getElementById("eventList");
const filterCategory = document.getElementById("filterCategory");
const loginBtn = document.getElementById("loginBtn");
const passwordInput = document.getElementById("passwordInput");
const loginStatus = document.getElementById("loginStatus");
const loginError = document.getElementById("loginError");
const eventForm = document.getElementById("eventForm");
const eventDate = document.getElementById("eventDate");
const eventTitle = document.getElementById("eventTitle");
const saveEvent = document.getElementById("saveEvent");
const countdown = document.getElementById("countdown");

/* Модалка */
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalDate = document.getElementById("modalDate");
const modalCategory = document.getElementById("modalCategory");
const modalDescription = document.getElementById("modalDescription");
document.getElementById("closeModal").onclick = () => modal.style.display = "none";

/* Авторизация */
function updateAuthUI() {
    loginStatus.textContent = isLoggedIn ? "✔ Редактирование" : "🔒 Просмотр";
    eventForm.style.display = isLoggedIn ? "block" : "none";
    loginBtn.textContent = isLoggedIn ? "Выйти" : "Войти";
}
updateAuthUI();

loginBtn.onclick = () => {
    if (isLoggedIn) {
        if (confirm("Выйти из аккаунта?")) {
            isLoggedIn = false;
            localStorage.removeItem("login");
            updateAuthUI();
        }
        return;
    }

    if (passwordInput.value === PASSWORD) {
        isLoggedIn = true;
        localStorage.setItem("login", "true");
        loginError.textContent = "";
        updateAuthUI();
    } else {
        loginError.textContent = "Неверный пароль";
    }
};

/* Загрузка праздников */
fetch("holidays.json")
    .then(r => r.json())
    .then(data => {
        holidaysDB = data;
        renderCalendar();
        renderCountdown();
    })
    .catch(err => console.error("Ошибка загрузки holidays.json:", err));

/* Получаем первое воскресенье месяца */
function getFirstSunday(year, month) {
    const d = new Date(year, month, 1);
    while (d.getDay() !== 0) d.setDate(d.getDate() + 1);
    return d;
}

/* Получаем события на год */
function getEventsForYear(year) {
    const system = holidaysDB.map(h => {
        let date;
        if (h.type === "fixed") date = `${year}-${h.date}`;
        if (h.type === "floating") date = getFirstSunday(year, h.month-1).toISOString().slice(0,10);
        return { ...h, date };
    });
    return [...system, ...collegeEvents];
}

/* Рендер календаря */
function renderCalendar() {
    thead.innerHTML = "";
    tbody.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    title.textContent = currentDate.toLocaleString("ru", { month: "long", year: "numeric" });

    const days = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
    const tr = document.createElement("tr");
    days.forEach(d => {
        const th = document.createElement("th");
        th.textContent = d;
        tr.appendChild(th);
    });
    thead.appendChild(tr);

    const events = getEventsForYear(year).filter(e =>
        filterCategory.value === "all" || e.category === filterCategory.value
    );

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let row = document.createElement("tr");
    for (let i = 0; i < firstDay; i++) row.appendChild(document.createElement("td"));

    const today = new Date();

    for (let d = 1; d <= daysInMonth; d++) {
        if (row.children.length === 7) {
            tbody.appendChild(row);
            row = document.createElement("tr");
        }

        const td = document.createElement("td");
        const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
        td.innerHTML = `<div class="day-number">${d}</div>`;

        const dayOfWeek = new Date(year, month, d).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) td.classList.add("weekend");

        if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            td.classList.add("today");
        }

        const dayEvents = events.filter(e => e.date === dateStr);
        if (dayEvents.length) td.classList.add(dayEvents[0].category);

        td.onclick = () => {
            if (selectedCell) selectedCell.classList.remove("selected-day");
            td.classList.add("selected-day");
            selectedCell = td;
            eventDate.value = dateStr;
            showEvents(dayEvents);
        };

        row.appendChild(td);
    }

    tbody.appendChild(row);
}

/* Показ событий выбранного дня */
function showEvents(list) {
    eventList.innerHTML = "";

    if (!list.length) {
        eventList.innerHTML = "<li>Событий нет</li>";
        return;
    }

    list.forEach((e, index) => {
        const li = document.createElement("li");
        li.style.display = "flex";
        li.style.justifyContent = "space-between";
        li.style.alignItems = "center";

        const titleSpan = document.createElement("span");
        titleSpan.textContent = e.title;
        titleSpan.style.cursor = "pointer";
        titleSpan.onclick = () => openModal(e);
        li.appendChild(titleSpan);

        if (isLoggedIn && e.category === "college") {
            // Удаление
            const del = document.createElement("button");
            del.textContent = "🗑";
            del.style.background = "none";
            del.style.border = "none";
            del.style.cursor = "pointer";
            del.onclick = () => {
                if (confirm("Удалить событие?")) {
                    collegeEvents.splice(index, 1);
                    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
                    renderCalendar();
                    showEvents([]);
                }
            };
            li.appendChild(del);

            // Редактирование
            const edit = document.createElement("button");
            edit.textContent = "✏️";
            edit.style.background = "none";
            edit.style.border = "none";
            edit.style.cursor = "pointer";
            edit.onclick = () => {
                editingIndex = index;
                eventTitle.value = e.title;
                eventDate.value = e.date;
            };
            li.appendChild(edit);
        }

        eventList.appendChild(li);
    });
}

/* Модальное окно */
function openModal(e) {
    modalTitle.textContent = e.title;
    modalDate.textContent = "Дата: " + e.date;
    modalCategory.textContent = "Категория: " + e.category;
    modalDescription.textContent = e.description || "Описание отсутствует";
    modal.style.display = "block";
}

/* Сохранение события */
saveEvent.onclick = () => {
    if (!isLoggedIn) return;
    const newEvent = {
        date: eventDate.value,
        title: eventTitle.value,
        category: "college",
        description: "Событие колледжа"
    };

    if (!eventDate.value || !eventTitle.value) {
        alert("Заполните дату и название события!");
        return;
    }

    if (editingIndex !== null) {
        collegeEvents[editingIndex] = newEvent;
        editingIndex = null;
    } else {
        collegeEvents.push(newEvent);
    }

    localStorage.setItem("collegeEvents", JSON.stringify(collegeEvents));
    renderCalendar();
    eventTitle.value = "";
};

/* Управление календарем */
document.getElementById("printCalendar").onclick = () => window.print();
document.getElementById("prevMonth").onclick = () => { currentDate.setMonth(currentDate.getMonth()-1); renderCalendar(); };
document.getElementById("nextMonth").onclick = () => { currentDate.setMonth(currentDate.getMonth()+1); renderCalendar(); };
filterCategory.onchange = renderCalendar;

/* Отсчёт до ближайшего праздника */
function renderCountdown() {
    const today = new Date();
    let nearest = null;

    for (let y = today.getFullYear(); y <= today.getFullYear()+1; y++) {
        getEventsForYear(y).forEach(e => {
            const d = new Date(e.date);
            if (d >= today && (!nearest || d < new Date(nearest.date))) nearest = e;
        });
    }

    if (nearest) {
        const diff = Math.ceil((new Date(nearest.date) - today)/(1000*60*60*24));
        countdown.innerHTML = `
            <strong>Ближайший праздник</strong>
            ${nearest.title}<br>
            <small>через ${diff} дн.</small>
        `;
    }
}

});
