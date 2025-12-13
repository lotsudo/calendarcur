const calendar = document.getElementById("calendar");
const title = document.getElementById("title");
const eventList = document.getElementById("eventList");
const prev = document.getElementById("prev");
const next = document.getElementById("next");

let currentDate = new Date();
let holidays = [];

fetch("holidays.json")
    .then(r => r.json())
    .then(data => {
        holidays = data;
        render();
    });

function render() {
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
        let th = document.createElement("th");
        th.textContent = d;
        tr.appendChild(th);
    });
    calendar.appendChild(tr);

    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1;

    let daysInMonth = new Date(year, month + 1, 0).getDate();

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
        const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

        const num = document.createElement("div");
        num.className = "day-number";
        num.textContent = day;
        td.appendChild(num);

        const holiday = holidays.find(h => h.date === dateStr.slice(5));
        if (holiday) td.classList.add(holiday.category);

        if (dateStr === new Date().toISOString().slice(0,10)) {
            td.classList.add("today");
        }

        td.onclick = () => showEvents(dateStr);
        tr.appendChild(td);
    }

    calendar.appendChild(tr);
}

function showEvents(date) {
    eventList.innerHTML = `<li><strong>${date}</strong></li>`;
    const dayEvents = holidays.filter(h => date.endsWith(h.date));
    if (!dayEvents.length) {
        eventList.innerHTML += "<li>Событий нет</li>";
    } else {
        dayEvents.forEach(e => {
            eventList.innerHTML += `<li>${e.title}</li>`;
        });
    }
}

prev.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    render();
};

next.onclick = () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    render();
};
