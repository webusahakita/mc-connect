const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// Revert all 🌓 back to ,
html = html.replace(/🌓/g, ',');

// Now specifically fix the toggle theme button
// <button onclick="toggleTheme()" ... id="themeToggleBtn" ...>
//    , 
// </button>
// The button has id="themeToggleBtn"
html = html.replace(/(<button[^>]*id="themeToggleBtn"[^>]*>)\s*,\s*(<\/button>)/, ' 🌗 ');

// Just in case it's not matched by regex exactly
let btnMatch = html.match(/<button[^>]*id="themeToggleBtn"[^>]*>[\s\S]*?<\/button>/);
if (btnMatch) {
    let replacedBtn = btnMatch[0].replace(/,/, '🌗');
    html = html.replace(btnMatch[0], replacedBtn);
}

fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Reverted moon emojis to commas!');
