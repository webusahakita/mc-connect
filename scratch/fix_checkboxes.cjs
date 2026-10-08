const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

// 1. Update the modal HTML for the segment selection to use checkboxes
const targetModalOld = `<div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown <span style="font-size:0.75rem; color:#888;">(Tahan CTRL untuk pilih banyak)</span></label>
                    <select multiple class="form-select" id="evmFormSegment" style="height: 150px;">
                        \${rundownOptions.map(opt => {
                            let isSelected = false;
                            if (editItem && Array.isArray(editItem.segment_idxs)) {
                                isSelected = editItem.segment_idxs.includes(parseInt(opt.value)) || editItem.segment_idxs.includes(opt.value);
                            } else if (editItem && editItem.segment_idx == opt.value) {
                                isSelected = true;
                            }
                            if (opt.value === '' && (!editItem || (editItem.segment_idx === null && (!editItem.segment_idxs || editItem.segment_idxs.length===0)))) {
                                isSelected = true;
                            }
                            return \`<option value="\${opt.value}" \${isSelected ? 'selected' : ''}>\${opt.label}</option>\`;
                        }).join('')}
                    </select>
                </div>`;

const targetModalNew = `<div class="form-group">
                    <label class="form-label">Terhubung ke Segmen Rundown <span style="font-size:0.75rem; color:#888;">(Bisa pilih lebih dari satu)</span></label>
                    <div id="evmFormSegmentContainer" style="height: 160px; overflow-y: auto; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 0.8rem;">
                        \${(() => {
                            let isStandby = false;
                            if (!editItem || (editItem.segment_idx === null && (!editItem.segment_idxs || editItem.segment_idxs.length===0))) {
                                isStandby = true;
                            }
                            return \`
                            <label style="display: flex; align-items: center; margin-bottom: 0.8rem; cursor: pointer; padding-bottom: 0.8rem; border-bottom: 1px solid rgba(255,255,255,0.05);">
                                <input type="checkbox" value="" id="evmFormSegmentStandby" \${isStandby ? 'checked' : ''} style="width: 18px; height: 18px; margin-right: 0.5rem; accent-color: var(--adm-gold);" onchange="if(this.checked) document.querySelectorAll('.evm-segment-cb').forEach(cb => cb.checked = false)">
                                <span style="color:var(--adm-text-muted);">-- Tidak Terhubung (Standby) --</span>
                            </label>\`;
                        })()}
                        
                        \${rundownOptions.filter(o => o.value !== '').map(opt => {
                            let isSelected = false;
                            if (editItem && Array.isArray(editItem.segment_idxs)) {
                                isSelected = editItem.segment_idxs.includes(parseInt(opt.value)) || editItem.segment_idxs.includes(opt.value);
                            } else if (editItem && editItem.segment_idx == opt.value) {
                                isSelected = true;
                            }
                            return \`
                            <label style="display: flex; align-items: center; margin-bottom: 0.6rem; cursor: pointer;">
                                <input type="checkbox" class="evm-segment-cb" value="\${opt.value}" \${isSelected ? 'checked' : ''} style="width: 18px; height: 18px; margin-right: 0.5rem; accent-color: #38BDF8;" onchange="if(this.checked) document.getElementById('evmFormSegmentStandby').checked = false"> 
                                <span>\${opt.label}</span>
                            </label>\`;
                        }).join('')}
                    </div>
                </div>`;
code = code.replace(targetModalOld, targetModalNew);

// 2. Update saveEventMusicForm to handle checkboxes instead of select
const saveFuncTargetOld = `const segmentSelect = document.getElementById('evmFormSegment');
    const segment_idxs = Array.from(segmentSelect.selectedOptions).map(opt => opt.value).filter(v => v !== '').map(v => parseInt(v));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; // Fallback for backward compatibility`;

const saveFuncTargetNew = `const checkedBoxes = Array.from(document.querySelectorAll('.evm-segment-cb:checked'));
    const segment_idxs = checkedBoxes.map(cb => parseInt(cb.value));
    const segment_idx = segment_idxs.length > 0 ? segment_idxs[0] : null; // Fallback for backward compatibility`;

code = code.replace(saveFuncTargetOld, saveFuncTargetNew);

fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
console.log('Successfully patched UI to use checkboxes.');
