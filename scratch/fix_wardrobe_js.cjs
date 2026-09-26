const fs = require('fs');

const wardrobeLogic = `
function renderWardrobe() {
    try {
        let rawData = null;
        if (typeof AdminDB !== 'undefined') {
            rawData = AdminDB.getItem('mc_wardrobe_catalog');
        }
        if (!rawData) {
            rawData = localStorage.getItem('mc_wardrobe_db');
        }
        
        let items = [];
        if (rawData) {
            try { items = typeof rawData === 'string' ? JSON.parse(rawData) : rawData; } catch(e) {}
        }

        // 1. Render in Command Center (adminWardrobeGrid)
        const grid = document.getElementById('adminWardrobeGrid');
        if (grid) {
            if (!Array.isArray(items) || items.length === 0) {
                grid.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe.</div>';
            } else {
                grid.innerHTML = items.map(item => {
                    return '<div style="background:rgba(255,255,255,0.03); border-radius:12px; padding:1rem; border:1px solid rgba(255,255,255,0.06); display:flex; gap:1rem; align-items:center;">' +
                        (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:50px; height:50px; border-radius:8px; object-fit:cover;">' : '<div style="width:50px; height:50px; border-radius:8px; background:#444; display:flex; align-items:center; justify-content:center; font-size:1.5rem;">👔</div>') +
                        '<div>' +
                            '<div style="font-weight:700;">' + escapeHtml(item.name || 'Item') + '</div>' +
                            '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + escapeHtml(item.colorName || item.colorHex || '') + '</div>' +
                        '</div>' +
                    '</div>';
                }).join('');
            }
        }

        // 2. Render in Global Wardrobe Manager (globalWardrobeTableBody)
        const tbody = document.getElementById('globalWardrobeTableBody');
        if (tbody) {
            if (!Array.isArray(items) || items.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada item wardrobe. Klik Tambah Gaun Baru.</td></tr>';
            } else {
                tbody.innerHTML = items.map(item => {
                    return '<tr>' +
                        '<td>' + (item.imgUrl ? '<img src="'+escapeHtml(item.imgUrl)+'" style="width:40px; height:40px; border-radius:6px; object-fit:cover;">' : '<div style="width:40px; height:40px; border-radius:6px; background:#444; display:flex; align-items:center; justify-content:center; font-size:1.2rem;">👔</div>') + '</td>' +
                        '<td style="font-weight:600;">' + escapeHtml(item.name || '-') + '</td>' +
                        '<td>' + escapeHtml(item.desc || '-') + '</td>' +
                        '<td>' + (item.colorName ? escapeHtml(item.colorName) : (item.colorHex ? escapeHtml(item.colorHex) : '-')) + '</td>' +
                        '<td><span class="badge" style="background:rgba(59,130,246,0.1); color:#60A5FA;">' + escapeHtml(item.status || 'Tersedia') + '</span></td>' +
                        '<td style="text-align:center;">' + (item.frequency || 0) + 'x</td>' +
                        '<td style="text-align:right;">' +
                            '<button class="btn btn-secondary btn-sm" onclick="editWardrobe('+escapeHtml(JSON.stringify(item.id||item.name))+')">Edit</button>' +
                        '</td>' +
                    '</tr>';
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderWardrobe error:', e.message);
    }
}
window.renderWardrobe = renderWardrobe;
`;

function replaceFunc(filePath) {
    if (!fs.existsSync(filePath)) return;
    let js = fs.readFileSync(filePath, 'utf8');
    const oldFunc = /function renderWardrobe\(\) \{[\s\S]*?window\.renderWardrobe = renderWardrobe;/;
    js = js.replace(oldFunc, wardrobeLogic);
    fs.writeFileSync(filePath, js, 'utf8');
}

replaceFunc('public/js/admin-core.js');
replaceFunc('public/js/bundle-test.js');
console.log('Fixed renderWardrobe logic');
