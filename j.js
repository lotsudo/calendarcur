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

/* ================== БАЗА ДАННЫХ ================== */
fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        holidaysDB = data;
        loadHolidays();
        renderCalendar();
    });

function saveToStorage() {
    localStorage.setItem("events", JSON.stringify(events));
}

/* ================== ПЛАВАЮЩИЕ ДАТЫ ================== */
function getFirstSunday(year, month) {
    const date = new Date(year, month - 1, 1);
    while (date.getDay() !== 0) {
        date.setDate(date.getDate() + 1);
    }
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

/* ================== КАЛЕНДАРЬ ================== */
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
    eventTitle.value = "";
};

monthPicker.onchange = renderCalendar;
filterCategory.onchange = renderCalendar;
