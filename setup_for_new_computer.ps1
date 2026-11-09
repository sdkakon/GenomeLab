# ==============================================================================
# GenomeLab — 1-Click Beginner Installer for New Windows Computers
# ==============================================================================
$ErrorActionPreference = "Continue"
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $RootDir

Write-Host "======================================================================" -ForegroundColor White
Write-Host "  GenomeLab — New Computer Setup & Installer Wizard                   " -ForegroundColor White
Write-Host "  Sets up Backend, Frontend, and WSL2 Bioinformatics Toolchain        " -ForegroundColor Gray
Write-Host "======================================================================" -ForegroundColor White

# Step 1: Verify Python
Write-Host "`n[Step 1/4] Checking Python installation..." -ForegroundColor Cyan
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pyVer = python --version
    Write-Host "  -> Found $pyVer" -ForegroundColor Green
    Write-Host "  -> Installing Backend Python dependencies (FastAPI, Uvicorn, Pydantic)..." -ForegroundColor Gray
    python -m pip install --upgrade pip
    python -m pip install -r "$RootDir\backend\requirements.txt"
} else {
    Write-Host "  [!] Python 3.10+ not found. Please install Python from https://www.python.org/downloads/" -ForegroundColor Yellow
}

# Step 2: Verify Node.js & Install Frontend Packages
Write-Host "`n[Step 2/4] Checking Node.js & Frontend dependencies..." -ForegroundColor Cyan
if (Get-Command npm -ErrorAction SilentlyContinue) {
    $nodeVer = node --version
    Write-Host "  -> Found Node.js $nodeVer" -ForegroundColor Green
    Set-Location "$RootDir\frontend"
    Write-Host "  -> Installing Frontend UI packages (React, TypeScript, Tailwind CSS)..." -ForegroundColor Gray
    npm install
    Set-Location $RootDir
} else {
    Write-Host "  [!] Node.js not found. Please install Node.js LTS from https://nodejs.org/" -ForegroundColor Yellow
}

# Step 3: Check WSL2 Ubuntu
Write-Host "`n[Step 3/4] Checking Windows Subsystem for Linux (WSL2 Ubuntu)..." -ForegroundColor Cyan
if (Get-Command wsl -ErrorAction SilentlyContinue) {
    Write-Host "  -> WSL is available on this machine." -ForegroundColor Green
    $installWslTools = Read-Host "Would you like to automatically install/verify Miniforge3 + all Bioconda WGS tools inside WSL2 Ubuntu now? (y/N)"
    if ($installWslTools -match "^[Yy]") {
        Write-Host "  -> Running setup_linux_or_wsl.sh inside WSL2 Ubuntu..." -ForegroundColor Cyan
        $wslScriptPath = (wsl -d Ubuntu wslpath -a ($RootDir + "\setup_linux_or_wsl.sh")).Trim()
        wsl -d Ubuntu -e bash -c "tr -d '\r' < '$wslScriptPath' > /tmp/genomelab_setup.sh && chmod +x /tmp/genomelab_setup.sh && bash /tmp/genomelab_setup.sh wgs_env full"
    } else {
        Write-Host "  -> Skipping full Bioconda CLI installation for now. (You can install any tool with 1 click directly inside the GenomeLab web app!)" -ForegroundColor Gray
    }
} else {
    Write-Host "  [!] WSL2 is not yet enabled. Run 'wsl --install -d Ubuntu' in an Administrator PowerShell, or use the 1-Click Setup Center inside the app." -ForegroundColor Yellow
}

# Step 4: Launch Application
Write-Host "`n[Step 4/4] Setup Complete! You can launch GenomeLab anytime using 'start_workbench.bat'." -ForegroundColor Green
$launchNow = Read-Host "Launch GenomeLab now? (Y/n)"
if ($launchNow -notmatch "^[Nn]") {
    & "$RootDir\start_workbench.ps1"
}
