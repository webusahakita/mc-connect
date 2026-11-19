@echo off
title MC-Connect v8.0 Pro - Terminator
color 0C

echo ============================================================
echo   MENGHENTIKAN LAYANAN MC-CONNECT v8.0 PRO
echo ============================================================
echo.

echo Menghentikan proses PHP artisan & Node dev server...
taskkill /F /FI "WINDOWTITLE eq MC-Connect Backend*" 2>NUL
taskkill /F /FI "WINDOWTITLE eq MC-Connect Vite*" 2>NUL

echo.
echo Layanan MC-Connect berhasil dihentikan.
echo (Catatan: MySQL tetap dibiarkan aktif untuk database lokal).
echo.
timeout /t 3 >NUL
