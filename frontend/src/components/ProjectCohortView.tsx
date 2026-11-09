import React, { useState, useMemo, useEffect } from 'react';
import { Project, Sample, WSLBrowseEntry, ProcessState } from '../types/genome';
import { browseWSL } from '../services/api';
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
} from 'lucide-react';

export interface ProjectCohortViewProps {
  projects: Project[];
  activeProject: Project;
  onSelectProject: (p: Project) => void;
  selectedSamples: string[];
  onToggleSample: (sampleId: string) => void;
  onSelectAllSamples: (sampleIds: string[]) => void;
  onCreateProject: (name: string, organism: string, wslPath: string, sampleIds?: string, speciesLabel?: string) => void;
  onNavigateTab: (tab: string) => void;
  processState?: ProcessState;
}

export const ProjectCohortView: React.FC<ProjectCohortViewProps> = ({
  activeProject,
  selectedSamples,
  onToggleSample,
  onSelectAllSamples,
  onCreateProject,
  onNavigateTab,
  processState,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [hostFilter, setHostFilter] = useState('ALL');
  const [quickStage, setQuickStage] = useState('');
  const [showWizardModal, setShowWizardModal] = useState(false);
  const [showBrowserModal, setShowBrowserModal] = useState(false);
  const [selectedSampleDetail, setSelectedSampleDetail] = useState<Sample | null>(null);

  const [newProjectName, setNewProjectName] = useState('Klebsiella_Surveillance_2026');
  const [newOrganism, setNewOrganism] = useState('bacteria');
  const [newSpeciesLabel, setNewSpeciesLabel] = useState('Klebsiella pneumoniae');
  const [newWslPath, setNewWslPath] = useState('/home/soumandeykakon/GenomeLab_Workspaces/Klebsiella_Surveillance_2026');
  const [newSampleIds, setNewSampleIds] = useState('SAMPLE_01, SAMPLE_02, SRR2584863');
  const [browsePath, setBrowsePath] = useState('/home/soumandeykakon/NGS_DA');
  const [browsedEntries, setBrowsedEntries] = useState<WSLBrowseEntry[]>([]);

  useEffect(() => {
    if (activeProject?.wsl_path) {
      setBrowsePath(activeProject.wsl_path);
    }
  }, [activeProject?.wsl_path]);

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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    onCreateProject(
      newProjectName.trim(),
      newOrganism,
      newWslPath.trim(),
      newSampleIds.trim(),
      newSpeciesLabel.trim()
    );
    setShowWizardModal(false);
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
    { num: 1, name: 'Stage 1: Raw Data (fasterq-dump)' },
    { num: 2, name: 'Stage 2: Read QC (FastQC)' },
    { num: 3, name: 'Stage 3: Trimming (fastp)' },
    { num: 5, name: 'Stage 5: Assembly (SPAdes)' },
    { num: 7, name: 'Stage 7: Annotation (Prokka)' },
    { num: 8, name: 'Stage 8: AMR Scan (ABRicate)' },
    { num: 12, name: 'Stage 12: Phylogeny (IQ-TREE 2)' },
  ];

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden gap-3">
      {/* GitHub Repository Action & Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Filter Input + Host Dropdown + Quick-Stage Dropdown */}
        <div className="flex items-center gap-2 flex-1 min-w-[260px] flex-wrap">
          <div className="relative flex-1 max-w-md min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#656D76] absolute left-2.5 top-1/2 -translate-y-1/2" />
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
              setQuickStage(e.target.value);
              if (e.target.value) onNavigateTab('workbench');
            }}
            aria-label="Jump to Pipeline Stage"
            className="gh-btn-secondary py-1 px-2.5 cursor-pointer"
          >
            <option value="">Jump to Stage...</option>
            {quickLaunchStages.map((s) => (
              <option key={s.num} value={s.num}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Right: Repository File Actions & Primary Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setShowBrowserModal(true)} className="gh-btn-secondary">
            <FolderOpen className="w-3.5 h-3.5 text-[#656D76]" />
            <span>WSL2 Files</span>
          </button>

          <button
            onClick={exportSelectedTsv}
            disabled={selectedSamples.length === 0}
            className="gh-btn-secondary"
          >
            <Download className="w-3.5 h-3.5 text-[#656D76]" />
            <span>Export TSV</span>
          </button>

          <button onClick={() => setShowWizardModal(true)} className="gh-btn-secondary">
            <Plus className="w-3.5 h-3.5 text-[#656D76]" />
            <span>New Project</span>
          </button>

          <button
            onClick={() => onNavigateTab('workbench')}
            disabled={selectedSamples.length === 0}
            className="gh-btn-primary"
          >
            <Play className="w-3.5 h-3.5" />
            <span>Run Tools ({selectedSamples.length})</span>
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
                              : sample.status.includes('Profiled') || sample.status.includes('Ready')
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
                      <div className="text-[11px] text-[#656D76]">{sample.name}</div>
                    </td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-[#1F2328]">{sample.host || 'Unknown'}</div>
                      <div className="text-[11px] text-[#656D76]">
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
                      <span className="gh-badge font-mono">{sample.st || 'ND'}</span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1 max-w-[210px]">
                        {sample.amr_genes && sample.amr_genes.length > 0 ? (
                          sample.amr_genes.slice(0, 3).map((gene) => (
                            <span
                              key={gene}
                              className="px-1.5 py-0.5 text-[10px] bg-[#FFEBE9] text-[#CF222E] border border-[#FF8182]/40 rounded-full font-mono"
                            >
                              {gene}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#8C959F] text-[11px]">None</span>
                        )}
                        {sample.amr_genes && sample.amr_genes.length > 3 && (
                          <span className="text-[10px] text-[#656D76] font-medium">
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
                              className="px-1.5 py-0.5 text-[10px] bg-[#DDF4FF] text-[#0969DA] border border-[#54AEFF]/40 rounded-full font-mono"
                            >
                              {p}
                            </span>
                          ))
                        ) : (
                          <span className="text-[#8C959F] text-[11px]">—</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => setSelectedSampleDetail(sample)}
                        className="gh-btn-secondary py-0.5 px-2 text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Project Modal (GitHub Dialog Style) */}
      {showWizardModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gh-box max-w-lg w-full shadow-xl">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[#1F2328] text-xs">Create New Bioinformatics Repository / Project</h3>
              <button onClick={() => setShowWizardModal(false)} className="text-[#656D76] hover:text-[#1F2328]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3 text-xs bg-white">
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">Project / Repository Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    setNewWslPath(
                      `/home/soumandeykakon/GenomeLab_Workspaces/${e.target.value.trim().replace(/\s+/g, '_') || 'New_Project'}`
                    );
                  }}
                  className="gh-input w-full"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">Organism Kingdom</label>
                  <select
                    value={newOrganism}
                    onChange={(e) => setNewOrganism(e.target.value)}
                    className="gh-input w-full"
                  >
                    <option value="bacteria">Bacteria (WGS, AMR, Roary, Snippy)</option>
                    <option value="human_animal">Human & Animal Diploid</option>
                    <option value="plant_fungi">Plant & Fungal Genomes</option>
                    <option value="viral_phage">Viruses & Bacteriophages</option>
                    <option value="metagenome">Metagenomics</option>
                    <option value="all">Universal / All Tools</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">Species / Strain Label</label>
                  <input
                    type="text"
                    value={newSpeciesLabel}
                    onChange={(e) => setNewSpeciesLabel(e.target.value)}
                    placeholder="e.g. Escherichia coli"
                    className="gh-input w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">WSL2 Ubuntu Directory Path</label>
                <input
                  type="text"
                  value={newWslPath}
                  onChange={(e) => setNewWslPath(e.target.value)}
                  className="gh-input w-full font-mono"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  Sample IDs or NCBI SRA Accessions (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={newSampleIds}
                  onChange={(e) => setNewSampleIds(e.target.value)}
                  placeholder="SRR2584863, SAMPLE_01"
                  className="gh-input w-full font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-[#D0D7DE]">
                <button type="button" onClick={() => setShowWizardModal(false)} className="gh-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gh-btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WSL2 File Browser Modal */}
      {showBrowserModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gh-box max-w-xl w-full shadow-xl">
            <div className="gh-box-header">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-[#656D76]" />
                <h3 className="font-semibold text-[#1F2328] text-xs">WSL2 Ubuntu Directory Browser</h3>
              </div>
              <button onClick={() => setShowBrowserModal(false)} className="text-[#656D76] hover:text-[#1F2328]">
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
                        <FileText className="w-3.5 h-3.5 text-[#656D76]" />
                      )}{' '}
                      {f.name}
                    </span>
                    <span className="text-[#656D76] text-[10px] font-mono">{f.size_human || f.file_type}</span>
                  </div>
                ))}
                {browsedEntries.length === 0 && (
                  <div className="p-4 text-center text-[#656D76]">Empty directory</div>
                )}
              </div>
              <div className="border border-dashed border-[#D0D7DE] rounded-md p-2.5 text-center bg-[#F6F8FA]">
                <UploadCloud className="w-4 h-4 text-[#656D76] mx-auto mb-0.5" />
                <p className="font-medium text-[#1F2328] text-[11px]">
                  Place FASTQ / FASTA files in <code>{browsePath}/01_raw_data</code>
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
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gh-box max-w-sm w-full shadow-xl">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[#1F2328] text-xs font-mono">{selectedSampleDetail.id}</h3>
              <button onClick={() => setSelectedSampleDetail(null)} className="text-[#656D76] hover:text-[#1F2328]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-xs bg-white">
              <div className="grid grid-cols-2 gap-2 bg-[#F6F8FA] p-2.5 rounded-md border border-[#D0D7DE]">
                <div>
                  <span className="text-[#656D76]">Host:</span>
                  <div className="font-semibold text-[#1F2328]">{selectedSampleDetail.host}</div>
                </div>
                <div>
                  <span className="text-[#656D76]">Origin:</span>
                  <div className="font-semibold text-[#1F2328]">
                    {selectedSampleDetail.country} ({selectedSampleDetail.year})
                  </div>
                </div>
                <div>
                  <span className="text-[#656D76]">MLST:</span>
                  <div className="font-semibold text-[#1F2328]">{selectedSampleDetail.st}</div>
                </div>
                <div>
                  <span className="text-[#656D76]">N50:</span>
                  <div className="font-mono text-[#1F2328]">{selectedSampleDetail.n50?.toLocaleString()} bp</div>
                </div>
              </div>
              <div>
                <span className="font-semibold text-[#1F2328] block mb-1">AMR Genes:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedSampleDetail.amr_genes?.map((g) => (
                    <span
                      key={g}
                      className="px-1.5 py-0.5 font-mono text-[10px] bg-[#FFEBE9] text-[#CF222E] border border-[#FF8182]/40 rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex justify-end pt-2 border-t border-[#D0D7DE]">
                <button onClick={() => setSelectedSampleDetail(null)} className="gh-btn-secondary">
                  Close
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
