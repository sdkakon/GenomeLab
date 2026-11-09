# GenomeLab (v2.4 Enterprise)

**Commercial-Grade Local & WSL2/Ubuntu Graphical Bioinformatics & Whole-Genome Sequencing (WGS) Platform**

**GenomeLab** combines the visual simplicity of **Galaxy**, the scalable pipeline orchestration of **Nextflow**, and the unrestricted flexibility of the **Linux Command-Line Interface (CLI)** in a clean, distraction-free **White Theme with Carbon Black & Ash Controls**.

---

## Easy Setup for Any New Computer (Beginner-Friendly Distribution)

If you are sharing **GenomeLab** with colleagues, students, or another laboratory computer:

1. **First-Time Setup (1-Click)**:
   Double-click [`setup_for_new_computer.bat`](file:///c:/Users/User/Desktop/GUI_Based_Genome_Analysis/setup_for_new_computer.bat) (or run `.\setup_for_new_computer.ps1`).
   - Automatically verifies/installs Python backend packages and React/TypeScript frontend packages.
   - Optionally runs [`setup_linux_or_wsl.sh`](file:///c:/Users/User/Desktop/GUI_Based_Genome_Analysis/setup_linux_or_wsl.sh) inside WSL2 Ubuntu to install Miniforge3/Mamba, create the `ngs_veterinary` Bioconda environment, install all 65+ WGS tools, and initialize `ABRicate` and `Prokka` reference databases.
   - Beginners can also install tools **inside the GenomeLab Web UI** with a single click in the **WSL2 & Beginner Setup Center**!

2. **Daily Launch (1-Click)**:
   Double-click [`start_workbench.bat`](file:///c:/Users/User/Desktop/GUI_Based_Genome_Analysis/start_workbench.bat) (or run `.\start_workbench.ps1`).
   - **GenomeLab Web UI**: http://localhost:5173
   - **GenomeLab Backend API & Interactive Docs**: http://localhost:8000/docs

---

## Key Capabilities Over Standard Galaxy

1. **65+ Genome Sequence Analysis Tools Across All 12 WGS Stages**:
   - **Stage 1 — Data Ingestion & SRA Retrieval**: `fasterq-dump`, `prefetch`, `NCBI Entrez Metadata Extractor`, `ENA Direct FTP Downloader`, `SeqKit split`, `sra-stat`
   - **Stage 2 — Raw Read Quality Control**: `FastQC`, `MultiQC`, `SeqKit stats`, `NanoPlot`, `fastp QC`
   - **Stage 3 — Read Trimming, Filtering & Host Depletion**: `fastp`, `Trimmomatic`, `Cutadapt`, `BBDuk`, `Porechop`, `Filtlong`, `Bowtie2 Host Depletion`
   - **Stage 4 — Taxonomic Classification & Contamination**: `Kraken2`, `Bracken`, `Centrifuge`, `Mash screen`, `ConFindr`
   - **Stage 5 — De Novo Genome Assembly & Polishing**: `SPAdes`, `Unicycler`, `MEGAHIT`, `SKESA`, `Flye`, `Canu`, `Miniasm`, `Pilon`, `Polypolish`
   - **Stage 6 — Assembly Quality Assessment**: `QUAST`, `CheckM`, `CheckM2`, `BUSCO`, `Bandage`
   - **Stage 7 — Genome Structural & Functional Annotation**: `Prokka`, `Bakta`, `NCBI PGAP`, `EggNOG-mapper`, `InterProScan`, `Barrnap`, `tRNAscan-SE`
   - **Stage 8 — Resistome (AMR), Virulome, Plasmid & MGE Profiling**: `ABRicate` (`resfinder`, `card`, `ncbi`, `argannot`, `megares`, `vfdb`, `plasmidfinder`, `ecoh`, `ecoli_vf`), `AMRFinderPlus`, `StarAMR`, `CARD RGI`, `MOB-suite`, `PlasmidFinder`, `IntegronFinder`, `ISEScan`, `Phigaro`
   - **Stage 9 — Sequence Typing (MLST) & Pathogen Serotyping**: `mlst` (PubMLST), `chewBBACA` (cgMLST), `SeqSero2`, `SISTR`, `ECTyper`, `Kleborate`, `spaTyper`
   - **Stage 10 — Pan-Genome & Average Nucleotide Identity (ANI)**: `Roary`, `Panaroo`, `FastANI`, `Mash dist`, `Scoary`, `BLASTn`, `BLASTp`
   - **Stage 11 — Reference Mapping & Variant Calling (SNPs/Indels)**: `Snippy`, `snippy-core`, `Parsnp`, `BWA-MEM`, `Bowtie2`, `Minimap2`, `SAMtools`, `BCFtools`, `FreeBayes`, `GATK HaplotypeCaller`, `SnpEff`, `Gubbins`, `SNP-sites`
   - **Stage 12 — Phylogenomics & Publication Visualization**: `IQ-TREE 2`, `RAxML-NG`, `FastTree`, `ggtree / ggtreeExtra Publisher`, `iTOL Annotation Generator`

2. **1-Click "Inspect Executed Code & Learn" Beginner Window**:
   - Every tool and executed job features a single-click button that opens an interactive educational window showing:
     - The **exact CLI command** executed
     - A **token-by-token / flag-by-flag beginner explanation** in plain English
     - An automated **Bash Batch Script (`for` loop)** for 50+ genomes
     - A reproducible **Nextflow DSL2 (`main.nf`)** workflow script and `conda.yml`
