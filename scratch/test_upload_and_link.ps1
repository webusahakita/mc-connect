$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$edgePath = "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
if (-not (Test-Path $edgePath)) {
    $edgePath = "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
}

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "VERIFICATION TEST: AUDIO UPLOAD & LINK FOR BGM AND SOUNDBOARD" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

$tmpProfile = "$PSScriptRoot\edge_audio_upload_link_profile"
if (Test-Path $tmpProfile) { Remove-Item -Recurse -Force $tmpProfile }

$proc = Start-Process -FilePath $edgePath -ArgumentList @(
    "--headless=new",
    "--remote-debugging-port=9258",
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
    $tabs = Invoke-RestMethod -Uri "http://localhost:9258/json/list" -TimeoutSec 5
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
        $memStream = New-Object System.IO.MemoryStream
        do {
            $recvSegment = New-Object System.ArraySegment[byte] -ArgumentList @($buffer, 0, $buffer.Length)
            $res = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
            $memStream.Write($buffer, 0, $res.Count)
        } while (-not $res.EndOfMessage)

        $responseStr = [System.Text.Encoding]::UTF8.GetString($memStream.ToArray())
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
        $null = $ws.ReceiveAsync($recvSegment, $cts.Token).Result
        Start-Sleep -Seconds 2
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

    # Step 1: Verify audioStorage IndexedDB Engine
    Write-Host "`n--- Step 1: Verify audioStorage IndexedDB Engine ---" -ForegroundColor Yellow
    $hasStorage = Cdp-Eval "typeof window.audioStorage !== 'undefined' && typeof window.audioStorage.saveAudioBlob === 'function'"
    Assert-Condition "audioStorage engine initialized on window" ($hasStorage -eq $true)

    $testSave = Cdp-Eval @"
    (async () => {
        const mockBlob = new Blob(['MOCK_AUDIO_CONTENT_FOR_TEST'], { type: 'audio/mpeg' });
        const res = await window.audioStorage.saveAudioBlob('test_key_1', mockBlob, { name: 'wedding_march.mp3' });
        const playUrl = await window.audioStorage.getAudioUrl('test_key_1');
        return (res && res.id === 'test_key_1' && typeof playUrl === 'string' && playUrl.startsWith('blob:'));
    })()
"@
    Assert-Condition "audioStorage saveAudioBlob & getAudioUrl produces valid blob URL" ($testSave -eq $true)

    # Step 2: Navigate to Command Center Tab 6 Musik Acara
    Write-Host "`n--- Step 2: Test Tab 6 Musik Acara Modal Tabs & Persistence ---" -ForegroundColor Yellow
    Cdp-Eval "navigateToSection('sec-command-center', document.getElementById('menu-command-center'))"
    Cdp-Eval "loadActiveEventInCommandCenter()"
    Cdp-Eval "switchTab('tab-music')"
    Cdp-Eval "switchMusicSubtab('bgm')"
    Start-Sleep -Milliseconds 500

    $openMusicModal = Cdp-Eval @"
    (() => {
        openAddMusicModal();
        return document.getElementById('modalManageMusic').classList.contains('active');
    })()
"@
    Assert-Condition "Opened Add Music Modal" ($openMusicModal -eq $true)

    # Test mode switching for music
    $testModes = Cdp-Eval @"
    (() => {
        setMusicSourceMode('upload');
        const upVis = document.getElementById('panelMusicUpload').style.display !== 'none';
        setMusicSourceMode('link');
        const linkVis = document.getElementById('panelMusicLink').style.display !== 'none';
        setMusicSourceMode('synth');
        const synthVis = document.getElementById('panelMusicSynth').style.display !== 'none';
        return upVis && linkVis && synthVis;
    })()
"@
    Assert-Condition "Music Modal source tab switching works (Upload, Link, Synth)" ($testModes -eq $true)

    # Simulate saving an Uploaded Music Track
    $saveUploadedMusic = Cdp-Eval @"
    (async () => {
        setMusicSourceMode('upload');
        document.getElementById('musicEditTitle').value = 'Wedding March of Eternity';
        document.getElementById('musicEditArtist').value = 'MC Live Symphony';
        document.getElementById('musicEditCategory').value = 'Entrance';
        document.getElementById('musicEditGenre').value = 'Romance';
        document.getElementById('musicEditCue').value = 'Play saat kedua mempelai memasuki ballroom';

        const fakeFile = new File([new Uint8Array([0xFF, 0xFB, 0x90, 0x64])], 'wedding_march_special.mp3', { type: 'audio/mpeg' });
        window._pendingMusicFile = fakeFile;

        const fakeEvent = { preventDefault: () => {} };
        await handleSaveMusic(fakeEvent);

        const ev = getActiveCommandCenterEvent();
        const tracks = getEventMusicList(ev);
        const saved = tracks.find(t => t.title === 'Wedding March of Eternity');
        return saved && saved.sourceType === 'upload' && saved.audioFileName === 'wedding_march_special.mp3' && !!saved.audioStorageId;
    })()
"@
    Assert-Condition "Saved uploaded BGM track with audioStorageId and metadata" ($saveUploadedMusic -eq $true)

    # Simulate saving a Link Music Track
    $saveLinkMusic = Cdp-Eval @"
    (async () => {
        openAddMusicModal();
        setMusicSourceMode('link');
        document.getElementById('musicEditTitle').value = 'Jazz Dinner Lounge';
        document.getElementById('musicEditArtist').value = 'Smooth Quartet';
        document.getElementById('musicEditCategory').value = 'Dinner';
        document.getElementById('musicEditAudioUrl').value = 'https://example.com/audio/dinner_lounge.mp3';

        const fakeEvent = { preventDefault: () => {} };
        await handleSaveMusic(fakeEvent);

        const ev = getActiveCommandCenterEvent();
        const tracks = getEventMusicList(ev);
        const saved = tracks.find(t => t.title === 'Jazz Dinner Lounge');
        return saved && saved.sourceType === 'link' && saved.audioUrl === 'https://example.com/audio/dinner_lounge.mp3';
    })()
"@
    Assert-Condition "Saved Link BGM track with direct audioUrl" ($saveLinkMusic -eq $true)

    # Verify table badges in admin music list
    $musicBadges = Cdp-Eval @"
    (() => {
        const tableHtml = document.getElementById('adminMusicTableContainer').innerHTML;
        const hasFileBadge = tableHtml.includes('wedding_march_special.mp3');
        const hasLinkBadge = tableHtml.includes('Link Web');
        return hasFileBadge && hasLinkBadge;
    })()
"@
    Assert-Condition "Music table displays File and Link badges correctly" ($musicBadges -eq $true)

    # Step 3: Test Sub-Tab 2 Soundboard SFX Modal Tabs & Persistence
    Write-Host "`n--- Step 3: Test Sub-Tab 2 Soundboard SFX Modal Tabs & Persistence ---" -ForegroundColor Yellow
    Cdp-Eval "switchMusicSubtab('soundboard')"
    Start-Sleep -Milliseconds 400

    $openSfxModal = Cdp-Eval @"
    (() => {
        openAddSoundboardModal();
        return document.getElementById('modalManageSoundboard').classList.contains('active');
    })()
"@
    Assert-Condition "Opened Add Soundboard Modal" ($openSfxModal -eq $true)

    # Test mode switching for soundboard
    $testSfxModes = Cdp-Eval @"
    (() => {
        setSoundboardSourceMode('preset');
        const presetVis = document.getElementById('panelSoundboardPreset').style.display !== 'none';
        setSoundboardSourceMode('upload');
        const upVis = document.getElementById('panelSoundboardUpload').style.display !== 'none';
        setSoundboardSourceMode('link');
        const linkVis = document.getElementById('panelSoundboardLink').style.display !== 'none';
        return presetVis && upVis && linkVis;
    })()
"@
    Assert-Condition "Soundboard Modal source tab switching works (Preset, Upload, Link)" ($testSfxModes -eq $true)

    # Simulate saving an Uploaded SFX
    $saveUploadedSfx = Cdp-Eval @"
    (async () => {
        setSoundboardSourceMode('upload');
        document.getElementById('soundboardEditName').value = 'Grand Crowd Applause';
        document.getElementById('soundboardEditIcon').value = '👏';
        document.getElementById('soundboardEditKey').value = '7';
        document.getElementById('soundboardEditVolume').value = '90';

        const fakeFile = new File([new Uint8Array([0x52, 0x49, 0x46, 0x46])], 'stadium_applause.wav', { type: 'audio/wav' });
        window._pendingSoundboardFile = fakeFile;

        const fakeEvent = { preventDefault: () => {} };
        await handleSaveSoundboard(fakeEvent);

        const ev = getActiveCommandCenterEvent();
        const sfxList = getEventSoundboardList(ev);
        const saved = sfxList.find(s => s.name === 'Grand Crowd Applause');
        return saved && saved.sourceType === 'upload' && saved.audioFileName === 'stadium_applause.wav' && !!saved.audioStorageId;
    })()
"@
    Assert-Condition "Saved uploaded Soundboard item with audioStorageId and metadata" ($saveUploadedSfx -eq $true)

    # Simulate saving a Link SFX
    $saveLinkSfx = Cdp-Eval @"
    (async () => {
        openAddSoundboardModal();
        setSoundboardSourceMode('link');
        document.getElementById('soundboardEditName').value = 'Comedy Rimshot';
        document.getElementById('soundboardEditIcon').value = '🥁';
        document.getElementById('soundboardEditKey').value = '8';
        document.getElementById('soundboardEditAudioUrl').value = 'https://example.com/sfx/rimshot.wav';

        const fakeEvent = { preventDefault: () => {} };
        await handleSaveSoundboard(fakeEvent);

        const ev = getActiveCommandCenterEvent();
        const sfxList = getEventSoundboardList(ev);
        const saved = sfxList.find(s => s.name === 'Comedy Rimshot');
        return saved && saved.sourceType === 'link' && saved.audioUrl === 'https://example.com/sfx/rimshot.wav';
    })()
"@
    Assert-Condition "Saved Link Soundboard item with direct audioUrl" ($saveLinkSfx -eq $true)

    # Verify table badges in admin soundboard list
    $sfxBadges = Cdp-Eval @"
    (() => {
        const tableHtml = document.getElementById('adminSoundboardTableContainer').innerHTML;
        const hasFile = tableHtml.includes('stadium_applause.wav');
        const hasLink = tableHtml.includes('rimshot.wav');
        return hasFile && hasLink;
    })()
"@
    Assert-Condition "Soundboard table displays File and Link badges correctly" ($sfxBadges -eq $true)

    # Capture Admin screenshot showing verified badges
    $adminScreenshotPath = "$PSScriptRoot\admin_audio_upload_link_verified.png"
    Cdp-Screenshot $adminScreenshotPath
    Assert-Condition "Admin screenshot captured: $adminScreenshotPath" (Test-Path $adminScreenshotPath)

    # Step 4: Verify Stage Mode custom soundboard pads
    Write-Host "`n--- Step 4: Verify Stage Mode Synchronization & Triggering ---" -ForegroundColor Yellow
    Cdp-Navigate "http://localhost:8000/stage.html"
    Start-Sleep -Seconds 2

    $hasStageStorage = Cdp-Eval "typeof window.audioStorage !== 'undefined'"
    Assert-Condition "audioStorage engine loaded in Stage Mode" ($hasStageStorage -eq $true)

    $diag = Cdp-Eval @"
    (() => {
        const grid = document.getElementById('stageSoundboardGrid');
        if (!grid) return { ok: false, error: 'NO_GRID' };
        const html = grid.innerHTML;
        const hasApplause = html.includes('Grand Crowd Applause');
        const hasRimshot = html.includes('Comedy Rimshot');
        const hasUploadIcon = html.includes('Offline Audio File') || html.includes('📁');
        const hasLinkIcon = html.includes('Web Audio Link') || html.includes('🔗');
        return {
            ok: (hasApplause && hasRimshot && hasUploadIcon && hasLinkIcon),
            hasApplause,
            hasRimshot,
            hasUploadIcon,
            hasLinkIcon,
            padCount: grid.children.length,
            names: Array.from(grid.querySelectorAll('.sound-pad')).map(p => p.textContent.trim().replace(/\s+/g, ' '))
        };
    })()
"@
    Write-Host "Stage Diag: ok=$($diag.ok), hasApplause=$($diag.hasApplause), hasRimshot=$($diag.hasRimshot), hasUpload=$($diag.hasUploadIcon), hasLink=$($diag.hasLinkIcon), pads=$($diag.padCount)" -ForegroundColor Cyan
    Write-Host "Pads: $(($diag.names) -join ' | ')" -ForegroundColor Gray
    Assert-Condition "Stage Mode displays custom upload & link sound pads with indicators" ($diag.ok -eq $true)

    # Test triggerStageSound invocation
    $testTrigger = Cdp-Eval @"
    (async () => {
        let triggerCalled = false;
        let triggeredItem = null;
        window.soundboard.triggerSoundboardItem = async (item, vol) => {
            triggerCalled = true;
            triggeredItem = item;
            return true;
        };

        const activePads = stageSoundboardList.filter(p => p.enabled !== false);
        const uploadPadIdx = activePads.findIndex(p => p.name === 'Grand Crowd Applause');
        if (uploadPadIdx === -1) return false;

        const btn = document.getElementById('stage-pad-' + uploadPadIdx);
        await triggerStageSound(uploadPadIdx, btn);
        return triggerCalled && triggeredItem && triggeredItem.name === 'Grand Crowd Applause';
    })()
"@
    Assert-Condition "triggerStageSound seamlessly invokes custom audio trigger on stage" ($testTrigger -eq $true)

    # Capture Stage screenshot
    $stageScreenshotPath = "$PSScriptRoot\stage_custom_sound_verified.png"
    Cdp-Screenshot $stageScreenshotPath
    Assert-Condition "Stage screenshot captured: $stageScreenshotPath" (Test-Path $stageScreenshotPath)

} finally {
    if ($ws -and $ws.State -eq [System.Net.WebSockets.WebSocketState]::Open) {
        $ws.CloseAsync([System.Net.WebSockets.WebSocketCloseStatus]::NormalClosure, "Done", [System.Threading.CancellationToken]::None).Wait()
    }
    if ($proc -and -not $proc.HasExited) {
        Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
    }
    if (Test-Path $tmpProfile) {
        Remove-Item -Recurse -Force $tmpProfile -ErrorAction SilentlyContinue
    }
}

$summaryColor = if ($failedCount -eq 0) { "Green" } else { "Red" }
Write-Host "`n=================================================================" -ForegroundColor Cyan
Write-Host "SUMMARY: $passedCount Passed, $failedCount Failed" -ForegroundColor $summaryColor
Write-Host "=================================================================" -ForegroundColor Cyan

if ($failedCount -gt 0) { exit 1 } else { exit 0 }
