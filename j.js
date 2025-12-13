const calendar = document.getElementById("calendar");
const monthPicker = document.getElementById("monthPicker");
const filterCategory = document.getElementById("filterCategory");

const eventDate = document.getElementById("eventDate");
const eventTitle = document.getElementById("eventTitle");
const eventCategory = document.getElementById("eventCategory");
const saveEvent = document.getElementById("saveEvent");

monthPicker.valueAsDate = new Date();

let events = JSON.parse(localStorage.getItem("events")) || [];
let holidaysDB = [];

/* ================== ЗАГРУЗКА БАЗЫ ДАННЫХ ================== */
fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        holidaysDB = data;
        loadHolidays();
        renderCalendar();
        renderNextHolidayCountdown();
    });

function saveToStorage() {
    localStorage.setItem("events", JSON.stringify(events));
}

/* ================== ПЛАВАЮЩИЕ ДАТЫ ================== */
function getFirstSunday(year, month) {
    const date = new Date(year, month - 1, 1);
    while (date.getDay() !== 0) date.setDate(date.getDate() + 1);
    return date;
}

function loadHolidays() {
    const year = new Date().getFullYear();

    holidaysDB.forEach(h => {
        let fullDate;

        if (h.type === "fixed") {
            fullDate = `${year}-${h.date}`;
        }

        if (h.type === "floating" && h.rule === "firstSunday") {
            const d = getFirstSunday(year, h.month);
            fullDate = d.toISOString().split("T")[0];
        }

        events.push({
            date: fullDate,
            title: h.title,
            category: h.category,
            system: true
        });
    });

    saveToStorage();
}

/* ================== РЕНДЕР КАЛЕНДАРЯ ================== */
function renderCalendar() {
    calendar.innerHTML = "";

    const [year, month] = monthPicker.value.split("-");
    const days = new Date(year, month, 0).getDate();

    for (let day = 1; day <= days; day++) {
        const dateStr = `${year}-${month}-${String(day).padStart(2, "0")}`;
        const cell = document.createElement("div");
        cell.className = "day";

        cell.innerHTML = `<div class="date">${day}</div>`;

        events
            .filter(e => e.date === dateStr)
            .filter(e => filterCategory.value === "all" || e.category === filterCategory.value)
            .forEach(e => {
                const ev = document.createElement("div");
                ev.className = `event ${e.category}`;
                ev.textContent = e.title;

                ev.onclick = () => {
                    if (e.system) {
                        alert("Системный праздник. Удаление запрещено.");
                        return;
                    }
                    if (confirm("Удалить событие?")) {
                        events = events.filter(x => x !== e);
                        saveToStorage();
                        renderCalendar();
                        renderNextHolidayCountdown();
                    }
                };

                cell.appendChild(ev);
            });

        calendar.appendChild(cell);
    }
}

/* ================== ДОБАВЛЕНИЕ СОБЫТИЯ ================== */
saveEvent.onclick = () => {
    if (!eventDate.value || !eventTitle.value) {
        alert("Заполните все поля");
        return;
    }

    events.push({
        date: eventDate.value,
        title: eventTitle.value,
        category: eventCategory.value,
        system: false
    });

    saveToStorage();
    renderCalendar();
    renderNextHolidayCountdown();
    eventTitle.value = "";
};

/* ================== ФИЛЬТР И ВЫБОР МЕСЯЦА ================== */
monthPicker.onchange = () => {
    renderCalendar();
    renderNextHolidayCountdown();
};
filterCategory.onchange = renderCalendar;

/* ================== СЧЕТЧИК ДО БЛИЖАЙШЕГО ПРАЗДНИКА ================== */
function renderNextHolidayCountdown() {
    let countdownDiv = document.getElementById("holidayCountdown");
    if (!countdownDiv) {
        countdownDiv = document.createElement("div");
        countdownDiv.id = "holidayCountdown";
        countdownDiv.style.textAlign = "center";
        countdownDiv.style.margin = "15px 0";
        countdownDiv.style.fontWeight = "bold";
        document.body.insertBefore(countdownDiv, document.querySelector("footer"));
    }

    const today = new Date();
    const upcoming = events
        .filter(e => e.system)
        .map(e => ({...e, dateObj: new Date(e.date)}))
        .filter(e => e.dateObj >= today)
        .sort((a, b) => a.dateObj - b.dateObj);

    if (upcoming.length === 0) {
        countdownDiv.textContent = "Ближайших праздников нет";
        return;
    }

    const next = upcoming[0];
    const diffTime = next.dateObj - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    countdownDiv.textContent = `Ближайший праздник: "${next.title}" через ${diffDays} дней (${next.date})`;
}

renderNextHolidayCountdown();
