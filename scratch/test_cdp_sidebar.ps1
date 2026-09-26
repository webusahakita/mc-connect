Add-Type -AssemblyName System.Net.WebSockets

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9223",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9223/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "admin.html" } | Select-Object -First 1

    if (-not $targetTab) {
        Write-Host "Target admin.html tab not found!" -ForegroundColor Red
        exit 1
    }

    Write-Host "Connecting to: $($targetTab.title) ($($targetTab.webSocketDebuggerUrl))" -ForegroundColor Cyan

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([Uri]$targetTab.webSocketDebuggerUrl, $cts.Token).Wait()

    Write-Host "WebSocket Connected!" -ForegroundColor Green

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

        # Read response
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

    # Check functions
    Write-Host "`n=== JAVASCRIPT FUNCTION CHECKS ===" -ForegroundColor Yellow
    $navType = Eval-Js "typeof window.navigateToSection"
    Write-Host "typeof window.navigateToSection: $navType"
    $toggleType = Eval-Js "typeof window.toggleSidebar"
    Write-Host "typeof window.toggleSidebar: $toggleType"
    $closeType = Eval-Js "typeof window.closeSidebar"
    Write-Host "typeof window.closeSidebar: $closeType"

    # Check active section
    $activeSec = Eval-Js "document.querySelector('.admin-section.active')?.id"
    Write-Host "Initially active section: $activeSec"

    # Click Dashboard menu button
    Write-Host "`n=== TESTING CLICK ON #menu-dashboard ===" -ForegroundColor Yellow
    $clickDash = Eval-Js "document.getElementById('menu-dashboard').click(); document.querySelector('.admin-section.active')?.id"
    Write-Host "After clicking #menu-dashboard, active section: $clickDash"

    # Click Cashflow menu button
    Write-Host "`n=== TESTING CLICK ON #menu-cashflow ===" -ForegroundColor Yellow
    $clickCf = Eval-Js "document.getElementById('menu-cashflow').click(); document.querySelector('.admin-section.active')?.id"
    Write-Host "After clicking #menu-cashflow, active section: $clickCf"

    # Click Customers menu button
    Write-Host "`n=== TESTING CLICK ON #menu-customers ===" -ForegroundColor Yellow
    $clickCust = Eval-Js "document.getElementById('menu-customers').click(); document.querySelector('.admin-section.active')?.id"
    Write-Host "After clicking #menu-customers, active section: $clickCust"

    # Click Command Center menu button
    Write-Host "`n=== TESTING CLICK ON #menu-command-center ===" -ForegroundColor Yellow
    $clickCc = Eval-Js "document.getElementById('menu-command-center').click(); document.querySelector('.admin-section.active')?.id"
    Write-Host "After clicking #menu-command-center, active section: $clickCc"

    # Test Sidebar Toggle button
    Write-Host "`n=== TESTING SIDEBAR TOGGLE / COLLAPSE ===" -ForegroundColor Yellow
    $shellClassesBefore = Eval-Js "document.querySelector('.admin-shell').className"
    Write-Host "Shell class before toggle: $shellClassesBefore"

    $toggleRes = Eval-Js "document.getElementById('sidebarToggleBtn').click(); document.querySelector('.admin-shell').className"
    Write-Host "Shell class after click #sidebarToggleBtn: $toggleRes"

    # Test Sidebar Close Button (✕)
    $closeBtn = Eval-Js "document.getElementById('sidebarCloseBtn').click(); document.querySelector('.admin-shell').className"
    Write-Host "Shell class after click #sidebarCloseBtn: $closeBtn"

    # Check any Console logs / errors recorded
    $logs = Send-CdpCommand "Runtime.evaluate" @{
        expression = "window.__errors || []"
        returnByValue = $true
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Error during CDP test: $_" -ForegroundColor Red
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
