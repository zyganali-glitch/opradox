"""
Queue WebSocket - Opradox Excel Studio
FAZ-ES-6: WebSocket event push for real-time queue updates.
"""
from __future__ import annotations
from typing import Dict, Set, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio

router = APIRouter(tags=["queue-ws"])

# ============================================================
# CONNECTION MANAGER
# ============================================================

class QueueConnectionManager:
    """Manages WebSocket connections per user_key."""
    
    def __init__(self):
        # user_key -> set of WebSocket connections
        self.connections: Dict[str, Set[WebSocket]] = {}
        self._lock = asyncio.Lock()
    
    async def connect(self, user_key: str, websocket: WebSocket):
        """Accept and register a connection."""
        await websocket.accept()
        async with self._lock:
            if user_key not in self.connections:
                self.connections[user_key] = set()
            self.connections[user_key].add(websocket)
        print(f"[QUEUE-WS] Connected: {user_key}")
    
    async def disconnect(self, user_key: str, websocket: WebSocket):
        """Remove a connection."""
        async with self._lock:
            if user_key in self.connections:
                self.connections[user_key].discard(websocket)
                if not self.connections[user_key]:
                    del self.connections[user_key]
        print(f"[QUEUE-WS] Disconnected: {user_key}")
    
    async def broadcast_to_user(self, user_key: str, event: Dict[str, Any]):
        """Send event to all connections for a user."""
        async with self._lock:
            connections = self.connections.get(user_key, set()).copy()
        
        if not connections:
            return
        
        message = json.dumps(event, ensure_ascii=False)
        
        # Send to all connections, remove dead ones
        dead_connections = []
        for ws in connections:
            try:
                await ws.send_text(message)
            except Exception:
                dead_connections.append(ws)
        
        # Cleanup dead connections
        if dead_connections:
            async with self._lock:
                for ws in dead_connections:
                    if user_key in self.connections:
                        self.connections[user_key].discard(ws)
    
    def get_connection_count(self) -> int:
        """Get total connection count."""
        return sum(len(conns) for conns in self.connections.values())


# Global connection manager
manager = QueueConnectionManager()


# ============================================================
# BROADCAST FUNCTION (used by queue_engine)
# ============================================================

async def broadcast_job_update(user_key: str, event: Dict[str, Any]):
    """Broadcast job update to user's connections."""
    await manager.broadcast_to_user(user_key, event)


# ============================================================
# WEBSOCKET ENDPOINT
# ============================================================

@router.websocket("/ws/queue")
async def queue_websocket(websocket: WebSocket, user_key: str = "anonymous"):
    """
    WebSocket endpoint for queue updates.
    
    Connect: ws://host/ws/queue?user_key=xxx
    
    Events received:
    {
        "type": "queue_update",
        "job_id": "...",
        "status": "queued|running|done|fail|canceled",
        "progress": 0.0-1.0,
        "message": "...",
        "position": 0|N,
        "eta_ms": 0|N,
        "modal_required": true|false
    }
    """
    await manager.connect(user_key, websocket)
    
    # Register broadcast function with engine
    from .queue_engine import set_ws_broadcast
    set_ws_broadcast(broadcast_job_update)
    
    try:
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for messages (mainly for keep-alive pings)
                data = await asyncio.wait_for(
                    websocket.receive_text(),
                    timeout=30.0  # Check every 30s
                )
                
                # Handle ping/pong or other client messages
                try:
                    msg = json.loads(data)
                    if msg.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except:
                    pass
                    
            except asyncio.TimeoutError:
                # Send keep-alive ping
                try:
                    await websocket.send_text(json.dumps({"type": "ping"}))
                except:
                    break
                    
    except WebSocketDisconnect:
        pass
    except Exception as e:
        print(f"[QUEUE-WS] Error: {e}")
    finally:
        await manager.disconnect(user_key, websocket)


# ============================================================
# UTILITY ENDPOINT
# ============================================================

@router.get("/ws/queue/stats")
async def get_ws_stats():
    """Get WebSocket connection statistics."""
    return {
        "total_connections": manager.get_connection_count(),
        "user_count": len(manager.connections)
    }
