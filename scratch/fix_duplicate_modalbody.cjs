const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const regex = /\/\/ Inject "Import from Bank" button[\s\S]*?modalBody\.insertBefore\(btn, modalBody\.firstChild\);\s*}\s*\/\/ Inject "Import from Bank" button[\s\S]*?modalBody\.insertBefore\(btn, modalBody\.firstChild\);\s*}/;

const replacement = `// Inject "Import from Bank" button
          const modalBody = document.querySelector('.modal-body');
          if (modalBody && !document.getElementById('btnImportBank')) {
              const btn = document.createElement('button');
              btn.id = 'btnImportBank';
              btn.className = 'btn btn-primary';
              btn.style.width = '100%';
              btn.style.marginBottom = '1.5rem';
              btn.style.background = 'linear-gradient(135deg, var(--adm-gold), #FDE047)';
              btn.style.color = '#000';
              btn.style.fontWeight = 'bold';
              btn.innerHTML = '🎵 Impor Lagu dari Bank Master';
              btn.onclick = () => window.showMusicBankSelector();
              modalBody.insertBefore(btn, modalBody.firstChild);
          }`;

code = code.replace(regex, replacement);

// And inject it into openAddLandingMusicModal because it missed it!
// We'll search for openAddLandingMusicModal and inject it there.
const landingRegex = /(window\.openAddLandingMusicModal = async function.*?setTimeout\(\(\) => \{[\s\S]*?if \(linkInput && fileInput\) \{)/;
code = code.replace(landingRegex, "$1\n" + replacement);

fs.writeFileSync('public/js/admin-core.js', code);
console.log('Fixed duplicated modalBody and added to landing music');
