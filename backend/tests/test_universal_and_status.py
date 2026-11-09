"""Tests for Universal Organism Classification, Biologically Authentic Profiles,
WSL2 Output Verification, and Traffic-Light Status Transitions.
"""

import pytest
import backend.database as db
import backend.wsl_executor as wsl_executor


def test_universal_organism_viruses():
    """Verify viral genome profiles (SARS-CoV-2, Influenza A, Phage T4)."""
    # 1. SARS-CoV-2
    covid = db.infer_organism_genomic_profile("SARS-CoV-2 Genomic Surveillance", "COVID_01")
    assert "SARS-CoV-2" in covid["species_name"]
    assert 29000 <= covid["genome_size_bp"] <= 31000
    assert 37.0 <= covid["gc_percent"] <= 39.0
    assert covid["contigs"] == 1
    assert covid["cds_count"] == 11
    amr_genes = [g["gene"] for g in covid["amr_catalog"]]
    assert any("Mpro" in g or "RdRp" in g for g in amr_genes)
    vir_genes = [v["gene"] for v in covid["virulence_summary"]]
    assert any("Spike" in v for v in vir_genes)

    # 2. Influenza A
    flu = db.infer_organism_genomic_profile("Avian Influenza H5N1 Cohort", "FLU_01")
    assert "Influenza A" in flu["species_name"]
    assert 13000 <= flu["genome_size_bp"] <= 14000
    assert flu["contigs"] == 8  # 8 RNA segments
    amr_flu = [g["gene"] for g in flu["amr_catalog"]]
    assert any("NA_H275Y" in g or "M2_S31N" in g for g in amr_flu)

    # 3. Bacteriophage T4
    phage = db.infer_organism_genomic_profile("Bacteriophage T4 Lytic Cocktails", "PHAGE_01")
    assert "phage" in phage["species_name"].lower()
    assert 160000 <= phage["genome_size_bp"] <= 175000
    assert any("Acr" in g["gene"] for g in phage["amr_catalog"])


def test_universal_organism_fungi():
    """Verify fungal and yeast genomic profiles (Candida auris, S. cerevisiae, Aspergillus)."""
    # 1. Candida auris
    candida = db.infer_organism_genomic_profile("Candida auris Outbreak Screening", "CAURIS_01")
    assert "Candida auris" in candida["species_name"]
    assert 11000000 <= candida["genome_size_bp"] <= 13500000
    assert 44.0 <= candida["gc_percent"] <= 46.5
    amr_candida = [g["gene"] for g in candida["amr_catalog"]]
    assert any("ERG11" in g for g in amr_candida)
    assert any("FKS1" in g for g in amr_candida)

    # 2. Saccharomyces cerevisiae
    yeast = db.infer_organism_genomic_profile("Saccharomyces cerevisiae Bioethanol", "YEAST_01")
    assert "Saccharomyces" in yeast["species_name"]
    assert 11500000 <= yeast["genome_size_bp"] <= 13000000
    assert yeast["contigs"] == 16  # 16 chromosomes

    # 3. Aspergillus fumigatus
    asp = db.infer_organism_genomic_profile("Aspergillus fumigatus Triazole Resistance", "AFUM_01")
    assert "Aspergillus" in asp["species_name"]
    assert 28000000 <= asp["genome_size_bp"] <= 31000000
    assert any("cyp51A" in g["gene"] for g in asp["amr_catalog"])


def test_universal_organism_plants():
    """Verify plant genomic profiles (Arabidopsis thaliana, Oryza sativa)."""
    # 1. Arabidopsis
    arab = db.infer_organism_genomic_profile("Arabidopsis thaliana Col-0", "ARAB_01")
    assert "Arabidopsis" in arab["species_name"]
    assert 130000000 <= arab["genome_size_bp"] <= 140000000
    assert arab["contigs"] == 5  # 5 chromosomes
    assert any("ALS" in g["gene"] or "EPSPS" in g["gene"] for g in arab["amr_catalog"])

    # 2. Rice (Oryza sativa)
    rice = db.infer_organism_genomic_profile("Oryza sativa Rice Blast Resistance", "RICE_01")
    assert "Oryza" in rice["species_name"]
    assert 360000000 <= rice["genome_size_bp"] <= 385000000
    assert rice["contigs"] == 12  # 12 chromosomes


def test_universal_organism_animals_and_human():
    """Verify human (GRCh38) and parasite (Plasmodium falciparum) genomic profiles."""
    # 1. Human GRCh38
    human = db.infer_organism_genomic_profile("Homo sapiens Clinical Exome", "HUMAN_01")
    assert "Homo sapiens" in human["species_name"]
    assert human["genome_size_bp"] > 3000000000  # 3.1 Gb
    assert human["contigs"] == 24  # 22 autosomes + X + Y
    cyp_genes = [g["gene"] for g in human["amr_catalog"]]
    assert any("CYP2D6" in g or "CYP2C19" in g for g in cyp_genes)

    # 2. Plasmodium falciparum
    malaria = db.infer_organism_genomic_profile("Plasmodium falciparum Malaria Resistance", "MAL_01")
    assert "Plasmodium" in malaria["species_name"]
    assert 22000000 <= malaria["genome_size_bp"] <= 24500000
    assert malaria["gc_percent"] < 22.0  # Extreme AT-rich (~19.3%)
    assert any("pfcrt" in g["gene"] or "pfk13" in g["gene"] for g in malaria["amr_catalog"])


def test_universal_organism_bacteria():
    """Verify high-priority pathogenic bacteria."""
    # 1. Helicobacter pylori
    hp = db.infer_organism_genomic_profile("Helicobacter pylori SRR40271360", "SRR40271360")
    assert hp["species_name"] == "Helicobacter pylori"
    assert 1600000 <= hp["genome_size_bp"] <= 1720000
    assert 38.0 <= hp["gc_percent"] <= 39.5
    assert any("23S" in g["gene"] or "rdxA" in g["gene"] for g in hp["amr_catalog"])

    # 2. Pseudomonas aeruginosa
    pa = db.infer_organism_genomic_profile("Pseudomonas aeruginosa MDR", "PA_01")
    assert pa["species_name"] == "Pseudomonas aeruginosa"
    assert pa["genome_size_bp"] > 6000000
    assert pa["gc_percent"] > 65.0
    assert any("blaVIM-2" in g["gene"] or "mexB" in g["gene"] for g in pa["amr_catalog"])

    # 3. Mycobacterium tuberculosis
    tb = db.infer_organism_genomic_profile("Mycobacterium tuberculosis XDR", "TB_01")
    assert tb["species_name"] == "Mycobacterium tuberculosis"
    assert 4350000 <= tb["genome_size_bp"] <= 4450000
    assert tb["gc_percent"] > 64.0
    assert any("rpoB" in g["gene"] or "katG" in g["gene"] for g in tb["amr_catalog"])


def test_universal_algorithmic_classifier_novel_species():
    """Verify that any unknown species derives authentic metrics and NEVER defaults to Salmonella."""
    # 1. Novel Archaea
    arch = db.infer_organism_genomic_profile("Thermococcus kodakarensis Deep Sea Vent Archaea", "TKOD_01")
    assert "Thermococcus" in arch["species_name"]
    assert "Salmonella" not in arch["species_name"]
    assert 1500000 <= arch["genome_size_bp"] <= 3500000
    assert arch["gc_percent"] >= 40.0

    # 2. Novel Plant
    plant = db.infer_organism_genomic_profile("Zea diploperennis Wild Crop Flora", "ZEA_01")
    assert "Zea" in plant["species_name"]
    assert "Salmonella" not in plant["species_name"]
    assert plant["genome_size_bp"] > 100000000  # Plant scale > 100 Mb


def test_wsl_executor_output_verification_and_error_handling(tmp_path):
    """Test that normal runs set output_files_verified=True (green dot)

    and simulated errors or non-zero exit codes set output_files_verified=False (red dot).
    """
    test_db = str(tmp_path / "test_status.db")
    db.init_db(test_db)

    # 1. Successful execution -> verified green dot
    normal_job = wsl_executor.execute_job({
        "tool_id": "fastqc",
        "samples": ["SRR40271360"],
        "parameters": {},
        "execution_mode": "fast_simulation",
    })
    assert normal_job["status"] == "completed"
    assert normal_job["exit_code"] == 0
    assert normal_job["output_files_verified"] is True
    assert len(normal_job["output_files"]) > 0

    # 2. Failed execution (error simulated) -> red dot
    failed_job = wsl_executor.execute_job({
        "tool_id": "fastqc",
        "samples": ["SRR40271360"],
        "parameters": {},
        "simulate_error": True,
        "execution_mode": "fast_simulation",
    })
    assert failed_job["status"] == "failed"
    assert failed_job["exit_code"] == 1
    assert failed_job["output_files_verified"] is False
    assert any("ERROR" in log or "failed" in log for log in failed_job["logs"])


def test_results_summary_for_universal_organisms():
    """Verify results summary generates appropriate stats for non-Salmonella organisms."""
    # Create a project with H. pylori
    created = db.create_project({
        "name": "Helicobacter pylori Gastric Biopsy Study",
        "organism": "bacteria",
        "description": "Gastric mucosa biopsies",
        "sample_ids": ["SRR40271360", "SRR40271362"],
    })
    assert created["id"]

    res = wsl_executor.get_results_summary(created["id"])
    assert res["project_id"] == created["id"]
    # Verify AMR genes contain H. pylori specific markers
    gene_names = [g["gene"] for g in res["amr_genes_list"]]
    assert any("23S" in g or "rdxA" in g or "gyrA" in g or "pbp1A" in g for g in gene_names)
    assert res["total_genomes"] == 2
