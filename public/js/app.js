window.closeModals = function() { document.querySelectorAll('.modal-overlay').forEach(el => el.classList.remove('active')); const rf = document.getElementById('requestForm'); if (rf) rf.reset(); };
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

    // 2. Setup Modal Closers - only close when clicking directly on backdrop
    document.addEventListener('click', (e) => {
        if (e.target && e.target.classList && e.target.classList.contains('modal-overlay') && e.target.classList.contains('active')) {
            e.target.classList.remove('active');
        }
    });

    // Prevent clicks inside modal-content from closing the modal
    document.querySelectorAll('.modal-content').forEach(content => {
        content.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });

    // .btn-close explicit close
    document.querySelectorAll('.btn-close, .modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
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

// ── Smart Table Feature (Scroll, Pagination, Sticky Head) ──
(function() {
    var st = document.createElement('style');
    st.textContent = `
        .smart-table-wrapper {
            width: 100%;
            overflow: auto;
            max-height: 65vh;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 1rem;
            background: rgba(0,0,0,0.1);
        }
        .smart-table-wrapper table {
            width: 100% !important;
            margin: 0 !important;
            border-collapse: collapse;
        }
        .smart-table-wrapper thead th {
            position: sticky;
            top: 0;
            z-index: 10;
            background-color: var(--card-bg, #1e293b);
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            padding: 12px;
            white-space: nowrap;
        }
        .smart-table-wrapper tbody td {
            white-space: nowrap;
        }
        
        .smart-table-controls {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            margin-bottom: 0.5rem;
            gap: 10px;
            font-size: 0.85rem;
            color: #94a3b8;
        }
        .smart-table-controls select {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #f8fafc;
            padding: 4px 8px;
            border-radius: 4px;
            outline: none;
            cursor: pointer;
        }
        .smart-table-controls select:hover {
            border-color: #D4AF37;
        }
        .smart-table-controls select option {
            background-color: #1e293b;
            color: #f8fafc;
        }
        
        .smart-table-nav {
            display: flex;
            justify-content: flex-end;
            gap: 5px;
            margin-top: -0.5rem;
            margin-bottom: 1.5rem;
        }
        .smart-table-nav button {
            background: rgba(255,255,255,0.05);
            border: 1px solid rgba(255,255,255,0.1);
            color: #f8fafc;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.85rem;
        }
        .smart-table-nav button:hover:not(:disabled) {
            background: #D4AF37;
            color: #000;
        }
        .smart-table-nav button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
    `;
    document.head.appendChild(st);

    function initTable(table) {
        if (table.classList.contains('smart-table-initialized')) return;
        table.classList.add('smart-table-initialized');

        var wrapper = document.createElement('div');
        wrapper.className = 'smart-table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);

        var limit = 10;
        var currentPage = 1;
        var tbody = table.querySelector('tbody');

        var controls = document.createElement('div');
        controls.className = 'smart-table-controls';
        controls.innerHTML = '<label>Tampilkan baris:</label><select><option value="10">10</option><option value="20">20</option><option value="50">50</option><option value="100">100</option><option value="-1">Semua</option></select>';
        wrapper.parentNode.insertBefore(controls, wrapper);
        var select = controls.querySelector('select');
        
        var nav = document.createElement('div');
        nav.className = 'smart-table-nav';
        nav.innerHTML = '<button class="btn-prev">Sebelumnya</button><span class="page-info" style="align-self:center; margin:0 10px; font-size:0.85rem; color:#94a3b8;">Halaman 1</span><button class="btn-next">Selanjutnya</button>';
        wrapper.parentNode.insertBefore(nav, wrapper.nextSibling);
        var btnPrev = nav.querySelector('.btn-prev');
        var btnNext = nav.querySelector('.btn-next');
        var info = nav.querySelector('.page-info');

        function updateView() {
            if (!tbody) {
                tbody = table.querySelector('tbody');
                if (!tbody) return;
            }
            var rows = Array.from(tbody.querySelectorAll('tr'));
            var actualRows = rows.filter(r => {
                var td = r.querySelector('td');
                return !(td && td.colSpan > 3 && r.textContent.toLowerCase().includes('belum ada'));
            });

            var totalRows = actualRows.length;
            if (totalRows === 0) {
                nav.style.display = 'none';
                return;
            }
            nav.style.display = limit === -1 ? 'none' : 'flex';

            var totalPages = limit === -1 ? 1 : Math.ceil(totalRows / limit);
            if (currentPage > totalPages) currentPage = totalPages || 1;
            if (currentPage < 1) currentPage = 1;

            var startIdx = (currentPage - 1) * limit;
            var endIdx = startIdx + limit;

            actualRows.forEach((r, i) => {
                if (limit === -1) {
                    r.style.display = '';
                } else {
                    if (i >= startIdx && i < endIdx) {
                        r.style.display = '';
                    } else {
                        r.style.display = 'none';
                    }
                }
            });

            info.textContent = 'Halaman ' + currentPage + ' dari ' + totalPages + ' (' + totalRows + ' baris)';
            btnPrev.disabled = currentPage <= 1;
            btnNext.disabled = currentPage >= totalPages;
        }

        select.addEventListener('change', function() {
            limit = parseInt(this.value);
            currentPage = 1;
            updateView();
        });

        btnPrev.addEventListener('click', function() {
            if (currentPage > 1) { currentPage--; updateView(); }
        });
        
        btnNext.addEventListener('click', function() {
            if (currentPage < (Math.ceil((tbody.querySelectorAll('tr').length)/limit))) {
                currentPage++; updateView();
            }
        });

        var observer = new MutationObserver(function() {
            updateView(); // Do not reset to page 1 on every minor DOM change, just update view.
        });

        if (tbody) {
            observer.observe(tbody, { childList: true, subtree: true });
        } else {
            observer.observe(table, { childList: true, subtree: true });
        }

        updateView();
    }

    function initAll() {
        document.querySelectorAll('table').forEach(table => {
            if(table.classList.contains('inv-tbl') || table.classList.contains('print-table') || table.closest('.inv-m')) return;
            initTable(table);
        });
    }

    document.addEventListener('DOMContentLoaded', initAll);
    
    setTimeout(() => {
        var globalObserver = new MutationObserver(initAll);
        globalObserver.observe(document.body, { childList: true, subtree: true });
        initAll();
    }, 1000);
})();
