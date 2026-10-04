
        let activeEventId = null;
        try {
            const stored = localStorage.getItem('activeCommandCenterEventId');
            if (stored) activeEventId = stored;
        } catch(e) {}

        let rundownItems = [];
        let currentEventData = null;

        document.addEventListener('DOMContentLoaded', async () => {
            if (window.teleprompter && typeof window.teleprompter.init === 'function') {
                window.teleprompter.init('prompterViewport', 'prompterTextContainer');
            }
            startClock();
            
            await fetchEventData();
            
            loadStageSoundboard();
            loadSegment(0);
            setupTouchGestures();
        });

        window.playSegmentMusic = function() {
            const btn = document.getElementById('prompterPlayMusicBtn');
            if (btn && btn.dataset.found === 'false') {
                alert("Lagu tidak ditemukan di master bank musik. Harap pastikan judul lagu persis (misal: 'Lagu upload').");
                return;
            }
            
            const player = document.getElementById('segmentAudioPlayer');
            if (!player || !player.src) {
                alert("Tidak ada sumber audio yang valid.");
                return;
            }
            
            if (player.paused) {
                player.play().then(() => {
                    if(btn) btn.innerHTML = '⏸ Jeda Lagu';
                }).catch(err => {
                    console.error("Gagal memutar audio:", err);
                    alert("Gagal memutar lagu. Browser mungkin memblokir auto-play.");
                });
            } else {
                player.pause();
                if(btn) btn.innerHTML = '▶ Putar Lagu';
            }
        };

        async function fetchEventData() {
            try {
                const res = await fetch('/api/cms/events');
                const json = await res.json();
                
                if (json.success && json.data) {
                    let ev = json.data.find(e => String(e.id) === String(activeEventId));
                    if (!ev && json.data.length > 0) ev = json.data[0];
                    if (ev) {
                        window.currentEventData = ev;
                        
                        const titleEl = document.getElementById('stageEventTitleInfo');
                        if (titleEl) {
                            let eventName = ev.title || 'Acara';
                            let picName = ev.pic || '';
                            const m = picName.match(/(.*?)\s*\(/);
                            if (m) picName = m[1].trim();
                            titleEl.textContent = eventName + (picName ? ' | PIC: ' + picName : '');
                        }
                        
                        const dbRundown = ev.rundown || (ev.metadata && ev.metadata.rundown) || [];
                        if (dbRundown.length > 0) {
                            rundownItems = dbRundown.map((item, i) => ({
                                urutan: i + 1,
                                judul_segmen: item.title,
                                naskah_prompter: item.prompter || item.script,
                                instruksi_musik: item.cue_music || item.musicTitle ? (item.cue_music || item.musicTitle) : '',
                                startTime: item.start_time || item.startTime || '',
                                endTime: item.end_time || item.endTime || '',
                                duration: item.duration || '',
                                pic: item.pic || ''
                            }));
                        } else {
                            rundownItems = [];
                        }
                    }
                }
            } catch (err) {
                console.error('Gagal fetch database:', err);
            }

            if (rundownItems.length === 0) {
                rundownItems = [{
                    urutan: 1,
                    judul_segmen: 'Belum Ada Rundown',
                    naskah_prompter: 'Rundown belum diset di Command Center. Harap tambahkan segmen terlebih dahulu.',
                    instruksi_musik: '',
                    startTime: '', endTime: ''
                }];
            }
        }

        function loadSegment(index) {
            if (index < 0 || index >= rundownItems.length) return;
            currentIndex = index;
            const item = rundownItems[index];

            // 1. Current Active Segment
            const badgeEl = document.getElementById('currentSegmentBadge');
            if (badgeEl) {
                badgeEl.textContent = `Segmen ${item.urutan}/${rundownItems.length}: ${item.judul_segmen}`;
            }

            const scriptEl = document.getElementById('prompterActiveScript');
            if (scriptEl) {
                scriptEl.textContent = item.naskah_prompter || '— Tanpa naskah prompter —';
            }
            
            const picHint = document.getElementById('prompterPicHint');
            if (picHint) {
                if (item.pic) {
                    picHint.style.display = 'block';
                    picHint.textContent = '👤 PIC: ' + item.pic;
                } else {
                    picHint.style.display = 'none';
                }
            }

            const musicHint = document.getElementById('prompterMusicHint');
            const playBtn = document.getElementById('prompterPlayMusicBtn');
            const audioPlayer = document.getElementById('segmentAudioPlayer');
            
            // Hentikan lagu sebelumnya jika pindah segmen
            if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
                if(playBtn) playBtn.innerHTML = '▶ Putar Lagu';
            }

            if (musicHint) {
                if (item.instruksi_musik) {
                    musicHint.style.display = 'block';
                    const cueText = item.instruksi_musik.startsWith('🎵') || item.instruksi_musik.startsWith('🎺') || item.instruksi_musik.startsWith('🍾') || item.instruksi_musik.startsWith('🎸') || item.instruksi_musik.startsWith('🥁') || item.instruksi_musik.startsWith('🎻')
                        ? item.instruksi_musik
                        : '🎵 ' + item.instruksi_musik;
                    musicHint.textContent = 'Music Cue: ' + cueText;
                    
                    // Selalu tampilkan tombol jika ada instruksi_musik
                    if (playBtn) {
                        playBtn.style.display = 'flex';
                        playBtn.dataset.found = 'false';
                        if (audioPlayer) audioPlayer.removeAttribute('src');
                        
                        if (window.currentEventData) {
                            const mList = window.currentEventData.musicList || (window.currentEventData.metadata && window.currentEventData.metadata.musicList) || [];
                            const trimName = (name) => name ? String(name).trim().toLowerCase() : '';
                            const cleanCue = trimName(item.instruksi_musik).replace(/^[🎵🎺🍾🎸🥁🎻]\s*/, '');
                            const musicFound = mList.find(m => trimName(m.title) === cleanCue || trimName(m.cue_instruction) === cleanCue);
                            
                            if (musicFound && (musicFound.file_upload || musicFound.url_link)) {
                                playBtn.dataset.found = 'true';
                                if (audioPlayer) audioPlayer.src = musicFound.file_upload || musicFound.url_link;
                            }
                        }
                    }
                } else {
                    musicHint.style.display = 'none';
                    if (playBtn) playBtn.style.display = 'none';
                }
            }

            // 2. SEBELUM SEGMEN (Previous Segment Anticipation)
            const prevItem = index > 0 ? rundownItems[index - 1] : null;
            const boxPrev = document.getElementById('boxPrevSegment');
            const prevTitleEl = document.getElementById('prevSegmentTitle');
            const prevTimeEl = document.getElementById('prevSegmentTime');
            const prevCueEl = document.getElementById('prevSegmentCue');
            const btnTopPrev = document.getElementById('btnTopPrev');
            const btnSidePrev = document.getElementById('btnSidePrev');

            if (prevItem) {
                if (boxPrev) {
                    boxPrev.style.opacity = '1';
                    boxPrev.style.cursor = 'pointer';
                }
                if (prevTitleEl) prevTitleEl.textContent = `Segmen ${prevItem.urutan}: ${prevItem.judul_segmen}`;
                if (prevTimeEl) prevTimeEl.textContent = (prevItem.startTime && prevItem.endTime) ? `${prevItem.startTime} - ${prevItem.endTime}` : (prevItem.duration || 'Selesai');
                if (prevCueEl) prevCueEl.textContent = prevItem.instruksi_musik || 'Segmen telah selesai';
                if (btnTopPrev) btnTopPrev.disabled = false;
                if (btnSidePrev) btnSidePrev.disabled = false;
            } else {
                if (boxPrev) {
                    boxPrev.style.opacity = '0.5';
                    boxPrev.style.cursor = 'default';
                }
                if (prevTitleEl) prevTitleEl.textContent = '— Awal Acara —';
                if (prevTimeEl) prevTimeEl.textContent = item.startTime || 'Start';
                if (prevCueEl) prevCueEl.textContent = 'Tidak ada segmen sebelumnya';
                if (btnTopPrev) btnTopPrev.disabled = true;
                if (btnSidePrev) btnSidePrev.disabled = true;
            }

            // 3. SESUDAH SEGMEN (Next Segment Anticipation)
            const nextItem = index < rundownItems.length - 1 ? rundownItems[index + 1] : null;
            const boxNext = document.getElementById('boxNextSegment');
            const nextTitleEl = document.getElementById('nextSegmentTitle');
            const nextTimeEl = document.getElementById('nextSegmentTime');
            const nextCueEl = document.getElementById('nextSegmentCue');
            const nextPeekEl = document.getElementById('nextSegmentPeek');
            const btnTopNext = document.getElementById('btnTopNext');
            const btnSideNext = document.getElementById('btnSideNext');

            // In-Viewport Next Up Card Elements
            const nextCard = document.getElementById('prompterNextUpCard');
            const nextBadge = document.getElementById('prompterNextBadge');
            const nextHeading = document.getElementById('prompterNextHeading');
            const nextCardCue = document.getElementById('prompterNextCue');
            const nextPreview = document.getElementById('prompterNextPreview');

            // Sidebar Elements
            const sideNextTitle = document.getElementById('sideNextTitle');
            const sideNextCue = document.getElementById('sideNextCue');

            if (nextItem) {
                if (boxNext) {
                    boxNext.style.opacity = '1';
                    boxNext.style.cursor = 'pointer';
                }
                const timeStr = (nextItem.startTime && nextItem.endTime) ? `${nextItem.startTime} - ${nextItem.endTime}` : (nextItem.duration || 'Berikutnya');
                if (nextTitleEl) nextTitleEl.textContent = `Segmen ${nextItem.urutan}/${rundownItems.length}: ${nextItem.judul_segmen}`;
                if (nextTimeEl) nextTimeEl.textContent = timeStr;
                if (nextCueEl) nextCueEl.textContent = nextItem.instruksi_musik ? `🎵 Music Cue: ${nextItem.instruksi_musik}` : '—';
                
                const peekText = nextItem.naskah_prompter 
                    ? `"${nextItem.naskah_prompter.slice(0, 85)}${nextItem.naskah_prompter.length > 85 ? '...' : ''}"` 
                    : '— Tanpa naskah —';
                if (nextPeekEl) nextPeekEl.textContent = peekText;

                if (btnTopNext) btnTopNext.disabled = false;
                if (btnSideNext) btnSideNext.disabled = false;

                // In-viewport Next Card
                if (nextCard) {
                    nextCard.style.display = 'block';
                    nextCard.style.cursor = 'pointer';
                }
                if (nextBadge) nextBadge.textContent = `⚡ ANTISIPASI BERIKUTNYA: SEGMEN ${nextItem.urutan} DARI ${rundownItems.length}`;
                if (nextHeading) nextHeading.textContent = nextItem.judul_segmen;
                if (nextCardCue) nextCardCue.textContent = nextItem.instruksi_musik ? `Music Cue: ${nextItem.instruksi_musik}` : '';
                if (nextPreview) nextPreview.textContent = peekText;

                // Sidebar
                if (sideNextTitle) sideNextTitle.textContent = nextItem.judul_segmen;
                if (sideNextCue) sideNextCue.textContent = nextItem.instruksi_musik || 'Siap untuk segmen berikutnya';
            } else {
                // Finale Segment
                if (boxNext) {
                    boxNext.style.opacity = '0.75';
                    boxNext.style.cursor = 'default';
                }
                if (nextTitleEl) nextTitleEl.textContent = '🏁 Segmen Terakhir (Grand Finale)';
                if (nextTimeEl) nextTimeEl.textContent = 'Selesai';
                if (nextCueEl) nextCueEl.textContent = 'Seluruh segmen acara tuntas';
                if (nextPeekEl) nextPeekEl.textContent = 'Terima kasih atas penampilan luar biasa!';

                if (btnTopNext) btnTopNext.disabled = true;
                if (btnSideNext) btnSideNext.disabled = true;

                // In-viewport Card Finale
                if (nextCard) nextCard.style.cursor = 'default';
                if (nextBadge) nextBadge.textContent = '🏁 SEGMEN PENUTUP';
                if (nextHeading) nextHeading.textContent = 'Selamat! Anda Berada di Segmen Penutup Rundown';
                if (nextCardCue) nextCardCue.textContent = '🎉 Grand Finale / Outro';
                if (nextPreview) nextPreview.textContent = 'Seluruh rangkaian segmen rundown telah terlaksana dengan sukses.';

                if (sideNextTitle) sideNextTitle.textContent = '🏁 Selesai (Grand Finale)';
                if (sideNextCue) sideNextCue.textContent = 'Tidak ada segmen selanjutnya';
            }

            // 4. Update Sidebar Progress
            const progPercent = Math.round(((index + 1) / rundownItems.length) * 100);
            const stageNavProgress = document.getElementById('stageNavProgress');
            if (stageNavProgress) stageNavProgress.textContent = `${index + 1} / ${rundownItems.length} (${progPercent}%)`;
            const stageProgressBar = document.getElementById('stageProgressBar');
            if (stageProgressBar) stageProgressBar.style.width = `${progPercent}%`;

            // 5. Reset Prompter Scroll to Top
            const vp = document.getElementById('prompterViewport');
            if (vp) vp.scrollTop = 0;

            // 6. Reset & Start Stopwatch
            resetStopwatch();
            startStopwatch();

            // 7. Broadcast to Vendor Music Screen via LiveSync
            if (window.liveSync && typeof window.liveSync.syncActiveSegment === 'function') {
                window.liveSync.syncActiveSegment(activeEventId, index + 1, item.judul_segmen, item.instruksi_musik);
            }
        }

        function nextSegment() {
            if (currentIndex < rundownItems.length - 1) {
                loadSegment(currentIndex + 1);
            } else {
                alert('Ini adalah segmen penutup terakhir dari rundown!');
            }
        }

        function prevSegment() {
            if (currentIndex > 0) {
                loadSegment(currentIndex - 1);
            }
        }

        function toggleAutoScroll() {
            if (!window.teleprompter) return;
            const isScrolling = window.teleprompter.toggleScroll();
            const btn = document.getElementById('btnScrollToggle');
            if (btn) {
                if (isScrolling) {
                    btn.textContent = '⏸ Pause Scroll';
                    btn.style.background = '#EF4444';
                    btn.style.color = '#FFF';
                } else {
                    btn.textContent = '▶ Auto-Scroll';
                    btn.style.background = 'var(--gold-primary)';
                    btn.style.color = '#000';
                }
            }
        }

        function toggleVoiceMode() {
            if (!window.teleprompter) return;
            const active = window.teleprompter.toggleVoiceMode();
            const btn = document.getElementById('btnVoiceToggle');
            if (btn) btn.classList.toggle('active', active);
        }

        function toggleMirrorMode() {
            if (!window.teleprompter) return;
            const isMirror = window.teleprompter.toggleMirror();
            const btn = document.getElementById('btnMirrorToggle');
            if (btn) btn.classList.toggle('active', isMirror);
        }

        let stageSoundboardList = [];

        function loadStageSoundboard() {
            try {
                const raw = localStorage.getItem(`ecc_soundboard_${activeEventId}`);
                if (raw) {
                    const parsed = JSON.parse(raw);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        stageSoundboardList = parsed;
                    }
                }
            } catch(e) {}

            if (!stageSoundboardList || stageSoundboardList.length === 0) {
                stageSoundboardList = [
                    { id: 'sb_1', name: 'Applause', icon: '👏', preset: 'applause', key: '1', volume: 80, enabled: true },
                    { id: 'sb_2', name: 'Drum Roll', icon: '🥁', preset: 'drumroll', key: '2', volume: 85, enabled: true },
                    { id: 'sb_3', name: 'Fanfare', icon: '🎺', preset: 'fanfare', key: '3', volume: 90, enabled: true },
                    { id: 'sb_4', name: 'Chime / Ding', icon: '🔔', preset: 'ding', key: '4', volume: 75, enabled: true },
                    { id: 'sb_5', name: 'Buzzer', icon: '🚨', preset: 'buzzer', key: '5', volume: 80, enabled: true },
                    { id: 'sb_6', name: 'Suspense', icon: '🎻', preset: 'suspense', key: '6', volume: 75, enabled: true }
                ];
            }

            renderStageSoundboard();
        }

        function renderStageSoundboard() {
            const grid = document.getElementById('stageSoundboardGrid');
            if (!grid) return;

            const activePads = stageSoundboardList.filter(item => item.enabled !== false);
            if (activePads.length === 0) {
                grid.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:1.5rem; color:var(--text-muted); font-size:0.85rem;">Soundboard dinonaktifkan untuk acara ini</div>';
                return;
            }

            grid.innerHTML = activePads.map((item, idx) => {
                const vol = (item.volume !== undefined ? item.volume : 80) / 100;
                let badgeHtml = '';
                if (item.sourceType === 'upload') {
                    badgeHtml = `<span style="position:absolute; bottom:3px; right:4px; font-size:0.55rem; color:#10B981; background:rgba(16,185,129,0.18); border:1px solid rgba(16,185,129,0.3); border-radius:3px; padding:0 3px;" title="Offline Audio File">📁</span>`;
                } else if (item.sourceType === 'link') {
                    badgeHtml = `<span style="position:absolute; bottom:3px; right:4px; font-size:0.55rem; color:#38BDF8; background:rgba(56,189,248,0.18); border:1px solid rgba(56,189,248,0.3); border-radius:3px; padding:0 3px;" title="Web Audio Link">🔗</span>`;
                }
                return `
                    <button class="sound-pad" id="stage-pad-${idx}" onclick="triggerStageSound(${idx}, this)" title="${item.name} (${item.sourceType === 'upload' ? 'File Offline' : item.sourceType === 'link' ? 'Web Link' : item.preset}) (Shortcut: ${item.key || '-'})" style="position:relative;">
                        ${item.key ? `<span style="position:absolute; top:4px; right:6px; font-size:0.68rem; font-family:monospace; color:var(--gold-primary); font-weight:800; background:rgba(0,0,0,0.5); padding:1px 4px; border-radius:3px;">[${item.key}]</span>` : ''}
                        <span class="sound-pad-icon">${item.icon || '⚡'}</span>
                        <span style="font-size:0.82rem; font-weight:700; line-height:1.2; text-align:center;">${item.name}</span>
                        ${badgeHtml}
                    </button>
                `;
            }).join('');
        }

        async function triggerStageSound(padIdx, btn) {
            const activePads = stageSoundboardList ? stageSoundboardList.filter(p => p.enabled !== false) : [];
            const item = activePads[padIdx];
            if (!item) return;

            const vol = (item.volume !== undefined ? item.volume : 80) / 100;
            if (window.soundboard) {
                if (typeof window.soundboard.triggerSoundboardItem === 'function') {
                    await window.soundboard.triggerSoundboardItem(item, vol);
                } else {
                    triggerSound(item.preset || 'ding', btn, vol);
                }
            }

            if (btn) {
                btn.classList.add('triggered');
                setTimeout(() => btn.classList.remove('triggered'), 220);
            }
        }

        function triggerSound(sound, btn, volume) {
            if (!window.soundboard) return;
            const vol = volume !== undefined ? volume : 0.8;
            if (typeof window.soundboard.playSound === 'function') {
                window.soundboard.playSound(sound, vol);
            } else {
                if (sound === 'applause') window.soundboard.playApplause(vol);
                if (sound === 'drumroll') window.soundboard.playDrumRoll(vol);
                if (sound === 'fanfare') window.soundboard.playFanfare(vol);
                if (sound === 'ding') window.soundboard.playDing(vol);
                if (sound === 'buzzer') window.soundboard.playBuzzer(vol);
                if (sound === 'suspense') window.soundboard.playSuspense(vol);
            }

            if (btn) {
                btn.classList.add('triggered');
                setTimeout(() => btn.classList.remove('triggered'), 220);
            }
        }

        function startClock() {
            setInterval(() => {
                const now = new Date();
                const timeStr = now.toTimeString().split(' ')[0];
                const clock = document.getElementById('stageDigitalClock');
                if (clock) clock.textContent = timeStr;
            }, 1000);
        }

        let stopwatchSeconds = 0;
        let stopwatchInterval = null;

        function startStopwatch() {
            if (stopwatchInterval) return;
            stopwatchInterval = setInterval(() => {
                stopwatchSeconds++;
                const h = String(Math.floor(stopwatchSeconds / 3600)).padStart(2, '0');
                const m = String(Math.floor((stopwatchSeconds % 3600) / 60)).padStart(2, '0');
                const s = String(stopwatchSeconds % 60).padStart(2, '0');
                const disp = document.getElementById('stageStopwatchDisplay');
                if (disp) disp.textContent = `${h}:${m}:${s}`;
            }, 1000);
        }

        function pauseStopwatch() {
            clearInterval(stopwatchInterval);
            stopwatchInterval = null;
        }

        function resetStopwatch() {
            pauseStopwatch();
            stopwatchSeconds = 0;
            const disp = document.getElementById('stageStopwatchDisplay');
            if (disp) disp.textContent = '00:00:00';
        }

        // Stage MC Keyboard Hotkeys
        window.addEventListener('keydown', (e) => {
            if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;

            if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
                e.preventDefault();
                prevSegment();
            } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
                e.preventDefault();
                nextSegment();
            } else if (e.code === 'Space') {
                if (document.activeElement?.tagName !== 'BUTTON') {
                    e.preventDefault();
                    toggleAutoScroll();
                }
            } else {
                // Soundboard hotkey triggers (e.g. key 1-9)
                if (stageSoundboardList && stageSoundboardList.length > 0) {
                    const activePads = stageSoundboardList.filter(p => p.enabled !== false);
                    const matchedPad = activePads.find(p => p.key && String(p.key).toUpperCase() === e.key.toUpperCase());
                    if (matchedPad) {
                        const padIdx = activePads.indexOf(matchedPad);
                        const btn = document.getElementById(`stage-pad-${padIdx}`);
                        triggerStageSound(padIdx, btn);
                    }
                }
            }
        });

        // Touch Swipe Gestures for Mobile & Tablets
        let touchStartX = 0;
        let touchEndX = 0;
        function setupTouchGestures() {
            const vp = document.getElementById('prompterViewport');
            if (!vp) return;

            vp.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            vp.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const deltaX = touchEndX - touchStartX;
                if (deltaX < -70) {
                    // Swiped Left -> Advance to next segment
                    nextSegment();
                } else if (deltaX > 70) {
                    // Swiped Right -> Return to prev segment
                    prevSegment();
                }
            }, { passive: true });
        }
    
        // === GIANT NAV LOGIC ===
        let currentNavLayout = 'split'; 

        function renderGiantNav() {
            const leftZone = document.getElementById('giantNavLeft');
            const rightZone = document.getElementById('giantNavRight');
            const btnHtmlPrev = `<button class="giant-nav-btn giant-btn-prev" id="btnSidePrev" onclick="prevSegment()">◀ SEBELUM</button>`;
            const btnHtmlNext = `<button class="giant-nav-btn giant-btn-next" id="btnSideNext" onclick="nextSegment()">BERIKUTNYA ▶</button>`;
            
            if(!leftZone || !rightZone) return;

            leftZone.innerHTML = '';
            rightZone.innerHTML = '';

            const layoutBtn = document.getElementById('btnNavLayout');

            if (currentNavLayout === 'split') {
                leftZone.innerHTML = btnHtmlPrev;
                rightZone.innerHTML = btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Split (Kiri/Kanan)';
            } else if (currentNavLayout === 'right') {
                rightZone.innerHTML = btnHtmlPrev + btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Semua Kanan';
            } else if (currentNavLayout === 'left') {
                leftZone.innerHTML = btnHtmlPrev + btnHtmlNext;
                if(layoutBtn) layoutBtn.innerHTML = '🎛️ Navigasi: Semua Kiri';
            }
        }

        window.cycleNavLayout = function() {
            if (currentNavLayout === 'split') currentNavLayout = 'right';
            else if (currentNavLayout === 'right') currentNavLayout = 'left';
            else currentNavLayout = 'split';
            
            localStorage.setItem('stageNavLayout', currentNavLayout);
            renderGiantNav();
        };

        document.addEventListener('DOMContentLoaded', () => {
            const saved = localStorage.getItem('stageNavLayout');
            if(saved) currentNavLayout = saved;
            renderGiantNav();
        });

        const origLoadSegment2 = window.loadSegment;
        window.loadSegment = function(idx) {
            origLoadSegment2(idx);
            
            setTimeout(() => {
                const sideNext = document.getElementById('btnSideNext');
                const sidePrev = document.getElementById('btnSidePrev');
                if(!window.currentEventData || !window.currentEventData.rundown) return;
                
                if (sidePrev) sidePrev.disabled = (idx === 0);
                if (sideNext) sideNext.disabled = (idx >= window.currentEventData.rundown.length - 1);
            }, 100); 
        }
        // =======================

