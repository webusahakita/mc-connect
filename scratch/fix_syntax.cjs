const fs = require('fs');

function fixParentheses(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix missing closing parenthesis for if(!(await window.uiConfirm(...)) return;
    // Specifically looking for: if(!(await window.uiConfirm('...')) return;
    // Replace with: if(!(await window.uiConfirm('...'))) return;
    
    // Simple global replace for the specific broken syntax:
    // Pattern: if(!(await window.uiConfirm('...')) return;
    // Note the lack of the 3rd closing parenthesis before 'return;'
    
    let changed = false;
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('if(!(await window.uiConfirm(') && lines[i].includes(')) return;')) {
            lines[i] = lines[i].replace(')) return;', '))) return;');
            changed = true;
        } else if (lines[i].includes('if( (await window.uiConfirm(') && lines[i].includes(')) return;')) {
            // just in case it wasn't negated
            lines[i] = lines[i].replace(')) return;', '))) return;');
            changed = true;
        }
    }
    
    if (changed) {
        fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
        console.log('Fixed parentheses in:', filePath);
    }
}

fixParentheses('public/js/cms-overrides.js');
fixParentheses('public/js/admin-core.js');
fixParentheses('public/js/calendar.js');
fixParentheses('public/js/customers.js');
