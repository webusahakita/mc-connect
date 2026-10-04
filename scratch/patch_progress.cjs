const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

code = code.replace(/if \(container\) container\.innerHTML = '<div style="text-align:center; padding:1rem; color:var\(--adm-text-muted\);">Pilih acara terlebih dahulu\.<\/div>';/,
    "if (container) container.innerHTML = '<div style=\"text-align:center; padding:1rem; color:var(--adm-text-muted);\">Pilih acara terlebih dahulu.</div>';\n        const p = document.getElementById('rundownProgressBadge');\n        if (p) p.textContent = '0/0 Selesai (0%)';"
);

code = code.replace(/const agenda = ev\.rundown \|\| ev\.agenda \|\| \[\];/,
    "const agenda = ev.rundown || ev.agenda || [];\n    const p = document.getElementById('rundownProgressBadge');\n    if (p) {\n        if (agenda.length === 0) p.textContent = '0/0 Selesai (0%)';\n        else {\n            const comp = agenda.filter(i => i.status === 'SELESAI').length;\n            const pct = Math.round((comp/agenda.length)*100);\n            p.textContent = comp + '/' + agenda.length + ' Selesai (' + pct + '%)';\n        }\n    }"
);

fs.writeFileSync('public/js/admin-core.js', code);
console.log('patched');
