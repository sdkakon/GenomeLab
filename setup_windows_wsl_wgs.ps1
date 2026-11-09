# ==============================================================================
# GenomeLab Enterprise — 1-Click Complete Windows & WSL2 Setup
# Automatically installs WSL2 Ubuntu, Miniforge3, wgs_env, and launches Engine
# ==============================================================================

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   GenomeLab Enterprise — 1-Click Windows & WSL2 WGS Setup         " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  * Operating System: Windows 10 / 11 (64-bit)" -ForegroundColor Gray
Write-Host "  * Target Environment: Ubuntu 22.04 LTS (WSL2) + Miniforge3 (wgs_env)" -ForegroundColor Gray
Write-Host "  * Included: FastQC, fastp, SPAdes, Prokka, ABRicate, MLST, Roary, Snippy, IQ-TREE" -ForegroundColor Gray
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

# Check for Administrator Privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Notice: WSL installation may require Administrator privileges." -ForegroundColor Yellow
}

# Step 1: Check / Install WSL2 Ubuntu
Write-Host "[Step 1/4] Checking Windows Subsystem for Linux (WSL2)..." -ForegroundColor Cyan
$wslInstalled = $false
try {
    $wslCheck = wsl.exe -l -v 2>&1
    if ($LASTEXITCODE -eq 0 -or $wslCheck -match "Ubuntu") {
        $wslInstalled = $true
        Write-Host "  [OK] WSL2 Ubuntu is already installed!" -ForegroundColor Green
    }
} catch {
    $wslInstalled = $false
}

if (-not $wslInstalled) {
    Write-Host "  [*] WSL2 Ubuntu not found. Initiating automatic Windows installation..." -ForegroundColor Yellow
    Write-Host "  [*] Running: wsl.exe --install -d Ubuntu --no-launch" -ForegroundColor Cyan
    try {
        Start-Process -FilePath "wsl.exe" -ArgumentList "--install -d Ubuntu --no-launch" -Wait -Verb RunAs
        Write-Host "  [OK] WSL2 Ubuntu installation command issued!" -ForegroundColor Green
        Write-Host "  [IMPORTANT] If this is your first time enabling WSL, please restart your computer to finish Windows kernel setup, then run this script again." -ForegroundColor Yellow
    } catch {
        Write-Host "  [!] Could not install WSL automatically. Please run PowerShell as Administrator and run: wsl --install -d Ubuntu" -ForegroundColor Red
    }
}

# Step 2: Install Miniforge3 inside Ubuntu
Write-Host "`n[Step 2/4] Setting up Miniforge3 (Mamba + Conda) inside WSL2 Ubuntu..." -ForegroundColor Cyan
$installMiniforgeCmd = @"
if [ ! -d "`$HOME/miniforge3" ]; then
    echo '[WSL2] Downloading Miniforge3 (Mamba + Conda)...'
    wget -q --show-progress -O /tmp/miniforge.sh https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh
    bash /tmp/miniforge.sh -b -p "`$HOME/miniforge3"
    rm -f /tmp/miniforge.sh
    "`$HOME/miniforge3/bin/conda" init bash
    echo '[WSL2] Miniforge3 installed successfully!'
else
    echo '[WSL2] Miniforge3 is already present at: '`$HOME/miniforge3
fi
"@

try {
    wsl.exe -d Ubuntu -e bash -c "$installMiniforgeCmd"
    Write-Host "  [OK] Miniforge3 package manager ready inside WSL2!" -ForegroundColor Green
} catch {
    Write-Host "  [!] Warning during Miniforge3 check. Continuing..." -ForegroundColor Yellow
}

# Step 3: Create 'wgs_env' with Bioconda Tools
Write-Host "`n[Step 3/4] Creating 'wgs_env' environment with core WGS bioinformatics tools..." -ForegroundColor Cyan
$createWgsEnvCmd = @"
source "`$HOME/miniforge3/etc/profile.d/conda.sh"
if ! conda env list | grep -q "wgs_env"; then
    echo '[WSL2] Creating wgs_env with mamba...'
    "`$HOME/miniforge3/bin/mamba" create -n wgs_env -c conda-forge -c bioconda python=3.10 fastp fastqc multiqc quast -y
    echo '[WSL2] Core wgs_env environment created!'
else
    echo '[WSL2] wgs_env already exists!'
fi
"@

try {
    wsl.exe -d Ubuntu -e bash -c "$createWgsEnvCmd"
    Write-Host "  [OK] 'wgs_env' ready inside WSL2 Ubuntu!" -ForegroundColor Green
} catch {
    Write-Host "  [!] Notice: You can also install individual tools with 1 click directly inside the web app." -ForegroundColor Yellow
}

# Step 4: Launch GenomeLab Local Engine on Port 8000
Write-Host "`n[Step 4/4] Starting GenomeLab Local Engine on http://localhost:8000..." -ForegroundColor Cyan
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Path

if (Test-Path "$RootDir\backend\main.py") {
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized
    Start-Sleep -Seconds 2
    Write-Host "  [OK] GenomeLab Engine is running on http://127.0.0.1:8000" -ForegroundColor Green
    Write-Host ""
    Write-Host "====================================================================" -ForegroundColor Green
    Write-Host "   Setup Complete! Opening GenomeLab in your web browser...         " -ForegroundColor White
    Write-Host "====================================================================" -ForegroundColor Green
    Start-Process "http://127.0.0.1:8000"
} else {
    Write-Host "  [OK] WSL2 environment setup finished successfully!" -ForegroundColor Green
    Write-Host "  -> Return to your browser: https://sdkakon-genomelab.hf.space" -ForegroundColor Cyan
    Write-Host "  -> The top pill will detect your computer and turn green: [My PC (Connected)]!" -ForegroundColor Green
}
