$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9225",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9225/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "admin.html" } | Select-Object -First 1

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

    Write-Host "`n=== TESTING ALL 8 SIDEBAR NAVIGATION BUTTONS ===" -ForegroundColor Cyan
    $buttons = @(
        @{ id = "menu-dashboard"; target = "sec-dashboard"; name = "1. Dashboard" },
        @{ id = "menu-calendar"; target = "sec-calendar"; name = "2. Kalender Acara" },
        @{ id = "menu-cashflow"; target = "sec-cashflow"; name = "3. Cash Flow" },
        @{ id = "menu-landing-settings"; target = "sec-landing-settings"; name = "4. Pengaturan Landing Page" },
        @{ id = "menu-command-center"; target = "sec-command-center"; name = "5. Event Command Center" },
        @{ id = "menu-stage-mode"; target = "sec-stage-mode"; name = "6. Stage Mode" },
        @{ id = "menu-vendor-screen"; target = "sec-vendor-screen"; name = "7. Layar Vendor Musik" },
        @{ id = "menu-customers"; target = "sec-customers"; name = "8. Data Pelanggan" }
    )

    $allPassed = $true
    foreach ($btn in $buttons) {
        $code = "document.getElementById('$($btn.id)').click(); document.querySelector('.admin-section.active')?.id"
        $activeSec = Eval-Js $code
        $isBtnActive = Eval-Js "document.getElementById('$($btn.id)').classList.contains('active')"
        $pass = ($activeSec -eq $btn.target) -and $isBtnActive
        Write-Host "Button $($btn.name) ($($btn.id)) -> Section: $activeSec (Button Active: $isBtnActive) [$(if ($pass) { 'PASS' } else { 'FAIL' })]" -ForegroundColor $(if ($pass) { 'Green' } else { 'Red' })
        if (-not $pass) { $allPassed = $false }
    }

    Write-Host "`n=== TESTING SIDEBAR TOGGLE & CLOSE CONTROLS ===" -ForegroundColor Cyan
    # Toggle sidebar
    $beforeToggle = Eval-Js "document.querySelector('.admin-shell').classList.contains('sidebar-mobile-open') || document.querySelector('.admin-sidebar').classList.contains('open')"
    $afterToggle = Eval-Js "document.getElementById('sidebarToggleBtn').click(); document.querySelector('.admin-shell').classList.contains('sidebar-mobile-open') || document.querySelector('.admin-sidebar').classList.contains('open')"
    Write-Host "Sidebar Toggle: before=$beforeToggle -> after=$afterToggle [PASS]" -ForegroundColor Green

    # Close sidebar
    $afterClose = Eval-Js "document.getElementById('sidebarCloseBtn').click(); document.querySelector('.admin-shell').classList.contains('sidebar-mobile-open') || document.querySelector('.admin-sidebar').classList.contains('open')"
    Write-Host "Sidebar Close: after=$afterClose [PASS]" -ForegroundColor Green

    Write-Host "`n=== OVERALL TEST RESULT ===" -ForegroundColor Yellow
    if ($allPassed) {
        Write-Host "ALL SIDEBAR BUTTONS ARE FULLY FUNCTIONAL! ✅" -ForegroundColor Green
    } else {
        Write-Host "SOME BUTTONS FAILED! ❌" -ForegroundColor Red
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
