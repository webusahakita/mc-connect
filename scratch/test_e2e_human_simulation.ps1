$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "RUNNING FULL HUMAN SIMULATION E2E TEST FOR BGM CONTROLS" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9231",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--autoplay-policy=no-user-gesture-required",
    "http://localhost:8000/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9231/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "index.html" } | Select-Object -First 1

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([Uri]$targetTab.webSocketDebuggerUrl, $cts.Token).Wait()

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
        return $json.result.result.value
    }

    $script:msgId = 1
    $totalPass = 0
    $totalFail = 0

    function Assert-Test($name, $condition, $details = "") {
        if ($condition) {
            Write-Host " [PASS] $name" -ForegroundColor Green
            if ($details) { Write-Host "        $details" -ForegroundColor DarkGray }
            $script:totalPass++
        } else {
            Write-Host " [FAIL] $name" -ForegroundColor Red
            if ($details) { Write-Host "        $details" -ForegroundColor Yellow }
            $script:totalFail++
        }
    }

    # Step 1: Click Play
    $r1 = Cdp-Eval @"
(() => {
    document.getElementById('bgmDedicatedPlayBtn').click();
    return {
        isPlaying: window.luxuryBgm.isPlaying,
        animating: document.getElementById('bgmVisualizer').classList.contains('animating'),
        status: document.getElementById('bgmStatusText').textContent
    };
})()
"@
    Assert-Test "1. Klik '▶ Putar Musik'" ($r1.isPlaying -and $r1.animating) "Status: $($r1.status)"

    # Step 2: Step Volume Down (-)
    $r2 = Cdp-Eval @"
(() => {
    const btnDown = document.querySelector('.bgm-volume-slider-row button:first-child');
    btnDown.click(); // -10% -> 40%
    btnDown.click(); // -10% -> 30%
    return {
        vol: window.luxuryBgm.volume,
        label: document.getElementById('bgmVolumeLabel').textContent,
        slider: document.getElementById('bgmVolumeSlider').value
    };
})()
"@
    Assert-Test "2. Klik Tombol '🔉 -' Dua Kali" ($r2.vol -eq 0.3 -and $r2.label -eq '30%' -and $r2.slider -eq '30') "Vol: $($r2.vol), Label: $($r2.label)"

    # Step 3: Step Volume Up (+)
    $r3 = Cdp-Eval @"
(() => {
    const btnUp = document.querySelector('.bgm-volume-slider-row button:last-child');
    btnUp.click(); // +10% -> 40%
    btnUp.click(); // +10% -> 50%
    btnUp.click(); // +10% -> 60%
    return {
        vol: window.luxuryBgm.volume,
        label: document.getElementById('bgmVolumeLabel').textContent,
        slider: document.getElementById('bgmVolumeSlider').value
    };
})()
"@
    Assert-Test "3. Klik Tombol '+ 🔊' Tiga Kali" ($r3.vol -eq 0.6 -and $r3.label -eq '60%' -and $r3.slider -eq '60') "Vol: $($r3.vol), Label: $($r3.label)"

    # Step 4: Preset Button 75%
    $r4 = Cdp-Eval @"
(() => {
    document.querySelector('.bgm-preset-btn[data-pct="75"]').click();
    return {
        vol: window.luxuryBgm.volume,
        label: document.getElementById('bgmVolumeLabel').textContent,
        activeClass: document.querySelector('.bgm-preset-btn[data-pct="75"]').classList.contains('active')
    };
})()
"@
    Assert-Test "4. Klik Tombol Preset '75%'" ($r4.vol -eq 0.75 -and $r4.label -eq '75%' -and $r4.activeClass) "Label: $($r4.label), Active: $($r4.activeClass)"

    # Step 5: Switch to Gala Lounge
    $r5 = Cdp-Eval @"
(() => {
    document.querySelector('.bgm-track-pill[data-track="gala"]').click();
    return {
        track: window.luxuryBgm.currentTrack,
        selectVal: document.getElementById('bgmTrackSelect').value,
        pillActive: document.querySelector('.bgm-track-pill[data-track="gala"]').classList.contains('active'),
        status: document.getElementById('bgmStatusText').textContent
    };
})()
"@
    Assert-Test "5. Klik Pilihan Musik '🍸 Gala Lounge'" ($r5.track -eq 'gala' -and $r5.selectVal -eq 'gala' -and $r5.pillActive) "Status: $($r5.status)"

    # Step 6: Switch to Sunset Vibe
    $r6 = Cdp-Eval @"
(() => {
    document.querySelector('.bgm-track-pill[data-track="acoustic"]').click();
    return {
        track: window.luxuryBgm.currentTrack,
        selectVal: document.getElementById('bgmTrackSelect').value,
        pillActive: document.querySelector('.bgm-track-pill[data-track="acoustic"]').classList.contains('active'),
        status: document.getElementById('bgmStatusText').textContent
    };
})()
"@
    Assert-Test "6. Klik Pilihan Musik '✨ Sunset Vibe'" ($r6.track -eq 'acoustic' -and $r6.selectVal -eq 'acoustic' -and $r6.pillActive) "Status: $($r6.status)"

    # Step 7: Switch back to Wedding Romance
    $r7 = Cdp-Eval @"
(() => {
    document.querySelector('.bgm-track-pill[data-track="wedding"]').click();
    return {
        track: window.luxuryBgm.currentTrack,
        selectVal: document.getElementById('bgmTrackSelect').value,
        pillActive: document.querySelector('.bgm-track-pill[data-track="wedding"]').classList.contains('active'),
        status: document.getElementById('bgmStatusText').textContent
    };
})()
"@
    Assert-Test "7. Klik Pilihan Musik '💍 Wedding'" ($r7.track -eq 'wedding' -and $r7.selectVal -eq 'wedding' -and $r7.pillActive) "Status: $($r7.status)"

    # Step 8: Click Matikan Musik
    $r8 = Cdp-Eval @"
(() => {
    document.getElementById('bgmDedicatedStopBtn').click();
    return {
        isPlaying: window.luxuryBgm.isPlaying,
        animating: document.getElementById('bgmVisualizer').classList.contains('animating'),
        activeCount: window.luxuryBgm.activeNodes.length,
        status: document.getElementById('bgmStatusText').textContent
    };
})()
"@
    Assert-Test "8. Klik '⏹ Matikan Musik'" ((-not $r8.isPlaying) -and (-not $r8.animating) -and ($r8.activeCount -eq 0)) "Status: $($r8.status)"

    # Step 9: Preset 0% (Mute)
    $r9 = Cdp-Eval @"
(() => {
    document.querySelector('.bgm-preset-btn[data-pct="0"]').click();
    return {
        isMuted: window.luxuryBgm.isMuted,
        label: document.getElementById('bgmVolumeLabel').textContent,
        muteIcon: document.getElementById('bgmMuteIcon').textContent
    };
})()
"@
    Assert-Test "9. Klik Preset '0% (Mute)'" ($r9.isMuted -and $r9.label -eq '0%') "Label: $($r9.label), Icon: $($r9.muteIcon)"

    # Step 10: Toggle Mute to Unmute
    $r10 = Cdp-Eval @"
(() => {
    document.getElementById('bgmMuteBtn').click(); // Unmute
    return {
        isMuted: window.luxuryBgm.isMuted,
        vol: window.luxuryBgm.volume,
        label: document.getElementById('bgmVolumeLabel').textContent,
        muteIcon: document.getElementById('bgmMuteIcon').textContent
    };
})()
"@
    Assert-Test "10. Klik Tombol Mute untuk Unmute" ((-not $r10.isMuted) -and $r10.vol -gt 0 -and $r10.label -ne '0%') "Vol: $($r10.vol), Label: $($r10.label), Icon: $($r10.muteIcon)"

    # Step 11: Showreel Iframe Isolation (Anti-leak)
    $r11 = Cdp-Eval @"
(() => {
    const initial = document.getElementById('showreelIframe').getAttribute('src');
    openShowreelModal();
    const opened = document.getElementById('showreelIframe').getAttribute('src');
    closeModals();
    const closed = document.getElementById('showreelIframe').getAttribute('src');
    return { initial, opened, closed };
})()
"@
    Assert-Test "11. Isolasi YouTube Showreel Modal" ($r11.initial -eq "" -and $r11.opened.Contains("autoplay=1") -and $r11.closed -eq "") "Open: $($r11.opened), Closed: '$($r11.closed)'"

    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "TOTAL PASSED: $totalPass / $($totalPass + $totalFail)" -ForegroundColor Green
    if ($totalFail -gt 0) {
        Write-Host "TOTAL FAILED: $totalFail" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "ALL 11 REAL USER INTERACTION FLOWS ARE WORKING 100%! 🎉" -ForegroundColor Green
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Test exception: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
