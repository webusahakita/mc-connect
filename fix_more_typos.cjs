const fs = require('fs');

// Fix admin.html
let html = fs.readFileSync('public/admin.html', 'utf8');
html = html.replace(/0 Tren Pengeluaran/g, '📉 Tren Pengeluaran');
html = html.replace(/RATA-RATBIAYA/g, 'RATA-RATA BIAYA');
html = html.replace(/Belum AdData/g, 'Belum Ada Data');
html = html.replace(/<option>emuStatus Bayar<\/option>/g, '<option value="all">Semua Status Bayar</option>');
html = html.replace(/<option>emuKalender<\/option>/g, '<option value="all">Semua Kalender</option>');

// Make dropdowns wider to fit text
html = html.replace(/id="crmFilterContainer" style="width:175px/g, 'id="crmFilterContainer" style="width:195px');
html = html.replace(/id="crmClientFilterContainer" style="width:175px/g, 'id="crmClientFilterContainer" style="width:195px');

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed admin.html typos and select widths');

// Fix admin-core.js
let jsCore = fs.readFileSync('public/js/admin-core.js', 'utf8');
jsCore = jsCore.replace(/RATA-RATBIAYA/g, 'RATA-RATA BIAYA');
jsCore = jsCore.replace(/Belum AdData/g, 'Belum Ada Data');
if (!jsCore.includes('window.calendarApp = window.adminCalendar;')) {
    jsCore = jsCore.replace(
        /window\.adminCalendar = new AvailabilityCalendar\('adminCalendarWidget'.*\);/s,
        "window.adminCalendar = new AvailabilityCalendar('adminCalendarWidget', adminEventsDb, (dateStr, status, eventObj, eventsOnDate) => { showAgendaInspector(dateStr, status, eventObj, eventsOnDate); });\n            window.calendarApp = window.adminCalendar;"
    );
}
fs.writeFileSync('public/js/admin-core.js', jsCore, 'utf8');
console.log('Fixed admin-core.js calendar instance');

// Fix customers.js
let jsCust = fs.readFileSync('public/js/customers.js', 'utf8');
jsCust = jsCust.replace(/Tidak addata/g, 'Tidak ada data');
jsCust = jsCust.replace(/Cobkatkunci/g, 'Coba kata kunci');
fs.writeFileSync('public/js/customers.js', jsCust, 'utf8');
console.log('Fixed customers.js typos');
