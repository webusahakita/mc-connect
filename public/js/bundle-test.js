/**
 * MC-CONNECT: DATA PELANGGAN & CRM SYSTEM (v8.0 Pro)
 * Modul Manajemen Data Klien, Pelacakan Acara, Status Booking, LTV, dan Komunikasi WhatsApp
 */

(function() {
    const initialCustomersDb = [];

    let mcCustomers = [];
    let currentCustFilter = 'all';

    async function loadCustomersData() {
        try {
            const resCats = await Promise.all([
                fetch('/api/cms/event-categories').then(r=>r.json()).catch(()=>({})),
                fetch('/api/cms/client-categories').then(r=>r.json()).catch(()=>({}))
            ]);
            window.currentEventCategories = resCats[0]?.data || [];
            window.currentClientCategories = resCats[1]?.data || [];

            const res = await fetch('/api/cms/customers');
            const json = await res.json();
            if (json.success && json.data) {
                mcCustomers = json.data;
                window.mcCustomers = mcCustomers;
                // Ensure _dbId is mapped
                mcCustomers.forEach(c => { if(c.id && !c._dbId) c._dbId = c.id; });
            }
        } catch(e) {
            console.warn("Gagal mengambil data dari server", e);
        }
        renderCustomersTable();
        if (typeof window.renderDashboardPies === 'function') window.renderDashboardPies();
        updateCustomerMetrics();
        renderSidebarCustomerList();
        
        // Auto-heal: Ensure all loaded customers are in the calendar
        setTimeout(() => {
            if (typeof window.autoSyncCustomersToEvents === 'function') {
                window.autoSyncCustomersToEvents(mcCustomers);
            }
        }, 1500); // Give events DB time to load
    }

    let _saveCustomersTimer = null;
    function saveCustomersData() {
        window.mcCustomers = mcCustomers; // update global ref

        // Sync ke Event Command Center
        if (typeof window.autoSyncCustomersToEvents === 'function') {
            window.autoSyncCustomersToEvents(mcCustomers);
        }

        // Sync Cash Flow & Dashboard
        if (typeof window.renderCashflowTable === 'function') {
            window.renderCashflowTable();
        }
        
        // Debounced push to server database
        clearTimeout(_saveCustomersTimer);
        _saveCustomersTimer = setTimeout(() => {
            pushCustomersToServer();
        }, 2000);
    }
    
    async function pushCustomersToServer() {
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
            for (const cust of mcCustomers) {
                const payload = {
                    id: cust._dbId || null,
                    name: cust.name,
                    wa: cust.wa,
                    email: cust.email || '',
                    org: cust.org || '',
                    category: cust.category || 'Wedding',
                    price: cust.price || 0,
                    paymentStatus: cust.paymentStatus || 'Belum Bayar',
                    event: cust.event || '',
                    date: cust.date || null,
                    isVip: cust.isVip || false,
                    notes: cust.notes || '',
                    client_category: cust.client_category || ''
                };
                
                const res = await fetch('/api/cms/customers', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': token
                    },
                    body: JSON.stringify(payload)
                }).catch(err => console.warn('[Sync] Customer push error:', err));
                
                // Store server ID for future updates
                if (res && res.ok) {
                    const json = await res.json();
                    if (json.success && json.dat&& json.data.id) {
                        cust._dbId = json.data.id;
                    }
                }
            }
            console.log('[Sync] Customers pushed to database.');
        } catch(e) {
            console.warn('[Sync] pushCustomersToServer error:', e);
        }
    }

    function formatRupiahNum(val) {
        return 'Rp ' + Number(val || 0).toLocaleString('id-ID');
    }

    function formatDateId(dateStr) {
        if (!dateStr) return '-';
        try {
            const parts = dateStr.split('-');
            if (parts.length === 3) {
                const year = parts[0];
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                const month = monthNames[parseInt(parts[1], 10) - 1] || parts[1];
                const day = parseInt(parts[2], 10);
                return `${day} ${month} ${year}`;
            }
            const d = new Date(dateStr);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch(e) {
            return dateStr;
        }
    }

    function updateCustomerMetrics() {
        const total = mcCustomers.length;
        const active = mcCustomers.filter(c => c.paymentStatus && (c.paymentStatus.includes('DP') || c.paymentStatus.includes('Hold'))).length;
        const vip = mcCustomers.filter(c => c.isVip || (c.category && c.category.includes('Corporate')) || (c.client_category && c.client_category.toLowerCase().includes('vip'))).length;
        const ltv = mcCustomers.reduce((acc, c) => acc + (Number(c.price) || 0), 0);

        const totalEl = document.getElementById('custMetricTotal');
        if (totalEl) totalEl.textContent = `${total} Klien`;

        const activeEl = document.getElementById('custMetricActive');
        if (activeEl) activeEl.textContent = `${active} Acara`;

        const vipEl = document.getElementById('custMetricVip');
        if (vipEl) vipEl.textContent = `${vip} Klien VIP`;

        const ltvEl = document.getElementById('custMetricLtv');
        if (ltvEl) ltvEl.textContent = formatRupiahNum(ltv);

        const filterAllBtn = document.getElementById('custFilterAll');
        if (filterAllBtn) filterAllBtn.textContent = `Semu(${total})`;
        // CRM Pie Charts
        const renderPie = (svgId, legendId, dataMap) => {
            const svg = document.getElementById(svgId);
            const leg = document.getElementById(legendId);
            if (!svg || !leg) return;
            const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];
            const total = Object.values(dataMap).reduce((sum, val) => sum + val, 0);
            if (total === 0) {
                svg.innerHTML = '<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#555" stroke-width="1" stroke-dasharray="3.14159 3.14159" />';
                leg.innerHTML = '<div style="color:var(--adm-text-secondary); text-align:center;">Belum AdData</div>';
                return;
            }
            const sorted = Object.entries(dataMap).sort((a,b) => b[1] - a[1]);
            let currentOffset = 0;
            const circumference = Math.PI;
            let svgHtml = '';
            let legHtml = '';
            sorted.forEach(([cat, val], idx) => {
                const pct = val / total;
                const strokeDasharray = `${pct * circumference} ${circumference}`;
                const strokeDashoffset = -currentOffset;
                currentOffset += (pct * circumference);
                const color = colors[idx % colors.length];
                svgHtml += `<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="${color}" stroke-width="1" stroke-dasharray="${strokeDasharray}" stroke-dashoffset="${strokeDashoffset}" />`;
                legHtml += `
                    <div style="display:flex; justify-content:space-between; align-items:center;">
                        <span style="color:${color}; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:80px;" title="${cat}">● ${cat}</span> 
                        <span style="font-weight:700;">${val} <span style="font-size:0.7rem; color:var(--adm-text-muted); font-weight:normal;">(${Math.round(pct * 100)}%)</span></span>
                    </div>
                `;
            });
            svg.innerHTML = svgHtml;
            leg.innerHTML = legHtml;
        };

        const catData = {};
        const clientCatData = {};
        mcCustomers.forEach(c => {
            const cat = c.category || 'Lainnya';
            catData[cat] = (catData[cat] || 0) + 1;
            const cCat = c.client_category || 'Reguler';
            clientCatData[cCat] = (clientCatData[cCat] || 0) + 1;
        });

        renderPie('crmCategorySvg', 'crmCategoryLegend', catData);
        renderPie('crmClientSvg', 'crmClientLegend', clientCatData);

        // Update Dashboard Conversion Rate
        const convRateEl = document.getElementById('dashConvRate');
        if (convRateEl) {
            const convRate = total > 0 ? Math.round((active / total) * 100) : 0;
            convRateEl.textContent = `${convRate}%`;
        }

        const sidebarBadge = document.getElementById('sidebarCustCountBadge');
        if (sidebarBadge) sidebarBadge.textContent = `${total} Klien`;

        // Sync cash flow with booking revenue
        if (typeof window.renderCashflowTable === 'function') {
            window.renderCashflowTable();
        }

        renderDashboardCustomers();
        renderCrmTopCards();
        renderCrmFilters();
    }

    function renderCrmTopCards() {
        const container = document.getElementById('crmTopSummaryCards');
        if (!container) return;
        
        let clientCats = window.currentClientCategories || [];
        if (clientCats.length === 0) {
            clientCats = [
                { icon: '⭐', name: 'VIP' },
                { icon: '🏢', name: 'Corporate' },
                { icon: '👥', name: 'Regular' }
            ];
        }

        let html = `
            <div class="stat-metric-card gold">
                <div class="stat-metric-top">
                    <span class="stat-metric-label">Total Pelanggan Terdaftar</span>
                    <div class="stat-metric-icon">👥</div>
                </div>
                <div class="stat-metric-val gold" id="custMetricTotal">${mcCustomers.length} Klien</div>
                <div class="stat-metric-foot">
                    <span style="color:var(--adm-gold); font-weight:700;">★ Terintegrasi</span>
                    <span>Database CRM MC-Connect</span>
                </div>
            </div>
        `;

        const activeCount = mcCustomers.filter(c => c.paymentStatus && !c.paymentStatus.includes('Lunas') && !c.paymentStatus.includes('Completed')).length;
        html += `
            <div class="stat-metric-card blue">
                <div class="stat-metric-top">
                    <span class="stat-metric-label">Klien Booking Aktif</span>
                    <div class="stat-metric-icon">💍</div>
                </div>
                <div class="stat-metric-val">${activeCount} Acara</div>
                <div class="stat-metric-foot">
                    <span style="color:var(--adm-info); font-weight:700;">Sedang Berjalan</span>
                    <span>Database CRM</span>
                </div>
            </div>
        `;

        let totalLtv = 0;
        mcCustomers.forEach(c => totalLtv += (Number(c.price) || 0));

        // Card: Pelanggan Belum Lunas
        const belumLunas = mcCustomers.filter(c => c.paymentStatus && !c.paymentStatus.includes('Lunas') && !c.paymentStatus.includes('Completed')).length;
        html += `
            <div class="stat-metric-card" style="border-color:rgba(248,113,113,0.4); background:linear-gradient(135deg, rgba(248,113,113,0.08) 0%, transparent 100%);">
                <div class="stat-metric-top">
                    <span class="stat-metric-label">Pelanggan Belum Lunas</span>
                    <div class="stat-metric-icon">⚠️</div>
                </div>
                <div class="stat-metric-val" style="color:#F87171;">${belumLunas} Klien</div>
                <div class="stat-metric-foot">
                    <span style="color:#F87171; font-weight:700;">Perlu Follow-Up</span>
                    <span>Status Pembayaran</span>
                </div>
            </div>
        `;

        html += `
            <div class="stat-metric-card purple">
                <div class="stat-metric-top">
                    <span class="stat-metric-label">Total Nilai Kontrak (LTV)</span>
                    <div class="stat-metric-icon">💎</div>
                </div>
                <div class="stat-metric-val" style="color:#A78BFA;">Rp ${totalLtv.toLocaleString('id-ID')}</div>
                <div class="stat-metric-foot">
                    <span style="color:#A78BFA; font-weight:700;">Akumulasi LTV</span>
                    <span>Total Keseluruhan</span>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    function renderCrmFilters() {
        const evContainer = document.getElementById('crmFilterContainer');
        const clContainer = document.getElementById('crmClientFilterContainer');
        
        // Style string for option elements — ensures readability in native dropdown
        const optStyle = 'background:#1e1e2f; color:#E2E8F0; padding:6px 10px; font-weight:500;';
        
        if (evContainer) {
            let evCats = window.currentEventCategories || [];
            if (evCats.length === 0) {
                evCats = [{icon: '💍', name: 'Wedding'}, {icon: '🏢', name: 'Corporate'}];
            }
            let html = `<option value="all" style="${optStyle}">📂  Semua Kategori Acara</option>`;
            
            evCats.forEach(cat => {
                const name = typeof cat === 'object' ? cat.name : cat;
                const icon = typeof cat === 'object' ? (cat.icon || '✨') : '✨';
                html += `<option value="${name}" style="${optStyle}">${icon}  ${name}</option>`;
            });
            evContainer.innerHTML = html;
        }

        if (clContainer) {
            let clCats = window.currentClientCategories || [];
            if (clCats.length === 0) {
                clCats = [{icon: '⭐', name: 'VIP'}, {icon: '👥', name: 'Reguler'}];
            }
            let html = `<option value="all" style="${optStyle}">👥  Semua Kategori Klien</option>`;
            
            clCats.forEach(cat => {
                const name = typeof cat === 'object' ? cat.name : cat;
                const icon = typeof cat === 'object' ? (cat.icon || '⭐') : '⭐';
                html += `<option value="${name}" style="${optStyle}">${icon}  ${name}</option>`;
            });
            clContainer.innerHTML = html;
        }
    }

    window.filterCustomersCategory = function(category) {
        // Reset both dropdowns if needed
        const evSelect = document.getElementById('crmFilterContainer');
        const clSelect = document.getElementById('crmClientFilterContainer');
        
        // Determine which dropdown triggered the change
        if (evSelect && evSelect.value === category) {
            // Event category selected, reset client dropdown
            if (clSelect) clSelect.value = 'all';
        } else if (clSelect && clSelect.value === category) {
            // Client category selected, reset event dropdown
            if (evSelect) evSelect.value = 'all';
        }
        
        const query = document.getElementById('custSearchInput')?.value || '';
        renderCustomersTable(category, query);
    }

    function renderDashboardCustomers() {
        const tbody = document.getElementById('dashboardCustomersTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (mcCustomers.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--text-muted);">Belum ada data pelanggan aktif.</td></tr>';
            return;
        }

        // Show top 3 recent customers
        const recent = mcCustomers.slice(-3).reverse();
        recent.forEach(c => {
            const row = document.createElement('tr');
            
            let bgGradient = c.category === 'Wedding' ? 'linear-gradient(135deg,#EC4899,#F43F5E)' : (c.category === 'Corporate' ? 'linear-gradient(135deg,#3B82F6,#0EA5E9)' : 'linear-gradient(135deg,#D4AF37,#F59E0B)');
            let badgeClass = c.category === 'Wedding' ? 'badge-review' : 'badge-review';
            let badgeStyle = c.category === 'Wedding' ? 'background:rgba(236,72,153,0.12); color:#F472B6; border-color:rgba(236,72,153,0.3);' : '';
            
            let newBadge = '';
            if (c.created_at) {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - createdDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    newBadge = `<span class="badge" style="background:rgba(34, 197, 94, 0.2); color:#4ade80; border: 1px solid rgba(34, 197, 94, 0.4); padding: 0.15rem 0.4rem; font-size: 0.65rem; margin-left: 0.35rem;">BARU</span>`;
                }
            }

            row.innerHTML = `
                <td>
                    <div style="display:flex; align-items:center; gap:0.65rem;">
                        <div style="width:34px; height:34px; border-radius:50%; background:${bgGradient}; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.8rem;">${c.initials || 'MC'}</div>
                        <div>
                            <div style="font-weight:700; color:var(--adm-text-primary);">${c.name}${newBadge}</div>
                            <div style="font-size:0.75rem; color:var(--adm-text-muted);">📞 ${c.wa || '-'}</div>
                        </div>
                    </div>
                </td>
                <td><span class="badge ${badgeClass}" style="${badgeStyle}">${c.categoryIcon || '✨'} ${c.categoryLabel || c.category}</span></td>
                <td>${c.event || '-'}</td>
                <td style="font-weight:700; color:var(--adm-text-primary);">Rp ${Number(c.price || 0).toLocaleString('id-ID')}</td>
                <td><span class="badge badge-tentative">${c.paymentStatus || 'Pending'}</span></td>
                <td style="text-align:right;">
                    <button class="btn btn-secondary btn-sm" style="padding:0.3rem 0.55rem; font-size:0.75rem;" onclick="window.viewCustomerDetail(${c.id})" title="Lihat Detail">👁️ Detail</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    function renderSidebarCustomerList() {
        const container = document.getElementById('sidebarSubClients');
        if (!container) return;

        const topClients = mcCustomers.slice(0, 5);
        const itemsHtml = topClients.map(c => {
            let icon = c.categoryIcon || '✨';

            let badgeClass = 'badge-tentative';
            let badgeLabel = 'DP Paid';
            if (c.paymentStatus.includes('Lunas') || c.paymentStatus.includes('100%')) {
                badgeClass = 'badge-available';
                badgeLabel = 'Lunas';
            } else if (c.paymentStatus.includes('Hold')) {
                badgeClass = 'badge-review';
                badgeLabel = 'Hold';
            } else if (c.paymentStatus.includes('Draft') || c.paymentStatus.includes('Review')) {
                badgeClass = 'badge-review';
                badgeLabel = 'Draft';
            }

            const shortName = c.name.length > 17 ? c.name.substring(0, 17) + '...' : c.name;

            return `
                <href="javascript:void(0)" onclick="quickSelectCustomer(${c.id})" class="sidebar-sub-client-item" style="display:flex; align-items:center; justify-content:space-between; padding:0.35rem 0.55rem; border-radius:var(--adm-radius-sm); font-size:0.78rem; color:var(--adm-text-secondary); text-decoration:none; transition:all 0.2s;">
                    <div style="display:flex; align-items:center; gap:0.45rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                        <span style="font-size:0.8rem;">${icon}</span>
                        <span style="font-weight:600; color:var(--adm-text-primary);">${shortName}</span>
                    </div>
                    <span class="badge ${badgeClass}" style="font-size:0.6rem; padding:0.1rem 0.35rem;">${badgeLabel}</span>
                </a>
            `;
        }).join('');

        const footerHtml = `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:0.25rem 0.55rem; font-size:0.72rem; margin-top:0.25rem; border-top:1px dashed rgba(255,255,255,0.08); padding-top:0.35rem;">
                <href="javascript:void(0)" onclick="navigateToSection('sec-customers', document.getElementById('menu-customers'))" style="color:var(--adm-gold); text-decoration:none; font-weight:700;">
                    Lihat Semu(${mcCustomers.length}) →
                </a>
                <href="javascript:void(0)" onclick="openAddCustomerModal()" style="color:var(--adm-text-muted); text-decoration:none; font-weight:600;">
                    + Tambah
                </a>
            </div>
        `;

        container.innerHTML = itemsHtml + footerHtml;
    }

    function quickSelectCustomer(id) {
        if (typeof window.navigateToSection === 'function') {
            window.navigateToSection('sec-customers', document.getElementById('menu-customers'));
        }
        setTimeout(() => {
            const row = document.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                row.style.background = 'rgba(212, 175, 55, 0.2)';
                setTimeout(() => {
                    row.style.background = '';
                }, 2000);
            }
            viewCustomerDetail(id);
        }, 150);
    }

    function renderCustomersTable(filter = currentCustFilter, searchQuery = '') {
        currentCustFilter = filter;
        const tbody = document.getElementById('customersTableBody');
        if (!tbody) return;

        const q = (searchQuery || '').trim().toLowerCase();

        // Get filter values from DOM
        const catFilter = document.getElementById('crmFilterContainer')?.value || 'all';
        const clientFilter = document.getElementById('crmClientFilterContainer')?.value || 'all';
        const payFilter = document.getElementById('crmPaymentFilter')?.value || 'all';
        const calFilter = document.getElementById('crmCalendarFilter')?.value || 'all';

        let filtered = mcCustomers.filter(c => {
            let matchCat = catFilter === 'all' || c.category === catFilter;
            let matchClient = clientFilter === 'all' || c.client_category === clientFilter;
            let matchPay = payFilter === 'all' || (c.paymentStatus && c.paymentStatus.includes(payFilter));
            let matchCal = calFilter === 'all' || (c.calendarStatus && c.calendarStatus.includes(calFilter));

            let matchSearch = true;
            if (q) {
                const text = `${c.name} ${c.org || ''} ${c.wa} ${c.email || ''} ${c.event} ${c.category} ${c.client_category || ''} ${c.paymentStatus}`.toLowerCase();
                matchSearch = text.includes(q);
            }

            return matchCat && matchClient && matchPay && matchCal && matchSearch;
        });

        if (window.currentSortConfig) {
            const { key, order } = window.currentSortConfig;
            filtered.sort((a, b) => {
                let valA = a[key] || '';
                let valB = b[key] || '';
                if (key === 'price' || key === 'value') {
                    valA = parseInt(String(valA).replace(/[^0-9]/g, '')) || 0;
                    valB = parseInt(String(valB).replace(/[^0-9]/g, '')) || 0;
                } else if (key === 'date') {
                    valA = new Date(valA).getTime() || 0;
                    valB = new Date(valB).getTime() || 0;
                } else {
                    valA = String(valA).toLowerCase();
                    valB = String(valB).toLowerCase();
                }
                
                if (valA < valB) return order === 'asc' ? -1 : 1;
                if (valA > valB) return order === 'asc' ? 1 : -1;
                return 0;
            });
        }

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align:center; padding:3.5rem 1rem; color:var(--adm-text-secondary);">
                        <div style="font-size:2.5rem; margin-bottom:0.75rem;">🔍</div>
                        <div style="font-weight:700; font-size:1.1rem; color:var(--adm-text-primary); margin-bottom:0.25rem;">Tidak ada data pelanggan ditemukan</div>
                        <p style="font-size:0.85rem; margin:0;">Coba kata kunci pencarian lain atau klik tombol <strong>+ Tambah Pelanggan Baru</strong>.</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = filtered.map(c => {
            let catBadge = '';
            let style = '';
            if (c.category === 'Wedding') style = 'background:rgba(236,72,153,0.12); color:#F472B6; border-color:rgba(236,72,153,0.3);';
            else if (c.category === 'Private Gala') style = 'background:rgba(139,92,246,0.12); color:#A78BFA; border-color:rgba(139,92,246,0.3);';
            
            catBadge = `<span class="badge badge-review" style="${style}">${c.categoryIcon || '✨'} ${c.category}</span>`;

            let payBadgeClass = 'badge-tentative';
            if (c.paymentStatus && (c.paymentStatus.includes('Lunas') || c.paymentStatus.includes('100%'))) {
                payBadgeClass = 'badge-available';
            } else if (c.paymentStatus && (c.paymentStatus.includes('Hold') || c.paymentStatus.includes('Review'))) {
                payBadgeClass = 'badge-review';
            } else if (c.paymentStatus && c.paymentStatus.includes('Belum')) {
                payBadgeClass = 'badge-locked';
            }

            // Determine status badge class based on calendarStatus or other fields if needed
            let statusBadgeClass = 'badge-review';
            if (c.calendarStatus === 'Terkunci') statusBadgeClass = 'badge-locked';
            if (c.calendarStatus === 'Tentative') statusBadgeClass = 'badge-tentative';

            let newBadge = '';
            if (c.created_at) {
                const createdDate = new Date(c.created_at);
                const now = new Date();
                const diffTime = Math.abs(now - createdDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays <= 7) {
                    newBadge = `<span class="badge" style="background:rgba(34, 197, 94, 0.2); color:#4ade80; border: 1px solid rgba(34, 197, 94, 0.4); padding: 0.15rem 0.4rem; font-size: 0.65rem; margin-left: 0.35rem;">BARU</span>`;
                }
            }

            let clientCatBadge = '';
            if (c.client_category) {
                const ccatObj = (window.currentClientCategories || []).find(cat => cat.name === c.client_category || cat === c.client_category);
                const cicon = (ccatObj && ccatObj.icon) ? ccatObj.icon : '⭐';
                const cname = (ccatObj && ccatObj.name) ? ccatObj.name : c.client_category;
                clientCatBadge = `<span class="badge badge-tier-pro">${cicon} ${cname}</span>`;
            } else {
                clientCatBadge = `<span class="badge badge-locked" style="background:rgba(255,255,255,0.05); color:#94A3B8;">-</span>`;
            }

            return `
                <tr data-id="${c.id}">
                    <td>
                        <div style="display:flex; align-items:center; gap:0.75rem;">
                            <div style="width:38px; height:38px; border-radius:50%; background:${c.initialsBg || 'linear-gradient(135deg,#6366F1,#8B5CF6)'}; color:${c.initialsColor || '#fff'}; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:0.85rem; flex-shrink:0; box-shadow:0 2px 6px rgba(0,0,0,0.3);">
                                ${c.initials || 'MC'}
                            </div>
                            <div>
                                <div style="font-weight:700; color:var(--adm-text-primary); font-size:0.92rem;">${c.name}${newBadge}</div>
                                <div style="font-size:0.78rem; color:var(--adm-text-muted);">
                                    ${c.org ? `🏢 ${c.org}  ` : ''}📞 ${c.wa}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>${catBadge}</td>
                    <td>${clientCatBadge}</td>
                    <td>
                        <div style="font-weight:600; color:var(--adm-text-primary); font-size:0.88rem;">${c.event}</div>
                        <div style="font-family:var(--font-mono); font-size:0.78rem; color:var(--adm-gold);">
                            📅 ${c.formattedDate || c.date}
                        </div>
                        <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--adm-text-secondary); margin-top:0.25rem;">
                            🕒 ${c.time || 'Waktu tidak ditentukan'}
                        </div>
                    </td>
                    <td style="font-weight:700; color:var(--adm-text-primary); font-size:0.92rem;">
                        ${formatRupiahNum(c.price)}
                    </td>
                    <td>
                        <span class="badge ${payBadgeClass}">${c.paymentStatus || 'Belum Bayar'}</span>
                    </td>
                    <td>
                        <span class="badge ${statusBadgeClass}">${c.calendarStatus || 'Review'}</span>
                    </td>
                    <td style="text-align:right;">
                        <div style="display:flex; justify-content:flex-end; gap:0.35rem; flex-wrap:wrap;">
                            <button class="btn btn-secondary btn-sm" style="padding:0.3rem 0.55rem; font-size:0.75rem;" onclick="window.viewCustomerDetail(${c.id})" title="Lihat Detail & Catatan">
                                👁️ Detail
                            </button>
                            <button class="btn btn-primary btn-sm" style="padding:0.3rem 0.55rem; font-size:0.75rem;" onclick="window.openCustomerInCommandCenter(${c.id})" title="Bukdi Event Command Center">
                                ⚡ ECC
                            </button>
                            <button class="btn btn-secondary btn-sm" style="padding:0.3rem 0.55rem; font-size:0.75rem;" onclick="window.focusCalendarCustomer('${c.date}')" title="Lihat Jadwal di Kalender">
                                📅 Kalender
                            </button>
                            <button class="btn btn-secondary btn-sm" style="color:#F87171; border-color:rgba(239,68,68,0.3); padding:0.3rem 0.45rem; font-size:0.75rem;" onclick="window.deleteCustomer(${c.id})" title="Hapus Pelanggan">
                                🗑️
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    function escapeHtmlCust(str) {
        if (!str) return '';
        return str.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    }

    function searchCustomersTable(query) {
        renderCustomersTable(currentCustFilter, query);
    }




    // =========================================================================
    // AUTO-DURATION CALCULATOR & ANTI-BENTROK COLLISION ENGINE
    // =========================================================================
    function calculateEventDuration(start, end) {
        if (!start || !end) return '';
        try {
            const [sH, sM] = start.split(':').map(Number);
            const [eH, eM] = end.split(':').map(Number);
            if (isNaN(sH) || isNaN(sM) || isNaN(eH) || isNaN(eM)) return '';

            let startTotal = sH * 60 + sM;
            let endTotal = eH * 60 + eM;

            // Handle cross-midnight events (e.g. 21:00 to 01:00)
            if (endTotal < startTotal) {
                endTotal += 24 * 60;
            }

            const diffMinutes = endTotal - startTotal;
            if (diffMinutes <= 0) return '0 Menit';

            const hours = Math.floor(diffMinutes / 60);
            const minutes = diffMinutes % 60;

            if (hours > 0 && minutes > 0) {
                return `${hours} Jam ${minutes} Menit`;
            } else if (hours > 0) {
                return `${hours} Jam`;
            } else {
                return `${minutes} Menit`;
            }
        } catch(e) {
            return '';
        }
    }
    window.calculateEventDuration = calculateEventDuration;

    function checkCustomerScheduleCollision(dateStr) {
        if (!dateStr) return { hasConflict: false, count: 0, events: [] };
        
        let allEvents = [];
        if (typeof adminEventsDb !== 'undefined' && Array.isArray(adminEventsDb) && adminEventsDb.length > 0) {
            allEvents = adminEventsDb;
        } else {
            try {
                const stored = AdminDB.getItem('mc_events_db_v1');
                if (stored) allEvents = JSON.parse(stored);
            } catch(e) {}
        }

        const conflicting = allEvents.filter(e => e.date === dateStr);
        return {
            hasConflict: conflicting.length > 0,
            count: conflicting.length,
            events: conflicting
        };
    }
    window.checkCustomerScheduleCollision = checkCustomerScheduleCollision;

    function updateCustDurationAndCollision() {
        const startVal = document.getElementById('newCustStartTime')?.value || '18:00';
        const endVal = document.getElementById('newCustEndTime')?.value || '22:00';
        const dateVal = document.getElementById('newCustDate')?.value || '';

        // 1. Calculate and update duration
        const durStr = calculateEventDuration(startVal, endVal);
        const durInput = document.getElementById('newCustDuration');
        if (durInput) {
            durInput.value = durStr || '0 Menit';
        }

        // 2. Check collision on date
        const alertEl = document.getElementById('custScheduleCollisionAlert');
        if (!alertEl) return;

        if (!dateVal) {
            alertEl.style.display = 'none';
            return;
        }

        const collision = checkCustomerScheduleCollision(dateVal);
        if (collision.hasConflict) {
            alertEl.style.display = 'block';
            alertEl.style.background = 'rgba(239, 68, 68, 0.12)';
            alertEl.style.border = '1px solid rgba(239, 68, 68, 0.5)';
            alertEl.style.color = '#FCA5A5';
            alertEl.innerHTML = `
                <div style="display:flex; align-items:flex-start; gap:0.65rem;">
                    <span style="font-size:1.35rem; line-height:1;">⚠️</span>
                    <div style="flex:1;">
                        <div style="font-weight:700; color:#FCA5A5; font-size:0.86rem; text-transform:uppercase;">
                            Peringatan Jadwal Bentrok Terdeteksi!
                        </div>
                        <div style="font-size:0.8rem; margin-top:0.25rem; color:#FEE2E2;">
                            Tanggal <strong>${dateVal}</strong> sudah memiliki <strong>${collision.count} acarterdaftar</strong>:
                        </div>
                        <ul style="margin:0.35rem 0 0 1.1rem; padding:0; font-size:0.8rem; color:#FCD34D; line-height:1.4;">
                            ${collision.events.map(ev => `<li><strong>${ev.title}</strong> (${ev.time || 'Waktu belum diatur'}) — <span style="text-decoration:underline;">${ev.status}</span></li>`).join('')}
                        </ul>
                        <div style="margin-top:0.45rem; font-size:0.75rem; color:#E2E8F0; background:rgba(0,0,0,0.25); padding:0.3rem 0.5rem; border-radius:4px;">
                            🛡️ Sistem Proteksi Anti-Bentrok akan menandai bentrok jadwal secarotomatis di Kalender Acara.
                        </div>
                    </div>
                </div>
            `;
        } else {
            alertEl.style.display = 'block';
            alertEl.style.background = 'rgba(16, 185, 129, 0.1)';
            alertEl.style.border = '1px solid rgba(16, 185, 129, 0.4)';
            alertEl.style.color = '#6EE7B7';
            alertEl.innerHTML = `
                <div style="display:flex; align-items:center; gap:0.55rem;">
                    <span style="font-size:1.15rem; color:#10B981;">✓</span>
                    <span style="font-size:0.82rem; font-weight:600; color:#6EE7B7;">
                        Jadwal Kosong & Bebas Bentrok: Tanggal ${dateVal} siap menerimbooking acarMC baru.
                    </span>
                </div>
            `;
        }
    }
    window.updateCustDurationAndCollision = updateCustDurationAndCollision;

    function openAddCustomerModal() {
        const titleEl = document.getElementById('customerModalTitle');
        if (titleEl) titleEl.textContent = '👥 Tambah Data Pelanggan Baru';

        const idEl = document.getElementById('newCustId');
        if (idEl) idEl.value = '';

        const nameEl = document.getElementById('newCustName');
        if (nameEl) nameEl.value = '';
        
        const pkgEl = document.getElementById('newCustPackage');
        if (pkgEl) pkgEl.value = '';
        
        const venueEl = document.getElementById('newCustVenue');
        if (venueEl) venueEl.value = '';
        const catEl = document.getElementById('newCustCategory');
        if (catEl) {
            catEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Acara --</option>';
            if (window.currentEventCategories && window.currentEventCategories.length > 0) {
                window.currentEventCategories.forEach(cat => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                    catEl.innerHTML += `<option value="${catName}">${catIcon}${catName}</option>`;
                });
            } else {
                catEl.innerHTML += `<option value="Wedding">Wedding</option><option value="Corporate">Corporate</option>`;
            }
            catEl.value = '';
        }
        
        const clientCatEl = document.getElementById('newCustClientCategory');
        if (clientCatEl) {
            clientCatEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Klien --</option>';
            if (window.currentClientCategories && window.currentClientCategories.length > 0) {
                window.currentClientCategories.forEach(cat => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                    clientCatEl.innerHTML += `<option value="${catName}">${catIcon}${catName}</option>`;
                });
            } else {
                clientCatEl.innerHTML += `<option value="VIP">⭐ VIP</option><option value="Corporate">🏢 Corporate</option><option value="Reguler">👥 Reguler</option>`;
            }
            clientCatEl.value = '';
        }
        const waEl = document.getElementById('newCustWa');
        if (waEl) waEl.value = '';
        const emailEl = document.getElementById('newCustEmail');
        if (emailEl) emailEl.value = '';
        const eventEl = document.getElementById('newCustEvent');
        if (eventEl) eventEl.value = '';
        const dateEl = document.getElementById('newCustDate');
        if (dateEl) {
            const today = new Date().toISOString().split('T')[0];
            dateEl.value = today;
        }

        const startEl = document.getElementById('newCustStartTime');
        if (startEl) startEl.value = '18:00';
        const endEl = document.getElementById('newCustEndTime');
        if (endEl) endEl.value = '22:00';

        const priceEl = document.getElementById('newCustPrice');
        if (priceEl) priceEl.value = '';
        const payEl = document.getElementById('newCustPayment');
        if (payEl) payEl.value = 'DP 50% Paid';
        const notesEl = document.getElementById('newCustNotes');
        if (notesEl) notesEl.value = '';

        updateCustDurationAndCollision();

        const modal = document.getElementById('addCustomerModal');
        if (modal) modal.classList.add('active');
        setTimeout(() => document.getElementById('newCustName')?.focus(), 150);
    }
    window.openAddCustomerModal = openAddCustomerModal;

    window.openEditCustomerModal = function(cust) {
        if (!cust) return;
        
        if (typeof window.closeModals === 'function') window.closeModals();

        const titleEl = document.getElementById('customerModalTitle');
        if (titleEl) titleEl.textContent = '✏️ Edit Data Pelanggan';

        const idEl = document.getElementById('newCustId');
        if (idEl) idEl.value = cust.id;

        const nameEl = document.getElementById('newCustName');
        if (nameEl) nameEl.value = cust.name || '';
        
        const pkgEl = document.getElementById('newCustPackage');
        if (pkgEl) pkgEl.value = cust.package || 'Custom';
        
        const venueEl = document.getElementById('newCustVenue');
        if (venueEl) venueEl.value = cust.venue || '';
        
        const catEl = document.getElementById('newCustCategory');
        if (catEl) {
            catEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Acara --</option>';
            if (window.currentEventCategories && window.currentEventCategories.length > 0) {
                window.currentEventCategories.forEach(cat => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                    catEl.innerHTML += `<option value="${catName}">${catIcon}${catName}</option>`;
                });
            } else {
                catEl.innerHTML += `<option value="Wedding">Wedding</option><option value="Corporate">Corporate</option>`;
            }
            catEl.value = cust.category || '';
        }
        
        const clientCatEl = document.getElementById('newCustClientCategory');
        if (clientCatEl) {
            clientCatEl.innerHTML = '<option value="" disabled selected>-- Pilih Kategori Klien --</option>';
            if (window.currentClientCategories && window.currentClientCategories.length > 0) {
                window.currentClientCategories.forEach(cat => {
                    const catName = typeof cat === 'object' ? cat.name : cat;
                    const catIcon = typeof cat === 'object' ? cat.icon + ' ' : '';
                    clientCatEl.innerHTML += `<option value="${catName}">${catIcon}${catName}</option>`;
                });
            } else {
                clientCatEl.innerHTML += `<option value="VIP">⭐ VIP</option><option value="Corporate">🏢 Corporate</option><option value="Reguler">👥 Reguler</option>`;
            }
            clientCatEl.value = cust.client_category || '';
        }

        const waEl = document.getElementById('newCustWa');
        if (waEl) waEl.value = cust.wa || '';
        const emailEl = document.getElementById('newCustEmail');
        if (emailEl) emailEl.value = cust.email || '';
        const eventEl = document.getElementById('newCustEvent');
        if (eventEl) eventEl.value = cust.event || '';
        const dateEl = document.getElementById('newCustDate');
        if (dateEl) dateEl.value = cust.date || '';

        const startEl = document.getElementById('newCustStartTime');
        if (startEl) startEl.value = cust.startTime || '18:00';
        const endEl = document.getElementById('newCustEndTime');
        if (endEl) endEl.value = cust.endTime || '22:00';

        const priceEl = document.getElementById('newCustPrice');
        if (priceEl) priceEl.value = cust.price || '';
        const payEl = document.getElementById('newCustPayment');
        if (payEl) payEl.value = cust.paymentStatus || 'DP 50% Paid';
        const calStatusEl = document.getElementById('newCustCalendarStatus');
        if (calStatusEl) calStatusEl.value = cust.calendarStatus || 'Review';
        const notesEl = document.getElementById('newCustNotes');
        if (notesEl) notesEl.value = cust.notes || '';

        updateCustDurationAndCollision();

        const modal = document.getElementById('addCustomerModal');
        if (modal) modal.classList.add('active');
        setTimeout(() => document.getElementById('newCustName')?.focus(), 150);
    };

    async function handleSaveCustomer(e) {
        if (e && e.preventDefault) e.preventDefault();
        
        const custId = document.getElementById('newCustId')?.value || null;
        
        const name = (document.getElementById('newCustName')?.value || '').trim();
        const category = document.getElementById('newCustCategory')?.value || 'Wedding';
        const clientCategory = document.getElementById('newCustClientCategory')?.value || 'Reguler';
        const wa = (document.getElementById('newCustWa')?.value || '').trim();
        const email = (document.getElementById('newCustEmail')?.value || '').trim();
        const eventName = (document.getElementById('newCustEvent')?.value || '').trim();
        const date = document.getElementById('newCustDate')?.value || '';
        const startTime = document.getElementById('newCustStartTime')?.value || '18:00';
        const endTime = document.getElementById('newCustEndTime')?.value || '22:00';
        const duration = document.getElementById('newCustDuration')?.value || calculateEventDuration(startTime, endTime) || '4 Jam';
        const price = Number(document.getElementById('newCustPrice')?.value) || 0;
        const payment = document.getElementById('newCustPayment')?.value || 'DP 50% Paid';
        const calendarStatus = document.getElementById('newCustCalendarStatus')?.value || 'Review';
        const notes = (document.getElementById('newCustNotes')?.value || '').trim();
        const packageName = document.getElementById('newCustPackage')?.value || 'Custom';
        const venue = (document.getElementById('newCustVenue')?.value || '').trim();

        if (!name || !wa || !eventName || !date) {
            uiAlert("Harap lengkapi semua kolom bertanda bintang (*).");
            return;
        }

        // Anti-Bentrok Check on Save
        if (!custId) {
            const collision = checkCustomerScheduleCollision(date);
            if (collision.hasConflict) {
                const conflictDetails = collision.events.map(ev => ` "${ev.title}" (Pukul ${ev.time || '18:00 WIB'}) — Status: ${ev.status}`).join('\n');
                const userConfirmed = await uiConfirm(
                    `⚠️ PERINGATAN JADWAL BENTROK!\n\nPadtanggal ${formatDateId(date)} sudah terdaftar ${collision.count} acarpanggung:\n${conflictDetails}\n\nApakah Andtetap ingin mencatatkan acarbaru ini?\n(Sistem Anti-Bentrok akan menandai peringatan tabrakan di Kalender).`
                );
                if (!userConfirmed) {
                    return;
                }
            }
        }

        const words = name.split(/\s+/).filter(w => w.length > 0);
        let initials = 'CL';
        if (words.length >= 2) {
            initials = (words[0][0] + words[1][0]).toUpperCase();
        } else if (words.length === 1) {
            initials = words[0].substring(0, 2).toUpperCase();
        }

        const colorGradients = [
            'linear-gradient(135deg,#EC4899,#F43F5E)',
            'linear-gradient(135deg,#3B82F6,#0EA5E9)',
            'linear-gradient(135deg,#D4AF37,#F59E0B)',
            'linear-gradient(135deg,#10B981,#059669)',
            'linear-gradient(135deg,#8B5CF6,#6366F1)'
        ];
        const randGradient = colorGradients[Math.floor(Math.random() * colorGradients.length)];

        const timeFormatted = `${startTime} - ${endTime} WIB (${duration})`;

        const payload = {
            name: name,
            category: category,
            wa: wa,
            email: email,
            event: eventName,
            date: date,
            startTime: startTime,
            endTime: endTime,
            duration: duration,
            price: price,
            paymentStatus: payment,
            calendarStatus: calendarStatus,
            notes: notes || '',
            client_category: clientCategory,
            package: packageName,
            venue: venue
        };
        
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
            let endpoint = '/api/cms/customers';
            let method = 'POST';
            
            if (custId) {
                const existingCust = mcCustomers.find(c => c.id == custId);
                const dbId = (existingCust && (existingCust._dbId || existingCust.id)) ? (existingCust._dbId || existingCust.id) : custId;
                payload.id = dbId;
            }
            
            const res = await fetch(endpoint, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify(payload)
            });
            const json = await res.json();
            
            if (json.success) {
                // Reload datfrom backend
                await loadCustomersData();
                if (typeof window.loadUnifiedEventsDatabase === 'function') {
                    await window.loadUnifiedEventsDatabase();
                }
                
                // Broadcast for sync
                if (typeof window.syncChannel !== 'undefined') {
                    window.syncChannel.postMessage('RELOAD_CALENDAR');
                }
                
                if (typeof window.closeModals === 'function') {
                    window.closeModals();
                } else {
                    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
                }
                
                if (typeof window.showToast === 'function') {
                    window.showToast(custId ? `Data pelanggan "${name}" berhasil diperbarui!` : `Data pelanggan "${name}" berhasil disimpan & disinkronkan ke Kalender!`, 'gold');
                }
            } else {
                uiAlert(`Gagal menyimpan data: ${json.message}`);
            }
        } catch(e) {
            console.warn('[Sync] Save customer error:', e);
            uiAlert('Gagal menyimpan data ke server.');
        }
    }

    function viewCustomerDetail(id) {
        const cust = mcCustomers.find(c => c.id === id);
        if (!cust) return;

        const nameEl = document.getElementById('viewCustName');
        if (nameEl) nameEl.textContent = cust.name;
        const catEl = document.getElementById('viewCustCategory');
        if (catEl) catEl.textContent = `${cust.categoryIcon || '✨'} ${cust.category}`;
        const payEl = document.getElementById('viewCustPayment');
        if (payEl) payEl.textContent = cust.paymentStatus;
        const waEl = document.getElementById('viewCustWa');
        if (waEl) waEl.textContent = cust.wa;
        const emailEl = document.getElementById('viewCustEmail');
        if (emailEl) emailEl.textContent = cust.email || '-';
        const eventEl = document.getElementById('viewCustEvent');
        if (eventEl) eventEl.textContent = cust.event;
        const pkgEl = document.getElementById('viewCustPackage');
        if (pkgEl) pkgEl.textContent = cust.package || '-';
        const venueEl = document.getElementById('viewCustVenue');
        if (venueEl) venueEl.textContent = cust.venue || '-';
        const dateEl = document.getElementById('viewCustDate');
        if (dateEl) dateEl.textContent = cust.formattedDate || cust.date;
        const priceEl = document.getElementById('viewCustPrice');
        if (priceEl) priceEl.textContent = formatRupiahNum(cust.price);

        const timeEl = document.getElementById('viewCustTime');
        if (timeEl) {
            const timeDisplay = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
            timeEl.textContent = timeDisplay;
        }

        const notesEl = document.getElementById('viewCustNotes');
        if (notesEl) notesEl.textContent = cust.notes || 'Tidak adcatatan preferensi panggung.';

        const waBtn = document.getElementById('viewCustWaBtn');
        if (waBtn) {
            waBtn.onclick = function() {
                openWhatsAppChat(cust.wa, cust.name, cust.event);
            };
        }

        const eccBtn = document.getElementById('viewCustEccBtn');
        if (eccBtn) {
            eccBtn.onclick = function() {
                if (typeof window.closeModals === 'function') window.closeModals();
                if (typeof window.openCustomerInCommandCenter === 'function') {
                    window.openCustomerInCommandCenter(cust.id);
                }
            };
        }
        
        const editBtn = document.getElementById('viewCustEditBtn');
        if (editBtn) {
            editBtn.onclick = function() {
                if (typeof window.openEditCustomerModal === 'function') {
                    window.openEditCustomerModal(cust);
                }
            };
        }

        const calBtn = document.getElementById('viewCustCalBtn');
        if (calBtn) {
            calBtn.onclick = function() {
                if (typeof window.closeModals === 'function') window.closeModals();
                if (typeof window.focusCalendarCustomer === 'function') {
                    window.focusCalendarCustomer(cust.date);
                }
            };
        }

        const editSchedBtn = document.getElementById('viewCustEditScheduleBtn');
        if (editSchedBtn) {
            editSchedBtn.onclick = function() {
                if (typeof window.closeModals === 'function') window.closeModals();
                if (typeof window.openEditEventScheduleModal === 'function') {
                    window.openEditEventScheduleModal(cust.id);
                }
            };
        }

        const modal = document.getElementById('viewCustomerDetailModal');
        if (modal) modal.classList.add('active');
    }

    window.closeSelectWaTemplateModal = function() {
        const modal = document.getElementById('selectWaTemplateModal');
        if (modal) modal.classList.remove('active');
    };

    function openWhatsAppChat(phone, name, eventTitle) {
        let cleanPhone = (phone || '').replace(/[^0-9]/g, '');
        if (cleanPhone.startsWith('0')) {
            cleanPhone = '62' + cleanPhone.substring(1);
        } else if (!cleanPhone.startsWith('62')) {
            cleanPhone = '62' + cleanPhone;
        }

        const modal = document.getElementById('selectWaTemplateModal');
        const container = document.getElementById('waTemplateOptionsContainer');
        const targetName = document.getElementById('waTargetName');
        
        if (!modal || !container || !targetName) {
            // Fallback jikmodal tidak adconst greeting = `Halo Kak ${name}, salam hangat dari VanyArsyad (Master of Ceremony).\n\nTerkait persiapan acar"${eventTitle}", kami siap berkoordinasi untuk rundown panggung, naskah prompter, sertkebutuhan teknis acarAnda. Addetail khusus yang ingin dikoordinasikan hari ini?`;
            const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
            window.open(waUrl, '_blank');
            return;
        }

        targetName.textContent = name;
        container.innerHTML = '';

        const templates = window.currentWaTemplates && window.currentWaTemplates.length > 0 
            ? window.currentWaTemplates 
            : [{
                title: 'Sapaan Awal (Default)',
                message: `Halo Kak {name}, salam hangat dari VanyArsyad (Master of Ceremony).\n\nTerkait persiapan acar"{event}", kami siap berkoordinasi untuk rundown panggung, naskah prompter, sertkebutuhan teknis acarAnda. Addetail khusus yang ingin dikoordinasikan hari ini?`
            }];

        templates.forEach(tpl => {
            let msg = tpl.message || '';
            msg = msg.replace(/{name}/g, name).replace(/{event}/g, eventTitle);

            const btn = document.createElement('button');
            btn.className = 'btn btn-outline-gold';
            btn.style.width = '100%';
            btn.style.textAlign = 'left';
            btn.style.padding = '0.75rem';
            btn.style.display = 'block';
            btn.style.marginBottom = '0.5rem';
            btn.innerHTML = `
                <div style="font-weight:700; margin-bottom:0.25rem;">${tpl.title}</div>
                <div style="font-size:0.75rem; color:var(--text-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${msg}</div>
            `;
            btn.onclick = function() {
                const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
                window.open(waUrl, '_blank');
                if (typeof window.showToast === 'function') {
                    window.showToast(`MembukWhatsApp untuk ${name}...`, 'gold');
                }
                closeSelectWaTemplateModal();
            };
            container.appendChild(btn);
        });

        modal.classList.add('active');
    }

    async function deleteCustomer(id) {
        const cust = mcCustomers.find(c => c.id === id);
        if (!cust) return;

        if (await uiConfirm(`Apakah Anda yakin ingin menghapus data pelanggan "${cust.name}"? Jadwal acara di kalender juga akan dihapus.`)) {
            const dbId = cust._dbId || cust.id;
            try {
                // Delete from SERVER database (MySQL)
                const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
                await fetch(`/api/cms/customers/${dbId}`, {
                    method: 'DELETE',
                    headers: { 'Accept': 'application/json', 'X-CSRF-TOKEN': token }
                });
                console.log('[Sync] Customer deleted from server.');

                // Reload datfrom backend
                await loadCustomersData();
                if (typeof window.loadUnifiedEventsDatabase === 'function') {
                    await window.loadUnifiedEventsDatabase();
                }
                
                // Broadcast for sync
                if (typeof window.syncChannel !== 'undefined') {
                    window.syncChannel.postMessage('RELOAD_CALENDAR');
                }
                
                if (typeof window.showToast === 'function') {
                    window.showToast(`Data pelanggan "${cust.name}" & jadwal terkait telah dihapus.`, 'gold');
                }
            } catch(e) {
                console.warn('[Sync] Delete customer error:', e);
                uiAlert('Gagal menghapus data dari server.');
            }
        }
    }

    function exportCustomersCsv() {
        if (mcCustomers.length === 0) {
            uiAlert("Tidak ada data pelanggan untuk diexport.");
            return;
        }

        let csv = "\uFEFF"; // UTF-8 BOM
        csv += "ID,NamPelanggan,Instansi,Kategori,No WhatsApp,Email,NamAcara,Tanggal Acara,Nilai Kontrak,Status Pembayaran,Catatan Khusus\n";

        mcCustomers.forEach(c => {
            const escapeCsv = (str) => `"${(str || '').toString().replace(/"/g, '""')}"`;
            csv += [
                c.id,
                escapeCsv(c.name),
                escapeCsv(c.org || '-'),
                escapeCsv(c.category),
                escapeCsv(c.wa),
                escapeCsv(c.email || '-'),
                escapeCsv(c.event),
                escapeCsv(c.date),
                c.price,
                escapeCsv(c.paymentStatus || ''),
                escapeCsv(c.notes)
            ].join(',') + "\n";
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `data-pelanggan-mc-connect-${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        if (typeof window.showToast === 'function') {
            window.showToast("Kontak pelanggan berhasil diexport ke CSV!", "gold");
        }
    }

    async function resetToDefaultCustomers() {
        AdminDB.removeItem('mc_customers_db_v1');
        mcCustomers = JSON.parse(JSON.stringify(initialCustomersDb));
        saveCustomersData();
        renderCustomersTable();
        updateCustomerMetrics();
        renderSidebarCustomerList();
        if (typeof window.showToast === 'function') {
            window.showToast("Data pelanggan berhasil di-reset ke data default!", "gold");
        }
    }

    // Expose all functions to window for global access
    window.mcCustomersDb = mcCustomers;
    window.loadCustomersData = loadCustomersData;
    window.renderCustomersTable = renderCustomersTable;
    window.updateCustomerMetrics = updateCustomerMetrics;
    window.renderSidebarCustomerList = renderSidebarCustomerList;
    window.renderCrmFilters = renderCrmFilters;
    window.quickSelectCustomer = quickSelectCustomer;
    window.searchCustomersTable = searchCustomersTable;
    window.openAddCustomerModal = openAddCustomerModal;
    window.handleSaveCustomer = handleSaveCustomer;
    window.viewCustomerDetail = viewCustomerDetail;
    window.openWhatsAppChat = openWhatsAppChat;
    window.deleteCustomer = deleteCustomer;
    window.exportCustomersCsv = exportCustomersCsv;
    window.resetToDefaultCustomers = resetToDefaultCustomers;
    window.saveCustomersData = saveCustomersData;

    // Auto initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadCustomersData);
    } else {
        loadCustomersData();
    }
})();


    window.currentSortConfig = { key: 'date', order: 'asc' };
    function sortCustomersTable(key) {
        if (window.currentSortConfig && window.currentSortConfig.key === key) {
            window.currentSortConfig.order = window.currentSortConfig.order === 'asc' ? 'desc' : 'asc';
        } else {
            window.currentSortConfig = { key: key, order: 'asc' };
        }
        renderCustomersTable();
    }
    window.sortCustomersTable = sortCustomersTable;

\nwindow.closeModals = function() { document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active')); const rf = document.getElementById('requestForm'); if (rf) rf.reset(); };
/**
 * MC-Connect Main Client Script
 */

document.addEventListener('DOMContentLoaded', () => {
    // 0. Mobile Menu Toggle
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    const navLinks = document.querySelector('.nav-links');
    const navActions = document.querySelector('.nav-actions');
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenuBtn.classList.toggle('active');
            navLinks.classList.toggle('show');
            navActions.classList.toggle('show');
        });
    }

    // 1. Setup FAQ Accordion
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            item.classList.toggle('active');
        });
    });

    // 2. Setup Modal Closers
    document.querySelectorAll('.btn-close, .modal-overlay').forEach(closer => {
        closer.addEventListener('click', (e) => {
            if (e.target === closer) {
                document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
            }
        });
    });

    // 3. Tab Switcher
    window.switchTab = function(tabId) {
        document.querySelectorAll('.ecc-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.remove('active'));

        const targetBtn = document.querySelector(`[data-tab="${tabId}"]`);
        const targetPanel = document.getElementById(tabId);

        if (targetBtn) targetBtn.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    };

    // 4. Toast Notification
    window.showToast = function(message, type = 'gold') {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span>✨</span> <div>${message}</div>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    };
});
\n/**
 * MC-Connect Admin Core Script v8.0
 * Unified Workspace Engine: Dashboard, Anti-Bentrok Calendar, Cashflow, CMS, Event Command Center, Stage Mode & Vendor
 */

// ================================================================
// API LAYER  Semua data disimpan ke MySQL viLaravel REST API
// Fallback ke localStorage jikserver tidak tersedia(offline mode)
// ================================================================
const API_BASE = '/api';
const MC_ID = 1; // Single-tenant: MC pertamdi database

// Channel Sinkronisasi Antar Tab (Real-Time Calendar Sync)
window.syncChannel = new BroadcastChannel('mc_sync_channel');
window.syncChannel.onmessage = (event) => {
    if (event.data === 'RELOAD_CALENDAR') {
        console.log('[SyncChannel] Sinyal update diterima, me-reload database calendar...');
        if (typeof loadUnifiedEventsDatabase === 'function') {
            loadUnifiedEventsDatabase();
        }
    }
};

/**
 * GET data dari API, fallback ke localStorage jikerror
 */
async function apiGet(endpoint) {
    try {
        const res = await fetch(API_BASE + endpoint, {
            headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const json = await res.json();
        return json.dat?? json;
    } catch (e) {
        console.warn('[API] GET', endpoint, 'failed:', e.message);
        return null;
    }
}

/**
 * POST JSON data ke API, fallback ke localStorage jikerror
 */
async function apiPost(endpoint, data = {}) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data)
        });
        return await res.json();
    } catch (e) {
        console.warn('[API] POST', endpoint, 'failed:', e.message);
        return { success: false, message: 'Gagal terhubung ke server utama.' };
    }
}

/**
 * POST multipart/form-dat(file upload) ke API
 */
async function apiUpload(endpoint, formData) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: formDat});
        return await res.json();
    } catch (e) {
        console.warn('[API] UPLOAD', endpoint, 'failed:', e.message);
        return { success: false, message: 'Upload gagal: ' + e.message };
    }
}

/**
 * DELETE request ke API
 */
async function apiDelete(endpoint) {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
        const res = await fetch(API_BASE + endpoint, {
            method: 'DELETE',
            headers: {
                'Accept': 'application/json',
                'X-CSRF-TOKEN': token,
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        return await res.json();
    } catch (e) {
        console.warn('[API] DELETE', endpoint, 'failed:', e.message);
        return { success: false, message: e.message };
    }
}

/**
 * Inject CSRF mettag dari Laravel jikbelum ad* (admin.html statis perlu ini untuk POST request)
 */
(function injectCsrfMeta() {
    if (!document.querySelector('meta[name="csrf-token"]')) {
        fetch('/api/csrf-token').then(r => r.json()).then(d => {
            const met= document.createElement('meta');
            meta.name = 'csrf-token';
            meta.content = d.token || '';
            document.head.appendChild(meta);
        }).catch(() => {});
    }
})();

// 0. Theme Initialization
function initTheme() {
    const savedTheme = localStorage.getItem('mc_theme') || 'dark';
    if (savedTheme === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
        const btn = document.getElementById('themeToggleBtn');
        if (btn) btn.textContent = '🌞';
    }
}
function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('mc_theme', newTheme);
    
    const btn = document.getElementById('themeToggleBtn');
    if (btn) {
        btn.textContent = newTheme === 'dark' ? '🌙' : '🌞';
    }
}
window.toggleTheme = toggleTheme;
initTheme();

function initAdminWorkspace() {
    // Integrate with Database (Sync Engine)
    if (typeof window.SyncEngine !== 'undefined' && typeof window.SyncEngine.pullAll === 'function') {
        window.SyncEngine.pullAll();
    }

    console.log('[Admin] Workspace initialized.');
}

// 1. Session & Auth
async function handleAdminLogout() {
    if (await uiConfirm('Apakah Anda yakin ingin keluar dari ruang kerja Admin MC?')) {
        sessionStorage.removeItem('mc_auth_token');
        sessionStorage.removeItem('mc_auth_user');
        if (typeof showToast === 'function') {
            showToast('Andtelah logout.', 'gold');
        }
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 400);
    }
}

let adminTokens = 85;

// 2. Anti-Bentrok Calendar & Unified Events Database Engine
let adminEventsDb = [];
let activeCommandCenterEventId = null;

function formatDateIndoFull(dateStr) {
    if (!dateStr) return '-';
    try {
        const d = new Date(dateStr + 'T00:00:00');
        const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch(e) {
        return dateStr;
    }
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function normalizeAndDeduplicateEvents(existingEvents, customers, seedEvents) {
    const map = new Map();

    // 1. Load seed events
    (seedEvents || []).forEach(ev => {
        const key = `${ev.date}::${(ev.title || '').trim().toLowerCase()}`;
        map.set(key, JSON.parse(JSON.stringify(ev)));
    });

    // 2. Overlay existing stored events
    (existingEvents || []).forEach(ev => {
        const key = `${ev.date}::${(ev.title || '').trim().toLowerCase()}`;
        if (map.has(key)) {
            map.set(key, { ...map.get(key), ...ev });
        } else {
            map.set(key, ev);
        }
    });

    // 3. Overlay all customer schedules from CRM to guarantee 100% integration
    (customers || []).forEach(cust => {
        if (!cust.date || !cust.event) return;
        const key = `${cust.date}::${cust.event.trim().toLowerCase()}`;
        
        let status = cust.calendarStatus;
        if (!status) {
            status = 'Review';
            if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP') && cust.paymentStatus.includes('Paid'))) {
                status = 'Terkunci';
            } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative') || cust.paymentStatus.includes('DP'))) {
                status = 'Tentative';
            }
        }

        if (map.has(key)) {
            const ev = map.get(key);
            ev.customerId = cust.id;
            ev.price = 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID');
            ev.rawPrice = Number(cust.price || 0);
            ev.pic = cust.name + (cust.w? ` (${cust.wa})` : '');
            ev.paymentStatus = cust.paymentStatus;
            ev.category = cust.category || ev.category;
            map.set(key, ev);
        } else {
            const newEv = {
                id: cust.id,
                customerId: cust.id,
                title: cust.event,
                date: cust.date,
                time: '18:30 - 21:30 WIB',
                venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
                pic: cust.name + (cust.w? ` (${cust.wa})` : ''),
                price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
                rawPrice: Number(cust.price || 0),
                status: status,
                paymentStatus: cust.paymentStatus,
                note: `${cust.paymentStatus} - Terintegrasi dari CRM`,
                category: cust.category || 'Event',
                vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
                vipProtocol: [
                    { role: 'Klien PIC', name: cust.name },
                    { role: 'FOH Liaison', name: 'Stage Runner MC' }
                ],
                checklist: [
                    { text: 'Konfirmasi pelafalan namgelar tamu VIP', done: true },
                    { text: 'Cek gladi mic wireless Shure Axient di FOH', done: true },
                    { text: 'Briefing sinyal cue musik dengan FOH operator', done: false }
                ],
                expenses: []
            };
            map.set(key, newEv);
        }
    });

    const result = Array.from(map.values());
    result.sort((a, b) => new Date(a.date) - new Date(b.date));
    return result;
}

async function loadUnifiedEventsDatabase() {
    try {
        const res = await fetch('/api/cms/events');
        const json = await res.json();
        
        let events = [];
        if (json.success && json.data) {
            events = json.data;
        } else {
            console.warn('[Sync] Gagal memuat event dari server.');
        }

        setTimeout(() => {
            const loader = document.getElementById('globalAppLoader');
            if (loader) loader.classList.add('hidden');
        }, 500);

        // Mapping agar kompatibel dengan UI admin
        adminEventsDb = events.map(ev => ({
            id: ev.id,
            dbEventId: ev.id,
            customerId: ev.customerId,
            clientName: ev.pic ? ev.pic.split(' ')[0] : 'Klien',
            title: ev.title,
            date: ev.date,
                time: ev.time,
            time: ev.time,
            venue: ev.venue,
            pic: ev.pic,
            price: ev.price,
            rawPrice: ev.rawPrice || 0,
            status: ev.status,
            paymentStatus: ev.paymentStatus,
            note: ev.note,
            category: ev.category,
            vipNotes: ev.vipNotes || '',
            vipProtocol: Array.isArray(ev.vipProtocol) ? ev.vipProtocol : [],
            checklist: Array.isArray(ev.checklist) ? ev.checklist : [],
            expenses: Array.isArray(ev.expenses) ? ev.expenses : [],
            musicList: Array.isArray(ev.musicList) ? ev.musicList : [],
            rundown: Array.isArray(ev.rundown) ? ev.rundown : [],
            created_at: ev.created_at || null
        }));

        // Data murni dari database, tidak menyimpan cache lokal lagi
        
        if (typeof renderDashEvents === 'function') renderDashEvents();
        if (typeof window.adminCalendar !== 'undefined' && window.adminCalendar.setEvents) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        
        updateCalendarMenuBadge();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        
    } catch (e) {
        console.error('[Sync] Gagal memuat event:', e);
    }
    
    // saveUnifiedEventsDatabase();
    if (window.renderCashflowTable) window.renderCashflowTable();


    if (!activeCommandCenterEventId && adminEventsDb.length > 0) {
        activeCommandCenterEventId = adminEventsDb[0].id;
    }
}

function updateCalendarMenuBadge() {
    const badge = document.getElementById('calendarMenuBadge');
    if (!badge) return;
    
    // Calculate new bookings (events with 'Review' status requiring admin action)
    const newBookings = adminEventsDb.filter(ev => ev.status === 'Review').length;
    
    if (newBookings > 0) {
        badge.textContent = newBookings;
        badge.style.display = 'inline-block';
    } else {
        badge.style.display = 'none';
    }
}

function autoSyncEventsToCustomers(events) {
    let customers = [];
    try {
        const rawCust = JSON.stringify(window.mcCustomers || []);
        if (rawCust) customers = JSON.parse(rawCust);
    } catch(e) {}
    
    let isModified = false;

    events.forEach(ev => {
        // Extract name and phone from pic: "Name (Phone)"
        let name = ev.pic || 'Unknown Client';
        let phone = '';
        const match = name.match(/(.*?)\s*\((.*?)\)/);
        if (match) {
            name = match[1].trim();
            phone = match[2].trim();
        }

        // Check if customer exists by ID or Exact Name
        const exists = customers.find(c => {
            if (!c) return false;
            const matchId = String(c.id) === String(ev.customerId || ev.id);
            const matchName = c.name && typeof c.name === 'string' && name && typeof name === 'string' && c.name.toLowerCase() === name.toLowerCase();
            return matchId || matchName;
        });

        if (exists) {
            // Update customer details based on event
            if (ev.tanggal_acar|| ev.date) exists.date = ev.tanggal_acar|| ev.date;
            if (ev.time) exists.time = ev.time;
            if (ev.nama_acar|| ev.title) exists.event = ev.nama_acar|| ev.title;
            let priceNum = 0;
            if (ev.nilai_kontrak) priceNum = parseInt(String(ev.nilai_kontrak).replace(/[^0-9]/g, '')) || 0;
            else if (ev.price) priceNum = parseInt(String(ev.price).replace(/[^0-9]/g, '')) || 0;
            if (priceNum > 0) exists.price = priceNum;
            if (ev.status_pembayaran || ev.paymentStatus) exists.paymentStatus = ev.status_pembayaran || ev.paymentStatus;
            isModified = true;
        }

        if (!exists) {
            const newCustId = ev.customerId || ev.id || Date.now();
            const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MC';
            let org = 'Personal Client';
            if (ev.category === 'Corporate') org = name;
            else if (ev.category === 'Private Gala') org = 'Private/GalEvent';
            else if (ev.category === 'Wedding') org = 'Wedding Client';

            const newCust = {
                id: newCustId,
                name: name,
                org: org,
                initials: initials,
                initialsBg: 'linear-gradient(135deg,#D4AF37,#F59E0B)',
                initialsColor: '#000000',
                email: name.toLowerCase().replace(/\s/g, '') + '@email.com',
                phone: phone || '-',
                address: ev.venue || '-',
                status: ev.status === 'Terkunci' ? 'Active' : (ev.status === 'Selesai' ? 'Completed' : 'Lead'),
                value: ev.rawPrice || 0,
                event: ev.title,
                date: ev.date,
                time: ev.time,
                notes: ev.vipNotes || ev.note || 'Diimpor otomatis dari Kalender / Event Command Center.'
            };
            customers.push(newCust);
            ev.customerId = newCustId; // Link them
            isModified = true;
        }
    });

    if (isModified) {
        
        // Update global customers array if it exists
        if (typeof mcCustomers !== 'undefined') {
            window.mcCustomers = customers;
        }
        if (typeof window.saveCustomersData === 'function') {
            window.saveCustomersData();
        }
        // Force re-render of customers table if function is available
        if (typeof renderCustomersTable === 'function') {
            try { renderCustomersTable(); } catch(err) {}
        }
        if (typeof updateCustomerMetrics === 'function') {
            try { updateCustomerMetrics(); } catch(err) {}
        }
    }
}

let _saveEventsTimer = null;
function saveUnifiedEventsDatabase() {
    try {
        // Hanymemanggil sync ke Data Pelanggan
        // Selalu pastikan sync ke Data Pelanggan setiap kali Events disimpan
        if (typeof autoSyncEventsToCustomers === 'function') {
            autoSyncEventsToCustomers(adminEventsDb);
        }
    } catch(e) {
        console.error("Gagal menyimpan database acara:", e);
    }
    window.adminEventsDb = adminEventsDb;

    // Sync Cash Flow UI with any expense changes
    if (typeof window.renderCashflowTable === 'function') {
        window.renderCashflowTable();
    }

    // Sync Dashboard Events Grid
    if (typeof renderDashEvents === 'function') {
        renderDashEvents();
    }

    // Debounced push to server database
    clearTimeout(_saveEventsTimer);
    _saveEventsTimer = setTimeout(() => {
        pushEventsToServer();
    }, 1500);
}

async function pushEventsToServer() {
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        for (const ev of adminEventsDb) {
            const dbId = ev._dbEventId || ev.dbEventId;
            if (!dbId) continue; // Skip events without server ID

            const payload = {
                nama_acara: ev.title,
                lokasi: ev.venue,
                tanggal_acara: ev.date,
                waktu_mulai: (ev.startTime || '18:00') + ':00',
                waktu_selesai: (ev.endTime || '21:00') + ':00',
                status: ev.status,
                tipe_acara: ev.category || 'Wedding',
                catatan_khusus: ev.note || '',
                nilai_kontrak: ev.rawPrice || 0,
                status_pembayaran: ev.paymentStatus || 'Tentative (Hold)',
                metadata: {
                    vipNotes: ev.vipNotes || '',
                    vipProtocol: ev.vipProtocol || [],
                    checklist: ev.checklist || [],
                    expenses: ev.expenses || [],
                    wardrobeIds: ev.wardrobeIds || [],
                }
            };

            await fetch(`/api/cms/events/${dbId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token
                },
                body: JSON.stringify(payload)
            }).catch(err => console.warn('[Sync] Event push error:', err));
        }
        console.log('[Sync] Events pushed to database.');
    } catch(e) {
        console.warn('[Sync] pushEventsToServer error:', e);
    }
}

function populateCommandCenterSelector() {
    const selector = document.getElementById('eccEventSelector');
    if (!selector) return;

    if (!adminEventsDb || adminEventsDb.length === 0) {
        selector.innerHTML = '<option value="">Belum ada acara</option>';
        return;
    }

    let filteredEvents = [...adminEventsDb];
    if (window.currentAgendaFilter) {
        if (window.currentAgendaFilter === 'terkunci') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'terkunci');
        } else if (window.currentAgendaFilter === 'tentative') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'tentative');
        } else if (window.currentAgendaFilter === 'review') {
            filteredEvents = filteredEvents.filter(e => e.status.toLowerCase() === 'review');
        }
    }

    if (filteredEvents.length === 0) {
        selector.innerHTML = '<option value="">Tidak ada acara sesuai filter</option>';
        return;
    }

    selector.innerHTML = filteredEvents.map(ev => {
        let icon = '';
        if (ev.category === 'Corporate') icon = '🏢';
        else if (ev.category === 'Private Gala') icon = '🎭';
        
        let displayTitle = ev.title;
        if (typeof mcCustomers !== 'undefined' && ev.customerId) {
            const customer = mcCustomers.find(c => String(c.id) === String(ev.customerId));
            if (customer && customer.name) {
                displayTitle = `${customer.name} - ${ev.title}`;
            }
        }
        
        return `<option value="${ev.id}">${icon} [${ev.date}] ${displayTitle} (${ev.status})</option>`;
    }).join('');

    if (activeCommandCenterEventId) {
        selector.value = activeCommandCenterEventId;
    }
}

function switchCommandCenterEvent(eventId) {
    loadActiveEventInCommandCenter(eventId);
    const ev = adminEventsDb.find(e => String(e.id) === String(eventId));
    if (ev) {
        if (typeof showToast === 'function') {
            showToast(`Command Center beralih ke acara: "${ev.title}"`, 'gold');
        }
        if (typeof populateCommandCenterSelector === 'function') {
            populateCommandCenterSelector();
        }
    }
}
window.switchCommandCenterEvent = switchCommandCenterEvent;

function openEventInCommandCenter(eventId) {
    loadActiveEventInCommandCenter(eventId);
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-command-center', document.getElementById('menu-command-center'));
    }
}
window.openEventInCommandCenter = openEventInCommandCenter;

function openCustomerInCommandCenter(custId) {
    let ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === String(custId));
    if (!ev) {
        let cust = null;
        try {
            const raw = JSON.stringify(window.mcCustomers || []);
            const custs = raw ? JSON.parse(raw) : [];
            cust = custs.find(c => String(c.id) === String(custId));
        } catch(e) {}

        if (cust) {
            syncCustomerToCalendar(cust);
            ev = adminEventsDb.find(e => String(e.customerId) === String(custId) || String(e.id) === String(custId));
        }
    }
    const targetId = ev ? ev.id : (adminEventsDb[0] ? adminEventsDb[0].id : 1);
    openEventInCommandCenter(targetId);
}
window.openCustomerInCommandCenter = openCustomerInCommandCenter;

function focusCalendarCustomer(dateStr) {
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-calendar', document.getElementById('menu-calendar'));
    }
    setTimeout(() => {
        focusCalendarDate(dateStr);
    }, 150);
}
window.focusCalendarCustomer = focusCalendarCustomer;

function syncCustomerToCalendar(cust) {
    if (!cust || !cust.date) return;
    const key = `${cust.date}::${(cust.event || '').trim().toLowerCase()}`;
    let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

    let status = 'Review';
    if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
        status = 'Terkunci';
    } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
        status = 'Tentative';
    }

    const timeFormatted = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
    const eventData = {
        id: cust.id,
        customerId: cust.id,
        title: cust.event,
        date: cust.date,
        time: timeFormatted,
        startTime: cust.startTime || '18:00',
        endTime: cust.endTime || '22:00',
        duration: cust.duration || '4 Jam',
        venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
        pic: cust.name + (cust.w? ` (${cust.wa})` : ''),
        price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
        rawPrice: Number(cust.price || 0),
        status: status,
        paymentStatus: cust.paymentStatus,
        note: `${cust.paymentStatus} - Terintegrasi dari CRM Pelanggan`,
        category: cust.category || 'Event',
        vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
        vipProtocol: [
            { role: 'Klien PIC', name: cust.name },
            { role: 'Koordinator FOH', name: 'Tim Stage Runner MC' }
        ],
        checklist: [
            { text: 'Konfirmasi pelafalan namklien & gelar', done: true },
            { text: 'Cek gladi mic wireless Shure di venue', done: true },
            { text: 'Briefing sinyal cue musik panggung', done: false }
        ],
        expenses: []
    };

    if (existingIndex >= 0) {
        adminEventsDb[existingIndex] = { ...adminEventsDb[existingIndex], ...eventDat};
    } else {
        adminEventsDb.push(eventData);
    }

    adminEventsDb.sort((a, b) => new Date(a.date) - new Date(b.date));
    saveUnifiedEventsDatabase();

    if (window.adminCalendar) {
        window.adminCalendar.setEvents(adminEventsDb);
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
}
window.syncCustomerToCalendar = syncCustomerToCalendar;

async function deleteEventByCustomerId(custId, skipPrompt = false) {
    // 0. Find DB IDs before removing
    const eventsToDelete = adminEventsDb.filter(e => String(e.id) === String(custId) || String(e.customerId) === String(custId));
    
    // 1. Delete from SERVER database (MySQL)
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        const headers = { 'Accept': 'application/json', 'X-CSRF-TOKEN': token };
        
        // Delete events from server
        for (const ev of eventsToDelete) {
            const dbEvId = ev._dbEventId || ev.dbEventId || ev.id;
            if (dbEvId) {
                await fetch(`/api/cms/events/${dbEvId}`, { method: 'DELETE', headers }).catch(() => {});
            }
        }
    } catch(err) {
        console.warn('Gagal menghapus event dari DB server', err);
    }
    
    // 2. Reload dari server untuk sinkronisasi akurat
    await loadUnifiedEventsDatabase();
    if (typeof window.syncChannel !== 'undefined') {
        window.syncChannel.postMessage('RELOAD_CALENDAR');
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
    
    if (adminEventsDb.length > 0) {
        loadActiveEventInCommandCenter(adminEventsDb[0].id);
    } else {
        loadActiveEventInCommandCenter(null);
    }
}
window.deleteEventByCustomerId = deleteEventByCustomerId;

async function deleteEventById(eventId) {
    if (!await uiConfirm('Apakah Anda yakin ingin menghapus acara ini secara permanen? Data pelanggan TIDAK akan terhapus.')) return;
    
    const evToDelete = adminEventsDb.find(e => String(e.id) === String(eventId));
    if (!evToDelete) return;

    // 1. Delete from Events DB (local)
    adminEventsDb = adminEventsDb.filter(e => String(e.id) !== String(eventId));
    saveUnifiedEventsDatabase();

    // 2. Delete from SERVER database (MySQL)
    try {
        const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || window.CSRF_TOKEN || '';
        const headers = { 'Accept': 'application/json', 'X-CSRF-TOKEN': token };
        
        const dbEvId = evToDelete._dbEventId || evToDelete.dbEventId || evToDelete.id;
        if (dbEvId) {
            fetch(`/api/cms/events/${dbEvId}`, { method: 'DELETE', headers }).catch(() => {});
        }
        console.log('[Sync] Event deleted dari server.');
    } catch(e) {
        console.warn('[Sync] Delete from server error:', e);
    }

    // 3. Update UI
    if (window.adminCalendar) {
        window.adminCalendar.setEvents(adminEventsDb);
    }
    renderAdminAgendaList();
    updateCalMetrics();
    populateCommandCenterSelector();
    
    const inspector = document.getElementById('calendarConflictInspector');
    if (inspector) inspector.style.display = 'none';
    
    if (adminEventsDb.length > 0) {
        loadActiveEventInCommandCenter(adminEventsDb[0].id);
    } else {
        loadActiveEventInCommandCenter(null);
    }

    if (typeof showToast === 'function') showToast('Jadwal acarberhasil dihapus', 'red');
}
window.deleteEventById = deleteEventById;

function syncCalendarToCustomer(newEv) {
    try {
        const raw = JSON.stringify(window.mcCustomers || []);
        let custs = raw ? JSON.parse(raw) : [];
        const existing = custs.find(c => String(c.id) === String(newEv.id) || (c.date === newEv.date && c.event.toLowerCase() === newEv.title.toLowerCase()));
        if (!existing) {
            const rawVal = Number(newEv.rawPrice) || 10000000;
            const words = (newEv.pic || 'Klien Baru').split(/s+/).filter(w => w.length > 0);
            let initials = 'MC';
            if (words.length >= 2) initials = (words[0][0] + words[1][0]).toUpperCase();
            else if (words.length === 1) initials = words[0].substring(0, 2).toUpperCase();

            const newCust = {
                id: newEv.id,
                name: newEv.pic ? newEv.pic.split('(')[0].trim() : 'Klien Baru',
                org: 'Klien Personal / Perusahaan',
                initials: initials,
                initialsBg: 'linear-gradient(135deg,#D4AF37,#F59E0B)',
                initialsColor: '#000000',
                category: newEv.category || 'Wedding',
                categoryLabel: newEv.category === 'Corporate' ? 'x Corporate' : 'Wedding',
                wa: newEv.pic && newEv.pic.includes('(') ? newEv.pic.split('(')[1].replace(')', '').trim() : '081234567890',
                email: 'klien@mcconnect.id',
                event: newEv.title,
                date: newEv.date,
                formattedDate: `${newEv.date}  ${newEv.venue}`,
                price: rawVal,
                paymentStatus: newEv.status === 'Terkunci' ? 'DP 50% Paid' : 'Tentative (Hold)',
                relationType: 'Active Booking',
                isVip: newEv.category === 'Corporate',
                notes: newEv.note || 'Acardidaftarkan melalui Kalender Anti-Bentrok.'
            };
            custs.unshift(newCust);
            /* localStorage removed */;;
            if (typeof window.loadCustomersData === 'function') {
                window.loadCustomersData();
            }
        }
    } catch(e) {
        console.warn('Sync to customer error:', e);
    }
}
window.syncCalendarToCustomer = syncCalendarToCustomer;

function loadActiveEventInCommandCenter(eventId) {
    if (!adminEventsDb || adminEventsDb.length === 0) {
        const idBadge = document.getElementById('ccEventIdDisplay');
        if (idBadge) idBadge.textContent = 'Event_ID #---';
        const titleH1 = document.getElementById('ccEventTitle');
        if (titleH1) titleH1.textContent = 'Belum AdJadwal Acara';
        const statusBadge = document.getElementById('ccEventStatusBadge');
        if (statusBadge) {
            statusBadge.className = 'badge badge-review';
            statusBadge.textContent = 'Tidak AdData';
        }
        const metaDate = document.getElementById('ccEventMetaDate');
        if (metaDate) metaDate.textContent = '-';
        const metaTime = document.getElementById('ccEventMetaTime');
        if (metaTime) metaTime.textContent = '';
        const metaVenue = document.getElementById('ccEventMetaVenue');
        if (metaVenue) metaVenue.textContent = '';
        const metaPic = document.getElementById('ccEventMetaPic');
        if (metaPic) metaPic.textContent = '';
        
        // Ensure layout is visible even if empty (User requested the tabs to remain visible as whole)
        const navTabs = document.querySelector('.ecc-nav-tabs');
        if (navTabs) navTabs.style.display = 'flex';
        const tabPanels = document.querySelectorAll('#sec-command-center .tab-panel');
        tabPanels.forEach(p => p.style.display = '');

        const emptyStateMsg = document.getElementById('eccEmptyStateMsg');
        if (emptyStateMsg) emptyStateMsg.style.display = 'none';

        // Clear dynamic contents safely
        const rdBody = document.getElementById('rundownTableBody');
        if (rdBody) rdBody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Belum adjadwal acaraktif.</td></tr>';
        
        const vipList = document.getElementById('vipProtocolList');
        if (vipList) vipList.innerHTML = '<div style="color:var(--adm-text-muted);">Tidak ada data.</div>';
        
        const eccClientAvatar = document.getElementById('eccClientAvatar');
        if (eccClientAvatar) {
            eccClientAvatar.textContent = '-';
            eccClientAvatar.style.background = 'transparent';
        }
        
        const eccClientName = document.getElementById('eccClientName');
        if (eccClientName) eccClientName.textContent = 'Belum AdKlien';
        
        const eccClientContact = document.getElementById('eccClientContact');
        if (eccClientContact) eccClientContact.innerHTML = '<span>-</span> <span>S0️ -</span>';
        
        const eccClientPkg = document.getElementById('eccClientPkg');
        if (eccClientPkg) eccClientPkg.textContent = '-';
        
        const eccClientPrice = document.getElementById('eccClientPrice');
        if (eccClientPrice) eccClientPrice.textContent = 'Rp 0';
        
        const eccClientDuration = document.getElementById('eccClientDuration');
        if (eccClientDuration) eccClientDuration.textContent = '-';
        
        const eccClientVenue = document.getElementById('eccClientVenue');
        if (eccClientVenue) eccClientVenue.textContent = '-';
        
        const adminContractVal = document.getElementById('adminContractVal');
        if (adminContractVal) adminContractVal.textContent = 'Rp 0';
        
        const adminDpVal = document.getElementById('adminDpVal');
        if (adminDpVal) adminDpVal.textContent = 'Rp 0';
        
        const adminSisaVal = document.getElementById('adminSisaVal');
        if (adminSisaVal) adminSisaVal.textContent = 'Rp 0';
        
        const adminProfitVal = document.getElementById('adminProfitVal');
        if (adminProfitVal) adminProfitVal.textContent = 'Rp 0';

        const tabStickyNotesText = document.getElementById('tabStickyNotesText');
        if (tabStickyNotesText) tabStickyNotesText.value = '';

        const eccVipProtocolList = document.getElementById('eccVipProtocolList');
        if (eccVipProtocolList) eccVipProtocolList.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Tidak addatprotokol VIP.</div>';

        const adminChkList = document.getElementById('adminChkList');
        if (adminChkList) adminChkList.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum adchecklist.</div>';

        
        return;
    }

    // Restore layout if recovering from empty state
    const navTabs = document.querySelector('.ecc-nav-tabs');
    if (navTabs) navTabs.style.display = 'flex';
    const tabPanels = document.querySelectorAll('#sec-command-center .tab-panel');
    tabPanels.forEach(p => p.style.display = '');
    const emptyStateMsg = document.getElementById('eccEmptyStateMsg');
    if (emptyStateMsg) emptyStateMsg.style.display = 'none';

    let ev = adminEventsDb.find(e => String(e.id) === String(eventId) || String(e.customerId) === String(eventId));
    if (!ev) {
        ev = adminEventsDb[0];
    }
    activeCommandCenterEventId = ev.id;
    try { AdminDB.setItem('activeCommandCenterEventId', ev.id); } catch(e) {}

    // 1. Selector Dropdown
    const selector = document.getElementById('eccEventSelector');
    if (selector) selector.value = ev.id;

    // 2. Header Status & Title
    const idBadge = document.getElementById('ccEventIdDisplay');
    if (idBadge) idBadge.textContent = `Event_ID #${ev.id}`;

    const statusBadge = document.getElementById('ccEventStatusBadge');
    if (statusBadge) {
        if (ev.status === 'Terkunci') {
            statusBadge.className = 'badge badge-locked';
            statusBadge.textContent = 'Status: Terkunci (DP Paid)';
        } else if (ev.status === 'Tentative') {
            statusBadge.className = 'badge badge-tentative';
            statusBadge.textContent = '⏳ Status: Tentative (Hold)';
        } else if (ev.status === 'Review') {
            statusBadge.className = 'badge badge-review';
            statusBadge.textContent = 'Status: Review';
        } else {
            statusBadge.className = 'badge badge-completed';
            statusBadge.textContent = 'Status: Selesai';
        }
    }

    const statusSelect = document.getElementById('ccStatusSelect');
    if (statusSelect) {
        const match = Array.from(statusSelect.options).find(o => o.value.toLowerCase() === (ev.status || '').toLowerCase());
        if (match) statusSelect.value = match.value;
    }

    const titleH1 = document.getElementById('ccEventTitle');
    if (titleH1) titleH1.textContent = ev.title;

    const metaDate = document.getElementById('ccEventMetaDate');
    if (metaDate) metaDate.textContent = `& ${formatDateIndoFull(ev.date)}`;

    const metaTime = document.getElementById('ccEventMetaTime');
    if (metaTime) metaTime.textContent = `⏰ ${ev.time || '19:00 - 22:00 WIB'}`;

    const metaVenue = document.getElementById('ccEventMetaVenue');
    if (metaVenue) metaVenue.textContent = `${ev.venue || 'Venue Terdaftar'}`;

    const metaPic = document.getElementById('ccEventMetaPic');
    if (metaPic) metaPic.textContent = `${ev.pic || 'PIC Terdaftar'}`;

    // Get linked customer details if available
    let cust = null;
    try {
        const rawCust = JSON.stringify(window.mcCustomers || []);
        const custs = rawCust ? JSON.parse(rawCust) : [];
        cust = custs.find(c => String(c.id) === String(ev.customerId) || String(c.id) === String(ev.id) || (c.date === ev.date && c.event === ev.title));
    } catch(e) {}

    const clientName = cust ? cust.name : (ev.pic ? ev.pic.split('(')[0].trim() : 'Klien Belum Terdaftar');
    const clientPhone = cust ? cust.w: (ev.pic && ev.pic.includes('(') ? ev.pic.split('(')[1].replace(')', '').trim() : '-');
    const clientEmail = cust ? (cust.email || '-') : '-';
    const clientPkg = cust ? cust.category : (ev.category || 'Belum Dipilih');
    const clientDuration = ev.duration ? `${ev.duration}  ${ev.time}` : (cust && cust.duration ? `${cust.duration}  ${ev.time}` : (ev.time || 'Waktu Belum Diset'));

    // 3. Tab 1 - Client Profile Card
    const clientAvatar = document.getElementById('eccClientAvatar');
    if (clientAvatar) {
        if (cust && cust.initials) {
            clientAvatar.textContent = cust.initials;
            clientAvatar.style.background = cust.initialsBg || 'linear-gradient(135deg,#D4AF37,#B38F26)';
            clientAvatar.style.color = cust.initialsColor || '#FFFFFF';
        } else {
            const safeClientName = String(clientName || 'Klien');
            const words = safeClientName.split(/\s+/).filter(w => w.length > 0);
            const initials = words.length >= 2 ? (words[0][0] + words[1][0]).toUpperCase() : safeClientName.substring(0, 2).toUpperCase();
            clientAvatar.textContent = initials || 'MC';
            clientAvatar.style.background = 'linear-gradient(135deg,#D4AF37,#B38F26)';
            clientAvatar.style.color = '#0B0F19';
        }
    }

    const clientBadge = document.getElementById('eccClientBadge');
    if (clientBadge) {
        clientBadge.className = ev.status === 'Terkunci' ? 'badge badge-locked' : (ev.status === 'Tentative' ? 'badge badge-tentative' : 'badge badge-review');
        clientBadge.textContent = ev.paymentStatus || ev.status;
    }

    const clientNameEl = document.getElementById('eccClientName');
    if (clientNameEl) clientNameEl.textContent = clientName;

    const clientContact = document.getElementById('eccClientContact');
    if (clientContact) {
        clientContact.innerHTML = `<span>${clientPhone}</span> <span>S0️ ${clientEmail}</span>`;
    }

    const clientPkgEl = document.getElementById('eccClientPkg');
    if (clientPkgEl) clientPkgEl.textContent = clientPkg;

    const clientPriceEl = document.getElementById('eccClientPrice');
    if (clientPriceEl) clientPriceEl.textContent = ev.price;

    const clientDurationEl = document.getElementById('eccClientDuration');
    if (clientDurationEl) clientDurationEl.textContent = clientDuration;

    const clientVenueEl = document.getElementById('eccClientVenue');
    if (clientVenueEl) clientVenueEl.textContent = ev.venue;

    const clientWaBtn = document.getElementById('eccClientWaBtn');
    if (clientWaBtn) {
        clientWaBtn.onclick = function() {
            if (typeof window.openWhatsAppChat === 'function') {
                window.openWhatsAppChat(clientPhone, clientName, ev.title);
            }
        };
    }

    const clientCrmBtn = document.getElementById('eccClientCrmBtn');
    if (clientCrmBtn) {
        clientCrmBtn.onclick = function() {
            if (typeof window.quickSelectCustomer === 'function' && (ev.customerId || ev.id)) {
                window.quickSelectCustomer(ev.customerId || ev.id);
            } else if (typeof navigateToSection === 'function') {
                navigateToSection('sec-customers', document.getElementById('menu-customers'));
            }
        };
    }

    // 4. Tab 1 - Sticky Notes (per event)
    const stickyEl = document.getElementById('tabStickyNotesText');
    if (stickyEl) {
        const savedSticky = AdminDB.getItem(`ecc_sticky_notes_${ev.id}`);
        stickyEl.value = savedSticky !== null ? savedSticky : (ev.vipNotes || '');
        stickyEl.oninput = function() {
            AdminDB.setItem(`ecc_sticky_notes_${ev.id}`, this.value);
            ev.vipNotes = this.value;
            saveUnifiedEventsDatabase();
        };
    }

    const stickySubtitle = document.getElementById('eccStickySubtitle');
    if (stickySubtitle) {
        stickySubtitle.textContent = `* Tersimpan ke Event_ID #${ev.id}`;
    }

    // 5. Tab 1 - VIP Protocol
    const vipContainer = document.getElementById('eccVipProtocolList');
    if (vipContainer) {
        const protocols = ev.vipProtocol && ev.vipProtocol.length > 0 ? ev.vipProtocol : [];
        if (protocols.length === 0) {
            vipContainer.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum addatprotokol VIP.</div>';
        } else {
            vipContainer.innerHTML = protocols.map(p => `
                <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.04); padding-bottom:0.3rem;">
                    <span style="color:var(--adm-text-muted);">${escapeHtml(p.role)}:</span>
                    <strong style="color:#F8FAFC;">${escapeHtml(p.name)}</strong>
                </div>
            `).join('');
        }
    }

    // 6. Tab 1 - Checklist
    const chkContainer = document.getElementById('adminChkList');
    if (chkContainer) {
        const items = ev.checklist && ev.checklist.length > 0 ? ev.checklist : [];
        if (items.length === 0) {
            chkContainer.innerHTML = '<div style="color:var(--adm-text-muted); font-size:0.85rem; font-style:italic;">Belum adchecklist persiapan.</div>';
        } else {
            chkContainer.innerHTML = items.map((chk, idx) => `
                <label class="checklist-item ${chk.done ? 'done' : ''}">
                    <input type="checkbox" ${chk.done ? 'checked' : ''} onchange="toggleAdminChkItem(${ev.id}, ${idx}, this)">
                    <span>${escapeHtml(chk.text)}</span>
                </label>
            `).join('');
        }
        updateAdminChkProgress();
    }

    // 7. Tab 2 - Finance Cards & QRI
        const rawVal = Number(ev.rawPrice || ev.price || 0);
    const isLunas = (ev.paymentStatus && (ev.paymentStatus.includes('Lunas') || ev.paymentStatus.includes('100%')));
    const isDp = (ev.paymentStatus && ev.paymentStatus.includes('DP')) || ev.status === 'Terkunci';
    const dpVal = isLunas ? rawVal : (isDp ? Math.round(rawVal * 0.5) : 0);
    const sisaVal = rawVal - dpVal;

    const contractEl = document.getElementById('adminContractVal');
    if (contractEl) contractEl.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const dpEl = document.getElementById('adminDpVal');
    if (dpEl) dpEl.textContent = 'Rp ' + dpVal.toLocaleString('id-ID');

    const sisaEl = document.getElementById('adminSisaVal');
    if (sisaEl) sisaEl.textContent = 'Rp ' + sisaVal.toLocaleString('id-ID');

    const totalExp = (ev.expenses || []).reduce((acc, x) => acc + (Number(x.amount) || 0), 0);
    const netProfit = rawVal - totalExp;

    const profitEl = document.getElementById('adminProfitVal');
    if (profitEl) profitEl.textContent = 'Rp ' + netProfit.toLocaleString('id-ID');

    const financeBadge = document.getElementById('adminFinanceBadge');
    if (financeBadge) {
        if (isLunas) {
            financeBadge.className = 'badge badge-available';
            financeBadge.textContent = 'Lunas (Fully Paid)';
        } else if (isDp) {
            financeBadge.className = 'badge badge-tentative';
            financeBadge.textContent = 'DP 50% Diterima';
        } else {
            financeBadge.className = 'badge badge-locked';
            financeBadge.textContent = 'Belum Dibayar (Unpaid)';
        }
    }

    const financeSelect = document.getElementById('adminFinanceSelect');
    if (financeSelect) {
        financeSelect.value = isLunas ? 'Fully Paid' : (isDp ? 'DP Paid' : 'Unpaid');
    }

    const qrisImg = document.getElementById('adminQrisImg');
    if (qrisImg) {
        let qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=INV2026${String(ev.id).padStart(4, '0')}`;
        if (typeof loadPaymentSettings === 'function') {
            const ps = loadPaymentSettings();
            if (ps && ps.qrisUrl) qrisUrl = ps.qrisUrl;
        }
        qrisImg.src = qrisUrl;
    }

    const expContainer = document.getElementById('adminExpenseList');
    if (expContainer) {
        const expList = ev.expenses || [];
        if (expList.length === 0) {
            expContainer.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--text-muted); font-size:0.85rem; font-style:italic;">Belum adcatatan pengeluaran.</div>';
        } else {
            expContainer.innerHTML = expList.map(x => `
                <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-surface); padding:0.75rem 1rem; border-radius:var(--radius-sm); border:1px solid var(--border-subtle);">
                    <div>
                        <div style="font-size:0.9rem; font-weight:600;">${x.desc}</div>
                        <div style="font-size:0.75rem; color:var(--text-muted);">Kategori: ${x.cat}</div>
                    </div>
                    <div style="font-weight:700; color:var(--color-locked);">- Rp ${Number(x.amount).toLocaleString('id-ID')}</div>
                </div>
            `).join('');
        }

        const expTotalEl = document.getElementById('adminExpenseTotal');
        if (expTotalEl) {
            const sum = expList.reduce((a, b) => + Number(b.amount || 0), 0);
            expTotalEl.textContent = 'Rp ' + sum.toLocaleString('id-ID');
        }
    }

    // 8. Update Invoice Print Modal
    const invNum = document.getElementById('invModalNum');
    if (invNum) invNum.textContent = `INV-2026${String(ev.id).padStart(4, '0')}`;

    const invBadge = document.getElementById('invModalBadge');
    if (invBadge) {
        invBadge.textContent = (isLunas ? 'LUNAS (100% PAID)' : (isDp ? 'DP 50% PAID' : 'UNPAID'));
        invBadge.style.background = isLunas || isDp ? '#DCFCE7' : '#FEE2E2';
        invBadge.style.color = isLunas || isDp ? '#166534' : '#991B1B';
    }

    const invClientName = document.getElementById('invModalClientName');
    if (invClientName) invClientName.textContent = clientName;

    const invClientWa = document.getElementById('invModalClientWa');
    if (invClientWa) invClientWa.textContent = `No. WA: ${clientPhone}`;

    const invTitle = document.getElementById('invModalEventTitle');
    if (invTitle) invTitle.textContent = ev.title;

    const invDateVenue = document.getElementById('invModalEventDateVenue');
    if (invDateVenue) invDateVenue.textContent = `${ev.date}  ${ev.venue}`;

    const invPkg = document.getElementById('invModalPackageName');
    if (invPkg) invPkg.textContent = clientPkg;

    const invPrice = document.getElementById('invModalTotalPrice');
    if (invPrice) invPrice.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const invTotalSum = document.getElementById('invModalTotalSummary');
    if (invTotalSum) invTotalSum.textContent = 'Rp ' + rawVal.toLocaleString('id-ID');

    const invDpSum = document.getElementById('invModalDpSummary');
    if (invDpSum) invDpSum.textContent = `- Rp ${dpVal.toLocaleString('id-ID')}`;

    const invSisaSum = document.getElementById('invModalSisaSummary');
    if (invSisaSum) invSisaSum.textContent = `Rp ${sisaVal.toLocaleString('id-ID')}`;

    const invQris = document.getElementById('invModalQrisImg');
    if (invQris) {
        let qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=INV2026${String(ev.id).padStart(4, '0')}`;
        if (typeof loadPaymentSettings === 'function') {
            const ps = loadPaymentSettings();
            if (ps && ps.qrisUrl) qrisUrl = ps.qrisUrl;
        }
        invQris.src = qrisUrl;
    }

    // 9. Tab 3 - Stage & Rundown Management (Dynamic Per Customer Event)
    if (typeof renderAdminRundownList === 'function') {
        renderAdminRundownList(ev);
    }

    // 9b. Tab 6 - Music Playlist & Audio Cue Sheet Management
    if (typeof renderAdminMusicList === 'function') {
        renderAdminMusicList(ev);
    }
    if (typeof renderAdminSoundboardList === 'function') {
        renderAdminSoundboardList(ev);
    }

    // 9c. Tab 4 - Layar Kolaborasi Vendor (Live Rundown & Music Cue Sync)
    if (typeof renderAdminVendorCollab === 'function') {
        renderAdminVendorCollab(ev);
    }
    
    // Tab 1 - Wardrobe Tracker
    if (typeof renderWardrobe === 'function') {
        renderWardrobe();
    }

    // 10. Tab 5 - Post-Event Review & Loyalty Sync
    const postReviewArea = document.getElementById('postEventReviewTemplate');
    if (postReviewArea) {
        postReviewArea.value = `Halo Kak ${clientName}, salam hangat dari VanyArsyad & Tim MC-Connect.nnTerimkasih banyak atas kepercayaan luar biasyang telah diberikan kepadkami untuk memandu agendistimew"${ev.title}". Merupakan suatu kehormatan dan kebahagiaan tak terhinggdapat menjadi bagian dari momen indah Anda!nnJikKak ${clientName} berkenan, kami akan sangat berterimkasih atas ulasan bintang 5 dan testimoni singkat melalui tautan berikut:n⭐ https://vanyaarsyad.com/review?id=${ev.id}nnUlasan dan feedback Kak ${clientName} sangat berhargbagi peningkatan standar performpanggung kami di masdepan. Sukses dan bahagiselalu!nnSalam hormat,nVanyArsyad, S.I.Kom`;
    }
    const postReviewSub = document.getElementById('tabReviewSubtitle');
    if (postReviewSub) {
        postReviewSub.textContent = `Kirim pesan otomatis WhatsApp kepad${clientName} (${clientPhone}) untuk meminttestimoni & rating bintang 5 setelah acara selesai.`;
    }
}
window.loadActiveEventInCommandCenter = loadActiveEventInCommandCenter;

// 3. Section Title Mapping for Dynamic Topbar Breadcrumb
const sectionBreadcrumbMap = {
    'sec-dashboard': 'Dashboard Ringkasan & Performa MC',
    'sec-calendar': 'Kalender Jadwal Acara (Anti-Bentrok)',
    'sec-cashflow': 'Manajemen Arus Kas (Cash Flow)',
    'sec-landing-settings': 'Pengaturan Landing Page (CMS Publik)',
    'sec-command-center': 'Event Command Center (Terintegrasi)',
    'sec-wardrobe': 'Manajemen Wardrobe Tracker',
    'sec-stage-mode': 'Stage Mode (Teleprompter & Soundboard)',
    'sec-vendor-screen': 'Layar Vendor Musik (FOH Live Cue)',
    'sec-customers': 'Direktori Data Pelanggan & Klien (CRM)'
};

function updateAdminClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const clockEl = document.getElementById('topbarLiveClock');
    if (clockEl) {
        clockEl.textContent = `${h}:${m}:${s} WIB`;
    }
}

// 4. Initialization

// Navigation function - switches between admin sections
function navigateToSection(sectionId, menuElement) {
    // Remove active class from all sections
    document.querySelectorAll('.admin-section').forEach(sec => {
        sec.classList.remove('active');
    });
    
    // Add active class to target section
    const target = document.getElementById(sectionId);
    if (target) {
        target.classList.add('active');
    }
    
    // Update active menu in sidebar
    document.querySelectorAll('.sidebar-item-btn').forEach(item => {
        item.classList.remove('active');
    });
    if (menuElement) {
        menuElement.classList.add('active');
    }
    
    // Update breadcrumb
    const breadcrumb = document.getElementById('topbarBreadcrumb');
    if (breadcrumb && typeof sectionBreadcrumbMap !== 'undefined' && sectionBreadcrumbMap[sectionId]) {
        breadcrumb.textContent = sectionBreadcrumbMap[sectionId];
    }
    
    // Close sidebar on mobile
    if (window.innerWidth <= 1024) {
        closeSidebar();
    }
    
    // Scroll to top
    const mainContent = document.querySelector('.admin-main-content');
    if (mainContent) mainContent.scrollTop = 0;

    // Section-specific initialization
    if (sectionId === 'sec-customers' && typeof window.initCustomersPage === 'function') {
        window.initCustomersPage();
    }
    if (sectionId === 'sec-customers' && typeof window.loadCustomersData === 'function') {
        window.loadCustomersData();
    }
    if (sectionId === 'sec-command-center' && typeof window.loadActiveEventInCommandCenter === 'function') {
        window.loadActiveEventInCommandCenter();
    }
    if (sectionId === 'sec-dashboard' && typeof renderDashEvents === 'function') {
        renderDashEvents();
    }
    if (sectionId === 'sec-wardrobe' && typeof renderWardrobe === 'function') {
        renderWardrobe();
    }
    if (sectionId === 'sec-cashflow' && typeof renderCashflowTable === 'function') {
        renderCashflowTable();
    }
}
window.navigateToSection = navigateToSection;


// Sidebar Toggle Functions
function openSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.add('sidebar-mobile-open');
    if (backdrop) backdrop.classList.add('active');
    if (sidebar) sidebar.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeSidebar() {
    const shell = document.querySelector('.admin-shell');
    const backdrop = document.getElementById('sidebarBackdrop');
    const sidebar = document.querySelector('.admin-sidebar');
    if (shell) shell.classList.remove('sidebar-mobile-open');
    if (backdrop) backdrop.classList.remove('active');
    if (sidebar) sidebar.classList.remove('open');
    document.body.style.overflow = '';
}

function toggleSidebar() {
    const sidebar = document.querySelector('.admin-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
        closeSidebar();
    } else {
        if (window.innerWidth <= 1024) {
            openSidebar();
        } else {
            // Desktop: toggle collapsed state
            const shell = document.querySelector('.admin-shell');
            if (shell) shell.classList.toggle('sidebar-collapsed');
        }
    }
}
window.toggleSidebar = toggleSidebar;
window.openSidebar = openSidebar;
window.closeSidebar = closeSidebar;


// ============================================================
// CMS Landing Page Configuration Loader
// ============================================================
function initAdminCms() {
    try {
        fetch('/api/cms/biodata?t=' + Date.now())
            .then(res => res.json())
            .then(data => {
                const bio = data.data || {};
                
                window.cmsConfig = window.cmsConfig || {};
                window.cmsConfig.bio = bio;
                
                const mapVal = (id, val) => {
                    const el = document.getElementById(id);
                    if (el && val !== undefined && val !== null) el.value = val;
                };
                
                mapVal('cmsNamaPanggung', bio.name);
                mapVal('cmsEmail', bio.email);
                mapVal('cmsBioText', bio.bio);
                mapVal('cmsStatEvents', bio.statEvents);
                mapVal('cmsStatYears', bio.statYears);
                mapVal('cmsSpesialisasi', bio.spec);
                mapVal('cmsFotoUrl', bio.photo);
                mapVal('cmsIg', bio.ig);
                mapVal('cmsTiktok', bio.tiktok);
                mapVal('cmsFb', bio.fb);
                
                if (bio.photo) {
                    const preview = document.getElementById('cmsFotoPreview');
                    if (preview) preview.src = bio.photo;
                    
                    const sidebarImg = document.getElementById('sidebarAvatarImg');
                    if (sidebarImg) {
                        sidebarImg.src = bio.photo;
                        sidebarImg.style.opacity = '1';
                    }
                }
                
                if (bio.name) {
                    const sidebarName = document.getElementById('sidebarMcName');
                    if (sidebarName) sidebarName.textContent = bio.name;
                    
                    const dashName = document.getElementById('dashWelcomeName');
                    if (dashName) dashName.textContent = bio.name;
                }
            })
            .catch(err => console.warn('Failed to fetch CMS biodata from API:', err));
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}
window.initAdminCms = initAdminCms;

// ============================================================
// Cash Flow Transactions Loader
// ============================================================


// ============================================================
// Payment Settings Loader
// ============================================================
function loadPaymentSettings() {
    try {
        let saved = null;
        if (typeof AdminDB !== 'undefined') {
            saved = AdminDB.getItem('mc_payment_settings');
        }
        if (!saved) saved = localStorage.getItem('mc_payment_settings');
        
        if (saved) {
            return typeof saved === 'string' ? JSON.parse(saved) : saved;
        }
    } catch(e) {}
    
    return {
        bankName: 'BCA',
        bankAccount: '',
        bankHolder: '',
        dpPercent: 50,
        qrisUrl: ''
    };
}
window.loadPaymentSettings = loadPaymentSettings;

// ============================================================
// Admin Checklist Progress Updater
// ============================================================
function updateAdminChkProgress() {
    const progressBar = document.getElementById('eccChecklistProgress');
    const progressText = document.getElementById('eccChecklistProgressText');
    if (!progressBar) return;
    
    try {
        const checkboxes = document.querySelectorAll('#eccChecklistBody input[type="checkbox"]');
        if (checkboxes.length === 0) return;
        
        const checked = document.querySelectorAll('#eccChecklistBody input[type="checkbox"]:checked').length;
        const total = checkboxes.length;
        const pct = Math.round((checked / total) * 100);
        
        progressBar.style.width = pct + '%';
        progressBar.setAttribute('aria-valuenow', pct);
        if (progressText) {
            progressText.textContent = checked + '/' + total + ' (' + pct + '%)';
        }
    } catch(e) {}
}
window.updateAdminChkProgress = updateAdminChkProgress;

// ============================================================
// Dashboard Events Renderer
// ============================================================
function renderDashEvents() {
    try {
        const container = document.getElementById('dashUpcomingEvents');
        if (!container) return;
        
        const events = window.adminEventsDb || [];
        if (events.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--adm-text-muted); padding:1rem;">Belum ada acara terjadwal.</div>';
            return;
        }
        
        const today = new Date().toISOString().split('T')[0];
        const upcoming = events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
        
        if (upcoming.length === 0) {
            container.innerHTML = '<div style="text-align:center; color:var(--adm-text-muted); padding:1rem;">Tidak ada acara mendatang.</div>';
            return;
        }
        
        container.innerHTML = upcoming.map(ev => {
            const statusColor = ev.status === 'Terkunci' ? '#10B981' : ev.status === 'Tentative' ? '#F59E0B' : '#8B5CF6';
            return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<div><strong>' + escapeHtml(ev.title || 'Acara') + '</strong><br><small style="color:var(--adm-text-muted);">' + ev.date + '</small></div>' +
                '<span style="color:' + statusColor + '; font-weight:600; font-size:0.8rem;">' + (ev.status || 'Review') + '</span>' +
            '</div>';
        }).join('');
    } catch(e) {
        console.warn('renderDashEvents:', e.message);
    }
}
window.renderDashEvents = renderDashEvents;

// ============================================================
// Agenda Inspector (Calendar Date Click Handler)
// ============================================================
function showAgendaInspector(dateStr, status, eventObj, eventsOnDate) {
    try {
        const inspector = document.getElementById('agendaInspector');
        const title = document.getElementById('agendaInspectorTitle');
        const body = document.getElementById('agendaInspectorBody');
        
        if (title) {
            title.textContent = 'Agenda: ' + dateStr;
        }
        
        if (body) {
            if (!eventsOnDate || eventsOnDate.length === 0) {
                body.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--adm-text-muted);">Tanggal ini tersedia. Klik tombol + untuk membuat booking baru.</div>';
            } else {
                body.innerHTML = eventsOnDate.map(ev => {
                    return '<div style="padding:0.75rem; margin-bottom:0.5rem; background:rgba(255,255,255,0.03); border-radius:8px; border-left:3px solid ' + (ev.status === 'Terkunci' ? '#10B981' : '#F59E0B') + ';">' +
                        '<strong>' + escapeHtml(ev.title || 'Acara') + '</strong>' +
                        '<div style="font-size:0.8rem; color:var(--adm-text-muted); margin-top:0.25rem;">' + (ev.time || '19:00 - 22:00 WIB') + ' | ' + (ev.venue || 'Venue TBD') + '</div>' +
                        '<div style="margin-top:0.25rem;"><span style="color:' + (ev.status === 'Terkunci' ? '#10B981' : '#F59E0B') + '; font-weight:600; font-size:0.8rem;">' + (ev.status || 'Review') + '</span></div>' +
                    '</div>';
                }).join('');
            }
        }
        
        if (inspector) {
            inspector.style.display = '';
            inspector.classList.add('active');
        }
    } catch(e) {
        console.warn('showAgendaInspector:', e.message);
    }
}
window.showAgendaInspector = showAgendaInspector;

// ============================================================
// Admin Render Stubs for Command Center Tabs
// ============================================================
function renderAdminAgendaList() {
    try {
        const container = document.getElementById('eccAgendaBody');
        if (!container) return;
        const ev = window.activeCommandCenterEvent;
        if (!ev) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Pilih acara terlebih dahulu.</div>';
            return;
        }
        const agenda = ev.agenda || ev.rundown || [];
        if (agenda.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada agenda untuk acara ini.</div>';
            return;
        }
        container.innerHTML = agenda.map((item, i) => {
            return '<div style="display:flex; gap:0.75rem; padding:0.6rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<span style="color:var(--adm-gold); font-weight:700; min-width:30px;">' + (i+1) + '</span>' +
                '<div><strong>' + escapeHtml(item.title || item.text || 'Item ' + (i+1)) + '</strong>' +
                (item.time ? '<div style="font-size:0.8rem; color:var(--adm-text-muted);">' + item.time + '</div>' : '') +
                '</div></div>';
        }).join('');
    } catch(e) {}
}
window.renderAdminAgendaList = renderAdminAgendaList;

function renderAdminRundownList(ev) {
    renderAdminAgendaList(); // Reuse agenda list for rundown
}
window.renderAdminRundownList = renderAdminRundownList;

function renderAdminMusicList(ev) {
    try {
        const container = document.getElementById('eccMusicBody');
        if (!container) return;
        if (!ev || !ev.musicList || ev.musicList.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada daftar musik.</div>';
            return;
        }
        container.innerHTML = ev.musicList.map((song, i) => {
            return '<div style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<span style="color:var(--adm-gold);">' + (i+1) + '.</span> ' + escapeHtml(song.title || song) +
            '</div>';
        }).join('');
    } catch(e) {}
}
window.renderAdminMusicList = renderAdminMusicList;

function renderAdminSoundboardList(ev) {
    try {
        const container = document.getElementById('eccSoundboardBody');
        if (!container) return;
        container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Soundboard tersedia di Stage Mode.</div>';
    } catch(e) {}
}
window.renderAdminSoundboardList = renderAdminSoundboardList;

function renderAdminVendorCollab(ev) {
    try {
        const container = document.getElementById('eccVendorBody');
        if (!container) return;
        if (!ev || !ev.vendors || ev.vendors.length === 0) {
            container.innerHTML = '<div style="text-align:center; padding:1rem; color:var(--adm-text-muted);">Belum ada vendor terdaftar.</div>';
            return;
        }
        container.innerHTML = ev.vendors.map(v => {
            return '<div style="padding:0.5rem 0; border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<strong>' + escapeHtml(v.name || 'Vendor') + '</strong>' +
                '<div style="font-size:0.8rem; color:var(--adm-text-muted);">' + escapeHtml(v.role || v.type || '') + '</div>' +
            '</div>';
        }).join('');
    } catch(e) {}
}
window.renderAdminVendorCollab = renderAdminVendorCollab;

// ============================================================
// Wardrobe Renderer
// ============================================================

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


// ============================================================
// Calendar Metrics Updater
// ============================================================
function updateCalMetrics() {
    try {
        const events = window.adminEventsDb || [];
        const terkunci = events.filter(e => e.status && e.status.toLowerCase() === 'terkunci').length;
        const tentative = events.filter(e => e.status && e.status.toLowerCase() === 'tentative').length;
        const review = events.filter(e => e.status && e.status.toLowerCase() === 'review').length;
        
        const el1 = document.getElementById('calMetricTerkunci');
        const el2 = document.getElementById('calMetricTentative');
        const el3 = document.getElementById('calMetricReview');
        const el4 = document.getElementById('calMetricTotal');
        
        if (el1) el1.textContent = terkunci;
        if (el2) el2.textContent = tentative;
        if (el3) el3.textContent = review;
        if (el4) el4.textContent = events.length;
    } catch(e) {}
}
window.updateCalMetrics = updateCalMetrics;

// ============================================================
// Focus Calendar on Specific Date
// ============================================================
function focusCalendarDate(dateStr) {
    try {
        if (window.adminCalendar && typeof window.adminCalendar.goToDate === 'function') {
            window.adminCalendar.goToDate(dateStr);
        }
        const cell = document.querySelector('[data-date="' + dateStr + '"]');
        if (cell) {
            cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
            cell.style.outline = '2px solid var(--adm-gold)';
            setTimeout(() => { cell.style.outline = ''; }, 3000);
        }
    } catch(e) {}
}
window.focusCalendarDate = focusCalendarDate;




// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    // Muat CMS Landing Page Configuration
    initAdminCms();
    
    // Muat Cash Flow Database
    loadCashflowTransactions();

    // Start Clock
    updateAdminClock();
    setInterval(updateAdminClock, 1000);

    // Format current date in banner
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const todayFormatted = new Date().toLocaleDateString('id-ID', dateOptions);
    const dateBanner = document.getElementById('dashCurrentDate');
    if (dateBanner) dateBanner.textContent = todayFormatted;

    // Load username if available
    try {
        const storedUser = sessionStorage.getItem('mc_auth_user');
        if (storedUser) {
            const userObj = JSON.parse(storedUser);
            if (userObj.name) {
                const welcomeName = document.getElementById('dashWelcomeName');
                if (welcomeName) welcomeName.textContent = userObj.name.split(',')[0];
            }
        }
    } catch(e) {}

    // Initialize unified database & de-duplicate
    try {
        loadUnifiedEventsDatabase();
        populateCommandCenterSelector();

        if (typeof AvailabilityCalendar !== 'undefined' && document.getElementById('adminCalendarWidget')) {
            window.adminCalendar = new AvailabilityCalendar('adminCalendarWidget', adminEventsDb, (dateStr, status, eventObj, eventsOnDate) => {
                showAgendaInspector(dateStr, status, eventObj, eventsOnDate);
            });
            window.calendarApp = window.adminCalendar;
        }
    } catch(e) { console.error("Calendar Init Error:", e); }

    // Navigate to default section
    if (typeof navigateToSection === 'function') {
        navigateToSection('sec-dashboard', document.getElementById('menu-dashboard'));
    }
});

// Auto-close mobile sidebar on window resize to desktop
window.addEventListener('resize', () => {
    if (window.innerWidth > 1024) {
        const shell = document.querySelector('.admin-shell');
        const backdrop = document.getElementById('sidebarBackdrop');
        const sidebar = document.querySelector('.admin-sidebar');
        if (shell) shell.classList.remove('sidebar-mobile-open');
        if (backdrop) backdrop.classList.remove('active');
        if (sidebar) sidebar.classList.remove('open');
        document.body.style.overflow = '';
    }
});


function autoSyncCustomersToEvents(customers) {
    if (!customers || !Array.isArray(customers)) return;
    
    let isModified = false;
    customers.forEach(cust => {
        if (!cust.date || !cust.event) return;
        
        const key = `${cust.date}::${(cust.event || '').trim().toLowerCase()}`;
        let existingIndex = adminEventsDb.findIndex(e => String(e.id) === String(cust.id) || String(e.customerId) === String(cust.id) || `${e.date}::${(e.title || '').trim().toLowerCase()}` === key);

        let status = 'Review';
        if (cust.paymentStatus && (cust.paymentStatus.includes('Lunas') || cust.paymentStatus.includes('100%') || cust.paymentStatus.includes('DP'))) {
            status = 'Terkunci';
        } else if (cust.paymentStatus && (cust.paymentStatus.includes('Hold') || cust.paymentStatus.includes('Tentative'))) {
            status = 'Tentative';
        }

        const timeFormatted = cust.time || (cust.startTime && cust.endTime ? `${cust.startTime} - ${cust.endTime} WIB (${cust.duration || ''})` : '18:00 - 22:00 WIB (4 Jam)');
        
        if (existingIndex >= 0) {
            // Update existing
            const ev = adminEventsDb[existingIndex];
            if (ev.title !== cust.event || ev.date !== cust.date || ev.time !== timeFormatted || ev.status !== status || ev.rawPrice !== Number(cust.price || 0)) {
                ev.title = cust.event;
                ev.date = cust.date;
                ev.time = timeFormatted;
                ev.status = status;
                ev.paymentStatus = cust.paymentStatus;
                ev.rawPrice = Number(cust.price || 0);
                ev.price = 'Rp ' + ev.rawPrice.toLocaleString('id-ID');
                ev.category = cust.category || ev.category;
                isModified = true;
            }
        } else {
            // Create new
            const eventData = {
                id: cust.id || Date.now(),
                customerId: cust.id,
                title: cust.event,
                date: cust.date,
                time: timeFormatted,
                startTime: cust.startTime || '18:00',
                endTime: cust.endTime || '22:00',
                duration: cust.duration || '4 Jam',
                venue: cust.formattedDate && cust.formattedDate.includes('') ? cust.formattedDate.split('')[1].trim() : 'Grand Ballroom Venue',
                pic: cust.name + (cust.wa ? ` (${cust.wa})` : ''),
                price: 'Rp ' + Number(cust.price || 0).toLocaleString('id-ID'),
                rawPrice: Number(cust.price || 0),
                status: status,
                paymentStatus: cust.paymentStatus,
                note: `${cust.paymentStatus} - Terintegrasi dari CRM Pelanggan`,
                category: cust.category || 'Event',
                vipNotes: cust.notes || 'Preferensi panggung klien disinkronkan dari CRM.',
                vipProtocol: [
                    { role: 'Klien PIC', name: cust.name },
                    { role: 'Koordinator FOH', name: 'Tim Stage Runner MC' }
                ],
                checklist: [
                    { text: 'Konfirmasi pelafalan nama klien & gelar', done: true },
                    { text: 'Cek gladi mic wireless Shure di venue', done: true },
                    { text: 'Briefing sinyal cue musik panggung', done: false }
                ],
                expenses: []
            };
            adminEventsDb.push(eventData);
            isModified = true;
        }
    });

    if (isModified) {
        adminEventsDb.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Save back to DB
        // Push directly to API so it's consistent
        pushEventsToServer(adminEventsDb);
        
        if (window.adminCalendar) {
            window.adminCalendar.setEvents(adminEventsDb);
        }
        if (typeof renderAdminAgendaList === 'function') renderAdminAgendaList();
        if (typeof updateCalMetrics === 'function') updateCalMetrics();
        if (typeof populateCommandCenterSelector === 'function') populateCommandCenterSelector();
    }
}
window.autoSyncCustomersToEvents = autoSyncCustomersToEvents;





function switchCmsSubTab(targetId, btn) {
    const section = btn.closest('.admin-section');
    if (!section) return;

    // Reset tabs
    const navGroup = btn.closest('.cms-nav-tabs, .ecc-tabs');
    if (navGroup) {
        navGroup.querySelectorAll('.cms-tab-btn, .ecc-tab-btn, button').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    // Hide all subpanels in this section only
    section.querySelectorAll('.cms-subpanel, .ecc-pane').forEach(p => p.classList.remove('active'));

    // Show target
    const target = document.getElementById(targetId);
    if (target) {
        target.classList.add('active');
    }
}
window.switchCmsSubTab = switchCmsSubTab;


window.handleSaveCmsBio = function(e) {
    if (e) e.preventDefault();
    const bio = {
        name: document.getElementById('cmsNamaPanggung')?.value || '',
        email: document.getElementById('cmsEmail')?.value || '',
        bio: document.getElementById('cmsBioText')?.value || '',
        statEvents: document.getElementById('cmsStatEvents')?.value || '',
        statYears: document.getElementById('cmsStatYears')?.value || '',
        spec: document.getElementById('cmsSpesialisasi')?.value || '',
        photo: document.getElementById('cmsFotoUrl')?.value || '',
        ig: document.getElementById('cmsIg')?.value || '',
        tiktok: document.getElementById('cmsTiktok')?.value || '',
        fb: document.getElementById('cmsFb')?.value || ''
    };
    
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    })
    .then(res => res.json())
    .then(data => {
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Biodata & Showreel berhasil disimpan dan di-sync ke Web Publik!', 'success');
        } else {
            alert('Biodata & Showreel berhasil disimpan!');
        }
        initAdminCms(); // reload UI
    })
    .catch(err => {
        console.error('Save failed', err);
        if (typeof window.uiAlert === 'function') {
            window.uiAlert('Gagal menyimpan biodata ke server.', 'error');
        } else {
            alert('Gagal menyimpan biodata.');
        }
    });
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || ''
    };
    if (typeof AdminDB !== 'undefined') {
        AdminDB.setItem('mc_policies_config', JSON.stringify(pol));
    }
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
    }
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    // Usually empty or handles some toggles
    if (typeof window.uiAlert === 'function') {
        window.uiAlert('Pengaturan Kalender berhasil disimpan!', 'success');
    }
};

window.initAdminCms = function() {
    try {
        const ts = Date.now();
        Promise.all([
            fetch('/api/cms/biodata?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/packages?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/policies?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/gallery?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/presskit?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/riders?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/testimonials?t=' + ts).then(r => r.json()).catch(()=>({}))
        ]).then(results => {
            const bioData = results[0]?.data || {};
            const pkgsData = results[1]?.data || [];
            const polData = results[2]?.data || {};
            const galData = results[3]?.data || [];
            const pkData = results[4]?.data || {};
            const ridersData = results[5]?.data || [];
            const testData = results[6]?.data || [];
            
            window.cmsConfig = window.cmsConfig || {};
            window.cmsConfig.bio = bioData;
            window.cmsConfig.pkgs = pkgsData;
            window.cmsConfig.policies = polData;
            window.cmsConfig.gallery = galData;
            window.cmsConfig.presskit = pkData;
            window.cmsConfig.riders = ridersData;
            window.cmsConfig.testimonials = testData;
            
            const mapVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };
            
            // Biodata
            mapVal('cmsNamaPanggung', bioData.name);
            mapVal('cmsEmail', bioData.email);
            mapVal('cmsBioText', bioData.bio);
            mapVal('cmsStatEvents', bioData.statEvents);
            mapVal('cmsStatYears', bioData.statYears);
            mapVal('cmsSpesialisasi', bioData.spec);
            mapVal('cmsFotoUrl', bioData.photo);
            mapVal('cmsIg', bioData.ig);
            mapVal('cmsTiktok', bioData.tiktok);
            mapVal('cmsFb', bioData.fb);
            
            if (bioData.photo) {
                const preview = document.getElementById('cmsFotoPreview');
                if (preview) preview.src = bioData.photo;
                const sidebarImg = document.getElementById('sidebarAvatarImg');
                if (sidebarImg) { sidebarImg.src = bioData.photo; sidebarImg.style.opacity = '1'; }
            }
            if (bioData.name) {
                const sidebarName = document.getElementById('sidebarMcName');
                if (sidebarName) sidebarName.textContent = bioData.name;
                const dashName = document.getElementById('dashWelcomeName');
                if (dashName) dashName.textContent = bioData.name;
            }
            
            if (bioData.calendarConfig) {
                mapVal('cfgCalBuffer', bioData.calendarConfig.buffer);
                mapVal('cfgCalMode', bioData.calendarConfig.mode);
                mapVal('cfgCalNotice', bioData.calendarConfig.notice);
                window._mcCalendarConfig = bioData.calendarConfig;
            }

            // Packages (Layanan)
            renderAdminPackages(pkgsData);

            // Policies (Terms, Refund, Riders, FAQ)
            mapVal('cmsTermsText', polData.terms);
            mapVal('cmsRefundText', polData.refund);
            mapVal('cmsRidersText', polData.riders);
            renderAdminFaqs(polData.faqs || []);
            renderAdminTestimonials(testData);

            // Press Kit
            mapVal('pk_stageName', pkData.stageName);
            mapVal('pk_spesialisasi', pkData.spesialisasi);
            mapVal('pk_tagline', pkData.tagline);
            mapVal('pk_bio', pkData.bio);
            mapVal('pk_pic', pkData.pic);
            mapVal('pk_wa', pkData.wa);
            mapVal('pk_email', pkData.email);
            mapVal('pk_sosmed', pkData.sosmed);
            mapVal('pk_domisili', pkData.domisili);
            mapVal('pk_scope1', pkData.scope1);
            mapVal('pk_scope2', pkData.scope2);
            mapVal('pk_scope3', pkData.scope3);
            mapVal('pk_scope4', pkData.scope4);
            mapVal('pk_footerNote', pkData.footerNote);
            mapVal('riders_footerNote', pkData.ridersFooter);

            // Gallery
            renderAdminGallery(galData);
            
            // Riders (Table)
            renderAdminRiders(ridersData);
        });
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}

// Packages Implementation
window.renderAdminPackages = function(pkgs) {
    const list = document.getElementById('cmsPackagesList');
    if (!list) return;
    window.cmsConfig.pkgs = pkgs;
    if (pkgs.length === 0) {
        list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Belum ada paket.</div>';
        return;
    }
    let html = '';
    pkgs.forEach((p, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; border:1px solid var(--border-subtle);">
            <div>
                <div style="font-weight:700; color:var(--gold-primary); font-size:1.1rem;">${p.name || 'Paket '+(i+1)}</div>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">Kategori: ${p.category || 'Standard'} | Durasi: ${p.duration || '-'} | Harga: Rp ${parseInt(p.price||0).toLocaleString('id-ID')}</div>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-main);">
                    ${(p.features||[]).map(f => '<li>'+f+'</li>').join('')}
                </ul>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPackage(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deletePackage(${i})">Hapus</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
};
window.openAddPackageModal = function() {
    window.editingPackageIndex = -1;
    let n = prompt("Nama Paket Baru:");
    if(!n) return;
    let p = prompt("Harga (Angka saja):", "0");
    let c = prompt("Kategori:", "Standard");
    let d = prompt("Durasi (misal: 4 Jam):", "4 Jam");
    let f = prompt("Fitur (Pisahkan dengan koma):", "Fitur 1, Fitur 2");
    
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.push({
        name: n,
        price: p,
        category: c,
        duration: d,
        features: f.split(',').map(x=>x.trim())
    });
    window.cmsConfig.pkgs = pkgs;
    renderAdminPackages(pkgs);
    handleSavePackage(); // auto save
};
window.editPackage = function(i) {
    let pkgs = window.cmsConfig.pkgs || [];
    let p = pkgs[i];
    if(!p) return;
    let n = prompt("Nama Paket:", p.name); if(n===null) return;
    let pr = prompt("Harga:", p.price);
    let f = prompt("Fitur (Pisahkan dengan koma):", (p.features||[]).join(', '));
    p.name = n; p.price = pr; p.features = f.split(',').map(x=>x.trim());
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.deletePackage = function(i) {
    if(!confirm('Hapus paket ini?')) return;
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.splice(i, 1);
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.handleSavePackage = function(e) {
    if (e) e.preventDefault();
    fetch('/api/cms/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: window.cmsConfig.pkgs || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Paket disimpan!', 'success');
    });
};

// FAQ
window.renderAdminFaqs = function(faqs) {
    window.cmsConfig.policies = window.cmsConfig.policies || {};
    window.cmsConfig.policies.faqs = faqs;
    const list = document.getElementById('faqItemsList');
    if (!list) return;
    let html = '';
    faqs.forEach((f, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">Q: ${f.q}</strong>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">A: ${f.a}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteFaq(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddFaq = function() {
    let q = prompt("Pertanyaan (Q):"); if(!q) return;
    let a = prompt("Jawaban (A):"); if(!a) return;
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.push({q, a});
    renderAdminFaqs(faqs);
};
window.deleteFaq = function(i) {
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.splice(i, 1);
    renderAdminFaqs(faqs);
};

// Testimonials
window.renderAdminTestimonials = function(tests) {
    window.cmsConfig.testimonials = tests;
    const list = document.getElementById('testimonialItemsList');
    if (!list) return;
    let html = '';
    tests.forEach((t, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">${t.author}</strong> - ${t.role}
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">"${t.text}"</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteTestimonial(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddTestimonial = function() {
    let author = prompt("Nama Klien:"); if(!author) return;
    let role = prompt("Peran (misal: Bride, Corporate EO):", "Client");
    let text = prompt("Testimoni:"); if(!text) return;
    let tests = window.cmsConfig.testimonials || [];
    tests.push({author, role, text, rating:5});
    renderAdminTestimonials(tests);
};
window.deleteTestimonial = function(i) {
    let tests = window.cmsConfig.testimonials || [];
    tests.splice(i, 1);
    renderAdminTestimonials(tests);
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || '',
        faqs: window.cmsConfig.policies?.faqs || []
    };
    fetch('/api/cms/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pol)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
        
        // Also save testimonials
        fetch('/api/cms/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testimonials: window.cmsConfig.testimonials || [] })
        });
    });
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    const bio = window.cmsConfig.bio || {};
    bio.calendarConfig = {
        buffer: document.getElementById('cfgCalBuffer')?.value || '7',
        mode: document.getElementById('cfgCalMode')?.value || 'request_to_book',
        notice: document.getElementById('cfgCalNotice')?.value || ''
    };
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    }).then(r=>r.json()).then(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pengaturan Kalender disimpan!', 'success');
    });
};

// Press Kit
window.savePressKitData = function() {
    const pk = {
        stageName: document.getElementById('pk_stageName')?.value || '',
        spesialisasi: document.getElementById('pk_spesialisasi')?.value || '',
        tagline: document.getElementById('pk_tagline')?.value || '',
        bio: document.getElementById('pk_bio')?.value || '',
        pic: document.getElementById('pk_pic')?.value || '',
        wa: document.getElementById('pk_wa')?.value || '',
        email: document.getElementById('pk_email')?.value || '',
        sosmed: document.getElementById('pk_sosmed')?.value || '',
        domisili: document.getElementById('pk_domisili')?.value || '',
        scope1: document.getElementById('pk_scope1')?.value || '',
        scope2: document.getElementById('pk_scope2')?.value || '',
        scope3: document.getElementById('pk_scope3')?.value || '',
        scope4: document.getElementById('pk_scope4')?.value || '',
        footerNote: document.getElementById('pk_footerNote')?.value || '',
        ridersFooter: document.getElementById('riders_footerNote')?.value || ''
    };
    fetch('/api/cms/presskit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pk)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Press Kit disimpan!', 'success');
    });
};
window.saveRidersFooterNote = function() {
    savePressKitData();
};

// Gallery
window.renderAdminGallery = function(gal) {
    window.cmsConfig.gallery = gal;
    const list = document.getElementById('adminGalleryList'); // Wait, does this exist? I need to check admin.html ID for gallery
    if (!list) return;
    let html = '';
    gal.forEach((g, i) => {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem; background:var(--bg-surface); padding:1rem; border:1px solid var(--border-subtle); border-radius:8px;">
            <img src="${g.url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <input type="text" class="form-input" value="${g.caption || ''}" onchange="updateGalleryCaption(${i}, this.value)">
            <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteGalleryItem(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.updateGalleryCaption = function(i, cap) {
    window.cmsConfig.gallery[i].caption = cap;
};
window.deleteGalleryItem = function(i) {
    window.cmsConfig.gallery.splice(i, 1);
    renderAdminGallery(window.cmsConfig.gallery);
};
window.handleSaveCmsGallery = function() {
    fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: window.cmsConfig.gallery || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Galeri disimpan!', 'success');
    });
};
window.addGalleryItem = function() {
    let url = prompt("URL Gambar Baru:");
    if(!url) return;
    let cap = prompt("Caption Gambar:");
    window.cmsConfig.gallery.push({url: url, caption: cap});
    renderAdminGallery(window.cmsConfig.gallery);
};

// Riders
window.renderAdminRiders = function(riders) {
    window.cmsConfig.riders = riders;
    const body = document.getElementById('ridersTableBody');
    if (!body) return;
    let html = '';
    riders.forEach((r, i) => {
        html += `<tr>
            <td><strong>${r.title}</strong></td>
            <td>${r.notes}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editRider(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteRider(${i})">Hapus</button>
            </td>
        </tr>`;
    });
    body.innerHTML = html;
};
window.openRiderModal = function() {
    let t = prompt("Judul Rider (misal: Hospitality):"); if(!t) return;
    let n = prompt("Catatan (misal: 1x Ruang Tunggu):"); if(!n) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, notes: n })
    }).then(r=>r.json()).then(res => {
        initAdminCms(); // reload everything
    });
};
window.editRider = function(i) {
    let r = window.cmsConfig.riders[i];
    let t = prompt("Judul Rider:", r.title); if(t===null) return;
    let n = prompt("Catatan:", r.notes); if(n===null) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_id: r.db_id, title: t, notes: n })
    }).then(res=>res.json()).then(() => initAdminCms());
};
window.deleteRider = function(i) {
    let r = window.cmsConfig.riders[i];
    if(!confirm('Hapus rider ini?')) return;
    fetch('/api/cms/riders/' + r.db_id, { method: 'DELETE' })
        .then(res=>res.json()).then(() => initAdminCms());
};

window.getAdminGalleryData = function() { return window.cmsConfig.gallery || []; };
window.saveAdminGalleryData = function(data) { window.cmsConfig.gallery = data; window.handleSaveCmsGallery(); };
// ==========================================
// DATA CASH FLOW (BACKEND API INTEGRATION)
// ==========================================
window.loadCashflowTransactions = function() {
    fetch('/api/cms/cashflow-transactions')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                window.cashflowTransactions = data.data || [];
                renderCashflowTable();
            }
        })
        .catch(err => {
            console.error('Failed to load cashflow', err);
            window.cashflowTransactions = [];
            renderCashflowTable();
        });
};

window.renderCashflowTable = function() {
    try {
        const tbody = document.getElementById('cashFlowTableBody') || document.getElementById('cashflowTableBody');
        
        let transactions = [...(window.cashflowTransactions || [])];
        
        // Auto-sync INFLOW from Calendar Events
        if (typeof adminEventsDb !== 'undefined' && Array.isArray(adminEventsDb)) {
            adminEventsDb.forEach(ev => {
                const isPaid = ev.status === 'Terkunci' || (ev.paymentStatus && (ev.paymentStatus.includes('Lunas') || ev.paymentStatus.includes('DP') || ev.paymentStatus.includes('100%')));
                if (isPaid && ev.rawPrice > 0) {
                    transactions.push({
                        id: 'ev_' + ev.id,
                        date: ev.date,
                        desc: 'Booking: ' + ev.title,
                        category: 'Kontrak Acara',
                        type: 'in',
                        amount: ev.rawPrice,
                        status: ev.paymentStatus || 'Lunas'
                    });
                }
                if (ev.expenses && Array.isArray(ev.expenses)) {
                    ev.expenses.forEach((exp, i) => {
                        transactions.push({
                            id: 'exp_' + ev.id + '_' + i,
                            date: ev.date,
                            desc: 'Biaya: ' + exp.desc + ' (' + ev.title + ')',
                            category: 'Operasional',
                            type: 'out',
                            amount: exp.amount,
                            status: 'Paid'
                        });
                    });
                }
            });
        }
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let totalInflow = 0;
        let totalOutflow = 0;
        
        transactions.forEach(t => {
            const amount = Number(t.amount || 0);
            if (t.type === 'in' || t.type === 'inflow') totalInflow += amount;
            else if (t.type === 'out' || t.type === 'outflow') totalOutflow += amount;
        });
        
        const inEl = document.getElementById('cfTotalIn') || document.getElementById('cfTotalInflow');
        const outEl = document.getElementById('cfTotalOut') || document.getElementById('cfTotalOutflow');
        const netEl = document.getElementById('cfNetCash');
        const marginEl = document.getElementById('cfNetMargin') || document.getElementById('cfMargin');
        
        if (inEl) inEl.textContent = 'Rp ' + totalInflow.toLocaleString('id-ID');
        if (outEl) outEl.textContent = 'Rp ' + totalOutflow.toLocaleString('id-ID');
        
        const netCash = totalInflow - totalOutflow;
        if (netEl) netEl.textContent = 'Rp ' + netCash.toLocaleString('id-ID');
        
        if (marginEl) {
            const margin = totalInflow > 0 ? ((netCash / totalInflow) * 100).toFixed(1) : 0;
            marginEl.textContent = margin + '%';
        }
        
        if (tbody) {
            if (transactions.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem; color:var(--adm-text-muted);">Belum ada data transaksi kas.</td></tr>';
            } else {
                tbody.innerHTML = transactions.map(t => {
                    const isIn = (t.type === 'in' || t.type === 'inflow');
                    const color = isIn ? '#10B981' : '#EF4444';
                    const sign = isIn ? '+' : '-';
                    const isAuto = String(t.id).startsWith('ev_') || String(t.id).startsWith('exp_');
                    const btn = isAuto ? 
                        '<span class="badge" style="background:#334155; color:#94A3B8; font-size:0.7rem;">Auto-Sync</span>' : 
                        '<button class="btn btn-secondary btn-sm" onclick="deleteCashflowTransaction(\'' + t.id + '\')">Hapus</button>';
                    
                    return '<tr>' +
                        '<td>' + t.date + '</td>' +
                        '<td><strong>' + (t.desc || '') + '</strong></td>' +
                        '<td><span class="badge" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);">' + (t.category || '') + '</span></td>' +
                        '<td style="color:' + color + '; font-weight:600;">' + sign + ' Rp ' + Number(t.amount).toLocaleString('id-ID') + '</td>' +
                        '<td><span style="color:var(--adm-gold);">' + (t.status || 'Berhasil') + '</span></td>' +
                        '<td>' + btn + '</td>' +
                    '</tr>';
                }).join('');
            }
        }
    } catch(e) {
        console.warn('renderCashflowTable error:', e.message);
    }
};

window.handleSaveCashEntry = function(e) {
    e.preventDefault();
    const type = document.getElementById('newCfType')?.value;
    const category = document.getElementById('newCfCategory')?.value;
    const amount = document.getElementById('newCfAmount')?.value;
    const desc = document.getElementById('newCfDesc')?.value;
    const date = document.getElementById('newCfDate')?.value;
    
    if (!type || !category || !amount || !desc || !date) {
        uiAlert('Semua kolom wajib diisi!');
        return;
    }

    const payload = { type, category, amount, date, desc };

    const btn = e.target.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    fetch('/api/cms/cashflow-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi kas berhasil dicatat!');
              closeModals();
              e.target.reset();
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal mencatat transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      }).finally(() => {
          if (btn) btn.disabled = false;
      });
};

window.deleteCashflowTransaction = function(id) {
    if (!uiConfirm('Hapus transaksi kas ini?')) return;
    
    fetch('/api/cms/cashflow-transactions/' + id, {
        method: 'DELETE'
    }).then(res => res.json())
      .then(data => {
          if (data.success) {
              uiAlert('Transaksi berhasil dihapus');
              loadCashflowTransactions();
          } else {
              uiAlert('Gagal menghapus transaksi: ' + (data.message || 'Error'));
          }
      }).catch(err => {
          console.error(err);
          uiAlert('Terjadi kesalahan jaringan.');
      });
};

window.renderCashflowCategories = function() {
    const type = document.getElementById('newCfType').value;
    const cat = document.getElementById('newCfCategory');
    if (!cat) return;
    let opts = '<option value="" disabled selected>-- Pilih Kategori --</option>';
    if (type === 'in' || type === 'inflow') {
        opts += '<option value="Sponsorship">Sponsorship / Endorsement</option><option value="Lainnya">Pendapatan Lainnya</option>';
    } else {
        opts += '<option value="Transportasi">Biaya Transportasi</option><option value="Konsumsi">Biaya Konsumsi / Meals</option><option value="Wardrobe">Biaya Wardrobe / Makeup</option><option value="Lainnya">Pengeluaran Lainnya</option>';
    }
    cat.innerHTML = opts;
};
\nwindow.initAdminCms = function() {
    try {
        const ts = Date.now();
        Promise.all([
            fetch('/api/cms/biodata?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/packages?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/policies?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/gallery?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/presskit?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/riders?t=' + ts).then(r => r.json()).catch(()=>({})),
            fetch('/api/cms/testimonials?t=' + ts).then(r => r.json()).catch(()=>({}))
        ]).then(results => {
            const bioData = results[0]?.data || {};
            const pkgsData = results[1]?.data || [];
            const polData = results[2]?.data || {};
            const galData = results[3]?.data || [];
            const pkData = results[4]?.data || {};
            const ridersData = results[5]?.data || [];
            const testData = results[6]?.data || [];
            
            window.cmsConfig = window.cmsConfig || {};
            window.cmsConfig.bio = bioData;
            window.cmsConfig.pkgs = pkgsData;
            window.cmsConfig.policies = polData;
            window.cmsConfig.gallery = galData;
            window.cmsConfig.presskit = pkData;
            window.cmsConfig.riders = ridersData;
            window.cmsConfig.testimonials = testData;
            
            const mapVal = (id, val) => {
                const el = document.getElementById(id);
                if (el && val !== undefined && val !== null) el.value = val;
            };
            
            // Biodata
            mapVal('cmsNamaPanggung', bioData.name);
            mapVal('cmsEmail', bioData.email);
            mapVal('cmsBioText', bioData.bio);
            mapVal('cmsStatEvents', bioData.statEvents);
            mapVal('cmsStatYears', bioData.statYears);
            mapVal('cmsSpesialisasi', bioData.spec);
            mapVal('cmsFotoUrl', bioData.photo);
            mapVal('cmsIg', bioData.ig);
            mapVal('cmsTiktok', bioData.tiktok);
            mapVal('cmsFb', bioData.fb);
            
            if (bioData.photo) {
                const preview = document.getElementById('cmsFotoPreview');
                if (preview) preview.src = bioData.photo;
                const sidebarImg = document.getElementById('sidebarAvatarImg');
                if (sidebarImg) { sidebarImg.src = bioData.photo; sidebarImg.style.opacity = '1'; }
            }
            if (bioData.name) {
                const sidebarName = document.getElementById('sidebarMcName');
                if (sidebarName) sidebarName.textContent = bioData.name;
                const dashName = document.getElementById('dashWelcomeName');
                if (dashName) dashName.textContent = bioData.name;
            }
            
            if (bioData.calendarConfig) {
                mapVal('cfgCalBuffer', bioData.calendarConfig.buffer);
                mapVal('cfgCalMode', bioData.calendarConfig.mode);
                mapVal('cfgCalNotice', bioData.calendarConfig.notice);
            }

            // Packages (Layanan)
            renderAdminPackages(pkgsData);

            // Policies (Terms, Refund, Riders, FAQ)
            mapVal('cmsTermsText', polData.terms);
            mapVal('cmsRefundText', polData.refund);
            mapVal('cmsRidersText', polData.riders);
            renderAdminFaqs(polData.faqs || []);
            renderAdminTestimonials(testData);

            // Press Kit
            mapVal('pk_stageName', pkData.stageName);
            mapVal('pk_spesialisasi', pkData.spesialisasi);
            mapVal('pk_tagline', pkData.tagline);
            mapVal('pk_bio', pkData.bio);
            mapVal('pk_pic', pkData.pic);
            mapVal('pk_wa', pkData.wa);
            mapVal('pk_email', pkData.email);
            mapVal('pk_sosmed', pkData.sosmed);
            mapVal('pk_domisili', pkData.domisili);
            mapVal('pk_scope1', pkData.scope1);
            mapVal('pk_scope2', pkData.scope2);
            mapVal('pk_scope3', pkData.scope3);
            mapVal('pk_scope4', pkData.scope4);
            mapVal('pk_footerNote', pkData.footerNote);
            mapVal('riders_footerNote', pkData.ridersFooter);

            // Gallery
            renderAdminGallery(galData);
            
            // Riders (Table)
            renderAdminRiders(ridersData);
        });
    } catch(e) {
        console.warn('CMS init skipped:', e.message);
    }
}

// Packages Implementation
window.renderAdminPackages = function(pkgs) {
    const list = document.getElementById('cmsPackagesList');
    if (!list) return;
    window.cmsConfig.pkgs = pkgs;
    if (pkgs.length === 0) {
        list.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-muted);">Belum ada paket.</div>';
        return;
    }
    let html = '';
    pkgs.forEach((p, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:1rem; display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.5rem; border:1px solid var(--border-subtle);">
            <div>
                <div style="font-weight:700; color:var(--gold-primary); font-size:1.1rem;">${p.name || 'Paket '+(i+1)}</div>
                <div style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:0.5rem;">Kategori: ${p.category || 'Standard'} | Durasi: ${p.duration || '-'} | Harga: Rp ${parseInt(p.price||0).toLocaleString('id-ID')}</div>
                <ul style="margin:0; padding-left:1.25rem; font-size:0.85rem; color:var(--text-main);">
                    ${(p.features||[]).map(f => '<li>'+f+'</li>').join('')}
                </ul>
            </div>
            <div style="display:flex; gap:0.5rem;">
                <button class="btn btn-secondary btn-sm" onclick="editPackage(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deletePackage(${i})">Hapus</button>
            </div>
        </div>`;
    });
    list.innerHTML = html;
};
window.openAddPackageModal = function() {
    window.editingPackageIndex = -1;
    let n = prompt("Nama Paket Baru:");
    if(!n) return;
    let p = prompt("Harga (Angka saja):", "0");
    let c = prompt("Kategori:", "Standard");
    let d = prompt("Durasi (misal: 4 Jam):", "4 Jam");
    let f = prompt("Fitur (Pisahkan dengan koma):", "Fitur 1, Fitur 2");
    
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.push({
        name: n,
        price: p,
        category: c,
        duration: d,
        features: f.split(',').map(x=>x.trim())
    });
    window.cmsConfig.pkgs = pkgs;
    renderAdminPackages(pkgs);
    handleSavePackage(); // auto save
};
window.editPackage = function(i) {
    let pkgs = window.cmsConfig.pkgs || [];
    let p = pkgs[i];
    if(!p) return;
    let n = prompt("Nama Paket:", p.name); if(n===null) return;
    let pr = prompt("Harga:", p.price);
    let f = prompt("Fitur (Pisahkan dengan koma):", (p.features||[]).join(', '));
    p.name = n; p.price = pr; p.features = f.split(',').map(x=>x.trim());
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.deletePackage = function(i) {
    if(!confirm('Hapus paket ini?')) return;
    let pkgs = window.cmsConfig.pkgs || [];
    pkgs.splice(i, 1);
    renderAdminPackages(pkgs);
    handleSavePackage();
};
window.handleSavePackage = function(e) {
    if (e) e.preventDefault();
    fetch('/api/cms/packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packages: window.cmsConfig.pkgs || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Paket disimpan!', 'success');
    });
};

// FAQ
window.renderAdminFaqs = function(faqs) {
    window.cmsConfig.policies = window.cmsConfig.policies || {};
    window.cmsConfig.policies.faqs = faqs;
    const list = document.getElementById('faqItemsList');
    if (!list) return;
    let html = '';
    faqs.forEach((f, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">Q: ${f.q}</strong>
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">A: ${f.a}</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteFaq(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddFaq = function() {
    let q = prompt("Pertanyaan (Q):"); if(!q) return;
    let a = prompt("Jawaban (A):"); if(!a) return;
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.push({q, a});
    renderAdminFaqs(faqs);
};
window.deleteFaq = function(i) {
    let faqs = window.cmsConfig.policies.faqs || [];
    faqs.splice(i, 1);
    renderAdminFaqs(faqs);
};

// Testimonials
window.renderAdminTestimonials = function(tests) {
    window.cmsConfig.testimonials = tests;
    const list = document.getElementById('testimonialItemsList');
    if (!list) return;
    let html = '';
    tests.forEach((t, i) => {
        html += `
        <div class="ecc-card" style="background:var(--bg-surface); padding:0.9rem 1.1rem; border:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:flex-start;">
            <div>
                <strong style="color:var(--gold-primary);">${t.author}</strong> - ${t.role}
                <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:0.25rem;">"${t.text}"</p>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteTestimonial(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.promptAddTestimonial = function() {
    let author = prompt("Nama Klien:"); if(!author) return;
    let role = prompt("Peran (misal: Bride, Corporate EO):", "Client");
    let text = prompt("Testimoni:"); if(!text) return;
    let tests = window.cmsConfig.testimonials || [];
    tests.push({author, role, text, rating:5});
    renderAdminTestimonials(tests);
};
window.deleteTestimonial = function(i) {
    let tests = window.cmsConfig.testimonials || [];
    tests.splice(i, 1);
    renderAdminTestimonials(tests);
};

window.handleSaveCmsPolicies = function(e) {
    if (e) e.preventDefault();
    const pol = {
        terms: document.getElementById('cmsTermsText')?.value || '',
        refund: document.getElementById('cmsRefundText')?.value || '',
        riders: document.getElementById('cmsRidersText')?.value || '',
        faqs: window.cmsConfig.policies?.faqs || []
    };
    fetch('/api/cms/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pol)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Kebijakan & FAQ berhasil disimpan!', 'success');
        
        // Also save testimonials
        fetch('/api/cms/testimonials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testimonials: window.cmsConfig.testimonials || [] })
        });
    });
};

window.handleSaveCalendarWidgetConfig = function(e) {
    if (e) e.preventDefault();
    const bio = window.cmsConfig.bio || {};
    bio.calendarConfig = {
        buffer: document.getElementById('cfgCalBuffer')?.value || '7',
        mode: document.getElementById('cfgCalMode')?.value || 'request_to_book',
        notice: document.getElementById('cfgCalNotice')?.value || ''
    };
    fetch('/api/cms/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio)
    }).then(r=>r.json()).then(() => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Pengaturan Kalender disimpan!', 'success');
    });
};

// Press Kit
window.savePressKitData = function() {
    const pk = {
        stageName: document.getElementById('pk_stageName')?.value || '',
        spesialisasi: document.getElementById('pk_spesialisasi')?.value || '',
        tagline: document.getElementById('pk_tagline')?.value || '',
        bio: document.getElementById('pk_bio')?.value || '',
        pic: document.getElementById('pk_pic')?.value || '',
        wa: document.getElementById('pk_wa')?.value || '',
        email: document.getElementById('pk_email')?.value || '',
        sosmed: document.getElementById('pk_sosmed')?.value || '',
        domisili: document.getElementById('pk_domisili')?.value || '',
        scope1: document.getElementById('pk_scope1')?.value || '',
        scope2: document.getElementById('pk_scope2')?.value || '',
        scope3: document.getElementById('pk_scope3')?.value || '',
        scope4: document.getElementById('pk_scope4')?.value || '',
        footerNote: document.getElementById('pk_footerNote')?.value || '',
        ridersFooter: document.getElementById('riders_footerNote')?.value || ''
    };
    fetch('/api/cms/presskit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pk)
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Press Kit disimpan!', 'success');
    });
};
window.saveRidersFooterNote = function() {
    savePressKitData();
};

// Gallery
window.renderAdminGallery = function(gal) {
    window.cmsConfig.gallery = gal;
    const list = document.getElementById('adminGalleryList'); // Wait, does this exist? I need to check admin.html ID for gallery
    if (!list) return;
    let html = '';
    gal.forEach((g, i) => {
        html += `<div style="display:flex; flex-direction:column; gap:0.5rem; background:var(--bg-surface); padding:1rem; border:1px solid var(--border-subtle); border-radius:8px;">
            <img src="${g.url}" style="width:100%; height:150px; object-fit:cover; border-radius:4px;">
            <input type="text" class="form-input" value="${g.caption || ''}" onchange="updateGalleryCaption(${i}, this.value)">
            <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteGalleryItem(${i})">Hapus</button>
        </div>`;
    });
    list.innerHTML = html;
};
window.updateGalleryCaption = function(i, cap) {
    window.cmsConfig.gallery[i].caption = cap;
};
window.deleteGalleryItem = function(i) {
    window.cmsConfig.gallery.splice(i, 1);
    renderAdminGallery(window.cmsConfig.gallery);
};
window.handleSaveCmsGallery = function() {
    fetch('/api/cms/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gallery: window.cmsConfig.gallery || [] })
    }).then(r => r.json()).then(res => {
        if (typeof window.uiAlert === 'function') window.uiAlert('Galeri disimpan!', 'success');
    });
};
window.addGalleryItem = function() {
    let url = prompt("URL Gambar Baru:");
    if(!url) return;
    let cap = prompt("Caption Gambar:");
    window.cmsConfig.gallery.push({url: url, caption: cap});
    renderAdminGallery(window.cmsConfig.gallery);
};

// Riders
window.renderAdminRiders = function(riders) {
    window.cmsConfig.riders = riders;
    const body = document.getElementById('ridersTableBody');
    if (!body) return;
    let html = '';
    riders.forEach((r, i) => {
        html += `<tr>
            <td><strong>${r.title}</strong></td>
            <td>${r.notes}</td>
            <td>
                <button class="btn btn-secondary btn-sm" onclick="editRider(${i})">Edit</button>
                <button class="btn btn-secondary btn-sm" style="color:#F87171;" onclick="deleteRider(${i})">Hapus</button>
            </td>
        </tr>`;
    });
    body.innerHTML = html;
};
window.openRiderModal = function() {
    let t = prompt("Judul Rider (misal: Hospitality):"); if(!t) return;
    let n = prompt("Catatan (misal: 1x Ruang Tunggu):"); if(!n) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: t, notes: n })
    }).then(r=>r.json()).then(res => {
        initAdminCms(); // reload everything
    });
};
window.editRider = function(i) {
    let r = window.cmsConfig.riders[i];
    let t = prompt("Judul Rider:", r.title); if(t===null) return;
    let n = prompt("Catatan:", r.notes); if(n===null) return;
    fetch('/api/cms/riders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ db_id: r.db_id, title: t, notes: n })
    }).then(res=>res.json()).then(() => initAdminCms());
};
window.deleteRider = function(i) {
    let r = window.cmsConfig.riders[i];
    if(!confirm('Hapus rider ini?')) return;
    fetch('/api/cms/riders/' + r.db_id, { method: 'DELETE' })
        .then(res=>res.json()).then(() => initAdminCms());
};


// Trigger initial load
document.addEventListener("DOMContentLoaded", window.initAdminCms);


window.renderDashboardPies = function() {
    // Event Category Pie (Dashboard)
    const svg = document.getElementById('dashProporsiSvg');
    const legend = document.getElementById('dashProporsiLegend');
    if (svg && legend) {
        const counts = {};
        let total = 0;
        (window.mcCustomers || []).forEach(c => {
            const cat = c.category || 'Wedding';
            counts[cat] = (counts[cat] || 0) + 1;
            total++;
        });

        if (total === 0) {
            svg.innerHTML = '<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#555" stroke-width="1" stroke-dasharray="3.14159 3.14159" />';
            legend.innerHTML = '<div style="text-align:center;">Belum ada data</div>';
        } else {
            const colors = ['#D4AF37', '#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6'];
            let htmlSvg = '';
            let htmlLegend = '';
            let currentOffset = 0;
            const circumference = Math.PI; 
            
            Object.keys(counts).forEach((cat, idx) => {
                const count = counts[cat];
                const perc = count / total;
                const strokeLength = perc * circumference;
                const color = colors[idx % colors.length];
                htmlSvg += `<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="${color}" stroke-width="1" stroke-dasharray="${strokeLength} ${circumference}" stroke-dashoffset="${-currentOffset}" />`;
                htmlLegend += `<div style="display:flex; justify-content:space-between;"><span style="color:${color}; font-weight:600;"> ${cat}</span> <span>${Math.round(perc * 100)}%</span></div>`;
                currentOffset += strokeLength;
            });
            svg.innerHTML = htmlSvg;
            legend.innerHTML = htmlLegend;
        }
    }
    
    // Income Proportion Pie (Dashboard) - if needed based on cashflow or just mock for now
    const incSvg = document.getElementById('dashIncomeProporsiSvg');
    const incLeg = document.getElementById('dashIncomeProporsiLegend');
    if (incSvg && incLeg) {
         // Since income is often fetched from cashflow, we'll try to read it from window.mcCashflow
         let totalInc = 0;
         const incCounts = {};
         (window.mcCashflow || []).forEach(tx => {
             if (tx.type === 'income') {
                 const c = tx.category || 'Lainnya';
                 incCounts[c] = (incCounts[c] || 0) + (tx.amount || 0);
                 totalInc += (tx.amount || 0);
             }
         });
         
         if (totalInc === 0) {
             incSvg.innerHTML = '<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="#555" stroke-width="1" stroke-dasharray="3.14159 3.14159" />';
             incLeg.innerHTML = '<div style="text-align:center;">Belum ada data</div>';
         } else {
             const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EC4899'];
             let htmlSvg = '';
             let htmlLegend = '';
             let currentOffset = 0;
             const circumference = Math.PI; 
             
             Object.keys(incCounts).forEach((cat, idx) => {
                 const amt = incCounts[cat];
                 const perc = amt / totalInc;
                 const strokeLength = perc * circumference;
                 const color = colors[idx % colors.length];
                 htmlSvg += `<circle r="0.5" cx="0" cy="0" fill="transparent" stroke="${color}" stroke-width="1" stroke-dasharray="${strokeLength} ${circumference}" stroke-dashoffset="${-currentOffset}" />`;
                 htmlLegend += `<div style="display:flex; justify-content:space-between;"><span style="color:${color}; font-weight:600;"> ${cat}</span> <span>${Math.round(perc * 100)}%</span></div>`;
                 currentOffset += strokeLength;
             });
             incSvg.innerHTML = htmlSvg;
             incLeg.innerHTML = htmlLegend;
         }
    }
};
