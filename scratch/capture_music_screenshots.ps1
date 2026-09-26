$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9236",
    "--window-size=1400,900",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9236/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "admin.html" } | Select-Object -First 1

    $ws = New-Object System.Net.WebSockets.ClientWebSocket
    $cts = New-Object System.Threading.CancellationTokenSource
    $ws.ConnectAsync([Uri]$targetTab.webSocketDebuggerUrl, $cts.Token).Wait()

    $msgId = 1
    function Send-Cdp($method, $params) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = $method
            params = $params
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(1048576)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result
        $txt = [System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)
        return ($txt | ConvertFrom-Json)
    }

    # Switch to Tab 6
    Send-Cdp "Runtime.evaluate" @{ expression = "switchTab('tab-music'); document.title = 'Tab 6: List Musik Acara';" } | Out-Null
    Start-Sleep -Seconds 1

    # Screenshot 1: Admin Tab 6
    $res1 = Send-Cdp "Page.captureScreenshot" @{ format = "png" }
    $b64_1 = $res1.result.data
    $bytes1 = [Convert]::FromBase64String($b64_1)
    [System.IO.File]::WriteAllBytes("C:\Users\Nawakara\.gemini\antigravity-ide\brain\900f3d19-8c9e-4e36-a203-9516c827ea52\tab6_music_admin.png", $bytes1)
    Write-Host "Saved tab6_music_admin.png" -ForegroundColor Green

    # Switch to Tab 3: Stage & Rundown to show attached music cards
    Send-Cdp "Runtime.evaluate" @{ expression = "switchTab('tab-stage'); document.title = 'Tab 3: Rundown Attached Music';" } | Out-Null
    Start-Sleep -Seconds 1
    $res2 = Send-Cdp "Page.captureScreenshot" @{ format = "png" }
    $b64_2 = $res2.result.data
    $bytes2 = [Convert]::FromBase64String($b64_2)
    [System.IO.File]::WriteAllBytes("C:\Users\Nawakara\.gemini\antigravity-ide\brain\900f3d19-8c9e-4e36-a203-9516c827ea52\tab3_rundown_music.png", $bytes2)
    Write-Host "Saved tab3_rundown_music.png" -ForegroundColor Green

    # Navigate to vendor.html
    Send-Cdp "Page.navigate" @{ url = "http://localhost:8000/vendor.html" } | Out-Null
    Start-Sleep -Seconds 3

    # Screenshot 3: Vendor Page
    $res3 = Send-Cdp "Page.captureScreenshot" @{ format = "png" }
    $b64_3 = $res3.result.data
    $bytes3 = [Convert]::FromBase64String($b64_3)
    [System.IO.File]::WriteAllBytes("C:\Users\Nawakara\.gemini\antigravity-ide\brain\900f3d19-8c9e-4e36-a203-9516c827ea52\vendor_music_sync.png", $bytes3)
    Write-Host "Saved vendor_music_sync.png" -ForegroundColor Green

    try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait() } catch {}
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
