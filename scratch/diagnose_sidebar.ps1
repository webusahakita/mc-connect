$adminHtml = Get-Content -Raw "public/admin.html"
$adminJs = Get-Content -Raw "public/js/admin-core.js"
$adminCss = Get-Content -Raw "public/css/admin.css"

Write-Host "=== DIAGNOSING SIDEBAR MENU BUTTONS ===" -ForegroundColor Cyan

# Check sections referenced in sidebar
$sidebarMatches = [regex]::Matches($adminHtml, 'navigateToSection\(''([^'']+)''')
Write-Host "Sections referenced by sidebar buttons in admin.html:" -ForegroundColor Yellow
foreach ($m in $sidebarMatches) {
    $secId = $m.Groups[1].Value
    $hasSec = $adminHtml.Contains("id=`"$secId`"")
    Write-Host "  Section $secId -> $(if ($hasSec) { 'FOUND IN HTML' } else { 'MISSING IN HTML ❌' })"
}

# Check if sidebar CSS has pointer-events or z-index issues
Write-Host "`nChecking CSS for sidebar & sections:" -ForegroundColor Yellow
if ($adminHtml.Contains(".admin-section")) {
    Write-Host "  admin.html contains .admin-section rules"
}

# Check for modal overlays that might be active or blocking clicks
$activeModals = [regex]::Matches($adminHtml, 'class="modal-overlay[^"]*active')
Write-Host "`nModal overlays initially active:"
if ($activeModals.Count -eq 0) {
    Write-Host "  None (Clean)"
} else {
    foreach ($am in $activeModals) {
        Write-Host "  WARNING: active modal found: $($am.Value)" -ForegroundColor Red
    }
}
