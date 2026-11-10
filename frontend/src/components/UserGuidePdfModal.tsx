import React from 'react';
import {
  FileText,
  Printer,
  X,
  CheckCircle2,
  Laptop,
  Terminal,
  ShieldCheck,
  Dna,
  Layers,
  BarChart3,
  BookOpen,
  Download,
} from 'lucide-react';

interface UserGuidePdfModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuidePdfModal: React.FC<UserGuidePdfModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white border border-[#D0D7DE] rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden print:max-h-none print:h-auto print:border-none print:shadow-none print:rounded-none">
        {/* Header - Hidden in Print */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#F6F8FA] border-b border-[#D0D7DE] print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#0969DA]/10 text-[#0969DA] rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#1F2328]">
                GenomeLab User Guide & Documentation
              </h2>
              <p className="text-xs text-[#656D76]">
                Step-by-step instructions for Windows engine setup, pipeline execution & R/Python charts
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1F2328] hover:bg-[#2F343C] text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
              title="Print or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Export as PDF / Print</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#656D76] hover:text-[#1F2328] hover:bg-[#EAEFF5] rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Manual Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 text-xs text-[#1F2328] leading-relaxed print:overflow-visible print:p-6 print:space-y-6">
          {/* Document Cover / Header */}
          <div className="border-b border-[#D0D7DE] pb-6 space-y-2">
            <div className="flex items-center gap-2 text-[#0969DA] font-bold text-lg">
              <Dna className="w-6 h-6" />
              <span>GenomeLab (v2.4)</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1F2328] tracking-tight">
              User Guide & Execution Manual
            </h1>
            <p className="text-[#656D76] text-xs">
              Graphical Whole-Genome Sequencing (WGS), Assembly, AMR Profiling & Phylogenomics Platform
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#656D76] pt-1">
              <span>Author: GenomeLab Team</span>
              <span>•</span>
              <span>Target: Windows 10/11 & WSL2 Ubuntu</span>
              <span>•</span>
              <span>Environment: Miniforge3 (wgs_env)</span>
            </div>
          </div>

          {/* Chapter 1: 1-Click Windows Setup */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1F2328] border-b border-[#D0D7DE] pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1F2328] text-white flex items-center justify-center text-[10px]">1</span>
              <h2>First-Time Setup for Windows Computers (1-Click)</h2>
            </div>
            <p>
              If your computer currently only has standard Windows (no Linux or command-line tools installed), GenomeLab provides a zero-friction 1-click automated setup.
            </p>
            <div className="bg-[#F6F8FA] border border-[#D0D7DE] rounded-lg p-4 space-y-3">
              <h3 className="font-semibold text-[#1F2328] text-xs">Steps to Setup:</h3>
              <ol className="list-decimal list-inside space-y-2 text-[#1F2328]">
                <li>
                  <strong>Download the 1-Click Installer</strong>: Click the button below to download the automated Windows batch installer:
                  <div className="pt-1.5 pb-0.5 print:hidden">
                    <button
                      type="button"
                      onClick={handleDownloadBat}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1F2328] hover:bg-[#2F343C] text-white rounded text-xs font-medium cursor-pointer shadow-xs transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download setup_windows_wsl_wgs.bat</span>
                    </button>
                  </div>
                </li>
                <li>
                  <strong>Run the Installer</strong>: Double-click <code>setup_windows_wsl_wgs.bat</code> on your Windows PC.
                </li>
                <li>
                  <strong>Automatic Configuration</strong>: The installer will automatically:
                  <ul className="list-disc list-inside ml-5 mt-1 space-y-1 text-[#656D76]">
                    <li>Enable <strong>WSL2 Ubuntu 22.04 LTS</strong> kernel.</li>
                    <li>Install <strong>Miniforge3</strong> (featuring high-speed Mamba and Conda).</li>
                    <li>Create the <strong>wgs_env</strong> environment containing all core WGS tools (FastQC, fastp, SPAdes, Prokka, ABRicate, MLST, Roary, Snippy, IQ-TREE 2).</li>
                    <li>Launch the local engine on <code>http://localhost:8000</code>.</li>
                  </ul>
                </li>
                <li>
                  <strong>One-Time Reboot</strong>: If your PC did not have WSL enabled before, Windows will prompt you to restart. After restarting, double-click the installer once more to complete setup.
                </li>
              </ol>
            </div>
          </section>

          {/* Chapter 2: Connecting WebApp to Your Computer */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1F2328] border-b border-[#D0D7DE] pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1F2328] text-white flex items-center justify-center text-[10px]">2</span>
              <h2>Connecting the WebApp to Your Personal Computer</h2>
            </div>
            <p>
              GenomeLab uses a <strong>Bring-Your-Own-Compute (BYOC)</strong> architecture. The web interface in your browser connects directly to your own computer via loopback (<code>http://localhost:8000</code>).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-[#D0D7DE] rounded-lg p-3.5 bg-white space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#1A7F37]">
                  <CheckCircle2 className="w-4 h-4 text-[#2DA44E]" />
                  <span>Connected Mode (Green Pill)</span>
                </div>
                <p className="text-[11px] text-[#656D76]">
                  When <code>start_workbench.bat</code> is running on your PC, the pill at the top turns green: <code>[💻 My PC (Connected)]</code>. All real heavy bioinformatics tools execute inside your WSL2 Ubuntu environment.
                </p>
              </div>
              <div className="border border-[#D0D7DE] rounded-lg p-3.5 bg-white space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-[#7D4E00]">
                  <Laptop className="w-4 h-4 text-[#D29922]" />
                  <span>Browser Sandbox Mode (Yellow Pill)</span>
                </div>
                <p className="text-[11px] text-[#656D76]">
                  If the local engine is not running, the webapp operates safely client-side in your browser. You can design workflows, inspect CLI code, and generate charts without installing anything!
                </p>
              </div>
            </div>
          </section>

          {/* Chapter 3: 12-Stage WGS Pipeline Walkthrough */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1F2328] border-b border-[#D0D7DE] pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1F2328] text-white flex items-center justify-center text-[10px]">3</span>
              <h2>The 12-Stage Whole-Genome Sequencing (WGS) Pipeline</h2>
            </div>
            <p>
              GenomeLab orchestrates the gold-standard bacterial and eukaryotic WGS workflow across 12 logical stages:
            </p>
            <div className="border border-[#D0D7DE] rounded-lg overflow-hidden">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead className="bg-[#F6F8FA] border-b border-[#D0D7DE] font-semibold text-[#1F2328]">
                  <tr>
                    <th className="p-2 border-r border-[#D0D7DE]">Stage</th>
                    <th className="p-2 border-r border-[#D0D7DE]">Primary Gold Standard Tools</th>
                    <th className="p-2 border-r border-[#D0D7DE]">Input Data</th>
                    <th className="p-2">Key Outputs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D0D7DE]">
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">1. Ingestion</td>
                    <td className="p-2 border-r border-[#D0D7DE]">fasterq-dump, SRA Toolkit</td>
                    <td className="p-2 border-r border-[#D0D7DE]">SRA Accession / FTP</td>
                    <td className="p-2">Raw FASTQ (R1/R2)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">2. Raw Read QC</td>
                    <td className="p-2 border-r border-[#D0D7DE]">FastQC, MultiQC</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Raw FASTQ</td>
                    <td className="p-2">HTML QC Report</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">3. Trimming</td>
                    <td className="p-2 border-r border-[#D0D7DE]">fastp (Gold Standard), Trimmomatic</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Raw FASTQ</td>
                    <td className="p-2">Cleaned FASTQ</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">4. Taxonomy</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Kraken 2, Bracken, ConFindr</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Cleaned FASTQ</td>
                    <td className="p-2">Species Abundance TSV</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">5. Assembly</td>
                    <td className="p-2 border-r border-[#D0D7DE]">SPAdes (C++), Unicycler, Flye</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Cleaned FASTQ</td>
                    <td className="p-2">Contigs / Scaffolds (FASTA)</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">6. Assembly QC</td>
                    <td className="p-2 border-r border-[#D0D7DE]">QUAST, CheckM2, BUSCO</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Contigs (FASTA)</td>
                    <td className="p-2">N50, L50, Completeness %</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">7. Annotation</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Prokka, Bakta, NCBI PGAP</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Contigs (FASTA)</td>
                    <td className="p-2">GFF3, GBK, Protein FASTA</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">8. Resistome (AMR)</td>
                    <td className="p-2 border-r border-[#D0D7DE]">ABRicate (ResFinder/CARD), AMRFinderPlus</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Contigs (FASTA)</td>
                    <td className="p-2">AMR & Virulence Matrix</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">9. MLST Typing</td>
                    <td className="p-2 border-r border-[#D0D7DE]">mlst (PubMLST), SeqSero2</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Contigs (FASTA)</td>
                    <td className="p-2">Sequence Type (ST), Serotype</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">10. Pan-Genome</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Roary, Panaroo, FastANI</td>
                    <td className="p-2 border-r border-[#D0D7DE]">GFF3 Annotations</td>
                    <td className="p-2">Core/Accessory Gene Matrix</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">11. Variant Calling</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Snippy, BWA-MEM, FreeBayes, GATK4</td>
                    <td className="p-2 border-r border-[#D0D7DE]">FASTQ + Reference FASTA</td>
                    <td className="p-2">VCF, BAM, Core Alignment</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-medium border-r border-[#D0D7DE]">12. Phylogenomics</td>
                    <td className="p-2 border-r border-[#D0D7DE]">IQ-TREE 2 (ModelFinder), RAxML-NG</td>
                    <td className="p-2 border-r border-[#D0D7DE]">Core SNP Alignment</td>
                    <td className="p-2">Newick Tree, Bootstrap Support</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Chapter 4: R & Python Visual Studio */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1F2328] border-b border-[#D0D7DE] pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1F2328] text-white flex items-center justify-center text-[10px]">4</span>
              <h2>Custom R & Python Visual Studio</h2>
            </div>
            <p>
              In the <strong>Insights (R & Py)</strong> tab, you can generate 12+ publication-ready scientific visualizations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-[#1F2328]">
              <li><strong>Scientific Color Palettes</strong>: Nature (NPG), Lancet Oncology, NEJM, Okabe-Ito (Colorblind-Safe), Viridis, Plasma.</li>
              <li><strong>Fill & Hatch Patterns</strong>: Diagonal stripes, crosshatch, stippled dots, horizontal lines (ideal for black-and-white print journals).</li>
              <li><strong>Publication Export</strong>: Export charts at <strong>300 DPI</strong> resolution in PNG or SVG formats.</li>
            </ul>
          </section>

          {/* Chapter 5: Zero Data Loss Guarantee */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1F2328] border-b border-[#D0D7DE] pb-1.5">
              <span className="w-5 h-5 rounded-full bg-[#1F2328] text-white flex items-center justify-center text-[10px]">5</span>
              <h2>Permanent History Persistence & Privacy Guarantee</h2>
            </div>
            <div className="p-4 bg-[#F6F8FA] border border-[#D0D7DE] rounded-lg space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#1A7F37]">
                <ShieldCheck className="w-4 h-4 text-[#2DA44E]" />
                <span>Zero Data Loss on Browser Close</span>
              </div>
              <p className="text-[11px] text-[#656D76]">
                Every project created, sample accession added, tool executed, and chart generated is permanently preserved inside your browser's persistent storage (<code>localStorage</code>) and local SQLite WAL database. You can safely close your browser, reboot your computer, and revisit the site anytime—your complete working history will remain intact until you manually delete it.
              </p>
            </div>
          </section>
        </div>

        {/* Footer - Hidden in Print */}
        <div className="px-6 py-3 bg-[#F6F8FA] border-t border-[#D0D7DE] flex items-center justify-between text-xs text-[#656D76] print:hidden">
          <span>GenomeLab Enterprise v2.4 · Commercial Documentation</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#D0D7DE] hover:bg-[#F3F4F6] text-[#1F2328] rounded-md font-medium transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#1F2328] text-white hover:bg-[#2F343C] font-medium rounded-md shadow-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
