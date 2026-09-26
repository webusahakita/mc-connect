$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TEST: STAGE MODE SEBELUM & SESUDAH ANTISIPASI" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_stage_test_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9239",
    "--user-data-dir=$tmpProfile",
    "--window-size=1440,900",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/stage.html"
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
    $tabs = Invoke-RestMethod -Uri "http://localhost:9239/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "stage.html" } | Select-Object -First 1

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
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buffer = New-Object byte[] 65536
        $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @($buffer, 0, $buffer.Length)
        $res = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
        $responseStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $res.Count)
        $json = $responseStr | ConvertFrom-Json
        return $json.result.result.value
    }

    function Cdp-Screenshot($filePath) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = "Page.captureScreenshot"
            params = @{
                format = "png"
            }
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $memStream = New-Object System.IO.MemoryStream
        $buffer = New-Object byte[] 65536
        do {
            $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @($buffer, 0, $buffer.Length)
            $res = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
            $memStream.Write($buffer, 0, $res.Count)
        } while (-not $res.EndOfMessage)

        $responseStr = [System.Text.Encoding]::UTF8.GetString($memStream.ToArray())
        $json = $responseStr | ConvertFrom-Json
        $base64 = $json.result.data
        if ($base64) {
            [System.IO.File]::WriteAllBytes($filePath, [System.Convert]::FromBase64String($base64))
        }
    }

    Start-Sleep -Seconds 1

    # Test 1: Active Segment and Top Badges
    $badgeText = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    Write-Host "Badge: $badgeText"
    Assert-Condition "Initial segment is Segment 1" ($badgeText -match "Segmen 1/7") $badgeText

    # Test 2: Top Nav Buttons presence and state on Segment 1
    $topPrevDisabled = Cdp-Eval "document.getElementById('btnTopPrev').disabled"
    $topNextDisabled = Cdp-Eval "document.getElementById('btnTopNext').disabled"
    Assert-Condition "Top 'Sebelum' button is disabled on Segment 1" ($topPrevDisabled -eq $true)
    Assert-Condition "Top 'Berikut' button is enabled on Segment 1" ($topNextDisabled -eq $false)

    # Test 3: Dual Anticipation Bar Elements on Segment 1
    $prevTitle = Cdp-Eval "document.getElementById('prevSegmentTitle').textContent.trim()"
    $prevCue = Cdp-Eval "document.getElementById('prevSegmentCue').textContent.trim()"
    $nextTitle = Cdp-Eval "document.getElementById('nextSegmentTitle').textContent.trim()"
    $nextCue = Cdp-Eval "document.getElementById('nextSegmentCue').textContent.trim()"
    Write-Host "Prev Title: $prevTitle | Prev Cue: $prevCue"
    Write-Host "Next Title: $nextTitle | Next Cue: $nextCue"

    Assert-Condition "Sebelum box shows 'Awal Acara'" ($prevTitle -match "Awal Acara") $prevTitle
    Assert-Condition "Sesudah box shows Segment 2 (Grand Entrance)" ($nextTitle -match "Segmen 2/7.*Grand Entrance") $nextTitle
    Assert-Condition "Sesudah box shows Music Cue for Segment 2" ($nextCue -match "Royal Entrance Fanfare") $nextCue

    # Test 4: In-Viewport Next Up Anticipation Card
    $viewportNextHeading = Cdp-Eval "document.getElementById('prompterNextHeading').textContent.trim()"
    $viewportNextCue = Cdp-Eval "document.getElementById('prompterNextCue').textContent.trim()"
    Assert-Condition "In-viewport card anticipates Segment 2" ($viewportNextHeading -match "Grand Entrance Kedua Mempelai") $viewportNextHeading
    Assert-Condition "In-viewport card displays Segment 2 Music Cue" ($viewportNextCue -match "Royal Entrance Fanfare") $viewportNextCue

    # Test 5: Sidebar Anticipation Progress
    $navProg = Cdp-Eval "document.getElementById('stageNavProgress').textContent.trim()"
    $sideNextTitle = Cdp-Eval "document.getElementById('sideNextTitle').textContent.trim()"
    Assert-Condition "Sidebar progress displays '1 / 7'" ($navProg -match "1 / 7") $navProg
    Assert-Condition "Sidebar anticipates Segment 2" ($sideNextTitle -match "Grand Entrance") $sideNextTitle

    # Test 6: Advance to Segment 2 via Top 'Berikut ⏭' Button
    Cdp-Eval "document.getElementById('btnTopNext').click()"
    Start-Sleep -Milliseconds 500

    $badgeText2 = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    $topPrevDisabled2 = Cdp-Eval "document.getElementById('btnTopPrev').disabled"
    $prevTitle2 = Cdp-Eval "document.getElementById('prevSegmentTitle').textContent.trim()"
    $nextTitle2 = Cdp-Eval "document.getElementById('nextSegmentTitle').textContent.trim()"
    Write-Host "After Next: Badge: $badgeText2 | Prev: $prevTitle2 | Next: $nextTitle2"

    Assert-Condition "Moved to Segment 2" ($badgeText2 -match "Segmen 2/7") $badgeText2
    Assert-Condition "Top 'Sebelum' button is now enabled" ($topPrevDisabled2 -eq $false)
    Assert-Condition "Sebelum box anticipates previous Segment 1" ($prevTitle2 -match "Segmen 1: Open Gate") $prevTitle2
    Assert-Condition "Sesudah box anticipates Segment 3 (Sambutan)" ($nextTitle2 -match "Segmen 3/7.*Sambutan") $nextTitle2

    # Test 7: Advance via Anticipation Next-Box Click
    Cdp-Eval "document.getElementById('boxNextSegment').click()"
    Start-Sleep -Milliseconds 500
    $badgeText3 = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    Assert-Condition "Clicking Next Anticipation Box advances to Segment 3" ($badgeText3 -match "Segmen 3/7") $badgeText3

    # Test 8: Keyboard Navigation (ArrowLeft to return to Segment 2)
    Cdp-Eval "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))"
    Start-Sleep -Milliseconds 500
    $badgeAfterLeft = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    Assert-Condition "Keyboard ArrowLeft returns to Segment 2" ($badgeAfterLeft -match "Segmen 2/7") $badgeAfterLeft

    # Test 9: Keyboard Navigation (ArrowRight to advance to Segment 3)
    Cdp-Eval "window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))"
    Start-Sleep -Milliseconds 500
    $badgeAfterRight = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    Assert-Condition "Keyboard ArrowRight advances to Segment 3" ($badgeAfterRight -match "Segmen 3/7") $badgeAfterRight

    # Test 10: Jump to Final Segment 7 to verify Finale Anticipation state
    Cdp-Eval "loadSegment(6)"
    Start-Sleep -Milliseconds 500
    $badgeFinal = Cdp-Eval "document.getElementById('currentSegmentBadge').textContent.trim()"
    $nextTitleFinal = Cdp-Eval "document.getElementById('nextSegmentTitle').textContent.trim()"
    $topNextDisabledFinal = Cdp-Eval "document.getElementById('btnTopNext').disabled"
    $cardHeadingFinal = Cdp-Eval "document.getElementById('prompterNextHeading').textContent.trim()"

    Assert-Condition "Loaded final Segment 7" ($badgeFinal -match "Segmen 7/7") $badgeFinal
    Assert-Condition "Next anticipation box indicates Grand Finale" ($nextTitleFinal -match "Grand Finale") $nextTitleFinal
    Assert-Condition "Top 'Berikut' button disabled on final segment" ($topNextDisabledFinal -eq $true)
    Assert-Condition "In-viewport card displays completion banner" ($cardHeadingFinal -match "Segmen Penutup") $cardHeadingFinal

    # Return to Segment 1 for nice screenshot
    Cdp-Eval "loadSegment(0)"
    Start-Sleep -Milliseconds 500

    # Capture Screenshot
    $screenshotPath = "$PSScriptRoot\stage_anticipation_verified.png"
    Cdp-Screenshot $screenshotPath
    if (Test-Path $screenshotPath) {
        Write-Host " [PASS] Screenshot captured to $screenshotPath" -ForegroundColor Green
        $script:passedCount++
    }

} catch {
    Write-Host "EXCEPTION DURING TEST: $_" -ForegroundColor Red
} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
    }
    if ($proc -and -not $proc.HasExited) {
        $proc.Kill()
    }
    if (Test-Path $tmpProfile) {
        Start-Sleep -Milliseconds 500
        Remove-Item -Recurse -Force $tmpProfile -ErrorAction SilentlyContinue
    }
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "TEST SUMMARY: PASSED=$passedCount, FAILED=$failedCount" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
if ($failedCount -eq 0 -and $passedCount -ge 12) {
    exit 0
} else {
    exit 1
}
