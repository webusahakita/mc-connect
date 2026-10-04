const fs = require('fs');
const path = 'c:\\Users\\Nawakara\\.gemini\\antigravity-ide\\scratch\\mc-connect\\public\\js\\admin-core.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Patch syncEventMetadata to safely send ALL metadata
const syncRegex = /window\.syncEventMetadata = async function\(ev\) \{[\s\S]*?const actualId = ev\.db_id \|\| String\(ev\.id\)\.replace\('e_', ''\);/g;
const newSync = `window.syncEventMetadata = async function(ev) {
    if (!ev) return;
    try {
        ev.metadata = ev.metadata || {};
        if (ev.checklist) ev.metadata.checklist = ev.checklist;
        if (ev.expenses) ev.metadata.expenses = ev.expenses;
        if (ev.vipNotes !== undefined) ev.metadata.vipNotes = ev.vipNotes;
        if (ev.vipProtocol) ev.metadata.vipProtocol = ev.vipProtocol;
        if (ev.invoiceItems !== undefined) ev.metadata.invoice_items = ev.invoiceItems;
        if (ev.wardrobeIds) ev.metadata.wardrobeIds = ev.wardrobeIds;
        if (ev.musicList) ev.metadata.musicList = ev.musicList;
        if (ev.landingMusic) ev.metadata.landingMusic = ev.landingMusic;
        if (ev.rundown) ev.metadata.rundown = ev.rundown;
        
        const payload = {
            metadata: ev.metadata
        };
        const actualId = ev.db_id || String(ev.id).replace('e_', '');`;
content = content.replace(syncRegex, newSync);


// 2. Add Dummy Rundown Generator
const dummyRundown = `
window.checkAndGenerateDummyRundown = function(currentEv) {
    if (!currentEv) return;
    if (!currentEv.rundown) currentEv.rundown = [];
    currentEv.metadata = currentEv.metadata || {};
    
    if (currentEv.rundown.length === 0 && !currentEv.metadata.is_rundown_generated) {
        currentEv.rundown = [
            { title: 'Open Gate & Welcoming', start_time: '18:30', end_time: '19:00', time: '18:30 - 19:00', prompter: 'Selamat malam dan selamat datang kepada seluruh keluarga besar serta tamu undangan yang terhormat. Silakan menikmati welcoming cocktail sembari menanti dimulainya acara.', cue_music: 'BGM Acoustic', pic: 'Greeter Team' },
            { title: 'Grand Entrance', start_time: '19:00', end_time: '19:15', time: '19:00 - 19:15', prompter: 'Hadirin sekalian, mari kita sambut dengan meriah, kehadiran bintang utama pada malam hari ini...', cue_music: 'Fanfare / Entrance Song', pic: 'Stage Manager' },
            { title: 'Opening & Doa', start_time: '19:15', end_time: '19:30', time: '19:15 - 19:30', prompter: 'Sebelum kita memulai seluruh rangkaian acara, marilah kita sejenak menundukkan kepala untuk berdoa...', cue_music: 'Soft Instrumental', pic: 'MC / Rohaniwan' },
            { title: 'Sambutan-Sambutan', start_time: '19:30', end_time: '19:45', time: '19:30 - 19:45', prompter: 'Kini, kami mengundang perwakilan keluarga untuk memberikan sambutan...', cue_music: '', pic: 'Keluarga' },
            { title: 'Ramah Tamah & Dinner', start_time: '19:45', end_time: '20:45', time: '19:45 - 20:45', prompter: 'Kami persilakan kepada seluruh tamu undangan untuk menikmati hidangan yang telah disediakan...', cue_music: 'Dinner Playlist', pic: 'F&B Team' },
            { title: 'Games / Entertainment', start_time: '20:45', end_time: '21:30', time: '20:45 - 21:30', prompter: 'Saatnya kita bersenang-senang! Siapa yang bisa menjawab pertanyaan ini...', cue_music: 'Upbeat Track', pic: 'Entertainment Team' },
            { title: 'Closing & Photo Session', start_time: '21:30', end_time: '22:00', time: '21:30 - 22:00', prompter: 'Tibalah kita di penghujung acara. Terima kasih atas kehadiran Anda semua...', cue_music: 'Closing Theme', pic: 'Fotografer' }
        ];
        currentEv.metadata.rundown = currentEv.rundown;
        currentEv.metadata.is_rundown_generated = true;
        
        if (typeof window.syncEventMetadata === 'function') {
            window.syncEventMetadata(currentEv);
        }
    }
};
`;

// 3. Rewrite renderAdminRundownList
const rundownListRegex = /container\.innerHTML = agenda\.map\(\(item, i\) => \{[\s\S]*?\}\)\.join\(''\);/g;
const newRundownList = `
    window.checkAndGenerateDummyRundown(ev);
    const updatedAgenda = ev.rundown || ev.agenda || [];

    container.innerHTML = updatedAgenda.map((item, i) => {
        let durationStr = '';
        try {
            if (item.start_time && item.end_time) {
                const [sh, sm] = item.start_time.split(':').map(Number);
                const [eh, em] = item.end_time.split(':').map(Number);
                let diff = (eh * 60 + em) - (sh * 60 + sm);
                if (diff < 0) diff += 24 * 60;
                if (diff > 0) durationStr = \`⏳ \${diff} Menit\`;
            }
        } catch(e) {}
        
        const isCompleted = item.status === 'SELESAI'; // Assuming we might add status tracking later, default false for now
        const borderColor = isCompleted ? '#10B981' : 'var(--adm-gold)';

        return \`
        <div style="background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); border-left:4px solid \${borderColor}; border-radius:12px; margin-bottom:1rem; overflow:hidden;">
            <div style="display:flex; align-items:center; padding:1rem; border-bottom:1px solid rgba(255,255,255,0.05); gap:1rem; flex-wrap:wrap;">
                
                <div style="display:flex; align-items:center; gap:0.75rem;">
                    <div style="width:18px; height:18px; background:rgba(212,175,55,0.2); border-radius:4px; display:flex; align-items:center; justify-content:center;">
                        <input type="checkbox" style="width:14px; height:14px; accent-color:var(--adm-gold); margin:0;" \${isCompleted ? 'checked' : ''}>
                    </div>
                    <div style="width:26px; height:26px; border-radius:50%; border:2px solid \${borderColor}; display:flex; align-items:center; justify-content:center; color:\${borderColor}; font-weight:700; font-size:0.85rem;">
                        \${i+1}
                    </div>
                </div>

                <div style="display:flex; align-items:center; gap:0.75rem; flex:1; min-width:200px;">
                    <div style="background:rgba(255,255,255,0.06); padding:0.25rem 0.6rem; border-radius:6px; font-size:0.8rem; font-weight:600; color:var(--adm-gold); display:flex; align-items:center; gap:0.4rem;">
                        ⏰ \${item.time || (item.start_time + ' - ' + item.end_time)}
                    </div>
                    \${durationStr ? \`<div style="background:rgba(255,255,255,0.06); padding:0.25rem 0.6rem; border-radius:6px; font-size:0.8rem; font-weight:600; color:var(--adm-text-muted); display:flex; align-items:center; gap:0.4rem;">
                        \${durationStr}
                    </div>\` : ''}
                    <div style="font-size:1.05rem; font-weight:700; color:#fff; \${isCompleted ? 'text-decoration:line-through; opacity:0.6;' : ''}">
                        \${escapeHtml(item.title || 'Segmen Tanpa Judul')}
                    </div>
                    \${isCompleted ? \`<span style="background:rgba(16,185,129,0.15); border:1px solid rgba(16,185,129,0.3); border-radius:20px; padding:0.15rem 0.6rem; font-size:0.7rem; color:#10B981; font-weight:700; margin-left:0.5rem;">✓ SELESAI</span>\` : ''}
                </div>

                <div style="display:flex; gap:0.5rem; align-items:center;">
                    <button class="btn btn-secondary btn-sm" style="padding:0.25rem 0.6rem;" onclick="window.moveRundownSegment(\${i}, -1)" \${i===0 ? 'disabled' : ''}>▲</button>
                    <button class="btn btn-secondary btn-sm" style="padding:0.25rem 0.6rem;" onclick="window.moveRundownSegment(\${i}, 1)" \${i===updatedAgenda.length-1 ? 'disabled' : ''}>▼</button>
                    <button class="btn btn-secondary btn-sm" style="color:var(--adm-gold); border-color:rgba(212,175,55,0.3); padding:0.25rem 0.75rem;" onclick="window.openAddRundownModal(\${i})">✏️ Edit</button>
                    <button class="btn btn-secondary btn-sm" style="color:#F87171; border-color:rgba(248,113,113,0.3); padding:0.25rem 0.75rem;" onclick="window.deleteRundownSegment(\${i})">🗑️</button>
                </div>
            </div>
            
            <div style="padding:1.25rem; border-left:3px solid var(--adm-gold); background:rgba(0,0,0,0.2); margin:0.75rem 1rem 1rem 1rem; border-radius:4px;">
                <div style="font-size:0.75rem; font-weight:700; color:var(--adm-gold); margin-bottom:0.6rem; letter-spacing:0.5px; display:flex; align-items:center; gap:0.4rem;">
                    🎤 PANDUAN NASKAH / PROMPTER MC:
                </div>
                <div style="font-size:0.95rem; color:var(--adm-text-secondary); line-height:1.6; margin-bottom:1.2rem; white-space:pre-wrap;">\${escapeHtml(item.prompter || 'Tidak ada naskah khusus untuk segmen ini.')}</div>
                <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
                    \${item.cue_music ? \`<div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:6px; padding:0.35rem 0.75rem; font-size:0.85rem; color:#38BDF8; font-weight:600; display:flex; align-items:center; gap:0.4rem;">Cue Audio: 🎵 \${escapeHtml(item.cue_music)}</div>\` : ''}
                    \${item.pic ? \`<div style="background:rgba(167,139,250,0.1); border:1px solid rgba(167,139,250,0.3); border-radius:6px; padding:0.35rem 0.75rem; font-size:0.85rem; color:#A78BFA; font-weight:600; display:flex; align-items:center; gap:0.4rem;">👤 PIC: \${escapeHtml(item.pic)}</div>\` : ''}
                </div>
            </div>
        </div>
        \`;
    }).join('');
`;

content = dummyRundown + content;
content = content.replace(rundownListRegex, newRundownList);

fs.writeFileSync(path, content, 'utf8');
console.log("Patched Rundown UI and added Dummy Generator!");
