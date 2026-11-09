"""GenomeLab — Automated Backend Quality Assurance & Integration Test Suite."""

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


def test_health_and_branding():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["platform"] == "GenomeLab"
    assert data["total_tools"] >= 50
    assert data["total_stages"] == 12


def test_organisms_and_gold_standards():
    resp = client.get("/api/organisms")
    assert resp.status_code == 200
    orgs = resp.json()
    org_ids = [o["id"] for o in orgs]
    assert "bacteria" in org_ids
    assert "human_animal" in org_ids
    assert "plant_fungi" in org_ids
    assert "viral_phage" in org_ids
    assert "metagenome" in org_ids
    for o in orgs:
        assert len(o["gold_standard_path"]) >= 8


def test_stages_and_tools_registry():
    stages_resp = client.get("/api/stages")
    assert stages_resp.status_code == 200
    stages = stages_resp.json()
    assert len(stages) == 12
    for st in stages:
        assert st["tool_count"] >= 2

    tools_resp = client.get("/api/tools?organism=bacteria")
    assert tools_resp.status_code == 200
    tools = tools_resp.json()
    assert len(tools) >= 50
    tool_ids = {t["id"] for t in tools}
    for required_id in [
        "fasterq_dump", "prefetch", "fastqc", "multiqc", "fastp", "trimmomatic",
        "spades", "unicycler", "velvet", "flye", "megahit", "quast", "checkm2",
        "prokka", "bakta", "rast", "aragorn", "abricate", "amrfinderplus", "staramr",
        "mlst", "seqsero2", "roary", "panaroo", "fastani", "bwa_mem", "picard",
        "snippy", "gatk_haplotypecaller", "deepvariant", "bcftools_call", "snpeff",
        "iqtree2", "raxml_ng", "fasttree", "mega11", "igv_circos_tbtools"
    ]:
        assert required_id in tool_ids, f"Missing required tool: {required_id}"


def test_one_click_code_inspector():
    resp = client.post(
        "/api/code/inspect",
        json={
            "tool_id": "spades",
            "parameters": {"mode": "--isolate", "kmers": "21,33,55,77", "cov_cutoff": "auto", "threads": 4, "memory_gb": 8},
            "sample_name": "ERR14794383",
            "custom_flags": "--phred-offset 33",
            "thermal_guard": {"max_threads": 4, "max_ram_gb": 8, "cooldown_seconds": 300, "enabled": True},
        },
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "spades.py" in data["single_sample_command"]
    assert "--isolate" in data["single_sample_command"]
    assert "-k 21,33,55,77" in data["single_sample_command"]
    assert "--phred-offset 33" in data["single_sample_command"]
    assert len(data["flag_breakdown"]) >= 5
    assert "sleep 300" in data["bash_batch_script"]
    assert "nextflow.enable.dsl=2" in data["nextflow_dsl2_script"]


def test_projects_and_50_salmonella_cohort():
    resp = client.get("/api/projects")
    assert resp.status_code == 200
    projects = resp.json()
    assert len(projects) >= 3
    sal_proj = next(p for p in projects if p["id"] == "proj_salmonella_50")
    assert sal_proj["sample_count"] == 50
    assert len(sal_proj["samples"]) == 50


def test_job_execution_and_beginner_setup():
    job_resp = client.post(
        "/api/jobs/execute",
        json={
            "project_id": "proj_salmonella_50",
            "tool_id": "abricate",
            "samples": ["ERR14794383", "SRR14421695"],
            "parameters": {"db": "resfinder", "minid": 80, "mincov": 60, "threads": 4},
            "execution_mode": "fast_simulation",
        },
    )
    assert job_resp.status_code == 200
    job = job_resp.json()
    assert job["status"] == "completed"
    assert "abricate" in job["code_inspection"]["single_sample_command"]

    inst_resp = client.post("/api/wsl/install-tool", json={"tool_id": "bakta", "env_name": "ngs_veterinary"})
    assert inst_resp.status_code == 200
    assert inst_resp.json()["status"] == "installed"

    setup_resp = client.post("/api/wsl/setup-environment", json={"action": "full_setup", "env_name": "ngs_veterinary"})
    assert setup_resp.status_code == 200
    assert setup_resp.json()["status"] == "completed"


def test_results_summary_and_phylogeny():
    resp = client.get("/api/results/summary?project_id=proj_salmonella_50")
    assert resp.status_code == 200
    summary = resp.json()
    assert summary["total_genomes"] == 50
    assert len(summary["amr_matrix"]) == 50
    assert summary["pangenome_stats"]["total_clusters"] == 11835
    assert "ERR14794383" in summary["phylogeny"]["newick"]


def test_wsl_mkdir_and_cli_diagnostics():
    mkdir_resp = client.post(
        "/api/wsl/mkdir",
        json={"path": "/home/soumandeykakon/GenomeLab_Workspaces/Test_Project", "create_standard_subfolders": True},
    )
    assert mkdir_resp.status_code == 200
    mdata = mkdir_resp.json()
    assert mdata["success"] is True
    assert len(mdata["created_folders"]) >= 13

    cli_resp = client.post("/api/wsl/test-cli", json={"command": "uname -srmo && whoami"})
    assert cli_resp.status_code == 200
    cdata = cli_resp.json()
    assert cdata["connected"] is True
    assert "Linux" in cdata["output"] or "soumandeykakon" in cdata["output"]
