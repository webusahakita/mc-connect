$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=== VERIFYING ALL BGM CONTROLS, VOLUME BUTTONS, STOP, & TRACK CHOICES ===" -ForegroundColor Cyan

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9227",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--autoplay-policy=no-user-gesture-required",
    "http://localhost:8000/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9227/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "index.html" } | Select-Object -First 1

    if (-not $targetTab) {
        Write-Host "Target index.html tab not found!" -ForegroundColor Red
        exit 1
    }

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([Uri]$targetTab.webSocketDebuggerUrl, $cts.Token).Wait()

    function Send-CdpCommand($method, $params) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = $method
            params = $params
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(65536)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result
        $txt = [System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)
        return ($txt | ConvertFrom-Json)
    }

    function Eval-Js($expression) {
        $r = Send-CdpCommand "Runtime.evaluate" @{
            expression = $expression
            returnByValue = $true
        }
        return $r.result.result.value
    }

    $script:msgId = 1
    $allPassed = $true

    # 1. Test Putar Musik
    Write-Host "`n1. Testing 'Putar Musik' button (#bgmDedicatedPlayBtn):" -ForegroundColor Yellow
    $playRes = Eval-Js @"
document.getElementById('bgmDedicatedPlayBtn').click();
({
    isPlaying: window.luxuryBgm.isPlaying,
    visualizer: document.getElementById('bgmVisualizer').classList.contains('animating'),
    status: document.getElementById('bgmStatusText').textContent
})
"@
    Write-Host "  isPlaying: $($playRes.isPlaying)"
    Write-Host "  Visualizer: $($playRes.visualizer)"
    Write-Host "  Status: $($playRes.status)"
    $t1 = $playRes.isPlaying -and $playRes.visualizer
    Write-Host "  Result: $(if ($t1) { 'PASS' } else { 'FAIL' })"
    if (-not $t1) { $allPassed = $false }

    # 2. Test Matikan Musik
    Write-Host "`n2. Testing 'Matikan Musik' button (#bgmDedicatedStopBtn):" -ForegroundColor Yellow
    $stopRes = Eval-Js @"
document.getElementById('bgmDedicatedStopBtn').click();
({
    isPlaying: window.luxuryBgm.isPlaying,
    activeNodesCount: window.luxuryBgm.activeNodes.length,
    status: document.getElementById('bgmStatusText').textContent
})
"@
    Write-Host "  isPlaying: $($stopRes.isPlaying)"
    Write-Host "  Active nodes count: $($stopRes.activeNodesCount)"
    Write-Host "  Status: $($stopRes.status)"
    $t2 = (-not $stopRes.isPlaying) -and ($stopRes.status.Contains('mati'))
    Write-Host "  Result: $(if ($t2) { 'PASS' } else { 'FAIL' })"
    if (-not $t2) { $allPassed = $false }

    # 3. Test Pilihan Musik (Track Pills & Dropdown)
    Write-Host "`n3. Testing Pilihan Musik (Track Switching):" -ForegroundColor Yellow
    # Switch to Gala Lounge via pill
    $galaRes = Eval-Js @"
document.querySelector('.bgm-track-pill[data-track=`"gala`"]').click();
({
    track: window.luxuryBgm.currentTrack,
    isPlaying: window.luxuryBgm.isPlaying,
    selectVal: document.getElementById('bgmTrackSelect').value,
    pillActive: document.querySelector('.bgm-track-pill[data-track=`"gala`"]').classList.contains('active'),
    status: document.getElementById('bgmStatusText').textContent
})
"@
    Write-Host "  Track: $($galaRes.track) (Select: $($galaRes.selectVal), PillActive: $($galaRes.pillActive))"
    Write-Host "  isPlaying: $($galaRes.isPlaying)"
    Write-Host "  Status: $($galaRes.status)"
    $t3 = ($galaRes.track -eq 'gala') -and $galaRes.pillActive -and $galaRes.isPlaying
    Write-Host "  Result: $(if ($t3) { 'PASS' } else { 'FAIL' })"
    if (-not $t3) { $allPassed = $false }

    # Switch to Sunset via Dropdown
    $sunsetRes = Eval-Js @"
document.getElementById('bgmTrackSelect').value = 'acoustic';
window.luxuryBgm.setTrack('acoustic');
({
    track: window.luxuryBgm.currentTrack,
    pillActive: document.querySelector('.bgm-track-pill[data-track=`"acoustic`"]').classList.contains('active'),
    status: document.getElementById('bgmStatusText').textContent
})
"@
    Write-Host "  Track: $($sunsetRes.track) (PillActive: $($sunsetRes.pillActive))"
    Write-Host "  Status: $($sunsetRes.status)"
    $t3b = ($sunsetRes.track -eq 'acoustic') -and $sunsetRes.pillActive
    Write-Host "  Result: $(if ($t3b) { 'PASS' } else { 'FAIL' })"
    if (-not $t3b) { $allPassed = $false }

    # 4. Test Tombol Volume (-) dan (+) Steps
    Write-Host "`n4. Testing Tombol Volume (-) dan (+):" -ForegroundColor Yellow
    $volStepDown = Eval-Js @"
window.luxuryBgm.stepVolume(-0.1);
({
    vol: window.luxuryBgm.volume,
    label: document.getElementById('bgmVolumeLabel').textContent,
    slider: document.getElementById('bgmVolumeSlider').value
})
"@
    Write-Host "  After step -0.1: Vol=$($volStepDown.vol) Label=$($volStepDown.label) Slider=$($volStepDown.slider)"

    $volStepUp = Eval-Js @"
window.luxuryBgm.stepVolume(0.2);
({
    vol: window.luxuryBgm.volume,
    label: document.getElementById('bgmVolumeLabel').textContent,
    slider: document.getElementById('bgmVolumeSlider').value
})
"@
    Write-Host "  After step +0.2: Vol=$($volStepUp.vol) Label=$($volStepUp.label) Slider=$($volStepUp.slider)"
    $t4 = ($volStepUp.label -ne $volStepDown.label)
    Write-Host "  Result: $(if ($t4) { 'PASS' } else { 'FAIL' })"
    if (-not $t4) { $allPassed = $false }

    # 5. Test Tombol Preset Volume (25%, 50%, 75%, 100%, 0%)
    Write-Host "`n5. Testing Tombol Preset Volume (0%, 25%, 50%, 75%, 100%):" -ForegroundColor Yellow
    $presetRes = Eval-Js @"
document.querySelector('.bgm-preset-btn[data-pct=`"75`"]').click();
const p75 = document.getElementById('bgmVolumeLabel').textContent;
document.querySelector('.bgm-preset-btn[data-pct=`"25`"]').click();
const p25 = document.getElementById('bgmVolumeLabel').textContent;
document.querySelector('.bgm-preset-btn[data-pct=`"100`"]').click();
const p100 = document.getElementById('bgmVolumeLabel').textContent;
document.querySelector('.bgm-preset-btn[data-pct=`"0`"]').click();
const p0 = document.getElementById('bgmVolumeLabel').textContent;
const isMuted = window.luxuryBgm.isMuted;
({ p75, p25, p100, p0, isMuted })
"@
    Write-Host "  Preset 75%: $($presetRes.p75)"
    Write-Host "  Preset 25%: $($presetRes.p25)"
    Write-Host "  Preset 100%: $($presetRes.p100)"
    Write-Host "  Preset 0% (Mute): $($presetRes.p0) (isMuted: $($presetRes.isMuted))"
    $t5 = ($presetRes.p75 -eq '75%') -and ($presetRes.p25 -eq '25%') -and ($presetRes.p100 -eq '100%') -and ($presetRes.p0 -eq '0%') -and $presetRes.isMuted
    Write-Host "  Result: $(if ($t5) { 'PASS' } else { 'FAIL' })"
    if (-not $t5) { $allPassed = $false }

    # 6. Test Tombol Mute Cepat (#bgmMuteBtn)
    Write-Host "`n6. Testing Tombol Mute Cepat (#bgmMuteBtn):" -ForegroundColor Yellow
    # Restore to 50%
    Eval-Js "window.luxuryBgm.setVolumePercent(50);"
    $muteToggle = Eval-Js @"
document.getElementById('bgmMuteBtn').click();
const afterMute = { isMuted: window.luxuryBgm.isMuted, label: document.getElementById('bgmVolumeLabel').textContent };
document.getElementById('bgmMuteBtn').click();
const afterUnmute = { isMuted: window.luxuryBgm.isMuted, label: document.getElementById('bgmVolumeLabel').textContent };
({ afterMute, afterUnmute })
"@
    Write-Host "  After Mute: isMuted=$($muteToggle.afterMute.isMuted), Label=$($muteToggle.afterMute.label)"
    Write-Host "  After Unmute: isMuted=$($muteToggle.afterUnmute.isMuted), Label=$($muteToggle.afterUnmute.label)"
    $t6 = $muteToggle.afterMute.isMuted -and (-not $muteToggle.afterUnmute.isMuted) -and ($muteToggle.afterUnmute.label -eq '50%')
    Write-Host "  Result: $(if ($t6) { 'PASS' } else { 'FAIL' })"
    if (-not $t6) { $allPassed = $false }

    # 7. Final Stop Test
    Write-Host "`n7. Final Matikan Musik Test:" -ForegroundColor Yellow
    $finalStop = Eval-Js @"
document.getElementById('bgmDedicatedStopBtn').click();
({ isPlaying: window.luxuryBgm.isPlaying, status: document.getElementById('bgmStatusText').textContent })
"@
    Write-Host "  isPlaying: $($finalStop.isPlaying)"
    Write-Host "  Status: $($finalStop.status)"
    $t7 = (-not $finalStop.isPlaying)
    Write-Host "  Result: $(if ($t7) { 'PASS' } else { 'FAIL' })"
    if (-not $t7) { $allPassed = $false }

    Write-Host "`n========================================="
    if ($allPassed) {
        Write-Host "ALL CONTROLS VERIFIED WORKING 100%! ✅" -ForegroundColor Green
    } else {
        Write-Host "SOME CONTROLS FAILED! ❌" -ForegroundColor Red
        exit 1
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
