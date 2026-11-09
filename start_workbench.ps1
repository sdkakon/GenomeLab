# GenomeLab — Commercial Local & WSL2 Launcher (PowerShell)
$ErrorActionPreference = "Continue"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "==================================================================" -ForegroundColor White
Write-Host "  GenomeLab v2.4 Enterprise (Local + WSL2 Ubuntu)                 " -ForegroundColor White
Write-Host "  Visual WGS & Bioinformatics Platform | White/Black/Ash Edition  " -ForegroundColor Gray
Write-Host "==================================================================" -ForegroundColor White

# 1. Start FastAPI Backend on Port 8000
Write-Host "[1/3] Starting GenomeLab FastAPI Bioinformatics & WSL2 Engine on http://localhost:8000 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir'; python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Minimized

# 2. Start React + Vite Frontend on Port 5173
Write-Host "[2/3] Starting GenomeLab React Visual Workbench UI on http://localhost:5173 ..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RootDir\frontend'; npm run dev -- --host 0.0.0.0 --port 5173" -WindowStyle Minimized

# 3. Wait briefly and launch browser
Start-Sleep -Seconds 3
Write-Host "[3/3] Opening GenomeLab in your default browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"
Write-Host "GenomeLab is running! Access it at: http://localhost:5173" -ForegroundColor White
