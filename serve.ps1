# =============================================================================
# MC-Connect Local HTTP Server (Laravel Artisan Serve)
# =============================================================================
$port = 9000

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MC-Connect - Sistem Manajemen & Booking MC Terpadu v8.0" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Menjalankan Laravel Server..." -ForegroundColor White
Write-Host "Akses URL yang Tersedia:" -ForegroundColor White
Write-Host "  1. Landing Page (Publik)   : http://localhost:$port/" -ForegroundColor Green
Write-Host "  2. Admin MC & Command Ctr  : http://localhost:$port/admin" -ForegroundColor Yellow
Write-Host "  3. Stage Mode (Prompter)   : http://localhost:$port/stage" -ForegroundColor Cyan
Write-Host "  4. Layar Vendor Musik      : http://localhost:$port/vendor" -ForegroundColor Magenta
Write-Host ""
Write-Host "Server aktif di latar belakang. Tekan Ctrl+C untuk menghentikan." -ForegroundColor Gray
Write-Host ""

$env:PATH = "C:\xampp\php;C:\xampp\mysql\bin;" + $env:PATH
php artisan serve --port=$port
