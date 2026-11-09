"""GenomeLab — 1-Click 'Inspect Executed Code & Learn' Engine & Multi-Step Pipeline Compiler."""

from typing import Dict, Any, List, Optional
from backend.tool_registry import get_tool_by_id, TOOLS_REGISTRY


def generate_code_inspection(
    tool_id: str,
    parameters: Optional[Dict[str, Any]] = None,
    sample_name: str = "ERR14794383",
    samples: Optional[List[str]] = None,
    custom_flags: str = "",
    thermal_guard: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    tool = get_tool_by_id(tool_id) or TOOLS_REGISTRY[0]
    params = parameters or {}
    t_guard = thermal_guard or {"max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 300, "enabled": True}
    sample_list = samples if samples else [sample_name, "ERR14838559", "SRR14421695", "SRR17139628", "SRR2584863"]
    primary_sample = sample_list[0] if sample_list else sample_name

    binary = tool["binary"]
    stage_id = tool["stage_id"]
    conda_env = tool.get("conda_env", "wgs_env")
    conda_pkg = tool.get("conda_package", tool["id"])

    # Build realistic input/output paths based on stage
    if stage_id == 1:
        io_tokens = f"{primary_sample} -O 01_raw_data/{primary_sample}"
        in_token_desc = f"Accession or raw signal input ({primary_sample}) written to 01_raw_data/."
    elif stage_id == 2:
        io_tokens = f"01_raw_data/{primary_sample}_1.fastq.gz 01_raw_data/{primary_sample}_2.fastq.gz -o 02_quality_control/{primary_sample}"
        in_token_desc = "Forward (_1) and Reverse (_2) paired-end raw FASTQ files evaluated for per-base Phred quality."
    elif stage_id == 3:
        io_tokens = (
            f"-i 01_raw_data/{primary_sample}_1.fastq.gz -I 01_raw_data/{primary_sample}_2.fastq.gz "
            f"-o 03_trimmed_reads/{primary_sample}_R1.trimmed.fastq.gz -O 03_trimmed_reads/{primary_sample}_R2.trimmed.fastq.gz"
        )
        in_token_desc = "Paired-end raw reads trimmed of adapters and low-quality 3' bases into 03_trimmed_reads/."
    elif stage_id in (4, 5):
        io_tokens = (
            f"-1 03_trimmed_reads/{primary_sample}_R1.trimmed.fastq.gz "
            f"-2 03_trimmed_reads/{primary_sample}_R2.trimmed.fastq.gz "
            f"-o 04_assembly/{primary_sample}"
        )
        in_token_desc = "High-quality trimmed paired-end reads assembled into de novo contigs (contigs.fasta)."
    elif stage_id in (6, 7):
        io_tokens = f"04_assembly/{primary_sample}/contigs.fasta --outdir 06_annotation/{primary_sample} --prefix {primary_sample}"
        in_token_desc = "Assembled contigs.fasta scanned for open reading frames (CDS), tRNAs, rRNAs, and completeness."
    elif stage_id in (8, 9):
        io_tokens = f"04_assembly/{primary_sample}/contigs.fasta > 07_amr_profiling/{primary_sample}_{tool['id']}.tsv"
        in_token_desc = "Assembled genome contigs screened against curated resistance/virulence/plasmid/MLST databases."
    elif stage_id == 10:
        io_tokens = f"-f 12_pangenome/{tool['id']}_out 06_annotation/*/*.gff"
        in_token_desc = "Cohort-wide GFF3/FASTA files compared for core/accessory pan-genome clusters or pairwise FastANI."
    elif stage_id == 11:
        io_tokens = f"--ref references/genome.fasta --ctgs 04_assembly/{primary_sample}/contigs.fasta --outdir 11_snp_phylogeny/{primary_sample}"
        in_token_desc = "Isolate reads/contigs mapped against reference genome to call high-confidence SNPs and indels (VCF)."
    else:
        io_tokens = f"-s Evolutionary_Tree_50_Genomes/core.aln -pre Evolutionary_Tree_50_Genomes/{primary_sample}_{tool['id']}"
        in_token_desc = "Core-genome alignment or Newick tree processed for Maximum-Likelihood phylogenomics and publication plots."

    flag_parts: List[str] = []
    breakdown: List[Dict[str, str]] = [
        {
            "token": binary,
            "category": "Core Bioinformatics Executable",
            "meaning": f"Launches {tool['name']} (v{tool['version']}) from the '{conda_env}' environment.",
            "why_used": tool["short_description"],
        },
        {
            "token": io_tokens,
            "category": "Input / Output Data Streams",
            "meaning": in_token_desc,
            "why_used": f"Connects {', '.join(tool['input_formats'])} inputs to {', '.join(tool['output_formats'])} outputs.",
        },
    ]

    for p in tool.get("parameters", []):
        pid = p["id"]
        val = params.get(pid, p.get("default"))
        if pid == "threads" and t_guard.get("enabled"):
            val = min(int(val or 4), int(t_guard.get("max_threads", 4)))
        if pid == "memory_gb" and t_guard.get("enabled"):
            val = min(int(val or 8), int(t_guard.get("max_ram_gb", 8)))

        flag = p.get("flag", "")
        ptype = p.get("type", "text")

        if ptype == "boolean":
            if val:
                token_str = flag if flag else f"--{pid}"
                flag_parts.append(token_str)
                breakdown.append({
                    "token": token_str,
                    "category": f"{p.get('tier', 'standard').capitalize()} Flag",
                    "meaning": p.get("description", ""),
                    "why_used": p.get("beginner_note") or f"Enables '{p['label']}' for reproducible {tool['category']} analysis.",
                })
        else:
            if val is not None and str(val) != "":
                if flag.startswith("--") and str(val).startswith("--"):
                    token_str = str(val)
                elif flag.endswith(":") or flag.endswith("="):
                    token_str = f"{flag}{val}"
                elif flag:
                    token_str = f"{flag} {val}"
                else:
                    token_str = str(val)
                flag_parts.append(token_str)
                breakdown.append({
                    "token": token_str,
                    "category": "Hardware & Thermal Guard" if p.get("tier") == "hardware" else f"{p.get('tier', 'standard').capitalize()} Parameter",
                    "meaning": f"{p['label']}: {p.get('description', '')}",
                    "why_used": p.get("beginner_note") or f"Sets {p['label']} to '{val}' (Default: {p.get('default')}).",
                })

    if custom_flags and custom_flags.strip():
        c_flag = custom_flags.strip()
        flag_parts.append(c_flag)
        breakdown.append({
            "token": c_flag,
            "category": "Custom CLI Override",
            "meaning": "User-supplied raw command-line arguments appended directly to the tool invocation.",
            "why_used": "Provides unrestricted CLI flexibility for specialized or newly released tool options.",
        })

    flags_joined = " ".join(flag_parts)
    single_cmd = f"{binary} {flags_joined} {io_tokens}".strip()
    conda_act = (
        f"source ~/miniforge3/etc/profile.d/conda.sh && conda activate {conda_env}"
        if conda_env != "system"
        else "# Uses native Ubuntu system PATH (/usr/bin)"
    )
    wsl_wrapped = f'wsl.exe -d Ubuntu -e bash -lc "{conda_act} && {single_cmd}"'

    cooldown_sec = int(t_guard.get("cooldown_seconds", 300)) if t_guard.get("enabled", True) else 0
    cooldown_block = (
        f'\n    echo "[Thermal Guard] Pausing {cooldown_sec}s to prevent laptop CPU overheating (>95C)..."\n    sleep {cooldown_sec}'
        if cooldown_sec > 0
        else ""
    )

    samples_bash_array = " ".join(f'"{s}"' for s in sample_list[:10])
    bash_script = f"""#!/usr/bin/env bash
# ==============================================================================
# GenomeLab Automated Batch Script — {tool['name']} (v{tool['version']})
# Stage: {tool['stage_name']}
# Hardware & Thermal Protection: Max {t_guard.get('max_threads', 4)} Threads | Max {t_guard.get('max_ram_gb', 8)} GB RAM
# ==============================================================================
set -euo pipefail

{conda_act}

SAMPLES=({samples_bash_array})
mkdir -p logs 02_quality_control 03_trimmed_reads 04_assembly 06_annotation 07_amr_profiling 11_snp_phylogeny

for SAMPLE in "${{SAMPLES[@]}}"; do
    echo "============================================================"
    echo "[GenomeLab] Running {tool['name']} on isolate: ${{SAMPLE}}"
    echo "============================================================"
    {single_cmd.replace(primary_sample, "${SAMPLE}")} 2>&1 | tee "logs/${{SAMPLE}}_{tool['id']}.log"{cooldown_block}
done

echo "[GenomeLab] All ${{#SAMPLES[@]}} isolate(s) completed successfully!"
"""

    proc_name = tool["id"].upper()
    nf_script = f"""// =============================================================================
// GenomeLab Reproducible Nextflow DSL2 Pipeline — {tool['name']}
// Compatible with Local Workstation, WSL2 Ubuntu, Docker, Apptainer & SLURM HPC
// =============================================================================
nextflow.enable.dsl=2

params.samples_glob = "01_raw_data/*_{{1,2}}.fastq.gz"
params.outdir       = "results/{tool['id']}"
params.threads      = {t_guard.get('max_threads', 4)}
params.memory_gb    = "{t_guard.get('max_ram_gb', 8)} GB"

process RUN_{proc_name} {{
    tag "${{sample_id}}"
    conda "bioconda::{conda_pkg}"
    cpus params.threads
    memory params.memory_gb
    publishDir "${{params.outdir}}", mode: 'copy'

    input:
    tuple val(sample_id), path(reads)

    output:
    path("*"), emit: results

    script:
    \"\"\"
    {single_cmd.replace(primary_sample, "${sample_id}")}
    \"\"\"
}}

workflow {{
    read_pairs_ch = Channel.fromFilePairs(params.samples_glob, checkIfExists: false)
    RUN_{proc_name}(read_pairs_ch)
}}
"""

    conda_yaml = f"""name: {conda_env}
channels:
  - conda-forge
  - bioconda
  - defaults
dependencies:
  - python>=3.10
  - {conda_pkg}>={tool['version']}
"""

    tips = [
        f"Binary '{binary}' is executed inside WSL2 Ubuntu ({conda_env}) with full stdout/stderr provenance logging.",
        f"Star Recommendation Status: {tool.get('recommendation_badge', 'Verified Bioinformatics Tool')}.",
        "You can copy the Bash loop above to run 50+ genomes unattended overnight with Laptop Thermal Cooldown active, or export the Nextflow .nf file for university SLURM HPC clusters.",
    ]

    return {
        "tool_id": tool["id"],
        "tool_name": tool["name"],
        "stage_name": tool["stage_name"],
        "conda_env": conda_env,
        "conda_activation_cmd": conda_act,
        "single_sample_command": single_cmd,
        "wsl_wrapped_command": wsl_wrapped,
        "flag_breakdown": breakdown,
        "bash_batch_script": bash_script,
        "nextflow_dsl2_script": nf_script,
        "conda_yaml": conda_yaml,
        "beginner_tips": tips,
    }


def compile_workflow_scripts(
    name: str,
    nodes: List[Dict[str, Any]],
    edges: List[Dict[str, Any]],
    thermal_guard: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    ordered_nodes = sorted(nodes, key=lambda n: (n.get("stage_id", 1), n.get("x", 0)))
    step_inspections = []
    bash_steps = []
    nf_processes = []
    nf_calls = []

    t_guard = thermal_guard or {"max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 300, "enabled": True}
    cooldown_sec = int(t_guard.get("cooldown_seconds", 300)) if t_guard.get("enabled", True) else 0
    cooldown_line = f"\n# Thermal Guard Cooldown\nsleep {cooldown_sec}" if cooldown_sec > 0 else ""

    for idx, node in enumerate(ordered_nodes, start=1):
        tid = node.get("tool_id", "fastqc")
        insp = generate_code_inspection(
            tool_id=tid,
            parameters=node.get("parameters", {}),
            sample_name="ERR14794383",
            custom_flags=node.get("custom_flags", ""),
            thermal_guard=thermal_guard,
        )
        step_inspections.append(insp)
        bash_steps.append(f"# --- Step {idx}: {insp['tool_name']} ({insp['stage_name']}) ---\n{insp['single_sample_command']}{cooldown_line}")
        proc_id = f"STEP_{idx}_{tid.upper()}"
        nf_processes.append(
            f"process {proc_id} {{\n    cpus {t_guard.get('max_threads', 4)}\n    script:\n    \"\"\"\n    {insp['single_sample_command']}\n    \"\"\"\n}}"
        )
        nf_calls.append(f"    {proc_id}()")

    master_bash = (
        f"#!/usr/bin/env bash\n# GenomeLab Compiled Master Workflow: {name}\nset -euo pipefail\n\n"
        + "\n\n".join(bash_steps)
        + "\n"
    )
    master_nf = (
        f"// GenomeLab Compiled Nextflow DSL2 Workflow: {name}\nnextflow.enable.dsl=2\n\n"
        + "\n\n".join(nf_processes)
        + "\n\nworkflow {\n"
        + "\n".join(nf_calls)
        + "\n}\n"
    )

    return {
        "workflow_name": name,
        "valid": True,
        "node_count": len(ordered_nodes),
        "edge_count": len(edges),
        "master_bash_script": master_bash,
        "nextflow_dsl2_script": master_nf,
        "step_inspections": step_inspections,
    }
