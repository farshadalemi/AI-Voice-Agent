"""
WebSocket manager for real-time updates in Data Integration Service
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Any
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class WebSocketManager:
    """Manager for WebSocket connections and real-time updates"""
    
    def __init__(self):
        # Store active connections by business_id
        self.connections: Dict[str, List[WebSocket]] = {}
        
    async def connect(self, websocket: WebSocket, business_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        
        if business_id not in self.connections:
            self.connections[business_id] = []
        
        self.connections[business_id].append(websocket)
        logger.info(f"WebSocket connected for business {business_id}")
        
    def disconnect(self, websocket: WebSocket, business_id: str):
        """Remove a WebSocket connection"""
        if business_id in self.connections:
            if websocket in self.connections[business_id]:
                self.connections[business_id].remove(websocket)
                
            # Clean up empty lists
            if not self.connections[business_id]:
                del self.connections[business_id]
                
        logger.info(f"WebSocket disconnected for business {business_id}")
        
    async def send_to_business(self, business_id: str, message: Dict[str, Any]):
        """Send message to all connections for a business"""
        if business_id not in self.connections:
            return
            
        # Create list copy to avoid modification during iteration
        connections = self.connections[business_id].copy()
        
        for websocket in connections:
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending WebSocket message: {e}")
                # Remove failed connection
                self.disconnect(websocket, business_id)
                
    async def broadcast_file_status(self, business_id: str, file_id: str, status: str, progress: int = 0):
        """Broadcast file processing status update"""
        message = {
            "type": "file_status_update",
            "file_id": file_id,
            "status": status,
            "progress": progress,
            "timestamp": "2024-01-15T10:30:00Z"  # In real app, use datetime.utcnow()
        }
        
        await self.send_to_business(business_id, message)
        
    async def broadcast_database_update(self, business_id: str, database_id: str, action: str):
        """Broadcast database update"""
        message = {
            "type": "database_update",
            "database_id": database_id,
            "action": action,  # created, updated, deleted
            "timestamp": "2024-01-15T10:30:00Z"
        }
        
        await self.send_to_business(business_id, message)
        
    async def handle_websocket_endpoint(self, websocket: WebSocket, business_id: str):
        """Handle WebSocket endpoint connection"""
        await self.connect(websocket, business_id)
        
        try:
            while True:
                # Wait for messages from client
                data = await websocket.receive_text()
                
                try:
                    message = json.loads(data)
                    await self._handle_client_message(websocket, business_id, message)
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Invalid JSON format"
                    }))
                    
        except WebSocketDisconnect:
            self.disconnect(websocket, business_id)
        except Exception as e:
            logger.error(f"WebSocket error: {e}")
            self.disconnect(websocket, business_id)
            
    async def _handle_client_message(self, websocket: WebSocket, business_id: str, message: Dict[str, Any]):
        """Handle message from client"""
        message_type = message.get("type")
        
        if message_type == "ping":
            await websocket.send_text(json.dumps({"type": "pong"}))
        elif message_type == "subscribe":
            # Handle subscription to specific events
            await websocket.send_text(json.dumps({
                "type": "subscribed",
                "message": "Successfully subscribed to updates"
            }))
        else:
            await websocket.send_text(json.dumps({
                "type": "error",
                "message": f"Unknown message type: {message_type}"
            }))
