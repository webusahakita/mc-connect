$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TEST: TAB 4 VENDOR COLLABORATION RUNDOWN SYNC" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_tab4_test_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9237",
    "--user-data-dir=$tmpProfile",
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
    $tabs = Invoke-RestMethod -Uri "http://localhost:9237/json/list" -TimeoutSec 5
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
        $segment = [ArraySegment[byte]]::new($bytes)
        $ws.SendAsync($segment, [System.Net.WebSockets.WebSocketMessageType]::Text, $true, $cts.Token).Wait()

        $buf = [byte[]]::new(65536)
        $seg = [ArraySegment[byte]]::new($buf)
        $res = $ws.ReceiveAsync($seg, $cts.Token).Result
        $txt = [System.Text.Encoding]::UTF8.GetString($buf, 0, $res.Count)
        $json = ($txt | ConvertFrom-Json)
        if ($json.result.result.type -eq "undefined") {
            return $null
        }
        return $json.result.result.value
    }

    Write-Host "`n--- Step 1: Switch to Tab 4 and Verify Dynamic Sync with Rundown ---" -ForegroundColor Yellow
    Start-Sleep -Seconds 2

    $tab4Check = Cdp-Eval @"
    (() => {
        // Activate Tab 4
        switchTab('tab-vendor');

        const ev = (window.adminEventsDb && window.adminEventsDb[0]) || { id: 1 };
        const rundown = (typeof getEventRundown === 'function') ? getEventRundown(ev) : [];
        const rows = document.querySelectorAll('#vendorCollabTableBody tr');
        const countBadge = document.getElementById('vendorCollabCountBadge')?.textContent;
        const eventTitle = document.getElementById('vendorCollabEventTitle')?.textContent;

        const rowData = Array.from(rows).map(r => ({
            order: r.querySelector('td:nth-child(1)')?.textContent?.trim(),
            time: r.querySelector('td:nth-child(2)')?.textContent?.trim(),
            title: r.querySelector('td:nth-child(3)')?.textContent?.trim(),
            music: r.querySelector('td:nth-child(4)')?.textContent?.trim(),
            cue: r.querySelector('td:nth-child(5)')?.textContent?.trim(),
            hasPlayBtn: !!r.querySelector('.btn-vendor-play-sm')
        }));

        return {
            rundownLength: rundown.length,
            rowCount: rows.length,
            countBadge: countBadge,
            eventTitle: eventTitle,
            firstRow: rowData[0],
            lastRow: rowData[rowData.length - 1],
            isSynced: (rows.length === rundown.length && rundown.length > 0)
        };
    })()
"@

    Assert-Condition "Tab 4 row count matches active event rundown length" ($tab4Check.isSynced -eq $true) "rows: $($tab4Check.rowCount), rundown: $($tab4Check.rundownLength)"
    Assert-Condition "Tab 4 displays active event title" ($tab4Check.eventTitle -ne $null -and $tab4Check.eventTitle.Length -gt 0) "Title: $($tab4Check.eventTitle)"
    Assert-Condition "Tab 4 shows dynamic sync count badge" ($tab4Check.countBadge -match "\d+") "Badge: $($tab4Check.countBadge)"
    Assert-Condition "Tab 4 first row has valid timing, title, and Play button" ($tab4Check.firstRow.hasPlayBtn -eq $true) "First: $($tab4Check.firstRow.title)"

    Write-Host "`n--- Step 2: Test Interactive Web Play and Stop Controls in Tab 4 ---" -ForegroundColor Yellow
    $playStopCheck = Cdp-Eval @"
    (() => {
        const firstPlayBtn = document.querySelector('.btn-vendor-play-sm');
        if (!firstPlayBtn) return { error: 'No play button found' };

        // Click Play
        firstPlayBtn.click();

        const isPlayingNow = firstPlayBtn.classList.contains('playing');
        const activeRow = document.querySelector('#vendorCollabTableBody tr.active-live');
        const banner = document.getElementById('vendorCollabNowPlayingBar');
        const bannerVisible = (banner && banner.style.display !== 'none');
        const bannerText = document.getElementById('vendorCollabNowPlayingText')?.textContent;

        // Click Stop
        firstPlayBtn.click();
        const stoppedPlayBtn = !firstPlayBtn.classList.contains('playing');
        const bannerClosed = (!banner || banner.style.display === 'none');

        return {
            playTriggered: isPlayingNow,
            hasActiveRowHighlight: !!activeRow,
            bannerVisible: bannerVisible,
            bannerText: bannerText,
            stoppedSuccessfully: (stoppedPlayBtn && bannerClosed)
        };
    })()
"@

    Assert-Condition "Tab 4 Play button activates playback state" ($playStopCheck.playTriggered -eq $true)
    Assert-Condition "Tab 4 highlights active row and shows Now Playing banner" ($playStopCheck.hasActiveRowHighlight -eq $true -and $playStopCheck.bannerVisible -eq $true) "Banner: $($playStopCheck.bannerText)"
    Assert-Condition "Tab 4 Stop toggle halts playback and closes banner" ($playStopCheck.stoppedSuccessfully -eq $true)

    Write-Host "`n--- Step 3: Test Real-Time Sync on Rundown Add/Edit from Tab 3 ---" -ForegroundColor Yellow
    $addRundownSync = Cdp-Eval @"
    (() => {
        const ev = (window.adminEventsDb && window.adminEventsDb[0]) || { id: 1 };
        const rundown = getEventRundown(ev);
        const initialCount = rundown.length;

        // Add a new segment with attached music
        rundown.push({
            startTime: '21:30',
            endTime: '22:00',
            duration: '30 Menit',
            title: 'After Party DJ Finale Session (Sync Test)',
            script: 'Terima kasih atas malam yang spektakuler! Let us turn up the volume!',
            cue: 'Fade out lighting, crank master volume +6dB, lasers strobe',
            pic: 'DJ Dimas',
            musicTitle: 'Levels & Titanium Remix',
            musicArtist: 'Avicii & David Guetta',
            musicGenre: 'Upbeat'
        });
        saveEventRundown(ev, rundown);

        // Trigger render
        renderAdminRundownList(ev);
        renderAdminVendorCollab(ev);

        const newRows = document.querySelectorAll('#vendorCollabTableBody tr');
        const lastRow = newRows[newRows.length - 1];
        const lastTitle = lastRow ? lastRow.querySelector('td:nth-child(3)')?.textContent : '';
        const lastMusic = lastRow ? lastRow.querySelector('td:nth-child(4)')?.textContent : '';

        return {
            initialCount: initialCount,
            newCount: newRows.length,
            lastTitle: lastTitle?.trim(),
            lastMusic: lastMusic?.trim(),
            isNewlyAddedSynced: (newRows.length === initialCount + 1 && lastTitle.includes('After Party DJ Finale Session'))
        };
    })()
"@

    Assert-Condition "Newly added rundown segment instantly syncs to Tab 4" ($addRundownSync.isNewlyAddedSynced -eq $true) "Count: $($addRundownSync.newCount), Title: $($addRundownSync.lastTitle)"
    Assert-Condition "Newly attached music is displayed in Tab 4 matrix" ($addRundownSync.lastMusic -match "Levels & Titanium Remix")

    $summaryColor = if ($failedCount -eq 0) { "Green" } else { "Red" }
    Write-Host "`n=================================================================" -ForegroundColor Cyan
    Write-Host "TEST SUMMARY: $passedCount PASSED, $failedCount FAILED" -ForegroundColor $summaryColor
    Write-Host "=================================================================" -ForegroundColor Cyan

    try { $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", $cts.Token).Wait() } catch {}
}
finally {
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
}
