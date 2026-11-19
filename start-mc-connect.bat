@echo off
title MC-Connect v8.0 Pro - Launcher
color 0E

echo ============================================================
echo   MC-CONNECT v8.0 PRO - DECOUPLED REACT 19 SPA LAUNCHER
echo ============================================================
echo.

:: 1. Cek & Jalankan MySQL (XAMPP)
echo [1/4] Memeriksa status database MySQL...
tasklist /FI "IMAGENAME eq mysqld.exe" 2>NUL | find /I /N "mysqld.exe" >NUL
if "%ERRORLEVEL%"=="0" (
    echo       [OK] MySQL service sudah aktif.
) else (
    echo       [..] Menjalankan daemon MySQL XAMPP...
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        start /b "MySQL" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 2 /nobreak >NUL
        echo       [OK] MySQL berhasil dijalankan.
    ) else (
        echo       [!] Peringatan: C:\xampp\mysql\bin\mysqld.exe tidak ditemukan. Pastikan MySQL sudah menyala.
    )
)

:: 2. Jalankan Laravel Artisan Backend
echo [2/4] Menjalankan Laravel Backend Server (Port 9000)...
set PHP_BIN=php
if exist "C:\xampp\php\php.exe" set PHP_BIN=C:\xampp\php\php.exe
start "MC-Connect Backend :9000" /min "%PHP_BIN%" artisan serve --host=127.0.0.1 --port=9000

:: 3. Jalankan Vite Dev Server
echo [3/4] Menjalankan Vite Frontend Server (Port 5173)...
start "MC-Connect Vite :5173" /min cmd /c "npm.cmd run dev"

:: 4. Tunggu server warm-up lalu buka browser
echo [4/4] Membuka browser ke Admin Workspace...
timeout /t 3 /nobreak >NUL
start http://localhost:9000/admin

echo.
echo ============================================================
echo   SELURUH SISTEM MC-CONNECT TELAH BERJALAN!
echo ============================================================
echo   * URL Admin Modern SPA : http://localhost:9000/admin
echo   * URL Landing Page SPA : http://localhost:9000/
echo   * Safe Bridge (Legacy) : http://localhost:9000/legacy/admin
echo ============================================================
echo.
echo Catatan: Jendela ini dapat Anda minimize.
echo Untuk mematikan server, jalankan 'stop-mc-connect.bat'
echo atau tutup jendela command prompt background.
echo.
pause
