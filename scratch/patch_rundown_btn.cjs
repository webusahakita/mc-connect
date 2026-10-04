const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Rename checkAndGenerateDummyRundown to applyDefaultRundown and remove the "auto check" constraint
const genRegex = /window\.checkAndGenerateDummyRundown\s*=\s*function\(currentEv\)\s*\{[\s\S]*?if\s*\(typeof\s*window\.syncEventMetadata\s*===\s*'function'\)\s*\{\s*window\.syncEventMetadata\(currentEv\);\s*\}\s*\}\s*\};/g;

const applyDefaultFn = `
window.applyDefaultRundown = async function() {
    let currentEv = _getEv();
    if (!currentEv) return;
    
    if (!(await window.uiConfirm('Terapkan template rundown default? Data rundown saat ini akan ditimpa jika ada.'))) return;
    
    currentEv.rundown = [
        { title: 'Open Gate & Welcoming', start_time: '18:30', end_time: '19:00', time: '18:30 - 19:00', prompter: 'Selamat malam dan selamat datang kepada seluruh keluarga besar serta tamu undangan yang terhormat. Silakan menikmati welcoming cocktail sembari menanti dimulainya acara.', cue_music: 'BGM Acoustic', pic: 'Greeter Team' },
        { title: 'Grand Entrance', start_time: '19:00', end_time: '19:15', time: '19:00 - 19:15', prompter: 'Hadirin sekalian, mari kita sambut dengan meriah, kehadiran bintang utama pada malam hari ini...', cue_music: 'Fanfare / Entrance Song', pic: 'Stage Manager' },
        { title: 'Opening & Doa', start_time: '19:15', end_time: '19:30', time: '19:15 - 19:30', prompter: 'Sebelum kita memulai seluruh rangkaian acara, marilah kita sejenak menundukkan kepala untuk berdoa...', cue_music: 'Soft Instrumental', pic: 'MC / Rohaniwan' },
        { title: 'Sambutan-Sambutan', start_time: '19:30', end_time: '19:45', time: '19:30 - 19:45', prompter: 'Kini, kami mengundang perwakilan keluarga untuk memberikan sambutan...', cue_music: '', pic: 'Keluarga' },
        { title: 'Ramah Tamah & Dinner', start_time: '19:45', end_time: '20:45', time: '19:45 - 20:45', prompter: 'Kami persilakan kepada seluruh tamu undangan untuk menikmati hidangan yang telah disediakan...', cue_music: 'Dinner Playlist', pic: 'F&B Team' },
        { title: 'Games / Entertainment', start_time: '20:45', end_time: '21:30', time: '20:45 - 21:30', prompter: 'Saatnya kita bersenang-senang! Siapa yang bisa menjawab pertanyaan ini...', cue_music: 'Upbeat Track', pic: 'Entertainment Team' },
        { title: 'Closing & Photo Session', start_time: '21:30', end_time: '22:00', time: '21:30 - 22:00', prompter: 'Tibalah kita di penghujung acara. Terima kasih atas kehadiran Anda semua...', cue_music: 'Closing Theme', pic: 'Fotografer' }
    ];
    
    currentEv.metadata = currentEv.metadata || {};
    currentEv.metadata.rundown = currentEv.rundown;
    
    if (typeof window.syncEventMetadata === 'function') {
        window.syncEventMetadata(currentEv);
    }
    
    if (typeof window.renderAdminRundownList === 'function') {
        window.renderAdminRundownList(currentEv);
    }
    
    if (typeof window.showToast === 'function') {
        window.showToast('Template Rundown berhasil diterapkan!', 'green');
    }
};
`;

content = content.replace(genRegex, applyDefaultFn);

// 2. Remove the auto call inside renderAdminRundownList and update empty state
const autoCallRegex = /if\s*\(agenda\.length\s*===\s*0\)\s*\{\s*container\.innerHTML\s*=\s*'<div style="text-align:center; padding:2rem; background:rgba\(255,255,255,0\.02\); border-radius:12px; color:var\(--adm-text-muted\);">Belum ada segmen rundown\. Klik "\+ Tambah Segmen" untuk memulai\.<\/div>';\s*return;\s*\}\s*window\.checkAndGenerateDummyRundown\(ev\);\s*const\s*updatedAgenda\s*=\s*ev\.rundown\s*\|\|\s*ev\.agenda\s*\|\|\s*\[\];/g;

const newEmptyState = `
    if (agenda.length === 0) {
        container.innerHTML = \`<div style="text-align:center; padding:3rem 2rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">
            <div style="font-size:2rem; margin-bottom:1rem;">📝</div>
            <div style="font-size:1.1rem; font-weight:600; color:#fff; margin-bottom:0.5rem;">Belum ada segmen rundown.</div>
            <div style="margin-bottom:1.5rem; color:var(--adm-text-secondary);">Anda dapat menambahkannya satu per satu, atau menggunakan template standar untuk mempercepat.</div>
            <div style="display:flex; gap:1rem; justify-content:center; flex-wrap:wrap;">
                <button class="btn btn-secondary" onclick="window.applyDefaultRundown()" style="color:var(--adm-gold); border-color:var(--adm-gold);">+ Gunakan Template Default</button>
                <button class="btn btn-primary" onclick="window.openAddRundownModal()">+ Tambah Segmen Manual</button>
            </div>
        </div>\`;
        return;
    }
    const updatedAgenda = ev.rundown || ev.agenda || [];
`;

content = content.replace(autoCallRegex, newEmptyState);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched rundown logic to be button-based!");
