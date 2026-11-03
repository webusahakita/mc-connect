/**
 * MC-Connect SaaS Update Notifier
 * Mendeteksi commit/pembaruan baru secara real-time dan menampilkan
 * notifikasi pembaruan sistem, bell indicator, dan changelog modal.
 */

(function () {
    const STORAGE_KEY = 'saas_last_seen_commit';
    const DISMISSED_TEMP_KEY = 'saas_dismissed_commit';
    let currentVersionData = null;
    let pollInterval = null;

    // 0. Admin Workspace Guard: Strictly restricted to Admin Workspace
    function isAdminContext() {
        if (typeof window === 'undefined' || typeof document === 'undefined') return false;

        const path = (window.location && window.location.pathname) ? window.location.pathname.toLowerCase() : '';

        // Explicitly reject known public landing & sales pages
        if (path === '/' ||
            path.endsWith('/index.html') ||
            path.endsWith('/keunggulan.html') ||
            path.endsWith('/login.html') ||
            document.querySelector('.hero-section') !== null ||
            document.querySelector('.landing-header') !== null) {
            return false;
        }

        // Must be within Admin Workspace shell or on /admin route
        const hasAdminShell = Boolean(
            document.querySelector('.admin-shell') ||
            document.querySelector('.admin-topbar') ||
            document.querySelector('.admin-topbar-actions') ||
            document.querySelector('.admin-sidebar')
        );

        const isAdminPath = path.includes('/admin') || path.endsWith('admin.html');

        return hasAdminShell || isAdminPath;
    }

    // 1. Inject Styles Self-Contained
    function injectStyles() {
        if (document.getElementById('saas-notifier-styles')) return;
        const style = document.createElement('style');
        style.id = 'saas-notifier-styles';
        style.textContent = `
            /* SaaS Update Banner */
            .saas-update-banner {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 99998;
                max-width: 440px;
                background: linear-gradient(135deg, rgba(22, 32, 50, 0.98), rgba(15, 23, 42, 0.98));
                border: 1px solid #D4AF37;
                border-radius: 14px;
                padding: 1.15rem 1.25rem;
                box-shadow: 0 10px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.25);
                display: flex;
                gap: 1rem;
                align-items: flex-start;
                font-family: system-ui, -apple-system, sans-serif;
                animation: saasSlideIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                backdrop-filter: blur(12px);
                color: #F8FAFC;
            }
            @keyframes saasSlideIn {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            .saas-banner-icon {
                font-size: 1.75rem;
                flex-shrink: 0;
                line-height: 1;
                filter: drop-shadow(0 0 8px rgba(212, 175, 55, 0.5));
            }
            .saas-banner-content {
                flex-grow: 1;
                min-width: 0;
            }
            .saas-banner-header {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.35rem;
                flex-wrap: wrap;
            }
            .saas-banner-title {
                font-size: 0.95rem;
                font-weight: 700;
                color: #FFFFFF;
                margin: 0;
            }
            .saas-version-pill {
                background: rgba(212, 175, 55, 0.18);
                color: #D4AF37;
                border: 1px solid rgba(212, 175, 55, 0.4);
                padding: 0.15rem 0.5rem;
                border-radius: 999px;
                font-size: 0.72rem;
                font-weight: 700;
                font-family: monospace;
            }
            .saas-banner-msg {
                font-size: 0.84rem;
                color: #94A3B8;
                line-height: 1.45;
                margin-bottom: 0.85rem;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .saas-banner-actions {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            .saas-btn-action {
                border: none;
                cursor: pointer;
                font-size: 0.8rem;
                font-weight: 600;
                padding: 0.4rem 0.85rem;
                border-radius: 6px;
                transition: all 0.2s ease;
            }
            .saas-btn-primary {
                background: #D4AF37;
                color: #0B0F17;
            }
            .saas-btn-primary:hover {
                background: #E5C158;
                transform: translateY(-1px);
            }
            .saas-btn-secondary {
                background: rgba(255, 255, 255, 0.08);
                color: #CBD5E1;
                border: 1px solid rgba(255, 255, 255, 0.15);
            }
            .saas-btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
                color: #FFFFFF;
            }
            .saas-btn-close {
                background: transparent;
                border: none;
                color: #64748B;
                font-size: 1.25rem;
                cursor: pointer;
                line-height: 1;
                padding: 0.2rem;
                margin-left: -0.25rem;
            }
            .saas-btn-close:hover {
                color: #EF4444;
            }

            /* Topbar Notification Bell */
            .saas-topbar-bell-btn {
                position: relative;
                background: rgba(255, 255, 255, 0.06);
                border: 1px solid rgba(255, 255, 255, 0.12);
                color: #F8FAFC;
                padding: 0.35rem 0.65rem;
                border-radius: 8px;
                font-size: 1rem;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                gap: 0.35rem;
                transition: all 0.2s ease;
            }
            .saas-topbar-bell-btn:hover {
                background: rgba(212, 175, 55, 0.15);
                border-color: #D4AF37;
                color: #D4AF37;
            }
            .saas-topbar-bell-btn.has-update {
                border-color: #D4AF37;
                background: rgba(212, 175, 55, 0.12);
                animation: saasBellPulse 2s infinite ease-in-out;
            }
            @keyframes saasBellPulse {
                0%, 100% { box-shadow: 0 0 0 0 rgba(212, 175, 55, 0.4); }
                50% { box-shadow: 0 0 10px 4px rgba(212, 175, 55, 0.3); }
            }
            .saas-bell-badge {
                position: absolute;
                top: -5px;
                right: -5px;
                background: #EF4444;
                color: #FFFFFF;
                font-size: 0.62rem;
                font-weight: 800;
                padding: 0.1rem 0.35rem;
                border-radius: 999px;
                border: 1px solid #111827;
                line-height: 1.1;
            }

            /* Changelog Modal */
            .saas-modal-backdrop {
                position: fixed;
                inset: 0;
                z-index: 100001;
                background: rgba(0, 0, 0, 0.82);
                backdrop-filter: blur(8px);
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 1.5rem;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            .saas-modal-backdrop.active {
                opacity: 1;
                pointer-events: auto;
            }
            .saas-modal-card {
                background: #111827;
                border: 1px solid #D4AF37;
                border-radius: 16px;
                width: 100%;
                max-width: 640px;
                max-height: 85vh;
                display: flex;
                flex-direction: column;
                box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(212, 175, 55, 0.2);
                color: #F8FAFC;
                overflow: hidden;
            }
            .saas-modal-header {
                padding: 1.25rem 1.5rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                justify-content: space-between;
                align-items: center;
                background: rgba(22, 32, 50, 0.6);
            }
            .saas-modal-header h3 {
                margin: 0;
                font-size: 1.2rem;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: #FFFFFF;
            }
            .saas-modal-body {
                padding: 1.5rem;
                overflow-y: auto;
                line-height: 1.6;
                font-size: 0.92rem;
            }
            .saas-update-highlight-box {
                background: rgba(212, 175, 55, 0.08);
                border: 1px solid rgba(212, 175, 55, 0.3);
                border-radius: 10px;
                padding: 1rem 1.25rem;
                margin-bottom: 1.25rem;
            }
            .saas-commit-list {
                list-style: none;
                padding: 0;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            .saas-commit-item {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(255, 255, 255, 0.06);
                border-radius: 8px;
                padding: 0.75rem 1rem;
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            .saas-commit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 0.78rem;
                color: #94A3B8;
            }
            .saas-commit-hash {
                font-family: monospace;
                color: #D4AF37;
                font-weight: 700;
                background: rgba(212, 175, 55, 0.1);
                padding: 0.1rem 0.4rem;
                border-radius: 4px;
            }
            .saas-commit-msg {
                font-size: 0.88rem;
                color: #E2E8F0;
                font-weight: 500;
            }
            .saas-modal-footer {
                padding: 1rem 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.08);
                display: flex;
                justify-content: flex-end;
                gap: 0.75rem;
                background: rgba(22, 32, 50, 0.6);
            }
        `;
        document.head.appendChild(style);
    }

    // 2. Fetch Latest Version from API / version.json
    async function fetchLatestVersion() {
        try {
            // First attempt: API route with dynamic git detection
            let res = await fetch('/api/system/version?_t=' + Date.now(), { credentials: 'same-origin' });
            if (!res.ok) {
                // Fallback attempt: static version.json
                res = await fetch('/version.json?_t=' + Date.now());
            }
            if (!res.ok) return null;
            return await res.json();
        } catch (e) {
            try {
                const fallbackRes = await fetch('/version.json?_t=' + Date.now());
                if (fallbackRes.ok) return await fallbackRes.json();
            } catch (err) {}
            return null;
        }
    }

    // 3. Render Topbar Bell Icon (if on Admin Workspace)
    function renderTopbarBell(hasUpdate) {
        let container = document.querySelector('.admin-topbar-actions');
        if (!container) return;

        let bell = document.getElementById('saasUpdateBellBtn');
        if (!bell) {
            bell = document.createElement('button');
            bell.id = 'saasUpdateBellBtn';
            bell.className = 'saas-topbar-bell-btn';
            bell.title = 'Pemberitahuan Update SaaS';
            bell.onclick = () => window.saasNotifier.openChangelogModal();
            // Insert before theme toggle or at the end
            const themeBtn = document.getElementById('themeToggleBtn');
            if (themeBtn && themeBtn.parentNode === container) {
                container.insertBefore(bell, themeBtn);
            } else {
                container.appendChild(bell);
            }
        }

        if (hasUpdate) {
            bell.classList.add('has-update');
            bell.innerHTML = '🔔 <span class="saas-bell-badge">NEW</span>';
            bell.title = 'Update SaaS Baru Tersedia! Klik untuk rincian pembaruan.';
        } else {
            bell.classList.remove('has-update');
            bell.innerHTML = '🔔';
            bell.title = 'SaaS Up-to-date (Tidak ada pembaruan tertunda)';
        }
    }

    // 4. Show Floating Update Banner
    function showUpdateBanner(versionData) {
        if (!isAdminContext()) return;
        // If user dismissed this exact commit in this browser session, don't nag
        const dismissed = sessionStorage.getItem(DISMISSED_TEMP_KEY);
        if (dismissed === versionData.commit_short) return;

        let banner = document.getElementById('saasUpdateBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'saasUpdateBanner';
            banner.className = 'saas-update-banner';
            document.body.appendChild(banner);
        }

        banner.innerHTML = `
            <div class="saas-banner-icon">🚀</div>
            <div class="saas-banner-content">
                <div class="saas-banner-header">
                    <span class="saas-banner-title">Update SaaS Tersedia</span>
                    <span class="saas-version-pill">${escapeHtml(versionData.commit_short || 'Update')}</span>
                </div>
                <div class="saas-banner-msg">
                    ${escapeHtml(versionData.commit_message || 'Pembaruan fitur sistem baru telah di-commit.')}
                </div>
                <div class="saas-banner-actions">
                    <button class="saas-btn-action saas-btn-primary" onclick="window.saasNotifier.openChangelogModal()">
                        Lihat Fitur Baru
                    </button>
                    <button class="saas-btn-action saas-btn-secondary" onclick="window.saasNotifier.applyUpdateAndReload()">
                        Update & Refresh
                    </button>
                </div>
            </div>
            <button class="saas-btn-close" onclick="window.saasNotifier.dismissBanner()" title="Tutup Notifikasi">&times;</button>
        `;
    }

    // 5. Build & Show Changelog Modal
    function showChangelogModal(versionData) {
        if (!isAdminContext()) return;
        let modal = document.getElementById('saasChangelogModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'saasChangelogModal';
            modal.className = 'saas-modal-backdrop';
            document.body.appendChild(modal);

            // Close when clicking outside
            modal.addEventListener('click', (e) => {
                if (e.target === modal) window.saasNotifier.closeChangelogModal();
            });
        }

        const commits = Array.isArray(versionData.recent_commits) ? versionData.recent_commits : [];
        const commitListHtml = commits.map(c => `
            <li class="saas-commit-item">
                <div class="saas-commit-header">
                    <span class="saas-commit-hash">${escapeHtml(c.hash || '-')}</span>
                    <span>${c.date ? new Date(c.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}</span>
                </div>
                <div class="saas-commit-msg">${escapeHtml(c.message || 'Pembaruan sistem')}</div>
            </li>
        `).join('');

        modal.innerHTML = `
            <div class="saas-modal-card">
                <div class="saas-modal-header">
                    <h3>🚀 Pemberitahuan Update SaaS MC-Connect</h3>
                    <button class="saas-btn-close" onclick="window.saasNotifier.closeChangelogModal()">&times;</button>
                </div>
                <div class="saas-modal-body">
                    <div class="saas-update-highlight-box">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.4rem;">
                            <strong style="color:#D4AF37;">Commit Rilis Terbaru</strong>
                            <span class="saas-version-pill">${escapeHtml(versionData.commit_short || 'Latest')}</span>
                        </div>
                        <div style="font-size:1rem; font-weight:700; color:#FFFFFF; margin-bottom:0.35rem;">
                            ${escapeHtml(versionData.commit_message || 'Pembaruan Fitur Terkini')}
                        </div>
                        <div style="font-size:0.8rem; color:#94A3B8;">
                            Oleh: <strong>${escapeHtml(versionData.commit_author || 'Developer')}</strong> • 
                            ${versionData.commit_date ? new Date(versionData.commit_date).toLocaleString('id-ID') : 'Baru saja'}
                        </div>
                    </div>

                    <h4 style="margin:1rem 0 0.5rem; font-size:0.95rem; color:#D4AF37;">📜 Riwayat Commit & Fitur Baru</h4>
                    <ul class="saas-commit-list">
                        ${commitListHtml || '<li class="saas-commit-item">Tidak ada riwayat commit sebelumnya.</li>'}
                    </ul>
                </div>
                <div class="saas-modal-footer">
                    <button class="saas-btn-action saas-btn-secondary" onclick="window.saasNotifier.markAsRead()">
                        Tandai Sudah Dibaca
                    </button>
                    <button class="saas-btn-action saas-btn-primary" onclick="window.saasNotifier.applyUpdateAndReload()">
                        🔄 Muat Ulang & Terapkan Update
                    </button>
                </div>
            </div>
        `;

        modal.classList.add('active');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // 6. Check Logic
    async function checkVersion(isSilent = false) {
        if (!isAdminContext()) return;

        const data = await fetchLatestVersion();
        if (!data || !data.commit_short) return;
        currentVersionData = data;

        const lastSeen = localStorage.getItem(STORAGE_KEY);

        // If commit hash differs from last seen, an update was committed!
        const hasNewCommit = Boolean(lastSeen && lastSeen !== data.commit_short);

        renderTopbarBell(hasNewCommit);

        if (hasNewCommit) {
            showUpdateBanner(data);
        } else if (!lastSeen) {
            // First run: remember current commit
            localStorage.setItem(STORAGE_KEY, data.commit_short);
            renderTopbarBell(false);
        }
    }

    // 7. Public API
    window.saasNotifier = {
        isAdminContext: () => isAdminContext(),
        checkNow: () => {
            if (!isAdminContext()) return;
            return checkVersion(false);
        },
        openChangelogModal: () => {
            if (!isAdminContext()) return;
            if (currentVersionData) {
                showChangelogModal(currentVersionData);
            } else {
                fetchLatestVersion().then(d => {
                    if (d) {
                        currentVersionData = d;
                        showChangelogModal(d);
                    }
                });
            }
        },
        closeChangelogModal: () => {
            const modal = document.getElementById('saasChangelogModal');
            if (modal) modal.classList.remove('active');
        },
        dismissBanner: () => {
            if (currentVersionData) {
                sessionStorage.setItem(DISMISSED_TEMP_KEY, currentVersionData.commit_short);
            }
            const banner = document.getElementById('saasUpdateBanner');
            if (banner) banner.remove();
        },
        markAsRead: () => {
            if (currentVersionData) {
                localStorage.setItem(STORAGE_KEY, currentVersionData.commit_short);
                sessionStorage.setItem(DISMISSED_TEMP_KEY, currentVersionData.commit_short);
            }
            window.saasNotifier.closeChangelogModal();
            window.saasNotifier.dismissBanner();
            renderTopbarBell(false);
        },
        applyUpdateAndReload: () => {
            if (!isAdminContext()) return;
            if (currentVersionData) {
                localStorage.setItem(STORAGE_KEY, currentVersionData.commit_short);
            }
            // Clear PWA caches and reload with cache busting
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                    for (let r of regs) r.update();
                });
            }
            window.location.reload(true);
        }
    };

    // Auto Init on DOMContentLoaded (Exclusively in Admin Workspace)
    document.addEventListener('DOMContentLoaded', () => {
        if (!isAdminContext()) {
            return;
        }

        injectStyles();
        checkVersion(true);

        // Polling check every 40 seconds
        if (!pollInterval) {
            pollInterval = setInterval(() => {
                if (isAdminContext()) checkVersion(true);
            }, 40000);
        }

        // Re-check when user switches back to tab
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && isAdminContext()) {
                checkVersion(true);
            }
        });
    });
})();

