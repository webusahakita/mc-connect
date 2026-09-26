$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TEST: TAB 6 SOUNDBOARD CONFIG & STAGE SYNC" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_soundboard_test_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9249",
    "--user-data-dir=$tmpProfile",
    "--window-size=1440,900",
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
    $tabs = Invoke-RestMethod -Uri "http://localhost:9249/json/list" -TimeoutSec 5
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
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buffer = New-Object byte[] 65536
        $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @($buffer, 0, $buffer.Length)
        $res = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
        $responseStr = [System.Text.Encoding]::UTF8.GetString($buffer, 0, $res.Count)
        $json = $responseStr | ConvertFrom-Json
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
        $segment = New-Object System.ArraySegment[byte] -ArgumentList @($bytes, 0, $bytes.Length)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buffer = New-Object byte[] 65536
        $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @($buffer, 0, $buffer.Length)
        $res = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
        return $res
    }

    function Cdp-Screenshot($filePath) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = "Page.captureScreenshot"
            params = @{ format = "png" }
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

    Write-Host "`n--- STEP 1: Verify Tab 6 Navigation & Sub-Tabs ---" -ForegroundColor Yellow
    Cdp-Eval "navigateToSection('sec-command-center', document.getElementById('menu-command-center'))"
    Cdp-Eval "loadActiveEventInCommandCenter()"
    Cdp-Eval "switchTab('tab-music')"
    Start-Sleep -Milliseconds 400

    $tab6BtnText = Cdp-Eval "document.querySelector('[data-tab=""tab-music""]').textContent.trim()"
    Assert-Condition "Tab 6 is titled 'Musik & Sound Acara'" ($tab6BtnText -match "Musik & Sound Acara") $tab6BtnText

    $btnBgmExists = Cdp-Eval "Boolean(document.getElementById('btnSubtabBgm'))"
    $btnSbExists = Cdp-Eval "Boolean(document.getElementById('btnSubtabSoundboard'))"
    Assert-Condition "Sub-tab BGM exists" ($btnBgmExists -eq $true)
    Assert-Condition "Sub-tab Soundboard exists" ($btnSbExists -eq $true)

    Write-Host "`n--- STEP 2: Switch to Sub-Tab Soundboard & Check Defaults ---" -ForegroundColor Yellow
    Cdp-Eval "switchMusicSubtab('soundboard')"
    Start-Sleep -Milliseconds 400

    $bgmDisplay = Cdp-Eval "document.getElementById('musicSubtabBgm').style.display"
    $sbDisplay = Cdp-Eval "document.getElementById('musicSubtabSoundboard').style.display"
    Assert-Condition "BGM subtab is hidden" ($bgmDisplay -eq "none")
    Assert-Condition "Soundboard subtab is visible" ($sbDisplay -eq "block")

    $padCount = Cdp-Eval "document.querySelectorAll('#adminSoundboardGridPreview .sound-pad-admin').length"
    $tableRowCount = Cdp-Eval "document.querySelectorAll('#adminSoundboardTableContainer tbody tr').length"
    Write-Host "Grid pads count: $padCount | Table rows: $tableRowCount"
    Assert-Condition "Default grid has 6 sound pads" ($padCount -eq 6)
    Assert-Condition "Default table has 6 rows" ($tableRowCount -eq 6)

    $sbMetricTotal = Cdp-Eval "document.getElementById('sbMetricTotal').textContent.trim()"
    Assert-Condition "Total metric shows 6 Sound" ($sbMetricTotal -match "6 Sound") $sbMetricTotal

    Write-Host "`n--- STEP 3: Test Web Audio Synthesizer Presets ---" -ForegroundColor Yellow
    $playApplauseResult = Cdp-Eval "try { window.soundboard.playSound('applause', 0.8); 'OK'; } catch(e) { e.message; }"
    $playAirhornResult = Cdp-Eval "try { window.soundboard.playSound('airhorn', 0.9); 'OK'; } catch(e) { e.message; }"
    $playWhooshResult = Cdp-Eval "try { window.soundboard.playSound('whoosh', 0.8); 'OK'; } catch(e) { e.message; }"
    Assert-Condition "Applause preset plays without error" ($playApplauseResult -eq "OK") $playApplauseResult
    Assert-Condition "Airhorn preset plays without error" ($playAirhornResult -eq "OK") $playAirhornResult
    Assert-Condition "Whoosh preset plays without error" ($playWhooshResult -eq "OK") $playWhooshResult

    Write-Host "`n--- STEP 4: Add a 7th Sound Effect via Modal (Airhorn Hype) ---" -ForegroundColor Yellow
    Cdp-Eval "openAddSoundboardModal()"
    Start-Sleep -Milliseconds 300

    $modalActive = Cdp-Eval "document.getElementById('modalManageSoundboard').classList.contains('active')"
    Assert-Condition "Modal opens on openAddSoundboardModal" ($modalActive -eq $true)

    Cdp-Eval "document.getElementById('soundboardEditName').value = 'Airhorn Hype Panggung'"
    Cdp-Eval "document.getElementById('soundboardEditIcon').value = '\uD83D\uDCE2'"
    Cdp-Eval "document.getElementById('soundboardEditPreset').value = 'airhorn'"
    Cdp-Eval "document.getElementById('soundboardEditCategory').value = 'Hype'"
    Cdp-Eval "document.getElementById('soundboardEditVolume').value = '90'"
    Cdp-Eval "document.getElementById('soundboardEditKey').value = '7'"
    Cdp-Eval "document.getElementById('soundboardEditDesc').value = 'Klakson pesta games seru panggung'"
    Cdp-Eval "document.getElementById('soundboardEditEnabled').checked = true"

    Cdp-Eval "handleSaveSoundboard()"
    Start-Sleep -Milliseconds 400

    $newPadCount = Cdp-Eval "document.querySelectorAll('#adminSoundboardGridPreview .sound-pad-admin').length"
    $newRowCount = Cdp-Eval "document.querySelectorAll('#adminSoundboardTableContainer tbody tr').length"
    Write-Host "After Add: Pads: $newPadCount | Rows: $newRowCount"
    Assert-Condition "Soundboard now has 7 pads" ($newPadCount -eq 7)
    Assert-Condition "Soundboard table now has 7 rows" ($newRowCount -eq 7)

    Cdp-Eval "document.getElementById('musicSubtabSoundboard').scrollIntoView({ behavior: 'instant', block: 'start' })"
    Start-Sleep -Milliseconds 400

    $adminScreenshotPath = "$PSScriptRoot\admin_soundboard_tab6_verified.png"
    Cdp-Screenshot $adminScreenshotPath
    Assert-Condition "Admin Soundboard Tab 6 screenshot saved" (Test-Path $adminScreenshotPath)

    Write-Host "`n--- STEP 5: Edit Sound Effect & Toggle Active Status ---" -ForegroundColor Yellow
    Cdp-Eval "openEditSoundboardModal(6)"
    Start-Sleep -Milliseconds 300
    Cdp-Eval "document.getElementById('soundboardEditName').value = 'Airhorn Super Hype'"
    Cdp-Eval "handleSaveSoundboard()"
    Start-Sleep -Milliseconds 400

    $updatedName = Cdp-Eval "document.querySelector('#adminSoundboardTableContainer tbody tr:last-child strong').textContent.trim()"
    Assert-Condition "Sound name updated to Airhorn Super Hype" ($updatedName -match "Airhorn Super Hype") $updatedName

    Cdp-Eval "toggleSoundboardActive(4)"
    Start-Sleep -Milliseconds 400

    $activeMetric = Cdp-Eval "document.getElementById('sbMetricActive').textContent.trim()"
    Assert-Condition "Active soundboard count is 6 (7 total - 1 disabled)" ($activeMetric -match "6 Sound") $activeMetric

    Write-Host "`n--- STEP 6: Verify Stage Mode Synchronization ---" -ForegroundColor Yellow
    Cdp-Navigate "http://localhost:8000/stage.html"
    Start-Sleep -Seconds 3

    $stagePadCount = Cdp-Eval "document.querySelectorAll('#stageSoundboardGrid .sound-pad').length"
    $stagePadNames = Cdp-Eval "Array.prototype.map.call(document.querySelectorAll('#stageSoundboardGrid .sound-pad span:last-child'), function(el){ return el.textContent.trim(); }).join(', ')"
    Write-Host "Stage Active Pads Count: $stagePadCount"
    Write-Host "Stage Pad Names: $stagePadNames"

    Assert-Condition "Stage Mode loaded 6 active pads" ($stagePadCount -eq 6)
    Assert-Condition "Stage Mode includes newly added Airhorn Super Hype" ($stagePadNames -match "Airhorn Super Hype") $stagePadNames
    Assert-Condition "Stage Mode excludes disabled Buzzer" ($stagePadNames -notmatch "Buzzer")

    Cdp-Eval "document.querySelector('#stageSoundboardGrid .sound-pad').click()"
    Start-Sleep -Milliseconds 200

    $stageScreenshotPath = "$PSScriptRoot\stage_soundboard_sync_verified.png"
    Cdp-Screenshot $stageScreenshotPath
    Assert-Condition "Stage Mode synchronized soundboard screenshot saved" (Test-Path $stageScreenshotPath)

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
if ($failedCount -eq 0 -and $passedCount -ge 16) {
    exit 0
} else {
    exit 1
}
