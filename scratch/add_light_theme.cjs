const fs = require('fs');
let css = fs.readFileSync('public/css/app.css', 'utf8');

const lightThemeVars = `
/* Light Theme Override */
[data-theme="light"] {
    /* Color Palette */
    --bg-main: #F8FAFC;
    --bg-surface: #FFFFFF;
    --bg-card: #F1F5F9;
    --bg-card-hover: #E2E8F0;
    --bg-elevated: #FFFFFF;
    
    /* Text Colors */
    --text-primary: #0F172A;
    --text-secondary: #475569;
    --text-muted: #64748B;
    --text-on-accent: #FFFFFF;

    /* Borders & Glass */
    --border-subtle: rgba(0, 0, 0, 0.08);
    --border-accent: rgba(212, 175, 55, 0.4);
    --glass-bg: rgba(255, 255, 255, 0.85);

    /* Shadows */
    --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.1);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    --shadow-gold: 0 0 20px rgba(212, 175, 55, 0.25);
}
`;

if (!css.includes('[data-theme="light"]')) {
    // Insert right after the :root block
    const rootEndIndex = css.indexOf('}');
    if (rootEndIndex !== -1) {
        css = css.slice(0, rootEndIndex + 1) + '\n' + lightThemeVars + css.slice(rootEndIndex + 1);
        fs.writeFileSync('public/css/app.css', css, 'utf8');
        console.log('Added light theme variables to app.css');
    }
} else {
    console.log('Light theme already exists');
}
