# ==============================================================================
# GenomeLab — Instant Free Global Online Sharing (Cloudflare Tunnel)
# Makes GenomeLab accessible to anyone worldwide via a free public HTTPS URL
# ==============================================================================

Write-Host ""
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "   GenomeLab Enterprise — 1-Click Free Global Online Sharing        " -ForegroundColor Green
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host "  * 100% Free Forever (Powered by Cloudflare Tunnels)" -ForegroundColor Yellow
Write-Host "  * No Router Port Forwarding & No Account Required" -ForegroundColor Yellow
Write-Host "  * End-to-End Encrypted HTTPS" -ForegroundColor Yellow
Write-Host "====================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir

# 1. Verify Backend Server is Running on Port 8000
$portActive = $false
try {
    $tcp = New-Object System.Net.Sockets.TcpClient
    $tcp.Connect("127.0.0.1", 8000)
    $tcp.Close()
    $portActive = $true
} catch {
    $portActive = $false
}

if (-not $portActive) {
    Write-Host "[*] GenomeLab server is not running on port 8000." -ForegroundColor Yellow
    Write-Host "[*] Starting GenomeLab unified web service in the background..." -ForegroundColor Cyan
    Start-Process -FilePath "python" -ArgumentList "-m uvicorn backend.main:app --host 127.0.0.1 --port 8000" -WindowStyle Minimized
    Start-Sleep -Seconds 3
} else {
    Write-Host "[OK] GenomeLab server is actively running on http://127.0.0.1:8000" -ForegroundColor Green
}

# 2. Check or Download cloudflared.exe
$binDir = Join-Path $ScriptDir ".bin"
$cloudflaredPath = Join-Path $binDir "cloudflared.exe"

if (-not (Test-Path $cloudflaredPath)) {
    # Check if cloudflared is on system PATH
    $sysCf = Get-Command "cloudflared" -ErrorAction SilentlyContinue
    if ($sysCf) {
        $cloudflaredPath = $sysCf.Source
    } else {
        if (-not (Test-Path $binDir)) {
            New-Item -ItemType Directory -Path $binDir -Force | Out-Null
        }
        Write-Host "[*] Downloading official Cloudflare Tunnel tool (one-time setup, ~25MB)..." -ForegroundColor Cyan
        $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
        try {
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri $url -OutFile $cloudflaredPath -UseBasicParsing
            Write-Host "[OK] Downloaded cloudflared successfully!" -ForegroundColor Green
        } catch {
            Write-Host "[!] Failed to download cloudflared automatically. You can install it via 'winget install Cloudflare.cloudflared' or download from github.com/cloudflare/cloudflared" -ForegroundColor Red
            Exit 1
        }
    }
}

Write-Host ""
Write-Host "[*] Launching secure Cloudflare Tunnel to http://127.0.0.1:8000..." -ForegroundColor Cyan
Write-Host "[*] A public HTTPS URL (e.g. https://...trycloudflare.com) will appear below." -ForegroundColor Yellow
Write-Host "[*] Anyone in the world can open that URL in their browser to use GenomeLab!" -ForegroundColor Green
Write-Host "[*] Press Ctrl+C at any time to stop sharing." -ForegroundColor DarkGray
Write-Host "--------------------------------------------------------------------" -ForegroundColor Gray
Write-Host ""

& $cloudflaredPath tunnel --url http://127.0.0.1:8000
