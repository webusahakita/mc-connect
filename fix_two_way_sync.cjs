const fs = require('fs');

// ============================================================
// FIX CUSTOMERS.JS EXPOSURE
// ============================================================
let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

if (!cjs.includes('window.saveCustomersData = saveCustomersData;')) {
    cjs = cjs.replace(
        'window.resetToDefaultCustomers = resetToDefaultCustomers;',
        'window.resetToDefaultCustomers = resetToDefaultCustomers;\n    window.saveCustomersData = saveCustomersData;'
    );
    fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
    console.log('Exposed saveCustomersData in customers.js');
}

// ============================================================
// FIX ADMIN-CORE.JS SYNC FUNCTIONS
// ============================================================
let js = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Modify autoSyncEventsToCustomers to call saveCustomersData
let match = js.match(/function\s+autoSyncEventsToCustomers\s*\([\s\S]*?\n\}/);
if (match) {
    let fn = match[0];
    fn = fn.replace(
        /\/\*\s*localStorage removed\s*\*\/\s*;\s*;/g, 
        ''
    );
    fn = fn.replace(
        /\/\*\s*localStorage removed\s*\*\/\s*;/g, 
        ''
    );
    // Add call to window.saveCustomersData()
    if (!fn.includes('window.saveCustomersData()')) {
        fn = fn.replace(
            /if\s*\(\s*typeof\s+mcCustomers\s*!==\s*'undefined'\s*\)\s*\{\s*window\.mcCustomers\s*=\s*customers;\s*\}/,
            `if (typeof mcCustomers !== 'undefined') {
            window.mcCustomers = customers;
        }
        if (typeof window.saveCustomersData === 'function') {
            window.saveCustomersData();
        }`
        );
        js = js.replace(match[0], fn);
        console.log('Fixed autoSyncEventsToCustomers to save data');
    }
}

// 2. Add window.autoSyncCustomersToEvents
let newSyncFn = `
function autoSyncCustomersToEvents(customers) {
    if (!customers || !Array.isArray(customers)) return;
    
    let isModified = false;
    customers.forEach(cust => {
        if (!cust.date || !cust.event) return;
        
        const key = \`\${cust.date}::\${(cust.event || '').trim().toLowerCase()}\`;
        let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || \`\${e.date}::\${(e.title || '').trim().toLowerCase()}\` === key);

        let status = 'Review';
        if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
            status = 'Terkunci';
        } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
            status = 'Tentative';
        }

        const timeFormatted = cust.time || (cust.startTime && cust.endTime ? \`\${cust.startTime} - \${cust.endTime} WIB (\${cust.duration || ''})\` : '18:00 - 22:00 WIB (4 Jam)');
        
        if (existingIndex >= 0) {
            // Update existing
            const ev = adminEventsDb[existingIndex];
            if (ev.title !== cust.event || ev.date !== cust.date || ev.time !== timeFormatted || ev.status !== status || ev.rawPrice !== Number(cust.price || 0)) {
                ev.title = cust.event;
                ev.date = cust.date;
                ev.time = timeFormatted;
                ev.status = status;
                ev.paymentStatus = cust.paymentStatus;
                ev.rawPrice = Number(cust.price || 0);
                ev.price = 'Rp ' + ev.rawPrice.toLocaleString('id-ID');
                ev.category = cust.category || ev.category;
                isModified = true;
            }
        } else {
            // Create new
            const eventData = {
                id: cust.id || Date.now(),
                customerId: cust.id,
                title: cust.event,
                date: cust.date,
                time: timeFormatted,
                startTime: cust.startTime || '18:00',
                endTime: cust.endTime || '22:00',
                duration: cust.duration || '4 Jam',
                venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
                pic: cust.name + (cust.wa ? \` (\${cust.wa})\` : ''),
                price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
                rawPrice: Number(cust.price || 0),
                status: status,
                paymentStatus: cust.paymentStatus,
                note: \`\${cust.paymentStatus} - Terintegrasi dari CRM Pelanggan\`,
                category: cust.category || 'Event',
                vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
                vipProtocol: [
                    { role: 'Klien PIC', name: cust.name },
                    { role: 'Koordinator FOH', name: 'Tim Stage Runner MC' }
                ],
                checklist: [
                    { text: 'Konfirmasi pelafalan nama klien & gelar', done: true },
                    { text: 'Cek gladi mic wireless Shure di venue', done: true },
                    { text: 'Briefing sinyal cue musik panggung', done: false }
                ],
                expenses: []
            };
            adminEventsDb.push(eventData);
            isModified = true;
        }
    });

    if (isModified) {
        adminEventsDb.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save back to DB
        // Push directly to API so it's consistent
        pushEventsToServer(adminEventsDb);
        
        if (window.adminCalendar) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        if (typeof renderAdminAgendaList === 'function') renderAdminAgendaList();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        if (typeof populateCommandCenterSelector === 'function') populateCommandCenterSelector();
    }
}
window.autoSyncCustomersToEvents = autoSyncCustomersToEvents;
`;

if (!js.includes('function autoSyncCustomersToEvents')) {
    js += '\n' + newSyncFn;
    console.log('Added autoSyncCustomersToEvents');
}

fs.writeFileSync('public/js/admin-core.js', js, 'utf8');
