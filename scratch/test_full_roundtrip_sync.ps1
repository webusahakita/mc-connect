$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "RUNNING FULL ROUND-TRIP PUBLIC-ADMIN CALENDAR INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Create dedicated user data dir so localStorage is isolated and persistent for this test
$tmpProfile = "$PSScriptRoot\edge_test_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9234",
    "--user-data-dir=$tmpProfile",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/index.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9234/json/list" -TimeoutSec 5
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

    function Cdp-Navigate($url) {
        $id = [System.Threading.Interlocked]::Increment([ref]$script:msgId)
        $msg = @{
            id = $id
            method = "Page.navigate"
            params = @{ url = $url }
        } | ConvertTo-Json -Compress

        $bytes = [System.Text.Encoding]::UTF8.GetBytes($msg)
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(65536)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result
        Start-Sleep -Seconds 2
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

    # Step 1: Check initial public calendar
    $s1 = Cdp-Eval @"
(() => {
    const events = getIntegratedPublicEvents();
    return {
        count: events.length,
        hasFarhan: events.some(e => e.date === '2026-09-18' && e.status === 'Terkunci'),
        hasMandiri: events.some(e => e.date === '2026-11-15' && e.status === 'Terkunci'),
        hasSummit: events.some(e => e.date === '2027-01-14' && e.status === 'Terkunci')
    };
})()
"@
    Assert-Test "1. Kalender Publik Awal Memuat Database Lengkap (7 Acara)" ($s1.count -ge 7 -and $s1.hasFarhan -and $s1.hasMandiri -and $s1.hasSummit) "Total Events: $($s1.count)"

    # Step 2: Submit a new booking on index.html
    $s2 = Cdp-Eval @"
(() => {
    document.getElementById('bookEventDate').value = '2026-11-20';
    document.getElementById('bookPicName').value = 'Dian Sastrowardoyo';
    document.getElementById('bookWa').value = '081299998888';
    document.getElementById('bookEventName').value = 'Bridestory Annual Wedding Awards 2026';
    document.getElementById('bookVenue').value = 'The Westin Jakarta';
    document.getElementById('bookClientType').value = 'Corporate';
    document.getElementById('bookStartTime').value = '18:00';
    document.getElementById('bookEndTime').value = '22:00';
    document.getElementById('bookNotes').value = 'Awarding night untuk 50 vendor pernikahan terbaik.';

    const fakeEv = { preventDefault: () => {} };
    handlePublicBookingSubmit(fakeEv);

    const events = JSON.parse(localStorage.getItem('mc_events_db_v1') || '[]');
    const booked = events.find(e => e.date === '2026-11-20');
    return {
        bookedTitle: booked ? booked.title : null,
        bookedStatus: booked ? booked.status : null,
        calHasIt: window.calendarApp.events.some(e => e.date === '2026-11-20')
    };
})()
"@
    Assert-Test "2. Submit Booking Baru di Index.html Berhasil Disimpan" ($s2.bookedTitle -match 'Bridestory' -and $s2.bookedStatus -eq 'Tentative' -and $s2.calHasIt) "Title: $($s2.bookedTitle), Status: $($s2.bookedStatus)"

    # Step 3: Navigate to admin.html in the same browser session
    Write-Host "`nNavigating to Admin Portal (admin.html)..." -ForegroundColor Yellow
    Cdp-Navigate "http://localhost:8000/admin.html"

    # Step 4: Verify Admin Portal has the booking
    $s4 = Cdp-Eval @"
(() => {
    const adminEvents = window.adminEventsDb || (typeof adminEventsDb !== 'undefined' ? adminEventsDb : JSON.parse(localStorage.getItem('mc_events_db_v1') || '[]'));
    const eventInDb = adminEvents.find(e => e.date === '2026-11-20');
    const calHasIt = window.adminCalendar ? window.adminCalendar.events.some(e => e.date === '2026-11-20') : false;

    // Check ECC Selector
    const selector = document.getElementById('eccEventSelector');
    const options = selector ? Array.from(selector.options).map(o => o.text) : [];
    const inSelector = options.some(t => t.includes('Bridestory'));

    // Check CRM Table
    const tableBody = document.getElementById('customersTableBody');
    const inCrmTable = tableBody ? tableBody.innerHTML.includes('Dian Sastrowardoyo') : false;

    return {
        foundInAdmin: !!eventInDb,
        title: eventInDb ? eventInDb.title : '',
        calHasIt,
        inSelector,
        inCrmTable
    };
})()
"@
    Assert-Test "3. Admin Kalender Memuat Acara Hasil Booking Web Publik" ($s4.foundInAdmin -and $s4.calHasIt) "Title: $($s4.title)"
    Assert-Test "4. Event Command Center Memuat Acara Baru di Dropdown" ($s4.inSelector) "In Selector: $($s4.inSelector)"
    Assert-Test "5. CRM Data Pelanggan Menampilkan Pemesan Baru (Dian Sastrowardoyo)" ($s4.inCrmTable) "In CRM Table: $($s4.inCrmTable)"

    # Step 6: Admin locks the event (Changes status to Terkunci)
    $s6 = Cdp-Eval @"
(() => {
    const idx = adminEventsDb.findIndex(e => e.date === '2026-11-20');
    if (idx >= 0) {
        adminEventsDb[idx].status = 'Terkunci';
        adminEventsDb[idx].paymentStatus = 'DP 50% Paid';
        saveUnifiedEventsDatabase();
        if (window.adminCalendar) window.adminCalendar.setEvents(adminEventsDb);
        return { locked: true, status: adminEventsDb[idx].status };
    }
    return { locked: false };
})()
"@
    Assert-Test "6. Admin Mengunci Tanggal Acara Menjadi 'Terkunci'" ($s6.locked -and $s6.status -eq 'Terkunci') "Status: $($s6.status)"

    # Step 7: Navigate back to index.html
    Write-Host "`nNavigating back to Public Portal (index.html)..." -ForegroundColor Yellow
    Cdp-Navigate "http://localhost:8000/index.html"

    # Step 8: Verify Public Calendar now shows Terkunci and blocks conflict
    $s8 = Cdp-Eval @"
(() => {
    const events = getIntegratedPublicEvents();
    const ev = events.find(e => e.date === '2026-11-20');
    const calEv = window.calendarApp.events.find(e => e.date === '2026-11-20');

    // Try booking again on this locked date
    document.getElementById('bookEventDate').value = '2026-11-20';
    document.getElementById('bookPicName').value = 'Second Requester';
    document.getElementById('bookWa').value = '0899999999';
    document.getElementById('bookEventName').value = 'Conflicting Event';
    document.getElementById('bookVenue').value = 'Other Venue';

    const fakeEv = { preventDefault: () => {} };
    handlePublicBookingSubmit(fakeEv);

    const toast = document.querySelector('.toast')?.textContent || '';

    return {
        statusInDb: ev ? ev.status : null,
        calStatus: calEv ? calEv.status : null,
        conflictToast: toast
    };
})()
"@
    Assert-Test "7. Kalender Publik Menampilkan Status Terkunci dari Admin" ($s8.statusInDb -eq 'Terkunci' -and $s8.calStatus -eq 'Terkunci') "Status: $($s8.calStatus)"
    Assert-Test "8. Anti-Bentrok Menolak Permintaan Booking pada Tanggal Terkunci" ($s8.conflictToast.Contains('bentrok') -or $s8.conflictToast.Contains('TERKUNCI')) "Toast: $($s8.conflictToast)"

    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "TOTAL PASSED: $totalPass / $($totalPass + $totalFail)" -ForegroundColor Green
    if ($totalFail -gt 0) {
        Write-Host "TOTAL FAILED: $totalFail" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "ALL 8 BIDIRECTIONAL INTEGRATION CHECKS PASSED 100%! 🎉" -ForegroundColor Green
    }

    $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait()
} catch {
    Write-Host "Test error: $_" -ForegroundColor Red
    exit 1
} finally {
    Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile -ErrorAction SilentlyContinue }
}
