const fs = require('fs');

let code = fs.readFileSync('public/stage.html', 'utf8');

// Fix the audio player src logic to handle file_upload paths like vendor.html does
code = code.replace(/if \(musicFound && \(musicFound\.file_upload \|\| musicFound\.url_link\)\) \{[\s\S]*?if \(audioPlayer\) audioPlayer\.src = musicFound\.file_upload \|\| musicFound\.url_link;[\s\S]*?\}/g, `if (musicFound) {
                                playBtn.dataset.found = 'true';
                                
                                let src = musicFound.url_link || '';
                                if (!src && musicFound.file_upload) {
                                    if (String(musicFound.file_upload).startsWith('uploads/')) src = '/' + musicFound.file_upload;
                                    else if (String(musicFound.file_upload).startsWith('/uploads/')) src = musicFound.file_upload;
                                    else src = '/uploads/music/' + musicFound.file_upload;
                                }
                                
                                if (src && audioPlayer) {
                                    audioPlayer.src = src;
                                    playBtn.dataset.hasAudio = 'true';
                                } else {
                                    playBtn.dataset.hasAudio = 'false';
                                }
                            }`);

// Fix the playSegmentMusic to check hasAudio
code = code.replace(/if \(btn && btn\.dataset\.found === 'false'\) \{[\s\S]*?alert\("Lagu tidak ditemukan di master bank musik\. Harap pastikan judul lagu persis \(misal: 'Lagu upload'\)\."\);[\s\S]*?return;[\s\S]*?\}/g, `if (btn && btn.dataset.found === 'false') {
                alert("Lagu tidak ditemukan di data acara. Pastikan lagu sudah ditambahkan ke Segmen Rundown ini melalui Command Center.");
                return;
            }
            if (btn && btn.dataset.hasAudio === 'false') {
                alert("Lagu ditemukan, tetapi file audio (.mp3/.wav) atau Link URL belum diatur. Silakan upload file audio di Master Bank Musik terlebih dahulu.");
                return;
            }`);

fs.writeFileSync('public/stage.html', code, 'utf8');
console.log('Successfully patched stage.html');
