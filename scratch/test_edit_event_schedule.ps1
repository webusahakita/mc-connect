$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "RUNNING AUTOMATED TEST: EDIT VENUE & JAM ACARA INTEGRATION" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_edit_schedule_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9235",
    "--user-data-dir=$tmpProfile",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "http://localhost:8000/admin.html"
) -PassThru

Start-Sleep -Seconds 3

try {
    $tabs = Invoke-RestMethod -Uri "http://localhost:9235/json/list" -TimeoutSec 5
    $targetTab = $tabs | Where-Object { $_.url -match "admin.html" } | Select-Object -First 1

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

    # Test 1: Verify presence of modal and functions
    $t1 = Cdp-Eval @"
(() => {
    return {
        hasModal: !!document.getElementById('editEventScheduleModal'),
        hasFuncOpen: typeof window.openEditEventScheduleModal === 'function',
        hasFuncCalc: typeof window.calculateScheduleDuration === 'function',
        hasFuncSave: typeof window.handleSaveEventSchedule === 'function',
        eventsCount: window.adminEventsDb ? window.adminEventsDb.length : 0
    };
})()
"@
    Assert-Test "Modal `#editEventScheduleModal` and global functions loaded in admin.html" ($t1.hasModal -and $t1.hasFuncOpen -and $t1.hasFuncCalc -and $t1.hasFuncSave -and $t1.eventsCount -gt 0) "Events Count: $($t1.eventsCount)"

    # Test 2: Verify calculateScheduleDuration calculations
    $t2 = Cdp-Eval @"
(() => {
    const d1 = window.calculateScheduleDuration('18:00', '22:00'); // 4 Jam
    const d2 = window.calculateScheduleDuration('17:30', '23:00'); // 5.5 Jam
    const d3 = window.calculateScheduleDuration('21:00', '01:00'); // Overnight 4 Jam
    const d4 = window.calculateScheduleDuration('19:00', '22:15'); // 3 Jam 15 Menit
    return { d1, d2, d3, d4 };
})()
"@
    Assert-Test "Duration calculations (standard, half-hour, overnight, partial)" ($t2.d1 -eq '4 Jam' -and $t2.d2 -eq '5.5 Jam' -and $t2.d3 -eq '4 Jam' -and $t2.d4 -eq '3 Jam 15 Menit') "d1=$($t2.d1), d2=$($t2.d2), d3=$($t2.d3), d4=$($t2.d4)"

    # Test 3: Open Modal for active event (Event ID 1) and verify field population
    $t3 = Cdp-Eval @"
(() => {
    const ev1 = window.adminEventsDb[0];
    window.openEditEventScheduleModal(ev1.id);
    const modal = document.getElementById('editEventScheduleModal');
    const idVal = document.getElementById('editScheduleEventId')?.value;
    const titleVal = document.getElementById('editScheduleEventTitle')?.value;
    const venueVal = document.getElementById('editScheduleEventVenue')?.value;
    const startVal = document.getElementById('editScheduleStartTime')?.value;
    const endVal = document.getElementById('editScheduleEndTime')?.value;
    const durVal = document.getElementById('editScheduleDuration')?.value;
    const isActive = modal.classList.contains('active');
    return {
        isActive,
        idVal: String(idVal),
        targetId: String(ev1.id),
        titleVal,
        venueVal,
        startVal,
        endVal,
        durVal
    };
})()
"@
    Assert-Test "Opening Edit Modal loads event data correctly" ($t3.isActive -and $t3.idVal -eq $t3.targetId -and $t3.venueVal.Length -gt 0 -and $t3.startVal.Length -gt 0) "Venue: $($t3.venueVal), Hours: $($t3.startVal) - $($t3.endVal), Dur: $($t3.durVal)"

    # Test 4: Test live time change and automatic duration update
    $t4 = Cdp-Eval @"
(() => {
    const startInput = document.getElementById('editScheduleStartTime');
    const endInput = document.getElementById('editScheduleEndTime');
    startInput.value = '17:00';
    endInput.value = '23:30';
    window.handleEditTimeChange();
    const durVal = document.getElementById('editScheduleDuration')?.value;
    const preview = document.getElementById('editScheduleTimePreview')?.textContent;
    return { durVal, preview };
})()
"@
    Assert-Test "Live change of hours auto-updates duration & preview" ($t4.durVal -eq '6.5 Jam' -and $t4.preview -match '17:00 - 23:30 WIB') "Duration: $($t4.durVal), Preview: $($t4.preview)"

    # Test 5: Test real-time collision detection
    $t5 = Cdp-Eval @"
(() => {
    // Pick another event's date (event index 1)
    const otherEv = window.adminEventsDb[1];
    const dateInput = document.getElementById('editScheduleEventDate');
    dateInput.value = otherEv.date;
    window.checkEditScheduleCollision();
    const alertEl = document.getElementById('editScheduleCollisionAlert');
    const hasConflictWarning = alertEl.style.display !== 'none' && alertEl.textContent.includes('Peringatan Jadwal Bentrok');
    
    // Now set to an empty date in 2028
    dateInput.value = '2028-11-25';
    window.checkEditScheduleCollision();
    const hasFreeAlert = alertEl.style.display !== 'none' && alertEl.textContent.includes('Bebas Bentrok');

    return { hasConflictWarning, hasFreeAlert, otherDate: otherEv.date };
})()
"@
    Assert-Test "Collision detection shows conflict warning on collision and free alert on free date" ($t5.hasConflictWarning -and $t5.hasFreeAlert) "Tested with other date: $($t5.otherDate)"

    # Test 6: Save edited schedule and venue
    $t6 = Cdp-Eval @"
(() => {
    const ev1 = window.adminEventsDb[0];
    document.getElementById('editScheduleEventId').value = ev1.id;
    document.getElementById('editScheduleEventTitle').value = 'Wedding Reception Farhan & Natasha (Luxury Royal)';
    document.getElementById('editScheduleEventDate').value = '2026-09-18';
    document.getElementById('editScheduleEventVenue').value = 'Grand Ballroom Fairmont Hotel Senayan, Jakarta';
    document.getElementById('editScheduleStartTime').value = '17:30';
    document.getElementById('editScheduleEndTime').value = '22:30';
    document.getElementById('editScheduleEventStatus').value = 'Terkunci';
    window.handleEditTimeChange();

    // Trigger save
    window.handleSaveEventSchedule({ preventDefault: () => {} });

    // Verify modal is closed
    const modal = document.getElementById('editEventScheduleModal');
    const isClosed = !modal.classList.contains('active');

    // Verify updated object in adminEventsDb
    const updatedEv = window.adminEventsDb.find(e => String(e.id) === String(ev1.id));
    return {
        isClosed,
        updatedVenue: updatedEv ? updatedEv.venue : null,
        updatedTime: updatedEv ? updatedEv.time : null,
        updatedStart: updatedEv ? updatedEv.startTime : null,
        updatedEnd: updatedEv ? updatedEv.endTime : null,
        updatedDur: updatedEv ? updatedEv.duration : null
    };
})()
"@
    Assert-Test "handleSaveEventSchedule successfully saves updated venue and hours to adminEventsDb" ($t6.isClosed -and $t6.updatedVenue -eq 'Grand Ballroom Fairmont Hotel Senayan, Jakarta' -and $t6.updatedStart -eq '17:30' -and $t6.updatedEnd -eq '22:30') "Venue: $($t6.updatedVenue), Time: $($t6.updatedTime)"

    # Test 7: Verify Event Command Center header reflects updated venue & time
    $t7 = Cdp-Eval @"
(() => {
    const metaVenue = document.getElementById('ccEventMetaVenue')?.textContent;
    const metaTime = document.getElementById('ccEventMetaTime')?.textContent;
    const metaTitle = document.getElementById('ccEventTitle')?.textContent;
    return { metaVenue, metaTime, metaTitle };
})()
"@
    Assert-Test "Event Command Center header metadata reflects updated venue & hours" ($t7.metaVenue -match 'Fairmont' -and $t7.metaTime -match '17:30 - 22:30' -and $t7.metaTitle -match 'Luxury Royal') "Header Venue: $($t7.metaVenue), Time: $($t7.metaTime)"

    # Test 8: Verify persistence in localStorage and CRM synchronization
    $t8 = Cdp-Eval @"
(() => {
    const eventsJson = localStorage.getItem('mc_events_db_v1');
    const events = eventsJson ? JSON.parse(eventsJson) : [];
    const ev = events.find(e => String(e.id) === '1');

    const custJson = localStorage.getItem('mc_customers_db_v1');
    const custs = custJson ? JSON.parse(custJson) : [];
    const cust = custs.find(c => String(c.id) === '1' || c.event.includes('Farhan'));

    return {
        eventsPersistedVenue: ev ? ev.venue : null,
        eventsPersistedTime: ev ? ev.time : null,
        custPersistedVenue: cust ? cust.venue : null,
        custPersistedFormattedDate: cust ? cust.formattedDate : null,
        custPersistedTime: cust ? cust.time : null
    };
})()
"@
    Assert-Test "Persistence in localStorage (mc_events_db_v1 & mc_customers_db_v1)" ($t8.eventsPersistedVenue -match 'Fairmont' -and $t8.eventsPersistedTime -match '17:30 - 22:30' -and $t8.custPersistedVenue -match 'Fairmont') "Persisted Venue: $($t8.eventsPersistedVenue)"

    # Test 9: Verify public portal index.html reads updated event schedule
    Cdp-Navigate("http://localhost:8000/index.html")
    Start-Sleep -Seconds 2

    $t9 = Cdp-Eval @"
(() => {
    const pubEvents = getIntegratedPublicEvents();
    const ev = pubEvents.find(e => String(e.id) === '1' || e.title.includes('Farhan'));
    return {
        pubCount: pubEvents.length,
        pubVenue: ev ? ev.venue : null,
        pubTime: ev ? ev.time : null,
        pubTitle: ev ? ev.title : null
    };
})()
"@
    Assert-Test "Public calendar portal index.html loads updated venue and event hours" ($t9.pubVenue -match 'Fairmont' -and $t9.pubTime -match '17:30 - 22:30') "Public Event Venue: $($t9.pubVenue), Time: $($t9.pubTime)"

    $summaryColor = "Green"
    if ($totalFail -gt 0) { $summaryColor = "Red" }
    Write-Host ""
    Write-Host "=================================================================" -ForegroundColor Cyan
    Write-Host "TEST SUMMARY: $totalPass PASSED / $( $totalPass + $totalFail ) TOTAL" -ForegroundColor $summaryColor
    Write-Host "=================================================================" -ForegroundColor Cyan

} finally {
    if ($ws -and $ws.State -eq 'Open') {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait()
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force
    }
    if (Test-Path $tmpProfile) {
        Remove-Item -Recurse -Force $tmpProfile -ErrorAction SilentlyContinue
    }
}
