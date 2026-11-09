"""GenomeLab — Master Bioinformatics Tool Registry (70+ Tools Across All 12 WGS Stages & Organism Gold-Standard Profiles)."""

from typing import Dict, Any, List, Optional
from backend.tools_stages_1_to_6 import TOOLS_STAGES_1_TO_6, hw_params
from backend.tools_stages_7_to_12 import TOOLS_STAGES_7_TO_12


def _quick_tool(
    tid: str, name: str, binary: str, ver: str, stage_id: int, stage_name: str,
    cat: str, pkg: str, gold: bool, orgs: List[str], badge: str,
    short_desc: str, in_fmt: List[str], out_fmt: List[str], cmd: str,
    extra_params: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    params = list(extra_params or [
        {"id": "extra_args", "flag": "", "label": "Additional Parameters", "type": "text", "tier": "standard", "default": "", "description": f"Standard execution parameters for {name}."}
    ]) + hw_params(4, 8, "-t")
    return {
        "id": tid,
        "name": name,
        "binary": binary,
        "version": ver,
        "stage_id": stage_id,
        "stage_name": stage_name,
        "category": cat,
        "conda_env": "wgs_env",
        "conda_package": pkg,
        "is_gold_standard": gold,
        "recommended_organisms": orgs,
        "recommendation_badge": badge,
        "short_description": short_desc,
        "detailed_description": short_desc,
        "input_formats": in_fmt,
        "output_formats": out_fmt,
        "documentation_url": f"https://bioconda.github.io/recipes/{pkg}/README.html",
        "parameters": params,
        "example_command": cmd,
    }


ADDITIONAL_SPECIALIZED_TOOLS: List[Dict[str, Any]] = [
    # Stage 1 extras
    _quick_tool("pbccs", "PacBio HiFi CCS Consensus Caller", "ccs", "6.4.0", 1, "Stage 1: Raw Data Acquisition & Basecalling", "Basecalling", "pbccs", True, ["human_animal", "plant_fungi", "bacteria"], "★ Gold Standard — PacBio HiFi Circular Consensus", "Generates >99.9% accurate PacBio HiFi reads from subreads.bam.", ["BAM"], ["FASTQ_LONG"], "ccs subreads.bam hifi_reads.fastq.gz --min-rq 0.99 -j 4"),
    _quick_tool("sra_stat", "SRA-stat & SeqKit Split Utility", "sra-stat", "3.1.1", 1, "Stage 1: Raw Data Acquisition & Basecalling", "Data Ingestion", "sra-tools", False, ["bacteria", "human_animal", "all"], "SRA Read Count & Spot Verifier", "Inspects read spot counts, bases, and barcode layouts prior to extraction.", ["SRA_ACCESSION"], ["TSV_SUMMARY"], "sra-stat --quick --xml SRR2584863"),
    # Stage 2 extras
    _quick_tool("fastp_qc", "fastp Rapid JSON/HTML QC Profiler", "fastp", "0.23.4", 2, "Stage 2: Raw Read Quality Control (QC)", "Quality Control", "fastp", False, ["bacteria", "human_animal", "metagenome"], "Ultra-Fast Read Quality & Insert-Size Profiler", "Runs fastp in QC-only mode to profile insert size, duplication, and Phred curves.", ["FASTQ_PE"], ["HTML_REPORT", "JSON_REPORT"], "fastp -i R1.fq.gz -I R2.fq.gz --html fastp_qc.html --json fastp_qc.json --thread 4"),
    # Stage 3 extras
    _quick_tool("bbduk", "BBTools BBDuk K-mer Decontaminator & Trimmer", "bbduk.sh", "39.06", 3, "Stage 3: Read Trimming, Filtering & Host Depletion", "Trimming", "bbmap", False, ["bacteria", "plant_fungi", "metagenome"], "PhiX174 Spike-In & Adapter K-mer Filter", "Decontaminates Illumina PhiX174 control reads, rRNA, and adapters using k-mer matching.", ["FASTQ_PE"], ["FASTQ_PE"], "bbduk.sh in1=R1.fq.gz in2=R2.fq.gz out1=clean1.fq.gz out2=clean2.fq.gz ref=adapters,phix ktrim=r k=23 mink=11 hdist=1 tpe tbo threads=4"),
    _quick_tool("porechop", "Porechop_ABI Oxford Nanopore Adapter Clipper", "porechop", "0.5.0", 3, "Stage 3: Read Trimming, Filtering & Host Depletion", "Trimming", "porechop", True, ["bacteria", "viral_phage"], "★ Gold Standard — ONT Chimera & Barcode Splitter", "Finds and removes Oxford Nanopore adapters from read ends and splits chimeric middle-adapter reads.", ["FASTQ_LONG"], ["FASTQ_LONG"], "porechop -i nanopore_raw.fastq.gz -o nanopore_trimmed.fastq.gz --threads 4 --discard_middle"),
    # Stage 4 extras
    _quick_tool("centrifuge", "Centrifuge FM-Index Microbial Classifier", "centrifuge", "1.0.4", 4, "Stage 4: Taxonomic Classification & Contamination Screening", "Taxonomy", "centrifuge", False, ["metagenome", "bacteria"], "Low-RAM FM-Index Taxonomic Profiler", "Classifies metagenomic reads using a compressed Burrows-Wheeler FM-index (~4 GB RAM).", ["FASTQ_PE"], ["TSV_SUMMARY"], "centrifuge -x p_compressed+h+v -1 R1.fq.gz -2 R2.fq.gz -S centrifuge_hits.tsv --report-file centrifuge_report.tsv -p 4"),
    _quick_tool("confindr", "ConFindr Intra-Species Contamination Detector", "confindr.py", "0.8.1", 4, "Stage 4: Taxonomic Classification & Contamination Screening", "Contamination", "confindr", True, ["bacteria"], "★ Gold Standard — Intra-Species rMLST Contamination Check", "Detects cross-contamination between two strains of the SAME bacterial species (e.g. mixed Salmonella serovars) using 53 rMLST loci.", ["FASTQ_PE"], ["TSV_SUMMARY"], "confindr.py -i 01_raw_data -o 02_quality_control/confindr_out -t 4"),
    # Stage 5 extras
    _quick_tool("canu", "Canu Hierarchical Long-Read Assembler", "canu", "2.2", 5, "Stage 5: De Novo Genome Assembly & Polishing", "Assembly", "canu", False, ["bacteria", "plant_fungi", "human_animal"], "High-Sensitivity Overlap-Layout-Consensus (OLC) Assembler", "Performs read correction, trimming, and assembly of PacBio and Nanopore reads.", ["FASTQ_LONG"], ["FASTA_CONTIGS"], "canu -p isolate1 -d 04_assembly/canu_out genomeSize=4.8m -nanopore nanopore.fq.gz maxThreads=4 maxMemory=8"),
    _quick_tool("miniasm", "Minimap2 + Miniasm + Racon Ultra-Fast Assembler", "miniasm", "0.3", 5, "Stage 5: De Novo Genome Assembly & Polishing", "Assembly", "miniasm", False, ["bacteria", "viral_phage"], "60-Second OLC Long-Read Draft Assembler", "Constructs ultra-fast unitigs from all-vs-all Minimap2 overlaps followed by Racon consensus.", ["FASTQ_LONG"], ["GFA_GRAPH", "FASTA_CONTIGS"], "minimap2 -x ava-ont -t 4 reads.fq.gz reads.fq.gz | gzip -1 > overlaps.paf.gz && miniasm -f reads.fq.gz overlaps.paf.gz > unitigs.gfa"),
    _quick_tool("polypolish", "Polypolish + Medaka Hybrid Consensus Polisher", "polypolish", "0.6.0", 5, "Stage 5: De Novo Genome Assembly & Polishing", "Polishing", "polypolish", True, ["bacteria"], "★ Gold Standard — Repeat-Safe Short+Long Read Polisher", "Uses all-per-read BWA alignments (`-a`) to polish repeats in Flye/Unicycler long-read assemblies without introducing errors.", ["FASTA_CONTIGS", "BAM"], ["FASTA_CONTIGS"], "polypolish polish draft_assembly.fasta alignments_R1.sam alignments_R2.sam > polished_assembly.fasta"),
    # Stage 6 extras
    _quick_tool("checkm", "CheckM Lineage-Specific Marker Completeness", "checkm", "1.2.2", 6, "Stage 6: Assembly Quality Assessment & Completeness", "Assembly QC", "checkm-genome", False, ["bacteria", "metagenome"], "Classic Clade-Specific Marker Gene QA", "Estimates genome completeness and contamination using collocated single-copy marker gene sets.", ["FASTA_CONTIGS"], ["TSV_SUMMARY"], "checkm lineage_wf -t 4 -x fasta 04_assembly/ 05_assembly_qc/checkm_out"),
    # Stage 7 extras
    _quick_tool("pgap", "NCBI PGAP (Prokaryotic Genome Annotation Pipeline)", "pgap.py", "2024-04", 7, "Stage 7: Genome Structural & Functional Annotation", "Annotation", "ncbi-pgap", True, ["bacteria"], "★ Gold Standard — Official NCBI RefSeq Submission Pipeline", "Official NCBI pipeline combining GeneMarkS-2+ and TIGRFAM/NCBIfam HMMs for GenBank release.", ["FASTA_CONTIGS"], ["GFF3", "GBK", "FAA_PROTEINS"], "pgap.py -r -o 06_annotation/pgap_out -g contigs.fasta -s 'Salmonella enterica' --cpus 4 --memory 8g"),
    _quick_tool("maker_braker", "BRAKER3 & MAKER Eukaryotic Gene Predictor", "braker.pl", "3.0.8", 7, "Stage 7: Genome Structural & Functional Annotation", "Annotation", "braker3", True, ["plant_fungi", "human_animal"], "★ Gold Standard — Eukaryotic Intron/Exon Gene Annotation", "Combines GeneMark-ETP and AUGUSTUS with RNA-seq and OrthoDB proteins to annotate plant, fungal, and animal genomes.", ["FASTA_CONTIGS", "BAM"], ["GFF3", "FAA_PROTEINS"], "braker.pl --genome=genome.fasta --bam=rnaseq.bam --prot_seq=orthodb_proteins.fa --cores 4"),
    _quick_tool("interproscan", "InterProScan Protein Domain & Family Classifier", "interproscan.sh", "5.67", 7, "Stage 7: Genome Structural & Functional Annotation", "Annotation", "interproscan", True, ["bacteria", "human_animal", "plant_fungi"], "★ Gold Standard — Pfam, CDD, SMART & PANTHER Protein Domains", "Scans protein sequences (.faa) against 14 member databases (Pfam, TIGRFAM, SUPERFAMILY, GO).", ["FAA_PROTEINS"], ["TSV_SUMMARY", "GFF3"], "interproscan.sh -i 06_annotation/ERR14794383.faa -f tsv,gff3 -dp --goterms --pathways -cpu 4"),
    _quick_tool("barrnap", "Barrnap & tRNAscan-SE Ribosomal/Transfer RNA Predictor", "barrnap", "0.9", 7, "Stage 7: Genome Structural & Functional Annotation", "Annotation", "barrnap", False, ["bacteria", "plant_fungi"], "Rapid 16S/23S/5S rRNA & tRNA Extractor", "Uses nhmmer HMM profiles to extract 16S rRNA genes for taxonomic verification alongside tRNAscan-SE.", ["FASTA_CONTIGS"], ["GFF3", "FASTA_CONTIGS"], "barrnap --kingdom bac --threads 4 --outseq 16s_rrna.fasta contigs.fasta > rna_features.gff"),
    # Stage 8 extras
    _quick_tool("rgi_card", "CARD RGI (Resistance Gene Identifier)", "rgi", "6.0.3", 8, "Stage 8: Resistome (AMR), Virulome, Plasmid & MGE Profiling", "AMR & Virulence", "rgi", True, ["bacteria", "metagenome"], "★ Gold Standard — Strict/Perfect/Loose CARD Resistome Ontology", "Predicts resistomes from protein or nucleotide data using the Comprehensive Antibiotic Resistance Database (CARD) models.", ["FASTA_CONTIGS", "FAA_PROTEINS"], ["AMR_TSV", "JSON_REPORT"], "rgi main --input_sequence contigs.fasta --output_file 07_amr_profiling/rgi_card_out --input_type contig --local --clean -n 4"),
    _quick_tool("plasmidfinder", "PlasmidFinder CGE Replicon Classifier", "plasmidfinder.py", "2.1.6", 8, "Stage 8: Resistome (AMR), Virulome, Plasmid & MGE Profiling", "Plasmids & MGE", "plasmidfinder", True, ["bacteria"], "★ Gold Standard — Enterobacterales & Gram+ Plasmid Typing", "Center for Genomic Epidemiology tool identifying IncX1, IncX2, IncFII, IncI1, and Col replicons.", ["FASTA_CONTIGS", "FASTQ_PE"], ["AMR_TSV", "JSON_REPORT"], "plasmidfinder.py -i contigs.fasta -o 10_plasmids/plasmidfinder_out -t 0.90 -l 0.60 -x"),
    _quick_tool("phigaro", "Phigaro & VirSorter2 Prophage Detector", "phigaro", "2.4.0", 8, "Stage 8: Resistome (AMR), Virulome, Plasmid & MGE Profiling", "Plasmids & MGE", "phigaro", False, ["bacteria", "viral_phage"], "Integrated Prophage & Viral Region Finder", "Predicts integrated bacteriophage (prophage) regions and Phage-Inducible Chromosomal Islands (PICIs) in bacterial contigs.", ["FASTA_CONTIGS"], ["TSV_SUMMARY", "GFF3"], "phigaro -f contigs.fasta -o 10_plasmids/prophages -e tsv gff --threads 4"),
    # Stage 9 extras
    _quick_tool("chewbbaca", "chewBBACA Core-Genome MLST (cgMLST / wgMLST)", "chewBBACA.py", "3.3.4", 9, "Stage 9: Sequence Typing (MLST/cgMLST) & Pathogen Serotyping", "Typing", "chewbbaca", True, ["bacteria"], "★ Gold Standard — 3,002-Locus EnteroBase cgMLST Allele Caller", "Calls allele profiles across thousands of core loci for ultra-high-resolution outbreak clustering and Minimum Spanning Trees.", ["FASTA_CONTIGS"], ["MATRIX_TSV"], "chewBBACA.py AlleleCall -i 04_assembly/ -g schemas/Salmonella_cgMLST -o 07_typing/cgmlst_results --cpu 4"),
    _quick_tool("sistr", "SISTR (Salmonella In Silico Typing Resource)", "sistr", "1.1.2", 9, "Stage 9: Sequence Typing (MLST/cgMLST) & Pathogen Serotyping", "Serotyping", "sistr_cmd", True, ["bacteria"], "★ Gold Standard — Antigen + 330-Locus cgMLST Salmonella Serotyper", "Combines O/H antigen gene detection with 330-locus cgMLST phylogenetic clustering for accurate Salmonella serovar prediction.", ["FASTA_CONTIGS"], ["TSV_SUMMARY", "JSON_REPORT"], "sistr --qc -vv --alleles-output allele_results.json -f tab -o 07_typing/sistr_output.tab -t 4 contigs.fasta"),
    _quick_tool("kleborate", "Kleborate & spaTyper Pathogen Virulence/Typing Suite", "kleborate", "2.4.1", 9, "Stage 9: Sequence Typing (MLST/cgMLST) & Pathogen Serotyping", "Typing", "kleborate", False, ["bacteria"], "Klebsiella K/O Capsule, Yersiniabactin, Aerobactin & S. aureus spa", "Scores hypervirulence (ybt, clb, iuc, iro, rmpA) and ESBL/Carbapenemase resistance in Klebsiella alongside S. aureus spa typing.", ["FASTA_CONTIGS"], ["TSV_SUMMARY"], "kleborate --all -o 07_typing/kleborate_results.txt -a 04_assembly/*/contigs.fasta"),
    # Stage 10 extras
    _quick_tool("scoary", "Scoary Microbial Pan-GWAS (Trait-Gene Association)", "scoary", "1.6.16", 10, "Stage 10: Comparative Genomics, Pan-Genome & FastANI", "Pan-Genome", "scoary", True, ["bacteria"], "★ Gold Standard — Pan-Genome Wide Association Study (Pan-GWAS)", "Links accessory gene presence/absence from Roary/Panaroo to phenotypic traits (e.g. Livestock Host, Country, MDR phenotype) with Bonferroni/BH p-values.", ["PANGENOME_CSV", "METADATA_CSV"], ["TSV_SUMMARY"], "scoary -g 12_pangenome/output_roary/gene_presence_absence.csv -t metadata/traits.csv -o 12_pangenome/scoary_gwas --threads 4"),
    _quick_tool("blastn", "NCBI BLAST+ (blastn / blastp / makeblastdb)", "blastn", "2.15.0", 10, "Stage 10: Comparative Genomics, Pan-Genome & FastANI", "Comparative", "blast", True, ["bacteria", "human_animal", "plant_fungi", "viral_phage", "all"], "★ Gold Standard — Local Nucleotide & Protein Homology Search", "Formats custom local FASTA databases (`makeblastdb`) and runs tabular BLASTn/BLASTp (`-outfmt 6`) synteny and gene comparisons.", ["FASTA_CONTIGS"], ["TSV_SUMMARY"], "blastn -query query_gene.fasta -db custom_genome_db -outfmt '6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore' -evalue 1e-10 -num_threads 4 > blast_hits.tsv"),
    # Stage 11 extras
    _quick_tool("deepvariant", "Google DeepVariant & Clair3 Neural Variant Caller", "run_deepvariant", "1.6.1", 11, "Stage 11: Reference Alignment, Variant Calling & Annotation", "Variant Calling", "deepvariant", True, ["human_animal", "plant_fungi"], "★ Gold Standard — Deep CNN Highest-Accuracy SNP/Indel Caller", "Deep convolutional neural network caller winning FDA Truth Challenge benchmarks for Illumina, PacBio HiFi, and Nanopore reads.", ["BAM", "FASTA_REF"], ["VCF", "HTML_REPORT"], "run_deepvariant --model_type=WGS --ref=ref/genome.fasta --reads=aligned.bam --output_vcf=deepvariant.vcf.gz --num_shards=4"),
    _quick_tool("dragen", "DRAGEN-os & FreeBayes Haplotype Variant Caller", "freebayes", "1.3.8", 11, "Stage 11: Reference Alignment, Variant Calling & Annotation", "Variant Calling", "freebayes", False, ["bacteria", "human_animal", "plant_fungi", "viral_phage"], "Bayesian Haplotype-Based Polymorphism Caller", "Calls SNPs, indels, and MNPs using short-read haplotype phasing across any ploidy.", ["BAM", "FASTA_REF"], ["VCF"], "freebayes -f ref/genome.fasta -p 1 --min-coverage 10 --min-alternate-fraction 0.9 aligned.sorted.bam > freebayes_variants.vcf"),
    _quick_tool("gubbins", "Gubbins + SNP-sites Recombination Removal Suite", "run_gubbins.py", "3.3.5", 11, "Stage 11: Reference Alignment, Variant Calling & Annotation", "Variant Annotation", "gubbins", True, ["bacteria"], "★ Gold Standard — Horizontal Recombination Masker for Outbreak Trees", "Identifies loci with elevated base-substitution densities caused by homologous recombination and extracts clean vertical SNPs via `snp-sites`.", ["CORE_ALN"], ["CORE_ALN", "VCF", "NEWICK_TREE"], "run_gubbins.py --prefix gubbins_clean --threads 4 --tree-builder iqtree core.full.aln && snp-sites -c gubbins_clean.filtered_polymorphic_sites.fasta > clean_core_snps.aln"),
    # Stage 12 extras
    _quick_tool("mega11", "MEGA11 (MegaCC) Command-Line Phylogenetics", "megacc", "11.0.13", 12, "Stage 12: Phylogenomics, Genome Browsers & Publication Figures", "Phylogenetics", "mega", False, ["bacteria", "human_animal", "plant_fungi", "viral_phage"], "Classic MEGA11 NJ / Maximum-Likelihood / Kimura-2P Suite", "Executes MEGA11 `.mao` analysis options for Neighbor-Joining, UPGMA, and Maximum-Likelihood trees with bootstrap consensus.", ["CORE_ALN"], ["NEWICK_TREE"], "megacc -a infer_ML_nucleotide.mao -d core.aln -o mega11_phylogeny.nwk"),
]

TOOLS_REGISTRY: List[Dict[str, Any]] = TOOLS_STAGES_1_TO_6 + TOOLS_STAGES_7_TO_12 + ADDITIONAL_SPECIALIZED_TOOLS

WGS_STAGES: List[Dict[str, Any]] = [
    {"id": 1, "name": "Stage 1: Raw Data Acquisition & Basecalling", "short_name": "Raw Data Acquisition & Ingestion", "description": "NCBI SRA download (prefetch/fasterq-dump), BioSample metadata extraction, ENA FTP, and Illumina/ONT/PacBio basecalling.", "input_types": ["SRA_ACCESSION", "POD5", "BCL_DIR"], "output_types": ["FASTQ_PE", "FASTQ_LONG", "METADATA_CSV"]},
    {"id": 2, "name": "Stage 2: Raw Read Quality Control (QC)", "short_name": "Raw Read Quality Control (QC)", "description": "Per-base Phred quality scoring, adapter content, GC distribution, N50 read stats, and MultiQC cohort aggregation.", "input_types": ["FASTQ_PE", "FASTQ_LONG"], "output_types": ["HTML_REPORT", "FASTQC_ZIP", "TSV_SUMMARY"]},
    {"id": 3, "name": "Stage 3: Read Trimming, Filtering & Host Depletion", "short_name": "Read Trimming & Host Depletion", "description": "Adapter clipping, sliding-window quality trimming, polyG tail removal, long-read filtering, and eukaryotic host DNA depletion.", "input_types": ["FASTQ_PE", "FASTQ_LONG"], "output_types": ["FASTQ_PE", "FASTQ_LONG"]},
    {"id": 4, "name": "Stage 4: Taxonomic Classification & Contamination Screening", "short_name": "Taxonomy & Contamination Check", "description": "Species identity confirmation, inter/intra-species contamination screening, and metagenomic abundance profiling.", "input_types": ["FASTQ_PE", "FASTA_CONTIGS"], "output_types": ["KRAKEN_REPORT", "TSV_SUMMARY"]},
    {"id": 5, "name": "Stage 5: De Novo Genome Assembly & Polishing", "short_name": "De Novo Genome Assembly", "description": "Short-read, long-read, hybrid, and metagenomic de Bruijn / repeat-graph genome assembly and consensus polishing.", "input_types": ["FASTQ_PE", "FASTQ_LONG"], "output_types": ["FASTA_CONTIGS", "GFA_GRAPH"]},
    {"id": 6, "name": "Stage 6: Assembly Quality Assessment & Completeness", "short_name": "Assembly Quality (QUAST / CheckM2)", "description": "Evaluation of N50, L50, GC%, contig count (QUAST), microbial completeness/contamination (CheckM2), and BUSCO orthologs.", "input_types": ["FASTA_CONTIGS", "GFA_GRAPH"], "output_types": ["HTML_REPORT", "TSV_SUMMARY"]},
    {"id": 7, "name": "Stage 7: Genome Structural & Functional Annotation", "short_name": "Genome Annotation (Prokka / Bakta)", "description": "Prediction of CDS, rRNA, tRNA, tmRNA, ncRNA, signal peptides, and KEGG/GO/COG/Pfam functional pathways.", "input_types": ["FASTA_CONTIGS"], "output_formats": ["GFF3", "GBK", "FAA_PROTEINS"], "output_types": ["GFF3", "GBK", "FAA_PROTEINS"]},
    {"id": 8, "name": "Stage 8: Resistome (AMR), Virulome, Plasmid & MGE Profiling", "short_name": "AMR, Virulence & Plasmids", "description": "Detection of acquired AMR genes, chromosomal point mutations, VFDB virulence factors, plasmid replicons, and integrons.", "input_types": ["FASTA_CONTIGS", "GFF3"], "output_types": ["AMR_TSV", "MATRIX_TSV"]},
    {"id": 9, "name": "Stage 9: Sequence Typing (MLST/cgMLST) & Pathogen Serotyping", "short_name": "MLST & Pathogen Serotyping", "description": "7-gene PubMLST sequence typing, 3,002-locus cgMLST allele calling, and Salmonella/E. coli/Klebsiella antigenic serotyping.", "input_types": ["FASTA_CONTIGS", "FASTQ_PE"], "output_types": ["TSV_SUMMARY", "MATRIX_TSV"]},
    {"id": 10, "name": "Stage 10: Comparative Genomics, Pan-Genome & FastANI", "short_name": "Pan-Genome & FastANI", "description": "Core/Soft-Core/Shell/Cloud pan-genome clustering (Roary/Panaroo), all-vs-all Whole-Genome FastANI, and Pan-GWAS (Scoary).", "input_types": ["GFF3", "FASTA_CONTIGS"], "output_types": ["PANGENOME_CSV", "CORE_ALN", "ANI_MATRIX"]},
    {"id": 11, "name": "Stage 11: Reference Alignment, Variant Calling & Annotation", "short_name": "Alignment & Variant Calling", "description": "Reference mapping (BWA-MEM/Minimap2), Picard deduplication, SNP/indel calling (Snippy/GATK4/DeepVariant/BCFtools), and SnpEff/VEP/ANNOVAR annotation.", "input_types": ["FASTQ_PE", "FASTA_CONTIGS", "FASTA_REF"], "output_types": ["BAM", "VCF", "CORE_ALN"]},
    {"id": 12, "name": "Stage 12: Phylogenomics, Genome Browsers & Publication Figures", "short_name": "Phylogenetics & Visualization", "description": "Maximum-Likelihood tree reconstruction (IQ-TREE 2, RAxML-NG, FastTree, MEGA11) and publication visualization (ggtree, iTOL, IGV, Circos).", "input_types": ["CORE_ALN", "NEWICK_TREE", "AMR_TSV"], "output_types": ["NEWICK_TREE", "SVG_PLOT", "PDF_FIGURE"]}
]

ORGANISM_PROFILES: List[Dict[str, Any]] = [
    {
        "id": "bacteria",
        "name": "Bacteria / Prokaryotes (Salmonella, E. coli, Klebsiella, S. aureus)",
        "short_name": "Bacteria (WGS & AMR)",
        "default_genome_size": "4.8 Mb",
        "ploidy": 1,
        "description": "Optimized for bacterial isolate whole-genome assembly, AMR/virulence/plasmid profiling, MLST/serotyping, pan-genome, and core-SNP phylogenomics.",
        "gold_standard_path": ["fasterq_dump", "fastqc", "multiqc", "fastp", "kraken2", "spades", "quast", "checkm2", "prokka", "abricate", "amrfinderplus", "mlst", "seqsero2", "roary", "fastani", "snippy", "iqtree2", "igv_circos_tbtools"]
    },
    {
        "id": "human_animal",
        "name": "Human, Livestock & Mammalian Diploid Genomes (GATK / DeepVariant)",
        "short_name": "Human & Animal (Diploid)",
        "default_genome_size": "2.8 - 3.1 Gb",
        "ploidy": 2,
        "description": "Follows Broad Institute GATK4 Best Practices & DeepVariant for reference alignment, duplicate marking, germline/somatic variant calling, and VEP/ANNOVAR/ClinVar annotation.",
        "gold_standard_path": ["fasterq_dump", "fastqc", "multiqc", "fastp", "bwa_mem", "picard", "gatk_haplotypecaller", "deepvariant", "snpeff", "igv_circos_tbtools"]
    },
    {
        "id": "plant_fungi",
        "name": "Plant, Crop & Fungal Eukaryotic Genomes",
        "short_name": "Plant & Fungi",
        "default_genome_size": "40 Mb - 4.5 Gb",
        "ploidy": 2,
        "description": "Tailored for hybrid/HiFi de novo assembly (Hifiasm/Flye), BUSCO completeness, intron-aware gene prediction (BRAKER3/MAKER), and comparative genomics.",
        "gold_standard_path": ["fasterq_dump", "fastqc", "fastp", "hifiasm", "flye", "quast", "busco", "maker_braker", "eggnog_mapper", "bwa_mem", "gatk_haplotypecaller", "iqtree2", "igv_circos_tbtools"]
    },
    {
        "id": "viral_phage",
        "name": "Viruses & Bacteriophages (Surveillance & Phage Genomics)",
        "short_name": "Viruses & Phages",
        "default_genome_size": "15 kb - 250 kb",
        "ploidy": 1,
        "description": "Host DNA depletion, amplicon/primer clipping (Cutadapt), viral assembly (SPAdes --corona / Unicycler), prophage calling, and rapid phylodynamics.",
        "gold_standard_path": ["fasterq_dump", "fastqc", "fastp", "cutadapt", "bowtie2_host_depletion", "spades", "prokka", "phigaro", "snippy", "iqtree2", "igv_circos_tbtools"]
    },
    {
        "id": "metagenome",
        "name": "Shotgun Metagenomics & Microbiome Profiling",
        "short_name": "Metagenomics",
        "default_genome_size": "Multi-Species Community",
        "ploidy": 1,
        "description": "Host DNA subtraction, Kraken2 + Bracken species abundance profiling, MEGAHIT/metaSPAdes assembly, CheckM2 MAG quality, and community resistome screening.",
        "gold_standard_path": ["fasterq_dump", "fastqc", "fastp", "bowtie2_host_depletion", "kraken2", "bracken", "megahit", "checkm2", "abricate", "rgi_card", "igv_circos_tbtools"]
    }
]


def get_all_stages() -> List[Dict[str, Any]]:
    stages = []
    for st in WGS_STAGES:
        count = sum(1 for t in TOOLS_REGISTRY if t["stage_id"] == st["id"])
        s_copy = dict(st)
        s_copy["tool_count"] = count
        stages.append(s_copy)
    return stages


def _sync_custom_tools_from_db() -> None:
    try:
        import backend.database as db
        existing_ids = {t["id"] for t in TOOLS_REGISTRY}
        for ct in db.get_custom_tools():
            if ct.get("id") and ct["id"] not in existing_ids:
                TOOLS_REGISTRY.append(ct)
                existing_ids.add(ct["id"])
    except Exception:
        pass


def get_all_tools(organism: Optional[str] = None) -> List[Dict[str, Any]]:
    _sync_custom_tools_from_db()
    if not organism or organism == "all":
        return TOOLS_REGISTRY
    result = []
    for tool in TOOLS_REGISTRY:
        t_copy = dict(tool)
        recs = tool.get("recommended_organisms", [])
        t_copy["is_recommended_for_selected"] = (organism in recs or "all" in recs) and bool(tool.get("is_gold_standard", False))
        result.append(t_copy)
    return result


def get_tool_by_id(tool_id: str) -> Optional[Dict[str, Any]]:
    _sync_custom_tools_from_db()
    for t in TOOLS_REGISTRY:
        if t["id"] == tool_id:
            return t
    return None


def register_custom_tool(data: Dict[str, Any]) -> Dict[str, Any]:
    tool_id = data.get("id") or data["name"].lower().replace(" ", "_").replace("-", "_")
    stage_id = int(data.get("stage_id", 5))
    stage_name = next((s["name"] for s in WGS_STAGES if s["id"] == stage_id), "Stage 5: De Novo Genome Assembly & Polishing")
    new_tool = {
        "id": tool_id,
        "name": data["name"],
        "binary": data.get("binary", tool_id),
        "version": data.get("version", "1.0.0-custom"),
        "stage_id": stage_id,
        "stage_name": stage_name,
        "category": data.get("category", "Custom CLI Tool"),
        "conda_env": data.get("conda_env", "wgs_env"),
        "conda_package": data.get("conda_package", tool_id),
        "is_gold_standard": bool(data.get("is_gold_standard", False)),
        "recommended_organisms": data.get("recommended_organisms", ["all"]),
        "recommendation_badge": data.get("recommendation_badge", "Custom User-Integrated CLI Tool"),
        "short_description": data.get("short_description", "User-registered bioinformatics CLI tool."),
        "detailed_description": data.get("detailed_description", data.get("short_description", "")),
        "input_formats": data.get("input_formats", ["FASTA_CONTIGS", "FASTQ_PE"]),
        "output_formats": data.get("output_formats", ["TSV_SUMMARY"]),
        "documentation_url": data.get("documentation_url", "https://bio.tools/"),
        "parameters": data.get("parameters", hw_params(4, 8, "-t")),
        "example_command": data.get("example_command", f"{data.get('binary', tool_id)} --help")
    }
    TOOLS_REGISTRY.append(new_tool)
    return new_tool
