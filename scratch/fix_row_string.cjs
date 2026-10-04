const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// We'll search for the row HTML that has the syntax error and replace it with a properly escaped template literal or standard string!
// Let's use a normal string and avoid onmouseover escaping by using setting class name?
// Or just use double quotes properly. Wait, HTML uses double quotes for attributes.
// <tr onmouseover="this.style.background='rgba(255,255,255,0.02)'" ...>
// So the JS string is:
// html += '<tr onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" ...>';

code = code.replace(/html \+= '<tr style="border-bottom:1px solid rgba\(255,255,255,0\.05\); transition: background 0\.2s;" onmouseover=".*?" onmouseout=".*?">';/, "html += '<tr style=\"border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;\" onmouseover=\"this.style.background=\\'rgba(255,255,255,0.02)\\'\" onmouseout=\"this.style.background=\\'transparent\\'\">';");

code = code.replace(/html \+= '<div onclick="window\.selectBankItem\(' \+ idx \+ '\)" style="display:flex; flex-direction:column; padding:0\.8rem; border:1px solid rgba\(255,255,255,0\.1\); border-radius:8px; margin-bottom:0\.5rem; cursor:pointer; background:rgba\(0,0,0,0\.2\);" onmouseover=".*?" onmouseout=".*?">';/, "html += '<div onclick=\"window.selectBankItem(' + idx + ')\" style=\"display:flex; flex-direction:column; padding:0.8rem; border:1px solid rgba(255,255,255,0.1); border-radius:8px; margin-bottom:0.5rem; cursor:pointer; background:rgba(0,0,0,0.2);\" onmouseover=\"this.style.background=\\'rgba(212,175,55,0.1)\\'\" onmouseout=\"this.style.background=\\'rgba(0,0,0,0.2)\\'\">';");

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed entire row with exact string');
