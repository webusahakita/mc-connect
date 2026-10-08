const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Fix saveEventMusicForm completely
const saveFuncStart = code.indexOf('window.saveEventMusicForm = async function() {');
const saveFuncEnd = code.indexOf('window.deleteMusic =', saveFuncStart);
if (saveFuncStart !== -1) {
    let saveFunc = `window.saveEventMusicForm = async function() {
    const idxStr = document.getElementById('evmFormIdx').value;
    const bankIdxStr = document.getElementById('evmFormBankSelect').value;
    const cue_instruction = document.getElementById('evmFormCue').value.trim();
    
    // Support for multiple checkboxes
    const checkedBoxes = Array.from(document.querySelectorAll('.evm-segment-cb:checked'));
    const segment_idxs = checkedBoxes.map(cb => parseInt(cb.value));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; 
    
    const category = document.getElementById('evmFormCategory').value;
    
    if (bankIdxStr === '') return window.uiAlert('Pilih lagu dari Master Bank terlebih dahulu!');
    
    let ev = _getEv();
    if (!ev) return;
    if (!ev.musicList) ev.musicList = [];
    
    const bank = window.getGlobalMusicBank();
    const selectedBankItem = bank[parseInt(bankIdxStr)];
    if (!selectedBankItem) return window.uiAlert('Lagu di Master Bank tidak ditemukan!');
    
    const newItem = {
        id: (idxStr !== '') ? ev.musicList[parseInt(idxStr)].id : 'music_' + Date.now(),
        title: selectedBankItem.title,
        artist: selectedBankItem.artist,
        url_link: selectedBankItem.url_link,
        file_upload: selectedBankItem.file_upload,
        cue_instruction: cue_instruction,
        segment_idx: segment_idx,
        segment_idxs: segment_idxs,
        category: category
    };
    
    if (idxStr !== '') {
        const oldItem = ev.musicList[parseInt(idxStr)];
        const oldIdxs = Array.isArray(oldItem.segment_idxs) ? oldItem.segment_idxs : (oldItem.segment_idx !== null && oldItem.segment_idx !== undefined ? [oldItem.segment_idx] : []);
        
        oldIdxs.forEach(oldIdx => {
            if (!segment_idxs.includes(oldIdx) && ev.rundown && ev.rundown[oldIdx]) {
                ev.rundown[oldIdx].cue_music = ''; 
            }
        });
        
        ev.musicList[parseInt(idxStr)] = newItem;
    } else {
        ev.musicList.push(newItem);
    }
    
    segment_idxs.forEach(idx => {
        if (ev.rundown && ev.rundown[idx]) {
            ev.rundown[idx].cue_music = newItem.title;
        }
    });
    
    ev.metadata = ev.metadata || {};
    ev.metadata.musicList = ev.musicList;
    ev.music = ev.musicList; 
    
    _setEv(ev);
    if (typeof window.syncEngine !== 'undefined' && window.syncEngine.pushEventsToServer) window.syncEngine.pushEventsToServer();
    
    document.getElementById('modalEventMusicForm').style.display = 'none';
    document.getElementById('modalEventMusicForm').classList.remove('active');
    
    if (typeof window.renderAdminMusicListWrapper === 'function') window.renderAdminMusicListWrapper(ev);
    if (typeof window.renderAdminRundown === 'function') window.renderAdminRundown();
};

`;
    code = code.substring(0, saveFuncStart) + saveFunc + code.substring(saveFuncEnd);
}

// 2. Build custom Select2-like UI for the Master Bank dropdown
const targetBankDropdownOld = `<input type="text" id="evmFormBankSearch" class="form-input" placeholder="🔍 Ketik untuk mencari judul lagu..." style="margin-bottom:0.5rem;" oninput="
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
">
                    <select class="form-select" id="evmFormBankSelect" style="font-size:1.05rem; padding:0.6rem;">
                        <option value="">-- Pilih Lagu --</option>
                        \${bankOptionsHtml}
                    </select>`;

const customSelectHtml = `
                    <!-- Custom Select UI -->
                    <div style="position:relative; width:100%; font-size:1.05rem;">
                        <input type="hidden" id="evmFormBankSelect" value="\${editItem ? bank.findIndex(b => b.title === editItem.title) : ''}">
                        
                        <!-- The clickable "button" -->
                        <div id="evmCustomSelectBtn" style="padding:0.6rem 1rem; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.1); border-radius:6px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;" onclick="document.getElementById('evmCustomSelectDropdown').style.display = document.getElementById('evmCustomSelectDropdown').style.display === 'none' ? 'block' : 'none'; document.getElementById('evmCustomSelectSearch').focus();">
                            <span id="evmCustomSelectLabel">\${editItem ? editItem.title + (editItem.artist ? ' - ' + editItem.artist : '') : '-- Pilih Lagu --'}</span>
                            <span style="font-size:0.8rem;">▼</span>
                        </div>
                        
                        <!-- The dropdown panel -->
                        <div id="evmCustomSelectDropdown" style="display:none; position:absolute; top:100%; left:0; right:0; margin-top:4px; background:#1A1E29; border:1px solid rgba(255,255,255,0.1); border-radius:6px; box-shadow:0 8px 16px rgba(0,0,0,0.5); z-index:999999;">
                            
                            <!-- Search box inside dropdown -->
                            <div style="padding:0.5rem; border-bottom:1px solid rgba(255,255,255,0.05);">
                                <input type="text" id="evmCustomSelectSearch" class="form-input" placeholder="🔍 Cari lagu..." style="padding:0.5rem; font-size:0.95rem;" oninput="
                                    const filter = this.value.toLowerCase();
                                    document.querySelectorAll('.evm-option-item').forEach(item => {
                                        if(item.textContent.toLowerCase().includes(filter)) item.style.display = 'block';
                                        else item.style.display = 'none';
                                    });
                                ">
                            </div>
                            
                            <!-- Options list -->
                            <div id="evmCustomSelectOptionsList" style="max-height:200px; overflow-y:auto; padding:0.25rem;">
                                \${bank.map((b, idx) => \`
                                    <div class="evm-option-item" style="padding:0.6rem 1rem; cursor:pointer; border-radius:4px; margin-bottom:2px;" 
                                         onmouseover="this.style.background='rgba(56,189,248,0.1)'" 
                                         onmouseout="this.style.background='transparent'"
                                         onclick="
                                            document.getElementById('evmFormBankSelect').value = '\${idx}';
                                            document.getElementById('evmCustomSelectLabel').textContent = '\${b.title.replace(/'/g, "\\'")} \${b.artist ? ' - ' + b.artist.replace(/'/g, "\\'") : ''}';
                                            document.getElementById('evmCustomSelectDropdown').style.display = 'none';
                                         ">
                                        \${b.title} \${b.artist ? '- ' + b.artist : ''}
                                    </div>
                                \`).join('')}
                            </div>
                            
                        </div>
                    </div>
                    
                    <!-- Close dropdown when clicking outside -->
                    <script>
                        document.addEventListener('click', function(e) {
                            const btn = document.getElementById('evmCustomSelectBtn');
                            const drop = document.getElementById('evmCustomSelectDropdown');
                            if(btn && drop && !btn.contains(e.target) && !drop.contains(e.target)) {
                                drop.style.display = 'none';
                            }
                        });
                    </script>
`;

code = code.replace(targetBankDropdownOld, customSelectHtml);

fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
console.log('Successfully patched saveEventMusicForm and added Custom Select UI.');
