const fs = require('fs');
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// Find the DOMContentLoaded block
let domIdx = js.lastIndexOf("document.addEventListener('DOMContentLoaded'");
let beforeDom = js.substring(0, domIdx);
let domBlock = js.substring(domIdx);

// The correct DOMContentLoaded block should be:
let fixedDomBlock = `document.addEventListener('DOMContentLoaded', () => {
    // Muat CMS Landing Page Configuration
    initAdminCms();
    
    // Muat Cash Flow Database
    loadCashflowTransactions();

    // Start Clock
    updateAdminClock();
    setInterval(updateAdminClock, 1000);

    // Format current date in banner
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayFormatted = new Date().toLocaleDateString('id-ID', dateOptions);
    const dateBanner = document.getElementById('dashCurrentDate');
    if (dateBanner) dateBanner.textContent = todayFormatted;

    // Load username if available
    try {
        const storedUser = sessionStorage.getItem('mc_auth_user');
        if (storedUser) {
            const userObj = JSON.parse(storedUser);
            if (userObj.name) {
                const welcomeName = document.getElementById('dashWelcomeName');
                if (welcomeName) welcomeName.textContent = userObj.name.split(',')[0];
            }
        }
    } catch(e) {}

    // Initialize unified database & de-duplicate
    try {
        loadUnifiedEventsDatabase();
        populateCommandCenterSelector();

        if (typeof AvailabilityCalendar !== 'undefined' && document.getElementById('adminCalendarWidget')) {
            window.adminCalendar = new AvailabilityCalendar('adminCalendarWidget', adminEventsDb, (dateStr, status, eventObj, eventsOnDate) => {
                showAgendaInspector(dateStr, status, eventObj, eventsOnDate);
            });
            window.calendarApp = window.adminCalendar;
        }
    } catch(e) { console.error("Calendar Init Error:", e); }

    // Navigate to default section
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-dashboard', document.getElementById('menu-dashboard'));
    }
});
`;

js = beforeDom + fixedDomBlock;

// Final brace check
let openBraces = 0;
for (let i = 0; i < js.length; i++) {
    if (js[i] === '{') openBraces++;
    if (js[i] === '}') openBraces--;
}
console.log('Final brace balance:', openBraces);

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
console.log('admin-core.js DOMContentLoaded block fully rewritten');
