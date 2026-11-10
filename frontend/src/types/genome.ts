export type ParameterType = 'boolean' | 'number' | 'select' | 'multiselect' | 'text' | 'filepath';
export type ParameterTier = 'standard' | 'advanced' | 'hardware';

export interface ParameterOption {
  value: string;
  label: string;
}

export interface ToolParameter {
  id: string;
  flag: string;
  label: string;
  type: ParameterType;
  tier: ParameterTier;
  default: string | number | boolean | string[];
  min?: number;
  max?: number;
  step?: number;
  options?: ParameterOption[];
  required?: boolean;
  description: string;
  beginner_note?: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  binary: string;
  version: string;
  stage_id: number;
  stage_name: string;
  category: string;
  conda_env: string;
  conda_package: string;
  short_description: string;
  detailed_description: string;
  input_formats: string[];
  output_formats: string[];
  documentation_url: string;
  parameters: ToolParameter[];
  example_command: string;
  is_gold_standard?: boolean;
  recommended_organisms?: string[];
  recommendation_badge?: string;
}

export interface FlagBreakdown {
  token: string;
  category: string;
  meaning: string;
  why_used: string;
}

export interface CodeInspectionResult {
  tool_id: string;
  tool_name: string;
  stage_name: string;
  conda_env: string;
  conda_activation_cmd: string;
  single_sample_command: string;
  wsl_wrapped_command: string;
  flag_breakdown: FlagBreakdown[];
  bash_batch_script: string;
  nextflow_dsl2_script: string;
  conda_yaml: string;
  beginner_tips: string[];
}

export interface Sample {
  id: string;
  name: string;
  country: string;
  host: string;
  year: string;
  r1_path: string;
  r2_path: string;
  assembly_path: string;
  status: string;
  genome_size_bp: number;
  gc_percent: number;
  n50: number;
  contigs: number;
  st: string;
  amr_genes: string[];
  plasmids: string[];
}

export interface Project {
  id: string;
  name: string;
  organism: string;
  description: string;
  wsl_path: string;
  created_at: string;
  sample_count: number;
  status: string;
  samples: Sample[];
}

export interface ThermalGuardConfig {
  max_threads: number;
  max_ram_gb: number;
  cooldown_seconds: number;
  enabled: boolean;
}

export type JobStatus = 'queued' | 'running' | 'cooling_down' | 'completed' | 'failed' | 'cancelled';

export type ProcessStatus = 'idle' | 'running' | 'completed' | 'failed';

export interface ProcessState {
  status: ProcessStatus;
  label?: string;
  toolId?: string;
  stageId?: number;
  message?: string;
  outputFilesVerified?: boolean;
  startedAt?: string;
}

export interface JobRecord {
  id: string;
  name: string;
  project_id: string;
  tool_id: string;
  tool_name: string;
  stage_name: string;
  stage_id?: number;
  command?: string;
  execution_mode: 'wsl_real' | 'fast_simulation';
  status: JobStatus;
  progress: number;
  samples: string[];
  parameters: Record<string, any>;
  thermal_guard: ThermalGuardConfig;
  started_at: string;
  completed_at?: string;
  duration_seconds: number;
  exit_code?: number;
  logs: string[];
  code_inspection: CodeInspectionResult;
  output_files?: string[];
  output_files_verified?: boolean;
}

export interface StageInfo {
  id: number;
  name: string;
  short_name: string;
  description: string;
  tool_count: number;
  input_types: string[];
  output_types: string[];
}

export interface PipelineNode {
  id: string;
  tool_id: string;
  label: string;
  stage_id: number;
  x: number;
  y: number;
  parameters: Record<string, any>;
  custom_flags?: string;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  data_format: string;
}

export interface PipelinePreset {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  target_organism: string;
  estimated_runtime: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  master_bash_script?: string;
  nextflow_script?: string;
}

export interface WSLBinaryStatus {
  tool_id: string;
  name: string;
  binary: string;
  conda_env: string;
  path: string;
  version: string;
  installed: boolean;
}

export interface CondaEnvInfo {
  name: string;
  path: string;
  python_version: string;
  tool_count: number;
  description: string;
  key_tools: string[];
}

export interface WSLStatus {
  wsl_available: boolean;
  distro: string;
  kernel: string;
  user: string;
  cpu_model: string;
  total_cores: number;
  recommended_threads: number;
  total_ram_gb: number;
  recommended_ram_gb: number;
  recommended_cooldown_sec: number;
  conda_environments: CondaEnvInfo[];
  detected_binaries: WSLBinaryStatus[];
}

export interface WSLBrowseEntry {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes?: number;
  size_human?: string;
  file_type?: string;
  modified?: string;
}

export interface AMRMatrixRow {
  sample_id: string;
  country: string;
  host: string;
  year: string;
  st: string;
  mdr: boolean;
  genes: Record<string, number>; // gene name -> % identity (0 if absent)
  plasmids: string[];
}

export interface PhylogenyLeafMetadata {
  id: string;
  country: string;
  host: string;
  year: string;
  st: string;
  mdr: boolean;
  amr_count: number;
  key_genes: string[];
  plasmids: string[];
  branch_length: number;
  clade: string;
}

export interface ResultsSummary {
  project_id: string;
  project_name: string;
  total_genomes: number;
  amr_genes_list: {
    gene: string;
    drug_class: string;
    prevalence_pct: number;
    count: number;
    mechanism: string;
  }[];
  amr_matrix: AMRMatrixRow[];
  plasmid_summary: {
    replicon: string;
    incompatibility_group: string;
    count: number;
    prevalence_pct: number;
    associated_amr: string[];
  }[];
  virulence_summary: {
    gene: string;
    category: string;
    prevalence_pct: number;
    function: string;
  }[];
  pangenome_stats: {
    core_genes: number;
    soft_core_genes: number;
    shell_genes: number;
    cloud_genes: number;
    total_clusters: number;
    accumulation_curve: { genomes: number; core: number; pan: number }[];
  };
  ani_matrix: {
    samples: string[];
    values: number[][];
  };
  assembly_qc: {
    sample_id: string;
    n50: number;
    l50: number;
    gc_percent: number;
    genome_size_bp: number;
    contigs: number;
    st: string;
  }[];
  phylogeny: {
    newick: string;
    tree_path: string;
    alignment_length_bp: number;
    core_snps: number;
    model: string;
    leaves: PhylogenyLeafMetadata[];
  };
  export_scripts: {
    r_ggtree: string;
    python_seaborn: string;
    itol_colorstrip: string;
    itol_binary: string;
    publication_methods: string;
  };
}

export interface VisualizationCustomization {
  chart_type?: string;
  palette?: string;
  primary_color?: string;
  secondary_color?: string;
  hatch_pattern?: string;
  line_style?: string;
  marker_style?: string;
  theme?: string;
  font_family?: string;
  font_size?: number;
  custom_title?: string;
  show_grid?: boolean;
  show_values?: boolean;
  legend_pos?: string;
  dpi?: number;
}

export interface VisualizationResult {
  plot_type: string;
  project_id: string;
  sample_id?: string;
  engine: string;
  format: string;
  image_data: string;
  raw_base64?: string;
  title: string;
  r_script_path?: string;
  script_executed?: string;
  metrics?: any;
  customization_applied?: VisualizationCustomization;
  generated_at: string;
}
