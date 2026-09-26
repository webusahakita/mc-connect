$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=== TESTING BGM & VOLUME CONTROLS ON INDEX.HTML VIA CDP ===" -ForegroundColor Cyan

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9226",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9226/json/list" -TimeoutSec 5
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

    # 1. Check window.luxuryBgm
    $bgmType = Eval-Js "typeof window.luxuryBgm"
    Write-Host "1. typeof window.luxuryBgm: $bgmType [$(if ($bgmType -eq 'object') { 'PASS' } else { 'FAIL' })]"
    if ($bgmType -ne 'object') { $allPassed = $false }

    # 2. Check DOM Elements
    $elements = @(
        "bgmFloatingWidget",
        "bgmPlayToggleBtn",
        "bgmMuteBtn",
        "bgmVolumeSlider",
        "bgmVolumeLabel",
        "bgmTrackSelect",
        "bgmVisualizer",
        "navBgmToggleBtn"
    )

    Write-Host "`n2. Checking DOM elements:" -ForegroundColor Yellow
    foreach ($el in $elements) {
        $exists = Eval-Js "document.getElementById('$el') !== null"
        Write-Host "  Element #$($el): $(if ($exists) { 'FOUND (PASS)' } else { 'MISSING (FAIL)' })"
        if (-not $exists) { $allPassed = $false }
    }

    # 3. Test Putar Musik (Play)
    Write-Host "`n3. Testing Putar Musik (Click #bgmPlayToggleBtn):" -ForegroundColor Yellow
    $playRes = Eval-Js @"
document.getElementById('bgmPlayToggleBtn').click();
({
    isPlaying: window.luxuryBgm.isPlaying,
    btnText: document.getElementById('bgmPlayToggleText').textContent,
    visualizerAnim: document.getElementById('bgmVisualizer').classList.contains('animating')
})
"@
    Write-Host "  isPlaying: $($playRes.isPlaying)"
    Write-Host "  Button text: $($playRes.btnText)"
    Write-Host "  Visualizer animating: $($playRes.visualizerAnim)"
    $t3 = $playRes.isPlaying -and ($playRes.btnText -eq "Matikan Musik")
    Write-Host "  Result: $(if ($t3) { 'PASS' } else { 'FAIL' })"
    if (-not $t3) { $allPassed = $false }

    # 4. Test Pengaturan Volume Slider
    Write-Host "`n4. Testing Pengaturan Volume Slider (set to 75%):" -ForegroundColor Yellow
    $volRes = Eval-Js @"
window.luxuryBgm.setVolume(0.75);
({
    vol: window.luxuryBgm.volume,
    label: document.getElementById('bgmVolumeLabel').textContent,
    sliderVal: document.getElementById('bgmVolumeSlider').value
})
"@
    Write-Host "  Engine Volume: $($volRes.vol)"
    Write-Host "  Label Text: $($volRes.label)"
    Write-Host "  Slider Value: $($volRes.sliderVal)"
    $t4 = ($volRes.vol -eq 0.75) -and ($volRes.label -eq "75%") -and ($volRes.sliderVal -eq "75")
    Write-Host "  Result: $(if ($t4) { 'PASS' } else { 'FAIL' })"
    if (-not $t4) { $allPassed = $false }

    # 5. Test Tombol Matikan Suara / Mute
    Write-Host "`n5. Testing Tombol Matikan Suara / Mute (Click #bgmMuteBtn):" -ForegroundColor Yellow
    $muteRes = Eval-Js @"
document.getElementById('bgmMuteBtn').click();
({
    isMuted: window.luxuryBgm.isMuted,
    label: document.getElementById('bgmVolumeLabel').textContent
})
"@
    Write-Host "  isMuted: $($muteRes.isMuted)"
    Write-Host "  Label Text: $($muteRes.label)"
    $t5 = $muteRes.isMuted -and ($muteRes.label -eq "0%")
    Write-Host "  Result: $(if ($t5) { 'PASS' } else { 'FAIL' })"
    if (-not $t5) { $allPassed = $false }

    # 6. Test Unmute Kembali
    Write-Host "`n6. Testing Unmute Kembali:" -ForegroundColor Yellow
    $unmuteRes = Eval-Js @"
document.getElementById('bgmMuteBtn').click();
({
    isMuted: window.luxuryBgm.isMuted,
    vol: window.luxuryBgm.volume,
    label: document.getElementById('bgmVolumeLabel').textContent
})
"@
    Write-Host "  isMuted: $($unmuteRes.isMuted)"
    Write-Host "  Engine Volume restored: $($unmuteRes.vol)"
    Write-Host "  Label Text restored: $($unmuteRes.label)"
    $t6 = (-not $unmuteRes.isMuted) -and ($unmuteRes.label -eq "75%")
    Write-Host "  Result: [$(if ($t6) { 'PASS' } else { 'FAIL' })]"
    if (-not $t6) { $allPassed = $false }

    # 7. Test Matikan Musik Total (Stop/Pause)
    Write-Host "`n7. Testing Matikan Musik (Click #bgmPlayToggleBtn while playing):" -ForegroundColor Yellow
    $stopRes = Eval-Js @"
document.getElementById('bgmPlayToggleBtn').click();
({
    isPlaying: window.luxuryBgm.isPlaying,
    btnText: document.getElementById('bgmPlayToggleText').textContent
})
"@
    Write-Host "  isPlaying: $($stopRes.isPlaying)"
    Write-Host "  Button text: $($stopRes.btnText)"
    $t7 = (-not $stopRes.isPlaying) -and ($stopRes.btnText -eq "Putar Musik")
    Write-Host "  Result: [$(if ($t7) { 'PASS' } else { 'FAIL' })]"
    if (-not $t7) { $allPassed = $false }

    # 8. Test Navbar BGM Button Toggle
    Write-Host "`n8. Testing Navbar Button Toggle (Click #navBgmToggleBtn):" -ForegroundColor Yellow
    $navRes = Eval-Js @"
document.getElementById('navBgmToggleBtn').click();
({
    isPlaying: window.luxuryBgm.isPlaying,
    navHtml: document.getElementById('navBgmToggleBtn').innerHTML
})
"@
    Write-Host "  isPlaying: $($navRes.isPlaying)"
    Write-Host "  Navbar content: $($navRes.navHtml)"
    $t8 = $navRes.isPlaying -and $navRes.navHtml.Contains("Musik: ON")
    Write-Host "  Result: [$(if ($t8) { 'PASS' } else { 'FAIL' })]"
    if (-not $t8) { $allPassed = $false }

    # 9. Test Widget Collapse / Expand
    Write-Host "`n9. Testing Widget Collapse / Expand:" -ForegroundColor Yellow
    $collapseRes = Eval-Js @"
toggleBgmWidgetExpand();
const isCollapsed = document.getElementById('bgmFloatingWidget').classList.contains('collapsed');
toggleBgmWidgetExpand();
const isExpanded = !document.getElementById('bgmFloatingWidget').classList.contains('collapsed');
({ isCollapsed, isExpanded })
"@
    Write-Host "  Can collapse: $($collapseRes.isCollapsed)"
    Write-Host "  Can expand: $($collapseRes.isExpanded)"
    $t9 = $collapseRes.isCollapsed -and $collapseRes.isExpanded
    Write-Host "  Result: [$(if ($t9) { 'PASS' } else { 'FAIL' })]"
    if (-not $t9) { $allPassed = $false }

    Write-Host "`n========================================="
    if ($allPassed) {
        Write-Host "ALL BGM AUDIO & VOLUME TESTS PASSED! ✅" -ForegroundColor Green
    } else {
        Write-Host "SOME TESTS FAILED! ❌" -ForegroundColor Red
        exit 1
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
