#!/usr/bin/env bash
# ==============================================================================
# GenomeLab — Instant Free Global Online Sharing (Linux / WSL2 / macOS)
# ==============================================================================
set -euo pipefail

echo ""
echo "===================================================================="
echo "   GenomeLab Enterprise — 1-Click Free Global Online Sharing        "
echo "===================================================================="
echo "  * 100% Free Forever (Powered by Cloudflare Tunnels)"
echo "  * No Router Port Forwarding & No Account Required"
echo "  * End-to-End Encrypted HTTPS"
echo "===================================================================="
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "[*] cloudflared not found. Downloading standalone binary..."
    mkdir -p .bin
    ARCH="$(uname -m)"
    if [ "$ARCH" = "x86_64" ]; then
        curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o .bin/cloudflared
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o .bin/cloudflared
    else
        echo "[!] Unsupported architecture: $ARCH. Please install cloudflared manually."
        exit 1
    fi
    chmod +x .bin/cloudflared
    CLOUDFLARED=".bin/cloudflared"
else
    CLOUDFLARED="cloudflared"
fi

echo "[*] Connecting tunnel to http://127.0.0.1:8000..."
echo "[*] Open the generated https://...trycloudflare.com URL in any browser!"
echo ""

$CLOUDFLARED tunnel --url http://127.0.0.1:8000
