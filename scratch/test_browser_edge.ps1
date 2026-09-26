$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "Using Edge at: $edgePath" -ForegroundColor Cyan

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9222",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9222/json/list" -TimeoutSec 5
    Write-Host "Found $($tabs.Count) CDP tabs:" -ForegroundColor Yellow
    foreach ($t in $tabs) {
        Write-Host "  Title: $($t.title) - URL: $($t.url)"
        Write-Host "  WS URL: $($t.webSocketDebuggerUrl)"
    }
} catch {
    Write-Host "Could not connect to CDP: $_" -ForegroundColor Red
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
