#!/usr/bin/env bash
# ==============================================================================
# GenomeLab — Automated WSL2 / Ubuntu Bioinformatics Toolchain Setup
# Designed for Beginners & Easy Distribution to Any New Computer
# ==============================================================================
set -euo pipefail

ENV_NAME="${1:-wgs_env}"
MODE="${2:-full}" # "minimal" | "full"

echo "======================================================================"
echo "  GenomeLab — Automated Bioinformatics Environment Setup              "
echo "  Target Environment: ${ENV_NAME} (${MODE} suite)                     "
echo "======================================================================"

# 1. Check / Install System Prerequisites
echo "[Step 1/5] Checking Ubuntu/Linux system packages..."
if command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y
    sudo apt-get install -y build-essential curl wget git unzip zip pigz default-jre python3 python3-pip
fi

# 2. Check / Install Miniforge3 (Mamba + Conda)
CONDA_BASE=""
if [ -d "$HOME/miniforge3" ]; then
    CONDA_BASE="$HOME/miniforge3"
elif [ -d "$HOME/miniconda3" ]; then
    CONDA_BASE="$HOME/miniconda3"
elif command -v conda >/dev/null 2>&1; then
    CONDA_BASE="$(conda info --base)"
fi

if [ -z "$CONDA_BASE" ]; then
    echo "[Step 2/5] Installing Miniforge3 (High-Speed Mamba Package Manager)..."
    INSTALLER="/tmp/Miniforge3-Linux-x86_64.sh"
    wget -q --show-progress -O "$INSTALLER" "https://github.com/conda-forge/miniforge/releases/latest/download/Miniforge3-Linux-x86_64.sh"
    bash "$INSTALLER" -b -p "$HOME/miniforge3"
    rm -f "$INSTALLER"
    CONDA_BASE="$HOME/miniforge3"
    "$CONDA_BASE/bin/conda" init bash || true
else
    echo "[Step 2/5] Found existing Conda/Miniforge installation at: $CONDA_BASE"
fi

export PATH="$CONDA_BASE/bin:$PATH"

# Configure Bioconda & Conda-Forge channels
echo "[Step 3/5] Configuring conda-forge and bioconda channels..."
conda config --add channels defaults || true
conda config --add channels bioconda || true
conda config --add channels conda-forge || true
conda config --set channel_priority flexible || true

SOLVER="conda"
if command -v mamba >/dev/null 2>&1; then
    SOLVER="mamba"
fi

# 3. Create or Update the Target Bioinformatics Environment
if ! conda env list | awk '{print $1}' | grep -qx "$ENV_NAME"; then
    echo "[Step 4/5] Creating bioinformatics environment '$ENV_NAME' (Python 3.10)..."
    $SOLVER create -n "$ENV_NAME" python=3.10 -y
else
    echo "[Step 4/5] Environment '$ENV_NAME' already exists. Updating tools..."
fi

echo "[Step 4/5] Installing WGS & Genomics Toolchain into '$ENV_NAME'..."
if [ "$MODE" = "minimal" ]; then
    $SOLVER install -n "$ENV_NAME" -c conda-forge -c bioconda -y \
        fastqc multiqc fastp spades quast prokka abricate mlst bwa samtools bcftools iqtree seqkit
else
    $SOLVER install -n "$ENV_NAME" -c conda-forge -c bioconda -y \
        sra-tools fastqc multiqc seqkit fastp trimmomatic cutadapt \
        kraken2 bracken mash \
        spades unicycler megahit skesa flye \
        quast prokka abricate staramr mlst \
        roary fastani snippy parsnp \
        bwa bowtie2 minimap2 samtools bcftools freebayes \
        iqtree raxml fasttree blast pigz biopython pandas matplotlib seaborn
fi

# 4. Initialize Reference Databases (ABRicate & Prokka)
echo "[Step 5/5] Initializing ABRicate and Prokka reference databases..."
"$CONDA_BASE/envs/$ENV_NAME/bin/abricate" --setupdb || true
"$CONDA_BASE/envs/$ENV_NAME/bin/abricate" --list || true
"$CONDA_BASE/envs/$ENV_NAME/bin/prokka" --setupdb || true

# 5. Create Default Workspace Directories for Beginners
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/01_raw_fastq"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/02_qc"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/03_trimmed"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/04_assembly"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/05_annotation"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/06_amr_virulence"
mkdir -p "$HOME/GenomeLab_Workspaces/Starter_Project/07_phylogeny"

echo "======================================================================"
echo "  SUCCESS! GenomeLab WSL2/Linux Toolchain is Ready!                   "
echo "  Environment Path: $CONDA_BASE/envs/$ENV_NAME                        "
echo "  Workspace Path:   $HOME/GenomeLab_Workspaces                        "
echo "======================================================================"
