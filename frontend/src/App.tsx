import React, { useEffect, useState, useRef } from 'react';
import {
  Dna,
  Code2,
  PlayCircle,
  GitBranch,
  Activity,
  BarChart3,
  Settings,
  Terminal,
  CheckCircle2,
  Cpu,
  Database,
  BookOpen,
  Home,
  Globe,
  Laptop,
  FileText,
} from 'lucide-react';
import {
  StageInfo,
  ToolDefinition,
  Project,
  PipelinePreset,
  JobRecord,
  WSLStatus,
  ResultsSummary,
  CodeInspectionResult,
  ThermalGuardConfig,
  PipelineNode,
  PipelineEdge,
  ProcessState,
  ProcessStatus,
} from './types/genome';
import { ProcessStatusDot } from './components/ProcessStatusDot';
import {
  ORGANISM_PROFILES,
  fetchStages,
  fetchTools,
  fetchProjects,
  fetchPresets,
  fetchJobs,
  fetchWSLStatus,
  fetchResultsSummary,
  inspectCode,
  executeJob,
  cancelJob,
  installTool,
  setupEnvironment,
  registerCustomTool,
  createProject,
  fetchAppState,
  saveAppState,
  saveProjectToolConfig,
  testBackendConnection,
  loadDemoProjectsIntoStorage,
} from './services/api';
import ProjectsHomeView from './components/ProjectsHomeView';
import ProjectCohortView from './components/ProjectCohortView';
import ToolsWorkbenchView from './components/ToolsWorkbenchView';
import PipelineStudioView from './components/PipelineStudioView';
import JobMonitorView from './components/JobMonitorView';
import GenomicsVisualizerView from './components/GenomicsVisualizerView';
import EnvironmentCenterView from './components/EnvironmentCenterView';
import CodeInspectorModal from './components/CodeInspectorModal';
import { OnlineShareModal } from './components/OnlineShareModal';
import { ComputeEngineModal } from './components/ComputeEngineModal';
import { WindowsSetupModal } from './components/WindowsSetupModal';
import { UserGuidePdfModal } from './components/UserGuidePdfModal';

type WorkspaceTab =
  | 'home'
  | 'cohort'
  | 'workbench'
  | 'pipeline'
  | 'jobs'
  | 'visualizer'
  | 'environment';

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('home');
  const [selectedOrganism, setSelectedOrganism] = useState<string>('bacteria');
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isWindowsSetupOpen, setIsWindowsSetupOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);
  const [engineStatus, setEngineStatus] = useState<'connected' | 'sandbox'>('sandbox');
  const [stages, setStages] = useState<StageInfo[]>([]);
  const [tools, setTools] = useState<ToolDefinition[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<string[]>([
    'ERR14794383',
    'ERR14838559',
    'SRR14421695',
  ]);
  const [presets, setPresets] = useState<PipelinePreset[]>([]);
  const [jobs, setJobs] = useState<JobRecord[]>([]);
  const [wslStatus, setWslStatus] = useState<WSLStatus | null>(null);
  const [resultsSummary, setResultsSummary] = useState<ResultsSummary | null>(null);

  const [thermalGuard, setThermalGuard] = useState<ThermalGuardConfig>({
    max_threads: 4,
    max_ram_gb: 8,
    cooldown_seconds: 300,
    enabled: true,
  });

  const [inspectorOpen, setInspectorOpen] = useState<boolean>(false);
  const [activeInspection, setActiveInspection] = useState<CodeInspectionResult | null>(null);
  const [inspectorTitle, setInspectorTitle] = useState<string>(
    'Executed CLI Code & Beginner Guide'
  );
  const [setupLogs, setSetupLogs] = useState<string[]>([
    '[GenomeLab Ready] WSL2 Ubuntu 22.04 LTS + Miniforge3 (ngs_veterinary) connected.',
    '[SQLite WAL Persistence] All projects, jobs, tool configs, and UI state auto-saved to disk.',
  ]);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle',
    label: 'Pipeline Ready',
    outputFilesVerified: true,
  });
  const hydratedRef = useRef<boolean>(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Initial load + SQLite Session State Hydration
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      const [stData, prData, psData, jbData, wslData, resData, savedState, connRes] = await Promise.all([
        fetchStages(),
        fetchProjects(),
        fetchPresets(),
        fetchJobs(),
        fetchWSLStatus(),
        fetchResultsSummary('proj_salmonella_50'),
        fetchAppState(),
        testBackendConnection(),
      ]);
      if (!mounted) return;
      setEngineStatus(connRes.success ? 'connected' : 'sandbox');

      const orgToUse = savedState?.selected_organism || 'bacteria';
      const tlData = await fetchTools(orgToUse);
      if (!mounted) return;

      setStages(stData);
      setTools(tlData);
      setProjects(prData);
      setPresets(psData);
      setJobs(jbData);
      setWslStatus(wslData);
      setResultsSummary(resData);

      if (savedState?.selected_organism) {
        setSelectedOrganism(savedState.selected_organism);
      }
      if (savedState?.thermal_guard && typeof savedState.thermal_guard === 'object') {
        setThermalGuard((prev) => ({ ...prev, ...savedState.thermal_guard }));
      }

      const targetProjId = savedState?.active_project_id;
      const matchedProj = prData.find((p) => p.id === targetProjId) || prData[0] || null;
      setActiveProject(matchedProj);

      if (
        Array.isArray(savedState?.selected_samples) &&
        savedState.selected_samples.length > 0
      ) {
        setSelectedSamples(savedState.selected_samples);
      } else if (matchedProj && matchedProj.samples.length > 0) {
        setSelectedSamples(matchedProj.samples.slice(0, 3).map((s) => s.id));
      }

      if (jbData.length > 0) {
        setActiveInspection(jbData[0].code_inspection);
      }
      hydratedRef.current = true;
    };
    init();
    return () => {
      mounted = false;
    };
  }, []);

  // Reload tools when organism changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    fetchTools(selectedOrganism).then(setTools).catch(() => {});
  }, [selectedOrganism]);

  // Synchronize Results Summary whenever active project changes or jobs finish
  useEffect(() => {
    if (!hydratedRef.current || !activeProject?.id) return;
    fetchResultsSummary(activeProject.id)
      .then(setResultsSummary)
      .catch(() => {});
  }, [activeProject?.id, jobs.length]);

  // Persist session state to SQLite whenever key state changes
  useEffect(() => {
    if (!hydratedRef.current) return;
    saveAppState({
      active_project_id: activeProject?.id || 'proj_salmonella_50',
      active_tab: activeTab,
      selected_organism: selectedOrganism,
      selected_samples: selectedSamples,
      thermal_guard: thermalGuard,
    }).catch(() => {});
  }, [activeProject?.id, activeTab, selectedOrganism, selectedSamples, thermalGuard]);

  const handleToggleSample = (sampleId: string) => {
    setSelectedSamples((prev) =>
      prev.includes(sampleId) ? prev.filter((id) => id !== sampleId) : [...prev, sampleId]
    );
  };

  const handleSelectAllSamples = (sampleIds: string[]) => {
    setSelectedSamples(sampleIds);
  };

  const handleLoadDemoProjects = () => {
    const demos = loadDemoProjectsIntoStorage();
    setProjects(demos);
    if (demos.length > 0) {
      setActiveProject(demos[0]);
      if (demos[0].samples && demos[0].samples.length > 0) {
        setSelectedSamples(demos[0].samples.slice(0, 3).map((s) => s.id));
      }
      fetchResultsSummary(demos[0].id).then(setResultsSummary).catch(() => {});
    }
    showToast('Loaded demo Salmonella & E. coli cohorts into your private browser workspace!');
  };

  const handleOpenProjectFromHome = (proj: Project) => {
    setActiveProject(proj);
    if (proj.samples && proj.samples.length > 0) {
      setSelectedSamples(proj.samples.map((s) => s.id));
    } else {
      setSelectedSamples([]);
    }
    fetchResultsSummary(proj.id).then(setResultsSummary).catch(() => {});
    setActiveTab('cohort');
  };

  const handleCreateProject = async (
    name: string,
    organism: string,
    wslPath: string,
    sampleIds?: string,
    speciesLabel?: string
  ) => {
    const created = await createProject({
      name,
      organism: speciesLabel || organism,
      wsl_path: wslPath,
      sample_ids: sampleIds,
      host: speciesLabel || organism,
    });
    setProjects((prev) => [created, ...prev]);
    setActiveProject(created);
    if (ORGANISM_PROFILES.some((o) => o.id === organism)) {
      setSelectedOrganism(organism);
    }
    if (created.samples.length > 0) {
      setSelectedSamples(created.samples.map((s) => s.id));
    } else {
      setSelectedSamples([]);
    }
    fetchResultsSummary(created.id).then(setResultsSummary).catch(() => {});
    showToast(
      `Created & persisted project "${created.name}" (${created.samples.length} sample(s)) at ${created.wsl_path}!`
    );
  };

  const handleInspectToolCode = async (
    tool: ToolDefinition,
    params: Record<string, any>,
    customFlags: string = ''
  ) => {
    const sampleName = selectedSamples[0] || activeProject?.samples[0]?.id || 'ERR14794383';
    const res = await inspectCode({
      tool_id: tool.id,
      parameters: params,
      sample_name: sampleName,
      samples: selectedSamples.length > 0 ? selectedSamples : [sampleName],
      custom_flags: customFlags,
      thermal_guard: thermalGuard,
    });
    setActiveInspection(res);
    setInspectorTitle(`${tool.name} — 1-Click CLI Code & Beginner Anatomy`);
    setInspectorOpen(true);
  };

  const handleRunTool = async (
    tool: ToolDefinition,
    params: Record<string, any>,
    customFlags: string,
    mode: 'wsl_real' | 'fast_simulation'
  ) => {
    const samplesToRun =
      selectedSamples.length > 0
        ? selectedSamples
        : [activeProject?.samples[0]?.id || 'ERR14794383'];
    const projId = activeProject?.id || 'proj_salmonella_50';

    setProcessState({
      status: 'running',
      label: `Running ${tool.name}...`,
      toolId: tool.id,
      stageId: tool.stage_id,
      startedAt: new Date().toISOString(),
    });

    try {
      saveProjectToolConfig(projId, tool.id, {
        stage_id: tool.stage_id,
        parameters: params,
        custom_flags: customFlags,
        execution_mode: mode,
      }).catch(() => {});

      const job = await executeJob({
        project_id: projId,
        wsl_path: activeProject?.wsl_path,
        tool_id: tool.id,
        samples: samplesToRun,
        parameters: params,
        custom_flags: customFlags,
        execution_mode: mode,
        thermal_guard: thermalGuard,
      });

      setJobs((prev) => [job, ...prev]);
      setActiveInspection(job.code_inspection);

      const verified = job.status === 'completed' && job.output_files_verified !== false;
      if (verified) {
        setProcessState({
          status: 'completed',
          label: `${tool.name} Completed · Output Files Verified`,
          toolId: tool.id,
          stageId: tool.stage_id,
          outputFilesVerified: true,
        });
        showToast(
          `Executed & verified ${tool.name} outputs across ${samplesToRun.length} sample(s)!`
        );
      } else {
        setProcessState({
          status: 'failed',
          label: `${tool.name} Error: Non-zero exit code or missing files`,
          toolId: tool.id,
          stageId: tool.stage_id,
          outputFilesVerified: false,
        });
        showToast(`Job ${tool.name} failed or encountered non-zero exit code.`);
      }
    } catch (err: any) {
      setProcessState({
        status: 'failed',
        label: `${tool.name} Failed: ${err?.message || 'Execution error'}`,
        toolId: tool.id,
        stageId: tool.stage_id,
        outputFilesVerified: false,
      });
      showToast(`Error running ${tool.name}: ${err?.message || 'Execution failed'}`);
    }
  };

  const handleRunWorkflow = async (
    name: string,
    nodes: PipelineNode[],
    _edges: PipelineEdge[],
    mode: 'wsl_real' | 'fast_simulation'
  ) => {
    const samplesToRun =
      selectedSamples.length > 0
        ? selectedSamples
        : [activeProject?.samples[0]?.id || 'ERR14794383'];
    const createdJobs: JobRecord[] = [];
    const projId = activeProject?.id || 'proj_salmonella_50';

    setProcessState({
      status: 'running',
      label: `Running pipeline "${name}" (0/${nodes.length})...`,
      startedAt: new Date().toISOString(),
    });

    try {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        setProcessState({
          status: 'running',
          label: `[${i + 1}/${nodes.length}] Running ${node.label || node.tool_id}...`,
          toolId: node.tool_id,
          stageId: node.stage_id,
        });

        const j = await executeJob({
          project_id: projId,
          wsl_path: activeProject?.wsl_path,
          tool_id: node.tool_id,
          samples: samplesToRun,
          parameters: node.parameters || {},
          custom_flags: node.custom_flags || '',
          execution_mode: mode,
          thermal_guard: thermalGuard,
        });
        createdJobs.push(j);

        if (j.status === 'failed' || j.output_files_verified === false) {
          throw new Error(`Step ${node.label || node.tool_id} failed with exit code ${j.exit_code || 1}`);
        }
      }

      if (createdJobs.length > 0) {
        setJobs((prev) => [...createdJobs, ...prev]);
        setActiveInspection(createdJobs[0].code_inspection);
      }

      setProcessState({
        status: 'completed',
        label: `Pipeline "${name}" Completed · All ${nodes.length} Steps Verified`,
        outputFilesVerified: true,
      });
      showToast(
        `Executed pipeline "${name}" (${nodes.length} steps) smoothly! Output files verified.`
      );
      setActiveTab('jobs');
    } catch (err: any) {
      if (createdJobs.length > 0) {
        setJobs((prev) => [...createdJobs, ...prev]);
      }
      setProcessState({
        status: 'failed',
        label: `Pipeline Failed: ${err?.message || 'Step error'}`,
        outputFilesVerified: false,
      });
      showToast(`Pipeline execution failed: ${err?.message || 'Error running step'}`);
      setActiveTab('jobs');
    }
  };

  const handleInspectJobCode = (job: JobRecord) => {
    setActiveInspection(job.code_inspection);
    setInspectorTitle(`${job.name} — Executed CLI Code & Beginner Breakdown`);
    setInspectorOpen(true);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJob(jobId).catch(() => {});
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j)));
    showToast(`Cancelled job ${jobId}`);
  };

  const handleInstallTool = async (tool: ToolDefinition) => {
    setIsSettingUp(true);
    const res = await installTool({
      tool_id: tool.id,
      conda_env: tool.conda_env || 'ngs_veterinary',
      conda_package: tool.conda_package,
    });
    setSetupLogs((prev) => [...prev, `[Installer] ${res.message}`, `[WSL2 Output] ${res.output}`]);
    const updatedWsl = await fetchWSLStatus();
    setWslStatus(updatedWsl);
    setIsSettingUp(false);
    showToast(`Installed ${tool.name} (${tool.binary}) into WSL2 Ubuntu!`);
  };

  const handleRunSetupAction = async (action: string) => {
    setIsSettingUp(true);
    const res = await setupEnvironment({ env_name: 'ngs_veterinary' });
    setSetupLogs((prev) => [
      ...prev,
      `[Beginner Setup Wizard — ${action}] ${res.message}`,
      `[WSL2 Output] ${res.output}`,
    ]);
    const updatedWsl = await fetchWSLStatus();
    setWslStatus(updatedWsl);
    setIsSettingUp(false);
    showToast(`Completed setup action: ${action}`);
  };

  const handleRegisterCustomTool = async (newTool: Partial<ToolDefinition>) => {
    const created = await registerCustomTool(newTool);
    setTools((prev) => [...prev, created]);
    showToast(`Registered & persisted custom CLI tool "${created.name}" (${created.binary})`);
  };

  const navItems: {
    id: WorkspaceTab;
    label: string;
    count?: string | number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'cohort',
      label: 'Code & Samples',
      count: activeProject?.sample_count || activeProject?.samples.length || 0,
      icon: <Code2 className="w-4 h-4 text-[#656D76]" />,
    },
    {
      id: 'workbench',
      label: 'Actions Workbench',
      count: tools.length,
      icon: <PlayCircle className="w-4 h-4 text-[#656D76]" />,
    },
    {
      id: 'pipeline',
      label: 'Workflows DAG',
      count: stages.length || 7,
      icon: <GitBranch className="w-4 h-4 text-[#656D76]" />,
    },
    {
      id: 'jobs',
      label: 'Runs & Logs',
      count: jobs.length,
      icon: <Activity className="w-4 h-4 text-[#656D76]" />,
    },
    {
      id: 'visualizer',
      label: 'Insights (R & Py)',
      icon: <BarChart3 className="w-4 h-4 text-[#656D76]" />,
    },
    {
      id: 'environment',
      label: 'Settings & WSL2',
      icon: <Settings className="w-4 h-4 text-[#656D76]" />,
    },
  ];

  const isHome = activeTab === 'home';

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-[#1F2328] flex flex-col select-none sm:select-auto">
      {/* GitHub Primer Light Header (#F6F8FA Canvas + #D0D7DE Border) */}
      <header className="bg-[#F6F8FA] border-b border-[#D0D7DE] shrink-0 z-30">
        {/* Top Row: Owner / Repository Context Breadcrumb + Global Action Pills */}
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Clickable Brand & Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              title="Go to Homepage (Projects List)"
            >
              <div className="w-7 h-7 rounded-md bg-[#1F2328] text-white flex items-center justify-center shrink-0">
                <Dna className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-[#1F2328]">GenomeLab</span>
            </button>

            {!isHome && (
              <div className="flex items-center gap-1.5 text-sm min-w-0">
                <span className="text-[#8C959F]">/</span>

                {/* Active Project Dropdown styled as Repository Selector */}
                {projects.length > 0 ? (
                  <select
                    value={activeProject?.id || projects[0].id}
                    onChange={(e) => {
                      const found = projects.find((p) => p.id === e.target.value);
                      if (found) {
                        setActiveProject(found);
                        if (found.samples.length > 0) {
                          setSelectedSamples(found.samples.map((s) => s.id));
                        } else {
                          setSelectedSamples([]);
                        }
                        fetchResultsSummary(found.id).then(setResultsSummary).catch(() => {});
                      }
                    }}
                    aria-label="Active Project Repository Selector"
                    className="bg-white hover:bg-[#F3F4F6] text-xs font-semibold text-[#1F2328] border border-[#D0D7DE] rounded-md px-2.5 py-1 max-w-[260px] truncate focus:outline-none focus:border-[#0969DA] focus:ring-2 focus:ring-[#0969DA]/20 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sample_count})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-[#1F2328]">wgs_workspace</span>
                )}

                <span className="gh-badge hidden md:inline-flex">WSL2 EXT4</span>
              </div>
            )}
          </div>

          {/* Right: Status Pills & Actions */}
          <div className="flex items-center gap-2">
            {/* Live Process Status Traffic-Light Indicator (Yellow running, Green verified, Red error) */}
            <button
              onClick={() => setActiveTab('jobs')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#D0D7DE] rounded-md hover:bg-[#F6F8FA] transition-colors cursor-pointer text-xs"
              title="Click to view live execution logs and provenance in Runs & Logs"
            >
              <ProcessStatusDot
                status={processState.status}
                outputFilesVerified={processState.outputFilesVerified}
                size="md"
              />
              <span className="font-medium text-[#1F2328] max-w-[240px] truncate hidden sm:inline">
                {processState.label ||
                  (processState.status === 'running'
                    ? 'Running Code...'
                    : processState.status === 'completed'
                    ? 'Step Complete · Verified'
                    : processState.status === 'failed'
                    ? 'Process Error'
                    : 'Ready')}
              </span>
            </button>

            {/* Personal Compute Engine Connection Pill */}
            <button
              onClick={() => setIsEngineModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-md transition-colors cursor-pointer text-xs font-medium shadow-xs ${
                engineStatus === 'connected'
                  ? 'bg-[#EAF5EC] border-[#2DA44E]/40 text-[#1A7F37] hover:bg-[#DDF4E4]'
                  : 'bg-[#FFF8C5] border-[#D4A72C]/40 text-[#7D4E00] hover:bg-[#FDF0A6]'
              }`}
              title="Personal Compute Engine: Click to manage connection to your personal computer"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {engineStatus === 'connected' ? 'My PC (Connected)' : 'Browser Sandbox'}
              </span>
            </button>

            {/* Free Online Sharing & Cloud Deploy Modal Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#0969DA] text-[#0969DA] hover:bg-[#0969DA]/10 rounded-md transition-colors cursor-pointer text-xs font-medium shadow-xs"
              title="Share GenomeLab online or deploy to free cloud hosting (Hugging Face / Render / Cloudflare Tunnel)"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Share Online</span>
            </button>

            {/* Enterprise User Manual & PDF Guide Button */}
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#D0D7DE] text-[#1F2328] hover:bg-[#F6F8FA] rounded-md transition-colors cursor-pointer text-xs font-medium shadow-xs"
              title="Open Complete User Guide, Windows Setup Instructions & Export to PDF"
            >
              <FileText className="w-3.5 h-3.5 text-[#656D76]" />
              <span className="hidden sm:inline">PDF Guide</span>
            </button>

            {!isHome && (
              <>
                <button
                  onClick={() => setActiveTab('home')}
                  className="gh-btn-secondary"
                  title="Return to Homepage Projects List"
                >
                  <Home className="w-3.5 h-3.5 text-[#656D76]" />
                  <span>All Projects</span>
                </button>

                {/* Organism Profile Dropdown */}
                <div className="flex items-center bg-white border border-[#D0D7DE] rounded-md overflow-hidden text-xs">
                  <span className="px-2 py-1 bg-[#F6F8FA] border-r border-[#D0D7DE] text-[#656D76] font-medium hidden sm:inline">
                    Organism
                  </span>
                  <select
                    value={selectedOrganism}
                    onChange={(e) => setSelectedOrganism(e.target.value)}
                    aria-label="Organism Profile Selector"
                    className="bg-white px-2 py-1 text-xs font-medium text-[#1F2328] focus:outline-none cursor-pointer"
                  >
                    {ORGANISM_PROFILES.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.short_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Hardware & Thermal Guard Pill */}
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="gh-btn-secondary"
                  title="Configure CPU Threads, RAM Cap & Thermal Cooldown"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#656D76]" />
                  <span>
                    {thermalGuard.max_threads}T · {thermalGuard.max_ram_gb}GB
                  </span>
                </button>

                {/* Inspect CLI Code Button */}
                <button onClick={() => setInspectorOpen(true)} className="gh-btn-primary">
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Inspect CLI</span>
                </button>
              </>
            )}

            {isHome && (
              <div className="flex items-center gap-2">
                <span className="gh-badge">WSL2 Ubuntu</span>
                <span className="gh-badge text-[#1A7F37] border-[#1A7F37]/30 bg-[#DAFBE1]/50">
                  <Database className="w-3 h-3" /> SQLite Synced
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: GitHub Horizontal Underline Tab Bar (Only visible inside a Project Workspace) */}
        {!isHome && (
          <nav className="max-w-[1600px] mx-auto px-4 flex items-center gap-1 overflow-x-auto -mb-px">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                      : 'border-transparent font-medium text-[#656D76] hover:text-[#1F2328] hover:border-[#D0D7DE]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.count !== undefined && <span className="gh-counter">{item.count}</span>}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed bottom-8 right-5 z-50 bg-[#1F2328] text-white px-3.5 py-2 rounded-md shadow-lg border border-[#32383F] flex items-center gap-2 text-xs font-medium max-w-md">
          <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Zero-Scroll Workspace Area (100% bounded flex-1 min-h-0 overflow-hidden) */}
      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-4 py-3 overflow-hidden flex flex-col bg-white">
        {activeTab === 'home' && (
          <ProjectsHomeView
            projects={projects}
            activeProjectId={activeProject?.id}
            onOpenProject={handleOpenProjectFromHome}
            onCreateProject={handleCreateProject}
            onLoadDemoProjects={handleLoadDemoProjects}
            onOpenWindowsSetup={() => setIsWindowsSetupOpen(true)}
            onOpenUserGuide={() => setIsUserGuideOpen(true)}
            processState={processState}
          />
        )}

        {activeTab === 'cohort' && activeProject && (
          <ProjectCohortView
            projects={projects}
            activeProject={activeProject}
            onSelectProject={(p) => {
              setActiveProject(p);
              if (p.samples.length > 0) {
                setSelectedSamples(p.samples.slice(0, 3).map((s) => s.id));
              }
            }}
            selectedSamples={selectedSamples}
            onToggleSample={handleToggleSample}
            onSelectAllSamples={handleSelectAllSamples}
            onCreateProject={handleCreateProject}
            onNavigateTab={(t) => setActiveTab(t as WorkspaceTab)}
            processState={processState}
          />
        )}

        {activeTab === 'workbench' && (
          <ToolsWorkbenchView
            stages={stages}
            tools={tools}
            selectedOrganism={selectedOrganism}
            onChangeOrganism={setSelectedOrganism}
            selectedSamples={selectedSamples}
            activeProject={activeProject || undefined}
            thermalGuard={thermalGuard}
            onUpdateThermalGuard={setThermalGuard}
            onRunTool={handleRunTool}
            onInspectCode={handleInspectToolCode}
            onRegisterCustomTool={handleRegisterCustomTool}
            processState={processState}
          />
        )}

        {activeTab === 'pipeline' && (
          <PipelineStudioView
            stages={stages}
            tools={tools}
            presets={presets}
            selectedOrganism={selectedOrganism}
            onChangeOrganism={setSelectedOrganism}
            activeProject={activeProject || undefined}
            thermalGuard={thermalGuard}
            onInspectToolCode={(tool, params) => handleInspectToolCode(tool, params, '')}
            onRunWorkflow={handleRunWorkflow}
            processState={processState}
          />
        )}

        {activeTab === 'jobs' && (
          <JobMonitorView
            jobs={jobs}
            activeProject={activeProject || undefined}
            thermalGuard={thermalGuard}
            onUpdateThermalGuard={setThermalGuard}
            onInspectJobCode={handleInspectJobCode}
            onCancelJob={handleCancelJob}
          />
        )}

        {activeTab === 'visualizer' && resultsSummary && activeProject && (
          <GenomicsVisualizerView summary={resultsSummary} activeProject={activeProject} />
        )}

        {activeTab === 'environment' && wslStatus && (
          <EnvironmentCenterView
            wslStatus={wslStatus}
            tools={tools}
            activeProject={activeProject || undefined}
            onInstallTool={handleInstallTool}
            onRunSetupAction={handleRunSetupAction}
            setupLogs={setupLogs}
            isSettingUp={isSettingUp}
          />
        )}
      </main>

      {/* GitHub-Style Compact Footer Bar */}
      <footer className="bg-[#F6F8FA] border-t border-[#D0D7DE] py-1.5 px-4 text-[11px] text-[#656D76] shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-[#656D76] shrink-0" />
            <span className="font-semibold text-[#1F2328]">GenomeLab v2.4</span>
            {!isHome && (
              <span className="hidden sm:inline font-mono text-[11px] text-[#656D76]">
                {activeProject?.wsl_path || '/home/soumandeykakon/wgs_practice'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#656D76] truncate">
            {isHome ? (
              <span>
                Total Projects: <strong className="text-[#1F2328]">{projects.length}</strong>
              </span>
            ) : (
              <span>
                Selected: <strong className="text-[#1F2328]">{selectedSamples.length}</strong>{' '}
                sample(s)
              </span>
            )}
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">WSL2 Ubuntu 22.04 LTS</span>
          </div>
        </div>
      </footer>

      {/* Global 1-Click "Inspect Executed Code & Learn" Modal */}
      <CodeInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        inspection={activeInspection}
        title={inspectorTitle}
      />

      {/* Global 1-Click Free Online Sharing & Cloud Deploy Modal */}
      <OnlineShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Personal Computer Compute Engine Modal */}
      <ComputeEngineModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
      />

      {/* Windows 1-Click Automated Setup Modal */}
      <WindowsSetupModal
        isOpen={isWindowsSetupOpen}
        onClose={() => setIsWindowsSetupOpen(false)}
        onConnected={() => setEngineStatus('connected')}
      />

      {/* Enterprise User Manual & PDF Guide Modal */}
      <UserGuidePdfModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}
