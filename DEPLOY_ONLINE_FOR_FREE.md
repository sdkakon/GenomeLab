# How to Make GenomeLab an Online WebApp Accessible for Free Through Any Browser

**GenomeLab Enterprise (v2.4)** can be deployed as an online web application that anyone around the world can open and use through their browser (Chrome, Safari, Firefox, Edge) on any computer, tablet, or smartphone without paying for expensive cloud servers.

---

## Architecture: Why Free Bioinformatics Web Hosting is Now Possible

Bioinformatics and Whole-Genome Sequencing (WGS) software traditionally requires high-end servers (8–32 GB RAM, high multi-core CPUs, gigabytes of reference databases like CARD, VFDB, and NCBI). Running these on AWS EC2 or Google Cloud typically costs $50–$200/month.

GenomeLab solves this with a **Dual-Architecture Strategy**:
1. **Single-Port Unified Web Service**: The Python FastAPI backend directly mounts and serves the compiled React single-page app (SPA) from `frontend/dist`. Both the visual UI and the REST API run simultaneously on a single unified port (`$PORT` or `8000`).
2. **Zero-Cost Deployment Pathways**:
   - **Cloud Option (Hugging Face Spaces)**: Hosted on free 16 GB RAM cloud containers for worldwide access.
   - **Live Tunnel Option (Cloudflare Tunnels)**: Runs on your own computer with full access to your real WSL2/conda tools and private genome files, but accessible globally via a secure public `https://*.trycloudflare.com` link.

---

## Deployment Pathways Comparison

| Pathway | Cost | RAM / Compute | Setup Time | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **🤗 Hugging Face Spaces** | **100% Free Forever** | **16 GB RAM**, 2 vCPU, 50 GB Disk | 3 minutes | Anyone in the world accessing without any local computer running |
| **⚡ Cloudflare Tunnel** | **100% Free** | **Your Local PC** (Full WSL2 & Conda) | **1 Click** (Double-click `.bat`) | Sharing your local real WGS tools & private FASTQ files globally |
| **🚀 Render.com** | **Free Tier** | 512 MB RAM | 5 minutes | Continuous deployment from GitHub with custom domain support |
| **📶 Local Wi-Fi / LAN** | **100% Free** | Local Network | 0 seconds | Sharing with students, colleagues, or iPads on the same lab network |
| **🐳 Docker 1-Liner** | **100% Free** | Local Host / Server | 1 command | Self-hosting on university or institutional Linux servers |

---

## Method 1: Permanent Free Cloud Hosting on Hugging Face Spaces (Recommended)

Hugging Face Spaces offers the single most generous free tier in the cloud industry: **16 GB RAM, 2 vCPUs, and 50 GB disk space for free**.

### Step 1: Create a Free Hugging Face Account
Go to [huggingface.co/join](https://huggingface.co/join) and create a free account (no credit card required).

### Step 2: Create a New Space
1. Click your profile icon at top right -> **New Space** (or visit [huggingface.co/new-space](https://huggingface.co/new-space)).
2. Name your space (e.g. `genomelab`).
3. Select **Docker** as the Space SDK.
4. Choose **Blank** template.
5. Set Space Hardware to **Free (2 vCPU, 16 GB RAM)**.
6. Click **Create Space**.

### Step 3: Push Your Code to the Space
In your terminal, push the repository files (`Dockerfile`, `backend/`, and `frontend/`):
```bash
git remote add space https://huggingface.co/spaces/<YOUR_USERNAME>/genomelab
git add .
git commit -m "Deploy GenomeLab Enterprise"
git push space main
```

### Step 4: Automatic Build & Instant Web Access
- Hugging Face automatically runs the multi-stage `Dockerfile`, compiles the React UI, installs Python dependencies, and starts the webapp on port `7860`.
- Your app is now accessible to anyone on Earth at:
  ```
  https://huggingface.co/spaces/<YOUR_USERNAME>/genomelab
  ```
- Users can bookmark the URL and use it on Windows, Mac, Linux, Chromebook, iPad, or Android phones.

---

## Method 2: Instant 1-Click Free Live Sharing (Cloudflare Tunnel)

If you already have your genome data (FASTQ/FASTA) and real WSL2 conda environments (`SPAdes`, `Prokka`, `Snippy`, `Roary`, `IQ-TREE`) configured on your computer, you can share your live instance with anyone worldwide using **Cloudflare Tunnels**.

### How It Works:
- Does **NOT** require configuring router port forwarding.
- Does **NOT** expose your home IP address or firewall.
- End-to-end encrypted HTTPS via Cloudflare's global edge network.
- 100% free with **zero account registration required**.

### On Windows:
1. Double-click [`share_online.bat`](file:///c:/Users/User/Desktop/GUI_Based_Genome_Analysis/share_online.bat) in the project directory.
2. The script automatically verifies that GenomeLab is running on port 8000 (starting it in the background if needed), downloads the standalone `cloudflared.exe` binary, and opens a secure tunnel.
3. Look for the public link printed in the console:
   ```text
   +-----------------------------------------------------------------------+
   |  Your quick Tunnel has been created! Visit it at:                    |
   |  https://random-words-1234.trycloudflare.com                         |
   +-----------------------------------------------------------------------+
   ```
4. Copy and send that `https://*.trycloudflare.com` link to anyone. When they open it in Chrome, Safari, or Firefox, they are interacting with your GenomeLab instance!
5. To stop sharing, simply press `Ctrl+C` or close the terminal window.

### On Linux, WSL2 or macOS:
Run the included shell script:
```bash
chmod +x share_online.sh
./share_online.sh
```

---

## Method 3: Free Web Service on Render.com

Render offers free Docker web services with automatic TLS certificates and GitHub webhooks.

1. Push your repository to your GitHub account.
2. Sign in to [render.com](https://render.com) (free account).
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. In the settings:
   - **Environment**: Docker
   - **Instance Type**: Free
6. Click **Create Web Service**.
7. Render automatically builds the Docker container and assigns you a free URL (e.g. `https://genomelab.onrender.com`).

---

## Method 4: Access Over Local Wi-Fi / LAN (Lab or Office)

If you want colleagues, students, or yourself on an iPad/laptop in the same laboratory, university department, or home to use GenomeLab without going through the public internet:

1. Make sure GenomeLab is running (`start_workbench.bat`).
2. Find your local IP address:
   - **Windows**: Open PowerShell and run `ipconfig`. Look for your Wi-Fi or Ethernet `IPv4 Address` (e.g. `192.168.1.45`).
   - **Linux / macOS**: Run `hostname -I`.
3. Anyone connected to the same Wi-Fi network can open their browser and visit:
   ```
   http://192.168.1.45:8000
   ```

---

## Method 5: Docker 1-Liner Self-Hosting

If someone has Docker installed on their machine and wants to run GenomeLab with zero setup:

```bash
# Using Docker Compose:
docker compose up -d

# Or building directly:
docker build -t genomelab .
docker run -d -p 8000:7860 --name genomelab_instance genomelab
```
Then open `http://localhost:8000` in any browser.

---

## In-App Guide
Inside GenomeLab, users can click the **`[🌐 Share Online]`** button located in the top navigation header at any time to open the interactive **Share & Access GenomeLab Online** dialog with copyable commands, direct cloud deploy links, and network guides.
