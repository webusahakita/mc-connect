const fs = require('fs');
let html = fs.readFileSync('public/admin.html', 'utf8');

// For Press Kit
const searchPressKit = `<div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">
                                    <button type="submit" class="btn btn-primary">💾 Simpan Data Press Kit</button>
                                </div>`;
const replacePressKit = `<div style="display:flex; justify-content:flex-end; gap:0.5rem; margin-top:1.5rem;">
                                    <button type="button" class="btn btn-secondary" onclick="autoFillDummyPressKit()">✨ Auto-Fill Contoh Data</button>
                                    <button type="submit" class="btn btn-primary">💾 Simpan Data Press Kit</button>
                                </div>
                                <script>
                                    function autoFillDummyPressKit() {
                                        document.getElementById('pk_stageName').value = 'Radja Maulana';
                                        document.getElementById('pk_spesialisasi').value = 'Professional Master of Ceremony, Host & Moderator';
                                        document.getElementById('pk_tagline').value = 'Bringing Energy, Precision, and Elegance to Your Stage.';
                                        document.getElementById('pk_bio').value = 'Praktisi pembawa acara profesional dengan pengalaman lebih dari 5 tahun di berbagai skala panggung nasional dan internasional. Dikenal karena kemampuannya dalam mengendalikan atmosfer acara, menjembatani audiens, dan menyampaikan pesan dengan artikulasi yang jernih serta elegan.';
                                        document.getElementById('pk_pic').value = 'Arkanza Management (Dinda)';
                                        document.getElementById('pk_wa').value = '+62 812-3456-7890';
                                        document.getElementById('pk_email').value = 'booking@radjamaulana.id';
                                        document.getElementById('pk_sosmed').value = '@radjamaulana.mc';
                                        document.getElementById('pk_domisili').value = 'Jakarta (Available Nationwide)';
                                        document.getElementById('pk_scope1').value = '- National & International Conferences\\n- Product Launching & Brand Activation\\n- Corporate Gala Dinners & Awarding';
                                        document.getElementById('pk_scope2').value = '- Akad Nikah / Holy Matrimony & Resepsi\\n- Lamaran / Engagement\\n- Private & Intimate Celebrations';
                                        document.getElementById('pk_scope3').value = '- Music Festival & Concerts\\n- Sport Events & Fun Runs\\n- Exhibition, Expo & Roadshow';
                                        document.getElementById('pk_scope4').value = '- Bilingual Capability (Bahasa Indonesia & English)\\n- Adaptif (Regal/Formal, Energic, Interaktif)\\n- Crowd Control & Time Management';
                                        document.getElementById('pk_footerNote').value = 'Video dokumentasi panggung dan foto resolusi tinggi tersedia berdasarkan permintaan ke pihak manajemen.';
                                        if (typeof window.showToast === 'function') window.showToast('Data contoh telah diisi! Silakan klik Simpan.', 'gold');
                                    }
                                </script>`;
                                
// For Riders
const searchRiders = `<button class="btn btn-primary btn-sm" onclick="openRiderModal()">+ Tambah Rider</button>`;
const replaceRiders = `<div style="display:flex; gap:0.5rem;">
                                    <button class="btn btn-secondary btn-sm" onclick="autoFillDummyRiders()">✨ Auto-Fill Contoh Riders</button>
                                    <button class="btn btn-primary btn-sm" onclick="openRiderModal()">+ Tambah Rider</button>
                                </div>
                                <script>
                                    function autoFillDummyRiders() {
                                        if(!confirm('Ini akan menambahkan 3 contoh Rider secara otomatis ke database. Lanjutkan?')) return;
                                        const riders = [
                                            { t: 'Technical Rider (Sistem Audio)', n: '- 1 buah Mic Wireless Profesional (Shure Axient / Sennheiser ew500 G4 atau setara)\\n- 1 buah Mic Wireless cadangan (standby di FOH)\\n- Monitor speaker yang menghadap ke area panggung' },
                                            { t: 'Hospitality Rider (Akomodasi & Konsumsi)', n: '- Ruang tunggu privat / VIP Room yang ber-AC dan dekat dengan panggung\\n- 1 box air mineral kemasan kecil bersuhu ruang\\n- 2 porsi makanan berat untuk MC & Asisten' },
                                            { t: 'Transportasi (Luar Kota)', n: '- Tiket pesawat PP (kelas ekonomi prioritas) untuk 2 orang\\n- Penjemputan eksklusif dari Bandara ke Hotel dan Venue\\n- Akomodasi hotel setara bintang 4/5' }
                                        ];
                                        
                                        let done = 0;
                                        riders.forEach(r => {
                                            fetch('/api/cms/riders', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': window.CSRF_TOKEN || '' },
                                                body: JSON.stringify({ title: r.t, notes: r.n })
                                            }).then(() => {
                                                done++;
                                                if(done === riders.length) {
                                                    document.getElementById('riders_footerNote').value = 'Rider ini bersifat fleksibel dan dapat didiskusikan secara musyawarah untuk disesuaikan dengan skala acara, model kemitraan, serta kondisi lapangan tanpa mengurangi standar kualitas performa.';
                                                    saveRidersFooterNote();
                                                    if (typeof initAdminCms === 'function') initAdminCms();
                                                    if (typeof window.showToast === 'function') window.showToast('3 Contoh Rider berhasil ditambahkan!', 'gold');
                                                }
                                            });
                                        });
                                    }
                                </script>`;

html = html.replace(/<div style="display:flex; justify-content:flex-end; margin-top:1.5rem;">[\s\S]*?<button type="submit" class="btn btn-primary">💾 Simpan Data Press Kit<\/button>[\s\S]*?<\/div>/, replacePressKit);
html = html.replace(/<button class="btn btn-primary btn-sm" onclick="openRiderModal\(\)">\+ Tambah Rider<\/button>/, replaceRiders);

fs.writeFileSync('public/admin.html', html);
console.log('Added auto-fill buttons');
