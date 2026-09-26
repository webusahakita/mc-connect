const fs = require('fs');

const file = 'public/js/admin-core.js';
let content = fs.readFileSync(file, 'utf8');

const target1 = `    selector.innerHTML = filteredEvents.map(ev => {
        let icon = '💍';
        if (ev.category === 'Corporate') icon = '🏢';
        else if (ev.category === 'Private Gala') icon = '🎉';
        return \`<option value="\${ev.id}">\${icon} [\${ev.date}] \${ev.title} (\${ev.status})</option>\`;
    }).join('');`;

const replacement1 = `    selector.innerHTML = filteredEvents.map(ev => {
        let icon = '💍';
        if (ev.category === 'Corporate') icon = '🏢';
        else if (ev.category === 'Private Gala') icon = '🎉';
        
        let displayTitle = ev.title;
        if (typeof mcCustomers !== 'undefined' && ev.customerId) {
            const customer = mcCustomers.find(c => String(c.id) === String(ev.customerId));
            if (customer && customer.name) {
                displayTitle = \`\${customer.name} - \${ev.title}\`;
            }
        }
        
        return \`<option value="\${ev.id}">\${icon} [\${ev.date}] \${displayTitle} (\${ev.status})</option>\`;
    }).join('');`;

const target2 = `    const statusSelect = document.getElementById('ccStatusSelect');
    if (statusSelect) statusSelect.value = ev.status;`;

const replacement2 = `    const statusSelect = document.getElementById('ccStatusSelect');
    if (statusSelect) {
        const match = Array.from(statusSelect.options).find(o => o.value.toLowerCase() === (ev.status || '').toLowerCase());
        if (match) statusSelect.value = match.value;
    }`;

// Normalize line endings for replacement
const normalize = (str) => str.replace(/\r\n/g, '\n');

content = normalize(content);
const t1 = normalize(target1);
const t2 = normalize(target2);

if (content.includes(t1)) {
    content = content.replace(t1, replacement1);
    console.log('Replaced target 1');
} else {
    console.log('Failed to find target 1');
}

if (content.includes(t2)) {
    content = content.replace(t2, replacement2);
    console.log('Replaced target 2');
} else {
    console.log('Failed to find target 2');
}

fs.writeFileSync(file, content, 'utf8');
