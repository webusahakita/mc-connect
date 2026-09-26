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
        
        if (typeof window.closeModals === 'async function') window.closeModals();

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
                clientCatEl.innerHTML += `<option value="VIP">⭐ VIP</option><option value="Corporate">🏢 Corporate</option><option value="Regular">👥 Regular</option>`;
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
                if (typeof window.showToast === 'async function') {
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
