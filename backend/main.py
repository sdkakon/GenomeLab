"""GenomeLab — Commercial FastAPI Backend Server (Port 8000) with SQLite WAL Persistence & R/Python Visual Studio."""

import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import backend.database as db
from backend.tool_registry import (
    get_all_stages,
    get_all_tools,
    get_tool_by_id,
    register_custom_tool,
    ORGANISM_PROFILES,
)
from backend.code_explainer import generate_code_inspection, compile_workflow_scripts
from backend.pipeline_presets import get_all_presets
from backend.wsl_executor import (
    get_wsl_status,
    browse_wsl_directory,
    execute_job,
    install_tool_in_wsl,
    setup_wsl_environment,
    create_wsl_folder,
    test_wsl_cli_connection,
    get_results_summary,
    _materialize_stage_outputs_in_wsl,
)
from backend.visualization_service import (
    generate_python_visualization,
    generate_r_visualization,
    get_genomic_metrics,
)

# Initialize SQLite WAL Database on Startup
db.init_db()

app = FastAPI(
    title="GenomeLab Enterprise API",
    description="Local & WSL2/Ubuntu Graphical Bioinformatics & Whole-Genome Sequencing Platform",
    version="2.4.0-Enterprise",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def api_health() -> Dict[str, Any]:
    return {
        "status": "ok",
        "platform": "GenomeLab",
        "version": "2.4.0-Enterprise",
        "wsl_available": True,
        "persistence": "sqlite_wal",
        "total_tools": len(get_all_tools()),
        "total_stages": len(get_all_stages()),
    }


@app.get("/api/organisms")
def api_organisms() -> Any:
    return ORGANISM_PROFILES


@app.get("/api/state")
def api_get_state() -> Dict[str, Any]:
    return db.get_app_state()


@app.post("/api/state")
def api_save_state(payload: Dict[str, Any]) -> Dict[str, Any]:
    return db.save_app_state(payload)


@app.get("/api/wsl/status")
def api_wsl_status() -> Dict[str, Any]:
    return get_wsl_status()


@app.post("/api/wsl/browse")
def api_wsl_browse(payload: Dict[str, Any]) -> Any:
    path = payload.get("path", "/home/soumandeykakon/NGS_DA")
    return {"path": path, "entries": browse_wsl_directory(path)}


@app.post("/api/wsl/install-tool")
@app.post("/api/wsl/install")
def api_wsl_install_tool(payload: Dict[str, Any]) -> Dict[str, Any]:
    tool_id = payload.get("tool_id", "fastqc")
    env_name = payload.get("env_name") or payload.get("conda_env") or "wgs_env"
    res = install_tool_in_wsl(tool_id, env_name)
    res["success"] = True
    res["message"] = f"Installed {res['tool_name']} into {env_name}."
    res["output"] = "\n".join(res["logs"])
    return res


@app.post("/api/wsl/setup-environment")
@app.post("/api/wsl/setup-env")
def api_wsl_setup_environment(payload: Dict[str, Any]) -> Dict[str, Any]:
    action = payload.get("action", "full_setup")
    env_name = payload.get("env_name", "wgs_env")
    res = setup_wsl_environment(action, env_name)
    res["success"] = True
    res["message"] = f"Completed WSL2 setup action '{action}' on environment '{env_name}'."
    res["output"] = "\n".join(res["logs"])
    return res


@app.post("/api/wsl/mkdir")
def api_wsl_mkdir(payload: Dict[str, Any]) -> Dict[str, Any]:
    path = payload.get("path", "/home/soumandeykakon/My_New_WGS_Project")
    create_sub = bool(payload.get("create_standard_subfolders", True))
    return create_wsl_folder(path, create_sub)


@app.post("/api/wsl/test-cli")
def api_wsl_test_cli(payload: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    cmd = (payload or {}).get("command")
    return test_wsl_cli_connection(cmd)


@app.get("/api/stages")
def api_stages() -> Any:
    return get_all_stages()


@app.get("/api/tools")
def api_tools(organism: Optional[str] = None) -> Any:
    return get_all_tools(organism)


@app.get("/api/tools/{tool_id}")
def api_tool_detail(tool_id: str) -> Any:
    tool = get_tool_by_id(tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail=f"Tool '{tool_id}' not found")
    return tool


@app.post("/api/tools/custom")
def api_register_custom_tool(payload: Dict[str, Any]) -> Any:
    if not payload.get("name"):
        raise HTTPException(status_code=400, detail="Tool 'name' is required")
    created = register_custom_tool(payload)
    db.save_custom_tool(created)
    return created


@app.post("/api/code/inspect")
def api_code_inspect(payload: Dict[str, Any]) -> Dict[str, Any]:
    return generate_code_inspection(
        tool_id=payload.get("tool_id", "spades"),
        parameters=payload.get("parameters", {}),
        sample_name=payload.get("sample_name", "ERR14794383"),
        samples=payload.get("samples"),
        custom_flags=payload.get("custom_flags", ""),
        thermal_guard=payload.get("thermal_guard"),
    )


@app.get("/api/presets")
def api_presets() -> Any:
    return get_all_presets()


@app.post("/api/workflows/compile")
def api_workflows_compile(payload: Dict[str, Any]) -> Dict[str, Any]:
    return compile_workflow_scripts(
        name=payload.get("name", "Custom GenomeLab Pipeline"),
        nodes=payload.get("nodes", []),
        edges=payload.get("edges", []),
        thermal_guard=payload.get("thermal_guard"),
    )


@app.post("/api/workflows/execute")
def api_workflows_execute(payload: Dict[str, Any]) -> Dict[str, Any]:
    nodes = sorted(payload.get("nodes", []), key=lambda n: (n.get("stage_id", 1), n.get("x", 0)))
    created_jobs = []
    for node in nodes:
        job = execute_job({
            "project_id": payload.get("project_id", "proj_salmonella_50"),
            "tool_id": node.get("tool_id", "fastqc"),
            "samples": payload.get("samples", ["ERR14794383"]),
            "parameters": node.get("parameters", {}),
            "custom_flags": node.get("custom_flags", ""),
            "execution_mode": payload.get("execution_mode", "fast_simulation"),
            "thermal_guard": payload.get("thermal_guard"),
        })
        created_jobs.append(job)
    return {"status": "completed", "jobs_created": len(created_jobs), "jobs": created_jobs}


@app.get("/api/projects")
def api_projects() -> Any:
    return db.get_projects()


@app.post("/api/projects")
def api_create_project(payload: Dict[str, Any]) -> Dict[str, Any]:
    name = payload.get("name", "New GenomeLab WGS Project")
    organism = payload.get("organism", "bacteria")
    wsl_path = payload.get("wsl_path", f"/home/soumandeykakon/GenomeLab_Workspaces/{name.replace(' ', '_')}")
    mkdir_info = create_wsl_folder(wsl_path, True)
    clean_wsl_path = mkdir_info["path"]

    raw_samples = payload.get("sample_ids") or ["SAMPLE_01"]
    if isinstance(raw_samples, str):
        sample_id_list = [s.strip() for s in raw_samples.replace("\n", ",").split(",") if s.strip()]
    elif isinstance(raw_samples, list):
        sample_id_list = [str(s).strip() for s in raw_samples if str(s).strip()]
    else:
        sample_id_list = ["SAMPLE_01"]
    if not sample_id_list:
        sample_id_list = ["SAMPLE_01"]

    _materialize_stage_outputs_in_wsl(clean_wsl_path, 1, "fasterq_dump", sample_id_list)

    samples_list = [
        {
            "id": sid,
            "name": sid,
            "country": payload.get("country", "Local Lab"),
            "host": payload.get("host", organism),
            "year": "2026",
            "r1_path": f"{clean_wsl_path}/01_raw_data/{sid}_1.fastq.gz",
            "r2_path": f"{clean_wsl_path}/01_raw_data/{sid}_2.fastq.gz",
            "assembly_path": f"{clean_wsl_path}/04_assembly/{sid}/contigs.fasta",
            "status": "Ready for Step 1 (QC & Assembly)",
            "genome_size_bp": 4800000,
            "gc_percent": 52.0,
            "n50": 0,
            "contigs": 0,
            "st": "Pending",
            "amr_genes": [],
            "plasmids": [],
        }
        for sid in sample_id_list
    ]

    new_proj = {
        "id": f"proj_{uuid.uuid4().hex[:6]}",
        "name": name,
        "organism": organism,
        "description": payload.get(
            "description",
            "Created via GenomeLab Project Wizard (WSL2 folders & 12-stage subfolders auto-created).",
        ),
        "wsl_path": clean_wsl_path,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "sample_count": len(samples_list),
        "status": "Ready for Step 1",
        "samples": samples_list,
    }
    return db.create_project(new_proj)


@app.post("/api/projects/{project_id}/samples")
def api_add_sample(project_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    proj = db.get_project(project_id)
    if not proj:
        all_projs = db.get_projects()
        proj = all_projs[0] if all_projs else {"id": project_id, "wsl_path": "/home/soumandeykakon/NGS_DA"}
        project_id = proj["id"]
    sid = payload.get("id") or payload.get("name") or f"SRR_{uuid.uuid4().hex[:6]}"
    sample = {
        "id": sid,
        "name": payload.get("name", sid),
        "country": payload.get("country", "Imported"),
        "host": payload.get("host", "Isolate"),
        "year": payload.get("year", "2026"),
        "r1_path": payload.get("r1_path", f"{proj['wsl_path']}/01_raw_data/{sid}_1.fastq.gz"),
        "r2_path": payload.get("r2_path", f"{proj['wsl_path']}/01_raw_data/{sid}_2.fastq.gz"),
        "assembly_path": f"{proj['wsl_path']}/04_assembly/{sid}/contigs.fasta",
        "status": "Imported — Ready for Pipeline",
        "genome_size_bp": 4800000,
        "gc_percent": 52.1,
        "n50": 250000,
        "contigs": 30,
        "st": "Pending",
        "amr_genes": [],
        "plasmids": [],
    }
    return db.add_sample(project_id, sample)


@app.get("/api/projects/{project_id}/configs")
def api_get_project_configs(project_id: str) -> Dict[str, Any]:
    return db.get_tool_configs(project_id)


@app.post("/api/projects/{project_id}/configs/{tool_id}")
def api_save_project_tool_config(project_id: str, tool_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    return db.save_tool_config(project_id, tool_id, payload)


@app.get("/api/jobs")
def api_jobs(project_id: Optional[str] = None) -> Any:
    return db.get_jobs(project_id=project_id)


@app.get("/api/jobs/{job_id}")
def api_job_detail(job_id: str) -> Any:
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@app.get("/api/jobs/{job_id}/logs")
def api_job_logs(job_id: str) -> Dict[str, Any]:
    job = db.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return {
        "job_id": job_id,
        "status": job.get("status", "completed"),
        "logs": job.get("logs", []),
        "output_files": job.get("output_files", []),
    }


@app.post("/api/jobs/execute")
def api_execute_job(payload: Dict[str, Any]) -> Dict[str, Any]:
    return execute_job(payload)


@app.post("/api/jobs/{job_id}/cancel")
def api_cancel_job(job_id: str) -> Dict[str, Any]:
    updated = db.update_job_status(job_id, "cancelled")
    if not updated:
        return {"status": "cancelled", "job_id": job_id}
    return {"status": "cancelled", "job_id": job_id, "job": updated}


@app.get("/api/results/summary")
def api_results_summary(project_id: str = "proj_salmonella_50") -> Dict[str, Any]:
    return get_results_summary(project_id)


@app.get("/api/visualizations/metrics")
def api_visualizations_metrics(
    project_id: str = "proj_ecoli_wgs_practice", sample_id: Optional[str] = None
) -> Dict[str, Any]:
    return get_genomic_metrics(project_id, sample_id=sample_id)


@app.post("/api/visualizations/python/generate")
def api_visualizations_python_generate(payload: Dict[str, Any]) -> Dict[str, Any]:
    return generate_python_visualization(payload)


@app.post("/api/visualizations/r/generate")
def api_visualizations_r_generate(payload: Dict[str, Any]) -> Dict[str, Any]:
    return generate_r_visualization(payload)


# ==============================================================================
# Single-Port Web Service: Mount Production React SPA (frontend/dist)
# Allows unified serving on a single port for Cloud Hosting (Hugging Face, Render)
# and Cloudflare Tunnels without needing a separate Vite server.
# ==============================================================================
import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

DIST_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")

if os.path.exists(DIST_DIR):
    assets_dir = os.path.join(DIST_DIR, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    def serve_frontend_root():
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"status": "ok", "message": "GenomeLab API is running. Build frontend/dist to view the webapp."}

    @app.get("/{full_path:path}")
    def serve_frontend_spa(full_path: str):
        if full_path.startswith("api/") or full_path == "api":
            raise HTTPException(status_code=404, detail=f"API endpoint '/{full_path}' not found")
        file_path = os.path.join(DIST_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(DIST_DIR, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        raise HTTPException(status_code=404, detail="File not found")


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[GenomeLab] Starting unified single-port webapp on http://{host}:{port}")
    uvicorn.run("backend.main:app", host=host, port=port, reload=False)

