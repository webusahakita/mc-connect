$files = @(
    "public/js/soundboard.js",
    "public/js/teleprompter.js",
    "public/js/live-sync.js",
    "public/js/calendar.js",
    "public/js/customers.js",
    "public/js/app.js",
    "public/js/admin-core.js"
)

Write-Host "=== CHECKING JAVASCRIPT FILES FOR SYNTAX/RUNTIME ISSUES ===" -ForegroundColor Cyan
foreach ($f in $files) {
    if (Test-Path $f) {
        $content = Get-Content -Raw $f
        Write-Host "File $f : $(($content -split "`n").Count) lines, $($content.Length) bytes" -ForegroundColor Green
    } else {
        Write-Host "MISSING FILE: $f" -ForegroundColor Red
    }
}
