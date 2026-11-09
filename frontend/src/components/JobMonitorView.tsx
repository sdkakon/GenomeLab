import React, { useState, useMemo, useEffect, useRef } from 'react';
import { JobRecord, ThermalGuardConfig, JobStatus, Project } from '../types/genome';
import { ProcessStatusDot } from './ProcessStatusDot';
import {
  Cpu,
  Snowflake,
  CheckCircle2,
  AlertCircle,
  Clock,
  Code2,
  Copy,
  Check,
  Search,
  XCircle,
  Activity,
  Terminal,
} from 'lucide-react';

export interface JobMonitorViewProps {
  jobs: JobRecord[];
  activeProject?: Project;
  thermalGuard: ThermalGuardConfig;
  onUpdateThermalGuard: (tg: ThermalGuardConfig) => void;
  onInspectJobCode: (job: JobRecord) => void;
  onCancelJob: (jobId: string) => void;
}

export const JobMonitorView: React.FC<JobMonitorViewProps> = ({
  jobs,
  activeProject,
  thermalGuard,
  onUpdateThermalGuard,
  onInspectJobCode,
  onCancelJob,
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(
    jobs.length > 0 ? jobs[0].id : null
  );

  useEffect(() => {
    if ((!selectedJobId || !jobs.some((j) => j.id === selectedJobId)) && jobs.length > 0) {
      setSelectedJobId(jobs[0].id);
    }
  }, [jobs, selectedJobId]);

  const selectedJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId) || jobs[0] || null;
  }, [jobs, selectedJobId]);

  const [logSearch, setLogSearch] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [filterByProject, setFilterByProject] = useState<boolean>(true);

  const filteredJobs = useMemo(() => {
    return jobs.filter((j) => {
      if (filterByProject && activeProject && j.project_id && j.project_id !== activeProject.id) {
        return false;
      }
      if (statusFilter === 'all') return true;
      return j.status === statusFilter;
    });
  }, [jobs, statusFilter, filterByProject, activeProject?.id]);

  const counts = useMemo(() => {
    return {
      total: jobs.length,
      running: jobs.filter((j) => j.status === 'running').length,
      cooling: jobs.filter((j) => j.status === 'cooling_down').length,
      queued: jobs.filter((j) => j.status === 'queued').length,
      completed: jobs.filter((j) => j.status === 'completed').length,
      failed: jobs.filter((j) => j.status === 'failed').length,
    };
  }, [jobs]);

  useEffect(() => {
    if (autoScroll && terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedJob?.logs, autoScroll]);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = Math.floor(secs % 60);
    return `${mins}m ${rem}s`;
  };

  const renderStatusIcon = (status: JobStatus, outputFilesVerified?: boolean) => {
    return (
      <ProcessStatusDot
        status={status}
        size="md"
        outputFilesVerified={outputFilesVerified}
      />
    );
  };

  const filteredLogs = useMemo(() => {
    if (!selectedJob || !selectedJob.logs) return [];
    if (!logSearch.trim()) return selectedJob.logs;
    return selectedJob.logs.filter((line) =>
      line.toLowerCase().includes(logSearch.toLowerCase())
    );
  }, [selectedJob, logSearch]);

  const copyTerminalLogs = () => {
    if (!selectedJob) return;
    navigator.clipboard.writeText(selectedJob.logs.join('\n'));
    setCopiedLog(true);
    setTimeout(() => setCopiedLog(false), 2000);
  };

  const copyExecutionCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  return (
    <div className="h-full flex flex-col min-h-0 overflow-hidden gap-3">
      {/* Compact GitHub Actions Toolbar: Status Filters (Left) + Inline Thermal Guard Controls (Right) */}
      <div className="gh-box px-3 py-2 bg-[#F6F8FA] flex flex-wrap items-center justify-between gap-2 shrink-0">
        {/* Left: Status Filter Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {[
            { label: 'All runs', val: counts.total, filter: 'all' },
            { label: 'Completed', val: counts.completed, filter: 'completed' },
            { label: 'Running', val: counts.running, filter: 'running' },
            { label: 'Queued', val: counts.queued, filter: 'queued' },
            { label: 'Failed', val: counts.failed, filter: 'failed' },
          ].map((item) => {
            const active = statusFilter === item.filter;
            return (
              <button
                key={item.filter}
                onClick={() => setStatusFilter(item.filter)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#1F2328] text-white'
                    : 'bg-white text-[#24292F] border border-[#D0D7DE] hover:bg-[#F3F4F6]'
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    active ? 'bg-[#32383F] text-white' : 'bg-[#EFF1F3] text-[#24292F]'
                  }`}
                >
                  {item.val}
                </span>
              </button>
            );
          })}

          {activeProject && (
            <button
              onClick={() => setFilterByProject(!filterByProject)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                filterByProject
                  ? 'bg-[#0969DA] text-white'
                  : 'bg-white text-[#24292F] border border-[#D0D7DE] hover:bg-[#F3F4F6]'
              }`}
              title="Toggle Project Scoped Runs vs All Projects"
            >
              <span>{filterByProject ? `Project: ${activeProject.name.slice(0, 18)}...` : 'Show All Projects'}</span>
            </button>
          )}
        </div>

        {/* Right: Compact Inline Hardware & Thermal Guard Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-1.5 bg-white border border-[#D0D7DE] rounded-md px-2 py-1">
            <Cpu className="w-3.5 h-3.5 text-[#656D76]" />
            <span className="text-[#656D76] font-medium">Threads:</span>
            <select
              value={thermalGuard.max_threads}
              onChange={(e) =>
                onUpdateThermalGuard({
                  ...thermalGuard,
                  max_threads: Number(e.target.value),
                })
              }
              aria-label="Max CPU Threads"
              className="font-mono font-semibold text-[#1F2328] bg-transparent focus:outline-none cursor-pointer"
            >
              {[1, 2, 4, 6, 8, 12, 16, 24, 32].map((t) => (
                <option key={t} value={t}>
                  {t}T
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#D0D7DE] rounded-md px-2 py-1">
            <span className="text-[#656D76] font-medium">RAM Cap:</span>
            <select
              value={thermalGuard.max_ram_gb}
              onChange={(e) =>
                onUpdateThermalGuard({
                  ...thermalGuard,
                  max_ram_gb: Number(e.target.value),
                })
              }
              aria-label="Max RAM Allocation"
              className="font-mono font-semibold text-[#1F2328] bg-transparent focus:outline-none cursor-pointer"
            >
              {[4, 8, 12, 16, 24, 32, 64].map((gb) => (
                <option key={gb} value={gb}>
                  {gb} GB
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-[#D0D7DE] rounded-md px-2 py-1">
            <Snowflake className="w-3.5 h-3.5 text-[#8250DF]" />
            <span className="text-[#656D76] font-medium">Cooldown:</span>
            <select
              value={thermalGuard.cooldown_seconds}
              onChange={(e) =>
                onUpdateThermalGuard({
                  ...thermalGuard,
                  cooldown_seconds: Number(e.target.value),
                })
              }
              aria-label="Thermal Cooldown Seconds"
              className="font-mono font-semibold text-[#1F2328] bg-transparent focus:outline-none cursor-pointer"
            >
              {[30, 60, 120, 180, 300, 420].map((s) => (
                <option key={s} value={s}>
                  {s}s
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() =>
              onUpdateThermalGuard({ ...thermalGuard, enabled: !thermalGuard.enabled })
            }
            className={thermalGuard.enabled ? 'gh-btn-primary' : 'gh-btn-secondary'}
          >
            {thermalGuard.enabled ? 'Guard: ON' : 'Guard: OFF'}
          </button>
        </div>
      </div>

      {/* Main 2-Pane Split: Left Workflow Runs List (5 cols) + Right Dark Console Log Viewer (7 cols) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden">
        {/* Left Pane: GitHub Actions Workflow Runs List */}
        <div className="lg:col-span-5 gh-box flex flex-col min-h-0 overflow-hidden">
          <div className="gh-box-header shrink-0">
            <span className="text-xs font-semibold text-[#1F2328]">
              Workflow Runs ({filteredJobs.length})
            </span>
            {statusFilter !== 'all' && (
              <button
                onClick={() => setStatusFilter('all')}
                className="text-[11px] text-[#0969DA] hover:underline cursor-pointer"
              >
                Reset filter
              </button>
            )}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[#D0D7DE]/60 bg-white">
            {filteredJobs.length === 0 ? (
              <div className="p-8 text-center text-[#656D76] text-xs">
                No workflow runs match the selected filter.
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJob?.id === job.id;
                return (
                  <div
                    key={job.id}
                    onClick={() => setSelectedJobId(job.id)}
                    className={`p-3 transition-colors cursor-pointer border-l-2 ${
                      isSelected
                        ? 'border-l-[#FD8C73] bg-[#F6F8FA]'
                        : 'border-l-transparent hover:bg-[#F6F8FA]/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <div className="mt-0.5">{renderStatusIcon(job.status, job.output_files_verified)}</div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-[#1F2328] truncate">
                              {job.name}
                            </span>
                            <span className="gh-badge font-mono text-[10px] py-0">
                              {job.tool_name}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#656D76] mt-0.5">
                            {job.stage_name} · {job.samples?.length || 1} sample(s) ·{' '}
                            <span className="font-mono">{formatDuration(job.duration_seconds)}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onInspectJobCode(job);
                          }}
                          className="gh-btn-secondary py-0.5 px-2 text-[11px]"
                          title="Inspect Executed CLI & Beginner Guide"
                        >
                          <Code2 className="w-3 h-3" />
                          <span>CLI</span>
                        </button>
                        {(job.status === 'running' ||
                          job.status === 'queued' ||
                          job.status === 'cooling_down') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onCancelJob(job.id);
                            }}
                            className="px-2 py-0.5 text-[11px] font-medium text-[#CF222E] hover:bg-[#FFEBE9] rounded-md border border-[#FF8182]/40 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Compact Progress Bar */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-[#EFF1F3] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            job.status === 'completed'
                              ? 'bg-[#1A7F37]'
                              : job.status === 'failed'
                              ? 'bg-[#CF222E]'
                              : 'bg-[#0969DA]'
                          }`}
                          style={{ width: `${job.progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-[#656D76]">
                        {job.progress}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: GitHub Actions Dark Console Log Viewer */}
        <div className="lg:col-span-7 bg-[#0D1117] text-[#E6EDF3] border border-[#30363D] rounded-md overflow-hidden flex flex-col min-h-0">
          {/* Console Header */}
          <div className="bg-[#161B22] px-3 py-2 border-b border-[#30363D] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <Terminal className="w-3.5 h-3.5 text-[#8B949E] shrink-0" />
              <span className="text-xs font-mono font-semibold text-[#E6EDF3] truncate">
                {selectedJob ? `${selectedJob.name} (${selectedJob.tool_name})` : 'Console Output'}
              </span>
              {selectedJob && (
                <ProcessStatusDot
                  status={selectedJob.status}
                  outputFilesVerified={selectedJob.output_files_verified}
                  size="sm"
                  label={
                    selectedJob.status === 'completed'
                      ? 'Outputs Verified (Exit 0)'
                      : selectedJob.status === 'running'
                      ? 'Running...'
                      : selectedJob.status === 'failed'
                      ? `Failed (Exit ${selectedJob.exit_code || 1})`
                      : selectedJob.status
                  }
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3 h-3 text-[#8B949E] absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Find in logs..."
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="bg-[#0D1117] border border-[#30363D] rounded px-2 pl-6 py-0.5 text-[11px] font-mono text-[#E6EDF3] placeholder-[#8B949E] focus:outline-none focus:border-[#58A6FF] w-36"
                />
              </div>

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border cursor-pointer ${
                  autoScroll
                    ? 'bg-[#238636]/20 border-[#238636] text-[#3FB950]'
                    : 'bg-[#21262D] border-[#30363D] text-[#8B949E]'
                }`}
              >
                Follow: {autoScroll ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={copyTerminalLogs}
                className="text-[#8B949E] hover:text-white p-1 rounded cursor-pointer"
                title="Copy Raw Logs"
              >
                {copiedLog ? (
                  <Check className="w-3.5 h-3.5 text-[#3FB950]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          {/* Executed Command Strip */}
          {selectedJob && (
            <div className="bg-[#161B22]/60 px-3 py-1.5 border-b border-[#30363D] text-[11px] font-mono flex items-center justify-between gap-2 shrink-0">
              <div className="truncate text-[#8B949E]">
                <span className="text-[#3FB950] font-bold">$ </span>
                <span className="text-[#E6EDF3]">
                  wsl.exe -d Ubuntu -e bash -c &quot;conda run -n{' '}
                  {selectedJob.code_inspection?.conda_env || 'wgs_env'}{' '}
                  {selectedJob.tool_name}&quot;
                </span>
              </div>
              <button
                onClick={() =>
                  copyExecutionCommand(
                    `wsl.exe -d Ubuntu -e bash -c "conda run -n ${
                      selectedJob.code_inspection?.conda_env || 'wgs_env'
                    } ${selectedJob.tool_name}"`
                  )
                }
                className="text-[#8B949E] hover:text-white p-0.5 rounded shrink-0 cursor-pointer"
                title="Copy Command"
              >
                {copiedCmd ? (
                  <Check className="w-3 h-3 text-[#3FB950]" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>
          )}

          {/* Scrollable Log Lines */}
          <div className="flex-1 min-h-0 p-3 overflow-y-auto font-mono text-xs leading-relaxed space-y-0.5">
            {filteredLogs.length === 0 ? (
              <div className="text-[#8B949E] py-8 text-center text-xs">
                {selectedJob
                  ? 'No matching log lines.'
                  : 'Select a workflow run on the left to inspect its logs.'}
              </div>
            ) : (
              filteredLogs.map((log, index) => {
                const isStderr = log.includes('[STDERR]') || log.toLowerCase().includes('error');
                const isWarning = log.includes('[WARN]') || log.toLowerCase().includes('warning');
                const isCooling = log.includes('Thermal') || log.includes('Cooling');

                return (
                  <div
                    key={index}
                    className={`break-all flex ${
                      isStderr
                        ? 'text-[#FF7B72]'
                        : isWarning
                        ? 'text-[#D29922]'
                        : isCooling
                        ? 'text-[#D2A8FF]'
                        : 'text-[#E6EDF3]'
                    }`}
                  >
                    <span className="text-[#484F58] select-none w-8 shrink-0 text-right pr-3">
                      {index + 1}
                    </span>
                    <span className="flex-1">{log}</span>
                  </div>
                );
              })
            )}
            <div ref={terminalEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobMonitorView;
