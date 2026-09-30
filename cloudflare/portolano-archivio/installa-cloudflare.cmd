@echo off
title Portolano - archivio su Cloudflare
cd /d "%~dp0"
where node >nul 2>nul || (echo Serve Node.js: https://nodejs.org (versione LTS^). Poi rilancia questo file. & pause & exit /b 1)
node installa.js
echo.
pause
