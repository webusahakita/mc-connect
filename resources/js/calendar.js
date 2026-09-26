/**
 * MC-Connect Interactive Availability Calendar Engine
 * Displays live dates with Available, Tentative, and Locked status
 * Integrates directly with the Request to Book flow
 */

class AvailabilityCalendar {
    constructor(containerId, eventsData = []) {
        this.container = document.getElementById(containerId);
        this.currentDate = new Date();
        this.events = eventsData; // Array of { date, status, title }
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

    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();

        const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
        const lastDate = new Date(year, month + 1, 0).getDate();

        let html = `
            <div class="calendar-header-bar">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <button class="btn btn-secondary btn-sm" id="calPrevBtn">◀ Sebelumnya</button>
                    <h3 style="font-size:1.25rem; font-weight:700;">${this.monthNames[month]} ${year}</h3>
                    <button class="btn btn-secondary btn-sm" id="calNextBtn">Berikutnya ▶</button>
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

        // Days of month
        for (let day = 1; day <= lastDate; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const eventOnDate = this.events.find(e => e.date === dateStr);

            let cellClass = 'calendar-cell';
            let pillHtml = '';

            if (eventOnDate) {
                if (eventOnDate.status === 'Terkunci') {
                    cellClass += ' has-event locked';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#EF4444; color:#fff;">Terkunci</div>`;
                } else if (eventOnDate.status === 'Tentative') {
                    cellClass += ' has-event tentative';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#F59E0B; color:#000;">Tentative</div>`;
                } else {
                    cellClass += ' has-event';
                    pillHtml = `<div class="calendar-cell-pill" style="background:#3B82F6; color:#fff;">Review</div>`;
                }
            } else {
                pillHtml = `<div class="calendar-cell-pill" style="background:rgba(16,185,129,0.15); color:#34D399;">Tersedia</div>`;
            }

            html += `
                <div class="${cellClass}" data-date="${dateStr}" onclick="window.calendarApp.onDateClick('${dateStr}', '${eventOnDate ? eventOnDate.status : 'Available'}')">
                    <span class="calendar-cell-date">${day}</span>
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

    onDateClick(dateStr, status) {
        if (status === 'Terkunci') {
            alert(`Jadwal tanggal ${dateStr} telah TERKUNCI (Sudah dibooking oleh klien lain). Silakan pilih tanggal lain yang bertanda hijau atau tentative.`);
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
