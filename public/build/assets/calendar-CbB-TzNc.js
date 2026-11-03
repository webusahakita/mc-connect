class u{constructor(e,a=[]){this.container=document.getElementById(e),this.currentDate=new Date,this.events=a,this.monthNames=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]}init(){this.container&&this.render()}setEvents(e){this.events=e,this.render()}render(){var o,v;const e=this.currentDate.getFullYear(),a=this.currentDate.getMonth(),i=new Date(e,a,1).getDay(),s=new Date(e,a+1,0).getDate();let d=`
            <div class="calendar-header-bar">
                <div class="calendar-nav-controls" style="display:flex; align-items:center; justify-content:space-between; width:100%; gap:0.5rem;">
                    <button type="button" class="btn btn-secondary btn-sm cal-nav-btn" id="calPrevBtn" title="Bulan Sebelumnya" aria-label="Bulan Sebelumnya" style="flex-shrink:0; display:inline-flex; align-items:center; gap:0.35rem; padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:700;">
                        <span class="cal-nav-arrow">◀</span>
                        <span class="cal-nav-text">Sebelumnya</span>
                    </button>
                    <h3 class="calendar-month-title" style="flex:1 1 auto; min-width:0; text-align:center; margin:0 0.5rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:clamp(0.95rem, 3.8vw, 1.25rem); font-weight:800;">${this.monthNames[a]} ${e}</h3>
                    <button type="button" class="btn btn-secondary btn-sm cal-nav-btn" id="calNextBtn" title="Bulan Berikutnya" aria-label="Bulan Berikutnya" style="flex-shrink:0; display:inline-flex; align-items:center; gap:0.35rem; padding:0.4rem 0.75rem; font-size:0.82rem; font-weight:700;">
                        <span class="cal-nav-text">Berikutnya</span>
                        <span class="cal-nav-arrow">▶</span>
                    </button>
                </div>
                <div class="calendar-legend">
                    <div class="legend-item"><span class="legend-dot avail"></span> Tersedia (Available)</div>
                    <div class="legend-item"><span class="legend-dot tentative"></span> Tentative Booking</div>
                    <div class="legend-item"><span class="legend-dot locked"></span> Terkunci (Booked)</div>
                </div>
            </div>

            <div class="calendar-grid-container" style="width: 100%; max-width: 100%; overflow-x: auto; -webkit-overflow-scrolling: touch;">
                <div class="calendar-grid">
                    <div class="calendar-day-header">Min</div>
                    <div class="calendar-day-header">Sen</div>
                    <div class="calendar-day-header">Sel</div>
                    <div class="calendar-day-header">Rab</div>
                    <div class="calendar-day-header">Kam</div>
                    <div class="calendar-day-header">Jum</div>
                    <div class="calendar-day-header">Sab</div>
        `;for(let t=0;t<i;t++)d+='<div class="calendar-cell inactive"></div>';for(let t=1;t<=s;t++){const c=`${e}-${String(a+1).padStart(2,"0")}-${String(t).padStart(2,"0")}`,n=this.events.find(h=>h.date===c);let r="calendar-cell",l="";n?n.status==="Terkunci"?(r+=" has-event locked",l='<div class="calendar-cell-pill" style="background:#EF4444; color:#fff;">Terkunci</div>'):n.status==="Tentative"?(r+=" has-event tentative",l='<div class="calendar-cell-pill" style="background:#F59E0B; color:#000;">Tentative</div>'):(r+=" has-event",l='<div class="calendar-cell-pill" style="background:#3B82F6; color:#fff;">Review</div>'):l='<div class="calendar-cell-pill" style="background:rgba(16,185,129,0.15); color:#34D399;">Tersedia</div>',d+=`
                <div class="${r}" data-date="${c}" onclick="window.calendarApp.onDateClick('${c}', '${n?n.status:"Available"}')">
                    <span class="calendar-cell-date">${t}</span>
                    ${l}
                </div>
            `}d+="</div></div>",this.container.innerHTML=d,(o=document.getElementById("calPrevBtn"))==null||o.addEventListener("click",()=>{this.currentDate.setMonth(this.currentDate.getMonth()-1),this.render()}),(v=document.getElementById("calNextBtn"))==null||v.addEventListener("click",()=>{this.currentDate.setMonth(this.currentDate.getMonth()+1),this.render()})}onDateClick(e,a){if(a==="Terkunci"){alert(`Jadwal tanggal ${e} telah TERKUNCI (Sudah dibooking oleh klien lain). Silakan pilih tanggal lain yang bertanda hijau atau tentative.`);return}const i=document.getElementById("bookingModal"),s=document.getElementById("bookTanggalAcara");s&&(s.value=e),i&&i.classList.add("active")}}window.AvailabilityCalendar=u;
