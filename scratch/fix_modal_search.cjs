const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const filterLogic = `
                        const filter = this.value.toLowerCase();
                        const select = document.getElementById('evmFormBankSelect');
                        if (!window._fullBankOptionsMusic) {
                            window._fullBankOptionsMusic = Array.from(select.options).map(o => ({val: o.value, text: o.text, selected: o.selected}));
                        }
                        select.innerHTML = '';
                        window._fullBankOptionsMusic.forEach(o => {
                            if (o.val === '' || o.text.toLowerCase().includes(filter)) {
                                const opt = document.createElement('option');
                                opt.value = o.val;
                                opt.textContent = o.text;
                                if (o.selected) opt.selected = true;
                                select.appendChild(opt);
                            }
                        });
`;

// Patch openAddMusicModal
const musicTargetOld = `<input type="text" id="evmFormBankSearch" class="form-input" placeholder="🔍 Ketik untuk mencari judul lagu..." style="margin-bottom:0.5rem;" oninput="
                        const filter = this.value.toLowerCase();
                        const options = document.getElementById('evmFormBankSelect').getElementsByTagName('option');
                        for (let i = 0; i < options.length; i++) {
                            if (options[i].value === '') continue;
                            if (options[i].text.toLowerCase().indexOf(filter) > -1) {
                                options[i].style.display = '';
                            } else {
                                options[i].style.display = 'none';
                            }
                        }
                    ">`;
                    
const musicTargetNew = `<input type="text" id="evmFormBankSearch" class="form-input" placeholder="🔍 Ketik untuk mencari judul lagu..." style="margin-bottom:0.5rem;" oninput="${filterLogic.replace(/"/g, '&quot;')}">`;

if (code.includes(musicTargetOld)) {
    code = code.replace(musicTargetOld, musicTargetNew);
    console.log('Patched openAddMusicModal search logic.');
} else {
    console.log('Could not find old search logic in openAddMusicModal.');
}

// Patch openAddSoundboardModal
const soundboardFilterLogic = `
                        const filter = this.value.toLowerCase();
                        const select = document.getElementById('sbFormBankSelect');
                        if (!window._fullBankOptionsSb) {
                            window._fullBankOptionsSb = Array.from(select.options).map(o => ({val: o.value, text: o.text, selected: o.selected}));
                        }
                        select.innerHTML = '';
                        window._fullBankOptionsSb.forEach(o => {
                            if (o.val === '' || o.text.toLowerCase().includes(filter)) {
                                const opt = document.createElement('option');
                                opt.value = o.val;
                                opt.textContent = o.text;
                                if (o.selected) opt.selected = true;
                                select.appendChild(opt);
                            }
                        });
`;

const sbTarget = `<div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Sound Effect dari Master Bank *</label>
                    <select class="form-select" id="sbFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">`;
                    
const sbNew = `<div class="form-group" style="padding:1rem; background:rgba(0,0,0,0.2); border:1px solid rgba(255,255,255,0.05); border-radius:8px; margin-bottom:1.5rem;">
                    <label class="form-label" style="color:var(--adm-gold); font-size:1.1rem; margin-bottom:0.8rem;">Pilih Sound Effect dari Master Bank *</label>
                    <input type="text" id="sbFormBankSearch" class="form-input" placeholder="🔍 Ketik untuk mencari efek suara..." style="margin-bottom:0.5rem;" oninput="${soundboardFilterLogic.replace(/"/g, '&quot;')}">
                    <select class="form-select" id="sbFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">`;

if (code.includes(sbTarget)) {
    code = code.replace(sbTarget, sbNew);
    console.log('Patched openAddSoundboardModal to add search logic.');
} else {
    console.log('Could not find sbTarget in openAddSoundboardModal.');
}

// Reset the global state when the modal is opened
code = code.replace('window.openAddMusicModal = async function(editIndex = -1) {', 'window.openAddMusicModal = async function(editIndex = -1) { window._fullBankOptionsMusic = null;');
code = code.replace('window.openAddSoundboardModal = async function(editIndex = -1) {', 'window.openAddSoundboardModal = async function(editIndex = -1) { window._fullBankOptionsSb = null;');

fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
