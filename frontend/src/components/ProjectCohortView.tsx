import React, { useState, useMemo, useEffect } from 'react';
import { Project, Sample, WSLBrowseEntry, ProcessState } from '../types/genome';
import { browseWSL, addSampleToProject } from '../services/api';
import { ProcessStatusDot } from './ProcessStatusDot';
import {
  FolderOpen,
  Search,
  Play,
  UploadCloud,
  CheckSquare,
  Square,
  HardDrive,
  Plus,
  X,
  FileText,
  Download,
  Terminal,
  ArrowRight,
} from 'lucide-react';

export interface ProjectCohortViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (p: Project) => void;
  selectedSamples: string[];
  onToggleSample: (sampleId: string) => void;
  onSelectAllSamples: (sampleIds: string[]) => void;
  onCreateProject: (name: string, organism: string, wslPath: string, sampleIds?: string, speciesLabel?: string) => void;
  onProjectUpdated?: (p: Project) => void;
  onNavigateTab: (tab: string) => void;
  onJumpToStage?: (stageId: number) => void;
  processState?: ProcessState;
}

export const ProjectCohortView: React.FC<ProjectCohortViewProps> = ({
  activeProject,
  selectedSamples,
  onToggleSample,
  onSelectAllSamples,
  onProjectUpdated,
  onNavigateTab,
  onJumpToStage,
  processState,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hostFilter, setHostFilter] = useState('ALL');
  const [quickStage, setQuickStage] = useState('');
  const [showAddSampleModal, setShowAddSampleModal] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [selectedSampleDetail, setSelectedSampleDetail] = useState<Sample | null>(null);

  const [sampleInputIds, setSampleInputIds] = useState('SRR2584863, ERR14794390');
  const [sampleHost, setSampleHost] = useState(activeProject?.organism || 'Sample Isolate');
  const [sampleCountry, setSampleCountry] = useState('Local Lab');
  const [sampleYear, setSampleYear] = useState('2026');
  const [browsePath, setBrowsePath] = useState(activeProject?.wsl_path || '~/NGS_DA');
  const [browsedEntries, setBrowsedEntries] = useState<WSLBrowseEntry[]>([]);

  useEffect(() => {
    if (activeProject?.wsl_path) {
      setBrowsePath(activeProject.wsl_path);
    }
    if (activeProject?.organism) {
      setSampleHost(activeProject.organism);
    }
  }, [activeProject?.wsl_path, activeProject?.organism]);

  useEffect(() => {
    if (showBrowserModal && browsePath) {
      browseWSL(browsePath).then(setBrowsedEntries).catch(() => {});
    }
  }, [showBrowserModal, browsePath]);

  const uniqueHosts = useMemo(() => {
    const set = new Set<string>();
    activeProject?.samples?.forEach((s) => s.host && set.add(s.host));
    return Array.from(set);
  }, [activeProject]);

  const filteredSamples = useMemo(() => {
    if (!activeProject?.samples) return [];
    return activeProject.samples.filter((s) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.country.toLowerCase().includes(q) ||
        s.host.toLowerCase().includes(q) ||
        s.st.toLowerCase().includes(q) ||
        s.amr_genes?.some((g) => g.toLowerCase().includes(q)) ||
        s.plasmids?.some((p) => p.toLowerCase().includes(q));
      return matchSearch && (hostFilter === 'ALL' || s.host === hostFilter);
    });
  }, [activeProject, searchTerm, hostFilter]);

  const allFilteredSelected =
    filteredSamples.length > 0 && filteredSamples.every((s) => selectedSamples.includes(s.id));

  const handleToggleSelectAll = () => {
    if (allFilteredSelected) onSelectAllSamples([]);
    else onSelectAllSamples(Array.from(new Set([...selectedSamples, ...filteredSamples.map((s) => s.id)])));
  };

  const handleAddSamplesSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ids = sampleInputIds
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (ids.length === 0) return;

    let currentProj = activeProject;
    for (const sid of ids) {
      currentProj = await addSampleToProject(
        activeProject.id,
        {
          id: sid,
          name: sid,
          host: sampleHost.trim() || activeProject.organism,
          country: sampleCountry.trim() || 'Local Lab',
          year: sampleYear.trim() || '2026',
        },
        currentProj
      );
    }
    if (onProjectUpdated) {
      onProjectUpdated(currentProj);
    }
    onSelectAllSamples(Array.from(new Set([...selectedSamples, ...ids])));
    setShowAddSampleModal(false);
  };

  const exportSelectedTsv = () => {
    const list = activeProject.samples.filter((s) => selectedSamples.includes(s.id));
    const header = 'Sample_ID\tOrganism\tHost\tCountry\tYear\tN50_bp\tGC_pct\tST\tAMR_Genes\tPlasmids\n';
    const rows = list
      .map(
        (s) =>
          `${s.id}\t${activeProject.organism}\t${s.host}\t${s.country}\t${s.year}\t${s.n50}\t${s.gc_percent}\t${s.st}\t${s.amr_genes.join(';')}\t${s.plasmids.join(';')}`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.id}_selected_cohort_${list.length}.tsv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const quickLaunchStages = [
    { num: 1, name: 'Stage 1: Raw Data Ingestion (fasterq-dump)' },
    { num: 2, name: 'Stage 2: Read Quality Control (FastQC)' },
    { num: 3, name: 'Stage 3: Read Trimming & Filtering (fastp)' },
    { num: 4, name: 'Stage 4: Taxonomic Classification (Kraken2)' },
    { num: 5, name: 'Stage 5: De Novo Assembly (SPAdes)' },
    { num: 6, name: 'Stage 6: Assembly Quality (QUAST / CheckM2)' },
    { num: 7, name: 'Stage 7: Genome Annotation (Prokka / Bakta)' },
    { num: 8, name: 'Stage 8: AMR & Plasmid Profiling (ABRicate)' },
    { num: 9, name: 'Stage 9: Sequence Typing (PubMLST)' },
    { num: 10, name: 'Stage 10: Pan-Genome & FastANI (Roary)' },
    { num: 11, name: 'Stage 11: Alignment & Variant Calling (Snippy)' },
    { num: 12, name: 'Stage 12: Phylogenetics & Tree (IQ-TREE 2)' },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden gap-3">
      {/* Sample Cohort Action & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Filter Input + Host Dropdown + Launch Stage Tool Dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#57606A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter samples by ID, ST, AMR gene, or origin..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="gh-input w-full pl-8"
            />
          </div>

          <select
            value={hostFilter}
            onChange={(e) => setHostFilter(e.target.value)}
            aria-label="Filter by Host"
            className="gh-btn-secondary py-1 px-2.5 cursor-pointer"
          >
            <option value="ALL">Host: All ({activeProject?.samples?.length || 0})</option>
            {uniqueHosts.map((h) => (
              <option key={h} value={h}>
                Host: {h}
              </option>
            ))}
          </select>

          <select
            value={quickStage}
            onChange={(e) => {
              const val = e.target.value;
              setQuickStage(val);
              if (val) {
                if (onJumpToStage) {
                  onJumpToStage(Number(val));
                } else {
                  onNavigateTab('workbench');
                }
              }
            }}
            aria-label="Launch Stage Tool"
            className="gh-btn-secondary py-1 px-2.5 cursor-pointer"
          >
            <option value="">Launch Stage Tool...</option>
            {quickLaunchStages.map((s) => (
              <option key={s.num} value={s.num}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Cohort Actions & Primary Execution CTA */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setShowBrowserModal(true)} className="gh-btn-secondary">
            <FolderOpen className="w-3.5 h-3.5 text-[#57606A]" />
            <span>Workspace Files</span>
          </button>

          <button
            onClick={exportSelectedTsv}
            disabled={selectedSamples.length === 0}
            className="gh-btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-[#57606A]" />
            <span>Export TSV</span>
          </button>

          <button onClick={() => setShowAddSampleModal(true)} className="gh-btn-secondary">
            <Plus className="w-3.5 h-3.5 text-[#57606A]" />
            <span>Add Samples</span>
          </button>

          <button
            onClick={() => onNavigateTab('workbench')}
            disabled={selectedSamples.length === 0}
            className="gh-btn-execute"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Configure &amp; Run Tools ({selectedSamples.length})</span>
          </button>
        </div>
      </div>

      {/* GitHub Boxed Table Container */}
      <div className="gh-box flex-1 min-h-0 flex flex-col">
        {/* Box Header Bar (#F6F8FA) */}
        <div className="gh-box-header shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={handleToggleSelectAll}
              className="inline-flex items-center gap-1.5 font-semibold text-[#1F2328] hover:text-[#0969DA] cursor-pointer"
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-4 h-4 text-[#1F2328]" />
              ) : (
                <Square className="w-4 h-4 text-[#656D76]" />
              )}
              <span>
                {selectedSamples.length} selected
              </span>
            </button>
            <span className="text-[#D0D7DE]">|</span>
            <span className="text-[#656D76]">
              Showing <strong className="text-[#1F2328]">{filteredSamples.length}</strong> of{' '}
              {activeProject?.samples?.length || 0} samples in <strong className="text-[#1F2328]">{activeProject?.name}</strong>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] font-mono text-[#656D76]">
            <Terminal className="w-3.5 h-3.5" />
            <span className="truncate max-w-[360px]">{activeProject?.wsl_path}</span>
          </div>
        </div>

        {/* Scrollable Table Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-auto">
          <table className="w-full text-left text-xs text-[#1F2328] border-collapse">
            <thead className="bg-[#F6F8FA] border-b border-[#D0D7DE] text-[#656D76] font-semibold text-[11px] sticky top-0 z-10">
              <tr>
                <th className="py-2 px-3 w-8 text-center"></th>
                <th className="py-2 px-3">Sample / Accession</th>
                <th className="py-2 px-3">Host & Origin</th>
                <th className="py-2 px-3">N50</th>
                <th className="py-2 px-3">GC %</th>
                <th className="py-2 px-3">Contigs</th>
                <th className="py-2 px-3">MLST</th>
                <th className="py-2 px-3">AMR Genes</th>
                <th className="py-2 px-3">Plasmids</th>
                <th className="py-2 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D0D7DE]/70">
              {filteredSamples.map((sample) => {
                const isChecked = selectedSamples.includes(sample.id);
                return (
                  <tr
                    key={sample.id}
                    className={`hover:bg-[#F6F8FA] transition-colors ${
                      isChecked ? 'bg-[#F6F8FA]/80' : 'bg-white'
                    }`}
                  >
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => onToggleSample(sample.id)}
                        className="p-0.5 rounded text-[#1F2328] hover:text-[#0969DA] cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-[#1F2328]" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-[#8C959F]" />
                        )}
                      </button>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5 font-mono font-semibold text-[#1F2328]">
                        <ProcessStatusDot
                          status={
                            isChecked && processState?.status === 'running'
                              ? 'running'
                              : isChecked && processState?.status === 'failed'
                              ? 'failed'
                              : isChecked && processState?.status === 'completed'
                              ? 'completed'
                              : sample.status.includes('Profiled') || sample.status.includes('Completed')
                              ? 'completed'
                              : 'idle'
                          }
                          size="sm"
                          showTooltip={true}
                          tooltipText={`Sample status: ${sample.status}`}
                          outputFilesVerified={processState?.outputFilesVerified}
                        />
                        <span>{sample.id}</span>
                      </div>
                      <div className="text-[11px] text-[#57606A]">{sample.status || sample.name}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-[#1F2328]">{sample.host || 'Unknown'}</div>
                      <div className="text-[11px] text-[#57606A]">
                        {sample.country || 'Global'} · {sample.year || '2024'}
                      </div>
                    </td>
                    <td className="py-2 px-3 font-mono text-[#24292F]">
                      {sample.n50 ? `${(sample.n50 / 1000).toFixed(1)} kb` : '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#24292F]">
                      {sample.gc_percent ? `${sample.gc_percent.toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-2 px-3 font-mono text-[#24292F]">{sample.contigs || '—'}</td>
                    <td className="py-2 px-3">
                      <span className="gh-badge font-mono">{sample.st || 'Pending'}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[210px]">
                        {sample.amr_genes && sample.amr_genes.length > 0 ? (
                          sample.amr_genes.slice(0, 3).map((gene) => (
                            <span
                              key={gene}
                              className="px-1.5 py-0.5 text-[11px] bg-[#FFEBE9] text-[#CF222E] border border-[#FF8182]/40 rounded-full font-mono"
                            >
                              {gene}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#57606A] text-[11px]">None</span>
                        )}
                        {sample.amr_genes && sample.amr_genes.length > 3 && (
                          <span className="text-[11px] text-[#57606A] font-medium">
                            +{sample.amr_genes.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[140px]">
                        {sample.plasmids?.length ? (
                          sample.plasmids.map((p) => (
                            <span
                              key={p}
                              className="px-1.5 py-0.5 text-[11px] bg-[#DDF4FF] text-[#0969DA] border border-[#54AEFF]/40 rounded-full font-mono"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#57606A] text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedSampleDetail(sample)}
                        className="gh-btn-secondary py-0.5 px-2 text-[11px]"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Import Samples Modal */}
      {showAddSampleModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Add Samples to Project"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="gh-box max-w-lg w-full shadow-xl">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[#1F2328] text-xs">
                Add / Import Samples to {activeProject.name}
              </h3>
              <button
                onClick={() => setShowAddSampleModal(false)}
                aria-label="Close modal"
                className="text-[#57606A] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAddSamplesSubmit} className="p-4 space-y-3 text-xs bg-white">
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  Sample IDs or NCBI SRA Accessions (Comma or Newline Separated)
                </label>
                <textarea
                  rows={3}
                  value={sampleInputIds}
                  onChange={(e) => setSampleInputIds(e.target.value)}
                  placeholder="SRR2584863, ERR14794390, SAMPLE_03"
                  className="gh-input w-full font-mono"
                  required
                />
                <p className="text-[11px] text-[#57606A] mt-1">
                  Paired-end FASTQ paths will be mapped automatically under <code>{activeProject.wsl_path}/01_raw_data/</code>.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">Host / Source</label>
                  <input
                    type="text"
                    value={sampleHost}
                    onChange={(e) => setSampleHost(e.target.value)}
                    className="gh-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">Country / Lab</label>
                  <input
                    type="text"
                    value={sampleCountry}
                    onChange={(e) => setSampleCountry(e.target.value)}
                    className="gh-input w-full"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">Collection Year</label>
                  <input
                    type="text"
                    value={sampleYear}
                    onChange={(e) => setSampleYear(e.target.value)}
                    className="gh-input w-full font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#D0D7DE]">
                <button type="button" onClick={() => setShowAddSampleModal(false)} className="gh-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gh-btn-primary">
                  Add to Cohort
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Workspace File Browser Modal */}
      {showBrowserModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workspace Directory Browser"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="gh-box max-w-xl w-full shadow-xl">
            <div className="gh-box-header">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#57606A]" />
                <h3 className="font-semibold text-[#1F2328] text-xs">WSL2 Workspace Directory Browser</h3>
              </div>
              <button
                onClick={() => setShowBrowserModal(false)}
                aria-label="Close modal"
                className="text-[#57606A] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-white">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={browsePath}
                  onChange={(e) => setBrowsePath(e.target.value)}
                  className="gh-input flex-1 font-mono"
                />
                <button
                  onClick={() => {
                    const parent = browsePath.replace(/\/+$/, '').split('/').slice(0, -1).join('/') || '/';
                    setBrowsePath(parent);
                  }}
                  className="gh-btn-secondary"
                >
                  Up (..)
                </button>
              </div>
              <div className="border border-[#D0D7DE] rounded-md overflow-hidden max-h-56 overflow-y-auto divide-y divide-[#D0D7DE]/60">
                {browsedEntries.map((f, idx) => (
                  <div
                    key={idx}
                    onClick={() => f.is_dir && setBrowsePath(f.path)}
                    className="px-3 py-1.5 flex items-center justify-between hover:bg-[#F6F8FA] cursor-pointer"
                  >
                    <span className="flex items-center gap-2 font-mono text-[#1F2328]">
                      {f.is_dir ? (
                        <FolderOpen className="w-3.5 h-3.5 text-[#54AEFF]" />
                      ) : (
                        <FileText className="w-3.5 h-3.5 text-[#57606A]" />
                      )}{' '}
                      {f.name}
                    </span>
                    <span className="text-[#57606A] text-[11px] font-mono">{f.size_human || f.file_type}</span>
                  </div>
                ))}
                {browsedEntries.length === 0 && (
                  <div className="p-4 text-center text-[#57606A]">Empty directory</div>
                )}
              </div>
              <div className="border border-dashed border-[#D0D7DE] rounded-md p-2.5 text-center bg-[#F6F8FA]">
                <UploadCloud className="w-4 h-4 text-[#57606A] mx-auto mb-0.5" />
                <p className="font-medium text-[#1F2328] text-[11px]">
                  Place paired-end FASTQ / FASTA files in <code>{browsePath}/01_raw_data</code>
                </p>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#D0D7DE]">
                <button onClick={() => setShowBrowserModal(false)} className="gh-btn-secondary">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Details Modal */}
      {selectedSampleDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Sample Details: ${selectedSampleDetail.id}`}
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="gh-box max-w-md w-full shadow-xl">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[#1F2328] text-xs font-mono">
                Sample Metadata &amp; Paths — {selectedSampleDetail.id}
              </h3>
              <button
                onClick={() => setSelectedSampleDetail(null)}
                aria-label="Close modal"
                className="text-[#57606A] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-white">
              <div className="grid grid-cols-2 gap-2.5 bg-[#F6F8FA] p-3 rounded-md border border-[#D0D7DE]">
                <div>
                  <span className="text-[#57606A]">Host / Source:</span>
                  <div className="font-semibold text-[#1F2328]">{selectedSampleDetail.host}</div>
                </div>
                <div>
                  <span className="text-[#57606A]">Origin &amp; Year:</span>
                  <div className="font-semibold text-[#1F2328]">
                    {selectedSampleDetail.country} ({selectedSampleDetail.year})
                  </div>
                </div>
                <div>
                  <span className="text-[#57606A]">Sequence Type (MLST):</span>
                  <div className="font-semibold font-mono text-[#1F2328]">{selectedSampleDetail.st || 'Pending'}</div>
                </div>
                <div>
                  <span className="text-[#57606A]">Assembly N50:</span>
                  <div className="font-mono text-[#1F2328]">
                    {selectedSampleDetail.n50 ? `${selectedSampleDetail.n50.toLocaleString()} bp` : 'Not assembled'}
                  </div>
                </div>
                <div>
                  <span className="text-[#57606A]">Genome Size / GC:</span>
                  <div className="font-mono text-[#1F2328]">
                    {(selectedSampleDetail.genome_size_bp / 1e6).toFixed(2)} Mb ({selectedSampleDetail.gc_percent}% GC)
                  </div>
                </div>
                <div>
                  <span className="text-[#57606A]">Contig Count:</span>
                  <div className="font-mono text-[#1F2328]">{selectedSampleDetail.contigs || '—'}</div>
                </div>
              </div>

              <div className="space-y-1 text-[11px] font-mono bg-[#F6F8FA] p-2.5 rounded-md border border-[#D0D7DE]">
                <div className="truncate" title={selectedSampleDetail.r1_path}>
                  <strong className="text-[#57606A]">R1:</strong> {selectedSampleDetail.r1_path || '—'}
                </div>
                <div className="truncate" title={selectedSampleDetail.r2_path}>
                  <strong className="text-[#57606A]">R2:</strong> {selectedSampleDetail.r2_path || '—'}
                </div>
                <div className="truncate" title={selectedSampleDetail.assembly_path}>
                  <strong className="text-[#57606A]">Assembly:</strong> {selectedSampleDetail.assembly_path || '—'}
                </div>
              </div>

              <div>
                <span className="font-semibold text-[#1F2328] block mb-1">Detected AMR Genes &amp; Plasmids:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSampleDetail.amr_genes?.length ? (
                    selectedSampleDetail.amr_genes.map((g) => (
                      <span
                        key={g}
                        className="px-2 py-0.5 font-mono text-[11px] bg-[#FFEBE9] text-[#CF222E] border border-[#FF8182]/40 rounded-full"
                      >
                        {g}
                      </span>
                    ))
                  ) : (
                    <span className="text-[#57606A]">No AMR genes profiled yet</span>
                  )}
                  {selectedSampleDetail.plasmids?.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 font-mono text-[11px] bg-[#DDF4FF] text-[#0969DA] border border-[#54AEFF]/40 rounded-full"
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#D0D7DE]">
                <button onClick={() => setSelectedSampleDetail(null)} className="gh-btn-secondary">
                  Close
                </button>
                <button
                  onClick={() => {
                    if (!selectedSamples.includes(selectedSampleDetail.id)) {
                      onToggleSample(selectedSampleDetail.id);
                    }
                    setSelectedSampleDetail(null);
                    onNavigateTab('workbench');
                  }}
                  className="gh-btn-execute"
                >
                  <span>Run Tools on Sample</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ProjectCohortView;
