const calendar = document.getElementById("calendar");
const title = document.getElementById("calendarTitle");
const eventList = document.getElementById("eventList");
const filterCategory = document.getElementById("filterCategory");

const prev = document.getElementById("prevMonth");
const next = document.getElementById("nextMonth");

let currentDate = new Date();
let events = [];

/* ЗАГРУЗКА ПРАЗДНИКОВ */
fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        const year = new Date().getFullYear();

        data.forEach(h => {
            if (h.type === "fixed") {
                events.push({
                    title: h.title,
                    category: h.category,
                    date: `${year}-${h.date}`
                });
            }
        });

        renderCalendar();
    });

/* РЕНДЕР КАЛЕНДАРЯ */
function renderCalendar() {
    calendar.innerHTML = "";

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    title.textContent = currentDate.toLocaleString("ru", {
        month: "long",
        year: "numeric"
    });

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

    for (let i = 0; i < firstDay; i++) {
        tr.appendChild(document.createElement("td"));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if (tr.children.length === 7) {
            calendar.appendChild(tr);
            tr = document.createElement("tr");
        }

        const td = document.createElement("td");
        td.classList.add("day-cell");

        const dateStr = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;

        const num = document.createElement("div");
        num.className = "day-number";
        num.textContent = day;
        td.appendChild(num);

        const dayEvents = events.filter(e => e.date === dateStr)
            .filter(e => filterCategory.value === "all" || e.category === filterCategory.value);

        if (dayEvents.length > 0) {
            td.classList.add(dayEvents[0].category);
        }

        const today = new Date().toISOString().slice(0,10);
        if (dateStr === today) td.classList.add("today");

        td.onclick = () => showEvents(dayEvents, dateStr);
        tr.appendChild(td);
    }

    calendar.appendChild(tr);
}

/* ПОКАЗ СОБЫТИЙ */
function showEvents(dayEvents, date) {
    eventList.innerHTML = `<li><strong>${date}</strong></li>`;

    if (dayEvents.length === 0) {
        eventList.innerHTML += "<li>Событий нет</li>";
    } else {
        dayEvents.forEach(e => {
            eventList.innerHTML += `<li>${e.title}</li>`;
        });
    }
}

/* НАВИГАЦИЯ */
prev.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
};

next.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
};

filterCategory.onchange = renderCalendar;
