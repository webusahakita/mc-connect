const fs = require('fs');

let cjs = fs.readFileSync('public/js/customers.js', 'utf8');

const targetStr = 'renderSidebarCustomerList();\n    }';
const replaceStr = `renderSidebarCustomerList();
        
        // Auto-heal: Ensure all loaded customers are in the calendar
        setTimeout(() => {
            if (typeof window.autoSyncCustomersToEvents === 'function') {
                window.autoSyncCustomersToEvents(mcCustomers);
            }
        }, 1500); // Give events DB time to load
    }`;

cjs = cjs.replace(targetStr, replaceStr);

// Let's also check if there is an alternate closing brace
if (!cjs.includes('autoSyncCustomersToEvents(mcCustomers)')) {
    cjs = cjs.replace('renderSidebarCustomerList();', `renderSidebarCustomerList();
        setTimeout(() => {
            if (typeof window.autoSyncCustomersToEvents === 'function') {
                window.autoSyncCustomersToEvents(mcCustomers);
            }
        }, 1500);`);
}

fs.writeFileSync('public/js/customers.js', cjs, 'utf8');
console.log('Injected auto-heal into customers.js');
