const fs = require('fs');
let code = fs.readFileSync('public/js/admin-core.js', 'utf8');

const startIdx = code.indexOf('<tr style="border-bottom: 1px solid var(--border-subtle);">');
if (startIdx !== -1) {
    const endIdx = code.indexOf('</tr>', startIdx) + 5;
    
    let block = code.substring(startIdx, endIdx);
    
    // Rewrite the block entirely
    const newBlock = `<tr style="border-bottom: 1px solid var(--border-subtle);">
                <td style="text-align: center; color: var(--gold-primary); font-weight: bold; padding: 1rem 0.5rem; vertical-align: top;">\${i+1}</td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: nowrap; min-width: 120px;">
                    <div style="font-weight:600;">\${item.start_time || ''} - \${item.end_time || ''}</div>
                    <div style="font-size:0.75rem; color:var(--text-muted);">\${item.time || ''}</div>
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: normal; word-wrap: break-word; min-width: 300px; max-width: 600px;">
                    <div style="font-weight:700; color:var(--text-primary); margin-bottom:0.25rem; font-size:1.05rem;">\${escapeHtml(item.title || 'Segmen')}</div>
                    <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.6;">\${escapeHtml(item.prompter || '')}</div>
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: normal; min-width: 180px;">
                    \${item.cue_music ? \`<div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); padding:0.4rem 0.8rem; border-radius:4px; font-size:0.8rem; color:#38BDF8; font-weight:600; display:inline-block; word-wrap:break-word;">🎵 \${escapeHtml(item.cue_music)}</div>\` : '<span style="color:var(--text-muted); font-size:0.8rem;">(Tidak ada audio khusus)</span>'}
                </td>
                <td style="padding: 1rem 0.5rem; vertical-align: top; white-space: nowrap; min-width: 150px;">
                    \${item.pic ? \`<div style="font-weight:600; font-size:0.85rem; color:#A78BFA; background:rgba(167,139,250,0.1); padding:0.3rem 0.6rem; border-radius:4px; display:inline-block;">👤 \${escapeHtml(item.pic)}</div>\` : '<span style="color:var(--text-muted); font-size:0.8rem;">-</span>'}
                </td>
            </tr>`;
            
    code = code.substring(0, startIdx) + newBlock + code.substring(endIdx);
    fs.writeFileSync('public/js/admin-core.js', code, 'utf8');
    console.log('Successfully patched Vendor Collab table layout.');
} else {
    console.log('Could not find start index.');
}
