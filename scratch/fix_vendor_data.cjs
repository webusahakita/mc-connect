const fs = require('fs');
let code = fs.readFileSync('public/vendor.html', 'utf8');

const startIdx = code.indexOf('function loadActiveEventData() {');
const endIdx = code.indexOf('function updateLiveBanner(segmentIndex, segmentTitle, musicCue, mTitle, mArtist) {');

if (startIdx !== -1 && endIdx !== -1) {
    const newCode = `async function loadActiveEventData() {
    let ev = null;
    try {
        const res = await fetch('/api/cms/events');
        const json = await res.json();
        if (json.success && json.data) {
            ev = json.data.find(e => String(e.id) === String(activeEventId));
            if (!ev && json.data.length > 0) ev = json.data[0];
        }
    } catch(e) {
        console.error('Failed to fetch events from DB', e);
    }
    
    if (!ev) {
        ev = {
            id: 1,
            title: 'Database Terputus',
            venue: 'Gagal memuat data server',
            pic: '-'
        };
    }
    
    const titleEl = document.getElementById('vendorEventTitle');
    if (titleEl) titleEl.textContent = ev.title;
    
    const metaEl = document.getElementById('vendorEventMeta');
    let picName = ev.pic || '';
    const m = picName.match(/(.*?)\\s*\\(/);
    if (m) picName = m[1].trim();
    if (metaEl) metaEl.textContent = \`Venue: \${ev.venue || '-'} · PIC: \${picName}\`;
    
    // Load Rundown
    vendorRundown = ev.rundown && Array.isArray(ev.rundown) ? ev.rundown : [];
    if (!vendorRundown || vendorRundown.length === 0) {
        vendorRundown = [
            { start_time: '18:30', end_time: '19:00', title: 'Belum ada segmen', cue_music: '-', pic: '-' }
        ];
    }
    
    // Load Music List
    vendorMusicList = (ev.metadata && ev.metadata.music) ? ev.metadata.music : [];
    
    renderVendorRundown();
    
    // Set initial active segment
    const firstItem = vendorRundown[0];
    if (firstItem) {
        updateLiveBanner(1, firstItem.title, firstItem.cue_music, '', '');
        highlightActiveRow(1);
    }
}

function renderVendorRundown() {
    const tbody = document.getElementById('vendorRundownTableBody');
    if (!tbody) return;
    
    const countLabel = document.getElementById('vendorRundownCountLabel');
    if (countLabel) countLabel.textContent = \`\${vendorRundown.length} Segmen Terdaftar\`;
    
    tbody.innerHTML = vendorRundown.map((item, idx) => {
        const segNum = idx + 1;
        const isLive = (segNum === activeSegmentIndex);
        const musicTitle = item.cue_music || '—';
        const pic = item.pic || '—';
        const isPlaying = (currentPlayingRowIdx === idx);
        
        return \`
        <tr id="row-segment-\${segNum}" class="\${isLive ? 'active-live' : ''} \${isPlaying ? 'playing' : ''}">
            <td style="font-weight:800; font-size:1.1rem; color:var(--gold-primary); text-align:center;">
                #\${segNum}
            </td>
            <td style="font-family:var(--font-mono); font-weight:700; white-space:nowrap; color:#FFFFFF;">
                ⏰ \${item.start_time || ''} - \${item.end_time || ''}
            </td>
            <td>
                <div style="font-weight:700; font-size:0.98rem; color:#FFFFFF;">
                    \${escapeHtml(item.title || 'Segmen')}
                </div>
            </td>
            <td>
                <div style="font-weight:700; font-size:0.9rem; color:#38BDF8;">
                    🎵 \${escapeHtml(musicTitle)}
                </div>
            </td>
            <td>
                <div style="color:#FBBF24; font-weight:600; font-size:0.88rem; line-height:1.4;">
                    \${escapeHtml(item.cue_music || '— Background audio normal —')}
                </div>
            </td>
            <td style="text-align:center;">
                <span class="badge \${isLive ? 'badge-available' : 'badge-completed'}" id="badge-seg-\${segNum}">
                    \${isLive ? 'LIVE ON STAGE' : 'Standby'}
                </span>
            </td>
            <td style="text-align:center;">
                <div style="display:flex; justify-content:center; gap:0.35rem; align-items:center;">
                    <button class="vendor-btn-play \${isPlaying ? 'playing' : ''}" onclick="playVendorCue(\${idx}, this)" title="Putar Musik / Audio Cue (100% Offline)">
                        \${isPlaying ? '⏹ Stop' : '▶ Play'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="downloadSingleWav(\${idx})" title="Unduh File .wav ke Gadget" style="font-size:0.75rem; padding:0.3rem 0.5rem;">
                        ⬇️
                    </button>
                </div>
            </td>
        </tr>
        \`;
    }).join('');
}

`;

    const finalCode = code.substring(0, startIdx) + newCode + code.substring(endIdx);
    fs.writeFileSync('public/vendor.html', finalCode, 'utf8');
    console.log('Successfully updated vendor.html data fetching logic.');
} else {
    console.log('Start or end index not found!');
}
