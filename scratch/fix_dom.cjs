const fs = require('fs');

let content = fs.readFileSync('public/admin.html', 'utf8');

const targetStr = `                                </script>
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
                                </script>
                            </div>`;

const replacementStr = `                                </script>
                            </div>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync('public/admin.html', content, 'utf8');
    console.log('Fixed DOM structure in admin.html');
} else {
    console.log('Could not find the target string');
}
