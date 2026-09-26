function getPrintHtml(pk, riders, esc, ridersRowsHtml, riderFooter, scopeSection) {
    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>Press Kit - ${esc(pk.stageName)}</title>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
  @page {
      size: A4 portrait;
      margin: 0; /* Menghilangkan header/footer bawaan browser secara paksa */
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
  .master-table thead td { height: 20mm; border: none; padding: 0; } /* Spacer Atas (Jarak Aman) */
  .master-table tfoot td { height: 20mm; border: none; padding: 0; } /* Spacer Bawah (Jarak Aman) */
  .master-content-td { border: none; padding: 0 20mm; } /* Padding Kiri Kanan */
</style>
</head>
<body>
<div class="print-btn no-print"><button onclick="window.print()">🖨 Cetak / Simpan PDF Sekarang</button></div>

<div class="screen-container">
<table class="master-table">
    <thead><tr><td></td></tr></thead>
    <tbody><tr><td class="master-content-td">
    
        <!-- PAGE 1 CONTENT -->
        <div class="page">
            <div class="p1-header">
                <div class="p1-badge">Official Media Kit</div>
                <h1 class="p1-title">${esc(pk.stageName)}</h1>
                <p class="p1-subtitle">Professional Master of Ceremony</p>
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
</script>
</body></html>`;
}
module.exports = getPrintHtml;
