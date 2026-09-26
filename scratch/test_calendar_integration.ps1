$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFYING FULL INTEGRATION BETWEEN PUBLIC & ADMIN CALENDARS" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Start Edge with remote debugging
$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9232",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9232/json/list" -TimeoutSec 5
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

    # Test 1: Public calendar loads unified database
    $r1 = Cdp-Eval @"
(() => {
    const events = getIntegratedPublicEvents();
    const hasFarhan = events.some(e => e.date === '2026-09-18' && e.status === 'Terkunci');
    const hasTelkomsel = events.some(e => e.date === '2026-09-24' && e.status === 'Tentative');
    const hasKevin = events.some(e => e.date === '2026-10-05');
    const calInstance = !!window.calendarApp;
    const renderedEvents = window.calendarApp ? window.calendarApp.events.length : 0;
    return { count: events.length, hasFarhan, hasTelkomsel, hasKevin, calInstance, renderedEvents };
})()
"@
    Assert-Test "1. Kalender Publik Memuat Database Terintegrasi" ($r1.calInstance -and $r1.hasFarhan -and $r1.hasTelkomsel -and $r1.hasKevin) "Events: $($r1.count), Rendered: $($r1.renderedEvents)"

    # Test 2: Clicking locked cell warns & blocks modal
    $r2 = Cdp-Eval @"
(() => {
    AvailabilityCalendar.handleCellClick('publicCalendarContainer', '2026-09-18', 'Terkunci');
    const modalActive = document.getElementById('bookingModal').classList.contains('active');
    const toast = document.querySelector('.toast')?.textContent || '';
    return { modalActive, toast };
})()
"@
    Assert-Test "2. Klik Tanggal Terkunci (Anti-Bentrok Proteksi)" ((-not $r2.modalActive) -and ($r2.toast.Contains('TERKUNCI'))) "Modal: $($r2.modalActive), Toast: $($r2.toast)"

    # Test 3: Clicking available cell pre-fills date and opens modal
    $r3 = Cdp-Eval @"
(() => {
    AvailabilityCalendar.handleCellClick('publicCalendarContainer', '2026-11-12', 'Available');
    const modalActive = document.getElementById('bookingModal').classList.contains('active');
    const dateVal = document.getElementById('bookEventDate').value;
    return { modalActive, dateVal };
})()
"@
    Assert-Test "3. Klik Tanggal Tersedia (2026-11-12) Mengisi Formulir" ($r3.modalActive -and $r3.dateVal -eq '2026-11-12') "Date: $($r3.dateVal)"

    # Test 4: Submit booking from public portal -> saves to mc_events_db_v1 and mc_customers_db_v1
    $r4 = Cdp-Eval @"
(() => {
    document.getElementById('bookEventDate').value = '2026-11-12';
    document.getElementById('bookPicName').value = 'Irfan Hakim';
    document.getElementById('bookWa').value = '081234567890';
    document.getElementById('bookEventName').value = 'Gala Dinner Astra International 2026';
    document.getElementById('bookVenue').value = 'Shangri-La Hotel Jakarta';
    document.getElementById('bookClientType').value = 'Corporate';
    document.getElementById('bookStartTime').value = '18:30';
    document.getElementById('bookEndTime').value = '22:00';
    document.getElementById('bookNotes').value = 'Acara formal tahunan jajaran direksi Astra.';

    const form = document.querySelector('#bookingModal form');
    const fakeEvent = { preventDefault: () => {} };
    handlePublicBookingSubmit(fakeEvent);

    const savedEvents = JSON.parse(localStorage.getItem('mc_events_db_v1') || '[]');
    const savedCusts = JSON.parse(localStorage.getItem('mc_customers_db_v1') || '[]');
    const newEv = savedEvents.find(e => e.date === '2026-11-12');
    const newCust = savedCusts.find(c => c.date === '2026-11-12');
    const calEvent = window.calendarApp.events.find(e => e.date === '2026-11-12');

    return {
        hasEvent: !!newEv,
        eventTitle: newEv ? newEv.title : null,
        eventStatus: newEv ? newEv.status : null,
        hasCust: !!newCust,
        custName: newCust ? newCust.name : null,
        calStatus: calEvent ? calEvent.status : null
    };
})()
"@
    Assert-Test "4. Submit Booking Publik Tersimpan di Database Admin & CRM" ($r4.hasEvent -and $r4.eventStatus -eq 'Tentative' -and $r4.hasCust -and $r4.calStatus -eq 'Tentative') "Title: $($r4.eventTitle), Cust: $($r4.custName)"

    # Test 5: Try booking on the same date when it gets locked by Admin -> anti-bentrok blocks
    $r5 = Cdp-Eval @"
(() => {
    // Admin locks the date 2026-11-12
    const allEvents = JSON.parse(localStorage.getItem('mc_events_db_v1') || '[]');
    const idx = allEvents.findIndex(e => e.date === '2026-11-12');
    if (idx >= 0) {
        allEvents[idx].status = 'Terkunci';
        localStorage.setItem('mc_events_db_v1', JSON.stringify(allEvents));
    }

    // Try booking again on 2026-11-12
    document.getElementById('bookEventDate').value = '2026-11-12';
    document.getElementById('bookPicName').value = 'Another Client';
    document.getElementById('bookWa').value = '0811111111';
    document.getElementById('bookEventName').value = 'Bentrok Event';
    document.getElementById('bookVenue').value = 'Another Venue';

    let toastText = '';
    const fakeEvent = { preventDefault: () => {} };
    handlePublicBookingSubmit(fakeEvent);

    const toast = document.querySelector('.toast')?.textContent || '';
    return { toast };
})()
"@
    Assert-Test "5. Proteksi Bentrok Menolak Booking di Tanggal Terkunci Admin" ($r5.toast.Contains('bentrok') -or $r5.toast.Contains('TERKUNCI')) "Toast: $($r5.toast)"

    # Test 6: Verify Admin page reads this event
    $r6 = Cdp-Eval @"
(async () => {
    // Check localStorage structure matching admin expectation
    const events = JSON.parse(localStorage.getItem('mc_events_db_v1') || '[]');
    const astraEv = events.find(e => e.date === '2026-11-12');
    return {
        found: !!astraEv,
        title: astraEv ? astraEv.title : '',
        venue: astraEv ? astraEv.venue : '',
        pic: astraEv ? astraEv.pic : '',
        time: astraEv ? astraEv.time : ''
    };
})()
"@
    Assert-Test "6. Struktur Data Sesuai Format Admin Command Center & Kalender" ($r6.found -and $r6.title.Contains('Astra')) "Event: $($r6.title), Venue: $($r6.venue)"

    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "TOTAL PASSED: $totalPass / $($totalPass + $totalFail)" -ForegroundColor Green
    if ($totalFail -gt 0) {
        Write-Host "TOTAL FAILED: $totalFail" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "CALENDAR INTEGRATION VERIFIED 100% SUCCESSFUL! 🎉" -ForegroundColor Green
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Test error: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
}
