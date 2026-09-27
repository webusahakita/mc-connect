/**
 * MC-Connect Interactive Availability Calendar Engine
 * Displays live dates with Available, Tentative, and Locked status
 * Integrates directly with the Request to Book flow
 */

class AvailabilityCalendar {
    constructor(containerId, eventsData = [], onDateClickCallback = null) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.events = eventsData; // Array of { date, status, title }
        this.onDateClickCallback = onDateClickCallback;
        this.monthNames = [
            'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
            'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
        ];
    }

    init() {
        if (!this.container) return;
        this.render();
    }

    setEvents(events) {
        this.events = events;
        this.render();
    }

    goToToday() {
        this.currentDate = new Date();
        this.render();
    }

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
        const lastDate = new Date(year, month + 1, 0).getDate();

        let html = `
            <div class="calendar-header-bar">
                <div class="calendar-nav-controls" style="display: flex; align-items: center; justify-content: space-between; width: 100%; margin-bottom: 1rem;">
                    <button class="btn btn-secondary btn-sm" id="calPrevBtn" style="padding: 0.4rem 0.8rem; flex-shrink: 0;">◀ Sebelumnya</button>
                    <h3 class="calendar-month-title" style="margin: 0; text-align: center; font-size: 1.1rem; flex-grow: 1;">${this.monthNames[month]} ${year}</h3>
                    <button class="btn btn-secondary btn-sm" id="calNextBtn" style="padding: 0.4rem 0.8rem; flex-shrink: 0;">Berikutnya ▶</button>
                </div>
                <div class="calendar-legend">
                    <div class="legend-item"><span class="legend-dot avail"></span> Tersedia (Available)</div>
                    <div class="legend-item"><span class="legend-dot tentative"></span> Tentative Booking</div>
                    <div class="legend-item"><span class="legend-dot locked"></span> Terkunci (Booked)</div>
                </div>
            </div>

            <div class="calendar-grid">
                <div class="calendar-day-header">Min</div>
                <div class="calendar-day-header">Sen</div>
                <div class="calendar-day-header">Sel</div>
                <div class="calendar-day-header">Rab</div>
                <div class="calendar-day-header">Kam</div>
                <div class="calendar-day-header">Jum</div>
                <div class="calendar-day-header">Sab</div>
        `;

        // Empty cells before first day
        for (let i = 0; i < firstDayIndex; i++) {
            html += `<div class="calendar-cell inactive"></div>`;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let bufferDays = 0;
        if (window._mcCalendarConfig && window._mcCalendarConfig.buffer) {
            bufferDays = parseInt(window._mcCalendarConfig.buffer, 10) || 0;
        }
        
        const thresholdDate = new Date(today);
        thresholdDate.setDate(thresholdDate.getDate() + bufferDays);

        // Days of month
        for (let day = 1; day <= lastDate; day++) {
            const cellDate = new Date(year, month, day);
            cellDate.setHours(0,0,0,0);
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const eventOnDate = this.events.find(e => e.date === dateStr);

            let isBlocked = false;
            if (cellDate < today) {
                isBlocked = true;
            } else if (cellDate < thresholdDate) {
                isBlocked = true;
            }

            let cellClass = 'calendar-cell';
            let pillHtml = '';

            if (eventOnDate) {
                if (eventOnDate.status === 'Terkunci') {
                    cellClass += ' has-event locked';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#EF4444; color:#fff;">Terkunci</div>`;
                } else if (eventOnDate.status === 'Tentative') {
                    cellClass += ' has-event tentative';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#F59E0B; color:#000;">Tentative</div>`;
                } else if (eventOnDate.status === 'Selesai') {
                    cellClass += ' has-event done';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#10B981; color:#fff;">Selesai</div>`;
                } else {
                    cellClass += ' has-event';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#3B82F6; color:#fff;">Review</div>`;
                }
            } else {
                if (isBlocked) {
                    if (cellDate.getTime() !== today.getTime()) {
                        cellClass += ' inactive';
                    }
                    pillHtml = `<div class="calendar-cell-pill" style="background:rgba(255,255,255,0.05); color:var(--text-muted);">Tdk Tersedia</div>`;
                } else {
                    pillHtml = `<div class="calendar-cell-pill" style="background:rgba(16,185,129,0.15); color:#34D399;">Tersedia</div>`;
                }
            }

            // Publik: blokir klik di HTML jika jadwal terlewat. Admin: tetap bisa diklik agar diteruskan ke onDateClick.
            const isPublic = this.container && this.container.id === 'publicCalendarContainer';
            const clickAction = (isBlocked && isPublic) ? `` : `onclick="window.calendarApp.onDateClick('${dateStr}', '${eventOnDate ? eventOnDate.status : 'Available'}', ${isBlocked})"`;
            
            let styleCursor = (isBlocked && isPublic) ? 'cursor:not-allowed;' : '';
            if (cellDate.getTime() !== today.getTime() && isBlocked && isPublic) {
                styleCursor += ' opacity: 0.5;';
            }
            
            let todayIndicator = '';
            if (cellDate.getTime() === today.getTime()) {
                styleCursor += ' border: 1px solid #D4AF37; position:relative;';
                todayIndicator = '<div style="position:absolute; top:4px; right:4px; background:#EF4444; color:#FFF; font-size:0.65rem; padding:3px 8px; border-radius:4px; font-weight:800; box-shadow: 0 2px 4px rgba(0,0,0,0.5); z-index:10; border: 1px solid rgba(255,255,255,0.2);">HARI INI</div>';
            }

            html += `
                <div class="${cellClass}" data-date="${dateStr}" ${clickAction} style="${styleCursor}">
                    <span class="calendar-cell-date">${day}</span>
                    ${todayIndicator}
                    ${pillHtml}
                </div>
            `;
        }

        html += `</div>`;
        this.container.innerHTML = html;

        document.getElementById('calPrevBtn')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.render();
        });

        document.getElementById('calNextBtn')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.render();
        });
    }

    onDateClick(dateStr, status, isBlocked = false) {
        const isPublic = this.container && this.container.id === 'publicCalendarContainer';

        if (isPublic && isBlocked) {
            // Jika untuk alasan apa pun di kalender publik (landing page) bisa diklik padahal sudah lewat/diblokir, batalkan.
            return;
        }

        if (this.onDateClickCallback) {
            // Find event objects for the callback
            const eventsOnDate = this.events.filter(e => e.date === dateStr);
            const eventObj = eventsOnDate.length > 0 ? eventsOnDate[0] : null;
            
            // Validasi Admin: Jangan izinkan tambah acara di tanggal lewat/hari ini (jika tidak ada event sebelumnya)
            // if (!isPublic && isBlocked && !eventObj) {
            //     if (window.showToast) window.showToast('Tidak bisa input acara baru di tanggal yang sudah terlewat atau hari ini.', 'red');
            //     else window.uiAlert('Tidak bisa input acara baru di tanggal ini.');
            //     return;
            // }
            
            this.onDateClickCallback(dateStr, status, eventObj, eventsOnDate);
            return;
        }

        // Public Landing Page logic
        if (status === 'Terkunci') {
            if (window.showToast) {
                window.showToast(`Jadwal tanggal ${dateStr} telah TERKUNCI.`, 'red');
            } else if (typeof uiAlert === 'function') {
                uiAlert(`Jadwal tanggal ${dateStr} telah TERKUNCI (Sudah dibooking oleh klien lain). Silakan pilih tanggal lain.`);
            } else {
                window.uiAlert(`Jadwal tanggal ${dateStr} telah TERKUNCI.`);
            }
            return;
        }
        
        if (isBlocked) {
            // Jika untuk alasan apa pun bisa diklik, jangan lakukan apapun (sesuai instruksi: tidak bisa diklik)
            return;
        }

        // Buka modal Request to Book
        const modal = document.getElementById('bookingModal');
        const dateInput = document.getElementById('bookTanggalAcara');
        if (dateInput) {
            dateInput.value = dateStr;
        }
        if (modal) {
            modal.classList.add('active');
        }
    }
}

window.AvailabilityCalendar = AvailabilityCalendar;
