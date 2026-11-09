import React, { useState } from 'react';
import {
  Globe,
  X,
  Server,
  Cloud,
  Wifi,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  Zap,
  Terminal,
  Cpu,
  Layers,
} from 'lucide-react';

interface OnlineShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnlineShareModal: React.FC<OnlineShareModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'cloud' | 'tunnel' | 'wifi' | 'docker'>('cloud');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white border border-[#D0D7DE] rounded-xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F8FA] border-b border-[#D0D7DE]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0969DA]/10 text-[#0969DA] rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1F2328]">
                Share & Access GenomeLab Online for Free
              </h2>
              <p className="text-xs text-[#656D76]">
                Make GenomeLab accessible to anyone worldwide through their browser
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#656D76] hover:text-[#1F2328] hover:bg-[#EAEFF5] rounded-md transition-colors"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#D0D7DE] bg-[#F6F8FA]/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('cloud')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'cloud'
                ? 'border-[#0969DA] text-[#0969DA] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            Permanent Cloud Hosting (Free)
          </button>
          <button
            onClick={() => setActiveTab('tunnel')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'tunnel'
                ? 'border-[#0969DA] text-[#0969DA] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-[#D29922]" />
            1-Click Live Tunnel (Share Your PC)
          </button>
          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'wifi'
                ? 'border-[#0969DA] text-[#0969DA] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            Local Lab Wi-Fi / LAN
          </button>
          <button
            onClick={() => setActiveTab('docker')}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all ${
              activeTab === 'docker'
                ? 'border-[#0969DA] text-[#0969DA] bg-white rounded-t-md shadow-xs'
                : 'border-transparent text-[#656D76] hover:text-[#1F2328]'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Docker 1-Liner
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* TAB 1: PERMANENT CLOUD HOSTING */}
          {activeTab === 'cloud' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#EFF8FF] border border-[#B6E3FF] rounded-lg text-xs text-[#0969DA] flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold">Zero-Cost Cloud Deployment:</span> You can deploy GenomeLab to permanent cloud servers where anyone with your public URL can access and analyze genomes completely free.
                </div>
              </div>

              {/* Option A: Hugging Face Spaces */}
              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white hover:border-[#0969DA] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🤗</span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2328]">
                        Hugging Face Spaces (Recommended for Genomics)
                      </h3>
                      <p className="text-xs text-[#656D76]">
                        Most generous free tier: <strong className="text-[#1A7F37]">16 GB RAM</strong>, 2 vCPUs, 50 GB storage, free HTTPS.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1A7F37] bg-[#EAF5EC] px-2.5 py-0.5 rounded-full border border-[#2DA44E]/30">
                    100% Free Forever
                  </span>
                </div>

                <div className="text-xs text-[#1F2328] space-y-1.5 pl-2 border-l-2 border-[#D0D7DE]">
                  <p>1. Go to <a href="https://huggingface.co/new-space" target="_blank" rel="noreferrer" className="text-[#0969DA] hover:underline inline-flex items-center gap-1 font-medium">huggingface.co/new-space <ExternalLink className="w-3 h-3" /></a></p>
                  <p>2. Set Space SDK to <strong className="font-mono bg-[#F6F8FA] px-1 py-0.5 rounded border border-[#D0D7DE]">Docker</strong> (Blank template).</p>
                  <p>3. Push this project repository or upload <code className="bg-[#F6F8FA] px-1 py-0.5 rounded border border-[#D0D7DE]">Dockerfile</code>, <code className="bg-[#F6F8FA] px-1 py-0.5 rounded border border-[#D0D7DE]">backend/</code>, and <code className="bg-[#F6F8FA] px-1 py-0.5 rounded border border-[#D0D7DE]">frontend/</code>.</p>
                  <p>4. Your app builds automatically and is hosted live at: <code className="font-mono bg-[#F6F8FA] text-[#0969DA] px-1 py-0.5 rounded border border-[#D0D7DE]">https://huggingface.co/spaces/YOUR_USER/genomelab</code></p>
                </div>
              </div>

              {/* Option B: Render */}
              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white hover:border-[#0969DA] transition-colors space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">⚡</span>
                    <div>
                      <h3 className="text-sm font-semibold text-[#1F2328]">
                        Render.com (Free Web Service)
                      </h3>
                      <p className="text-xs text-[#656D76]">
                        Free SSL certificates, custom domain support, and automated GitHub deploys.
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-[#1A7F37] bg-[#EAF5EC] px-2.5 py-0.5 rounded-full border border-[#2DA44E]/30">
                    Free Tier
                  </span>
                </div>

                <div className="text-xs text-[#1F2328] space-y-1.5 pl-2 border-l-2 border-[#D0D7DE]">
                  <p>1. Connect your GitHub repository to <a href="https://render.com" target="_blank" rel="noreferrer" className="text-[#0969DA] hover:underline inline-flex items-center gap-1 font-medium">render.com <ExternalLink className="w-3 h-3" /></a></p>
                  <p>2. Select <strong>New Web Service</strong> -&gt; Environment: <strong>Docker</strong>.</p>
                  <p>3. Render builds and hosts the app on <code className="font-mono bg-[#F6F8FA] text-[#0969DA] px-1 py-0.5 rounded border border-[#D0D7DE]">https://genomelab.onrender.com</code>.</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 1-CLICK LIVE TUNNEL */}
          {activeTab === 'tunnel' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#FFF8C5] border border-[#D4A72C]/40 rounded-lg text-xs text-[#7D4E00] flex items-start gap-2.5">
                <Zap className="w-4 h-4 mt-0.5 shrink-0 text-[#D29922]" />
                <div>
                  <span className="font-semibold">Instant Global Sharing from Your Computer:</span>
                  <p className="mt-0.5">
                    Share your live GenomeLab instance with colleagues or students anywhere in the world. They will use your computer's WSL2, CPU, and RAM through their browser without installing anything!
                  </p>
                </div>
              </div>

              {/* Windows 1-Click Launch */}
              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-[#1F2328] uppercase tracking-wide flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-[#0969DA]" />
                    Option 1: Double-Click Batch File (Windows)
                  </h4>
                  <span className="text-[11px] text-[#656D76]">Zero Configuration</span>
                </div>
                <p className="text-xs text-[#656D76]">
                  Double-click <code className="bg-[#F6F8FA] px-1.5 py-0.5 rounded border border-[#D0D7DE] font-semibold text-[#1F2328]">share_online.bat</code> in the project folder. It starts an encrypted Cloudflare Tunnel and gives you a free HTTPS link:
                </p>
                <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between">
                  <code>.\share_online.bat</code>
                  <button
                    onClick={() => handleCopy('.\\share_online.bat', 'bat')}
                    className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedKey === 'bat' ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Linux / Mac / WSL2 Launch */}
              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-3">
                <h4 className="text-xs font-semibold text-[#1F2328] uppercase tracking-wide flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#0969DA]" />
                  Option 2: Bash Shell (Linux / macOS / WSL2)
                </h4>
                <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between">
                  <code>./share_online.sh</code>
                  <button
                    onClick={() => handleCopy('./share_online.sh', 'sh')}
                    className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedKey === 'sh' ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Node.js Localtunnel Alternative */}
              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-2">
                <h4 className="text-xs font-semibold text-[#1F2328] uppercase tracking-wide">
                  Option 3: Quick NPX Tunnel
                </h4>
                <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between">
                  <code>npx localtunnel --port 8000</code>
                  <button
                    onClick={() => handleCopy('npx localtunnel --port 8000', 'lt')}
                    className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedKey === 'lt' ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOCAL WI-FI / LAN */}
          {activeTab === 'wifi' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F6F8FA] border border-[#D0D7DE] rounded-lg text-xs text-[#1F2328] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#0969DA]">
                  <Wifi className="w-4 h-4" />
                  Access from Any Device on the Same Wi-Fi / Local Network
                </div>
                <p className="text-[#656D76]">
                  Anyone connected to the same laboratory, office, or home Wi-Fi network (such as colleagues on laptops, or yourself on an iPad or phone) can open GenomeLab directly:
                </p>
                <div className="bg-white border border-[#D0D7DE] p-3 rounded font-mono text-xs text-[#1F2328] flex items-center justify-between">
                  <span>http://&lt;YOUR_LOCAL_IP&gt;:8000</span>
                  <span className="text-[11px] text-[#656D76]">e.g. http://192.168.1.50:8000</span>
                </div>
              </div>

              <div className="space-y-2 text-xs text-[#1F2328]">
                <h4 className="font-semibold text-xs text-[#1F2328]">How to find your local IP address:</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="border border-[#D0D7DE] rounded p-3 bg-white space-y-1.5">
                    <span className="font-semibold text-[11px] text-[#656D76] uppercase">Windows PowerShell</span>
                    <div className="bg-[#1F2328] text-white font-mono text-xs p-2 rounded flex justify-between items-center">
                      <code>ipconfig</code>
                      <button onClick={() => handleCopy('ipconfig', 'ipc')} className="text-[#8C959F] hover:text-white">
                        {copiedKey === 'ipc' ? <Check className="w-3 h-3 text-[#2DA44E]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#656D76]">Look for "IPv4 Address" (e.g. 192.168.X.X)</p>
                  </div>

                  <div className="border border-[#D0D7DE] rounded p-3 bg-white space-y-1.5">
                    <span className="font-semibold text-[11px] text-[#656D76] uppercase">Linux / macOS</span>
                    <div className="bg-[#1F2328] text-white font-mono text-xs p-2 rounded flex justify-between items-center">
                      <code>hostname -I</code>
                      <button onClick={() => handleCopy('hostname -I', 'hsi')} className="text-[#8C959F] hover:text-white">
                        {copiedKey === 'hsi' ? <Check className="w-3 h-3 text-[#2DA44E]" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                    <p className="text-[11px] text-[#656D76]">Outputs your active network IP address</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DOCKER 1-LINER */}
          {activeTab === 'docker' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F6F8FA] border border-[#D0D7DE] rounded-lg text-xs text-[#1F2328] space-y-2">
                <div className="flex items-center gap-2 font-semibold text-[#0969DA]">
                  <Server className="w-4 h-4" />
                  Single-Command Docker Deployment
                </div>
                <p className="text-[#656D76]">
                  Anyone with Docker installed on Windows, Mac, or Linux can launch GenomeLab with one single command:
                </p>
              </div>

              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#1F2328]">Method A: Docker Compose</span>
                  <span className="text-[11px] text-[#656D76]">Runs in background</span>
                </div>
                <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between">
                  <code>docker compose up -d</code>
                  <button
                    onClick={() => handleCopy('docker compose up -d', 'dcu')}
                    className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white"
                  >
                    {copiedKey === 'dcu' ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="border border-[#D0D7DE] rounded-lg p-4 bg-white space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-[#1F2328]">Method B: Build & Run Directly</span>
                  <span className="text-[11px] text-[#656D76]">Maps to port 8000</span>
                </div>
                <div className="bg-[#1F2328] text-white font-mono text-xs p-3 rounded-md flex items-center justify-between">
                  <code>docker build -t genomelab . && docker run -p 8000:7860 genomelab</code>
                  <button
                    onClick={() => handleCopy('docker build -t genomelab . && docker run -p 8000:7860 genomelab', 'dr')}
                    className="p-1 hover:bg-white/20 rounded text-[#8C959F] hover:text-white"
                  >
                    {copiedKey === 'dr' ? <Check className="w-3.5 h-3.5 text-[#2DA44E]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#F6F8FA] border-t border-[#D0D7DE] flex items-center justify-between text-xs text-[#656D76]">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#1A7F37]" />
            Free, open-source bioinformatics for all researchers worldwide.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#1F2328] text-white hover:bg-[#2F343C] font-medium rounded-md shadow-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
