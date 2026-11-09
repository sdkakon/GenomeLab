@echo off
title GenomeLab — 1-Click Windows & WSL2 Setup
cd /d "%~dp0"
echo Starting GenomeLab 1-Click Windows Setup...
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup_windows_wsl_wgs.ps1"
pause
