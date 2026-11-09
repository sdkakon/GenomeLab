#!/usr/bin/env bash
# ==============================================================================
# GenomeLab (v2.4 Enterprise) — Direct WSL2 Ubuntu Launcher & CLI Diagnostic
# Run inside WSL2 Ubuntu terminal:
#   cd /mnt/c/Users/User/Desktop/GUI_Based_Genome_Analysis
#   bash start_inside_wsl.sh
# ==============================================================================
set -e

echo "=============================================================================="
echo "  GenomeLab v2.4 Enterprise — WSL2 Ubuntu CLI Verification & Launcher"
echo "=============================================================================="

# 1. Activate Bioinformatics Conda Environment Path
export PATH="/home/soumandeykakon/miniforge3/envs/wgs_env/bin:/home/soumandeykakon/miniforge3/envs/ngs_veterinary/bin:/home/soumandeykakon/miniforge3/bin:/usr/bin:$PATH"

echo ""
echo "[1/3] Checking WSL2 Ubuntu & Bioinformatics CLI Tools..."
echo "  - Linux Kernel : $(uname -srmo)"
echo "  - WSL2 User    : $(whoami)"
echo "  - FastQC       : $(fastqc --version 2>&1 | head -n 1 || echo 'Not found')"
echo "  - fastp        : $(fastp --version 2>&1 | head -n 1 || echo 'Not found')"
echo "  - SPAdes       : $(spades.py --version 2>&1 | head -n 1 || echo 'Not found')"
echo "  - Prokka       : $(prokka --version 2>&1 | head -n 1 || echo 'Not found')"
echo "  - ABRicate     : $(abricate --version 2>&1 | head -n 1 || echo 'Not found')"

echo ""
echo "[2/3] Checking Existing WSL2 Genomics Workspaces..."
ls -d /home/soumandeykakon/NGS_DA /home/soumandeykakon/wgs_practice 2>/dev/null || true

echo ""
echo "[3/3] Starting GenomeLab Backend & Frontend..."
echo "  -> Open http://localhost:5173 in your web browser!"
echo "=============================================================================="

# Launch via Windows bridge or native Linux Python/Node if installed
if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start_workbench.bat
else
    python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 &
    cd frontend && npm run dev -- --host 0.0.0.0 --port 5173
fi
