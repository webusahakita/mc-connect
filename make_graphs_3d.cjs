const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// For Pie Charts
html = html.replace(/id="dashIncomeProporsiSvg"([^>]*)transform:rotate\(-90deg\)/g, 'id="dashIncomeProporsiSvg"(-90deg) rotateX(35deg) scale(1.1); filter: drop-shadow(0px 12px 10px rgba(0,0,0,0.6)) drop-shadow(0px -2px 2px rgba(255,255,255,0.2))');
html = html.replace(/id="dashExpenseProporsiSvg"([^>]*)transform:rotate\(-90deg\)/g, 'id="dashExpenseProporsiSvg"(-90deg) rotateX(35deg) scale(1.1); filter: drop-shadow(0px 12px 10px rgba(0,0,0,0.6)) drop-shadow(0px -2px 2px rgba(255,255,255,0.2))');

// For Line Charts (add 3D glow/shadow)
// The mini-chart paths usually have a stroke. We can just apply a filter to the SVG itself, but it's better to add it to CSS.
fs.writeFileSync('public/admin.html', html, 'utf8');
console.log('Fixed SVG 3D in HTML');

let css = fs.readFileSync('public/css/admin.css', 'utf8');
if (!css.includes('.mini-chart-svg path')) {
    css += \n
/* 3D Effects for Dashboard Graphs */
.mini-chart-svg {
    filter: drop-shadow(0 10px 8px rgba(0,0,0,0.5)) drop-shadow(0 4px 4px rgba(16,185,129,0.3));
    transform: perspective(500px) rotateX(15deg);
    overflow: visible;
}
.ecc-card svg[id$="ProporsiSvg"] {
    transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.ecc-card:hover svg[id$="ProporsiSvg"] {
    transform: rotate(-90deg) rotateX(20deg) scale(1.15) translateY(-5px) !important;
    filter: drop-shadow(0px 20px 15px rgba(0,0,0,0.8)) drop-shadow(0px -3px 3px rgba(255,255,255,0.3)) !important;
}
;
    fs.writeFileSync('public/css/admin.css', css, 'utf8');
    console.log('Added 3D graph styles to CSS');
}
