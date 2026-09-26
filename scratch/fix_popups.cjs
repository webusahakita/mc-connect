const fs = require('fs');
const path = require('path');

function processFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // 1. Convert functions containing confirm() to async
    // e.g. window.deleteRider = function(i) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('confirm(') || lines[i].includes('uiConfirm(')) {
            // Find the function declaration backwards
            for (let j = i; j >= 0; j--) {
                if (lines[j].includes('function') && !lines[j].includes('async function')) {
                    lines[j] = lines[j].replace('function', 'async function');
                    changed = true;
                    break;
                }
            }
        }
    }
    content = lines.join('\n');

    // 2. Replace confirm() with await window.uiConfirm()
    if (content.match(/([^\w.]|^)confirm\(/)) {
        content = content.replace(/([^\w.]|^)confirm\(/g, '$1(await window.uiConfirm(');
        changed = true;
    }
    
    // Some already use uiConfirm but not await
    if (content.includes('!uiConfirm(')) {
        content = content.replace(/!uiConfirm\(/g, '!(await window.uiConfirm(');
        changed = true;
    }

    // 3. Replace alert() with window.uiAlert()
    if (content.match(/([^\w.]|^)alert\(/)) {
        content = content.replace(/([^\w.]|^)alert\(/g, '$1window.uiAlert(');
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed popups in:', filePath);
    }
}

processFile('public/js/cms-overrides.js');
processFile('public/js/admin-core.js');
processFile('public/js/calendar.js');
processFile('public/js/customers.js');
