class u{constructor(e,a=[]){this.container=document.getElementById(e),this.currentDate=new Date,this.events=a,this.monthNames=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"]}init(){this.container&&this.render()}setEvents(e){this.events=e,this.render()}render(){var o,v;const e=this.currentDate.getFullYear(),a=this.currentDate.getMonth(),i=new Date(e,a,1).getDay(),d=new Date(e,a+1,0).getDate();let s=`
            <div class="calendar-header-bar">
                <div style="display:flex; align-items:center; gap:1rem;">
                    <button class="btn btn-secondary btn-sm" id="calPrevBtn">◀ Sebelumnya</button>
                    <h3 style="font-size:1.25rem; font-weight:700;">${this.monthNames[a]} ${e}</h3>
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
        `;for(let t=0;t<i;t++)s+='<div class="calendar-cell inactive"></div>';for(let t=1;t<=d;t++){const r=`${e}-${String(a+1).padStart(2,"0")}-${String(t).padStart(2,"0")}`,n=this.events.find(h=>h.date===r);let c="calendar-cell",l="";n?n.status==="Terkunci"?(c+=" has-event locked",l='<div class="calendar-cell-pill" style="background:#EF4444; color:#fff;">Terkunci</div>'):n.status==="Tentative"?(c+=" has-event tentative",l='<div class="calendar-cell-pill" style="background:#F59E0B; color:#000;">Tentative</div>'):(c+=" has-event",l='<div class="calendar-cell-pill" style="background:#3B82F6; color:#fff;">Review</div>'):l='<div class="calendar-cell-pill" style="background:rgba(16,185,129,0.15); color:#34D399;">Tersedia</div>',s+=`
                <div class="${c}" data-date="${r}" onclick="window.calendarApp.onDateClick('${r}', '${n?n.status:"Available"}')">
                    <span class="calendar-cell-date">${t}</span>
                    ${l}
                </div>
            `}s+="</div>",this.container.innerHTML=s,(o=document.getElementById("calPrevBtn"))==null||o.addEventListener("click",()=>{this.currentDate.setMonth(this.currentDate.getMonth()-1),this.render()}),(v=document.getElementById("calNextBtn"))==null||v.addEventListener("click",()=>{this.currentDate.setMonth(this.currentDate.getMonth()+1),this.render()})}onDateClick(e,a){if(a==="Terkunci"){alert(`Jadwal tanggal ${e} telah TERKUNCI (Sudah dibooking oleh klien lain). Silakan pilih tanggal lain yang bertanda hijau atau tentative.`);return}const i=document.getElementById("bookingModal"),d=document.getElementById("bookTanggalAcara");d&&(d.value=e),i&&i.classList.add("active")}}window.AvailabilityCalendar=u;
