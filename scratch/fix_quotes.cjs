const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// The issue is:
// html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" onmouseout="this.style.background=\\'transparent\\'">';
// This evaluates to html += '<tr ... onmouseover="this.style.background=\'rgba...'
// which means the string literal is NOT properly escaped.
// It needs to be written as:
// html += '<tr style="..." onmouseover="this.style.background=\\\'rgba(255,255,255,0.02)\\\'" onmouseout="this.style.background=\\\'transparent\\\'">';

code = code.replace(/onmouseover="this\.style\.background=\\'rgba\(255,255,255,0\.02\)\\'"/g, "onmouseover=\"this.style.background=\\'rgba(255,255,255,0.02)\\'\"");
code = code.replace(/onmouseout="this\.style\.background=\\'transparent\\'"/g, "onmouseout=\"this.style.background=\\'transparent\\'\"");
code = code.replace(/onmouseover="this\.style\.background=\\'rgba\(212,175,55,0\.1\)\\'"/g, "onmouseover=\"this.style.background=\\'rgba(212,175,55,0.1)\\'\"");
code = code.replace(/onmouseout="this\.style\.background=\\'rgba\(0,0,0,0\.2\)\\'"/g, "onmouseout=\"this.style.background=\\'rgba(0,0,0,0.2)\\'\"");

// Actually, in restore_missing_functions.cjs, it was written exactly as:
// html += '<tr style="..." onmouseover="this.style.background=\\'rgba(255,255,255,0.02)\\'" onmouseout="this.style.background=\\'transparent\\'">';
// Wait, when written inside a template literal, `\\'` evaluates to `\'`.
// But when written to JS file, it becomes `\'`, which terminates the string!
// Let's just fix it universally by searching for that exact string structure and correctly escaping the single quotes!
code = code.replace(/this\.style\.background=\\'rgba/g, "this.style.background=\\\\'rgba");
code = code.replace(/this\.style\.background=\\'transparent\\'/g, "this.style.background=\\\\'transparent\\\\'");
code = code.replace(/\(0,0,0,0\.2\)\\'/g, "(0,0,0,0.2)\\\\'");
code = code.replace(/\(212,175,55,0\.1\)\\'/g, "(212,175,55,0.1)\\\\'");

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed quotes syntax');
