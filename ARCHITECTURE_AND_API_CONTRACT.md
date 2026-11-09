# OmniGenome Workbench™ — Shared Architecture & REST API Contract

Backend Base URL: `http://localhost:8000`
Frontend Dev Server URL: `http://localhost:5173` (with Vite proxy `/api` -> `http://localhost:8000/api`)

---

## 1. Core Data Structures

### 1.1 `ToolParameter`
```json
{
  "id": "threads",
  "flag": "-t",
  "label": "CPU Threads",
  "type": "number", // "boolean" | "number" | "select" | "multiselect" | "text" | "filepath"
  "tier": "hardware", // "standard" | "advanced" | "hardware"
  "default": 4,
  "min": 1,
  "max": 64,
  "step": 1,
  "options": [], // For select/multiselect: [{"value": "resfinder", "label": "ResFinder (Acquired AMR)"}]
  "required": false,
  "description": "Number of CPU threads allocated to the tool.",
  "beginner_note": "On laptops with 8-16 GB RAM, keeping threads at 4 prevents thermal throttling (>95°C) while maintaining high throughput."
}
```

### 1.2 `ToolDefinition`
```json
{
  "id": "spades",
  "name": "SPAdes Genome Assembler",
  "binary": "spades.py",
  "version": "3.15.5",
  "stage_id": 5,
  "stage_name": "Stage 5: De Novo Genome Assembly & Polishing",
  "category": "Assembly",
  "conda_env": "ngs_veterinary",
  "conda_package": "spades",
  "short_description": "St. Petersburg genome assembler for bacterial, isolate, plasmid, and metagenomic short/hybrid reads.",
  "detailed_description": "De Bruijn graph-based multi-k-mer genome assembler supporting Illumina paired-end, single-end, and hybrid Oxford Nanopore/PacBio reads.",
  "input_formats": ["FASTQ_PE", "FASTQ_SE", "FASTQ_LONG"],
  "output_formats": ["FASTA_CONTIGS", "FASTA_SCAFFOLDS", "GFA_GRAPH"],
  "documentation_url": "https://ablab.github.io/spades/",
  "parameters": [ ... ],
  "example_command": "spades.py -1 sample_R1.fastq.gz -2 sample_R2.fastq.gz -o 04_assembly/sample --isolate --cov-cutoff auto -t 4 -m 8"
}
```

### 1.3 `CodeInspectionResult` (1-Click "Inspect Executed Code & Learn" Payload)
```json
{
  "tool_id": "spades",
  "tool_name": "SPAdes Genome Assembler",
  "stage_name": "Stage 5: De Novo Genome Assembly & Polishing",
  "conda_env": "ngs_veterinary",
  "conda_activation_cmd": "conda activate /home/soumandeykakon/miniforge3/envs/ngs_veterinary",
  "single_sample_command": "spades.py -1 03_trimmed_reads/ERR14794383_R1.trimmed.fastq.gz -2 03_trimmed_reads/ERR14794383_R2.trimmed.fastq.gz -o 04_assembly/ERR14794383 --isolate -k 21,33,55,77 --cov-cutoff auto -t 4 -m 8",
  "wsl_wrapped_command": "wsl.exe -d Ubuntu -e bash -c \"/home/soumandeykakon/miniforge3/envs/ngs_veterinary/bin/spades.py -1 ...\"",
  "flag_breakdown": [
    {
      "token": "spades.py",
      "category": "Executable Binary",
      "meaning": "Main Python driver script for the SPAdes multi-k-mer de Bruijn graph genome assembler.",
      "why_used": "Invokes the read error-correction (BayesHammer) and iterative multi-k-mer assembly pipeline."
    },
    {
      "token": "-1 ... -2 ...",
      "category": "Input Paired-End Reads",
      "meaning": "Specifies forward (R1) and reverse (R2) paired-end Illumina FASTQ files.",
      "why_used": "Paired-end orientation and insert size allow SPAdes to resolve repeats and scaffold contigs."
    }
  ],
  "bash_batch_script": "#!/usr/bin/env bash\nset -euo pipefail\n...",
  "nextflow_dsl2_script": "nextflow.enable.dsl=2\n\nprocess SPADES_ASSEMBLE {\n...",
  "conda_yaml": "name: ngs_veterinary\nchannels:\n  - conda-forge\n  - bioconda\ndependencies:\n  - spades>=3.15.5\n",
  "beginner_tips": [
    "Always inspect `spades.log` and `contigs.fasta` after assembly.",
    "Use `--isolate` for high-coverage single bacterial isolates or `--careful` to minimize mismatches and short indels."
  ]
}
```

### 1.4 `Project` & `Sample`
```json
{
  "id": "proj_salmonella_50",
  "name": "South Asian Livestock Salmonella enterica WGS (50 Genomes)",
  "organism": "Salmonella enterica",
  "description": "Whole-Genome Sequencing, AMR, Virulome, Plasmid, Pan-Genome & Core-SNP Phylogenomics of 50 South Asian livestock isolates.",
  "wsl_path": "/home/soumandeykakon/NGS_DA",
  "created_at": "2026-06-20T00:00:00Z",
  "sample_count": 50,
  "status": "Completed & Ready",
  "samples": [
    {
      "id": "ERR14794383",
      "name": "ERR14794383",
      "country": "Bangladesh",
      "host": "Poultry (Gallus gallus)",
      "year": "2023",
      "r1_path": "/home/soumandeykakon/NGS_DA/01_raw_data/ERR14794383_1.fastq.gz",
      "r2_path": "/home/soumandeykakon/NGS_DA/01_raw_data/ERR14794383_2.fastq.gz",
      "assembly_path": "/home/soumandeykakon/NGS_DA/04_assembly/ERR14794383/contigs.fasta",
      "status": "Assembled & Profiled",
      "genome_size_bp": 4812450,
      "gc_percent": 52.1,
      "n50": 245800,
      "contigs": 42,
      "st": "ST11",
      "amr_genes": ["aac(6')-Iaa", "tet(A)", "sul1", "qnrS1"],
      "plasmids": ["IncX1", "IncFII(S)"]
    }
  ]
}
```

### 1.5 `JobRecord`
```json
{
  "id": "job_001",
  "name": "ABRicate AMR Scan (ResFinder)",
  "project_id": "proj_salmonella_50",
  "tool_id": "abricate",
  "tool_name": "ABRicate Mass Screening",
  "stage_name": "Stage 8: Resistome (AMR), Virulome & Plasmid Profiling",
  "execution_mode": "wsl_real", // "wsl_real" | "fast_simulation"
  "status": "completed", // "queued" | "running" | "cooling_down" | "completed" | "failed" | "cancelled"
  "progress": 100,
  "samples": ["ERR14794383"],
  "parameters": { "db": "resfinder", "minid": 80, "mincov": 60, "threads": 4 },
  "thermal_guard": { "max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 300, "enabled": true },
  "started_at": "2026-11-09T03:00:00Z",
  "completed_at": "2026-11-09T03:00:04Z",
  "duration_seconds": 4.2,
  "exit_code": 0,
  "logs": [ ... ],
  "code_inspection": { ... } // Full CodeInspectionResult embedded so 1-click button works instantly!
}
```

---

## 2. REST API Endpoints (`http://localhost:8000/api/...`)

1. `GET /api/health` -> `{"status": "ok", "platform": "OmniGenome Workbench", "version": "2.4.0-Enterprise", "wsl_available": true}`
2. `GET /api/wsl/status` -> Returns detected WSL2 Ubuntu distribution, Conda environments (`ngs_veterinary`, `wgs_env`, `ngs`, `system`), detected tool binaries with paths/versions, and hardware/thermal recommendations.
3. `POST /api/wsl/browse` -> Body: `{"path": "/home/soumandeykakon/NGS_DA"}` -> Lists directories and genomics files in WSL2 or Windows paths.
4. `GET /api/stages` -> Returns the 12 WGS stages with tool counts and descriptions.
5. `GET /api/tools` -> Returns all 65+ `ToolDefinition` objects across the 12 stages.
6. `GET /api/tools/{tool_id}` -> Returns a single `ToolDefinition`.
7. `POST /api/tools/custom` -> Registers a new user-defined custom CLI/GitHub bioinformatics tool into the registry.
8. `POST /api/code/inspect` -> Body: `{"tool_id": "...", "parameters": {...}, "sample_name": "ERR14794383", "samples": [...], "custom_flags": "", "thermal_guard": {...}}` -> Returns `CodeInspectionResult` (single command, flag-by-flag beginner anatomy, Bash loop script, Nextflow DSL2 script, Conda YAML).
9. `GET /api/presets` -> Returns the 6 pre-built Pipeline Presets (including node coordinates, edges, parameters, and compiled Nextflow/Bash code).
10. `POST /api/workflows/compile` -> Body: `{"name": "...", "nodes": [...], "edges": [...], "thermal_guard": {...}}` -> Validates compatibility between connected nodes and compiles the entire multi-tool workflow into both a Master Bash Pipeline Script and a Nextflow DSL2 (`main.nf`) workflow, plus per-step `CodeInspectionResult`s.
11. `POST /api/workflows/execute` -> Executes an entire multi-step workflow and creates linked jobs.
12. `GET /api/projects` -> Returns all projects (pre-populated with `proj_salmonella_50` mapped to `/home/soumandeykakon/NGS_DA` and `proj_ecoli_wgs_practice` mapped to `/home/soumandeykakon/wgs_practice`, plus ability to create new projects).
13. `POST /api/projects` -> Creates a new project or imports samples from a WSL/Windows directory or SRA accession list.
14. `POST /api/projects/{project_id}/samples` -> Adds samples or uploads FASTQ/FASTA metadata to a project.
15. `GET /api/jobs` -> Lists all jobs (pre-populated with historical runs + any live jobs run in the session), each containing its full `code_inspection` object.
16. `GET /api/jobs/{job_id}` -> Returns detailed status, real-time logs, and `code_inspection` for a job.
17. `POST /api/jobs/execute` -> Body: `{"project_id": "...", "tool_id": "...", "samples": [...], "parameters": {...}, "custom_flags": "", "execution_mode": "wsl_real" | "fast_simulation", "thermal_guard": {...}}` -> Launches the job (either executing the real binary in WSL2 Ubuntu `ngs_veterinary` / `/usr/bin` or running fast high-fidelity simulation) and returns the created `JobRecord`.
18. `POST /api/jobs/{job_id}/cancel` -> Cancels a running job.
19. `GET /api/results/summary?project_id=...` -> Returns comprehensive genomics analytics data for the Visualization Studio:
    - `amr_matrix`: 50 isolates x AMR genes presence/absence/identity matrix (parsed from `/home/soumandeykakon/NGS_DA/07_amr_profiling` + curated cohort data)
    - `plasmid_matrix`: IncX1, IncX2, IncFII(S), IncFII(pAR0022), IncI1, ColRNAI distribution
    - `virulence_summary`: VFDB virulence factor categories (`invA`, `hilA`, `spvB`, `iroN`, `fimH`, SPI-1 to SPI-5)
    - `pangenome_stats`: Roary breakdown (Core: 2,637; Soft-core: 914; Shell: 1,706; Cloud: 6,578; Total: 11,835) + accumulation curve data
    - `ani_matrix`: Pairwise FastANI identity matrix (98.5% - 99.99%) across representative isolates
    - `assembly_qc`: N50, L50, GC%, Total Length, Contig count per isolate
    - `phylogeny`: Real Newick tree from `/home/soumandeykakon/NGS_DA/Evolutionary_Tree_50_Genomes/core.tree` + pre-parsed hierarchical tree structure with metadata (Country, Host, ST, MDR status, key AMR genes) for interactive SVG rendering
    - `export_scripts`: Ready-to-run R `ggtree`/`ggtreeExtra` script, Python `seaborn` heatmap script, iTOL `DATASET_BINARY` / `DATASET_COLORSTRIP` templates, and Publication Methods text.
