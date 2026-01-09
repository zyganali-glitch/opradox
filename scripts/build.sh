#!/bin/bash
# ============================================================
# Opradox Excel Studio - Build Script
# Generate lock file and build Docker image
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "============================================================"
echo "OPRADOX EXCEL STUDIO BUILD"
echo "============================================================"

# Generate BUILD_ID
BUILD_ID="${BUILD_ID:-$(date +%Y%m%d-%H%M%S)-$(git rev-parse --short HEAD 2>/dev/null || echo 'nogit')}"
export BUILD_ID
echo "BUILD_ID: $BUILD_ID"

# Step 1: Generate requirements.lock (if pip-compile available)
echo ""
echo "[1/3] Checking requirements.lock..."
if command -v pip-compile &> /dev/null; then
    echo "Generating requirements.lock with hashes..."
    pip-compile --generate-hashes requirements.in -o requirements.lock
else
    echo "pip-compile not found. Using existing requirements.lock or requirements.txt"
    if [ ! -f requirements.lock ]; then
        echo "Creating requirements.lock from requirements.txt..."
        cp backend/requirements.txt requirements.lock
    fi
fi

# Step 2: Build Docker image
echo ""
echo "[2/3] Building Docker image..."
docker build \
    --build-arg BUILD_ID="$BUILD_ID" \
    -t opradox/excel-studio:latest \
    -t opradox/excel-studio:$BUILD_ID \
    .

# Step 3: Verify
echo ""
echo "[3/3] Verifying build..."
docker images opradox/excel-studio --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo ""
echo "============================================================"
echo "BUILD COMPLETE"
echo "Image: opradox/excel-studio:$BUILD_ID"
echo ""
echo "Run with: docker compose up"
echo "============================================================"
