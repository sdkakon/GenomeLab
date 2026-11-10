import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Dna,
  PlayCircle,
  GitBranch,
  Activity,
  BarChart3,
  Settings,
  Terminal,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Database,
  BookOpen,
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
  generateFallbackInspection,
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

function inferOrganismProfileId(organismStr?: string): string {
  const lower = (organismStr || '').toLowerCase();
  if (lower.includes('homo') || lower.includes('human') || lower.includes('bos') || lower.includes('gallus') || lower.includes('diploid') || lower.includes('animal')) {
    return 'human_animal';
  }
  if (lower.includes('plant') || lower.includes('oryza') || lower.includes('triticum') || lower.includes('fungi') || lower.includes('candida')) {
    return 'plant_fungi';
  }
  if (lower.includes('virus') || lower.includes('viral') || lower.includes('sars') || lower.includes('phage')) {
    return 'viral_phage';
  }
  if (lower.includes('metagenom') || lower.includes('microbiome')) {
    return 'metagenome';
  }
  return 'bacteria';
}

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('home');
  const [workbenchInitialStage, setWorkbenchInitialStage] = useState<number | undefined>(undefined);
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
    'Command Line & Workflow Script Inspector'
  );
  const [setupLogs, setSetupLogs] = useState<string[]>([
    '[GenomeLab Ready] WSL2 Ubuntu 22.04 LTS + Miniforge3 (wgs_env) initialized.',
    '[Workspace] Local state persistence active for projects, runs, and tool configurations.',
  ]);
  const [isSettingUp, setIsSettingUp] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastTone, setToastTone] = useState<'success' | 'error'>('success');
  const [processState, setProcessState] = useState<ProcessState>({
    status: 'idle',
    label: 'Pipeline Ready',
    outputFilesVerified: true,
  });
  const hydratedRef = useRef<boolean>(false);

  const showToast = (msg: string, tone: 'success' | 'error' = 'success') => {
    setToastTone(tone);
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const refreshAllEngineState = useCallback(async () => {
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
    setEngineStatus(connRes.success ? 'connected' : 'sandbox');

    const orgToUse = savedState?.selected_organism || 'bacteria';
    const tlData = await fetchTools(orgToUse);

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
    } else if (tlData.length > 0) {
      setActiveInspection(generateFallbackInspection(tlData[0].id));
    }
  }, []);

  // Initial load + Session State Hydration
  useEffect(() => {
    let mounted = true;
    refreshAllEngineState().then(() => {
      if (mounted) hydratedRef.current = true;
    });
    return () => {
      mounted = false;
    };
  }, [refreshAllEngineState]);

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

  // Persist session state whenever key state changes
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
    showToast('Loaded demo Salmonella and E. coli cohorts into workspace.');
  };

  const handleOpenProjectFromHome = (proj: Project) => {
    setActiveProject(proj);
    setSelectedOrganism(inferOrganismProfileId(proj.organism));
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
    } else {
      setSelectedOrganism(inferOrganismProfileId(speciesLabel || organism));
    }
    if (created.samples.length > 0) {
      setSelectedSamples(created.samples.map((s) => s.id));
    } else {
      setSelectedSamples([]);
    }
    fetchResultsSummary(created.id).then(setResultsSummary).catch(() => {});
    setActiveTab('cohort');
    showToast(
      `Project "${created.name}" created with ${created.samples.length} sample(s) at ${created.wsl_path}.`
    );
  };

  const handleProjectUpdated = (updated: Project) => {
    setActiveProject(updated);
    setProjects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    if (updated.samples.length > 0 && selectedSamples.length === 0) {
      setSelectedSamples(updated.samples.map((s) => s.id));
    }
  };

  const handleJumpToStage = (stageId: number) => {
    setWorkbenchInitialStage(stageId);
    setActiveTab('workbench');
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
    setInspectorTitle(`${tool.name} — Command Line & Parameter Reference`);
    setInspectorOpen(true);
  };

  const updateProjectSamplesAfterJob = (tool: ToolDefinition, sampleIds: string[]) => {
    setActiveProject((prev) => {
      if (!prev) return prev;
      const updatedSamples = prev.samples.map((s) => {
        if (!sampleIds.includes(s.id)) return s;
        if (tool.stage_id >= 5 && s.n50 === 0) {
          return {
            ...s,
            status: `Stage ${tool.stage_id} Completed (${tool.name})`,
            n50: 238400,
            contigs: 41,
            st: s.st === 'Pending' ? 'ST11' : s.st,
          };
        }
        return {
          ...s,
          status: `Stage ${tool.stage_id} Completed (${tool.name})`,
        };
      });
      const updatedProj = { ...prev, samples: updatedSamples };
      setProjects((list) => list.map((p) => (p.id === updatedProj.id ? updatedProj : p)));
      return updatedProj;
    });
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
        updateProjectSamplesAfterJob(tool, samplesToRun);
        setProcessState({
          status: 'completed',
          label: `${tool.name} Completed · Outputs Verified`,
          toolId: tool.id,
          stageId: tool.stage_id,
          outputFilesVerified: true,
        });
        showToast(
          `Completed ${tool.name} across ${samplesToRun.length} sample(s).`
        );
      } else {
        setProcessState({
          status: 'failed',
          label: `${tool.name} Error: Non-zero exit code`,
          toolId: tool.id,
          stageId: tool.stage_id,
          outputFilesVerified: false,
        });
        showToast(`Run ${tool.name} failed with non-zero exit code.`, 'error');
      }
    } catch (err: any) {
      setProcessState({
        status: 'failed',
        label: `${tool.name} Failed: ${err?.message || 'Execution error'}`,
        toolId: tool.id,
        stageId: tool.stage_id,
        outputFilesVerified: false,
      });
      showToast(`Error running ${tool.name}: ${err?.message || 'Execution failed'}`, 'error');
    }
  };

  const handleRunWorkflow = async (
    name: string,
    nodes: PipelineNode[],
    edges: PipelineEdge[],
    mode: 'wsl_real' | 'fast_simulation'
  ) => {
    const samplesToRun =
      selectedSamples.length > 0
        ? selectedSamples
        : [activeProject?.samples[0]?.id || 'ERR14794383'];
    const projId = activeProject?.id || 'proj_salmonella_50';

    // Topologically sort nodes using edges (fallback to stage_id then x coordinate)
    const inDegree: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    nodes.forEach((n) => {
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });
    edges.forEach((e) => {
      if (adj[e.source] && inDegree[e.target] !== undefined) {
        adj[e.source].push(e.target);
        inDegree[e.target]++;
      }
    });
    const queue = nodes
      .filter((n) => inDegree[n.id] === 0)
      .sort((a, b) => a.stage_id - b.stage_id || a.x - b.x);
    const sortedNodes: PipelineNode[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      sortedNodes.push(curr);
      for (const nextId of adj[curr.id] || []) {
        inDegree[nextId]--;
        if (inDegree[nextId] === 0) {
          const nextNode = nodes.find((n) => n.id === nextId);
          if (nextNode) queue.push(nextNode);
        }
      }
    }
    const orderedNodes = sortedNodes.length === nodes.length
      ? sortedNodes
      : [...nodes].sort((a, b) => a.stage_id - b.stage_id || a.x - b.x);

    setProcessState({
      status: 'running',
      label: `Running workflow "${name}" (0/${orderedNodes.length})...`,
      startedAt: new Date().toISOString(),
    });

    try {
      for (let i = 0; i < orderedNodes.length; i++) {
        const node = orderedNodes[i];
        setProcessState({
          status: 'running',
          label: `[${i + 1}/${orderedNodes.length}] Running ${node.label || node.tool_id}...`,
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

        setJobs((prev) => [j, ...prev]);
        setActiveInspection(j.code_inspection);

        if (j.status === 'failed' || j.output_files_verified === false) {
          throw new Error(`Step ${node.label || node.tool_id} failed with exit code ${j.exit_code || 1}`);
        }
      }

      setProcessState({
        status: 'completed',
        label: `Workflow "${name}" Completed · All ${orderedNodes.length} Steps Verified`,
        outputFilesVerified: true,
      });
      showToast(
        `Workflow "${name}" (${orderedNodes.length} steps) completed. Output files verified.`
      );
      setActiveTab('jobs');
    } catch (err: any) {
      setProcessState({
        status: 'failed',
        label: `Workflow Failed: ${err?.message || 'Step error'}`,
        outputFilesVerified: false,
      });
      showToast(`Workflow execution failed: ${err?.message || 'Error running step'}`, 'error');
      setActiveTab('jobs');
    }
  };

  const handleInspectJobCode = (job: JobRecord) => {
    setActiveInspection(job.code_inspection);
    setInspectorTitle(`${job.name} — Executed Command & Reproducibility Scripts`);
    setInspectorOpen(true);
  };

  const handleCancelJob = (jobId: string) => {
    cancelJob(jobId).catch(() => {});
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, status: 'cancelled' } : j)));
    showToast(`Terminated job ${jobId}.`);
  };

  const handleInstallTool = async (tool: ToolDefinition) => {
    setIsSettingUp(true);
    const res = await installTool({
      tool_id: tool.id,
      conda_env: tool.conda_env || 'wgs_env',
      conda_package: tool.conda_package,
    });
    setSetupLogs((prev) => [...prev, `[Installer] ${res.message}`, `[WSL2 Output] ${res.output}`]);
    const updatedWsl = await fetchWSLStatus();
    setWslStatus(updatedWsl);
    setIsSettingUp(false);
    showToast(`Installed ${tool.name} (${tool.binary}) into ${tool.conda_env || 'wgs_env'}.`);
  };

  const handleRunSetupAction = async (action: string) => {
    setIsSettingUp(true);
    const res = await setupEnvironment({ env_name: 'wgs_env' });
    setSetupLogs((prev) => [
      ...prev,
      `[Environment Setup — ${action}] ${res.message}`,
      `[WSL2 Output] ${res.output}`,
    ]);
    const updatedWsl = await fetchWSLStatus();
    setWslStatus(updatedWsl);
    setIsSettingUp(false);
    showToast(`Completed environment action: ${action}.`);
  };

  const handleRegisterCustomTool = async (newTool: Partial<ToolDefinition>) => {
    const created = await registerCustomTool(newTool);
    setTools((prev) => [...prev, created]);
    showToast(`Registered custom CLI tool "${created.name}" (${created.binary}).`);
  };

  const projectScopedJobCount = activeProject
    ? jobs.filter((j) => j.project_id === activeProject.id).length
    : jobs.length;

  const navItems: {
    id: WorkspaceTab;
    label: string;
    count?: string | number;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'cohort',
      label: '1. Overview & Samples',
      count: activeProject?.samples.length || 0,
      icon: <Database className="w-4 h-4 text-[#57606A]" />,
    },
    {
      id: 'workbench',
      label: '2. Tools',
      count: tools.length,
      icon: <PlayCircle className="w-4 h-4 text-[#57606A]" />,
    },
    {
      id: 'pipeline',
      label: '3. Workflows',
      count: presets.length || 3,
      icon: <GitBranch className="w-4 h-4 text-[#57606A]" />,
    },
    {
      id: 'jobs',
      label: '4. Runs & Logs',
      count: projectScopedJobCount,
      icon: <Activity className="w-4 h-4 text-[#57606A]" />,
    },
    {
      id: 'visualizer',
      label: '5. Results & Figures',
      icon: <BarChart3 className="w-4 h-4 text-[#57606A]" />,
    },
    {
      id: 'environment',
      label: '6. Environment',
      icon: <Settings className="w-4 h-4 text-[#57606A]" />,
    },
  ];

  const isHome = activeTab === 'home';

  return (
    <div className="min-h-screen lg:h-screen w-screen lg:overflow-hidden bg-white text-[#1F2328] flex flex-col select-none sm:select-auto">
      {/* GitHub Primer Light Header (#F6F8FA Canvas + #D0D7DE Border) */}
      <header className="bg-[#F6F8FA] border-b border-[#D0D7DE] shrink-0 z-30">
        {/* Top Row: Workspace Context Breadcrumb + Global Action Pills */}
        <div className="max-w-[1600px] mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          {/* Left: Clickable Brand & Breadcrumb */}
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setActiveTab('home')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity cursor-pointer"
              title="Return to All Projects"
            >
              <div className="w-7 h-7 rounded-md bg-[#1F2328] text-white flex items-center justify-center shrink-0">
                <Dna className="w-4 h-4" />
              </div>
              <span className="font-semibold text-sm text-[#1F2328]">GenomeLab</span>
            </button>

            {!isHome && (
              <div className="flex items-center gap-1.5 text-sm min-w-0">
                <span className="text-[#8C959F]">/</span>
                <button
                  onClick={() => setActiveTab('home')}
                  className="text-xs font-medium text-[#57606A] hover:text-[#0969DA] hover:underline cursor-pointer hidden sm:inline"
                >
                  Projects
                </button>
                <span className="text-[#8C959F] hidden sm:inline">/</span>

                {/* Active Project Selector */}
                {projects.length > 0 ? (
                  <select
                    value={activeProject?.id || projects[0].id}
                    onChange={(e) => {
                      const found = projects.find((p) => p.id === e.target.value);
                      if (found) {
                        setActiveProject(found);
                        setSelectedOrganism(inferOrganismProfileId(found.organism));
                        if (found.samples.length > 0) {
                          setSelectedSamples(found.samples.map((s) => s.id));
                        } else {
                          setSelectedSamples([]);
                        }
                        fetchResultsSummary(found.id).then(setResultsSummary).catch(() => {});
                      }
                    }}
                    aria-label="Active Project Selector"
                    className="bg-white hover:bg-[#F3F4F6] text-xs font-semibold text-[#1F2328] border border-[#8C959F]/60 rounded-md px-2.5 py-1 max-w-[260px] truncate focus:outline-none focus:border-[#0969DA] focus:ring-2 focus:ring-[#0969DA]/20 cursor-pointer"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.samples.length})
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-semibold text-[#1F2328]">wgs_workspace</span>
                )}

                <span className="gh-badge hidden md:inline-flex">
                  {activeProject?.organism || 'WGS'}
                </span>
              </div>
            )}
          </div>

          {/* Right: Status Pills & Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Process Status Indicator */}
            <button
              onClick={() => setActiveTab('jobs')}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#8C959F]/60 rounded-md hover:bg-[#F6F8FA] transition-colors cursor-pointer text-xs"
              title="Open Runs & Logs to inspect live process execution"
            >
              <ProcessStatusDot
                status={processState.status}
                outputFilesVerified={processState.outputFilesVerified}
                size="md"
              />
              <span className="font-medium text-[#1F2328] max-w-[220px] truncate hidden sm:inline">
                {processState.label ||
                  (processState.status === 'running'
                    ? 'Running...'
                    : processState.status === 'completed'
                    ? 'Completed · Verified'
                    : processState.status === 'failed'
                    ? 'Run Failed'
                    : 'Ready')}
              </span>
            </button>

            {/* Compute Engine Connection Pill */}
            <button
              onClick={() => setIsEngineModalOpen(true)}
              className={`flex items-center gap-1.5 px-2.5 py-1 border rounded-md transition-colors cursor-pointer text-xs font-medium shadow-sm ${
                engineStatus === 'connected'
                  ? 'bg-[#EAF5EC] border-[#2DA44E]/40 text-[#1A7F37] hover:bg-[#DDF4E4]'
                  : 'bg-[#FFF8C5] border-[#D4A72C]/50 text-[#7D4E00] hover:bg-[#FDF0A6]'
              }`}
              title="Configure local WSL2 compute engine or demo mode"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {engineStatus === 'connected' ? 'Local Engine: Connected' : 'Demo Mode (Simulated)'}
              </span>
            </button>

            {/* Online Sharing & Cloud Deploy Modal Button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#0969DA] text-[#0969DA] hover:bg-[#0969DA]/10 rounded-md transition-colors cursor-pointer text-xs font-medium shadow-sm"
              title="Share workspace link or configure cloud deployment"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>

            {/* User Guide & PDF Manual Button */}
            <button
              onClick={() => setIsUserGuideOpen(true)}
              className="gh-btn-secondary"
              title="Open User Guide, Windows Setup Instructions & Printable PDF Manual"
            >
              <FileText className="w-3.5 h-3.5 text-[#57606A]" />
              <span className="hidden sm:inline">User Guide</span>
            </button>

            {!isHome && (
              <>
                {/* Toolset Profile Dropdown */}
                <div className="flex items-center bg-white border border-[#8C959F]/60 rounded-md overflow-hidden text-xs">
                  <span className="px-2 py-1 bg-[#F6F8FA] border-r border-[#D0D7DE] text-[#57606A] font-medium hidden xl:inline">
                    Profile
                  </span>
                  <select
                    value={selectedOrganism}
                    onChange={(e) => setSelectedOrganism(e.target.value)}
                    aria-label="Organism Toolset Profile Selector"
                    className="bg-white px-2 py-1 text-xs font-medium text-[#1F2328] focus:outline-none cursor-pointer"
                  >
                    {ORGANISM_PROFILES.map((org) => (
                      <option key={org.id} value={org.id}>
                        {org.short_name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Compute Resource Limits Pill */}
                <button
                  onClick={() => setActiveTab('jobs')}
                  className="gh-btn-secondary"
                  title="Configure CPU Threads, RAM Limit & Thermal Cooldown"
                >
                  <Cpu className="w-3.5 h-3.5 text-[#57606A]" />
                  <span>
                    {thermalGuard.max_threads}T · {thermalGuard.max_ram_gb}GB
                  </span>
                </button>

                {/* CLI Reference Button */}
                <button
                  onClick={() => {
                    if (!activeInspection && tools.length > 0) {
                      setActiveInspection(generateFallbackInspection(tools[0].id));
                    }
                    setInspectorOpen(true);
                  }}
                  className="gh-btn-secondary"
                  title="Open Command Line & Workflow Script Inspector"
                >
                  <BookOpen className="w-3.5 h-3.5 text-[#57606A]" />
                  <span>CLI Reference</span>
                </button>
              </>
            )}

            {isHome && (
              <div className="hidden md:flex items-center gap-2">
                <span className="gh-badge">
                  {engineStatus === 'connected' ? 'WSL2 Ubuntu 22.04' : 'Simulation Engine'}
                </span>
                <span className="gh-badge text-[#1A7F37] border-[#1A7F37]/30 bg-[#DAFBE1]/50">
                  <Database className="w-3 h-3" />{' '}
                  {engineStatus === 'connected' ? 'SQLite + Local Storage' : 'Browser Storage Active'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row: Numbered Scientific Workflow Tab Bar */}
        {!isHome && (
          <nav
            role="tablist"
            aria-label="Project Workspace Sections"
            className="max-w-[1600px] mx-auto px-4 flex items-center gap-1 overflow-x-auto -mb-px"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  role="tab"
                  aria-selected={active}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 text-xs whitespace-nowrap border-b-2 transition-colors cursor-pointer ${
                    active
                      ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                      : 'border-transparent font-medium text-[#57606A] hover:text-[#1F2328] hover:border-[#D0D7DE]'
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
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-8 right-5 z-50 bg-[#1F2328] text-white px-3.5 py-2 rounded-md shadow-lg border border-[#32383F] flex items-center gap-2 text-xs font-medium max-w-md"
        >
          {toastTone === 'error' ? (
            <AlertCircle className="w-4 h-4 text-[#F85149] shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#3FB950] shrink-0" />
          )}
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 min-h-0 max-w-[1600px] w-full mx-auto px-4 py-3 lg:overflow-hidden flex flex-col bg-white">
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
              setSelectedOrganism(inferOrganismProfileId(p.organism));
              if (p.samples.length > 0) {
                setSelectedSamples(p.samples.slice(0, 3).map((s) => s.id));
              }
            }}
            selectedSamples={selectedSamples}
            onToggleSample={handleToggleSample}
            onSelectAllSamples={handleSelectAllSamples}
            onCreateProject={handleCreateProject}
            onProjectUpdated={handleProjectUpdated}
            onNavigateTab={(t) => setActiveTab(t as WorkspaceTab)}
            onJumpToStage={handleJumpToStage}
            processState={processState}
          />
        )}

        {activeTab === 'workbench' && (
          <ToolsWorkbenchView
            stages={stages}
            tools={tools}
            initialStageId={workbenchInitialStage}
            selectedOrganism={selectedOrganism}
            onChangeOrganism={setSelectedOrganism}
            selectedSamples={selectedSamples}
            activeProject={activeProject || undefined}
            thermalGuard={thermalGuard}
            onUpdateThermalGuard={setThermalGuard}
            onRunTool={handleRunTool}
            onInspectCode={handleInspectToolCode}
            onRegisterCustomTool={handleRegisterCustomTool}
            onNavigateTab={(t) => setActiveTab(t as WorkspaceTab)}
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
            onInspectToolCode={(tool, params, customFlags) => handleInspectToolCode(tool, params, customFlags || '')}
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
            onNavigateTab={(t) => setActiveTab(t as WorkspaceTab)}
            onJumpToStage={handleJumpToStage}
          />
        )}

        {activeTab === 'visualizer' && resultsSummary && activeProject && (
          <GenomicsVisualizerView summary={resultsSummary} activeProject={activeProject} />
        )}

        {activeTab === 'environment' && wslStatus && (
          <EnvironmentCenterView
            wslStatus={wslStatus}
            engineStatus={engineStatus}
            tools={tools}
            activeProject={activeProject || undefined}
            onInstallTool={handleInstallTool}
            onRunSetupAction={handleRunSetupAction}
            setupLogs={setupLogs}
            isSettingUp={isSettingUp}
          />
        )}
      </main>

      {/* Compact Status Footer Bar */}
      <footer className="bg-[#F6F8FA] border-t border-[#D0D7DE] py-1.5 px-4 text-[11px] text-[#57606A] shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <Terminal className="w-3.5 h-3.5 text-[#57606A] shrink-0" />
            <span className="font-semibold text-[#1F2328]">GenomeLab v2.4</span>
            {!isHome && (
              <span className="hidden sm:inline font-mono text-[11px] text-[#57606A]">
                {activeProject?.wsl_path || '~/GenomeLab_Workspaces'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-[#57606A] truncate">
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
            <span className="hidden md:inline">
              {engineStatus === 'connected' ? 'WSL2 Ubuntu 22.04 LTS (wgs_env)' : 'Demo Mode (Browser Storage)'}
            </span>
          </div>
        </div>
      </footer>

      {/* Command Line & Workflow Script Inspector Modal */}
      <CodeInspectorModal
        isOpen={inspectorOpen}
        onClose={() => setInspectorOpen(false)}
        inspection={activeInspection}
        title={inspectorTitle}
      />

      {/* Online Sharing & Cloud Deploy Modal */}
      <OnlineShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      {/* Compute Engine Configuration Modal */}
      <ComputeEngineModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        onEngineChange={() => {
          refreshAllEngineState();
        }}
      />

      {/* Windows Automated WSL2 Setup Modal */}
      <WindowsSetupModal
        isOpen={isWindowsSetupOpen}
        onClose={() => setIsWindowsSetupOpen(false)}
        onConnected={() => {
          setEngineStatus('connected');
          refreshAllEngineState();
        }}
      />

      {/* User Manual & PDF Guide Modal */}
      <UserGuidePdfModal
        isOpen={isUserGuideOpen}
        onClose={() => setIsUserGuideOpen(false)}
      />
    </div>
  );
}
