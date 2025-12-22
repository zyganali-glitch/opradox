"""
WebSocket Collaboration API - Opradox Visual Studio
Gerçek zamanlı işbirliği için WebSocket endpoint'leri
"""
from __future__ import annotations
from typing import Dict, List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import json
import asyncio
from datetime import datetime

router = APIRouter(prefix="/viz/ws", tags=["websocket"])


# Aktif bağlantıları yöneten sınıf
class ConnectionManager:
    """WebSocket bağlantı yöneticisi"""
    
    def __init__(self):
        # room_id -> Set[WebSocket] şeklinde odalar
        self.rooms: Dict[str, Set[WebSocket]] = {}
        # websocket -> {room_id, user_id, username}
        self.connections: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str, username: str):
        """Yeni bağlantı kabul et"""
        await websocket.accept()
        
        if room_id not in self.rooms:
            self.rooms[room_id] = set()
        
        self.rooms[room_id].add(websocket)
        self.connections[websocket] = {
            "room_id": room_id,
            "user_id": user_id,
            "username": username,
            "connected_at": datetime.now().isoformat()
        }
        
        # Diğer kullanıcılara bildir
        await self.broadcast_to_room(room_id, {
            "type": "user_joined",
            "user_id": user_id,
            "username": username,
            "timestamp": datetime.now().isoformat(),
            "active_users": self.get_room_users(room_id)
        }, exclude=websocket)
    
    def disconnect(self, websocket: WebSocket):
        """Bağlantıyı kapat"""
        if websocket in self.connections:
            info = self.connections[websocket]
            room_id = info["room_id"]
            
            if room_id in self.rooms:
                self.rooms[room_id].discard(websocket)
                
                # Oda boşaldıysa sil
                if not self.rooms[room_id]:
                    del self.rooms[room_id]
            
            del self.connections[websocket]
            return info
        return None
    
    async def broadcast_to_room(self, room_id: str, message: dict, exclude: WebSocket = None):
        """Odadaki tüm kullanıcılara mesaj gönder"""
        if room_id not in self.rooms:
            return
        
        disconnected = []
        for connection in self.rooms[room_id]:
            if connection != exclude:
                try:
                    await connection.send_json(message)
                except:
                    disconnected.append(connection)
        
        # Kopan bağlantıları temizle
        for conn in disconnected:
            self.disconnect(conn)
    
    def get_room_users(self, room_id: str) -> List[dict]:
        """Odadaki kullanıcıları listele"""
        if room_id not in self.rooms:
            return []
        
        users = []
        for ws in self.rooms[room_id]:
            if ws in self.connections:
                info = self.connections[ws]
                users.append({
                    "user_id": info["user_id"],
                    "username": info["username"]
                })
        return users


# Global connection manager
manager = ConnectionManager()


@router.websocket("/collaborate/{room_id}")
async def websocket_endpoint(
    websocket: WebSocket, 
    room_id: str,
    user_id: str = "anonymous",
    username: str = "Anonim"
):
    """
    İşbirliği WebSocket endpoint'i.
    
    room_id: Ortak çalışma odası ID'si (dashboard ID gibi)
    user_id: Kullanıcı ID'si
    username: Görünen kullanıcı adı
    
    Mesaj Formatları:
    
    Gönderim (client -> server):
    {
        "action": "add_chart" | "update_chart" | "delete_chart" | "cursor_move" | "chat",
        "payload": {...},
        "timestamp": "ISO string"
    }
    
    Alım (server -> client):
    {
        "type": "action" | "user_joined" | "user_left" | "sync",
        "user_id": "...",
        "username": "...",
        "payload": {...},
        "timestamp": "ISO string"
    }
    """
    await manager.connect(websocket, room_id, user_id, username)
    
    try:
        while True:
            # Mesaj bekle
            data = await websocket.receive_json()
            
            action = data.get("action")
            payload = data.get("payload", {})
            
            # Mesajı işle ve broadcast et
            if action == "add_chart":
                await manager.broadcast_to_room(room_id, {
                    "type": "action",
                    "action": "add_chart",
                    "user_id": user_id,
                    "username": username,
                    "payload": payload,
                    "timestamp": datetime.now().isoformat()
                }, exclude=websocket)
                
            elif action == "update_chart":
                await manager.broadcast_to_room(room_id, {
                    "type": "action",
                    "action": "update_chart",
                    "user_id": user_id,
                    "username": username,
                    "payload": payload,
                    "timestamp": datetime.now().isoformat()
                }, exclude=websocket)
                
            elif action == "delete_chart":
                await manager.broadcast_to_room(room_id, {
                    "type": "action",
                    "action": "delete_chart",
                    "user_id": user_id,
                    "username": username,
                    "payload": payload,
                    "timestamp": datetime.now().isoformat()
                }, exclude=websocket)
                
            elif action == "cursor_move":
                # Cursor pozisyonunu broadcast et (performans için throttle edilmeli)
                await manager.broadcast_to_room(room_id, {
                    "type": "cursor",
                    "user_id": user_id,
                    "username": username,
                    "x": payload.get("x"),
                    "y": payload.get("y")
                }, exclude=websocket)
                
            elif action == "chat":
                await manager.broadcast_to_room(room_id, {
                    "type": "chat",
                    "user_id": user_id,
                    "username": username,
                    "message": payload.get("message", ""),
                    "timestamp": datetime.now().isoformat()
                })
                
            elif action == "request_sync":
                # Mevcut durumu iste (önceki eden kullanıcılardan)
                await manager.broadcast_to_room(room_id, {
                    "type": "sync_request",
                    "requester_id": user_id,
                    "requester_name": username
                }, exclude=websocket)
                
            elif action == "sync_response":
                # Sync yanıtını sadece isteyene gönder (basitleştirilmiş)
                await manager.broadcast_to_room(room_id, {
                    "type": "sync_data",
                    "from_user": username,
                    "payload": payload
                })
                
    except WebSocketDisconnect:
        info = manager.disconnect(websocket)
        if info:
            await manager.broadcast_to_room(info["room_id"], {
                "type": "user_left",
                "user_id": info["user_id"],
                "username": info["username"],
                "timestamp": datetime.now().isoformat(),
                "active_users": manager.get_room_users(info["room_id"])
            })


@router.get("/rooms")
async def list_active_rooms():
    """Aktif işbirliği odalarını listele (admin için)"""
    rooms = []
    for room_id, connections in manager.rooms.items():
        rooms.append({
            "room_id": room_id,
            "user_count": len(connections),
            "users": manager.get_room_users(room_id)
        })
    return {"rooms": rooms, "total": len(rooms)}


@router.get("/room/{room_id}/users")
async def get_room_users(room_id: str):
    """Belirtilen odadaki kullanıcıları listele"""
    users = manager.get_room_users(room_id)
    return {"room_id": room_id, "users": users, "count": len(users)}
