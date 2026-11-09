import React, { useState, useEffect } from 'react';
import {
  Laptop,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Shield,
  Lock,
  Cpu,
  ExternalLink,
  Terminal,
  Zap,
} from 'lucide-react';
import { getBackendBaseUrl, setBackendBaseUrl, testBackendConnection } from '../services/api';

interface ComputeEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEngineChange?: () => void;
}

export const ComputeEngineModal: React.FC<ComputeEngineModalProps> = ({
  isOpen,
  onClose,
  onEngineChange,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>(getBackendBaseUrl());
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    version?: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCurrentUrl(getBackendBaseUrl());
      checkConnection();
    }
  }, [isOpen]);

  const checkConnection = async (urlToCheck?: string) => {
    setIsTesting(true);
    setTestResult(null);
    const target = urlToCheck || currentUrl;
    const res = await testBackendConnection(target);
    setTestResult(res);
    setIsTesting(false);
  };

  const handleApplyUrl = (newUrl: string) => {
    setCurrentUrl(newUrl);
    setBackendBaseUrl(newUrl);
    checkConnection(newUrl);
    if (onEngineChange) onEngineChange();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#D0D7DE] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F8FA] border-b border-[#D0D7DE]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1A7F37]/10 text-[#1A7F37] rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1F2328]">
                Personal Computer Compute Engine
              </h2>
              <p className="text-xs text-[#656D76]">
                Zero-knowledge architecture: All analyses run strictly on your own hardware
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#656D76] hover:text-[#1F2328] hover:bg-[#EAEFF5] rounded-md transition-colors cursor-pointer"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#1F2328]">
          {/* Privacy Guarantee Alert */}
          <div className="p-3.5 bg-[#EFF8FF] border border-[#B6E3FF] rounded-lg flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#0969DA] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-[#0969DA]">Complete Privacy & Isolation:</div>
              <p className="text-[#1F2328] leading-relaxed">
                This web application does <strong>not</strong> run your genome files on anyone else's server. Every visitor gets their own fresh, private workspace. When you execute tools, commands run strictly on <strong>your personal computer</strong> or inside your browser sandbox.
              </p>
            </div>
          </div>

          {/* Current Connection Status */}
          <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#1F2328] uppercase tracking-wide">
                Current Compute Engine
              </span>
              <button
                onClick={() => checkConnection()}
                disabled={isTesting}
                className="flex items-center gap-1 text-[#0969DA] hover:underline cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test Connection</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={currentUrl}
                onChange={(e) => setCurrentUrl(e.target.value)}
                placeholder="http://localhost:8000/api"
                className="flex-1 px-3 py-1.5 border border-[#D0D7DE] rounded-md font-mono text-xs focus:outline-none focus:border-[#0969DA] focus:ring-2 focus:ring-[#0969DA]/20"
              />
              <button
                onClick={() => handleApplyUrl(currentUrl)}
                className="px-3 py-1.5 bg-[#1F2328] text-white hover:bg-[#2F343C] font-medium rounded-md cursor-pointer transition-colors"
              >
                Connect
              </button>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                className={`p-3 rounded-md flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-[#EAF5EC] text-[#1A7F37] border border-[#2DA44E]/30'
                    : 'bg-[#FFF8C5] text-[#7D4E00] border border-[#D4A72C]/40'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-[#2DA44E]" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-[#D29922]" />
                )}
                <div>
                  <span className="font-semibold">{testResult.message}</span>
                  {!testResult.success && (
                    <p className="mt-0.5 text-[11px]">
                      Operating in <strong>Browser Sandbox Mode</strong>. You can design workflows, inspect CLI code, and generate charts. To run real WSL2 tools, launch the local engine below.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* How to Connect Your Personal Computer */}
          <div className="space-y-3">
            <h3 className="font-semibold text-xs text-[#1F2328] uppercase tracking-wide flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#0969DA]" />
              How to Connect Your Computer (1 Step)
            </h3>
            <p className="text-[#656D76]">
              If you want this web app to execute real Whole-Genome Sequencing tools (like FastQC, SPAdes, Prokka, Roary, and Snippy in your computer's WSL2 environment), run the engine on your computer:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option 1: Double click bat */}
              <div className="border border-[#D0D7DE] rounded-lg p-3 bg-white space-y-1.5">
                <span className="font-semibold text-[#1F2328]">Windows (1-Click)</span>
                <p className="text-[#656D76] text-[11px]">
                  Double-click <code className="bg-[#F6F8FA] px-1 py-0.5 rounded border border-[#D0D7DE] font-semibold text-[#1F2328]">start_workbench.bat</code> on your PC.
                </p>
                <div className="bg-[#1F2328] text-white font-mono text-[11px] p-2 rounded">
                  <code>start_workbench.bat</code>
                </div>
              </div>

              {/* Option 2: Linux / Mac / WSL2 */}
              <div className="border border-[#D0D7DE] rounded-lg p-3 bg-white space-y-1.5">
                <span className="font-semibold text-[#1F2328]">Linux / macOS / WSL2</span>
                <p className="text-[#656D76] text-[11px]">
                  Run Python backend in your terminal:
                </p>
                <div className="bg-[#1F2328] text-white font-mono text-[11px] p-2 rounded">
                  <code>python -m backend.main</code>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Engine Presets */}
          <div className="border border-[#D0D7DE] rounded-lg p-3 bg-[#F6F8FA] flex items-center justify-between">
            <div>
              <span className="font-semibold text-[#1F2328]">Switch to Browser Sandbox</span>
              <p className="text-[#656D76] text-[11px]">
                Runs 100% in your browser with zero installation needed.
              </p>
            </div>
            <button
              onClick={() => handleApplyUrl('/api')}
              className="px-3 py-1.5 bg-white border border-[#D0D7DE] hover:bg-[#F3F4F6] text-[#1F2328] font-medium rounded-md cursor-pointer transition-colors shadow-xs"
            >
              Reset to Default
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F6F8FA] border-t border-[#D0D7DE] flex items-center justify-between text-xs text-[#656D76]">
          <span className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#1A7F37]" />
            Your files and code stay 100% on your machine.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1F2328] text-white hover:bg-[#2F343C] font-medium rounded-md shadow-xs transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
