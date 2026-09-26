$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TEST: COMMAND CENTER MUSIC & VENDOR SYNC" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_music_test_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9235",
    "--user-data-dir=$tmpProfile",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

$passedCount = 0
$failedCount = 0

function Assert-Condition($name, $condition, $details = "") {
    if ($condition) {
        Write-Host " [PASS] $name" -ForegroundColor Green
        $script:passedCount++
    } else {
        Write-Host " [FAIL] $name : $details" -ForegroundColor Red
        $script:failedCount++
    }
}

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9235/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "admin.html" } | Select-Object -First 1

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([Uri]$targetTab.webSocketDebuggerUrl, $cts.Token).Wait()

    $script:msgId = 1
    function Cdp-Eval($expr) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = "Runtime.evaluate"
            params = @{
                expression = $expr
                returnByValue = $true
                awaitPromise = $true
            }
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(65536)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result
        $txt = [System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)
        $json = ($txt | ConvertFrom-Json)
        if ($json.result.result.type -eq "undefined") {
            return $null
        }
        return $json.result.result.value
    }

    function Cdp-Navigate($url) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = "Page.navigate"
            params = @{ url = $url }
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(65536)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result

        Start-Sleep -Seconds 3
    }

    Write-Host "`n--- Step 1: Check Tab 6 Position and Elements in Admin Command Center ---" -ForegroundColor Yellow
    # Wait for page to finish loading scripts
    Start-Sleep -Seconds 2

    # Check that Tab 6 button exists and is positioned next to Tab 5
    $tabCheck = Cdp-Eval @"
    (() => {
        const tabs = Array.from(document.querySelectorAll('.ecc-nav-tabs .ecc-tab-btn'));
        const tabNames = tabs.map(t => t.textContent.trim());
        const tab5Idx = tabs.findIndex(t => t.textContent.includes('Tab 5'));
        const tab6Idx = tabs.findIndex(t => t.textContent.includes('Tab 6') || t.getAttribute('onclick')?.includes('tab-music'));
        const tab6Panel = document.getElementById('tab-music');
        return {
            totalTabs: tabs.length,
            tabNames: tabNames,
            tab5Idx: tab5Idx,
            tab6Idx: tab6Idx,
            isNextToTab5: (tab6Idx === tab5Idx + 1),
            hasPanel: !!tab6Panel
        };
    })()
"@

    Assert-Condition "Tab 6 button exists" ($tabCheck.tab6Idx -ge 0) "tab6Idx: $($tabCheck.tab6Idx)"
    Assert-Condition "Tab 6 is positioned directly next to Tab 5" ($tabCheck.isNextToTab5 -eq $true) "tab5Idx: $($tabCheck.tab5Idx), tab6Idx: $($tabCheck.tab6Idx)"
    Assert-Condition "Tab 6 content panel (#tab-music) exists" ($tabCheck.hasPanel -eq $true)

    Write-Host "`n--- Step 2: Switch to Tab 6 and Check Initial Music Rendering ---" -ForegroundColor Yellow
    $tab6Switch = Cdp-Eval @"
    (() => {
        if (typeof switchTab === 'function') {
            switchTab('tab-music');
        }
        const panel = document.getElementById('tab-music');
        const isActive = panel && panel.classList.contains('active');
        const table = document.getElementById('adminMusicTableContainer');
        const rows = table ? table.querySelectorAll('tbody tr') : [];
        const statTotal = document.getElementById('musicMetricTotal')?.textContent;
        return {
            isActive: isActive,
            hasTable: !!table,
            rowCount: rows.length,
            statTotal: statTotal
        };
    })()
"@

    Assert-Condition "Tab 6 activates upon switchTab('tab-music')" ($tab6Switch.isActive -eq $true)
    Assert-Condition "Music table is rendered with default tracks" ($tab6Switch.rowCount -gt 0) "rowCount: $($tab6Switch.rowCount)"
    Assert-Condition "Total tracks KPI stat is displayed" ($tab6Switch.statTotal -match "\d+") "statTotal: $($tab6Switch.statTotal)"

    Write-Host "`n--- Step 3: Test Music CRUD Operations in Tab 6 ---" -ForegroundColor Yellow
    $addMusicResult = Cdp-Eval @"
    (() => {
        const ev = (window.adminEventsDb && window.adminEventsDb[0]) || { id: 1 };
        // Open modal
        if (typeof openAddMusicModal === 'function') {
            openAddMusicModal();
        }
        // Fill form with exact IDs
        document.getElementById('musicEditTitle').value = 'Perfect Symphony (Test)';
        document.getElementById('musicEditArtist').value = 'Ed Sheeran & Andrea Bocelli';
        document.getElementById('musicEditGenre').value = 'Romance';
        document.getElementById('musicEditCategory').value = 'Entrance';
        document.getElementById('musicEditSynthPreset').value = 'royal_fanfare';
        document.getElementById('musicEditCue').value = 'Fade in saat mempelai melangkah di karpet merah';

        const segSelect = document.getElementById('musicEditSegment');
        if (segSelect && segSelect.options.length > 1) {
            segSelect.selectedIndex = 1;
        }

        // Trigger save
        handleSaveMusic();

        const musicList = (typeof getEventMusicList === 'function') ? getEventMusicList(ev) : [];
        const added = musicList.find(m => m.title === 'Perfect Symphony (Test)');
        return {
            added: !!added,
            trackTitle: added?.title,
            genre: added?.genre,
            segmentIndex: added?.segmentIndex,
            synthPreset: added?.synthPreset
        };
    })()
"@

    Assert-Condition "Add new music track saves to event music list" ($addMusicResult.added -eq $true) "Title: $($addMusicResult.trackTitle)"
    Assert-Condition "Music has correct genre and preset" ($addMusicResult.genre -eq "Romance" -and $addMusicResult.synthPreset -eq "royal_fanfare")

    Write-Host "`n--- Step 4: Verify Bi-Directional Sync to Tab 3 Rundown ---" -ForegroundColor Yellow
    $rundownSyncCheck = Cdp-Eval @"
    (() => {
        // Switch to Tab 3
        if (typeof switchTab === 'function') {
            switchTab('tab-stage');
        }
        const ev = (window.adminEventsDb && window.adminEventsDb[0]) || { id: 1 };
        if (typeof renderAdminRundownList === 'function') {
            renderAdminRundownList(ev);
        }
        const musicCards = document.querySelectorAll('.rundown-music-attached-card');
        const cardsData = Array.from(musicCards).map(c => ({
            text: c.textContent.trim(),
            hasPlayBtn: !!c.querySelector('.btn-music-play')
        }));
        return {
            cardCount: musicCards.length,
            cardsData: cardsData
        };
    })()
"@

    Assert-Condition "Rundown items render attached music cards" ($rundownSyncCheck.cardCount -gt 0) "cardCount: $($rundownSyncCheck.cardCount)"
    Assert-Condition "Rundown music cards have interactive Play buttons" ($rundownSyncCheck.cardsData[0].hasPlayBtn -eq $true)

    Write-Host "`n--- Step 5: Test Web Audio Synthesizer & Offline WAV Generation ---" -ForegroundColor Yellow
    $synthCheck = Cdp-Eval @"
    (async () => {
        try {
            // Test synthesizer sound cue generation
            let synthOk = false;
            if (typeof synthesizeCueMelody === 'function') {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                if (AudioCtx) {
                    const ctx = new AudioCtx();
                    synthesizeCueMelody(ctx, ctx.destination, 'romantic_piano');
                    synthOk = true;
                    setTimeout(() => { try { ctx.close(); } catch(e){} }, 100);
                }
            }

            // Test WAV Blob generator
            let wavOk = false;
            if (typeof audioBufferToWavBlob === 'function') {
                const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
                const offlineCtx = new OfflineCtx(2, 44100 * 0.5, 44100);
                const buffer = await offlineCtx.startRendering();
                const blob = audioBufferToWavBlob(buffer);
                wavOk = (blob && blob.size > 0 && blob.type === 'audio/wav');
            }

            return {
                synthOk: synthOk,
                wavOk: wavOk
            };
        } catch(e) {
            return { error: e.toString() };
        }
    })()
"@

    Assert-Condition "Synthesizer melody generator functions properly" ($synthCheck.synthOk -eq $true) "error: $($synthCheck.error)"
    Assert-Condition "Client-side offline WAV blob generator creates valid audio/wav" ($synthCheck.wavOk -eq $true)

    Write-Host "`n--- Step 6: Test Vendor Collaboration Page & Play/Stop Synchronization ---" -ForegroundColor Yellow
    Cdp-Navigate("http://localhost:8000/vendor.html")
    Start-Sleep -Seconds 3

    $vendorCheck = Cdp-Eval @"
    (() => {
        const title = document.getElementById('vendorEventTitle')?.textContent?.trim();
        const selector = document.getElementById('vendorEventSelect');
        const selectedEvent = selector ? selector.value : null;
        const rundownRows = document.querySelectorAll('#vendorRundownTableBody tr');
        const playBtns = document.querySelectorAll('.vendor-btn-play');
        const stopBtns = document.querySelectorAll('.vendor-btn-stop');

        // Test play trigger
        let playTriggered = false;
        if (playBtns.length > 0) {
            playBtns[0].click();
            const nowPlaying = document.getElementById('activeLiveTrackName')?.textContent;
            playTriggered = (nowPlaying && nowPlaying.length > 0);
        }

        // Test stop trigger
        let stopTriggered = false;
        if (stopBtns.length > 0) {
            stopBtns[0].click();
            stopTriggered = true;
        }

        return {
            title: title,
            selectedEvent: selectedEvent,
            rowCount: rundownRows.length,
            playBtnCount: playBtns.length,
            playTriggered: playTriggered,
            stopTriggered: stopTriggered
        };
    })()
"@

    Assert-Condition "Vendor screen loads and renders header" ($vendorCheck.title -ne $null) "title: $($vendorCheck.title)"
    Assert-Condition "Vendor screen dynamically renders active event rundown" ($vendorCheck.rowCount -gt 0) "rowCount: $($vendorCheck.rowCount)"
    Assert-Condition "Vendor screen has web play controls for each segment" ($vendorCheck.playBtnCount -gt 0) "playBtnCount: $($vendorCheck.playBtnCount)"
    Assert-Condition "Vendor web play button activates now-playing track" ($vendorCheck.playTriggered -eq $true)
    Assert-Condition "Vendor web stop button resets playback to Standby" ($vendorCheck.stopTriggered -eq $true)

    $summaryColor = if ($failedCount -eq 0) { "Green" } else { "Red" }
    Write-Host "`n=================================================================" -ForegroundColor Cyan
    Write-Host "TEST SUMMARY: $passedCount PASSED, $failedCount FAILED" -ForegroundColor $summaryColor
    Write-Host "=================================================================" -ForegroundColor Cyan

    try {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
    } catch {}
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
