import React, { useState, useRef, useMemo } from 'react';
import {
  StageInfo,
  ToolDefinition,
  PipelinePreset,
  PipelineNode,
  PipelineEdge,
  ThermalGuardConfig,
  Project,
  ProcessState,
} from '../types/genome';
import { ProcessStatusDot } from './ProcessStatusDot';
import {
  Play,
  Star,
  Plus,
  Trash2,
  Code2,
  Download,
  Copy,
  Check,
  X,
  Settings2,
  Zap,
  Search,
  GitBranch,
} from 'lucide-react';

export interface PipelineStudioViewProps {
  stages: StageInfo[];
  tools: ToolDefinition[];
  presets: PipelinePreset[];
  selectedOrganism: string;
  onChangeOrganism: (org: string) => void;
  activeProject?: Project;
  thermalGuard: ThermalGuardConfig;
  onInspectToolCode: (tool: ToolDefinition, params: Record<string, any>) => void;
  onRunWorkflow: (
    name: string,
    nodes: PipelineNode[],
    edges: PipelineEdge[],
    mode: 'wsl_real' | 'fast_simulation'
  ) => void;
  processState?: ProcessState;
}

export const PipelineStudioView: React.FC<PipelineStudioViewProps> = ({
  stages,
  tools,
  presets,
  selectedOrganism,
  onChangeOrganism,
  activeProject,
  thermalGuard,
  onInspectToolCode,
  onRunWorkflow,
  processState,
}) => {
  const defaultPresets: PipelinePreset[] = useMemo(
    () => [
      {
        id: 'preset-salmonella-50wgs',
        name: '50-Genome Salmonella WGS Standard',
        subtitle: 'Complete QC, Hybrid Assembly, AMRFinderPlus & Core SNP Phylogeny',
        description: 'Gold standard surveillance workflow for 50 Salmonella WGS isolates.',
        target_organism: 'Salmonella enterica',
        estimated_runtime: '45 mins (WSL2 8-thread)',
        nodes: [
          { id: 'node-fastp', tool_id: 'fastp', label: 'fastp QC & Trim', stage_id: 1, x: 40, y: 120, parameters: { threads: 8, qualified_quality_phred: 20 } },
          { id: 'node-unicycler', tool_id: 'unicycler', label: 'Unicycler Assembly', stage_id: 3, x: 300, y: 120, parameters: { threads: 8, mode: 'normal' } },
          { id: 'node-bakta', tool_id: 'bakta', label: 'Bakta Annotation', stage_id: 7, x: 560, y: 60, parameters: { threads: 8, min_contig_length: 200 } },
          { id: 'node-amrfinder', tool_id: 'amrfinderplus', label: 'AMRFinderPlus', stage_id: 8, x: 560, y: 210, parameters: { organism: 'Salmonella', ident_min: 0.9 } },
          { id: 'node-roary', tool_id: 'roary', label: 'Roary Pangenome', stage_id: 11, x: 820, y: 60, parameters: { threads: 8, cd: 95 } },
          { id: 'node-iqtree', tool_id: 'iqtree2', label: 'IQ-TREE 2 ML Phylogeny', stage_id: 12, x: 1080, y: 60, parameters: { threads: 8, m: 'GTR+F+R4' } },
        ],
        edges: [
          { id: 'e1', source: 'node-fastp', target: 'node-unicycler', data_format: 'FASTQ_PE' },
          { id: 'e2', source: 'node-unicycler', target: 'node-bakta', data_format: 'FASTA_CONTIGS' },
          { id: 'e3', source: 'node-unicycler', target: 'node-amrfinder', data_format: 'FASTA_CONTIGS' },
          { id: 'e4', source: 'node-bakta', target: 'node-roary', data_format: 'GFF3' },
          { id: 'e5', source: 'node-roary', target: 'node-iqtree', data_format: 'CORE_ALN_FASTA' },
        ],
      },
      {
        id: 'preset-ecoli-variant',
        name: 'E. coli Reference Variant Pipeline',
        subtitle: 'BWA-MEM2, GATK4 HaplotypeCaller & SnpEff',
        description: 'Precision mapping and variant calling against E. coli K-12 / O157:H7.',
        target_organism: 'Escherichia coli',
        estimated_runtime: '30 mins (WSL2)',
        nodes: [
          { id: 'node-fastp-ec', tool_id: 'fastp', label: 'fastp Clean', stage_id: 1, x: 40, y: 120, parameters: { threads: 8 } },
          { id: 'node-bwa', tool_id: 'bwa-mem2', label: 'BWA-MEM2 Align', stage_id: 4, x: 300, y: 120, parameters: { threads: 8 } },
          { id: 'node-gatk', tool_id: 'gatk4-haplotypecaller', label: 'GATK4 HaplotypeCaller', stage_id: 5, x: 560, y: 120, parameters: { ploidy: 1 } },
          { id: 'node-snpeff', tool_id: 'snpeff', label: 'SnpEff Annotation', stage_id: 5, x: 820, y: 120, parameters: {} },
        ],
        edges: [
          { id: 'e1', source: 'node-fastp-ec', target: 'node-bwa', data_format: 'FASTQ_PE' },
          { id: 'e2', source: 'node-bwa', target: 'node-gatk', data_format: 'BAM_SORTED' },
          { id: 'e3', source: 'node-gatk', target: 'node-snpeff', data_format: 'VCF_GZ' },
        ],
      },
      {
        id: 'preset-rapid-amr',
        name: 'Rapid Clinical AMR Triage',
        subtitle: 'Sub-15min K-mer Direct Screening',
        description: 'Rapid resistance profiling directly from FASTQ and contigs.',
        target_organism: 'Klebsiella pneumoniae',
        estimated_runtime: '12 mins',
        nodes: [
          { id: 'node-fastp-amr', tool_id: 'fastp', label: 'fastp Filter', stage_id: 1, x: 40, y: 120, parameters: {} },
          { id: 'node-spades', tool_id: 'spades', label: 'SPAdes Assembler', stage_id: 3, x: 300, y: 120, parameters: {} },
          { id: 'node-abricate', tool_id: 'abricate', label: 'ABRicate ResFinder', stage_id: 8, x: 560, y: 60, parameters: { db: 'resfinder' } },
          { id: 'node-amrfinder2', tool_id: 'amrfinderplus', label: 'AMRFinderPlus', stage_id: 8, x: 560, y: 210, parameters: {} },
        ],
        edges: [
          { id: 'e1', source: 'node-fastp-amr', target: 'node-spades', data_format: 'FASTQ_PE' },
          { id: 'e2', source: 'node-spades', target: 'node-abricate', data_format: 'FASTA_CONTIGS' },
          { id: 'e3', source: 'node-spades', target: 'node-amrfinder2', data_format: 'FASTA_CONTIGS' },
        ],
      },
    ],
    []
  );

  const allPresets = presets && presets.length > 0 ? presets : defaultPresets;

  const [nodes, setNodes] = useState<PipelineNode[]>(allPresets[0].nodes);
  const [edges, setEdges] = useState<PipelineEdge[]>(allPresets[0].edges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<number | 'all'>('all');
  const [scriptModalTab, setScriptModalTab] = useState<'bash' | 'nextflow'>('bash');
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [workflowName, setWorkflowName] = useState('Salmonella_Surveillance_WGS_Run1');
  const [copied, setCopied] = useState(false);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const toolMap = useMemo(() => {
    const map = new Map<string, ToolDefinition>();
    tools.forEach((t) => map.set(t.id, t));
    return map;
  }, [tools]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId) || null;
  }, [nodes, selectedNodeId]);

  const selectedToolDef = useMemo(() => {
    return selectedNode ? toolMap.get(selectedNode.tool_id) : null;
  }, [selectedNode, toolMap]);

  const filteredTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchSearch =
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.binary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.short_description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStage = stageFilter === 'all' || tool.stage_id === stageFilter;
      return matchSearch && matchStage;
    });
  }, [tools, searchQuery, stageFilter]);

  const handleSelectPreset = (presetId: string) => {
    const found = allPresets.find((p) => p.id === presetId);
    if (found) {
      setNodes(found.nodes);
      setEdges(found.edges);
      const tOrg = (found.target_organism || '').toLowerCase();
      const mappedOrg =
        tOrg.includes('human') || tOrg.includes('livestock')
          ? 'human_animal'
          : tOrg.includes('meta')
          ? 'metagenome'
          : tOrg.includes('plant') || tOrg.includes('fungi')
          ? 'plant_fungi'
          : tOrg.includes('viral') || tOrg.includes('phage')
          ? 'viral_phage'
          : 'bacteria';
      if (mappedOrg !== selectedOrganism) {
        onChangeOrganism(mappedOrg);
      }
      setSelectedNodeId(null);
    }
  };

  const handleAutoBuildGoldStandard = () => {
    const isEcoli = selectedOrganism.toLowerCase().includes('coli');
    const preset = isEcoli
      ? allPresets.find((p) => p.id.includes('ecoli')) || allPresets[1] || allPresets[0]
      : allPresets[0];
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setSelectedNodeId(null);
  };

  const handleNodeMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;
    setDraggingNodeId(nodeId);
    dragOffsetRef.current = { x: e.clientX - node.x, y: e.clientY - node.y };
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!draggingNodeId) return;
    const newX = Math.max(20, e.clientX - dragOffsetRef.current.x);
    const newY = Math.max(20, e.clientY - dragOffsetRef.current.y);
    setNodes((prev) =>
      prev.map((n) => (n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n))
    );
  };

  const handleCanvasMouseUp = () => {
    setDraggingNodeId(null);
  };

  const handleAddToolToCanvas = (tool: ToolDefinition) => {
    const count = nodes.length;
    const newNode: PipelineNode = {
      id: `node-${tool.id}-${Date.now().toString().slice(-4)}`,
      tool_id: tool.id,
      label: tool.name,
      stage_id: tool.stage_id,
      x: 80 + (count % 4) * 250,
      y: 100 + Math.floor(count / 4) * 130,
      parameters: { threads: thermalGuard.max_threads },
    };
    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newNode.id);
  };

  const handlePortClick = (nodeId: string, type: 'source' | 'target') => {
    if (type === 'source') {
      setConnectingSourceId(nodeId);
    } else if (type === 'target' && connectingSourceId) {
      if (connectingSourceId !== nodeId) {
        const sourceNode = nodes.find((n) => n.id === connectingSourceId);
        const formatBadge =
          sourceNode?.stage_id === 1
            ? 'FASTQ_PE'
            : sourceNode?.stage_id === 3
            ? 'FASTA_CONTIGS'
            : sourceNode?.stage_id === 7
            ? 'GFF3'
            : sourceNode?.stage_id === 8
            ? 'AMR_TSV'
            : 'DATA_STREAM';

        const newEdge: PipelineEdge = {
          id: `edge-${Date.now().toString().slice(-5)}`,
          source: connectingSourceId,
          target: nodeId,
          data_format: formatBadge,
        };
        setEdges((prev) => [...prev, newEdge]);
      }
      setConnectingSourceId(null);
    }
  };

  const handleDeleteEdge = (edgeId: string) => {
    setEdges((prev) => prev.filter((e) => e.id !== edgeId));
  };

  const handleDeleteNode = (nodeId: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== nodeId));
    setEdges((prev) => prev.filter((e) => e.source !== nodeId && e.target !== nodeId));
    if (selectedNodeId === nodeId) setSelectedNodeId(null);
  };

  const handleParamChange = (key: string, value: any) => {
    if (!selectedNodeId) return;
    setNodes((prev) =>
      prev.map((n) =>
        n.id === selectedNodeId
          ? { ...n, parameters: { ...n.parameters, [key]: value } }
          : n
      )
    );
  };

  const compiledBashScript = useMemo(() => {
    const threadLimit = thermalGuard.max_threads;
    const ramLimit = thermalGuard.max_ram_gb;
    const cooldownCmd = thermalGuard.enabled
      ? `\n  echo "Thermal Guard: Cooling down CPU for ${thermalGuard.cooldown_seconds}s..."\n  sleep ${thermalGuard.cooldown_seconds}\n`
      : '';

    return `#!/usr/bin/env bash
# ==============================================================================
# GenomeLab Enterprise Pipeline Master Script
# Target Organism: ${selectedOrganism}
# Thermal Guard Config: Max ${threadLimit} Threads | ${ramLimit} GB RAM
# ==============================================================================
set -euo pipefail

WORKDIR="\${1:-./analysis_output}"
SAMPLES_DIR="\${2:-./raw_fastqs}"
mkdir -p "\${WORKDIR}/"{qc,assemblies,annotations,amr_reports,phylogeny,logs}

export OMP_NUM_THREADS=${threadLimit}

${nodes
  .map((node, idx) => {
    const tool = toolMap.get(node.tool_id);
    const bin = tool?.binary || node.tool_id;
    return `# --- Stage ${idx + 1}: ${node.label} (${bin}) ---
echo ">> Running Stage ${idx + 1}: ${node.label}..."
conda run -n ${tool?.conda_env || 'wgs_env'} \\
  ${bin} \\
    --threads ${threadLimit} \\
    ${node.custom_flags || ''} \\
    --input "\${SAMPLES_DIR}" \\
    --output-dir "\${WORKDIR}/${node.stage_id > 8 ? 'phylogeny' : 'assemblies'}"
${cooldownCmd}`;
  })
  .join('\n')}
`;
  }, [nodes, toolMap, selectedOrganism, thermalGuard]);

  const compiledNextflowScript = useMemo(() => {
    return `// Nextflow DSL2 Workflow - Generated by GenomeLab v2.4
nextflow.enable.dsl=2

params.input_fastqs = "data/*_{1,2}.fastq.gz"
params.outdir       = "results"
params.threads      = ${thermalGuard.max_threads}
params.max_ram      = "${thermalGuard.max_ram_gb}.GB"

${nodes
  .map((node, i) => {
    const tool = toolMap.get(node.tool_id);
    const procName = node.tool_id.toUpperCase().replace(/[^A-Z0-9]/g, '_') + `_${i + 1}`;
    return `process ${procName} {
    tag "$sample_id"
    cpus ${thermalGuard.max_threads}
    memory "${thermalGuard.max_ram_gb}.GB"

    input:
    tuple val(sample_id), path(reads)

    output:
    tuple val(sample_id), path("*.{fasta,gff,tsv,vcf}"), emit: results

    script:
    """
    ${tool?.binary || node.tool_id} --threads ${thermalGuard.max_threads} \${reads}
    """
}`;
  })
  .join('\n\n')}
`;
  }, [nodes, toolMap, thermalGuard]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full gh-box flex flex-col min-h-0 overflow-hidden">
      {/* GitHub Workflow Header Bar */}
      <div className="gh-box-header flex-wrap gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1F2328]">
            <GitBranch className="w-4 h-4 text-[#656D76]" />
            <span>Workflow:</span>
          </div>

          <select
            aria-label="Workflow Preset Selection"
            className="gh-input py-1 font-medium cursor-pointer"
            onChange={(e) => handleSelectPreset(e.target.value)}
            defaultValue={allPresets[0].id}
          >
            {allPresets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleAutoBuildGoldStandard}
            className="gh-btn-secondary"
            title="Reset to gold-standard pipeline for current organism"
          >
            <Star className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
            <span>Reset Gold-Standard</span>
          </button>

          <span className="gh-badge font-mono">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {/* Right Workflow Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setShowScriptModal(true)} className="gh-btn-secondary">
            <Code2 className="w-3.5 h-3.5 text-[#656D76]" />
            <span>Export .sh / .nf</span>
          </button>

          <button
            onClick={() => {
              setNodes([]);
              setEdges([]);
              setSelectedNodeId(null);
            }}
            className="gh-btn-secondary"
            title="Clear DAG Canvas"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#656D76]" />
            <span>Clear</span>
          </button>

          <button
            onClick={() => setShowRunModal(true)}
            className="gh-btn-primary flex items-center gap-1.5"
          >
            <ProcessStatusDot
              status={processState?.status || 'idle'}
              size="sm"
              outputFilesVerified={processState?.outputFilesVerified}
            />
            <span>
              {processState?.status === 'running'
                ? 'Running Workflow...'
                : processState?.status === 'completed'
                ? 'Run Workflow Again'
                : 'Run Workflow'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Split Body: Left Tool Palette + Center GitHub Actions DAG Canvas + Right Inspector */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Sidebar Tool Palette */}
        <aside className="w-64 border-r border-[#D0D7DE] bg-[#F6F8FA]/40 flex flex-col min-h-0 shrink-0 z-10">
          <div className="p-2.5 border-b border-[#D0D7DE] space-y-2 bg-[#F6F8FA]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#656D76]" />
              <input
                type="text"
                placeholder="Add tool node..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="gh-input w-full pl-8"
              />
            </div>
            <select
              aria-label="Filter stages"
              value={stageFilter}
              onChange={(e) =>
                setStageFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
              }
              className="gh-input w-full cursor-pointer"
            >
              <option value="all">All 12 WGS Stages</option>
              {stages.map((st) => (
                <option key={st.id} value={st.id}>
                  Stage {st.id}: {st.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#D0D7DE]/60 bg-white">
            {filteredTools.map((tool) => (
              <div
                key={tool.id}
                className="px-3 py-2 hover:bg-[#F6F8FA] transition-colors flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    {tool.is_gold_standard && (
                      <Star className="w-3 h-3 fill-[#D97706] text-[#D97706] shrink-0" />
                    )}
                    <span className="font-semibold text-xs text-[#1F2328] truncate">
                      {tool.name}
                    </span>
                  </div>
                  <div className="text-[10px] font-mono text-[#656D76] truncate">
                    S{tool.stage_id} · {tool.binary}
                  </div>
                </div>
                <button
                  onClick={() => handleAddToolToCanvas(tool)}
                  className="gh-btn-secondary py-0.5 px-2 text-[11px] shrink-0"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Center GitHub Actions Visual Graph Canvas */}
        <div
          className="flex-1 relative overflow-auto bg-[#F6F8FA]/50 select-none"
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onClick={() => {
            if (connectingSourceId) setConnectingSourceId(null);
          }}
          style={{
            backgroundImage: 'radial-gradient(#D0D7DE 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        >
          {/* SVG Edges */}
          <svg className="absolute inset-0 w-[2000px] h-[1200px] pointer-events-none z-0">
            {edges.map((edge) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const x1 = srcNode.x + 216;
              const y1 = srcNode.y + 38;
              const x2 = tgtNode.x;
              const y2 = tgtNode.y + 38;
              const dx = Math.abs(x2 - x1) * 0.5;
              const d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
              const midX = (x1 + x2) / 2;
              const midY = (y1 + y2) / 2;

              return (
                <g key={edge.id} className="pointer-events-auto group">
                  <path
                    d={d}
                    fill="none"
                    stroke="#8C959F"
                    strokeWidth="2"
                    className="group-hover:stroke-[#1F2328] transition-colors"
                  />
                  <foreignObject
                    x={midX - 44}
                    y={midY - 10}
                    width="88"
                    height="20"
                    className="overflow-visible"
                  >
                    <div className="flex items-center justify-center">
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEdge(edge.id);
                        }}
                        className="bg-white border border-[#D0D7DE] text-[#24292F] group-hover:border-[#CF222E] group-hover:text-[#CF222E] px-1.5 py-0.5 rounded text-[9px] font-mono cursor-pointer flex items-center gap-1"
                        title="Click to remove edge"
                      >
                        {edge.data_format}
                        <X className="w-2.5 h-2.5 hidden group-hover:inline" />
                      </span>
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>

          {/* GitHub Actions Job Node Cards */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const tool = toolMap.get(node.tool_id);

            return (
              <div
                key={node.id}
                style={{ transform: `translate3d(${node.x}px, ${node.y}px, 0)` }}
                className={`absolute w-54 bg-white rounded-md border transition-shadow cursor-move z-10 ${
                  isSelected
                    ? 'border-[#0969DA] ring-2 ring-[#0969DA]/20 shadow-md'
                    : 'border-[#D0D7DE] hover:border-[#8C959F] shadow-2xs'
                }`}
                onMouseDown={(e) => handleNodeMouseDown(node.id, e)}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                }}
              >
                <div className="px-3 py-1.5 border-b border-[#D0D7DE] flex items-center justify-between bg-[#F6F8FA] rounded-t-md">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    {(() => {
                      const isNodeRunning =
                        processState?.toolId === node.tool_id && processState?.status === 'running';
                      const isNodeCompleted =
                        processState?.status === 'completed' ||
                        (processState?.toolId === node.tool_id && processState?.outputFilesVerified);
                      const isNodeFailed =
                        processState?.toolId === node.tool_id && processState?.status === 'failed';
                      const nodeStatus = isNodeRunning
                        ? 'running'
                        : isNodeFailed
                        ? 'failed'
                        : isNodeCompleted
                        ? 'completed'
                        : 'idle';

                      return (
                        <ProcessStatusDot
                          status={nodeStatus}
                          size="sm"
                          showTooltip={true}
                          tooltipText={
                            isNodeRunning
                              ? `WSL2 Running: ${node.label}...`
                              : isNodeCompleted
                              ? `Stage ${node.stage_id} Completed: Output files verified on disk`
                              : isNodeFailed
                              ? `Stage ${node.stage_id} Failed: Non-zero exit code`
                              : `Ready / Configured (Stage ${node.stage_id})`
                          }
                          outputFilesVerified={processState?.outputFilesVerified}
                        />
                      );
                    })()}
                    <span className="text-xs font-semibold text-[#1F2328] truncate">
                      {node.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[#656D76]">S{node.stage_id}</span>
                </div>

                <div className="px-3 py-2 text-[11px] flex items-center justify-between text-[#656D76]">
                  <span className="font-mono truncate">{tool?.binary || node.tool_id}</span>
                  <span className="font-mono text-[10px]">
                    {node.parameters.threads || thermalGuard.max_threads}T
                  </span>
                </div>

                <div className="px-3 py-1 border-t border-[#D0D7DE]/60 flex items-center justify-between bg-white rounded-b-md">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (tool) onInspectToolCode(tool, node.parameters);
                    }}
                    className="text-[10px] text-[#0969DA] hover:underline font-medium cursor-pointer"
                  >
                    Inspect CLI
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedNodeId(node.id);
                      }}
                      className="p-0.5 text-[#656D76] hover:text-[#1F2328] cursor-pointer"
                      title="Configure Node"
                    >
                      <Settings2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteNode(node.id);
                      }}
                      className="p-0.5 text-[#656D76] hover:text-[#CF222E] cursor-pointer"
                      title="Delete Node"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Input Port */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePortClick(node.id, 'target');
                  }}
                  className={`absolute -left-2 top-8 w-4 h-4 rounded-full border bg-white flex items-center justify-center cursor-pointer ${
                    connectingSourceId && connectingSourceId !== node.id
                      ? 'border-[#1A7F37] bg-[#DAFBE1] scale-110'
                      : 'border-[#8C959F] hover:border-[#1F2328]'
                  }`}
                  title="Input Port"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F2328]" />
                </button>

                {/* Output Port */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePortClick(node.id, 'source');
                  }}
                  className={`absolute -right-2 top-8 w-4 h-4 rounded-full border bg-white flex items-center justify-center cursor-pointer ${
                    connectingSourceId === node.id
                      ? 'border-[#0969DA] bg-[#0969DA]'
                      : 'border-[#8C959F] hover:border-[#1F2328]'
                  }`}
                  title="Output Port"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1F2328]" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Right Collapsible Node Inspector Drawer */}
        {selectedNode && (
          <aside className="w-72 bg-white border-l border-[#D0D7DE] flex flex-col shrink-0 z-20">
            <div className="gh-box-header">
              <div>
                <h3 className="font-semibold text-xs text-[#1F2328]">{selectedNode.label}</h3>
                <p className="text-[10px] text-[#656D76] font-mono">
                  Stage {selectedNode.stage_id} Node Config
                </p>
              </div>
              <button
                onClick={() => setSelectedNodeId(null)}
                className="text-[#656D76] hover:text-[#1F2328] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#1F2328] mb-1">
                  CPU Threads (Max: {thermalGuard.max_threads})
                </label>
                <input
                  type="number"
                  min="1"
                  max={thermalGuard.max_threads}
                  value={selectedNode.parameters.threads || thermalGuard.max_threads}
                  onChange={(e) => handleParamChange('threads', parseInt(e.target.value) || 1)}
                  className="gh-input w-full"
                />
              </div>

              {selectedToolDef?.parameters?.map((param) => (
                <div key={param.id} className="space-y-1">
                  <label className="block text-[11px] font-semibold text-[#1F2328]">
                    {param.label}{' '}
                    <span className="text-[#656D76] font-mono text-[10px]">({param.flag})</span>
                  </label>
                  {param.type === 'select' && param.options ? (
                    <select
                      value={selectedNode.parameters[param.id] ?? param.default}
                      onChange={(e) => handleParamChange(param.id, e.target.value)}
                      className="gh-input w-full"
                    >
                      {param.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  ) : param.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={!!(selectedNode.parameters[param.id] ?? param.default)}
                        onChange={(e) => handleParamChange(param.id, e.target.checked)}
                        className="rounded border-[#D0D7DE]"
                      />
                      <span className="text-[11px] text-[#656D76]">{param.description}</span>
                    </label>
                  ) : (
                    <input
                      type="text"
                      value={selectedNode.parameters[param.id] ?? param.default ?? ''}
                      onChange={(e) => handleParamChange(param.id, e.target.value)}
                      className="gh-input w-full"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-[11px] font-semibold text-[#1F2328] mb-1">
                  Custom CLI Flags
                </label>
                <input
                  type="text"
                  placeholder="e.g. --min-len 50"
                  value={selectedNode.custom_flags || ''}
                  onChange={(e) =>
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNodeId ? { ...n, custom_flags: e.target.value } : n
                      )
                    )
                  }
                  className="gh-input w-full font-mono"
                />
              </div>

              <div className="pt-2 border-t border-[#D0D7DE]">
                <button
                  onClick={() => {
                    if (selectedToolDef) onInspectToolCode(selectedToolDef, selectedNode.parameters);
                  }}
                  className="gh-btn-secondary w-full"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Inspect Tool CLI</span>
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Export Bash & Nextflow Modal */}
      {showScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="gh-box w-full max-w-4xl max-h-[85vh] flex flex-col shadow-xl">
            <div className="gh-box-header">
              <div className="flex items-center gap-3">
                <h2 className="text-xs font-semibold text-[#1F2328]">
                  Compiled Workflow Scripts
                </h2>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setScriptModalTab('bash')}
                    className={
                      scriptModalTab === 'bash' ? 'gh-btn-primary py-0.5' : 'gh-btn-secondary py-0.5'
                    }
                  >
                    master_pipeline.sh
                  </button>
                  <button
                    onClick={() => setScriptModalTab('nextflow')}
                    className={
                      scriptModalTab === 'nextflow'
                        ? 'gh-btn-primary py-0.5'
                        : 'gh-btn-secondary py-0.5'
                    }
                  >
                    main.nf (Nextflow DSL2)
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowScriptModal(false)}
                className="text-[#656D76] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 bg-[#0D1117] font-mono text-xs text-[#E6EDF3]">
              <pre className="whitespace-pre overflow-x-auto leading-relaxed">
                {scriptModalTab === 'bash' ? compiledBashScript : compiledNextflowScript}
              </pre>
            </div>

            <div className="gh-box-header border-t border-b-0 border-[#D0D7DE]">
              <span className="text-xs text-[#656D76] font-mono">
                {scriptModalTab === 'bash' ? 'master_pipeline.sh' : 'main.nf'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    copyToClipboard(
                      scriptModalTab === 'bash' ? compiledBashScript : compiledNextflowScript
                    )
                  }
                  className="gh-btn-secondary"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-[#1A7F37]" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
                <button
                  onClick={() =>
                    downloadFile(
                      scriptModalTab === 'bash' ? 'master_pipeline.sh' : 'main.nf',
                      scriptModalTab === 'bash' ? compiledBashScript : compiledNextflowScript
                    )
                  }
                  className="gh-btn-primary"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Run Workflow Confirmation Modal */}
      {showRunModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="gh-box w-full max-w-md shadow-xl">
            <div className="gh-box-header">
              <h2 className="text-xs font-semibold text-[#1F2328]">Run Workflow Pipeline</h2>
              <button
                onClick={() => setShowRunModal(false)}
                className="text-[#656D76] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-white">
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">Workflow Run Name</label>
                <input
                  type="text"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="gh-input w-full"
                />
              </div>

              <div className="bg-[#F6F8FA] border border-[#D0D7DE] rounded-md p-3 space-y-1 text-[#656D76]">
                <div className="flex justify-between">
                  <span>Active Nodes:</span>
                  <span className="font-semibold text-[#1F2328]">{nodes.length} Stages</span>
                </div>
                <div className="flex justify-between">
                  <span>Hardware Cap:</span>
                  <span className="font-mono text-[#1F2328]">
                    {thermalGuard.max_threads} Threads / {thermalGuard.max_ram_gb} GB
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    onRunWorkflow(workflowName, nodes, edges, 'wsl_real');
                    setShowRunModal(false);
                  }}
                  className="gh-btn-primary w-full py-1.5"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute in WSL2 Ubuntu</span>
                </button>
                <button
                  onClick={() => {
                    onRunWorkflow(workflowName, nodes, edges, 'fast_simulation');
                    setShowRunModal(false);
                  }}
                  className="gh-btn-secondary w-full py-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-[#D97706]" />
                  <span>Fast Simulation Run</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineStudioView;
