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
