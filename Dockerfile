# ==============================================================================
# GenomeLab Enterprise — Multi-Stage Production Dockerfile
# Compatible with:
#  - Hugging Face Spaces (Free 16 GB RAM, 2 vCPU, Port 7860, UID 1000)
#  - Render.com (Free Web Service, Dynamic $PORT)
#  - Local Docker & Self-Hosted Linux Servers (Port 8000)
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Compile React + TypeScript Frontend
# ------------------------------------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /build/frontend

# Install dependencies
COPY frontend/package.json ./
RUN npm install

# Build static SPA bundle
COPY frontend/ ./
RUN npm run build

# ------------------------------------------------------------------------------
# Stage 2: Production Python Backend & Web Service
# ------------------------------------------------------------------------------
FROM python:3.11-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    HOST=0.0.0.0

# Install essential system utilities and lightweight plotting dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    git \
    procps \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Set up non-root user (Required for Hugging Face Spaces UID 1000)
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/backend /app/frontend/dist /app/workspaces && \
    chown -R appuser:appuser /app

WORKDIR /app

# Install Python packages
RUN pip install --no-cache-dir \
    fastapi>=0.110.0 \
    "uvicorn[standard]>=0.28.0" \
    pydantic>=2.6.0 \
    matplotlib>=3.8.0 \
    seaborn>=0.13.0 \
    biopython>=1.83 \
    numpy>=1.26.0

# Copy backend source code
COPY --chown=appuser:appuser backend/ /app/backend/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder --chown=appuser:appuser /build/frontend/dist /app/frontend/dist

# Switch to non-root user
USER appuser

# Hugging Face Spaces listens on 7860; local Docker maps 8000
EXPOSE 7860 8000

# Launch unified single-port webapp (serves both React SPA and REST API)
CMD ["python", "-m", "backend.main"]
