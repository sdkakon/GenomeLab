"""GenomeLab — Pre-Configured 1-Click Visual Pipeline Presets Across Organisms."""

from typing import List, Dict, Any
from backend.code_explainer import compile_workflow_scripts


RAW_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "preset_salmonella_50",
        "name": "Complete Bacterial WGS, AMR, Pan-Genome & Phylogeny (50-Genome Salmonella Standard)",
        "subtitle": "★ Gold-Standard Bacterial Pipeline (Reproduces South Asian Livestock Salmonella Study)",
        "description": "End-to-end 11-step workflow: SRA Fast Extraction -> FastQC & MultiQC -> fastp Trimming -> SPAdes De Novo Assembly -> QUAST QA -> Prokka Annotation -> ABRicate (ResFinder/VFDB/PlasmidFinder) -> PubMLST -> Roary Pan-Genome -> FastANI -> Snippy Core-SNP -> IQ-TREE 2 + ggtree.",
        "target_organism": "bacteria",
        "estimated_runtime": "~18 mins/genome (with 4-thread laptop thermal protection)",
        "nodes": [
            {"id": "n1", "tool_id": "fasterq_dump", "label": "1. fasterq-dump SRA", "stage_id": 1, "x": 40, "y": 80, "parameters": {"split_files": True, "threads": 4}},
            {"id": "n2", "tool_id": "fastqc", "label": "2. FastQC + MultiQC", "stage_id": 2, "x": 260, "y": 80, "parameters": {"nogroup": True, "threads": 4}},
            {"id": "n3", "tool_id": "fastp", "label": "3. fastp Read Trimmer", "stage_id": 3, "x": 480, "y": 80, "parameters": {"detect_adapter_for_pe": True, "qualified_quality_phred": 20, "length_required": 50, "threads": 4}},
            {"id": "n4", "tool_id": "spades", "label": "4. SPAdes Assembler", "stage_id": 5, "x": 700, "y": 80, "parameters": {"mode": "--isolate", "kmers": "21,33,55,77", "cov_cutoff": "auto", "threads": 4, "memory_gb": 8}},
            {"id": "n5", "tool_id": "quast", "label": "5. QUAST Assembly QA", "stage_id": 6, "x": 920, "y": 80, "parameters": {"min_contig": 500, "threads": 4}},
            {"id": "n6", "tool_id": "prokka", "label": "6. Prokka Annotation", "stage_id": 7, "x": 180, "y": 250, "parameters": {"kingdom": "Bacteria", "genus": "Salmonella", "species": "enterica", "gram": "neg", "threads": 4}},
            {"id": "n7", "tool_id": "abricate", "label": "7. ABRicate AMR/VF/Plasmid", "stage_id": 8, "x": 420, "y": 250, "parameters": {"db": "resfinder", "minid": 80, "mincov": 60, "threads": 4}},
            {"id": "n8", "tool_id": "mlst", "label": "8. PubMLST Sequence Typer", "stage_id": 9, "x": 660, "y": 250, "parameters": {"scheme": "auto", "threads": 4}},
            {"id": "n9", "tool_id": "roary", "label": "9. Roary Pan-Genome", "stage_id": 10, "x": 260, "y": 420, "parameters": {"mafft_align": True, "blastp_identity": 95, "core_def": 99, "threads": 4}},
            {"id": "n10", "tool_id": "fastani", "label": "10. FastANI Matrix", "stage_id": 10, "x": 500, "y": 420, "parameters": {"matrix": True, "threads": 4}},
            {"id": "n11", "tool_id": "snippy", "label": "11. Snippy Core-SNP", "stage_id": 11, "x": 740, "y": 420, "parameters": {"mincov": 10, "minfrac": 0.9, "threads": 4}},
            {"id": "n12", "tool_id": "iqtree2", "label": "12. IQ-TREE 2 + ggtree", "stage_id": 12, "x": 960, "y": 420, "parameters": {"model": "MFP", "bb": 1000, "threads": 4}}
        ],
        "edges": [
            {"id": "e1", "source": "n1", "target": "n2", "data_format": "FASTQ_PE"},
            {"id": "e2", "source": "n1", "target": "n3", "data_format": "FASTQ_PE"},
            {"id": "e3", "source": "n3", "target": "n4", "data_format": "FASTQ_PE"},
            {"id": "e4", "source": "n4", "target": "n5", "data_format": "FASTA_CONTIGS"},
            {"id": "e5", "source": "n4", "target": "n6", "data_format": "FASTA_CONTIGS"},
            {"id": "e6", "source": "n4", "target": "n7", "data_format": "FASTA_CONTIGS"},
            {"id": "e7", "source": "n4", "target": "n8", "data_format": "FASTA_CONTIGS"},
            {"id": "e8", "source": "n6", "target": "n9", "data_format": "GFF3"},
            {"id": "e9", "source": "n4", "target": "n10", "data_format": "FASTA_CONTIGS"},
            {"id": "e10", "source": "n4", "target": "n11", "data_format": "FASTA_CONTIGS"},
            {"id": "e11", "source": "n11", "target": "n12", "data_format": "CORE_ALN"}
        ]
    },
    {
        "id": "preset_ecoli_ref",
        "name": "Reference-Guided Alignment & Variant Calling (E. coli wgs_practice SRR2584863)",
        "subtitle": "★ Gold-Standard Reference Mapping & GATK/BCFtools/SnpEff Pipeline",
        "description": "Tailored for your /home/soumandeykakon/wgs_practice dataset: FastQC -> fastp -> BWA-MEM Reference Alignment -> Picard MarkDuplicates -> GATK4 HaplotypeCaller / BCFtools -> SnpEff Variant Annotation -> IGV Session.",
        "target_organism": "bacteria",
        "estimated_runtime": "~8 mins/sample",
        "nodes": [
            {"id": "r1", "tool_id": "fastqc", "label": "1. FastQC Raw Reads", "stage_id": 2, "x": 50, "y": 140, "parameters": {"nogroup": True, "threads": 4}},
            {"id": "r2", "tool_id": "fastp", "label": "2. fastp Adapter/Quality Cut", "stage_id": 3, "x": 270, "y": 140, "parameters": {"detect_adapter_for_pe": True, "qualified_quality_phred": 20, "threads": 4}},
            {"id": "r3", "tool_id": "bwa_mem", "label": "3. BWA-MEM + SAMtools Sort", "stage_id": 11, "x": 490, "y": 140, "parameters": {"mark_shorter_splits": True, "threads": 4}},
            {"id": "r4", "tool_id": "picard", "label": "4. Picard MarkDuplicates", "stage_id": 11, "x": 710, "y": 140, "parameters": {"remove_duplicates": False, "threads": 4}},
            {"id": "r5", "tool_id": "gatk_haplotypecaller", "label": "5. GATK4 HaplotypeCaller", "stage_id": 11, "x": 490, "y": 310, "parameters": {"ploidy": "1", "threads": 4}},
            {"id": "r6", "tool_id": "snpeff", "label": "6. SnpEff Functional Impact", "stage_id": 11, "x": 730, "y": 310, "parameters": {"engine": "snpeff", "threads": 4}},
            {"id": "r7", "tool_id": "igv_circos_tbtools", "label": "7. IGV & Publication Plots", "stage_id": 12, "x": 950, "y": 310, "parameters": {"layout": "rectangular", "dpi": 600}}
        ],
        "edges": [
            {"id": "re1", "source": "r1", "target": "r2", "data_format": "FASTQ_PE"},
            {"id": "re2", "source": "r2", "target": "r3", "data_format": "FASTQ_PE"},
            {"id": "re3", "source": "r3", "target": "r4", "data_format": "BAM"},
            {"id": "re4", "source": "r4", "target": "r5", "data_format": "BAM"},
            {"id": "re5", "source": "r5", "target": "r6", "data_format": "VCF"},
            {"id": "re6", "source": "r6", "target": "r7", "data_format": "VCF"}
        ]
    },
    {
        "id": "preset_human_gatk",
        "name": "Human & Livestock Diploid Clinical WGS (GATK4 + DeepVariant + VEP/ClinVar)",
        "subtitle": "★ Gold-Standard Diploid Variant Discovery Pipeline",
        "description": "Broad Institute GATK Best Practices workflow for human, cattle, poultry, goat, and swine diploid genomes.",
        "target_organism": "human_animal",
        "estimated_runtime": "~45 mins (Region) / ~6 hrs (Whole Diploid Genome)",
        "nodes": [
            {"id": "h1", "tool_id": "fastqc", "label": "1. FastQC + MultiQC", "stage_id": 2, "x": 60, "y": 180, "parameters": {"nogroup": True, "threads": 4}},
            {"id": "h2", "tool_id": "fastp", "label": "2. fastp Trimming", "stage_id": 3, "x": 280, "y": 180, "parameters": {"qualified_quality_phred": 20, "threads": 4}},
            {"id": "h3", "tool_id": "bwa_mem", "label": "3. BWA-MEM Alignment", "stage_id": 11, "x": 500, "y": 180, "parameters": {"mark_shorter_splits": True, "threads": 4}},
            {"id": "h4", "tool_id": "picard", "label": "4. Picard MarkDuplicates", "stage_id": 11, "x": 720, "y": 180, "parameters": {"remove_duplicates": False, "threads": 4}},
            {"id": "h5", "tool_id": "deepvariant", "label": "5. Google DeepVariant / GATK4", "stage_id": 11, "x": 500, "y": 340, "parameters": {"threads": 4}},
            {"id": "h6", "tool_id": "snpeff", "label": "6. Ensembl VEP + ANNOVAR + ClinVar", "stage_id": 11, "x": 760, "y": 340, "parameters": {"engine": "vep", "threads": 4}}
        ],
        "edges": [
            {"id": "he1", "source": "h1", "target": "h2", "data_format": "FASTQ_PE"},
            {"id": "he2", "source": "h2", "target": "h3", "data_format": "FASTQ_PE"},
            {"id": "he3", "source": "h3", "target": "h4", "data_format": "BAM"},
            {"id": "he4", "source": "h4", "target": "h5", "data_format": "BAM"},
            {"id": "he5", "source": "h5", "target": "h6", "data_format": "VCF"}
        ]
    },
    {
        "id": "preset_amr_triage",
        "name": "Rapid Clinical AMR, PointFinder, Plasmid & Serotype Triage",
        "subtitle": "Fast 10-Minute Surveillance Pipeline",
        "description": "fastp -> SKESA Fast Assembly -> StarAMR + NCBI AMRFinderPlus + MOB-suite Plasmid Reconstruction + SeqSero2 Serotyping.",
        "target_organism": "bacteria",
        "estimated_runtime": "~9 mins/isolate",
        "nodes": [
            {"id": "a1", "tool_id": "fastp", "label": "1. fastp Clean", "stage_id": 3, "x": 60, "y": 160, "parameters": {"threads": 4}},
            {"id": "a2", "tool_id": "skesa", "label": "2. SKESA Fast Assembly", "stage_id": 5, "x": 280, "y": 160, "parameters": {"min_contig": 500, "threads": 4}},
            {"id": "a3", "tool_id": "staramr", "label": "3. StarAMR Phenotype", "stage_id": 8, "x": 520, "y": 90, "parameters": {"pointfinder_organism": "salmonella", "threads": 4}},
            {"id": "a4", "tool_id": "amrfinderplus", "label": "4. NCBI AMRFinderPlus", "stage_id": 8, "x": 520, "y": 240, "parameters": {"organism": "Salmonella", "plus": True, "threads": 4}},
            {"id": "a5", "tool_id": "mob_suite", "label": "5. MOB-suite Plasmids", "stage_id": 8, "x": 760, "y": 90, "parameters": {"threads": 4}},
            {"id": "a6", "tool_id": "seqsero2", "label": "6. SeqSero2 Serovar", "stage_id": 9, "x": 760, "y": 240, "parameters": {"threads": 4}}
        ],
        "edges": [
            {"id": "ae1", "source": "a1", "target": "a2", "data_format": "FASTQ_PE"},
            {"id": "ae2", "source": "a2", "target": "a3", "data_format": "FASTA_CONTIGS"},
            {"id": "ae3", "source": "a2", "target": "a4", "data_format": "FASTA_CONTIGS"},
            {"id": "ae4", "source": "a2", "target": "a5", "data_format": "FASTA_CONTIGS"},
            {"id": "ae5", "source": "a2", "target": "a6", "data_format": "FASTA_CONTIGS"}
        ]
    },
    {
        "id": "preset_hybrid_longread",
        "name": "Hybrid Illumina + Nanopore/PacBio Complete Circular Genome Pipeline",
        "subtitle": "★ Gold-Standard Closed Chromosome & Plasmid Assembly",
        "description": "Dorado Basecalling -> NanoPlot -> Filtlong -> Unicycler / Flye Assembly -> Polypolish -> Bakta Standardized Annotation.",
        "target_organism": "bacteria",
        "estimated_runtime": "~25 mins/genome",
        "nodes": [
            {"id": "l1", "tool_id": "nanoplot", "label": "1. NanoPlot Long-Read QC", "stage_id": 2, "x": 60, "y": 180, "parameters": {"loglength": True, "threads": 4}},
            {"id": "l2", "tool_id": "filtlong", "label": "2. Filtlong Top 90%", "stage_id": 3, "x": 280, "y": 180, "parameters": {"min_length": 1000, "keep_percent": 90}},
            {"id": "l3", "tool_id": "unicycler", "label": "3. Unicycler Hybrid Graph", "stage_id": 5, "x": 500, "y": 180, "parameters": {"mode": "normal", "threads": 4}},
            {"id": "l4", "tool_id": "polypolish", "label": "4. Polypolish Consensus", "stage_id": 5, "x": 720, "y": 180, "parameters": {"threads": 4}},
            {"id": "l5", "tool_id": "bakta", "label": "5. Bakta Complete Annotation", "stage_id": 7, "x": 940, "y": 180, "parameters": {"compliant": True, "threads": 4}}
        ],
        "edges": [
            {"id": "le1", "source": "l1", "target": "l2", "data_format": "FASTQ_LONG"},
            {"id": "le2", "source": "l2", "target": "l3", "data_format": "FASTQ_LONG"},
            {"id": "le3", "source": "l3", "target": "l4", "data_format": "FASTA_CONTIGS"},
            {"id": "le4", "source": "l4", "target": "l5", "data_format": "FASTA_CONTIGS"}
        ]
    },
    {
        "id": "preset_metagenomics",
        "name": "Shotgun Metagenomic Taxonomic, MAG Assembly & Resistome Pipeline",
        "subtitle": "★ Gold-Standard Microbiome & One-Health Resistome Workflow",
        "description": "fastp -> Bowtie2 Host DNA Depletion -> Kraken2 + Bracken Species Abundance -> MEGAHIT Metagenome Assembly -> CheckM2 -> ABRicate + CARD RGI.",
        "target_organism": "metagenome",
        "estimated_runtime": "~30 mins/sample",
        "nodes": [
            {"id": "m1", "tool_id": "fastp", "label": "1. fastp QC & Trim", "stage_id": 3, "x": 50, "y": 180, "parameters": {"threads": 4}},
            {"id": "m2", "tool_id": "bowtie2_host_depletion", "label": "2. Bowtie2 Host Depletion", "stage_id": 3, "x": 270, "y": 180, "parameters": {"host_index": "GalGal6", "threads": 4}},
            {"id": "m3", "tool_id": "kraken2", "label": "3. Kraken2 + Bracken", "stage_id": 4, "x": 500, "y": 90, "parameters": {"confidence": 0.1, "threads": 4}},
            {"id": "m4", "tool_id": "megahit", "label": "4. MEGAHIT Assembly", "stage_id": 5, "x": 500, "y": 260, "parameters": {"preset": "meta-sensitive", "threads": 4}},
            {"id": "m5", "tool_id": "checkm2", "label": "5. CheckM2 MAG Quality", "stage_id": 6, "x": 740, "y": 260, "parameters": {"threads": 4}},
            {"id": "m6", "tool_id": "rgi_card", "label": "6. CARD RGI Resistome", "stage_id": 8, "x": 950, "y": 260, "parameters": {"threads": 4}}
        ],
        "edges": [
            {"id": "me1", "source": "m1", "target": "m2", "data_format": "FASTQ_PE"},
            {"id": "me2", "source": "m2", "target": "m3", "data_format": "FASTQ_PE"},
            {"id": "me3", "source": "m2", "target": "m4", "data_format": "FASTQ_PE"},
            {"id": "me4", "source": "m4", "target": "m5", "data_format": "FASTA_CONTIGS"},
            {"id": "me5", "source": "m4", "target": "m6", "data_format": "FASTA_CONTIGS"}
        ]
    }
]


def get_all_presets() -> List[Dict[str, Any]]:
    results = []
    for p in RAW_PRESETS:
        compiled = compile_workflow_scripts(p["name"], p["nodes"], p["edges"])
        p_copy = dict(p)
        p_copy["master_bash_script"] = compiled["master_bash_script"]
        p_copy["nextflow_script"] = compiled["nextflow_dsl2_script"]
        results.append(p_copy)
    return results
