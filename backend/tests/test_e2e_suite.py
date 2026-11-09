"""GenomeLab — Comprehensive End-to-End (E2E) Opaque-Box Test Suite.

Authoritative Specification:
- PROJECT.md (Architecture, Interface Contracts, Feature Inventory)
- ORIGINAL_REQUEST.md (Requirements R1-R5, Acceptance Criteria)
- ARCHITECTURE_AND_API_CONTRACT.md (Data Models & REST API Contract)

Test Suite Hierarchy:
- Tier 1: Feature Coverage (>=5 tests per feature: project creation, job execution,
          persistence endpoints, visualization endpoints, tool configurations)
- Tier 2: Boundary & Corner Cases (empty projects, invalid IDs, missing files,
          corrupted state payloads, special characters in CLI overrides)
- Tier 3: Cross-Feature Combinations (project creation -> tool override ->
          job execution -> state persistence -> restart recovery)
- Tier 4: Real-World Application Scenarios (end-to-end WGS bacterial workflow
          validation against E. coli data and reference genome)
"""

import os
import uuid
import pytest
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

# Authoritative WSL2 UNC paths for empirical verification
WSL_UNC_PRACTICE_DIR = r"\\wsl.localhost\Ubuntu\home\soumandeykakon\wgs_practice"
WSL_UNC_RAW_FASTQ_R1 = os.path.join(WSL_UNC_PRACTICE_DIR, "00_raw_fastq", "SRR2584863_1.fastq.gz")
WSL_UNC_RAW_FASTQ_R2 = os.path.join(WSL_UNC_PRACTICE_DIR, "00_raw_fastq", "SRR2584863_2.fastq.gz")
WSL_UNC_REF_GENOME = os.path.join(WSL_UNC_PRACTICE_DIR, "ref", "genome.fasta")


def pytest_configure(config):
    """Register custom markers to ensure clean runner execution without warnings."""
    markers = [
        ("tier1", "Tier 1: Feature Coverage tests"),
        ("tier2", "Tier 2: Boundary & Corner Case tests"),
        ("tier3", "Tier 3: Cross-Feature Integration tests"),
        ("tier4", "Tier 4: Real-World E. coli Application Scenario tests"),
        ("implemented", "Tests covering currently implemented endpoints"),
        ("pending_m1", "Tests targeting M1 persistence endpoints"),
        ("pending_m4", "Tests targeting M4 visualization endpoints"),
        ("projects", "Project creation and cohort management tests"),
        ("jobs", "Job execution and queue management tests"),
        ("persistence", "State and config persistence tests"),
        ("visualization", "Python and R visualization tests"),
        ("tools", "Tool configuration and registry tests"),
        ("boundary", "Boundary, stress, and corner case tests"),
        ("integration", "Multi-feature integration tests"),
        ("real_world", "Real-world bacterial dataset validation tests"),
    ]
    for name, desc in markers:
        config.addinivalue_line("markers", f"{name}: {desc}")



# ==============================================================================
# TIER 1: FEATURE COVERAGE (FEATURE 1: PROJECT CREATION)
# ==============================================================================


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_project_creation_standard_bacteria():
    """Verify standard bacterial project creation with default metadata."""
    payload = {
        "name": "E2E Bacterial Test Project",
        "organism": "bacteria",
        "description": "Standard bacterial WGS isolate cohort for E2E validation.",
        "sample_ids": ["E2E_BAC_01"],
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()

    assert data["id"].startswith("proj_"), f"Project ID must start with proj_: {data['id']}"
    assert data["name"] == payload["name"]
    assert data["organism"] == "bacteria"
    assert data["sample_count"] == 1
    assert len(data["samples"]) == 1

    sample = data["samples"][0]
    assert sample["id"] == "E2E_BAC_01"
    assert "01_raw_data/E2E_BAC_01_1.fastq.gz" in sample["r1_path"]
    assert "01_raw_data/E2E_BAC_01_2.fastq.gz" in sample["r2_path"]
    assert "04_assembly/E2E_BAC_01/contigs.fasta" in sample["assembly_path"]


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_project_creation_non_bacterial_organisms():
    """Verify project creation across diverse non-bacterial organism profiles."""
    profiles = ["human_animal", "plant_fungi", "viral_phage", "metagenome"]
    for org in profiles:
        payload = {
            "name": f"E2E Cohort {org}",
            "organism": org,
            "sample_ids": [f"SMPL_{org.upper()[:4]}_01"],
        }
        resp = client.post("/api/projects", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert data["organism"] == org
        assert data["samples"][0]["host"] == org


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_project_creation_with_sample_ids_csv_and_list():
    """Verify project creation handles both comma-separated and list sample inputs."""
    # Test 1: Comma-separated string with whitespace
    csv_payload = {
        "name": "E2E CSV Project",
        "sample_ids": "ISO_001, ISO_002, ISO_003\nISO_004",
    }
    resp_csv = client.post("/api/projects", json=csv_payload)
    assert resp_csv.status_code == 200
    data_csv = resp_csv.json()
    assert data_csv["sample_count"] == 4
    sample_ids_csv = [s["id"] for s in data_csv["samples"]]
    assert sample_ids_csv == ["ISO_001", "ISO_002", "ISO_003", "ISO_004"]

    # Test 2: Structured list of strings
    list_payload = {
        "name": "E2E List Project",
        "sample_ids": ["LST_A", "LST_B"],
    }
    resp_list = client.post("/api/projects", json=list_payload)
    assert resp_list.status_code == 200
    data_list = resp_list.json()
    assert data_list["sample_count"] == 2
    assert [s["id"] for s in data_list["samples"]] == ["LST_A", "LST_B"]


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_project_add_samples_endpoint():
    """Verify dynamic addition of samples to an existing project cohort."""
    # Create target project
    proj_resp = client.post("/api/projects", json={"name": "E2E Dynamic Sample Project", "sample_ids": ["INIT_01"]})
    assert proj_resp.status_code == 200
    proj_id = proj_resp.json()["id"]

    # Add sample via POST /api/projects/{id}/samples
    sample_payload = {
        "id": "ADDED_02",
        "name": "Added Isolate 02",
        "country": "Bangladesh",
        "host": "Poultry",
        "year": "2026",
    }
    add_resp = client.post(f"/api/projects/{proj_id}/samples", json=sample_payload)
    assert add_resp.status_code == 200
    sample_data = add_resp.json()
    assert sample_data["id"] == "ADDED_02"
    assert sample_data["country"] == "Bangladesh"
    assert sample_data["host"] == "Poultry"

    # Confirm project reflects new sample
    projs_resp = client.get("/api/projects")
    assert projs_resp.status_code == 200
    proj = next((p for p in projs_resp.json() if p["id"] == proj_id), None)
    assert proj is not None
    assert any(s["id"] == "ADDED_02" for s in proj["samples"])
    assert proj["sample_count"] >= 2


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_projects_list_schema_and_preseeded_cohorts():
    """Verify GET /api/projects returns valid schema and pre-seeded cohorts."""
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    projects = resp.json()
    assert isinstance(projects, list)
    assert len(projects) >= 3, "Expected at least 3 pre-seeded cohorts"

    # Verify Salmonella 50 cohort is present and complete
    sal_proj = next((p for p in projects if p["id"] == "proj_salmonella_50"), None)
    assert sal_proj is not None, "proj_salmonella_50 must be pre-seeded"
    assert sal_proj["sample_count"] == 50
    assert len(sal_proj["samples"]) == 50

    # Verify mandatory project schema fields
    required_keys = {"id", "name", "organism", "wsl_path", "sample_count", "samples", "status"}
    for p in projects:
        missing = required_keys - set(p.keys())
        assert not missing, f"Project {p.get('id')} missing fields: {missing}"


@pytest.mark.tier1
@pytest.mark.projects
@pytest.mark.implemented
def test_tier1_project_wsl_directory_initialization():
    """Verify project creation formats and sets up valid WSL2 workspace paths."""
    proj_name = f"E2E Workspace Init {uuid.uuid4().hex[:6]}"
    resp = client.post("/api/projects", json={"name": proj_name, "sample_ids": ["SMPL_01"]})
    assert resp.status_code == 200
    data = resp.json()
    assert "/home/soumandeykakon/GenomeLab_Workspaces/" in data["wsl_path"]
    assert proj_name.replace(" ", "_") in data["wsl_path"]


# ==============================================================================
# TIER 1: FEATURE COVERAGE (FEATURE 2: JOB EXECUTION)
# ==============================================================================


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_job_execution_fast_simulation_mode():
    """Verify job execution endpoint launches and records tool execution."""
    payload = {
        "project_id": "proj_salmonella_50",
        "tool_id": "fastqc",
        "samples": ["ERR14794383"],
        "parameters": {"threads": 4},
        "execution_mode": "fast_simulation",
    }
    resp = client.post("/api/jobs/execute", json=payload)
    assert resp.status_code == 200
    job = resp.json()

    assert job["id"].startswith("job_")
    assert job["tool_id"] == "fastqc"
    assert job["status"] in ("completed", "running", "queued")
    assert job["progress"] in (100, 0)
    assert len(job["logs"]) >= 3
    assert "code_inspection" in job
    assert "fastqc" in job["code_inspection"]["single_sample_command"]


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_job_execution_custom_flags_propagation():
    """Verify custom CLI flags are propagated to execution and code inspection."""
    custom_flag_str = "--phred-offset 33 --nogroup --contaminants /ref/contam.txt"
    payload = {
        "project_id": "proj_salmonella_50",
        "tool_id": "fastqc",
        "samples": ["ERR14794383"],
        "custom_flags": custom_flag_str,
        "execution_mode": "fast_simulation",
    }
    resp = client.post("/api/jobs/execute", json=payload)
    assert resp.status_code == 200
    job = resp.json()

    cmd = job["code_inspection"]["single_sample_command"]
    assert "--phred-offset 33" in cmd
    assert "--nogroup" in cmd


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_job_execution_thermal_guard_enforcement():
    """Verify hardware and thermal guard constraints are enforced in job execution."""
    guard_config = {
        "max_threads": 2,
        "max_ram_gb": 4,
        "cooldown_seconds": 180,
        "enabled": True,
    }
    payload = {
        "project_id": "proj_salmonella_50",
        "tool_id": "spades",
        "samples": ["ERR14794383"],
        "thermal_guard": guard_config,
        "execution_mode": "fast_simulation",
    }
    resp = client.post("/api/jobs/execute", json=payload)
    assert resp.status_code == 200
    job = resp.json()

    assert job["thermal_guard"]["max_threads"] == 2
    assert job["thermal_guard"]["max_ram_gb"] == 4
    assert any("Hardware & Thermal Guard" in line for line in job["logs"])


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_jobs_list_and_detail_retrieval():
    """Verify jobs can be listed and retrieved individually by ID."""
    # Retrieve all jobs
    resp = client.get("/api/jobs")
    assert resp.status_code == 200
    jobs = resp.json()
    assert isinstance(jobs, list)
    assert len(jobs) >= 1

    # Retrieve individual job detail
    target_job_id = jobs[0]["id"]
    detail_resp = client.get(f"/api/jobs/{target_job_id}")
    assert detail_resp.status_code == 200
    detail = detail_resp.json()
    assert detail["id"] == target_job_id
    assert "tool_id" in detail
    assert "logs" in detail


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_job_cancellation():
    """Verify job cancellation endpoint updates status to cancelled."""
    # Execute a job first
    exec_resp = client.post(
        "/api/jobs/execute",
        json={"tool_id": "prokka", "samples": ["ERR14794383"], "execution_mode": "fast_simulation"},
    )
    assert exec_resp.status_code == 200
    job_id = exec_resp.json()["id"]

    # Cancel the job
    cancel_resp = client.post(f"/api/jobs/{job_id}/cancel")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["status"] == "cancelled"

    # Confirm status persisted
    detail_resp = client.get(f"/api/jobs/{job_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["status"] == "cancelled"


@pytest.mark.tier1
@pytest.mark.jobs
@pytest.mark.implemented
def test_tier1_multi_node_workflow_execution():
    """Verify execution of multi-step pipeline workflow graph."""
    nodes = [
        {"id": "node_1", "tool_id": "fastqc", "stage_id": 2, "x": 100},
        {"id": "node_2", "tool_id": "fastp", "stage_id": 3, "x": 300},
        {"id": "node_3", "tool_id": "spades", "stage_id": 4, "x": 500},
    ]
    payload = {
        "project_id": "proj_salmonella_50",
        "nodes": nodes,
        "samples": ["ERR14794383"],
        "execution_mode": "fast_simulation",
    }
    resp = client.post("/api/workflows/execute", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "completed"
    assert data["jobs_created"] == 3
    assert len(data["jobs"]) == 3
    tool_sequence = [j["tool_id"] for j in data["jobs"]]
    assert tool_sequence == ["fastqc", "fastp", "spades"]


# ==============================================================================
# TIER 1: FEATURE COVERAGE (FEATURE 3: PERSISTENCE ENDPOINTS)
# ==============================================================================


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.pending_m1
def test_tier1_persistence_get_app_state():
    """Verify GET /api/state returns persisted session recovery attributes.

    Contract: PROJECT.md § Frontend <-> Backend Persistence API.
    """
    resp = client.get("/api/state")
    assert resp.status_code == 200, f"Expected 200 from /api/state, got {resp.status_code}: {resp.text}"
    state = resp.json()
    # Contract permits snake_case or camelCase
    has_proj = "active_project_id" in state or "activeProject" in state
    has_tab = "active_tab" in state or "activeTab" in state
    assert has_proj, "Session state must persist active project ID"
    assert has_tab, "Session state must persist active tab"


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.pending_m1
def test_tier1_persistence_post_app_state():
    """Verify POST /api/state saves UI session state to database.

    Contract: PROJECT.md § Frontend <-> Backend Persistence API.
    """
    new_state = {
        "active_project_id": "proj_ecoli_wgs_practice",
        "active_tab": "workbench",
        "selected_organism": "bacteria",
        "selected_samples": ["SRR2584863"],
        "thermal_guard": {"max_threads": 6, "max_ram_gb": 12, "cooldown_seconds": 240, "enabled": True},
    }
    post_resp = client.post("/api/state", json=new_state)
    assert post_resp.status_code in (200, 201), f"Save state failed: {post_resp.text}"

    # Verify retrieval
    get_resp = client.get("/api/state")
    assert get_resp.status_code == 200
    retrieved = get_resp.json()
    proj_val = retrieved.get("active_project_id") or retrieved.get("activeProject")
    assert proj_val == "proj_ecoli_wgs_practice"


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.pending_m1
def test_tier1_persistence_get_project_tool_configs():
    """Verify GET /api/projects/{id}/configs retrieves tool overrides dictionary.

    Contract: PROJECT.md § Frontend <-> Backend Persistence API.
    """
    resp = client.get("/api/projects/proj_salmonella_50/configs")
    assert resp.status_code == 200, f"Expected 200 from /api/projects/.../configs, got {resp.status_code}: {resp.text}"
    configs = resp.json()
    assert isinstance(configs, dict), "Configs must return dictionary of tool settings"


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.pending_m1
def test_tier1_persistence_save_tool_config_override():
    """Verify POST /api/projects/{id}/configs/{tool_id} saves parameter overrides.

    Contract: PROJECT.md § Frontend <-> Backend Persistence API.
    """
    override = {
        "parameters": {"mode": "--isolate", "kmers": "21,33,55", "threads": 4, "memory_gb": 8},
        "custom_flags": "--phred-offset 33",
        "execution_mode": "wsl_real",
    }
    save_resp = client.post("/api/projects/proj_salmonella_50/configs/spades", json=override)
    assert save_resp.status_code in (200, 201), f"Failed to save tool config: {save_resp.text}"

    # Retrieve and verify
    get_resp = client.get("/api/projects/proj_salmonella_50/configs")
    assert get_resp.status_code == 200
    configs = get_resp.json()
    assert "spades" in configs
    assert configs["spades"]["custom_flags"] == "--phred-offset 33"


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.pending_m1
def test_tier1_persistence_job_logs_endpoint():
    """Verify GET /api/jobs/{id}/logs returns streaming/recorded stdout/stderr logs.

    Contract: PROJECT.md § Frontend <-> Backend Persistence API.
    """
    # Execute job to get valid ID
    job_resp = client.post(
        "/api/jobs/execute",
        json={"tool_id": "fastqc", "samples": ["ERR14794383"], "execution_mode": "fast_simulation"},
    )
    assert job_resp.status_code == 200
    job_id = job_resp.json()["id"]

    logs_resp = client.get(f"/api/jobs/{job_id}/logs")
    assert logs_resp.status_code == 200, f"Expected 200 for logs, got {logs_resp.status_code}: {logs_resp.text}"
    logs_data = logs_resp.json() if "application/json" in logs_resp.headers.get("content-type", "") else logs_resp.text
    assert logs_data, "Job logs endpoint must return non-empty output"


@pytest.mark.tier1
@pytest.mark.persistence
@pytest.mark.implemented
def test_tier1_persistence_pipeline_presets_retrieval():
    """Verify built-in presets are available and contain executable graphs."""
    resp = client.get("/api/presets")
    assert resp.status_code == 200
    presets = resp.json()
    assert isinstance(presets, list)
    assert len(presets) >= 6, "Expected at least 6 pipeline presets"

    # Verify preset schema
    for preset in presets:
        assert "id" in preset
        assert "name" in preset
        assert "nodes" in preset
        assert "edges" in preset
        assert len(preset["nodes"]) >= 2


# ==============================================================================
# TIER 1: FEATURE COVERAGE (FEATURE 4: VISUALIZATION ENDPOINTS)
# ==============================================================================


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.pending_m4
def test_tier1_visualization_python_qc_curves():
    """Verify Python Matplotlib/Seaborn QC curves generation endpoint.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    payload = {
        "plot_type": "fastp_qc",
        "project_id": "proj_ecoli_wgs_practice",
        "output_dir": "/home/soumandeykakon/wgs_practice",
    }
    resp = client.post("/api/visualizations/python/generate", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()

    assert data.get("format") in ("png_base64", "svg"), "Format must be png_base64 or svg"
    assert "image_data" in data and len(data["image_data"]) > 50
    assert "title" in data


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.pending_m4
def test_tier1_visualization_python_coverage_depth():
    """Verify Python coverage depth / contig Nx plot generation.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    payload = {
        "plot_type": "coverage_depth",
        "project_id": "proj_ecoli_wgs_practice",
    }
    resp = client.post("/api/visualizations/python/generate", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "image_data" in data


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.pending_m4
def test_tier1_visualization_python_variant_dist():
    """Verify Python variant distribution plot generation.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    payload = {
        "plot_type": "variant_dist",
        "project_id": "proj_ecoli_wgs_practice",
    }
    resp = client.post("/api/visualizations/python/generate", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "image_data" in data


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.pending_m4
def test_tier1_visualization_r_contig_lengths():
    """Verify WSL2 Rscript/ggplot2 contig length distribution figure generation.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    payload = {
        "plot_type": "contig_lengths",
        "project_id": "proj_ecoli_wgs_practice",
    }
    resp = client.post("/api/visualizations/r/generate", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert data.get("format") in ("png_base64", "svg")
    assert "image_data" in data and len(data["image_data"]) > 50


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.pending_m4
def test_tier1_visualization_r_amr_matrix():
    """Verify WSL2 Rscript/ggplot2 AMR presence/absence matrix figure generation.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    payload = {
        "plot_type": "amr_matrix",
        "project_id": "proj_salmonella_50",
    }
    resp = client.post("/api/visualizations/r/generate", json=payload)
    assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text}"
    data = resp.json()
    assert "image_data" in data


@pytest.mark.tier1
@pytest.mark.visualization
@pytest.mark.implemented
def test_tier1_visualization_genomic_metrics_summary():
    """Verify genomic summary metrics endpoint parses authentic outputs."""
    # Tests existing /api/results/summary as baseline genomic metrics endpoint
    resp = client.get("/api/results/summary?project_id=proj_salmonella_50")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_genomes" in data
    assert "amr_matrix" in data
    assert "phylogeny" in data
    assert "pangenome_stats" in data


# ==============================================================================
# TIER 1: FEATURE COVERAGE (FEATURE 5: TOOL CONFIGURATIONS)
# ==============================================================================


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_stage_catalog_coverage():
    """Verify all 12 stages are registered with minimum tool counts."""
    resp = client.get("/api/stages")
    assert resp.status_code == 200
    stages = resp.json()
    assert len(stages) == 12, "Must contain exactly 12 WGS stages"

    for st in stages:
        assert "id" in st and "name" in st
        assert st["tool_count"] >= 2, f"Stage {st['id']} has insufficient tools: {st['tool_count']}"


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_organism_filtered_registry():
    """Verify tool registry filtering returns all gold-standard bacterial tools."""
    resp = client.get("/api/tools?organism=bacteria")
    assert resp.status_code == 200
    tools = resp.json()
    assert len(tools) >= 50

    tool_ids = {t["id"] for t in tools}
    gold_standards = [
        "fasterq_dump", "fastqc", "fastp", "spades", "quast",
        "prokka", "abricate", "mlst", "bwa_mem", "bcftools_call", "snippy"
    ]
    for gid in gold_standards:
        assert gid in tool_ids, f"Gold standard tool missing: {gid}"


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_tool_detail_parameter_schema():
    """Verify individual tool detail exposes complete ToolParameter schemas."""
    resp = client.get("/api/tools/spades")
    assert resp.status_code == 200
    tool = resp.json()

    assert tool["id"] == "spades"
    assert tool["binary"] == "spades.py"
    assert tool["stage_id"] in (4, 5)
    assert len(tool["parameters"]) >= 5

    # Check parameter attributes
    param_keys = {"id", "flag", "label", "type", "tier"}
    for p in tool["parameters"]:
        missing = param_keys - set(p.keys())
        assert not missing, f"Parameter {p.get('id')} missing keys: {missing}"


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_custom_tool_registration():
    """Verify dynamic registration of custom third-party bioinformatics tools."""
    custom_payload = {
        "name": "E2E_Custom_Kraken2",
        "binary": "kraken2",
        "stage_id": 1,
        "stage_name": "Stage 1: Raw Signal, Read QC & Trimming",
        "category": "Taxonomy",
        "conda_package": "kraken2",
        "short_description": "Taxonomic sequence classifier",
    }
    resp = client.post("/api/tools/custom", json=custom_payload)
    assert resp.status_code == 200
    reg = resp.json()
    assert reg["binary"] == "kraken2"
    assert reg["id"].startswith("custom_") or "kraken2" in reg["id"]

    # Verify tool is retrievable
    tool_resp = client.get(f"/api/tools/{reg['id']}")
    assert tool_resp.status_code == 200
    assert tool_resp.json()["name"] == "E2E_Custom_Kraken2"


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_one_click_code_inspector():
    """Verify 1-Click Code Inspector generates CLI, Bash loop, and Nextflow DSL2."""
    payload = {
        "tool_id": "spades",
        "parameters": {"mode": "--isolate", "kmers": "21,33,55,77", "threads": 4, "memory_gb": 8},
        "sample_name": "ERR14794383",
        "custom_flags": "--phred-offset 33",
        "thermal_guard": {"max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 300, "enabled": True},
    }
    resp = client.post("/api/code/inspect", json=payload)
    assert resp.status_code == 200
    insp = resp.json()

    assert "spades.py" in insp["single_sample_command"]
    assert "--isolate" in insp["single_sample_command"]
    assert "-k 21,33,55,77" in insp["single_sample_command"]
    assert "--phred-offset 33" in insp["single_sample_command"]
    assert len(insp["flag_breakdown"]) >= 5
    assert "sleep 300" in insp["bash_batch_script"]
    assert "nextflow.enable.dsl=2" in insp["nextflow_dsl2_script"]


@pytest.mark.tier1
@pytest.mark.tools
@pytest.mark.implemented
def test_tier1_tools_workflow_script_compilation():
    """Verify multi-step workflow compiler produces unified Bash and Nextflow scripts."""
    nodes = [
        {"id": "n1", "tool_id": "fastqc", "stage_id": 2, "parameters": {"threads": 4}},
        {"id": "n2", "tool_id": "fastp", "stage_id": 3, "parameters": {"threads": 4}},
    ]
    edges = [{"id": "e1", "source": "n1", "target": "n2"}]
    payload = {
        "name": "E2E Compiled Pipeline",
        "nodes": nodes,
        "edges": edges,
        "thermal_guard": {"max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 120, "enabled": True},
    }
    resp = client.post("/api/workflows/compile", json=payload)
    assert resp.status_code == 200
    comp = resp.json()

    assert "master_bash_script" in comp or "bash_batch_script" in comp
    assert "nextflow_dsl2_script" in comp
    bash_script = comp.get("master_bash_script") or comp.get("bash_batch_script", "")
    assert "fastqc" in bash_script
    assert "fastp" in bash_script
    assert "sleep 120" in bash_script


# ==============================================================================
# TIER 2: BOUNDARY & CORNER CASES
# ==============================================================================


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_empty_project_creation_and_defaults():
    """Verify empty project creation payload applies safe defaults without crashing."""
    resp = client.post("/api/projects", json={})
    assert resp.status_code in (200, 422), f"Unexpected crash status: {resp.status_code}"
    if resp.status_code == 200:
        data = resp.json()
        assert data["id"].startswith("proj_")
        assert len(data["name"]) > 0
        assert data["sample_count"] >= 1


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_non_existent_resource_ids_404():
    """Verify 404 response for invalid/non-existent tool, job, and stage IDs."""
    # Non-existent tool ID
    resp_tool = client.get("/api/tools/non_existent_tool_xyz_999")
    assert resp_tool.status_code == 404
    assert "not found" in resp_tool.json().get("detail", "").lower()

    # Non-existent job ID
    resp_job = client.get("/api/jobs/job_invalid_id_999999")
    assert resp_job.status_code == 404


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_missing_mandatory_fields_validation_400():
    """Verify 400/422 validation response when mandatory fields are omitted."""
    # Missing required 'name' in custom tool registration
    resp = client.post("/api/tools/custom", json={"binary": "dummy_tool"})
    assert resp.status_code in (400, 422)
    assert "name" in resp.json().get("detail", "").lower()


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_extreme_and_negative_thermal_guard_values():
    """Verify boundary/extreme thermal guard parameters do not cause internal error."""
    extreme_guard = {
        "max_threads": -10,  # Negative threads
        "max_ram_gb": 0,     # Zero RAM
        "cooldown_seconds": 999999,
        "enabled": True,
    }
    payload = {
        "tool_id": "fastqc",
        "thermal_guard": extreme_guard,
    }
    resp = client.post("/api/code/inspect", json=payload)
    assert resp.status_code == 200
    insp = resp.json()
    assert "single_sample_command" in insp


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_special_characters_and_shell_escaping():
    """Verify custom CLI flags containing special characters/metacharacters are safely handled."""
    adversarial_flags = "; rm -rf / ; touch /tmp/pwned && echo 'HACKED' | cat > /dev/null"
    payload = {
        "tool_id": "fastqc",
        "custom_flags": adversarial_flags,
        "samples": ["SAMPLE_01"],
    }
    resp = client.post("/api/code/inspect", json=payload)
    assert resp.status_code == 200
    insp = resp.json()
    # Ensure inspection returned without uncaught syntax crash
    assert "fastqc" in insp["single_sample_command"]


@pytest.mark.tier2
@pytest.mark.boundary
@pytest.mark.implemented
def test_tier2_massive_cohort_sample_scaling():
    """Verify project creation and inspection scale to cohorts of 60+ samples."""
    large_cohort = [f"SRR_SCALE_{i:03d}" for i in range(60)]
    payload = {
        "name": "E2E Large Cohort Project (60 Genomes)",
        "sample_ids": large_cohort,
    }
    resp = client.post("/api/projects", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["sample_count"] == 60
    assert len(data["samples"]) == 60


# ==============================================================================
# TIER 3: CROSS-FEATURE COMBINATIONS
# ==============================================================================


@pytest.mark.tier3
@pytest.mark.integration
@pytest.mark.implemented
def test_tier3_full_project_tool_config_execute_lifecycle():
    """Verify integrated flow: Project creation -> Add sample -> Job execution -> Job inspection."""
    # 1. Create project
    proj_resp = client.post(
        "/api/projects",
        json={"name": "Lifecycle Integration Project", "sample_ids": ["LC_01"]},
    )
    assert proj_resp.status_code == 200
    proj_id = proj_resp.json()["id"]

    # 2. Add sample
    add_resp = client.post(
        f"/api/projects/{proj_id}/samples",
        json={"id": "LC_02", "name": "Lifecycle Isolate 02"},
    )
    assert add_resp.status_code == 200

    # 3. Execute job for new sample in new project
    exec_resp = client.post(
        "/api/jobs/execute",
        json={
            "project_id": proj_id,
            "tool_id": "fastqc",
            "samples": ["LC_01", "LC_02"],
            "parameters": {"threads": 4},
            "execution_mode": "fast_simulation",
        },
    )
    assert exec_resp.status_code == 200
    job_id = exec_resp.json()["id"]

    # 4. Verify job appears in global jobs registry
    job_detail = client.get(f"/api/jobs/{job_id}")
    assert job_detail.status_code == 200
    assert job_detail.json()["project_id"] == proj_id
    assert len(job_detail.json()["samples"]) == 2


@pytest.mark.tier3
@pytest.mark.integration
@pytest.mark.implemented
def test_tier3_multi_stage_workflow_compile_execute_monitor():
    """Verify workflow studio flow: Graph compile -> Execution -> Monitor verification."""
    nodes = [
        {"id": "n1", "tool_id": "fastqc", "stage_id": 2},
        {"id": "n2", "tool_id": "fastp", "stage_id": 3},
    ]
    edges = [{"id": "e1", "source": "n1", "target": "n2"}]

    # Compile
    comp_resp = client.post("/api/workflows/compile", json={"nodes": nodes, "edges": edges})
    assert comp_resp.status_code == 200

    # Execute
    exec_resp = client.post(
        "/api/workflows/execute",
        json={"nodes": nodes, "samples": ["ERR14794383"], "execution_mode": "fast_simulation"},
    )
    assert exec_resp.status_code == 200
    created_jobs = exec_resp.json()["jobs"]
    assert len(created_jobs) == 2

    # Verify each job is queryable
    for j in created_jobs:
        dj = client.get(f"/api/jobs/{j['id']}")
        assert dj.status_code == 200
        assert dj.json()["status"] == "completed"


@pytest.mark.tier3
@pytest.mark.integration
@pytest.mark.pending_m1
def test_tier3_state_persistence_across_simulated_sessions():
    """Verify session state and parameter overrides persist across simulated re-fetches."""
    # 1. Update state
    state_payload = {
        "active_project_id": "proj_salmonella_50",
        "active_tab": "pipeline",
        "selected_organism": "bacteria",
    }
    s_resp = client.post("/api/state", json=state_payload)
    assert s_resp.status_code in (200, 201)

    # 2. Save tool config override
    cfg_payload = {"parameters": {"minid": 85, "mincov": 70}, "custom_flags": "--quiet"}
    c_resp = client.post("/api/projects/proj_salmonella_50/configs/abricate", json=cfg_payload)
    assert c_resp.status_code in (200, 201)

    # 3. Simulate browser refresh / re-mount
    state_read = client.get("/api/state")
    assert state_read.status_code == 200
    state_data = state_read.json()
    assert (state_data.get("active_tab") or state_data.get("activeTab")) == "pipeline"

    cfg_read = client.get("/api/projects/proj_salmonella_50/configs")
    assert cfg_read.status_code == 200
    assert "abricate" in cfg_read.json()


@pytest.mark.tier3
@pytest.mark.integration
@pytest.mark.implemented
def test_tier3_custom_tool_registration_inspection_execution():
    """Verify lifecycle of a custom tool: Registration -> Code Inspection -> Job Execution."""
    # 1. Register custom tool
    reg_resp = client.post(
        "/api/tools/custom",
        json={"name": "CustomBactopia", "binary": "bactopia", "stage_id": 1, "category": "Pipeline"},
    )
    assert reg_resp.status_code == 200
    custom_id = reg_resp.json()["id"]

    # 2. Code Inspection
    insp_resp = client.post("/api/code/inspect", json={"tool_id": custom_id, "sample_name": "ERR14794383"})
    assert insp_resp.status_code == 200
    assert "bactopia" in insp_resp.json()["single_sample_command"]

    # 3. Job Execution
    exec_resp = client.post(
        "/api/jobs/execute",
        json={"tool_id": custom_id, "samples": ["ERR14794383"], "execution_mode": "fast_simulation"},
    )
    assert exec_resp.status_code == 200
    assert exec_resp.json()["tool_id"] == custom_id


@pytest.mark.tier3
@pytest.mark.integration
@pytest.mark.implemented
def test_tier3_job_execution_log_streaming_and_cancellation():
    """Verify job lifecycle from execution through log streaming to cancellation."""
    # 1. Execute job
    job = client.post(
        "/api/jobs/execute",
        json={"tool_id": "fastqc", "samples": ["ERR14794383"], "execution_mode": "fast_simulation"},
    ).json()
    job_id = job["id"]

    # 2. Inspect logs in job detail
    assert len(job["logs"]) > 0

    # 3. Cancel job
    cancel = client.post(f"/api/jobs/{job_id}/cancel").json()
    assert cancel["status"] == "cancelled"

    # 4. Verify updated state
    updated = client.get(f"/api/jobs/{job_id}").json()
    assert updated["status"] == "cancelled"


# ==============================================================================
# TIER 4: REAL-WORLD APPLICATION SCENARIOS (E. COLI VALIDATION)
# ==============================================================================


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.implemented
def test_tier4_ecoli_dataset_and_reference_preflight():
    """Empirically verify Lenski E. coli raw FASTQs and reference genome exist.

    Reference: ORIGINAL_REQUEST.md § Verification Resources.
    """
    assert os.path.exists(WSL_UNC_PRACTICE_DIR), f"Missing WSL practice directory: {WSL_UNC_PRACTICE_DIR}"
    assert os.path.exists(WSL_UNC_RAW_FASTQ_R1), f"Missing E. coli R1 FASTQ: {WSL_UNC_RAW_FASTQ_R1}"
    assert os.path.exists(WSL_UNC_RAW_FASTQ_R2), f"Missing E. coli R2 FASTQ: {WSL_UNC_RAW_FASTQ_R2}"
    assert os.path.exists(WSL_UNC_REF_GENOME), f"Missing reference genome: {WSL_UNC_REF_GENOME}"

    # Verify non-empty file sizes
    r1_size = os.path.getsize(WSL_UNC_RAW_FASTQ_R1)
    ref_size = os.path.getsize(WSL_UNC_REF_GENOME)
    assert r1_size > 50_000_000, f"R1 FASTQ unexpectedly small: {r1_size} bytes"
    assert ref_size > 4_000_000, f"Reference genome unexpectedly small: {ref_size} bytes"


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.implemented
def test_tier4_ecoli_qc_trimming_stage_contract():
    """Verify FastQC and fastp command structures adhere to E. coli pipeline specs."""
    # FastQC Inspection
    fastqc_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "fastqc", "sample_name": "SRR2584863", "parameters": {"threads": 4}},
    ).json()
    assert "fastqc" in fastqc_insp["single_sample_command"]
    assert "SRR2584863" in fastqc_insp["single_sample_command"]

    # fastp Inspection
    fastp_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "fastp", "sample_name": "SRR2584863", "parameters": {"threads": 4, "qualified_quality_phred": 20}},
    ).json()
    assert "fastp" in fastp_insp["single_sample_command"]
    assert "-i" in fastp_insp["single_sample_command"]
    assert "-o" in fastp_insp["single_sample_command"]


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.implemented
def test_tier4_ecoli_assembly_and_quast_qc_contract():
    """Verify SPAdes assembler and QUAST evaluation tool command contracts for E. coli."""
    spades_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "spades", "sample_name": "SRR2584863", "parameters": {"mode": "--isolate", "threads": 4, "memory_gb": 8}},
    ).json()
    assert "spades.py" in spades_insp["single_sample_command"]
    assert "--isolate" in spades_insp["single_sample_command"]

    quast_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "quast", "sample_name": "SRR2584863", "parameters": {"threads": 4}},
    ).json()
    assert "quast" in quast_insp["single_sample_command"]


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.implemented
def test_tier4_ecoli_annotation_and_amr_typing_contract():
    """Verify Prokka, ABRicate, and MLST tool contracts for bacterial annotation."""
    prokka_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "prokka", "sample_name": "SRR2584863", "parameters": {"genus": "Escherichia", "species": "coli", "cpus": 4}},
    ).json()
    assert "prokka" in prokka_insp["single_sample_command"]

    abricate_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "abricate", "sample_name": "SRR2584863", "parameters": {"db": "resfinder", "minid": 80, "mincov": 60}},
    ).json()
    assert "abricate" in abricate_insp["single_sample_command"]

    mlst_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "mlst", "sample_name": "SRR2584863", "parameters": {"scheme": "ecoli"}},
    ).json()
    assert "mlst" in mlst_insp["single_sample_command"]


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.implemented
def test_tier4_ecoli_alignment_variant_calling_contract():
    """Verify BWA-MEM and Snippy variant calling tool contracts against reference genome."""
    bwa_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "bwa_mem", "sample_name": "SRR2584863", "parameters": {"threads": 4}},
    ).json()
    assert "bwa" in bwa_insp["single_sample_command"]

    snippy_insp = client.post(
        "/api/code/inspect",
        json={"tool_id": "snippy", "sample_name": "SRR2584863", "parameters": {"cpus": 4}},
    ).json()
    assert "snippy" in snippy_insp["single_sample_command"]


@pytest.mark.tier4
@pytest.mark.real_world
@pytest.mark.pending_m4
def test_tier4_ecoli_real_metrics_and_visualization_pipeline():
    """Verify authentic metrics ingestion and visualization rendering on E. coli.

    Contract: PROJECT.md § Backend <-> Visualization API.
    """
    # Verify metrics endpoint returns authentic data for E. coli project
    metrics_resp = client.get("/api/visualizations/metrics?project_id=proj_ecoli_wgs_practice")
    assert metrics_resp.status_code == 200, f"Expected 200, got {metrics_resp.status_code}: {metrics_resp.text}"
    metrics = metrics_resp.json()
    assert isinstance(metrics, dict)

    # Ingest into visualization generator
    viz_resp = client.post(
        "/api/visualizations/python/generate",
        json={"plot_type": "fastp_qc", "project_id": "proj_ecoli_wgs_practice"},
    )
    assert viz_resp.status_code == 200
    assert "image_data" in viz_resp.json()
