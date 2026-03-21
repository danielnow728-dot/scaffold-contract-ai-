from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, List
import json

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        # Dictionary mapping contract_id to a list of active websocket connections
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, contract_id: int):
        await websocket.accept()
        if contract_id not in self.active_connections:
            self.active_connections[contract_id] = []
        self.active_connections[contract_id].append(websocket)

    def disconnect(self, websocket: WebSocket, contract_id: int):
        if contract_id in self.active_connections:
            self.active_connections[contract_id].remove(websocket)
            if not self.active_connections[contract_id]:
                del self.active_connections[contract_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_issue(self, contract_id: int, issue: dict):
        """Broadcasts a newly found issue to all clients viewing that contract_id"""
        if contract_id in self.active_connections:
            for connection in self.active_connections[contract_id]:
                await connection.send_text(json.dumps({
                    "type": "new_issue",
                    "data": issue
                }))
                
    async def broadcast_progress(self, contract_id: int, completed: int, total: int):
        """Broadcasts processing progress to all clients"""
        if contract_id in self.active_connections:
            for connection in self.active_connections[contract_id]:
                await connection.send_text(json.dumps({
                    "type": "progress",
                    "data": {
                        "completed": completed,
                        "total": total
                    }
                }))

manager = ConnectionManager()

@router.websocket("/ws/{contract_id}")
async def websocket_endpoint(websocket: WebSocket, contract_id: int):
    await manager.connect(websocket, contract_id)
    try:
        while True:
            # We don't expect the client to send data through WS, just receive.
            # But we must listen to keep connection open and handle disconnects.
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, contract_id)
