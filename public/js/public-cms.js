let cachedPressKitData = null;
let cachedRidersData = [];

// Channel Sinkronisasi Antar Tab (Real-Time Calendar Sync)
window.syncChannel = new BroadcastChannel('mc_sync_channel');
window.syncChannel.onmessage = async (event) => {
    if (event.data === 'RELOAD_CALENDAR') {
        console.log('[SyncChannel] Update kalender dari admin terdeteksi, merefresh...');
        if (typeof window.reloadPublicCalendar === 'function') {
            await window.reloadPublicCalendar();
        }
    }
};

async function initPublicCms() {
    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // Export globally for PDF use
    window.escapeHtml = escapeHtml;

    try {
        let bio = {}, packages = [], policies = {}, gallery = [], testimonials = [], categories = [];
        try {
            const bRes = await fetch('/api/cms/public-bootstrap');
            if (bRes.ok) {
                const bJson = await bRes.json();
                if (bJson.success && bJson.data) {
                    const d = bJson.data;
                    bio = d.biodata || {};
                    window.cachedBioData = bio;
                    packages = d.packages || [];
                    policies = d.policies || {};
                    gallery = d.gallery || [];
                    testimonials = d.testimonials || [];
                    categories = d.event_categories || [];
                    cachedPressKitData = d.presskit || {};
                    cachedRidersData = d.riders || [];
                }
            }
        } catch (e) {
            console.warn('[Public CMS] Bootstrap gagal, beralih ke fallback...', e);
        }
        if (!bio.name) {
            const ts = Date.now();
            const [bioRes, pkgsRes, polRes, galRes, pkRes, ridersRes, testRes, catRes] = await Promise.all([
                fetch('/api/cms/biodata?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/packages?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/policies?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/gallery?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/presskit?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/riders?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/cms/testimonials?t=' + ts).then(r => r.json()).catch(()=>({})),
                fetch('/api/event-categories?t=' + ts).then(r => r.json()).catch(()=>({}))
            ]);
            bio = bioRes?.data || {};
            window.cachedBioData = bio;
            packages = pkgsRes?.data || [];
            policies = polRes?.data || {};
            gallery = galRes?.data || [];
            testimonials = testRes?.data || [];
            categories = catRes?.data || [];
            cachedPressKitData = pkRes?.data || {};
            cachedRidersData = ridersRes?.data || [];
        }

        // Populate Event Categories for Booking Form
        const eventTypeSelect = document.getElementById('bookEventType');
        if (eventTypeSelect && categories.length > 0) {
            eventTypeSelect.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Acara --</option>';
            categories.forEach(cat => {
                const opt = document.createElement('option');
                const catName = typeof cat === 'object' ? cat.name : cat;
                const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                opt.value = catName;
                opt.textContent = `${catIcon}${catName}`;
                eventTypeSelect.appendChild(opt);
            });
        }

        // 1. Render Bio Data
        if (bio.name) {
            document.title = `${bio.name} - Official MC & Host Booking Portal`;
            document.querySelectorAll('#pubHeroName span, #pubHeroMetaName, #modalMcName, #footerName').forEach(el => {
                if (el) el.textContent = bio.name;
            });
        }
        if (bio.bio) {
            const bioEl = document.getElementById('pubHeroBio');
            if (bioEl) bioEl.textContent = bio.bio;
        }
        if (bio.photo) {
            const imgEl = document.getElementById('pubHeroImg');
            if (imgEl) {
                imgEl.src = bio.photo;
                imgEl.onerror = () => { imgEl.src = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80'; imgEl.style.opacity = '1'; };
                imgEl.onload = () => imgEl.style.opacity = '1';
            }
        }
        if (bio.spec) {
            const specContainer = document.getElementById('pubHeroSpec');
            if (specContainer) {
                specContainer.innerHTML = bio.spec.split(',').map(s => `<span class="spec-chip">✨ ${escapeHtml(s.trim())}</span>`).join('');
            }
        }
        
        const sosmedContainer = document.getElementById('pubHeroSosmed');
        if (sosmedContainer) {
            let html = '';
            if (bio.ig) {
                const igUser = bio.ig.replace(/^@/, '').trim();
                const igUrl = (bio.ig.startsWith('http://') || bio.ig.startsWith('https://')) ? bio.ig : `https://instagram.com/${igUser}`;
                html += `<a href="${escapeHtml(igUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.5rem 1rem; display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#E1306C;"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> <span>Instagram</span></a>`;
            }
            if (bio.tiktok) {
                const ttUser = bio.tiktok.replace(/^@/, '').trim();
                const ttUrl = (bio.tiktok.startsWith('http://') || bio.tiktok.startsWith('https://')) ? bio.tiktok : `https://tiktok.com/@${ttUser}`;
                html += `<a href="${escapeHtml(ttUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.5rem 1rem; display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#25F4EE;"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04-.1z"/></svg> <span>TikTok</span></a>`;
            }
            if (bio.fb) {
                let fbVal = String(bio.fb).trim();
                let fbUrl = (fbVal.startsWith('http://') || fbVal.startsWith('https://'))
                    ? fbVal 
                    : 'https://facebook.com/' + fbVal.replace(/^@/, '');
                html += `<a href="${escapeHtml(fbUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary" style="padding: 0.5rem 1rem; display:inline-flex; align-items:center; gap:0.5rem; text-decoration:none;"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="color:#1877F2;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> <span>Facebook</span></a>`;
            }
            sosmedContainer.innerHTML = html;
        }
        if (bio.statEvents) {
            const parts = bio.statEvents.split(' ');
            const numEl = document.getElementById('pubStatEventsNum');
            const lblEl = document.getElementById('pubStatEventsLabel');
            if (numEl) numEl.textContent = parts[0];
            if (lblEl && parts.length >= 2) lblEl.textContent = parts.slice(1).join(' ');
        }
        if (bio.statYears) {
            const parts = bio.statYears.split(' ');
            const numEl = document.getElementById('pubStatYearsNum');
            const lblEl = document.getElementById('pubStatYearsLabel');
            if (numEl) numEl.textContent = parts[0];
            if (lblEl && parts.length >= 2) lblEl.textContent = parts.slice(1).join(' ');
        }
        
        // 1.5. Render Calendar Notice Banner & Export Config
        if (bio.calendarConfig) {
            window._mcCalendarConfig = bio.calendarConfig; // Export for calendar.js
            
            let noticeEl = document.getElementById('publicCalendarNoticeBanner');
            if (!noticeEl) {
                noticeEl = document.createElement('div');
                noticeEl.id = 'publicCalendarNoticeBanner';
                noticeEl.style.cssText = 'margin-bottom:1rem; padding:0.75rem 1.25rem; border-radius:var(--radius-sm); background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.35); color:var(--gold-primary); font-size:0.88rem; display:flex; align-items:center; gap:0.5rem;';
                const calWrapper = document.getElementById('publicCalendarContainer');
                if (calWrapper && calWrapper.parentNode) {
                    calWrapper.parentNode.insertBefore(noticeEl, calWrapper);
                }
            }
            if (bio.calendarConfig.notice && bio.calendarConfig.notice.trim()) {
                let noticeHtml = `📢 <strong>Catatan Manajemen MC:</strong> ${bio.calendarConfig.notice.trim()}`;
                
                if (bio.calendarConfig.buffer) {
                    noticeHtml += `<div style="margin-top:0.5rem; border-top:1px dashed rgba(212,175,55,0.3); padding-top:0.5rem;">⏳ <strong>Kebijakan Booking:</strong> Klien hanya dapat memesan jadwal jika tanggal acara berjarak minimal ${bio.calendarConfig.buffer} hari dari hari ini.</div>`;
                }
                
                noticeEl.innerHTML = noticeHtml;
                noticeEl.style.display = 'flex';
                noticeEl.style.flexDirection = 'column';
                noticeEl.style.alignItems = 'flex-start';
            } else if (noticeEl) {
                noticeEl.style.display = 'none';
            }
            
            window.reloadPublicCalendar = async () => {
                const ts = Date.now();
                try {
                    const [evs, bioRes] = await Promise.all([
                        fetch('/api/calendar/availability?t=' + ts).then(r=>r.json()),
                        fetch('/api/cms/biodata?t=' + ts).then(r=>r.json()).catch(()=>({}))
                    ]);
                    
                    if (bioRes && bioRes.data && bioRes.data.calendarConfig) {
                        window._mcCalendarConfig = bioRes.data.calendarConfig;
                        // Update the notice banner on the fly
                        const noticeEl = document.getElementById('publicCalendarNoticeBanner') || document.getElementById('pubCalendarNotice');
                        if (noticeEl) {
                            if (window._mcCalendarConfig.notice && window._mcCalendarConfig.notice.trim()) {
                                let noticeHtml = `📢 <strong>Catatan Manajemen MC:</strong> ${window._mcCalendarConfig.notice.trim()}`;
                                if (window._mcCalendarConfig.buffer) {
                                    noticeHtml += `<div style="margin-top:0.5rem; border-top:1px dashed rgba(212,175,55,0.3); padding-top:0.5rem;">⏳ <strong>Kebijakan Booking:</strong> Klien hanya dapat memesan jadwal jika tanggal acara berjarak minimal ${window._mcCalendarConfig.buffer} hari dari hari ini.</div>`;
                                }
                                noticeEl.innerHTML = noticeHtml;
                                noticeEl.style.display = 'flex';
                                noticeEl.style.flexDirection = 'column';
                                noticeEl.style.alignItems = 'flex-start';
                            } else {
                                noticeEl.style.display = 'none';
                            }
                        }
                    }
                    
                    if (window.calendarApp && Array.isArray(evs)) {
                        window.calendarApp.events = evs;
                        window.calendarApp.render();
                    }
                } catch (e) {
                    console.error('Gagal memuat ulang kalender', e);
                }
            };

            // Re-render calendar so it respects the newly loaded buffer config
            if (window.calendarApp) {
                window.calendarApp.render();
            }
        }


        // 2. Render Packages
        const packagesContainer = document.getElementById('pubPackagesContainer');
        const packageSelect = document.getElementById('selectedPackageName');
        if (packagesContainer && packages.length > 0) {
            packagesContainer.innerHTML = packages.map(pkg => {
                const isFeatured = pkg.badge ? true : false;
                const badgeText = pkg.badge || '';
                const badge = badgeText ? `<span class="badge badge-tier-pro package-badge">${escapeHtml(badgeText)}</span>` : '';
                const features = (pkg.features || []).map(f => `<li>${escapeHtml(f)}</li>`).join('');
                return `
                <div class="package-card ${isFeatured ? 'featured' : ''}">
                    ${badge}
                    <h3 class="package-name">${escapeHtml(pkg.name)}</h3>
                    <div class="package-price">Rp ${parseInt(pkg.price).toLocaleString('id-ID')}</div>
                    <div class="package-duration">${escapeHtml(pkg.duration)}</div>
                    <ul class="package-features">${features}</ul>
                    <button type="button" onclick="selectPackage('${escapeHtml(pkg.name)}')" class="btn ${isFeatured ? 'btn-primary' : 'btn-secondary'} w-full">Booking Sekarang</button>
                </div>`;
            }).join('');
            
            if (packageSelect) {
                packageSelect.innerHTML = packages.map(pkg => `<option value="${escapeHtml(pkg.name)}">${escapeHtml(pkg.name)} - Rp ${parseInt(pkg.price).toLocaleString('id-ID')}</option>`).join('');
            }
        }

        // 3. Render Policies (Terms, Refund, Riders)
        if (policies.terms) {
            const el = document.getElementById('publicTermsContent');
            if (el) el.innerText = policies.terms;
        }
        if (policies.refund) {
            const el = document.getElementById('publicRefundContent');
            if (el) el.innerText = policies.refund;
        }
        if (policies.riders) {
            const el = document.getElementById('publicRidersContent');
            if (el) el.innerText = policies.riders;
        }

        // 4. Render FAQs
        const faqContainer = document.getElementById('publicFaqContent');
        if (faqContainer && policies.faqs && policies.faqs.length > 0) {
            faqContainer.innerHTML = policies.faqs.map(faq => `
                <div class="faq-card premium-faq-card" style="background:var(--bg-surface, #1e2433); border:1px solid var(--border-subtle, #2d3748); border-radius:6px; padding:0.6rem 0.8rem; margin-bottom:0.25rem;">
                    <h4 class="premium-faq-q" style="margin:0 0 0.25rem 0; color:var(--gold-primary, #D4AF37); font-size:0.95rem; display:flex; align-items:flex-start; gap:0.4rem;">
                        <span class="premium-faq-icon" style="font-weight:900;">Q:</span> <span class="premium-faq-text" style="font-weight:600; line-height:1.3;">${escapeHtml(faq.q)}</span>
                    </h4>
                    <p class="premium-faq-a" style="margin:0; color:var(--text-secondary, #a0aec0); font-size:0.9rem; display:flex; align-items:flex-start; gap:0.4rem; padding-left:0;">
                        <span class="premium-faq-icon ans-icon" style="font-weight:900; color:var(--text-muted);">A:</span> <span class="premium-faq-text" style="line-height:1.4;">${escapeHtml(faq.a)}</span>
                    </p>
                </div>
            `).join('');
        }

        // 4.5. Render Testimonials
        const testimonialsContainer = document.getElementById('pubTestimonialsContainer');
        if (testimonialsContainer && testimonials.length > 0) {
            testimonialsContainer.innerHTML = testimonials.map(testi => `
                <div class="ecc-card">
                    <div style="color:var(--gold-primary); margin-bottom:0.5rem; font-size:1.1rem;">${'★'.repeat(testi.rating)}${'☆'.repeat(5-testi.rating)}</div>
                    <p style="font-style:italic; color:var(--text-secondary); margin-bottom:1rem; font-size:0.95rem;">
                        ${escapeHtml(testi.text)}
                    </p>
                    <div style="font-weight:700; font-size:0.9rem; color:var(--text-primary);">
                        — ${escapeHtml(testi.author)} ${testi.role ? `(${escapeHtml(testi.role)})` : ''}
                    </div>
                </div>
            `).join('');
        }

        // 4. Render Gallery
        const galleryContainer = document.getElementById('pubGalleryContainer');
        if (galleryContainer && gallery.length > 0) {
            window.currentGalleryData = gallery; // Store globally for lightbox navigation
            galleryContainer.innerHTML = gallery.map((g, idx) => `
                <div class="gallery-item" onclick="openLightbox(${idx})">
                    <img src="${escapeHtml(g.url)}" alt="${escapeHtml(g.caption)}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=600&q=80';">
                    <div class="gallery-caption">${escapeHtml(g.caption)}</div>
                </div>
            `).join('');
        }

    } catch (e) {
        console.error("Gagal memuat data dari API", e);
    }
}

// Lightbox logic for Gallery
let currentLightboxIndex = 0;

function openLightbox(idx) {
    const gallery = window.currentGalleryData || [];
    if (!gallery || gallery.length === 0 || idx < 0 || idx >= gallery.length) return;
    
    currentLightboxIndex = idx;
    const item = gallery[idx];
    
    let lb = document.getElementById('pubLightbox');
    if (!lb) {
        lb = document.createElement('div');
        lb.id = 'pubLightbox';
        lb.className = 'lightbox';
        lb.innerHTML = `
            <span class="lightbox-close" onclick="closeLightbox()">&times;</span>
            <div class="lightbox-layout" style="display:flex; width:90%; max-width:1200px; height:80vh; background:var(--bg-card); border-radius:12px; overflow:hidden; box-shadow:0 10px 40px rgba(0,0,0,0.8); z-index:10001; position:relative;">
                <!-- Kiri: Main Preview -->
                <div class="lightbox-main" style="flex:1; position:relative; display:flex; flex-direction:column; align-items:center; justify-content:center; background:#000;">
                    <span class="lightbox-prev" onclick="navigateLightbox(-1)" style="position:absolute; left:20px; color:white; font-size:40px; cursor:pointer; z-index:10; user-select:none; text-shadow:0 2px 4px rgba(0,0,0,0.5); transition:color 0.2s;">&#10094;</span>
                    <span class="lightbox-next" onclick="navigateLightbox(1)" style="position:absolute; right:20px; color:white; font-size:40px; cursor:pointer; z-index:10; user-select:none; text-shadow:0 2px 4px rgba(0,0,0,0.5); transition:color 0.2s;">&#10095;</span>
                    <img class="lightbox-img" id="pubLightboxImg" src="" style="max-width:100%; max-height:100%; object-fit:contain;">
                    <div class="lightbox-caption" id="pubLightboxCap" style="position:absolute; bottom:0; left:0; right:0; padding:15px; background:linear-gradient(transparent, rgba(0,0,0,0.8)); text-align:center; color:#fff; font-size:1.1rem; min-height:80px; display:flex; align-items:flex-end; justify-content:center; pointer-events:none;"></div>
                </div>
                <!-- Kanan: Thumbnail List -->
                <div class="lightbox-sidebar" style="width:300px; background:var(--bg-surface); overflow-y:auto; padding:20px; border-left:1px solid rgba(255,255,255,0.1); display:flex; flex-direction:column;">
                    <h3 style="color:var(--gold-primary); margin-top:0; margin-bottom:15px; font-size:1.2rem; font-family:'Playfair Display', serif; text-align:center; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:10px;">Foto Lainnya</h3>
                    <div id="pubLightboxThumbs" style="display:grid; grid-template-columns:1fr 1fr; gap:10px; flex:1; overflow-y:auto; padding-right:5px; align-content:start;"></div>
                </div>
            </div>
        `;
        document.body.appendChild(lb);
    }
    
    document.getElementById('pubLightboxImg').src = item.url;
    document.getElementById('pubLightboxCap').textContent = item.caption;
    
    // Generate Thumbnails
    const thumbsContainer = document.getElementById('pubLightboxThumbs');
    if (thumbsContainer) {
        thumbsContainer.innerHTML = gallery.map((g, i) => `
            <div onclick="openLightbox(${i})" style="cursor:pointer; opacity:${i === idx ? '1' : '0.6'}; border:${i === idx ? '2px solid var(--gold-primary)' : '2px solid transparent'}; border-radius:6px; overflow:hidden; transition:all 0.2s; aspect-ratio:1/1; position:relative;">
                <img src="${g.url}" style="width:100%; height:100%; position:absolute; object-fit:cover; display:block;">
            </div>
        `).join('');
    }
    
    lb.classList.add('active');
}

function navigateLightbox(dir) {
    const gallery = window.currentGalleryData || [];
    if (gallery.length === 0) return;
    
    currentLightboxIndex += dir;
    if (currentLightboxIndex < 0) currentLightboxIndex = gallery.length - 1;
    if (currentLightboxIndex >= gallery.length) currentLightboxIndex = 0;
    
    openLightbox(currentLightboxIndex);
}

function closeLightbox() {
    const lb = document.getElementById('pubLightbox');
    if (lb) lb.classList.remove('active');
}
window.openLightbox = openLightbox;
window.closeLightbox = closeLightbox;

// ========================
// PDF EXPORT - PRESS KIT
// ========================
function exportPressKitPDF() {
    if (typeof showToast !== 'function') {
        window.showToast = function(msg) {
            if (typeof uiAlert === 'function') uiAlert(msg);
            else console.log(msg); // fallback for public landing page
        };
    }
    
    if (typeof showToast === 'function') showToast('Menyiapkan PDF...');
    
    const pk = cachedPressKitData;
    const riders = cachedRidersData;
    
    if (!pk || !pk.stageName) {
        if (typeof showToast === 'function') showToast('Data Press Kit belum dimuat atau kosong.', 'red');
        return;
    }

    const esc = (s) => !s ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const riderFooter = pk.ridersFooter || 'Rider ini bersifat fleksibel dan dapat didiskusikan.';

    let ridersRowsHtml = '';
    if (riders && riders.length > 0) {
        ridersRowsHtml = riders.map(r => {
            const lines = (r.notes || '').split('\n').map(l => l.trim()).filter(l => l);
            const bulletHtml = lines.map(l => {
                const cleaned = l.replace(/^[•\-]\s*/, '');
                return `<div style="margin-bottom:6px; padding-left:14px; text-indent:-14px; position:relative;">
                    <span style="position:absolute; left:0; color:#D4AF37;">•</span> ${esc(cleaned)}
                </div>`;
            }).join('');
            return `<tr>
                <td style="background:#0B101E; color:#fff; padding:12px 15px; font-weight:700; width:30%; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.9rem;">
                    ${esc(r.title)}
                </td>
                <td style="padding:12px 15px; vertical-align:top; border-bottom:1px solid #e0e0e0; font-size:0.85rem; color:#444; line-height:1.5;">
                    ${bulletHtml}
                </td>
            </tr>`;
        }).join('');
    } else {
        ridersRowsHtml = `<tr><td colspan="2" style="padding:12px 15px; text-align:center; color:#888;">Belum ada data event riders yang ditambahkan.</td></tr>`;
    }

    const scopeSection = (num, color, title, text) => {
        if (!text) return '';
        const items = text.split('\n').map(l => l.trim()).filter(l => l);
        const bullets = items.map(l => `<div style="margin-bottom:4px; font-size:11px; padding-left:12px; text-indent:-12px; color:#444;">• ${esc(l.replace(/^[•\-]\s*/, ''))}</div>`).join('');
        return `<div style="background:#fff; border:1px solid #eaeaea; padding:12px; border-radius:6px;">
            <div style="color:${color}; font-weight:800; font-size:12.5px; margin-bottom:8px; border-bottom:1px solid #f0f0f0; padding-bottom:6px;">${num}. ${esc(title)}</div>
            ${bullets}
        </div>`;
    };

    const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Press Kit - ${esc(pk.stageName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page {
      size: A4 portrait;
      margin: 0; /* Menghapus header & footer bawaan browser (URL, Tanggal, Hal) */
  }
  @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; background: #fff !important; }
      .no-print { display: none !important; }
      /* Matikan padding .page saat print karena sudah dihandle oleh Master Table */
      .page { padding: 0 !important; margin: 0 !important; box-shadow: none !important; }
      .page-break { page-break-after: always; }
      tr, .p1-box, .scope-box { page-break-inside: avoid; }
  }
  * { box-sizing: border-box; }
  body { font-family: 'Plus Jakarta Sans', sans-serif; color: #222; background: #e5e7eb; padding: 0; margin: 0; }
  
  /* Untuk tampilan di layar (sebelum di-print) */
  .screen-container { width: 210mm; margin: 20px auto; background: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
  
  .p1-header, .p2-header { background: #0B101E; color: #fff; padding: 28px 32px; border-radius: 8px; margin-bottom: 24px; }
  .p1-badge, .p2-badge { background: #D4AF37; color: #0B101E; font-size: 10px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-bottom: 12px; }
  .p1-title, .p2-title { font-size: 26px; font-weight: 800; text-transform: uppercase; margin: 0 0 6px; letter-spacing: 0.5px; }
  .p1-subtitle, .p2-subtitle { color: #94A3B8; font-size: 13px; margin: 0; font-weight: 600; }
  
  .p1-section-title { font-size: 16px; font-weight: 800; border-left: 4px solid #D4AF37; padding-left: 14px; margin: 28px 0 16px; color:#0B101E; }
  
  .p1-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
  .p1-box { background: #fafafa; border: 1px solid #eaeaea; border-radius: 8px; padding: 18px; }
  .p1-box-title { font-size: 13px; font-weight: 800; margin-bottom: 12px; color:#0B101E; text-transform:uppercase; letter-spacing:0.5px; }
  
  .contact-table { width: 100%; border-collapse: collapse; }
  .contact-table td { font-size: 11.5px; padding: 6px 4px; border-bottom: 1px dashed #e0e0e0; }
  .contact-table tr:last-child td { border-bottom: none; }
  .contact-table td:first-child { font-weight: 700; width: 35%; color:#555; }
  
  .riders-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .riders-table thead tr { background: #0B101E; color: #fff; }
  .riders-table thead td { padding: 12px 14px; font-weight: 700; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
  .riders-table tbody tr:nth-child(even) { background-color: #fafafa; }
  
  .print-btn { text-align: center; padding: 20px; background: #0B101E; position: sticky; top: 0; z-index: 100; box-shadow: 0 2px 10px rgba(0,0,0,0.2); }
  .print-btn button { background: #D4AF37; color: #0B101E; padding: 12px 24px; font-weight: 800; font-family: 'Plus Jakarta Sans', sans-serif; cursor: pointer; border: none; border-radius: 6px; font-size: 14px; transition: 0.2s; }
  .print-btn button:hover { background: #E5C158; transform: translateY(-1px); }
  
  /* Master Table Hack untuk memberikan margin cetak buatan tanpa mengaktifkan header browser */
  .master-table { width: 100%; border-collapse: collapse; border: none; }
  .master-table thead td { height: 18mm; border: none; padding: 0; } /* Spacer Atas (Jarak Aman) */
  .master-table tfoot td { height: 18mm; border: none; padding: 0; } /* Spacer Bawah (Jarak Aman) */
  .master-content-td { border: none; padding: 0 20mm; } /* Padding Kiri Kanan */
</style>
</head>
<body>
<div class="print-btn no-print"><button onclick="window.print()">🖨️ Cetak / Simpan PDF Sekarang</button></div>

<div class="screen-container">
<table class="master-table">
    <thead><tr><td></td></tr></thead>
    <tbody><tr><td class="master-content-td">
    
        <!-- PAGE 1 CONTENT -->
        <div class="page">
            
            <div class="p1-header" style="display:flex; justify-content:space-between; align-items:center;">
                <div style="flex:1;">
                    <div class="p1-badge">Official Media Kit</div>
                    <h1 class="p1-title">${esc(pk.stageName)}</h1>
                    <p class="p1-subtitle">Professional Master of Ceremony</p>
                </div>
                ${window.cachedBioData && window.cachedBioData.photo ? 
                    `<div style="margin-left: 20px;"><img src="${window.cachedBioData.photo}" style="width:120px; height:120px; border-radius:50%; object-fit:cover; border: 3px solid #D4AF37;"></div>` 
                : ''}
                ${window.cachedBioData && window.cachedBioData.webConfig && window.cachedBioData.webConfig.logo_url ? 
                    `<div style="margin-left: 20px;"><img src="${window.cachedBioData.webConfig.logo_url}" style="max-height:80px; max-width:120px; object-fit:contain;"></div>` 
                : ''}
            </div>
            <div class="p1-section-title">Bagian 1: Press Kit & Profil Lengkap</div>
            <div class="p1-two-col">
                <div class="p1-box">
                    <div class="p1-box-title">Persona & Identitas</div>
                    <div style="font-size:11.5px; color:#333;"><strong>Spesialisasi:</strong> <span style="color:#666;">${esc(pk.spesialisasi)}</span></div>
                    <div style="font-size:11.5px; margin-top:8px; color:#333;"><strong>Tagline:</strong> <span style="color:#666; font-style:italic;">"${esc(pk.tagline)}"</span></div>
                    <div style="font-size:11.5px; margin-top:12px; color:#555; line-height:1.6;">${esc(pk.bio)}</div>
                </div>
                <div class="p1-box">
                    <div class="p1-box-title">Informasi Kontak & Booking</div>
                    <table class="contact-table">
                        <tr><td>Nama PIC</td><td>${esc(pk.pic)}</td></tr>
                        <tr><td>WhatsApp</td><td>${esc(pk.wa)}</td></tr>
                        <tr><td>Email</td><td>${esc(pk.email)}</td></tr>
                        <tr><td>Media Sosial</td><td>${esc(pk.sosmed)}</td></tr>
                        <tr><td>Domisili Base</td><td>${esc(pk.domisili)}</td></tr>
                    </table>
                </div>
            </div>
            
            <div class="p1-section-title">Cakupan Layanan Profesional</div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                ${scopeSection('1', '#D4AF37', 'Corporate & Formal Protocol', pk.scope1)}
                ${scopeSection('2', '#D4AF37', 'Wedding & Family Celebration', pk.scope2)}
                ${scopeSection('3', '#0B101E', 'Entertainment & Public Gathering', pk.scope3)}
                ${scopeSection('4', '#0B101E', 'Other Formats & Khusus', pk.scope4)}
            </div>
            
            ${pk.footerNote ? `<div style="font-size:10px; margin-top:30px; text-align:center; color:#888; border-top:1px solid #eaeaea; padding-top:15px;"><strong>Catatan Penting:</strong> ${esc(pk.footerNote)}</div>` : ''}
        </div>
        
        <!-- FORCE PAGE BREAK -->
        <div class="page-break" style="height:0;"></div>
        
        <!-- PAGE 2 CONTENT -->
        <div class="page">
            <div class="p2-header" style="margin-top: 10px;">
                <div class="p1-badge" style="background:#fff; color:#0B101E;">Hospitality & Technical Requirements</div>
                <h2 class="p2-title">Event Riders Specification</h2>
            </div>
            <div class="p1-section-title" style="margin-top:0;">Bagian 2: Kebutuhan Rider (Wajib)</div>
            <p style="font-size:11.5px; color:#555; margin-bottom:16px;">Sebagai standar kenyamanan dan kelancaran performa, mohon perhatikan dan penuhi kebutuhan rider teknis & non-teknis berikut:</p>
            
            <table class="riders-table">
                <thead><tr><td style="width:28%;">Kategori Rider</td><td>Rincian & Ketentuan</td></tr></thead>
                <tbody>${ridersRowsHtml}</tbody>
            </table>
            
            ${riderFooter ? `<div style="font-size:10px; margin-top:30px; text-align:center; color:#888; border-top:1px solid #eaeaea; padding-top:15px;"><strong>Catatan Tambahan:</strong> ${esc(riderFooter)}</div>` : ''}
        </div>

    </td></tr></tbody>
    <tfoot><tr><td></td></tr></tfoot>
</table>
</div>
<script>
    window.onload = function() {
        setTimeout(() => window.print(), 500);
    };
<\/script>
</body></html>`;
    
    const popupFeatures = 'width=900,height=800,menubar=no,toolbar=no,location=no,status=no,scrollbars=yes,resizable=yes';
    const win = window.open('', 'ExportPDF', popupFeatures);
    
    if (!win) {
        if (typeof showToast === 'function') showToast('Pop-up diblokir browser. Harap izinkan pop-up.', 'red');
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
}
window.exportPressKitPDF = exportPressKitPDF;
window.generateAndDownloadPressKit = exportPressKitPDF;

// Execute
document.addEventListener('DOMContentLoaded', initPublicCms);
