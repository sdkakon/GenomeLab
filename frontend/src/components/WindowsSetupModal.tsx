import React, { useState } from 'react';
import {
  X,
  Laptop,
  Download,
  Terminal,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  Cpu,
  RefreshCw,
} from 'lucide-react';
import { testBackendConnection } from '../services/api';

interface WindowsSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const WindowsSetupModal: React.FC<WindowsSetupModalProps> = ({
  isOpen,
  onClose,
  onConnected,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const quickPowerShellCmd =
    'powershell -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/sdkakon/GenomeLab/main/setup_windows_wsl_wgs.ps1 | iex"';

  const handleCopyCmd = () => {
    navigator.clipboard.writeText(quickPowerShellCmd);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleDownloadBat = () => {
    const batContent = `@echo off\r\ntitle GenomeLab — 1-Click Windows & WSL2 Setup\r\ncd /d "%~dp0"\r\necho Starting GenomeLab 1-Click Windows Setup...\r\npowershell.exe -NoProfile -ExecutionPolicy Bypass -Command "irm https://raw.githubusercontent.com/sdkakon/GenomeLab/main/setup_windows_wsl_wgs.ps1 | iex"\r\npause\r\n`;
    const blob = new Blob([batContent], { type: 'application/x-bat;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'setup_windows_wsl_wgs.bat';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const checkConnection = async () => {
    setIsVerifying(true);
    const res = await testBackendConnection('http://localhost:8000/api');
    setConnected(res.success);
    setIsVerifying(false);
    if (res.success && onConnected) {
      onConnected();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-[#D0D7DE] rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F8FA] border-b border-[#D0D7DE]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0969DA]/10 text-[#0969DA] rounded-lg">
              <Laptop className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1F2328]">
                1-Click Windows & WSL2 WGS Setup Wizard
              </h2>
              <p className="text-xs text-[#656D76]">
                Automatic setup for standard Windows 10/11: WSL2 Ubuntu + Miniforge3 + wgs_env
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

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-[#1F2328]">
          {/* Status banner */}
          <div className="p-3.5 bg-[#EFF8FF] border border-[#B6E3FF] rounded-lg flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0969DA] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#0969DA]">No Linux Experience Required:</span>
              <p className="text-[#1F2328] mt-0.5 leading-relaxed">
                If your computer has only Windows, this 1-click wizard installs everything needed in the background: <strong>WSL2 Ubuntu</strong>, <strong>Miniforge3</strong> (Mamba + Conda), and the <strong>wgs_env</strong> bioinformatics toolchain.
              </p>
            </div>
          </div>

          {/* Option A: Download 1-Click .bat */}
          <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-[#1F2328] uppercase tracking-wide flex items-center gap-1.5">
                <Download className="w-4 h-4 text-[#1A7F37]" />
                Method 1: Download 1-Click Batch Installer (.bat)
              </h3>
              <span className="bg-[#EAF5EC] text-[#1A7F37] px-2 py-0.5 rounded font-semibold text-[10px]">
                Recommended
              </span>
            </div>
            <p className="text-[#656D76]">
              Download and double-click the setup file on your Windows computer. It handles all installation steps automatically:
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleDownloadBat}
                className="flex items-center gap-2 px-4 py-2 bg-[#1F2328] hover:bg-[#2F343C] text-white rounded-md font-medium text-xs shadow-xs transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download setup_windows_wsl_wgs.bat</span>
              </button>
              <span className="text-[11px] text-[#656D76]">Safe Windows batch script (~2 KB)</span>
            </div>
          </div>

          {/* Option B: 1-Liner PowerShell Command */}
          <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-2.5 shadow-xs">
            <h3 className="font-semibold text-xs text-[#1F2328] uppercase tracking-wide flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-[#0969DA]" />
              Method 2: Run in PowerShell (1 Line)
            </h3>
            <p className="text-[#656D76]">
              Open PowerShell on your Windows PC and paste this command:
            </p>
            <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between gap-2 overflow-x-auto">
              <code className="text-zinc-200 truncate">{quickPowerShellCmd}</code>
              <button
                onClick={handleCopyCmd}
                className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white transition-colors shrink-0 cursor-pointer"
                title="Copy command"
              >
                {copiedCmd ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* What gets installed checklist */}
          <div className="border border-[#D0D7DE] rounded-lg p-4 bg-[#F6F8FA] space-y-2.5">
            <h4 className="font-semibold text-xs text-[#1F2328]">What the 1-Click Setup Configures:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#656D76]">
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#D0D7DE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA44E] shrink-0" />
                <span>WSL2 Ubuntu 22.04 LTS Kernel</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#D0D7DE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA44E] shrink-0" />
                <span>Miniforge3 (Mamba + Conda)</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#D0D7DE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA44E] shrink-0" />
                <span>'wgs_env' Bioconda Environment</span>
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded border border-[#D0D7DE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#2DA44E] shrink-0" />
                <span>Local Engine Bridge (Port 8000)</span>
              </div>
            </div>
          </div>

          {/* Test Connection Button */}
          <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white flex items-center justify-between">
            <div>
              <span className="font-semibold text-xs text-[#1F2328]">Already ran the script?</span>
              <p className="text-[11px] text-[#656D76]">
                Click below to test if your computer is connected to the webapp.
              </p>
            </div>
            <button
              onClick={checkConnection}
              disabled={isVerifying}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0969DA] hover:bg-[#0860CA] text-white rounded-md font-medium text-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>Verify Connection</span>
            </button>
          </div>

          {connected !== null && (
            <div
              className={`p-3 rounded-md flex items-center gap-2 text-xs font-medium ${
                connected
                  ? 'bg-[#EAF5EC] text-[#1A7F37] border border-[#2DA44E]/30'
                  : 'bg-[#FFF8C5] text-[#7D4E00] border border-[#D4A72C]/40'
              }`}
            >
              {connected ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-[#2DA44E]" />
                  <span>Success! Your Windows PC is connected. The webapp will now use your machine's tools.</span>
                </>
              ) : (
                <>
                  <span>Local engine not detected on http://localhost:8000 yet. Run the script and try again!</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#F6F8FA] border-t border-[#D0D7DE] flex items-center justify-between text-xs text-[#656D76]">
          <span>100% Free · Open-Source · Runs locally on your hardware</span>
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
