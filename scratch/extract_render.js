window.renderAdminMusicListWrapper = function(currentEv) {
    const container = document.getElementById('adminMusicTableContainer');
    if (!container) return;
    
    const metricTotal = document.getElementById('musicMetricTotal');
    const metricLinked = document.getElementById('musicMetricLinked');
    
    if (!currentEv || !currentEv.musicList || currentEv.musicList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:3rem; background:rgba(255,255,255,0.02); border-radius:12px; color:var(--adm-text-muted);">Belum ada daftar musik/cue audio.<br><br><button class="btn btn-primary btn-sm" onclick="window.openAddMusicModal()">+ Tambah Lagu Acara Pertama</button></div>';
        if (metricTotal) metricTotal.textContent = '0 Trek';
        if (metricLinked) metricLinked.textContent = '0 / ' + (currentEv.rundown ? currentEv.rundown.length : 0) + ' Segmen';
        return;
    }
    
    let filteredList = currentEv.musicList;
    const searchInput = document.getElementById('musicSearchInput');
    const categoryFilter = document.getElementById('musicCategoryFilter');
    const statusFilter = document.getElementById('musicStatusFilter');
    
    if (searchInput && searchInput.value) {
        const q = searchInput.value.toLowerCase();
        filteredList = filteredList.filter(m => (m.title||'').toLowerCase().includes(q) || (m.artist||'').toLowerCase().includes(q) || (m.cue_instruction||'').toLowerCase().includes(q));
    }
    if (categoryFilter && categoryFilter.selectedIndex > 0) {
        const cat = categoryFilter.value;
        filteredList = filteredList.filter(m => m.category === cat);
    }
    if (statusFilter && statusFilter.selectedIndex > 0) {
        const stat = statusFilter.value;
        if (stat === 'LINKED') {
            filteredList = filteredList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '');
        } else {
            filteredList = filteredList.filter(m => m.segment_idx === null || m.segment_idx === undefined || m.segment_idx === '');
        }
    }
    
    if (metricTotal) metricTotal.textContent = currentEv.musicList.length + ' Trek';
    const linkedCount = currentEv.musicList.filter(m => m.segment_idx !== null && m.segment_idx !== undefined && m.segment_idx !== '').length;
    const rundownCount = currentEv.rundown ? currentEv.rundown.length : 0;
    if (metricLinked) metricLinked.textContent = linkedCount + ' / ' + rundownCount + ' Segmen';

    if (filteredList.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Tidak ada musik yang cocok dengan filter pencarian.</div>';
        return;
    }

    let html = '<table class="ecc-table" style="width:100%; text-align:left; border-collapse:collapse;">';
    html += '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.1);"><th style="padding:1rem;">Judul & Artis</th><th style="padding:1rem;">Instruksi Cue (FOH/DJ)</th><th style="padding:1rem;">Terhubung Segmen Rundown</th><th style="padding:1rem; text-align:right;">Aksi</th></tr></thead>';
    html += '<tbody>';
    
    filteredList.forEach(item => {
        const realIdx = currentEv.musicList.findIndex(m => m.id === item.id);
        
        let segmentText = '<span style="display:inline-block; padding:0.25rem 0.5rem; background:rgba(255,255,255,0.05); border-radius:4px; font-size:0.75rem; color:var(--adm-text-muted);">Trek Standby (Bebas Main)</span>';
        if (item.segment_idx !== null && item.segment_idx !== undefined && item.segment_idx !== '' && currentEv.rundown && currentEv.rundown[item.segment_idx]) {
            segmentText = '<div style="color:#38BDF8; font-weight:600; font-size:0.85rem; margin-bottom:0.2rem;"><span style="background:rgba(56,189,248,0.15); padding:0.15rem 0.4rem; border-radius:4px; margin-right:0.4rem;">Segmen ' + (item.segment_idx + 1) + '</span>' + escapeHtml(currentEv.rundown[item.segment_idx].title || '') + '</div><div style="font-size:0.75rem; color:var(--adm-text-secondary);">âž¡ï¸  Auto-cue di Stage Mode saat segmen ini aktif.</div>';
        }
        
        html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.05); transition: background 0.2s;" onmouseover="this.style.background=\'rgba(255,255,255,0.02)\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<td style="padding:1rem;">';
        html += '<div style="font-weight:700; font-size:1.05rem; color:#FFF; margin-bottom:0.3rem;">' + escapeHtml(item.title || 'Untitled') + '</div>';
        html += '<div style="font-size:0.85rem; color:var(--adm-gold);">' + escapeHtml(item.artist || 'Unknown Artist') + ' <span style="color:var(--adm-text-secondary); margin:0 0.4rem;">&bull;</span> <span style="background:rgba(212,175,55,0.1); padding:0.15rem 0.4rem; border-radius:4px;">' + escapeHtml(item.category || 'BGM') + '</span></div>';
        html += '</td>';
        html += '<td style="padding:1rem; max-width:250px; font-size:0.85rem; color:var(--adm-text-secondary); line-height:1.4;">' + (item.cue_instruction ? escapeHtml(item.cue_instruction) : '<i style="color:#555;">Tidak ada instruksi khusus</i>') + '</td>';
        html += '<td style="padding:1rem;">' + segmentText + '</td>';
        html += '<td style="padding:1rem; text-align:right; white-space:nowrap;">';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.openAddMusicModal(' + realIdx + ')" style="margin-right:0.5rem; color:var(--adm-gold); border-color:rgba(212,175,55,0.3);" title="Edit / Ganti Segmen">âœ ï¸ </button>';
        html += '<button class="btn btn-secondary btn-sm" onclick="window.deleteMusic(' + realIdx + ')" style="color:#F87171; border-color:rgba(248,113,113,0.3);" title="Hapus Lagu">ðŸ—‘ï¸ </button>';
        html += '</td>';
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
};

// Override the original renderAdminMusicList to use our wrapper
window.renderAdminMusicList = window.renderAdminMusicListWrapper;

// Trigger render immediately if ev is ready
if (typeof ev !== 'undefined' && ev) {
    window.renderAdminMusicListWrapper(ev);
}