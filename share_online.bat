@echo off
title GenomeLab — Free Global Online Sharing
cd /d "%~dp0"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0share_online.ps1"
pause
