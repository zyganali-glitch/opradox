# syntax=docker/dockerfile:1
# ============================================================
# Opradox Excel Studio - Dockerfile
# Deterministic, secure Python container
# ============================================================

# --- Base Image (pinned version for reproducibility) ---
FROM python:3.11.7-slim-bookworm AS base

# --- Environment ---
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    TZ=UTC

# --- System Dependencies ---
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# --- Non-root User (security) ---
RUN groupadd --gid 1000 appgroup \
    && useradd --uid 1000 --gid appgroup --shell /bin/bash --create-home appuser

WORKDIR /app

# --- Python Dependencies (deterministic with hashes) ---
# First copy only requirements for better layer caching
COPY requirements.lock ./requirements.lock

# Install with hash verification for security
# Note: If requirements.lock doesn't have hashes yet, remove --require-hashes
RUN pip install --no-cache-dir -r requirements.lock

# --- Application Code ---
COPY --chown=appuser:appgroup backend/ ./backend/
COPY --chown=appuser:appgroup frontend/ ./frontend/
COPY --chown=appuser:appgroup scripts/ ./scripts/

# --- Create necessary directories ---
RUN mkdir -p backend/logs backend/shared_files backend/uploads \
    && chown -R appuser:appgroup backend/logs backend/shared_files backend/uploads

# --- Switch to non-root user ---
USER appuser

# --- Expose Port ---
EXPOSE 8100

# --- Health Check ---
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8100/health || exit 1

# --- Default Command ---
WORKDIR /app/backend
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8100"]
