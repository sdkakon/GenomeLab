import React, { useState, useMemo } from 'react';
import { Project, ProcessState } from '../types/genome';
import {
  BookMarked,
  Search,
  Plus,
  Terminal,
  Users,
  ArrowRight,
  X,
  Sparkles,
  Info,
  FolderGit2,
  Laptop,
  FileText,
} from 'lucide-react';
import { ProcessStatusDot } from './ProcessStatusDot';

export interface ProjectsHomeViewProps {
  projects: Project[];
  activeProjectId?: string;
  onOpenProject: (project: Project) => void;
  onCreateProject: (
    name: string,
    organism: string,
    wslPath: string,
    sampleIds?: string,
    speciesLabel?: string
  ) => void;
  onLoadDemoProjects?: () => void;
  onOpenWindowsSetup?: () => void;
  onOpenUserGuide?: () => void;
  processState?: ProcessState;
}

interface OrganismPreset {
  label: string;
  kingdom: string;
  species: string;
  size: string;
  gc: string;
  hint: string;
}

const UNIVERSAL_ORGANISM_PRESETS: OrganismPreset[] = [
  { label: 'H. pylori', kingdom: 'bacteria', species: 'Helicobacter pylori', size: '1.67 Mb', gc: '38.8%', hint: 'Clarithromycin (23S rRNA), Metronidazole (rdxA), cagA/vacA virulence' },
  { label: 'E. coli', kingdom: 'bacteria', species: 'Escherichia coli', size: '4.63 Mb', gc: '50.8%', hint: 'Lenski Rel606 / O157:H7, acrB/mdfA efflux, ST10/ST131' },
  { label: 'Salmonella', kingdom: 'bacteria', species: 'Salmonella enterica', size: '4.80 Mb', gc: '52.1%', hint: '50-isolate cohort, ResFinder/VFDB/Roary, ST11/ST198' },
  { label: 'C. jejuni', kingdom: 'bacteria', species: 'Campylobacter jejuni', size: '1.64 Mb', gc: '30.5%', hint: 'Fluoroquinolones (gyrA T86I), tet(O) plasmid, cadF adhesins' },
  { label: 'Klebsiella', kingdom: 'bacteria', species: 'Klebsiella pneumoniae', size: '5.39 Mb', gc: '57.3%', hint: 'KPC-2 / CTX-M-15 carbapenemase, yersiniabactin siderophore' },
  { label: 'S. aureus', kingdom: 'bacteria', species: 'Staphylococcus aureus', size: '2.82 Mb', gc: '32.8%', hint: 'MRSA mecA SCCmec, Panton-Valentine leukocidin (PVL)' },
  { label: 'M. tuberculosis', kingdom: 'bacteria', species: 'Mycobacterium tuberculosis', size: '4.41 Mb', gc: '65.6%', hint: 'rpoB S450L (Rifampicin), katG S315T (Isoniazid), ESX-1' },
  { label: 'P. aeruginosa', kingdom: 'bacteria', species: 'Pseudomonas aeruginosa', size: '6.26 Mb', gc: '66.5%', hint: 'blaVIM-2 metallo-beta-lactamase, exotoxin A, alginate slime' },
  { label: 'SARS-CoV-2', kingdom: 'viral_phage', species: 'SARS-CoV-2', size: '29.9 kb', gc: '38.0%', hint: 'Spike RBD (N501Y/E484K), Paxlovid Mpro_P132H, JN.1/BA.2.86' },
  { label: 'Influenza A', kingdom: 'viral_phage', species: 'Influenza A virus', size: '13.6 kb', gc: '44.2%', hint: '8 segmented RNA genome, Oseltamivir NA_H275Y, H5N1 / H1N1' },
  { label: 'HIV-1', kingdom: 'viral_phage', species: 'Human immunodeficiency virus 1', size: '9.2 kb', gc: '42.5%', hint: 'RT_M184V / RT_K103N resistance, gp120 coreceptor tropism' },
  { label: 'Phage T4', kingdom: 'viral_phage', species: 'Enterobacteria phage T4', size: '169 kb', gc: '35.3%', hint: 'Anti-CRISPR (AcrIIA4), holin/endolysin lysis cassette' },
  { label: 'Candida auris', kingdom: 'plant_fungi', species: 'Candida auris', size: '12.3 Mb', gc: '45.2%', hint: 'Azole ERG11_Y132F, echinocandin FKS1_S639P, SAP proteases' },
  { label: 'S. cerevisiae', kingdom: 'plant_fungi', species: 'Saccharomyces cerevisiae', size: '12.2 Mb', gc: '38.3%', hint: '16 chromosomes, PDR5 ABC efflux, hexose transporters' },
  { label: 'A. fumigatus', kingdom: 'plant_fungi', species: 'Aspergillus fumigatus', size: '29.4 Mb', gc: '49.8%', hint: 'Agricultural triazole cyp51A TR34/TR46, gliotoxin cluster' },
  { label: 'Arabidopsis', kingdom: 'plant_fungi', species: 'Arabidopsis thaliana', size: '135 Mb', gc: '36.0%', hint: '5 chromosomes, ALS/EPSPS herbicide resistance, NLR immunity' },
  { label: 'Oryza sativa (Rice)', kingdom: 'plant_fungi', species: 'Oryza sativa (Rice)', size: '373 Mb', gc: '43.6%', hint: '12 chromosomes, bacterial blight Xa21, blast Pi-ta' },
  { label: 'Human (GRCh38)', kingdom: 'human_animal', species: 'Homo sapiens (Human)', size: '3.10 Gb', gc: '40.9%', hint: '24 chromosomes, CYP2D6*4 / CYP2C19*2 pharmacogenomics, HLA' },
  { label: 'P. falciparum', kingdom: 'human_animal', species: 'Plasmodium falciparum', size: '23.3 Mb', gc: '19.3%', hint: 'Extreme AT-rich, Chloroquine pfcrt_K76T, Artemisinin pfk13' },
  { label: 'Metagenome (MAGs)', kingdom: 'metagenome', species: 'Metagenomic Community', size: '45.0 Mb', gc: '48.5%', hint: 'Multi-species co-assembly, broad-spectrum resistome, T6SS' },
];

export const ProjectsHomeView: React.FC<ProjectsHomeViewProps> = ({
  projects,
  activeProjectId,
  onOpenProject,
  onCreateProject,
  onLoadDemoProjects,
  onOpenWindowsSetup,
  onOpenUserGuide,
  processState,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [organismFilter, setOrganismFilter] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newProjectName, setNewProjectName] = useState('');
  const [newOrganism, setNewOrganism] = useState('bacteria');
  const [newSpeciesLabel, setNewSpeciesLabel] = useState('');
  const [newStrainSubtype, setNewStrainSubtype] = useState('');
  const [newWslPath, setNewWslPath] = useState('');
  const [newSampleIds, setNewSampleIds] = useState('');
  const [isProjectNameCustom, setIsProjectNameCustom] = useState(false);

  const uniqueOrganisms = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.organism) set.add(p.organism);
    });
    return Array.from(set);
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.organism && p.organism.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.wsl_path && p.wsl_path.toLowerCase().includes(q));
      const matchOrg = organismFilter === 'ALL' || p.organism === organismFilter;
      return matchSearch && matchOrg;
    });
  }, [projects, searchQuery, organismFilter]);

  const currentPresetMatch = useMemo(() => {
    const q = newSpeciesLabel.toLowerCase().trim();
    if (!q) return null;
    return UNIVERSAL_ORGANISM_PRESETS.find(
      (p) =>
        p.species.toLowerCase() === q ||
        p.label.toLowerCase() === q ||
        q.includes(p.species.toLowerCase()) ||
        q.includes(p.label.toLowerCase())
    );
  }, [newSpeciesLabel]);

  const handleSpeciesChange = (val: string) => {
    setNewSpeciesLabel(val);
    const cleanName = val.trim().replace(/[\s\(\)\/]+/g, '_');
    if (!isProjectNameCustom) {
      if (cleanName) {
        setNewProjectName(`${cleanName}_Cohort`);
        setNewWslPath(`~/GenomeLab_Workspaces/${cleanName}_Cohort`);
      } else {
        setNewProjectName('');
        setNewWslPath('');
      }
    }
    const match = UNIVERSAL_ORGANISM_PRESETS.find(
      (p) =>
        p.species.toLowerCase() === val.toLowerCase().trim() ||
        p.label.toLowerCase() === val.toLowerCase().trim() ||
        val.toLowerCase().includes(p.label.toLowerCase()) ||
        val.toLowerCase().includes(p.species.toLowerCase())
    );
    if (match) {
      setNewOrganism(match.kingdom);
    }
  };

  const handleOpenCreateModal = () => {
    setNewProjectName('');
    setNewOrganism('bacteria');
    setNewSpeciesLabel('');
    setNewStrainSubtype('');
    setNewWslPath('');
    setNewSampleIds('');
    setIsProjectNameCustom(false);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const finalSpecies = newStrainSubtype.trim()
      ? `${newSpeciesLabel.trim()} (${newStrainSubtype.trim()})`
      : newSpeciesLabel.trim();
    onCreateProject(
      newProjectName.trim(),
      newOrganism,
      newWslPath.trim() || `~/GenomeLab_Workspaces/${newProjectName.trim()}`,
      newSampleIds.trim(),
      finalSpecies || newSpeciesLabel.trim()
    );
    setShowCreateModal(false);
  };

  return (
    <div className="h-full w-full max-w-5xl mx-auto flex flex-col min-h-0 overflow-hidden gap-3 py-1">
      {/* Top Projects Filter & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-[#57606A] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects by name, organism, or path..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gh-input w-full pl-8 py-1.5"
            />
          </div>

          <select
            value={organismFilter}
            onChange={(e) => setOrganismFilter(e.target.value)}
            aria-label="Filter projects by organism"
            className="gh-btn-secondary py-1.5 px-2.5 cursor-pointer"
          >
            <option value="ALL">Organism: All ({projects.length})</option>
            {uniqueOrganisms.map((org) => (
              <option key={org} value={org}>
                {org}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {onLoadDemoProjects && (
            <button
              onClick={onLoadDemoProjects}
              className="gh-btn-secondary py-1.5 px-3 cursor-pointer"
              title="Load sample Salmonella & E. coli reference datasets"
            >
              <span>Load Demo Datasets</span>
            </button>
          )}

          <button
            onClick={handleOpenCreateModal}
            className="gh-btn-primary py-1.5 px-3 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Windows WSL2 Local Engine Setup Banner */}
      <div className="bg-[#F6F8FA] border border-[#D0D7DE] rounded-md px-3.5 py-2 flex items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-1 bg-[#0969DA]/10 text-[#0969DA] rounded-md shrink-0">
            <Laptop className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-semibold text-[#1F2328]">Local Windows Engine Setup: </span>
            <span className="text-[#57606A] hidden md:inline">
              Configure WSL2 Ubuntu, Miniforge3 &amp; the <code>wgs_env</code> bioinformatics environment to execute analyses locally on your machine.
            </span>
            <span className="text-[#57606A] md:hidden">
              Install WSL2 Ubuntu, Miniforge3 &amp; wgs_env locally.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenWindowsSetup && (
            <button
              onClick={onOpenWindowsSetup}
              className="gh-btn-secondary py-1 px-2.5 text-xs font-medium border-[#0969DA]/40 text-[#0969DA] hover:bg-[#0969DA]/10 cursor-pointer"
            >
              <span>Configure Windows Engine</span>
            </button>
          )}
          {onOpenUserGuide && (
            <button
              onClick={onOpenUserGuide}
              className="gh-btn-secondary py-1 px-2.5 text-xs font-medium cursor-pointer"
            >
              <FileText className="w-3 h-3 text-[#57606A]" />
              <span>Open User Guide</span>
            </button>
          )}
        </div>
      </div>

      {/* GitHub Boxed Projects List */}
      <div className="gh-box flex-1 min-h-0 flex flex-col">
        <div className="gh-box-header shrink-0">
          <span className="text-xs font-semibold text-[#1F2328]">
            Projects ({filteredProjects.length})
          </span>
          <span className="text-[11px] text-[#656D76]">
            Universal biological analysis supported across all kingdoms: Bacteria, Viruses, Fungi, Plants, and Animals
          </span>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#D0D7DE]">
          {filteredProjects.map((proj) => {
            const isCurrent = proj.id === activeProjectId;
            const sampleCount = proj.sample_count ?? proj.samples?.length ?? 0;

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className="p-4 hover:bg-[#F6F8FA] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer bg-white"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ProcessStatusDot
                      status={isCurrent ? (processState?.status || 'completed') : 'idle'}
                      outputFilesVerified={processState?.outputFilesVerified}
                      size="sm"
                    />
                    <BookMarked className="w-4 h-4 text-[#656D76] shrink-0" />
                    <span className="text-sm font-semibold text-[#0969DA] hover:underline truncate">
                      {proj.name}
                    </span>
                    <span className="gh-badge">{proj.organism || 'Bacteria'}</span>
                    {isCurrent && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DAFBE1] text-[#1A7F37] border border-[#1A7F37]/20">
                        Active Workspace
                      </span>
                    )}
                  </div>

                  {proj.description && (
                    <p className="text-xs text-[#656D76] line-clamp-1">
                      {proj.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-[11px] text-[#656D76] flex-wrap pt-0.5">
                    <span className="inline-flex items-center gap-1 font-medium text-[#1F2328]">
                      <Users className="w-3.5 h-3.5 text-[#656D76]" />
                      {sampleCount} sample{sampleCount === 1 ? '' : 's'}
                    </span>
                    <span className="inline-flex items-center gap-1 font-mono truncate max-w-md">
                      <Terminal className="w-3 h-3 text-[#656D76] shrink-0" />
                      {proj.wsl_path}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenProject(proj);
                    }}
                    className="gh-btn-secondary py-1.5 px-3"
                  >
                    <span>Open Project</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredProjects.length === 0 && (
            <div className="p-12 text-center text-xs text-[#656D76] space-y-3">
              <div className="w-10 h-10 mx-auto rounded-full bg-[#F6F8FA] border border-[#D0D7DE] flex items-center justify-center text-[#656D76]">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-[#1F2328]">No projects in this workspace</h3>
                <p className="max-w-md mx-auto text-[#656D76]">
                  Every visitor gets their own private workspace. Click below to create your first genome analysis project, or load the demo dataset.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreateModal}
                  className="gh-btn-primary"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create First Project</span>
                </button>
                {onLoadDemoProjects && (
                  <button
                    type="button"
                    onClick={onLoadDemoProjects}
                    className="gh-btn-secondary"
                  >
                    <span>Load Demo Dataset</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Project Wizard Modal */}
      {showCreateModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Create New Project"
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
        >
          <div className="gh-box max-w-xl w-full shadow-xl">
            <div className="gh-box-header">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#0969DA]" />
                <h3 className="font-semibold text-[#1F2328] text-xs">
                  Create New Bioinformatics Project
                </h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
                className="text-[#57606A] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-4 space-y-3.5 text-xs bg-white">
              {/* Target Organism Name Blank Input - Pure text box, no dropdowns */}
              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  Target Organism / Species Name
                </label>
                <input
                  type="text"
                  value={newSpeciesLabel}
                  onChange={(e) => handleSpeciesChange(e.target.value)}
                  placeholder="Type your chosen organism name (e.g. Salmonella enterica, Escherichia coli, Klebsiella pneumoniae...)"
                  className="gh-input w-full font-medium"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-[#656D76] mt-1">
                  Write any bacterial, viral, fungal, plant, animal, or metagenomic organism name.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => {
                    setNewProjectName(e.target.value);
                    setIsProjectNameCustom(true);
                    setNewWslPath(
                      `~/GenomeLab_Workspaces/${
                        e.target.value.trim().replace(/\s+/g, '_') || 'New_Project'
                      }`
                    );
                  }}
                  placeholder="e.g. Salmonella_Cohort or My_Project_Analysis"
                  className="gh-input w-full"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">
                    Organism Kingdom / Category
                  </label>
                  <input
                    type="text"
                    value={newOrganism}
                    onChange={(e) => setNewOrganism(e.target.value)}
                    placeholder="e.g. bacteria, viral_phage, plant_fungi, human_animal"
                    className="gh-input w-full font-medium"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#1F2328] mb-1">
                    Strain / Isolate Subtype (Optional)
                  </label>
                  <input
                    type="text"
                    value={newStrainSubtype}
                    onChange={(e) => setNewStrainSubtype(e.target.value)}
                    placeholder="e.g. Strain ATCC 25922, Clade 2b, H37Rv"
                    className="gh-input w-full font-medium"
                  />
                </div>
              </div>

              {/* Live Biological Scope & Taxonomy Preview Box */}
              {currentPresetMatch && (
                <div className="bg-[#F6F8FA] border border-[#D0D7DE] rounded-md p-2.5 flex items-start gap-2 text-[11px]">
                  <Info className="w-4 h-4 text-[#0969DA] shrink-0 mt-0.5" />
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-[#1F2328]">
                      Scope: {currentPresetMatch.species} · Approx {currentPresetMatch.size} ({currentPresetMatch.gc} GC)
                    </div>
                    <div className="text-[#656D76] line-clamp-2">
                      {currentPresetMatch.hint}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  WSL2 Ubuntu Directory Path
                </label>
                <input
                  type="text"
                  value={newWslPath}
                  onChange={(e) => setNewWslPath(e.target.value)}
                  placeholder="~/GenomeLab_Workspaces/Project_Name"
                  className="gh-input w-full font-mono text-[11px]"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1F2328] mb-1">
                  Sample Accessions or Isolate IDs (Comma-Separated)
                </label>
                <input
                  type="text"
                  value={newSampleIds}
                  onChange={(e) => setNewSampleIds(e.target.value)}
                  placeholder="e.g. SRR40271360, SRR40271362, SAMPLE_01"
                  className="gh-input w-full font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#D0D7DE]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="gh-btn-secondary"
                >
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
    </div>
  );
};

export default ProjectsHomeView;
