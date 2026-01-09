#!/bin/bash
# ============================================================
# Opradox Excel Studio - Run Script
# Start server with optional maintenance hooks
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT/backend"

echo "============================================================"
echo "OPRADOX EXCEL STUDIO SERVER"
echo "============================================================"

# Configuration
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8100}"
RELOAD="${RELOAD:-0}"

# Maintenance flags (default OFF)
RUN_SELFTEST_ON_START="${RUN_SELFTEST_ON_START:-0}"
RUN_GOLDEN_ON_START="${RUN_GOLDEN_ON_START:-0}"
SELFTEST_MODE="${SELFTEST_MODE:-quick}"
SELFTEST_TOKEN="${SELFTEST_TOKEN:-}"

echo "Host: $HOST:$PORT"
echo "Maintenance: SELFTEST=$RUN_SELFTEST_ON_START, GOLDEN=$RUN_GOLDEN_ON_START"
echo ""

# Start Uvicorn in background if maintenance hooks needed
if [ "$RUN_SELFTEST_ON_START" = "1" ] || [ "$RUN_GOLDEN_ON_START" = "1" ]; then
    echo "[MAINTENANCE MODE]"
    
    # Start server in background
    if [ "$RELOAD" = "1" ]; then
        uvicorn app.main:app --host "$HOST" --port "$PORT" --reload &
    else
        uvicorn app.main:app --host "$HOST" --port "$PORT" &
    fi
    SERVER_PID=$!
    
    # Wait for server to be ready
    echo "Waiting for server to start..."
    sleep 5
    
    # Check if server is up
    for i in {1..10}; do
        if curl -sf "http://localhost:$PORT/health" > /dev/null 2>&1; then
            echo "Server is ready!"
            break
        fi
        echo "Waiting... ($i/10)"
        sleep 2
    done
    
    # Run selftest if enabled
    if [ "$RUN_SELFTEST_ON_START" = "1" ]; then
        echo ""
        echo "[SELFTEST] Running $SELFTEST_MODE mode..."
        if [ -n "$SELFTEST_TOKEN" ]; then
            RESULT=$(curl -sf -H "X-SELFTEST-TOKEN: $SELFTEST_TOKEN" \
                "http://localhost:$PORT/selftest/run?mode=$SELFTEST_MODE" 2>&1 || echo '{"error": "request failed"}')
            echo "$RESULT" | python -m json.tool 2>/dev/null || echo "$RESULT"
            echo "[SELFTEST] Result saved to logs/selftest_last.json"
        else
            echo "[SELFTEST] SELFTEST_TOKEN not set, skipping."
        fi
    fi
    
    # Run golden if enabled
    if [ "$RUN_GOLDEN_ON_START" = "1" ]; then
        echo ""
        echo "[GOLDEN] Running golden suite..."
        cd "$PROJECT_ROOT"
        python backend/tools/build_golden.py || echo "[GOLDEN] Failed"
        cd "$PROJECT_ROOT/backend"
    fi
    
    echo ""
    echo "[MAINTENANCE] Complete. Server running on $HOST:$PORT (PID: $SERVER_PID)"
    
    # Wait for server process
    wait $SERVER_PID
else
    # Normal start (no maintenance)
    echo "Starting server..."
    if [ "$RELOAD" = "1" ]; then
        exec uvicorn app.main:app --host "$HOST" --port "$PORT" --reload
    else
        exec uvicorn app.main:app --host "$HOST" --port "$PORT"
    fi
fi
