const calendar = document.getElementById("calendar");
const monthPicker = document.getElementById("monthPicker");
const filterCategory = document.getElementById("filterCategory");
const eventList = document.getElementById("eventList");
const eventDate = document.getElementById("eventDate");
const eventTitle = document.getElementById("eventTitle");
const eventCategory = document.getElementById("eventCategory");
const saveEvent = document.getElementById("saveEvent");
const holidayCountdown = document.getElementById("holidayCountdown");
const prevMonthBtn = document.getElementById("prevMonth");
const nextMonthBtn = document.getElementById("nextMonth");

monthPicker.valueAsDate = new Date();
let events = JSON.parse(localStorage.getItem("events")) || [];
let holidaysDB = [];

/* ================== ЗАГРУЗКА БАЗЫ ================== */
fetch("holidays.json")
    .then(res => res.json())
    .then(data => {
        holidaysDB = data;
        loadHolidays();
        renderCalendar();
        updateNextHoliday();
    });

function saveToStorage() { localStorage.setItem("events", JSON.stringify(events)); }

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
        if (h.type === "fixed") fullDate = `${year}-${h.date}`;
        if (h.type === "floating" && h.rule === "firstSunday") {
            const d = getFirstSunday(year, h.month);
            fullDate = d.toISOString().split("T")[0];
        }
        events.push({ date: fullDate, title: h.title, category: h.category, system: true });
    });
    saveToStorage();
}

/* ================== РЕНДЕР КАЛЕНДАРЯ ================== */
function renderCalendar() {
    calendar.innerHTML = "";
    const [year, month] = monthPicker.value.split("-");
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();

    // Заголовок дней недели
    const daysOfWeek = ["Вс","Пн","Вт","Ср","Чт","Пт","Сб"];
    let thead = "<tr>";
    daysOfWeek.forEach(d => thead += `<th>${d}</th>`);
    thead += "</tr>";
    calendar.innerHTML += thead;

    let tr = "<tr>";
    let dayCounter = 1;

    for (let i = 0; i < 7; i++) {
        if (i < firstDay) tr += "<td></td>";
        else { tr += createDayCell(year, month, dayCounter); dayCounter++; }
    }
    tr += "</tr>";
    calendar.innerHTML += tr;

    while (dayCounter <= daysInMonth) {
        tr = "<tr>";
        for (let i = 0; i < 7; i++) {
            if (dayCounter > daysInMonth) tr += "<td></td>";
            else { tr += createDayCell(year, month, dayCounter); dayCounter++; }
        }
        tr += "</tr>";
        calendar.innerHTML += tr;
    }

    document.querySelectorAll(".day-cell").forEach(cell => {
        cell.onclick = () => {
            const date = cell.dataset.date;
            const dayEvents = events.filter(e => e.date === date);
            showEvents(dayEvents, date);
        };
    });

    highlightToday();
    highlightNextHoliday();
}

function createDayCell(year, month, day) {
    const dateStr = `${year}-${month.padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    const dayEvents = events.filter(e => e.date === dateStr).filter(e => filterCategory.value === "all" || e.category === filterCategory.value);

    let markers = "";
    dayEvents.forEach(e => markers += `<span class="event-marker ${e.category}" title="${e.title}"></span>`);

    // Выбор цвета фона по категории праздника
    let bgClass = "";
    if(dayEvents.some(e => e.category === "state")) bgClass = "state";
    else if(dayEvents.some(e => e.category === "international")) bgClass = "international";
    else if(dayEvents.some(e => e.category === "college")) bgClass = "college";

    return `<td class="day-cell ${bgClass}" data-date="${dateStr}">
        <div class="day-number">${day}</div>
        <div>${markers}</div>
    </td>`;
}

function showEvents(dayEvents, date) {
    eventList.innerHTML = `<li><strong>${date}</strong></li>`;
    if(dayEvents.length === 0) eventList.innerHTML += "<li>Событий нет</li>";
    else dayEvents.forEach(e => eventList.innerHTML += `<li class="${e.category}">${e.title}</li>`);
}

/* ================== ДОБАВЛЕНИЕ СОБЫТИЯ ================== */
saveEvent.onclick = () => {
    if(!eventDate.value || !eventTitle.value){ alert("Заполните все поля"); return; }
    events.push({ date: eventDate.value, title: eventTitle.value, category: eventCategory.value, system: false });
    saveToStorage();
    renderCalendar();
    updateNextHoliday();
    eventTitle.value = "";
};

/* ================== ПЕРЕКЛЮЧЕНИЕ МЕСЯЦА ================== */
function changeMonth(offset){
    const [year, month] = monthPicker.value.split("-");
    const date = new Date(year, month-1);
    date.setMonth(date.getMonth()+offset);
    monthPicker.value = date.toISOString().slice(0,7);
    renderCalendar();
    updateNextHoliday();
}
prevMonthBtn.onclick = () => changeMonth(-1);
nextMonthBtn.onclick = () => changeMonth(1);
monthPicker.onchange = () => { renderCalendar(); updateNextHoliday(); };
filterCategory.onchange = renderCalendar;

/* ================== ПОДСВЕТКА СЕГОДНЯ ================== */
function highlightToday(){
    const today = new Date().toISOString().split("T")[0];
    document.querySelectorAll(".day-cell").forEach(cell=>{ if(cell.dataset.date===today) cell.classList.add("today"); });
}

/* ================== БЛИЖАЙШИЙ ПРАЗДНИК ================== */
function updateNextHoliday(){
    const today = new Date();
    const upcoming = events.filter(e=>e.system).map(e=>({...e,dateObj:new Date(e.date)})).filter(e=>e.dateObj>=today).sort((a,b)=>a.dateObj-b.dateObj);
    if(upcoming.length===0){ holidayCountdown.textContent="Ближайших праздников нет"; return; }
    const next = upcoming[0];
    const diffDays = Math.ceil((next.dateObj - today)/(1000*60*60*24));
    holidayCountdown.textContent=`Ближайший праздник: "${next.title}" через ${diffDays} дней (${next.date})`;
}

/* ================== ПОДСВЕТКА БЛИЖАЙШЕГО ПРАЗДНИКА В КАЛЕНДАРЕ ================== */
function highlightNextHoliday(){
    const today = new Date();
    const upcoming = events.filter(e=>e.system).map(e=>({...e,dateObj:new Date(e.date)})).filter(e=>e.dateObj>=today).sort((a,b)=>a.dateObj-b.dateObj);
    if(upcoming.length===0) return;
    const next = upcoming[0];
    document.querySelectorAll(".day-cell").forEach(cell=>{ if(cell.dataset.date===next.date) cell.classList.add("next-holiday"); });
}
