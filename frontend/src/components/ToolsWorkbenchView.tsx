import React, { useState, useMemo, useEffect } from 'react';
import {
  StageInfo,
  ToolDefinition,
  ThermalGuardConfig,
  Project,
  ProcessState,
} from '../types/genome';
import { ProcessStatusDot } from './ProcessStatusDot';
import {
  Search,
  Play,
  Code2,
  Flame,
  Star,
  ExternalLink,
  Plus,
  X,
  Check,
  Copy,
  ShieldCheck,
  Terminal,
} from 'lucide-react';

export interface ToolsWorkbenchViewProps {
  stages: StageInfo[];
  tools: ToolDefinition[];
  selectedOrganism: string;
  onChangeOrganism: (org: string) => void;
  selectedSamples: string[];
  activeProject?: Project;
  thermalGuard: ThermalGuardConfig;
  onUpdateThermalGuard: (tg: ThermalGuardConfig) => void;
  onRunTool: (
    tool: ToolDefinition,
    params: Record<string, any>,
    customFlags: string,
    mode: 'wsl_real' | 'fast_simulation'
  ) => void;
  onInspectCode: (
    tool: ToolDefinition,
    params: Record<string, any>,
    customFlags: string
  ) => void;
  onRegisterCustomTool: (newTool: Partial<ToolDefinition>) => void;
  processState?: ProcessState;
}

export const ToolsWorkbenchView: React.FC<ToolsWorkbenchViewProps> = ({
  stages,
  tools,
  selectedOrganism,
  selectedSamples,
  activeProject,
  thermalGuard,
  onUpdateThermalGuard,
  onRunTool,
  onInspectCode,
  onRegisterCustomTool,
  processState,
}) => {
  const [selectedStageId, setSelectedStageId] = useState<number>(0); // 0 = All stages, or 1..12
  const [selectedToolId, setSelectedToolId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeParamTab, setActiveParamTab] = useState<'standard' | 'advanced' | 'hardware' | 'raw'>('standard');
  const [paramValues, setParamValues] = useState<Record<string, any>>({});
  const [customFlags, setCustomFlags] = useState<string>('');
  const [executionMode, setExecutionMode] = useState<'wsl_real' | 'fast_simulation'>('wsl_real');
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // New Custom Tool modal state
  const [customName, setCustomName] = useState('');
  const [customBinary, setCustomBinary] = useState('');
  const [customStageId, setCustomStageId] = useState(5);
  const [customCategory, setCustomCategory] = useState('Assembly');
  const [customDesc, setCustomDesc] = useState('');
  const [customCmd, setCustomCmd] = useState('');

  // Tools filtered by stage & search
  const visibleTools = useMemo(() => {
    return tools.filter((tool) => {
      const matchStage = selectedStageId === 0 || tool.stage_id === selectedStageId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        tool.name.toLowerCase().includes(q) ||
        tool.binary.toLowerCase().includes(q) ||
        tool.category.toLowerCase().includes(q) ||
        tool.short_description.toLowerCase().includes(q);
      return matchStage && matchSearch;
    });
  }, [tools, selectedStageId, searchQuery]);

  // Current selected tool object
  const activeTool = useMemo(() => {
    if (!tools || tools.length === 0) return null;
    const found = tools.find((t) => t.id === selectedToolId);
    if (found) return found;
    return visibleTools[0] || tools[0];
  }, [tools, selectedToolId, visibleTools]);

  // Sync active tool and default params
  useEffect(() => {
    if (
      activeTool &&
      (!paramValues || Object.keys(paramValues).length === 0 || activeTool.id !== selectedToolId)
    ) {
      setSelectedToolId(activeTool.id);
      const initial: Record<string, any> = {};
      activeTool.parameters?.forEach((p) => {
        initial[p.id] = p.default;
      });
      setParamValues(initial);
      setCustomFlags('');
    }
  }, [activeTool?.id]);

  // Determine if a tool is recommended for the chosen organism
  const isToolRecommended = (t: ToolDefinition) => {
    if (selectedOrganism === 'all') return !!t.is_gold_standard;
    return (
      (t.recommended_organisms && t.recommended_organisms.includes(selectedOrganism)) ||
      (t.recommended_organisms && t.recommended_organisms.includes('all'))
    );
  };

  // Compile real-time CLI preview
  const compiledCommand = useMemo(() => {
    if (!activeTool) return '';
    const parts: string[] = [activeTool.binary];

    activeTool.parameters?.forEach((p) => {
      const val = paramValues[p.id];
      if (val === undefined || val === null || val === '') return;
      if (p.tier === 'hardware') return;

      if (p.type === 'boolean') {
        if (val === true && p.flag) parts.push(p.flag);
      } else if (p.flag) {
        parts.push(`${p.flag} ${val}`);
      }
    });

    const threadParam = activeTool.parameters?.find((p) => p.id === 'threads' || p.id === 'cores');
    if (threadParam?.flag) {
      parts.push(`${threadParam.flag} ${thermalGuard.max_threads}`);
    }
    const memParam = activeTool.parameters?.find((p) => p.id === 'memory' || p.id === 'memory_gb');
    if (memParam?.flag) {
      parts.push(`${memParam.flag} ${thermalGuard.max_ram_gb}`);
    }

    if (customFlags.trim()) {
      parts.push(customFlags.trim());
    }

    const samplePrefix =
      selectedSamples.length > 0
        ? selectedSamples[0]
        : (activeProject?.samples[0]?.id || 'SAMPLE_01');
    return parts.join(' ').replace(/\$SAMPLE/g, samplePrefix);
  }, [activeTool, paramValues, customFlags, thermalGuard, selectedSamples, activeProject]);

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(compiledCommand);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleCustomToolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customBinary) return;
    onRegisterCustomTool({
      name: customName,
      binary: customBinary,
      stage_id: customStageId,
      category: customCategory,
      short_description: customDesc || 'Custom integrated CLI tool',
      example_command: customCmd || `${customBinary} --help`,
      is_gold_standard: false,
      recommended_organisms: ['all'],
      conda_env: 'wgs_env',
    });
    setShowRegisterModal(false);
    setCustomName('');
    setCustomBinary('');
    setCustomDesc('');
    setCustomCmd('');
  };

  return (
    <div className="h-full flex flex-col lg:flex-row min-h-0 overflow-hidden gap-3">
      {/* Left Sidebar: GitHub Actions-Style Workflow / Tool Navigator */}
      <aside className="w-full lg:w-72 gh-box flex flex-col min-h-0 shrink-0">
        {/* Sidebar Header: Stage Filter & Search */}
        <div className="p-2.5 bg-[#F6F8FA] border-b border-[#D0D7DE] space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1F2328]">Bioinformatics Tools</span>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="gh-btn-secondary py-0.5 px-2 text-[11px]"
              title="Register Custom CLI Tool"
            >
              <Plus className="w-3 h-3" />
              <span>Add Tool</span>
            </button>
          </div>

          {/* Pipeline Stage Filter Dropdown */}
          <select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(Number(e.target.value))}
            aria-label="Filter by Pipeline Stage"
            className="gh-input w-full font-medium cursor-pointer"
          >
            <option value={0}>All Pipeline Stages ({tools.length} Tools)</option>
            {stages?.map((stage) => (
              <option key={stage.id} value={stage.id}>
                Stage {stage.id}: {stage.short_name || stage.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#656D76] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Find a tool (fastp, spades, prokka)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="gh-input w-full pl-8"
            />
          </div>
        </div>

        {/* Scrollable Vertical Tool List */}
        <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#D0D7DE]/50">
          {visibleTools.map((tool) => {
            const isSelected = tool.id === activeTool?.id;
            const recommended = isToolRecommended(tool);
            const isToolActive = processState?.toolId === tool.id;
            const toolDotStatus = isToolActive ? processState.status : 'idle';

            return (
              <button
                key={tool.id}
                onClick={() => {
                  setSelectedToolId(tool.id);
                  const initial: Record<string, any> = {};
                  tool.parameters?.forEach((p) => {
                    initial[p.id] = p.default;
                  });
                  setParamValues(initial);
                }}
                className={`w-full px-3 py-2 text-left transition-colors flex flex-col gap-0.5 border-l-2 cursor-pointer ${
                  isSelected
                    ? 'border-[#FD8C73] bg-[#F6F8FA] font-semibold'
                    : 'border-transparent bg-white hover:bg-[#F6F8FA]/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ProcessStatusDot
                      status={toolDotStatus}
                      size="sm"
                      showTooltip={false}
                      outputFilesVerified={processState?.outputFilesVerified}
                    />
                    {recommended && (
                      <Star className="w-3 h-3 fill-[#D97706] text-[#D97706] shrink-0" />
                    )}
                    <span className="text-xs text-[#1F2328] truncate">{tool.name}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#656D76] bg-[#EFF1F3] px-1.5 py-0.5 rounded shrink-0">
                    {tool.binary}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#656D76]">
                  <span className="truncate">{tool.category || `Stage ${tool.stage_id}`}</span>
                  <span className="font-mono text-[10px]">S{tool.stage_id}</span>
                </div>
              </button>
            );
          })}
          {visibleTools.length === 0 && (
            <div className="p-6 text-center text-xs text-[#656D76]">
              No tools match your filter.
            </div>
          )}
        </div>
      </aside>

      {/* Right Main Panel: GitHub Boxed Tool Configuration & Live CLI Runner */}
      <section className="flex-1 gh-box flex flex-col min-h-0 overflow-hidden">
        {/* Box Header Bar */}
        <div className="gh-box-header flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm font-semibold text-[#1F2328] truncate">
              {activeTool?.name || 'Select a Tool'}
            </h2>
            {activeTool && (
              <>
                <span className="gh-badge font-mono">{activeTool.binary}</span>
                <span className="gh-badge hidden sm:inline-flex">
                  Stage {activeTool.stage_id}
                </span>
                <span className="gh-badge hidden md:inline-flex font-mono text-[#656D76]">
                  conda: {activeTool.conda_env || 'wgs_env'}
                </span>
              </>
            )}
          </div>

          {/* Action Controls in Box Header */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as 'wsl_real' | 'fast_simulation')}
              aria-label="Execution Mode"
              className="gh-input py-1 font-medium cursor-pointer"
            >
              <option value="wsl_real">Mode: WSL2 Ubuntu (Real)</option>
              <option value="fast_simulation">Mode: Fast Simulation</option>
            </select>

            <button
              onClick={() => activeTool && onInspectCode(activeTool, paramValues, customFlags)}
              className="gh-btn-secondary"
            >
              <Code2 className="w-3.5 h-3.5 text-[#656D76]" />
              <span>Inspect CLI</span>
            </button>

            {(() => {
              const isCurrentToolRunning =
                processState?.toolId === activeTool?.id && processState?.status === 'running';
              const isCurrentToolDone =
                processState?.toolId === activeTool?.id && processState?.status === 'completed';
              const isCurrentToolFailed =
                processState?.toolId === activeTool?.id && processState?.status === 'failed';

              return (
                <button
                  onClick={() =>
                    activeTool && onRunTool(activeTool, paramValues, customFlags, executionMode)
                  }
                  disabled={isCurrentToolRunning}
                  className="gh-btn-primary flex items-center gap-1.5"
                >
                  <ProcessStatusDot
                    status={
                      isCurrentToolRunning
                        ? 'running'
                        : isCurrentToolDone
                        ? 'completed'
                        : isCurrentToolFailed
                        ? 'failed'
                        : 'idle'
                    }
                    size="sm"
                    outputFilesVerified={processState?.outputFilesVerified}
                  />
                  <span>
                    {isCurrentToolRunning
                      ? 'Processing in WSL2...'
                      : isCurrentToolDone
                      ? `Re-run Tool (${selectedSamples.length || 1})`
                      : isCurrentToolFailed
                      ? `Retry Tool (${selectedSamples.length || 1})`
                      : `Run Tool (${selectedSamples.length || 1})`}
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Box Body: 2-Column Split (Left Parameters | Right CLI Preview & Context) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#D0D7DE] overflow-hidden">
          {/* Left Column (7 cols): Parameter Tabs & Inputs */}
          <div className="lg:col-span-7 flex flex-col min-h-0 overflow-hidden bg-white">
            {/* GitHub Underline Sub-Tabs for Parameters */}
            <div className="px-4 bg-[#F6F8FA]/60 border-b border-[#D0D7DE] flex items-center gap-2 text-xs shrink-0">
              <button
                onClick={() => setActiveParamTab('standard')}
                className={`py-2 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeParamTab === 'standard'
                    ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                    : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
                }`}
              >
                Standard Parameters
              </button>
              <button
                onClick={() => setActiveParamTab('advanced')}
                className={`py-2 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeParamTab === 'advanced'
                    ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                    : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
                }`}
              >
                Advanced Flags
              </button>
              <button
                onClick={() => setActiveParamTab('hardware')}
                className={`py-2 px-2 border-b-2 transition-colors flex items-center gap-1 cursor-pointer ${
                  activeParamTab === 'hardware'
                    ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                    : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
                }`}
              >
                <Flame className="w-3.5 h-3.5 text-[#D97706]" />
                <span>Hardware Limits</span>
              </button>
              <button
                onClick={() => setActiveParamTab('raw')}
                className={`py-2 px-2 border-b-2 transition-colors cursor-pointer ${
                  activeParamTab === 'raw'
                    ? 'border-[#FD8C73] font-semibold text-[#1F2328]'
                    : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
                }`}
              >
                Raw Override
              </button>
            </div>

            {/* Scrollable Parameter Form */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
              {activeParamTab === 'standard' && (
                <div className="space-y-3">
                  {activeTool?.parameters
                    ?.filter((p) => p.tier !== 'hardware' && p.tier !== 'advanced')
                    .map((p) => (
                      <div key={p.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-[#1F2328]">{p.label}</label>
                          <span className="font-mono text-[11px] text-[#656D76]">{p.flag}</span>
                        </div>
                        {p.type === 'boolean' ? (
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={!!paramValues[p.id]}
                              onChange={(e) =>
                                setParamValues({ ...paramValues, [p.id]: e.target.checked })
                              }
                              className="rounded border-[#D0D7DE] text-[#1F2328]"
                            />
                            <span className="text-[#656D76] text-xs">{p.description}</span>
                          </label>
                        ) : p.type === 'select' ? (
                          <select
                            value={paramValues[p.id] ?? p.default}
                            onChange={(e) =>
                              setParamValues({ ...paramValues, [p.id]: e.target.value })
                            }
                            className="gh-input w-full"
                          >
                            {p.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={p.type === 'number' ? 'number' : 'text'}
                            value={paramValues[p.id] ?? p.default}
                            min={p.min}
                            max={p.max}
                            step={p.step}
                            onChange={(e) =>
                              setParamValues({
                                ...paramValues,
                                [p.id]:
                                  p.type === 'number' ? Number(e.target.value) : e.target.value,
                              })
                            }
                            className="gh-input w-full"
                          />
                        )}
                        {p.beginner_note && (
                          <p className="text-[11px] text-[#656D76] mt-1">{p.beginner_note}</p>
                        )}
                      </div>
                    ))}
                  {(!activeTool?.parameters ||
                    activeTool.parameters.filter(
                      (p) => p.tier !== 'hardware' && p.tier !== 'advanced'
                    ).length === 0) && (
                    <div className="text-xs text-[#656D76] py-6 text-center bg-[#F6F8FA] rounded-md border border-[#D0D7DE]">
                      This tool uses standard automated defaults. Click <strong>Run Tool</strong> to execute.
                    </div>
                  )}
                </div>
              )}

              {activeParamTab === 'advanced' && (
                <div className="space-y-3">
                  {activeTool?.parameters
                    ?.filter((p) => p.tier === 'advanced')
                    .map((p) => (
                      <div key={p.id} className="text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-semibold text-[#1F2328]">{p.label}</label>
                          <span className="font-mono text-[11px] text-[#656D76]">{p.flag}</span>
                        </div>
                        <input
                          type={p.type === 'number' ? 'number' : 'text'}
                          value={paramValues[p.id] ?? p.default}
                          onChange={(e) =>
                            setParamValues({
                              ...paramValues,
                              [p.id]: p.type === 'number' ? Number(e.target.value) : e.target.value,
                            })
                          }
                          className="gh-input w-full"
                        />
                        <p className="text-[11px] text-[#656D76] mt-1">{p.description}</p>
                      </div>
                    ))}
                  {(!activeTool?.parameters ||
                    activeTool.parameters.filter((p) => p.tier === 'advanced').length === 0) && (
                    <div className="text-xs text-[#656D76] py-6 text-center bg-[#F6F8FA] rounded-md border border-[#D0D7DE]">
                      No additional advanced flags required. Use Raw Override for custom CLI flags.
                    </div>
                  )}
                </div>
              )}

              {activeParamTab === 'hardware' && (
                <div className="space-y-3 text-xs">
                  <div className="bg-[#FFF8C5] border border-[#D4A72C]/40 rounded-md p-2.5 text-[#1F2328] text-[11px] flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#9A6700] shrink-0 mt-0.5" />
                    <div>
                      <strong>Laptop Thermal Guard™:</strong> Caps CPU threads and RAM allocation in WSL2 to prevent system freezes.
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-[#1F2328] mb-1">
                      <span>Max CPU Threads:</span>
                      <span className="font-mono">{thermalGuard.max_threads} Threads</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={16}
                      value={thermalGuard.max_threads}
                      onChange={(e) =>
                        onUpdateThermalGuard({
                          ...thermalGuard,
                          max_threads: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#1F2328] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between font-semibold text-[#1F2328] mb-1">
                      <span>Max RAM Ceiling (GB):</span>
                      <span className="font-mono">{thermalGuard.max_ram_gb} GB</span>
                    </div>
                    <input
                      type="range"
                      min={2}
                      max={32}
                      step={2}
                      value={thermalGuard.max_ram_gb}
                      onChange={(e) =>
                        onUpdateThermalGuard({
                          ...thermalGuard,
                          max_ram_gb: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#1F2328] cursor-pointer"
                    />
                  </div>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={thermalGuard.enabled}
                      onChange={(e) =>
                        onUpdateThermalGuard({ ...thermalGuard, enabled: e.target.checked })
                      }
                      className="rounded border-[#D0D7DE]"
                    />
                    <span className="text-[#1F2328] font-medium">
                      Enable cooldown pause between batch isolate runs ({thermalGuard.cooldown_seconds}s)
                    </span>
                  </label>
                </div>
              )}

              {activeParamTab === 'raw' && (
                <div className="space-y-2 text-xs">
                  <label className="font-semibold text-[#1F2328] block">
                    Append Custom CLI Flags
                  </label>
                  <input
                    type="text"
                    value={customFlags}
                    onChange={(e) => setCustomFlags(e.target.value)}
                    placeholder="e.g. --careful --cov-cutoff auto"
                    className="gh-input w-full font-mono"
                  />
                  <p className="text-[11px] text-[#656D76]">
                    Appended directly to the executed WSL2 command and exported workflow scripts.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column (5 cols): Live CLI Preview & Tool Metadata Summary */}
          <div className="lg:col-span-5 bg-[#F6F8FA]/50 p-4 flex flex-col justify-between min-h-0 overflow-y-auto gap-4">
            <div className="space-y-3">
              <div>
                <h4 className="text-xs font-semibold text-[#1F2328] mb-1">About {activeTool?.name}</h4>
                <p className="text-xs text-[#656D76] leading-relaxed">
                  {activeTool?.short_description}
                </p>
                {activeTool?.documentation_url && (
                  <a
                    href={activeTool.documentation_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-[#0969DA] hover:underline mt-1.5 font-medium"
                  >
                    <span>Official Documentation</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {/* Live Compiled CLI Box */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-semibold text-[#1F2328] flex items-center gap-1">
                    <Terminal className="w-3.5 h-3.5 text-[#656D76]" />
                    Compiled WSL2 Command Preview
                  </span>
                  <button
                    onClick={handleCopyCommand}
                    className="text-[11px] text-[#656D76] hover:text-[#1F2328] inline-flex items-center gap-1 cursor-pointer"
                  >
                    {copiedCmd ? (
                      <>
                        <Check className="w-3 h-3 text-[#1A7F37]" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#0D1117] text-[#E6EDF3] rounded-md p-3 font-mono text-xs break-all border border-[#30363D]">
                  <code>{compiledCommand || 'Select a tool...'}</code>
                </div>
              </div>
            </div>

            {/* Execution Target Summary Card */}
            <div className="bg-white border border-[#D0D7DE] rounded-md p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#656D76]">Target Samples:</span>
                <span className="font-semibold text-[#1F2328]">
                  {selectedSamples.length || 1} isolate(s)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#656D76]">Resource Allocation:</span>
                <span className="font-mono text-[#1F2328]">
                  {thermalGuard.max_threads} Threads / {thermalGuard.max_ram_gb} GB RAM
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#656D76]">Version:</span>
                <span className="font-mono text-[#1F2328]">v{activeTool?.version || 'latest'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Register Custom CLI Tool */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="gh-box max-w-md w-full shadow-xl">
            <div className="gh-box-header">
              <h3 className="font-semibold text-[#1F2328] text-xs">Register Custom CLI Tool</h3>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-[#656D76] hover:text-[#1F2328]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCustomToolSubmit} className="p-4 space-y-3 text-xs bg-white">
              <div>
                <label className="font-semibold text-[#1F2328] block mb-1">Tool Display Name</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. MyCustomVariantCaller"
                  className="gh-input w-full"
                  required
                />
              </div>

              <div>
                <label className="font-semibold text-[#1F2328] block mb-1">Binary Name (Command)</label>
                <input
                  type="text"
                  value={customBinary}
                  onChange={(e) => setCustomBinary(e.target.value)}
                  placeholder="e.g. mytool.py"
                  className="gh-input w-full font-mono"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#1F2328] block mb-1">Stage</label>
                  <select
                    value={customStageId}
                    onChange={(e) => setCustomStageId(Number(e.target.value))}
                    className="gh-input w-full"
                  >
                    {stages?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.short_name || s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-[#1F2328] block mb-1">Category</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Assembly / QC"
                    className="gh-input w-full"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1F2328] block mb-1">Short Description</label>
                <input
                  type="text"
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What does this CLI tool accomplish?"
                  className="gh-input w-full"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1F2328] block mb-1">Example Command</label>
                <input
                  type="text"
                  value={customCmd}
                  onChange={(e) => setCustomCmd(e.target.value)}
                  placeholder="mytool -i sample.fq -o out_dir -t 4"
                  className="gh-input w-full font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#D0D7DE]">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="gh-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gh-btn-primary">
                  Register Tool
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ToolsWorkbenchView;
