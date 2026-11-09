import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Download,
  Terminal,
  FileCode,
  Layers,
  BookOpen,
  ShieldCheck,
  Cpu,
  Info,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { CodeInspectionResult, FlagBreakdown } from '../types/genome';

interface CodeInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  inspection: CodeInspectionResult | null;
  title?: string;
}

type TabType = 'cli' | 'bash' | 'nextflow' | 'conda';

export const CodeInspectorModal: React.FC<CodeInspectorModalProps> = ({
  isOpen,
  onClose,
  inspection,
  title,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('cli');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showWslWrapper, setShowWslWrapper] = useState(false);

  if (!isOpen || !inspection) return null;

  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((curr) => (curr === key ? null : curr));
    }, 2200);
  };

  const handleDownload = (content: string, filename: string, mime = 'text/plain') => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getCategoryBadge = (category: string) => {
    const cat = category.toLowerCase();
    if (cat.includes('executable') || cat.includes('binary')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (cat.includes('hardware') || cat.includes('memory') || cat.includes('thread')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (cat.includes('i/o') || cat.includes('input') || cat.includes('output') || cat.includes('stream')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (cat.includes('advanced')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-zinc-100 text-zinc-700 border-zinc-200';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-5xl bg-white rounded-xl shadow-2xl border border-zinc-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 bg-white flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-800 border border-zinc-300">
                <Sparkles className="w-3 h-3 text-zinc-700" />
                {inspection.stage_name}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                conda: {inspection.conda_env}
              </span>
            </div>
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
              {title || `${inspection.tool_name} — Executable Code & Reproducibility`}
            </h2>
            <p className="text-xs text-zinc-500">
              Interactive CLI anatomy, batch bash orchestrator with thermal safety cooldown, and Nextflow DSL2 cloud pipeline.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-zinc-200 bg-zinc-50/80 flex items-center gap-2 overflow-x-auto text-xs sm:text-sm font-medium">
          <button
            onClick={() => setActiveTab('cli')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'cli'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white rounded-t-md shadow-sm'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
            }`}
          >
            <Terminal className="w-4 h-4 text-zinc-700" />
            1. Exact CLI & Flag-by-Flag Guide
          </button>

          <button
            onClick={() => setActiveTab('bash')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'bash'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white rounded-t-md shadow-sm'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
            }`}
          >
            <FileCode className="w-4 h-4 text-zinc-700" />
            2. Bash Batch Script (50+ Genomes)
          </button>

          <button
            onClick={() => setActiveTab('nextflow')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'nextflow'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white rounded-t-md shadow-sm'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-zinc-700" />
            3. Nextflow DSL2 Pipeline (main.nf)
          </button>

          <button
            onClick={() => setActiveTab('conda')}
            className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'conda'
                ? 'border-zinc-900 text-zinc-900 font-semibold bg-white rounded-t-md shadow-sm'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100/60'
            }`}
          >
            <BookOpen className="w-4 h-4 text-zinc-700" />
            4. Conda YAML & Beginner Tips
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white space-y-6">
          {/* TAB 1: EXACT CLI COMMAND & FLAG-BY-FLAG GUIDE */}
          {activeTab === 'cli' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Conda Activation Callout */}
              <div className="p-3.5 bg-zinc-50 rounded-lg border border-zinc-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-700">
                  <ShieldCheck className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span className="font-semibold text-zinc-900">Step 1 — Activate Conda Environment:</span>
                  <code className="font-mono bg-zinc-200/80 px-2 py-0.5 rounded text-zinc-800">
                    {inspection.conda_activation_cmd}
                  </code>
                </div>
                <button
                  onClick={() => handleCopy(inspection.conda_activation_cmd, 'conda_act')}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 transition-colors shrink-0"
                >
                  {copiedKey === 'conda_act' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-zinc-600" />
                      <span>Copy Activation</span>
                    </>
                  )}
                </button>
              </div>

              {/* Single Sample Command Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-sm font-bold text-zinc-900">
                      Step 2 — Single-Sample Command Line Invocation
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowWslWrapper(!showWslWrapper)}
                      className="text-xs text-zinc-600 hover:text-zinc-900 underline underline-offset-2 transition-colors"
                    >
                      {showWslWrapper ? 'View Native Linux CLI' : 'View WSL2 Wrapped Command'}
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          showWslWrapper ? inspection.wsl_wrapped_command : inspection.single_sample_command,
                          'single_cmd'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black transition-colors shadow-sm"
                    >
                      {copiedKey === 'single_cmd' ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Copied Command!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-zinc-300" />
                          <span>Copy Command</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative group">
                  <pre className="p-4 bg-zinc-950 text-emerald-400 rounded-lg font-mono text-xs sm:text-sm overflow-x-auto border border-zinc-800 whitespace-pre-wrap leading-relaxed shadow-inner">
                    <code>
                      {showWslWrapper ? inspection.wsl_wrapped_command : inspection.single_sample_command}
                    </code>
                  </pre>
                </div>
              </div>

              {/* Flag-by-Flag Educational Breakdown Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-900" />
                    <h3 className="text-sm font-bold text-zinc-900">
                      Beginner Flag-by-Flag Anatomy & Scientific Rationale
                    </h3>
                  </div>
                  <span className="text-xs text-zinc-500">
                    {inspection.flag_breakdown.length} parameters analyzed
                  </span>
                </div>

                <div className="overflow-hidden border border-zinc-200 rounded-lg shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-50 text-zinc-700 uppercase tracking-wider font-semibold border-b border-zinc-200">
                      <tr>
                        <th className="py-2.5 px-3 w-1/4">Token / Flag</th>
                        <th className="py-2.5 px-3 w-1/6">Category</th>
                        <th className="py-2.5 px-3 w-1/3">Biological & Computational Meaning</th>
                        <th className="py-2.5 px-3">Why Used In This Pipeline</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 bg-white">
                      {inspection.flag_breakdown.map((flag: FlagBreakdown, idx: number) => (
                        <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-zinc-900 font-semibold align-top">
                            <span className="inline-block bg-zinc-100 text-zinc-900 px-2 py-0.5 rounded border border-zinc-200 font-mono text-xs">
                              {flag.token}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 align-top">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-medium border ${getCategoryBadge(
                                flag.category
                              )}`}
                            >
                              {flag.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-zinc-700 leading-relaxed align-top">
                            {flag.meaning}
                          </td>
                          <td className="py-2.5 px-3 text-zinc-600 leading-relaxed align-top">
                            {flag.why_used}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AUTOMATED BASH BATCH SCRIPT (50+ GENOMES) */}
          {activeTab === 'bash' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-zinc-900 text-white">
                      Automated Batch Script
                    </span>
                    <span className="text-xs font-medium text-zinc-700">
                      Loops across 50+ genomes with thermal safety pause
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Includes directory creation, stderr log trapping with <code className="font-mono">tee</code>, and 180s CPU cooldown to prevent laptop thermal throttling (&gt;90°C).
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(inspection.bash_batch_script, 'batch_bash')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 transition-colors"
                  >
                    {copiedKey === 'batch_bash' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Copy Script</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleDownload(
                        inspection.bash_batch_script,
                        `run_batch_${inspection.tool_id}.sh`,
                        'application/x-sh'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Download .sh</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800 max-h-[460px] overflow-y-auto leading-relaxed shadow-inner">
                  <code>{inspection.bash_batch_script}</code>
                </pre>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">How to run in your WSL2 / Ubuntu terminal:</span>
                  <p className="mt-0.5 text-amber-800 font-mono text-[11px]">
                    chmod +x run_batch_{inspection.tool_id}.sh && ./run_batch_{inspection.tool_id}.sh
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: NEXTFLOW DSL2 PIPELINE (main.nf) */}
          {activeTab === 'nextflow' && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-zinc-50 rounded-lg border border-zinc-200">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white">
                      Nextflow DSL2
                    </span>
                    <span className="text-xs font-medium text-zinc-700">
                      Standardized, containerized HPC & Cloud Pipeline
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    Fully compatible with local WSL2, SLURM cluster executors, Docker, Singularity, and AWS HealthOmics.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(inspection.nextflow_dsl2_script, 'nextflow_code')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 transition-colors"
                  >
                    {copiedKey === 'nextflow_code' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-zinc-600" />
                        <span>Copy main.nf</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() =>
                      handleDownload(
                        inspection.nextflow_dsl2_script,
                        `main_${inspection.tool_id}.nf`,
                        'text/plain'
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5 text-zinc-300" />
                    <span>Download main.nf</span>
                  </button>
                </div>
              </div>

              <div className="relative">
                <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800 max-h-[460px] overflow-y-auto leading-relaxed shadow-inner">
                  <code>{inspection.nextflow_dsl2_script}</code>
                </pre>
              </div>

              <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-center justify-between text-xs text-zinc-700">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-zinc-600 shrink-0" />
                  <span>Execute with local Conda profile:</span>
                  <code className="font-mono bg-zinc-200 px-2 py-0.5 rounded text-zinc-900">
                    nextflow run main.nf -profile conda
                  </code>
                </div>
                <span className="text-[11px] text-zinc-400">Enterprise Ready</span>
              </div>
            </div>
          )}

          {/* TAB 4: CONDA YAML & BEGINNER TIPS */}
          {activeTab === 'conda' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Conda Environment YAML */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-zinc-900" />
                      <h3 className="text-sm font-bold text-zinc-900">
                        Conda Environment YAML
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleCopy(inspection.conda_yaml, 'conda_yaml')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 transition-colors"
                      >
                        {copiedKey === 'conda_yaml' ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3 text-zinc-600" />
                        )}
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() =>
                          handleDownload(
                            inspection.conda_yaml,
                            `environment_${inspection.conda_env}.yml`,
                            'application/x-yaml'
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
                      >
                        <Download className="w-3 h-3 text-zinc-300" />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <div className="relative">
                    <pre className="p-3.5 bg-zinc-950 text-amber-300 rounded-lg font-mono text-xs overflow-x-auto border border-zinc-800 leading-relaxed shadow-inner">
                      <code>{inspection.conda_yaml}</code>
                    </pre>
                  </div>

                  <div className="p-2.5 bg-zinc-50 rounded border border-zinc-200 text-[11px] text-zinc-600 flex items-center gap-2">
                    <span className="font-semibold text-zinc-800">Recreate on any PC:</span>
                    <code className="font-mono bg-zinc-200 px-1.5 py-0.5 rounded text-zinc-900">
                      conda env create -f environment.yml
                    </code>
                  </div>
                </div>

                {/* Beginner Tips & Best Practices */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-bold text-zinc-900">
                      Bioinformatics Best Practices & Tips
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {inspection.beginner_tips.map((tip: string, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg flex items-start gap-2.5 text-xs text-zinc-700 leading-relaxed"
                      >
                        <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-800 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <div>{tip}</div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold">Publication Standard:</span> Always report the exact tool version (<code className="font-mono text-[11px]">{inspection.tool_name}</code>) and command flags in your Materials &amp; Methods section for peer-reviewed reproducibility.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 bg-zinc-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 text-zinc-500">
            <span>Environment: <strong className="text-zinc-800">{inspection.conda_env}</strong></span>
            <span>•</span>
            <span>Tool ID: <strong className="text-zinc-800">{inspection.tool_id}</strong></span>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 text-zinc-800 border border-zinc-300 hover:bg-zinc-200 transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => handleCopy(inspection.single_sample_command, 'footer_copy')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 active:bg-black transition-colors shadow-sm"
            >
              {copiedKey === 'footer_copy' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied Single Command!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Copy Single Command</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeInspectorModal;
