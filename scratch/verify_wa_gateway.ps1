$adminHtml = Get-Content -Raw "public/admin.html"
$adminJs = Get-Content -Raw "public/js/admin-core.js"

Write-Host "=== VERIFYING WA AUTOMATION GATEWAY ===" -ForegroundColor Cyan

# 1. Check admin.html elements
$checksHtml = @(
    "id=`"waAutomationModal`"",
    "id=`"waModalTitle`"",
    "id=`"waModalEventTitle`"",
    "id=`"waModalClientName`"",
    "id=`"waModalClientPhone`"",
    "id=`"waModalMessageText`"",
    "sendFromWaModal()",
    "copyWaModalText()",
    "openWaPreviewModal('confirm')",
    "sendWaAutomation('confirm')",
    "openWaPreviewModal('dp')",
    "sendWaAutomation('dp')",
    "openWaPreviewModal('settlement')",
    "sendWaAutomation('settlement')",
    "openWaPreviewModal('review')",
    "sendWaAutomation('review')",
    "id=`"postEventReviewTemplate`"",
    "id=`"tabReviewSubtitle`""
)

$allPassed = $true
Write-Host "`n1. Checking HTML Elements in public/admin.html:" -ForegroundColor Yellow
foreach ($c in $checksHtml) {
    if ($adminHtml -match [regex]::Escape($c)) {
        Write-Host "  [PASS] Found: $c" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Missing: $c" -ForegroundColor Red
        $allPassed = $false
    }
}

# 2. Check JS Functions in admin-core.js
$checksJs = @(
    "function formatWaPhoneNumber",
    "function getWaAutomationData",
    "function sendWaAutomation",
    "function simulateWa",
    "function openWaPreviewModal",
    "function sendFromWaModal",
    "function copyWaModalText",
    "window.sendWaAutomation = sendWaAutomation",
    "window.simulateWa = simulateWa",
    "window.openWaPreviewModal = openWaPreviewModal",
    "window.sendFromWaModal = sendFromWaModal",
    "window.copyWaModalText = copyWaModalText",
    "https://wa.me/"
)

Write-Host "`n2. Checking JavaScript in public/js/admin-core.js:" -ForegroundColor Yellow
foreach ($c in $checksJs) {
    if ($adminJs -match [regex]::Escape($c)) {
        Write-Host "  [PASS] Found: $c" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Missing: $c" -ForegroundColor Red
        $allPassed = $false
    }
}

# 3. Check Live Server Response
Write-Host "`n3. Checking Live Server on http://localhost:8000/admin.html:" -ForegroundColor Yellow
try {
    $res = Invoke-WebRequest -Uri "http://localhost:8000/admin.html" -UseBasicParsing -TimeoutSec 5
    if ($res.StatusCode -eq 200 -and $res.Content -match "waAutomationModal") {
        Write-Host "  [PASS] Live Server HTTP 200 OK and contains waAutomationModal" -ForegroundColor Green
    } else {
        Write-Host "  [FAIL] Unexpected server response code $($res.StatusCode)" -ForegroundColor Red
        $allPassed = $false
    }
} catch {
    Write-Host "  [FAIL] Could not connect to server: $_" -ForegroundColor Red
    $allPassed = $false
}

Write-Host "`n========================================="
if ($allPassed) {
    Write-Host "ALL VERIFICATION CHECKS PASSED SUCCESSFULLY! ✅" -ForegroundColor Green
} else {
    Write-Host "SOME VERIFICATION CHECKS FAILED! ❌" -ForegroundColor Red
    exit 1
}
