import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldAlert,
  GitBranch,
  Layers,
  Grid,
  Dna,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Code2,
  X,
  Palette,
  Sliders,
  Type,
  Maximize2,
  CheckCircle2,
} from 'lucide-react';
import {
  ResultsSummary,
  Project,
  PhylogenyLeafMetadata,
  VisualizationCustomization,
} from '../types/genome';
import {
  generatePythonVisualization,
  generateRVisualization,
  fetchVisualizationsMetrics,
  VisualizationResponse,
} from '../services/api';

interface GenomicsVisualizerViewProps {
  summary: ResultsSummary;
  activeProject: Project;
}

const getCountryColor = (c: string) =>
  c.includes('Bangladesh') ? '#0D9488' : c.includes('India') ? '#F59E0B' : c.includes('Nepal') ? '#8B5CF6' : '#3B82F6';

const getHostColor = (h: string) => {
  const s = h.toLowerCase();
  return s.includes('poultry') ? '#F97316' : s.includes('bovine') ? '#10B981' : s.includes('swine') ? '#EC4899' : '#6366F1';
};

type StudioTab = 'r_python' | 'resistome' | 'phylogeny' | 'pangenome' | 'fastani' | 'assembly' | 'scripts';

export const GenomicsVisualizerView: React.FC<GenomicsVisualizerViewProps> = ({
  summary,
  activeProject,
}) => {
  const [tab, setTab] = useState<StudioTab>('r_python');

  // Visualization Engine & Target Selection
  const [vizEngine, setVizEngine] = useState<'python' | 'r'>('python');
  const [vizPlotType, setVizPlotType] = useState<string>('fastp_qc');
  const [selectedSampleId, setSelectedSampleId] = useState<string>('all');

  // Visualization Studio Customization State
  const [showStudioControls, setShowStudioControls] = useState<boolean>(true);
  const [chartGeometry, setChartGeometry] = useState<string>('auto');
  const [colorPalette, setColorPalette] = useState<string>('primer_light');
  const [primaryColor, setPrimaryColor] = useState<string>('#0969DA');
  const [secondaryColor, setSecondaryColor] = useState<string>('#1A7F37');
  const [hatchPattern, setHatchPattern] = useState<string>('none');
  const [lineStyle, setLineStyle] = useState<string>('solid');
  const [markerStyle, setMarkerStyle] = useState<string>('o');
  const [canvasTheme, setCanvasTheme] = useState<string>('github_primer');
  const [fontFamily, setFontFamily] = useState<string>('sans-serif');
  const [fontSize, setFontSize] = useState<number>(9);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showValues, setShowValues] = useState<boolean>(true);
  const [legendPos, setLegendPos] = useState<string>('best');
  const [exportDpi, setExportDpi] = useState<number>(140);
  const [customTitle, setCustomTitle] = useState<string>('');

  const [vizData, setVizData] = useState<VisualizationResponse | null>(null);
  const [liveMetrics, setLiveMetrics] = useState<Record<string, any> | null>(null);
  const [isGeneratingViz, setIsGeneratingViz] = useState<boolean>(false);
  const [showCodeDrawer, setShowCodeDrawer] = useState<boolean>(false);

  // Filtering & Interactivity for Tabs 2-7
  const [search, setSearch] = useState('');
  const [fCountry, setFCountry] = useState('all');
  const [fHost, setFHost] = useState('all');
  const [fMdr, setFMdr] = useState<'all' | 'mdr' | 'susc'>('all');

  const [treeMode, setTreeMode] = useState<'rectangular' | 'circular'>('rectangular');
  const [propBranches, setPropBranches] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [hoverLeaf, setHoverLeaf] = useState<PhylogenyLeafMetadata | null>(null);
  const [aniHover, setAniHover] = useState<{ q: string; r: string; val: number } | null>(null);
  const [qcSort, setQcSort] = useState<'n50' | 'contigs' | 'genome_size_bp'>('n50');
  const [activeScript, setActiveScript] = useState<
    'r_ggtree' | 'python_seaborn' | 'itol_colorstrip' | 'itol_binary' | 'publication_methods'
  >('r_ggtree');
  const [copied, setCopied] = useState(false);

  // Current project samples
  const projectSamples = useMemo(() => activeProject?.samples || [], [activeProject]);

  // Synchronize target sample on project switch
  useEffect(() => {
    setSelectedSampleId('all');
  }, [activeProject?.id]);

  const runLiveVisualization = async (
    engine: 'python' | 'r' = vizEngine,
    plotType: string = vizPlotType,
    sampleId: string = selectedSampleId
  ) => {
    setIsGeneratingViz(true);
    try {
      const projId = activeProject?.id || 'proj_salmonella_50';
      const actualSampleId = sampleId !== 'all' ? sampleId : (projectSamples[0]?.id || undefined);

      const customPayload: VisualizationCustomization = {
        chart_type: chartGeometry,
        palette: colorPalette,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        hatch_pattern: hatchPattern,
        line_style: lineStyle,
        marker_style: markerStyle,
        theme: canvasTheme,
        font_family: fontFamily,
        font_size: fontSize,
        show_grid: showGrid,
        show_values: showValues,
        legend_pos: legendPos,
        dpi: exportDpi,
        custom_title: customTitle.trim() || undefined,
      };

      const [res, met] = await Promise.all([
        engine === 'python'
          ? generatePythonVisualization({
              plot_type: plotType,
              project_id: projId,
              sample_id: actualSampleId,
              customization: customPayload as Record<string, any>,
            })
          : generateRVisualization({
              plot_type: plotType,
              project_id: projId,
              sample_id: actualSampleId,
              customization: customPayload as Record<string, any>,
            }),
        fetchVisualizationsMetrics(projId, actualSampleId),
      ]);
      setVizData(res);
      setLiveMetrics(met);
    } catch {
      // ignore network fallback
    } finally {
      setIsGeneratingViz(false);
    }
  };

  useEffect(() => {
    runLiveVisualization(vizEngine, vizPlotType, selectedSampleId);
  }, [
    activeProject?.id,
    vizEngine,
    vizPlotType,
    selectedSampleId,
    chartGeometry,
    colorPalette,
    primaryColor,
    secondaryColor,
    hatchPattern,
    lineStyle,
    markerStyle,
    canvasTheme,
    fontFamily,
    fontSize,
    showGrid,
    showValues,
    legendPos,
    exportDpi,
  ]);

  const countries = useMemo(
    () => Array.from(new Set(summary.amr_matrix.map((r) => r.country).filter(Boolean))),
    [summary]
  );
  const hosts = useMemo(
    () => Array.from(new Set(summary.amr_matrix.map((r) => r.host).filter(Boolean))),
    [summary]
  );

  const filteredMatrix = useMemo(
    () =>
      summary.amr_matrix.filter((row) => {
        const mSearch = row.sample_id.toLowerCase().includes(search.toLowerCase());
        const mC = fCountry === 'all' || row.country === fCountry;
        const mH = fHost === 'all' || row.host === fHost;
        const mM = fMdr === 'all' || (fMdr === 'mdr' ? row.mdr : !row.mdr);
        return mSearch && mC && mH && mM;
      }),
    [summary, search, fCountry, fHost, fMdr]
  );

  const sortedQc = useMemo(() => {
    return [...summary.assembly_qc].sort((a, b) =>
      qcSort === 'contigs' ? a.contigs - b.contigs : b[qcSort] - a[qcSort]
    );
  }, [summary, qcSort]);

  // Dynamic Resistome and Plasmid Headers
  const amrGenesHeader = useMemo(() => {
    if (summary.amr_genes_list && summary.amr_genes_list.length > 0) {
      return summary.amr_genes_list.slice(0, 8).map((g) => g.gene);
    }
    return ["aac(6')-Iaa", "tet(A)", "sul1", "qnrS1", "fosA7", "floR", "blaTEM-1B", "blaCTX-M-15"];
  }, [summary]);

  const plasmidHeader = useMemo(() => {
    if (summary.plasmid_summary && summary.plasmid_summary.length > 0) {
      return summary.plasmid_summary.slice(0, 4).map((p) => p.replicon);
    }
    return ["IncX1", "IncX2", "IncFII(S)"];
  }, [summary]);

  // Dynamic Pan-Genome Percentages
  const pangenomePercentages = useMemo(() => {
    const total = summary.pangenome_stats.total_clusters || 1;
    return {
      core: ((summary.pangenome_stats.core_genes / total) * 100).toFixed(1),
      soft: ((summary.pangenome_stats.soft_core_genes / total) * 100).toFixed(1),
      shell: ((summary.pangenome_stats.shell_genes / total) * 100).toFixed(1),
      cloud: ((summary.pangenome_stats.cloud_genes / total) * 100).toFixed(1),
    };
  }, [summary]);

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const downloadBlob = (name: string, content: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
    link.download = name;
    link.click();
  };

  const navTabs: { id: StudioTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'r_python', label: 'R & Python Visual Studio', icon: Sparkles },
    { id: 'resistome', label: 'Resistome Matrix', icon: ShieldAlert },
    { id: 'phylogeny', label: 'Phylogenetic Tree', icon: GitBranch },
    { id: 'pangenome', label: 'Pan-Genome', icon: Layers },
    { id: 'fastani', label: 'FastANI Matrix', icon: Grid },
    { id: 'assembly', label: 'QUAST & Virulome', icon: Dna },
    { id: 'scripts', label: 'Scripts & iTOL', icon: FileCode },
  ];

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0 overflow-hidden gap-3">
      {/* Left Sidebar: Navigation & Project-Scoped Biological Metrics */}
      <aside className="w-full lg:w-64 flex flex-col gap-3 min-h-0 shrink-0">
        {/* Insights Menu Box */}
        <div className="gh-box shrink-0">
          <div className="gh-box-header">
            <span className="text-xs font-semibold text-[#1F2328]">Repository Insights</span>
          </div>
          <div className="divide-y divide-[#D0D7DE]/60 bg-white">
            {navTabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors border-l-2 cursor-pointer ${
                    active
                      ? 'border-l-[#FD8C73] bg-[#F6F8FA] font-semibold text-[#1F2328]'
                      : 'border-l-transparent text-[#656D76] hover:bg-[#F6F8FA]/60 hover:text-[#1F2328]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Project/Sample Biological Metrics Sidebar Box */}
        <div className="gh-box flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="gh-box-header shrink-0">
            <span className="text-xs font-semibold text-[#1F2328]">Biological Profile</span>
            <span className="gh-badge font-mono text-[10px] py-0">
              {liveMetrics?.sample_id || projectSamples[0]?.id || 'Isolate'}
            </span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 text-xs bg-white">
            <div className="space-y-1 pb-2 border-b border-[#D0D7DE]/60">
              <div className="text-[10px] font-semibold uppercase text-[#656D76]">Organism & Reference</div>
              <div className="font-semibold text-[#1F2328] truncate" title={liveMetrics?.organism}>
                {liveMetrics?.organism || activeProject?.organism || 'Bacterial Isolate'}
              </div>
              <div className="text-[11px] text-[#656D76] font-mono truncate" title={liveMetrics?.variant_metrics?.reference_genome}>
                {liveMetrics?.variant_metrics?.reference_genome || 'NC_000915.1'}
              </div>
            </div>

            <div className="space-y-1 pb-2 border-b border-[#D0D7DE]/60">
              <div className="text-[10px] font-semibold uppercase text-[#656D76]">Read QC (fastp)</div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">Passed Reads:</span>
                <span className="font-mono font-semibold text-[#1F2328]">
                  {(liveMetrics?.qc_metrics?.total_reads_after || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">Q30 Retention:</span>
                <span className="font-mono font-semibold text-[#1A7F37]">
                  {((liveMetrics?.qc_metrics?.q30_rate_after || 0.95) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">GC Content:</span>
                <span className="font-mono text-[#1F2328]">
                  {liveMetrics?.qc_metrics?.gc_percent ?? liveMetrics?.assembly_metrics?.gc_percent ?? 50.8}%
                </span>
              </div>
            </div>

            <div className="space-y-1 pb-2 border-b border-[#D0D7DE]/60">
              <div className="text-[10px] font-semibold uppercase text-[#656D76]">Assembly & Annotation</div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">Genome Size:</span>
                <span className="font-mono font-semibold text-[#1F2328]">
                  {(liveMetrics?.assembly_metrics?.total_length_bp || 0).toLocaleString()} bp
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">N50 / Contigs:</span>
                <span className="font-mono text-[#1F2328]">
                  {(liveMetrics?.assembly_metrics?.n50_bp || 0).toLocaleString()} bp ({liveMetrics?.assembly_metrics?.contigs_count || 1})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">CDS / tRNA:</span>
                <span className="font-mono text-[#1F2328]">
                  {liveMetrics?.annotation_metrics?.cds_count || 0} / {liveMetrics?.annotation_metrics?.trna_count || 0}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase text-[#656D76]">Typing & Resistome</div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">MLST Sequence Type:</span>
                <span className="font-mono font-semibold text-[#0969DA]">
                  {liveMetrics?.amr_typing?.st || 'ST-Pending'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">AMR Genes:</span>
                <span className="font-mono text-[#1F2328]">
                  {liveMetrics?.amr_typing?.amr_genes?.length || 0} detected
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#656D76]">Virulence Factors:</span>
                <span className="font-mono text-[#1F2328]">
                  {liveMetrics?.amr_typing?.virulence?.length || 0} markers
                </span>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right Main Content Box */}
      <section className="flex-1 gh-box flex flex-col min-h-0 overflow-hidden bg-white">
        {/* TAB 1: R & PYTHON CUSTOMIZABLE VISUAL STUDIO */}
        {tab === 'r_python' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            {/* Primary Control Header */}
            <div className="gh-box-header flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Target Sample Selector */}
                <select
                  value={selectedSampleId}
                  onChange={(e) => setSelectedSampleId(e.target.value)}
                  aria-label="Target Isolate Sample Selector"
                  className="gh-input py-1 font-semibold text-[#1F2328] bg-white cursor-pointer max-w-[200px]"
                >
                  <option value="all">Cohort: All Isolates</option>
                  {projectSamples.map((s) => (
                    <option key={s.id} value={s.id}>
                      Isolate: {s.name || s.id}
                    </option>
                  ))}
                </select>

                {/* Engine Selector */}
                <select
                  value={vizEngine}
                  onChange={(e) => {
                    const nextEng = e.target.value as 'python' | 'r';
                    setVizEngine(nextEng);
                    setVizPlotType(nextEng === 'python' ? 'fastp_qc' : 'contig_lengths');
                  }}
                  aria-label="Visualization Engine Selector"
                  className="gh-input py-1 font-medium cursor-pointer"
                >
                  <option value="python">Engine: Python 3 (Matplotlib / Seaborn)</option>
                  <option value="r">Engine: R Statistical (ggplot2)</option>
                </select>

                {/* Plot Type Selector */}
                <select
                  value={vizPlotType}
                  onChange={(e) => setVizPlotType(e.target.value)}
                  aria-label="Visualization Plot Type Selector"
                  className="gh-input py-1 font-medium cursor-pointer max-w-[280px]"
                >
                  {vizEngine === 'python' ? (
                    <>
                      <option value="fastp_qc">Plot: Phred Quality Scores & fastp Filtering</option>
                      <option value="coverage_depth">Plot: Alignment Coverage Depth & Contig Nx</option>
                      <option value="variant_dist">Plot: Chromosomal Variant Density & Ti/Tv</option>
                      <option value="read_length_gc">Plot: Read Length & GC% Distribution Curve</option>
                      <option value="assembly_comparison">Plot: Contig Size Distribution & QUAST Metrics</option>
                      <option value="annotation_breakdown">Plot: Genomic Feature Distribution (CDS/tRNA/rRNA)</option>
                      <option value="amr_virulence_bar">Plot: Acquired Resistome & Virulence Factors</option>
                      <option value="ani_clustermap">Plot: Pairwise Average Nucleotide Identity (ANI)</option>
                    </>
                  ) : (
                    <>
                      <option value="contig_lengths">Plot: ggplot2 Contig Length & Read Depth</option>
                      <option value="amr_matrix">Plot: ggplot2 AMR Resistome & Plasmid Heatmap</option>
                      <option value="pangenome_pie">Plot: ggplot2 Pan-Genome Allocation</option>
                      <option value="phylogeny_tree">Plot: ggtree Core-Genome SNP Phylogeny</option>
                    </>
                  )}
                </select>

                {/* Toggle Studio Customizer */}
                <button
                  onClick={() => setShowStudioControls(!showStudioControls)}
                  className={`gh-btn-secondary ${showStudioControls ? 'bg-[#F6F8FA] border-[#0969DA] text-[#0969DA]' : ''}`}
                  title="Toggle Graph Styling, Palettes & Geometry Options"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#0969DA]" />
                  <span>Customize</span>
                </button>

                {/* Regenerate */}
                <button
                  onClick={() => runLiveVisualization(vizEngine, vizPlotType, selectedSampleId)}
                  disabled={isGeneratingViz}
                  className="gh-btn-secondary"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingViz ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingViz ? 'Rendering...' : 'Regenerate'}</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button onClick={() => setShowCodeDrawer(true)} className="gh-btn-secondary">
                  <Code2 className="w-3.5 h-3.5 text-[#656D76]" />
                  <span>View Script</span>
                </button>
                {vizData?.image_data && vizData.format === 'png_base64' && (
                  <a
                    href={vizData.image_data}
                    download={`GenomeLab_${activeProject.id}_${vizPlotType}_${selectedSampleId}.png`}
                    className="gh-btn-primary"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download PNG</span>
                  </a>
                )}
              </div>
            </div>

            {/* Collapsible Visualization Customization Studio Toolbar */}
            {showStudioControls && (
              <div className="bg-[#F6F8FA] border-b border-[#D0D7DE] px-3 py-2 text-xs flex flex-wrap items-center gap-3 shrink-0">
                {/* Geometry */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Geometry:</span>
                  <select
                    value={chartGeometry}
                    onChange={(e) => setChartGeometry(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="auto">Auto / Default</option>
                    <option value="bar">Bar (Vertical)</option>
                    <option value="horizontal_bar">Bar (Horizontal)</option>
                    <option value="line">Line Curve</option>
                    <option value="area">Area Shaded</option>
                    <option value="scatter">Scatter Points</option>
                    <option value="step">Step Curve</option>
                    <option value="pie">Proportional Pie</option>
                    <option value="donut">Hollow Donut</option>
                  </select>
                </div>

                {/* Color Palette */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Palette:</span>
                  <select
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white font-medium"
                  >
                    <option value="primer_light">GitHub Primer</option>
                    <option value="npg">Nature (NPG)</option>
                    <option value="lancet">Lancet Oncology</option>
                    <option value="nejm">NEJM Clinical</option>
                    <option value="okabe_ito">Okabe-Ito (Colorblind)</option>
                    <option value="viridis">Viridis</option>
                    <option value="plasma">Plasma</option>
                    <option value="inferno">Inferno</option>
                    <option value="magma">Magma</option>
                    <option value="cividis">Cividis</option>
                    <option value="dark">Cyber Dark</option>
                    <option value="coolwarm">CoolWarm</option>
                  </select>
                </div>

                {/* Custom Hex Color Pickers */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Colors:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      title="Primary Element Color"
                      className="w-5 h-5 rounded cursor-pointer border border-[#D0D7DE] p-0"
                    />
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      title="Secondary Accent Color"
                      className="w-5 h-5 rounded cursor-pointer border border-[#D0D7DE] p-0"
                    />
                  </div>
                </div>

                {/* Hatch / Pattern */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Hatch:</span>
                  <select
                    value={hatchPattern}
                    onChange={(e) => setHatchPattern(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="none">Solid (None)</option>
                    <option value="/">Diagonal (/)</option>
                    <option value="\">Backslash (\)</option>
                    <option value="|">Vertical (|)</option>
                    <option value="-">Horizontal (-)</option>
                    <option value="+">Cross (+)</option>
                    <option value="x">Crosshatch (x)</option>
                    <option value=".">Stippled Dots (.)</option>
                    <option value="*">Stars (*)</option>
                  </select>
                </div>

                {/* Theme */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Theme:</span>
                  <select
                    value={canvasTheme}
                    onChange={(e) => setCanvasTheme(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="github_primer">GitHub Primer Light</option>
                    <option value="ggplot2">R ggplot2 (Grey95)</option>
                    <option value="minimal">Minimal White</option>
                    <option value="dark">Dark Canvas</option>
                    <option value="classic">Classic Academic</option>
                  </select>
                </div>

                {/* Line & Marker Style */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Line / Marker:</span>
                  <select
                    value={lineStyle}
                    onChange={(e) => setLineStyle(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="solid">Solid Line</option>
                    <option value="dashed">Dashed Line</option>
                    <option value="dotted">Dotted Line</option>
                    <option value="dashdot">Dash-Dot</option>
                  </select>
                  <select
                    value={markerStyle}
                    onChange={(e) => setMarkerStyle(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="o">Circle (o)</option>
                    <option value="s">Square (s)</option>
                    <option value="^">Triangle (^)</option>
                    <option value="D">Diamond (D)</option>
                    <option value="*">Star (*)</option>
                    <option value="none">No Markers</option>
                  </select>
                </div>

                {/* Typography & DPI */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[#656D76] font-medium">Font / DPI:</span>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value="sans-serif">Sans-Serif</option>
                    <option value="monospace">Monospace</option>
                    <option value="serif">Serif (Paper)</option>
                  </select>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value={8}>8 pt</option>
                    <option value={9}>9 pt</option>
                    <option value={10}>10 pt</option>
                    <option value={11}>11 pt</option>
                    <option value={12}>12 pt</option>
                  </select>
                  <select
                    value={exportDpi}
                    onChange={(e) => setExportDpi(Number(e.target.value))}
                    className="gh-input py-0.5 text-xs bg-white"
                  >
                    <option value={140}>140 DPI</option>
                    <option value={200}>200 DPI (HD)</option>
                    <option value={300}>300 DPI (Print)</option>
                  </select>
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-3 ml-auto">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => setShowGrid(e.target.checked)}
                      className="rounded border-[#D0D7DE] text-[#0969DA]"
                    />
                    <span className="text-[#656D76]">Grid</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showValues}
                      onChange={(e) => setShowValues(e.target.checked)}
                      className="rounded border-[#D0D7DE] text-[#0969DA]"
                    />
                    <span className="text-[#656D76]">Values</span>
                  </label>
                </div>
              </div>
            )}

            {/* Figure Display Area */}
            <div className="flex-1 min-h-0 p-4 flex flex-col items-center justify-center overflow-auto bg-white">
              {vizData ? (
                <div className="w-full h-full flex flex-col items-center justify-between">
                  <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-[#D0D7DE]/60 shrink-0">
                    <div className="flex items-center gap-2 truncate">
                      <span className="text-xs font-semibold text-[#1F2328] truncate">{vizData.title}</span>
                      {selectedSampleId !== 'all' && (
                        <span className="gh-badge font-mono text-[10px] text-[#0969DA] bg-[#DDF4FF]">
                          Isolate: {selectedSampleId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="gh-badge font-mono">{vizData.engine}</span>
                      <span className="gh-badge text-[10px]">{exportDpi} DPI</span>
                    </div>
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center w-full overflow-hidden">
                    {vizData.format === 'png_base64' ? (
                      <img
                        src={vizData.image_data}
                        alt={vizData.title}
                        className="max-h-full max-w-full object-contain rounded border border-[#D0D7DE] shadow-xs"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center"
                        dangerouslySetInnerHTML={{ __html: vizData.image_data }}
                      />
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-[#656D76] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-[#0969DA]" />
                  <span>Rendering publication figure with selected options...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: RESISTOME MATRIX */}
        {tab === 'resistome' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header flex-wrap gap-2 shrink-0">
              <div className="relative flex-1 max-w-xs min-w-[180px]">
                <Search className="w-3.5 h-3.5 text-[#656D76] absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter isolates by ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="gh-input w-full pl-8"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <select
                  value={fCountry}
                  onChange={(e) => setFCountry(e.target.value)}
                  className="gh-input py-1"
                >
                  <option value="all">All Countries</option>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <select
                  value={fHost}
                  onChange={(e) => setFHost(e.target.value)}
                  className="gh-input py-1"
                >
                  <option value="all">All Hosts</option>
                  {hosts.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
                <select
                  value={fMdr}
                  onChange={(e) => setFMdr(e.target.value as any)}
                  className="gh-input py-1"
                >
                  <option value="all">All Profiles</option>
                  <option value="mdr">MDR Only</option>
                  <option value="susc">Susceptible Only</option>
                </select>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 z-20 bg-[#F6F8FA] border-b border-[#D0D7DE] text-[#656D76]">
                  <tr>
                    <th className="py-2 px-3 font-semibold sticky left-0 bg-[#F6F8FA] z-20">
                      Isolate ID
                    </th>
                    <th className="py-2 px-3 font-semibold">Origin</th>
                    <th className="py-2 px-3 font-semibold">Host</th>
                    <th className="py-2 px-3 font-semibold">ST</th>
                    <th className="py-2 px-3 font-semibold">MDR</th>
                    {amrGenesHeader.map((g) => (
                      <th
                        key={g}
                        className="p-2 font-mono text-[10px] text-center border-l border-[#D0D7DE]"
                      >
                        {g}
                      </th>
                    ))}
                    {plasmidHeader.map((p) => (
                      <th
                        key={p}
                        className="p-2 font-mono text-[10px] text-center border-l border-[#D0D7DE] bg-[#FBEFFF] text-[#8250DF]"
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0D7DE]/60">
                  {filteredMatrix.map((row) => (
                    <tr key={row.sample_id} className="hover:bg-[#F6F8FA] transition-colors">
                      <td className="py-2 px-3 font-mono font-semibold text-[#1F2328] sticky left-0 bg-white z-10 border-r border-[#D0D7DE]/60">
                        {row.sample_id}
                      </td>
                      <td className="py-2 px-3">{row.country || 'Local Lab'}</td>
                      <td className="py-2 px-3">{row.host || 'Isolate'}</td>
                      <td className="py-2 px-3 font-mono text-[#656D76]">{row.st || 'ST-ND'}</td>
                      <td className="py-2 px-3">
                        {row.mdr ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFEBE9] text-[#CF222E]">
                            MDR
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-[#EFF1F3] text-[#656D76]">
                            Susc
                          </span>
                        )}
                      </td>
                      {amrGenesHeader.map((g) => {
                        const id = row.genes[g] ?? 0;
                        return (
                          <td key={g} className="p-2 text-center border-l border-[#D0D7DE]/40">
                            {id > 0 ? (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#DAFBE1] text-[#1A7F37]">
                                {id}%
                              </span>
                            ) : (
                              <span className="text-[#8C959F] font-mono">-</span>
                            )}
                          </td>
                        );
                      })}
                      {plasmidHeader.map((p) => (
                        <td key={p} className="p-2 text-center border-l border-[#D0D7DE]/40">
                          {row.plasmids.includes(p) ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FBEFFF] text-[#8250DF]">
                              Pos
                            </span>
                          ) : (
                            <span className="text-[#8C959F] font-mono">-</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: PHYLOGENY TREE */}
        {tab === 'phylogeny' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header flex-wrap gap-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setTreeMode('rectangular')}
                  className={
                    treeMode === 'rectangular' ? 'gh-btn-primary py-0.5' : 'gh-btn-secondary py-0.5'
                  }
                >
                  Rectangular
                </button>
                <button
                  onClick={() => setTreeMode('circular')}
                  className={
                    treeMode === 'circular' ? 'gh-btn-primary py-0.5' : 'gh-btn-secondary py-0.5'
                  }
                >
                  Circular Radial
                </button>
                <button
                  onClick={() => setPropBranches(!propBranches)}
                  className="gh-btn-secondary py-0.5"
                >
                  {propBranches ? 'Proportional' : 'Cladogram'}
                </button>
              </div>
              <div className="flex items-center gap-3 text-xs text-[#656D76]">
                <span>
                  Core SNPs:{' '}
                  <strong className="font-mono text-[#1F2328]">
                    {summary.phylogeny.core_snps.toLocaleString()}
                  </strong>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
                    className="gh-btn-secondary p-1"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-mono px-1.5">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
                    className="gh-btn-secondary p-1"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setZoom(1)} className="gh-btn-secondary p-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 p-4 overflow-auto relative bg-white">
              <svg
                width={treeMode === 'rectangular' ? 950 * zoom : 650 * zoom}
                height={
                  treeMode === 'rectangular'
                    ? Math.max(460, summary.phylogeny.leaves.length * 26 + 30) * zoom
                    : 650 * zoom
                }
                viewBox={
                  treeMode === 'rectangular'
                    ? `0 0 950 ${Math.max(460, summary.phylogeny.leaves.length * 26 + 30)}`
                    : '0 0 650 650'
                }
                className="mx-auto"
              >
                {treeMode === 'rectangular' ? (
                  <g transform="translate(20, 15)">
                    {summary.phylogeny.leaves.map((leaf, idx) => {
                      const y = idx * 26 + 12;
                      const bw = propBranches
                        ? Math.max(120, Math.min(300, leaf.branch_length * 24000 + 150))
                        : 200;
                      return (
                        <g
                          key={leaf.id}
                          className="cursor-pointer group"
                          onMouseEnter={() => setHoverLeaf(leaf)}
                          onMouseLeave={() => setHoverLeaf(null)}
                        >
                          <path
                            d={`M 0 12 L 35 12 L 35 ${y} L ${bw} ${y}`}
                            fill="none"
                            stroke="#656D76"
                            strokeWidth="1.5"
                          />
                          <circle
                            cx={bw}
                            cy={y}
                            r="3.5"
                            fill={leaf.mdr ? '#CF222E' : '#1A7F37'}
                          />
                          <text
                            x={bw + 10}
                            y={y + 4}
                            className="text-[11px] font-mono fill-[#1F2328] group-hover:font-bold"
                          >
                            {leaf.id}
                          </text>
                          <g transform={`translate(${bw + 140}, ${y - 8})`}>
                            <rect
                              width="65"
                              height="16"
                              rx="3"
                              fill={getCountryColor(leaf.country)}
                              fillOpacity="0.15"
                            />
                            <text
                              x="32"
                              y="11"
                              textAnchor="middle"
                              className="text-[9px] font-bold"
                              fill={getCountryColor(leaf.country)}
                            >
                              {leaf.country.slice(0, 9)}
                            </text>
                            <g transform="translate(70, 0)">
                              <rect
                                width="70"
                                height="16"
                                rx="3"
                                fill={getHostColor(leaf.host)}
                                fillOpacity="0.15"
                              />
                              <text
                                x="35"
                                y="11"
                                textAnchor="middle"
                                className="text-[9px] font-bold"
                                fill={getHostColor(leaf.host)}
                              >
                                {leaf.host.slice(0, 10)}
                              </text>
                            </g>
                            <g transform="translate(145, 0)">
                              <rect
                                width="45"
                                height="16"
                                rx="3"
                                fill="#F6F8FA"
                                stroke="#D0D7DE"
                              />
                              <text
                                x="22"
                                y="11"
                                textAnchor="middle"
                                className="text-[9px] font-mono fill-[#24292F]"
                              >
                                {leaf.st}
                              </text>
                            </g>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                ) : (
                  <g transform="translate(325, 325)">
                    <circle r="85" fill="none" stroke="#EAEEF2" strokeWidth="1" />
                    <circle r="145" fill="none" stroke="#EAEEF2" strokeWidth="1" />
                    <circle r="200" fill="none" stroke="#EAEEF2" strokeWidth="1" />
                    {summary.phylogeny.leaves.map((leaf, idx) => {
                      const ang =
                        (idx / summary.phylogeny.leaves.length) * 2 * Math.PI - Math.PI / 2;
                      const rad = propBranches ? 140 + leaf.branch_length * 7500 : 170;
                      const x = rad * Math.cos(ang);
                      const y = rad * Math.sin(ang);
                      const deg = (ang * 180) / Math.PI;
                      return (
                        <g
                          key={leaf.id}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoverLeaf(leaf)}
                          onMouseLeave={() => setHoverLeaf(null)}
                        >
                          <line x1="0" y1="0" x2={x} y2={y} stroke="#8C959F" strokeWidth="1.2" />
                          <circle
                            cx={x}
                            cy={y}
                            r="3.5"
                            fill={leaf.mdr ? '#CF222E' : '#1A7F37'}
                          />
                          <g
                            transform={`translate(${x}, ${y}) rotate(${
                              deg > 90 || deg < -90 ? deg + 180 : deg
                            })`}
                          >
                            <text
                              x={deg > 90 || deg < -90 ? -10 : 10}
                              y="3"
                              textAnchor={deg > 90 || deg < -90 ? 'end' : 'start'}
                              className="text-[9px] font-mono fill-[#1F2328]"
                            >
                              {leaf.id} ({leaf.st})
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>
              {hoverLeaf && (
                <div className="fixed bottom-12 right-8 bg-[#1F2328] text-white p-3 rounded-md shadow-xl text-xs space-y-1 w-60 border border-[#30363D] pointer-events-none z-30">
                  <div className="font-bold font-mono text-[#3FB950]">{hoverLeaf.id}</div>
                  <div>
                    Origin: <strong>{hoverLeaf.country}</strong> ({hoverLeaf.year})
                  </div>
                  <div>
                    Host: <strong>{hoverLeaf.host}</strong> · ST: <strong>{hoverLeaf.st}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: PAN-GENOME */}
        {tab === 'pangenome' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header shrink-0">
              <span className="text-xs font-semibold text-[#1F2328]">
                Roary Pan-Genome Architecture ({summary.pangenome_stats.total_clusters.toLocaleString()} Clusters)
              </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
              <div className="w-full h-6 rounded-md overflow-hidden flex border border-[#D0D7DE] text-xs font-semibold text-white">
                <div style={{ width: `${pangenomePercentages.core}%` }} className="bg-[#1F2328] flex items-center justify-center">
                  Core {pangenomePercentages.core}%
                </div>
                <div style={{ width: `${pangenomePercentages.soft}%` }} className="bg-[#0969DA] flex items-center justify-center">
                  Soft {pangenomePercentages.soft}%
                </div>
                <div style={{ width: `${pangenomePercentages.shell}%` }} className="bg-[#D97706] flex items-center justify-center">
                  Shell {pangenomePercentages.shell}%
                </div>
                <div style={{ width: `${pangenomePercentages.cloud}%` }} className="bg-[#CF222E] flex items-center justify-center">
                  Cloud {pangenomePercentages.cloud}%
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-md border border-[#D0D7DE] bg-[#F6F8FA]">
                  <div className="text-xs font-semibold text-[#656D76]">Core (&ge;99%)</div>
                  <div className="text-lg font-bold font-mono text-[#1F2328] mt-0.5">
                    {summary.pangenome_stats.core_genes.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-[#D0D7DE] bg-[#F6F8FA]">
                  <div className="text-xs font-semibold text-[#656D76]">Soft-Core (95–99%)</div>
                  <div className="text-lg font-bold font-mono text-[#0969DA] mt-0.5">
                    {summary.pangenome_stats.soft_core_genes.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-[#D0D7DE] bg-[#F6F8FA]">
                  <div className="text-xs font-semibold text-[#656D76]">Shell (15–95%)</div>
                  <div className="text-lg font-bold font-mono text-[#D97706] mt-0.5">
                    {summary.pangenome_stats.shell_genes.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 rounded-md border border-[#D0D7DE] bg-[#F6F8FA]">
                  <div className="text-xs font-semibold text-[#656D76]">Cloud (&lt;15%)</div>
                  <div className="text-lg font-bold font-mono text-[#CF222E] mt-0.5">
                    {summary.pangenome_stats.cloud_genes.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: FASTANI MATRIX */}
        {tab === 'fastani' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header shrink-0">
              <span className="text-xs font-semibold text-[#1F2328]">
                All-vs-All Whole-Genome FastANI Matrix
              </span>
              {aniHover && (
                <span className="gh-badge font-mono">
                  {aniHover.q} vs {aniHover.r}: <strong>{aniHover.val.toFixed(2)}% ANI</strong>
                </span>
              )}
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-3">
              <table className="w-full text-center text-[11px] font-mono border-collapse">
                <thead className="sticky top-0 bg-[#F6F8FA] z-10">
                  <tr>
                    <th className="p-2 text-left bg-[#F6F8FA] border border-[#D0D7DE]">Isolate</th>
                    {summary.ani_matrix.samples.map((s) => (
                      <th key={s} className="p-2 bg-[#F6F8FA] border border-[#D0D7DE] text-[#24292F]">
                        {s.slice(0, 10)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.ani_matrix.samples.map((rSample, rIdx) => (
                    <tr key={rSample}>
                      <td className="p-2 text-left font-semibold bg-[#F6F8FA] border border-[#D0D7DE] text-[#1F2328]">
                        {rSample}
                      </td>
                      {summary.ani_matrix.values[rIdx].map((val, cIdx) => {
                        const cSample = summary.ani_matrix.samples[cIdx];
                        const bg =
                          val >= 99.8
                            ? 'bg-[#1F2328] text-white'
                            : val >= 99.2
                            ? 'bg-[#57606A] text-white'
                            : 'bg-[#EAEEF2] text-[#1F2328]';
                        return (
                          <td
                            key={cSample}
                            onMouseEnter={() => setAniHover({ q: rSample, r: cSample, val })}
                            onMouseLeave={() => setAniHover(null)}
                            className={`p-2 border border-[#D0D7DE] cursor-pointer ${bg}`}
                          >
                            {val.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: QUAST & VIRULOME */}
        {tab === 'assembly' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header shrink-0">
              <span className="text-xs font-semibold text-[#1F2328]">
                QUAST De Novo Assembly Quality & VFDB Virulome
              </span>
              <select
                value={qcSort}
                onChange={(e) => setQcSort(e.target.value as any)}
                className="gh-input py-0.5"
              >
                <option value="n50">Sort by N50</option>
                <option value="contigs">Sort by Contigs</option>
                <option value="genome_size_bp">Sort by Size</option>
              </select>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                {sortedQc.slice(0, 14).map((row) => (
                  <div key={row.sample_id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono">
                      <span className="font-semibold text-[#1F2328]">
                        {row.sample_id} <span className="text-[#656D76]">({row.st})</span>
                      </span>
                      <span className="text-[#656D76]">
                        N50: <strong>{(row.n50 / 1000).toFixed(1)} kb</strong> · {row.contigs} ctgs
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#EFF1F3] rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.min(100, (row.n50 / 400000) * 100)}%` }}
                        className="h-full bg-[#1F2328] rounded-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {summary.virulence_summary.map((v) => (
                  <div
                    key={v.gene}
                    className="p-2.5 rounded-md border border-[#D0D7DE] bg-[#F6F8FA] flex items-start justify-between gap-2"
                  >
                    <div>
                      <span className="font-mono font-semibold text-xs text-[#1F2328]">
                        {v.gene}
                      </span>
                      <div className="text-[11px] font-medium text-[#656D76]">{v.category}</div>
                      <p className="text-xs text-[#656D76] mt-0.5">{v.function}</p>
                    </div>
                    <span className="gh-badge font-mono shrink-0">{v.prevalence_pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: SCRIPTS & ITOL EXPORTER */}
        {tab === 'scripts' && (
          <div className="h-full flex flex-col min-h-0 overflow-hidden">
            <div className="gh-box-header flex-wrap gap-2 shrink-0">
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'r_ggtree', label: 'R ggtree (.R)' },
                  { id: 'python_seaborn', label: 'Python Seaborn (.py)' },
                  { id: 'itol_colorstrip', label: 'iTOL Country (.txt)' },
                  { id: 'itol_binary', label: 'iTOL AMR (.txt)' },
                  { id: 'publication_methods', label: 'Methods (.txt)' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveScript(s.id as any)}
                    className={
                      activeScript === s.id ? 'gh-btn-primary py-0.5' : 'gh-btn-secondary py-0.5'
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => copyCode(summary.export_scripts[activeScript])}
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
                    downloadBlob(
                      `GenomeLab_${activeScript}.txt`,
                      summary.export_scripts[activeScript]
                    )
                  }
                  className="gh-btn-primary"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>
            </div>

            <pre className="flex-1 min-h-0 p-4 bg-[#0D1117] text-[#E6EDF3] font-mono text-xs overflow-auto leading-relaxed">
              {summary.export_scripts[activeScript]}
            </pre>
          </div>
        )}
      </section>

      {/* Slide-Over Code Drawer for R & Python Script Inspection */}
      {showCodeDrawer && vizData && (
        <div className="fixed inset-0 z-50 bg-black/40 flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl border-l border-[#D0D7DE] flex flex-col">
            <div className="gh-box-header">
              <div>
                <h3 className="text-xs font-semibold text-[#1F2328]">
                  Executed {vizData.engine} Script
                </h3>
                <p className="text-[11px] text-[#656D76]">{vizData.title}</p>
              </div>
              <button
                onClick={() => setShowCodeDrawer(false)}
                className="text-[#656D76] hover:text-[#1F2328] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="flex-1 min-h-0 p-4 bg-[#0D1117] text-[#E6EDF3] font-mono text-xs overflow-auto leading-relaxed">
              {vizData.script_executed}
            </pre>
            <div className="gh-box-header border-t border-b-0 border-[#D0D7DE]">
              <span className="text-[11px] font-mono text-[#656D76]">{vizData.engine}</span>
              <button
                onClick={() => copyCode(vizData.script_executed)}
                className="gh-btn-primary"
              >
                {copied ? 'Copied!' : 'Copy Script'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenomicsVisualizerView;
