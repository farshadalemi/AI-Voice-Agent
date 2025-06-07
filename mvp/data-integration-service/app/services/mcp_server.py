"""
Model Context Protocol (MCP) Server Implementation
Enables AI agents to query business databases through standardized protocol
"""

import asyncio
import json
import logging
from typing import Dict, List, Any, Optional
import websockets
from websockets.server import WebSocketServerProtocol
import structlog

from app.core.config import settings
from app.services.database_query import DatabaseQueryService
from app.services.vector_search import VectorSearchService

logger = structlog.get_logger()


class MCPServer:
    """MCP Server for AI agent database connectivity"""
    
    def __init__(self):
        self.connections: Dict[str, WebSocketServerProtocol] = {}
        self.agent_bindings: Dict[str, List[str]] = {}  # agent_id -> [database_ids]
        self.query_service = DatabaseQueryService()
        self.vector_service = VectorSearchService()
    
    async def start(self):
        """Start the MCP server"""
        logger.info(f"Starting MCP server on {settings.MCP_SERVER_HOST}:{settings.MCP_SERVER_PORT}")
        
        async with websockets.serve(
            self.handle_connection,
            settings.MCP_SERVER_HOST,
            settings.MCP_SERVER_PORT,
            ping_interval=30,
            ping_timeout=10
        ):
            logger.info("MCP server started successfully")
            await asyncio.Future()  # Run forever
    
    async def handle_connection(self, websocket: WebSocketServerProtocol, path: str):
        """Handle new WebSocket connection"""
        connection_id = f"conn_{id(websocket)}"
        self.connections[connection_id] = websocket
        
        logger.info(f"New MCP connection: {connection_id}")
        
        try:
            await self.send_welcome_message(websocket)
            
            async for message in websocket:
                await self.handle_message(websocket, connection_id, message)
                
        except websockets.exceptions.ConnectionClosed:
            logger.info(f"MCP connection closed: {connection_id}")
        except Exception as e:
            logger.error(f"Error in MCP connection {connection_id}: {e}")
        finally:
            if connection_id in self.connections:
                del self.connections[connection_id]
    
    async def send_welcome_message(self, websocket: WebSocketServerProtocol):
        """Send welcome message with server capabilities"""
        welcome = {
            "type": "welcome",
            "server": "AI Voice Agent MCP Server",
            "version": "1.0.0",
            "capabilities": {
                "database_query": True,
                "vector_search": True,
                "semantic_search": True,
                "data_retrieval": True,
                "schema_introspection": True
            },
            "supported_operations": [
                "authenticate",
                "list_databases",
                "query_database",
                "search_knowledge",
                "get_schema",
                "execute_query"
            ]
        }
        
        await websocket.send(json.dumps(welcome))
    
    async def handle_message(self, websocket: WebSocketServerProtocol, connection_id: str, message: str):
        """Handle incoming MCP message"""
        try:
            data = json.loads(message)
            operation = data.get("operation")
            request_id = data.get("request_id")
            
            logger.info(f"MCP operation: {operation} from {connection_id}")
            
            response = await self.process_operation(data, connection_id)
            response["request_id"] = request_id
            
            await websocket.send(json.dumps(response))
            
        except json.JSONDecodeError:
            await self.send_error(websocket, "Invalid JSON format")
        except Exception as e:
            logger.error(f"Error processing MCP message: {e}")
            await self.send_error(websocket, f"Internal server error: {str(e)}")
    
    async def process_operation(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Process MCP operation"""
        operation = data.get("operation")
        
        if operation == "authenticate":
            return await self.handle_authenticate(data, connection_id)
        elif operation == "list_databases":
            return await self.handle_list_databases(data, connection_id)
        elif operation == "query_database":
            return await self.handle_query_database(data, connection_id)
        elif operation == "search_knowledge":
            return await self.handle_search_knowledge(data, connection_id)
        elif operation == "get_schema":
            return await self.handle_get_schema(data, connection_id)
        elif operation == "execute_query":
            return await self.handle_execute_query(data, connection_id)
        else:
            return {
                "type": "error",
                "error": f"Unknown operation: {operation}"
            }
    
    async def handle_authenticate(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle agent authentication"""
        agent_id = data.get("agent_id")
        business_id = data.get("business_id")
        
        if not agent_id or not business_id:
            return {
                "type": "error",
                "error": "Missing agent_id or business_id"
            }
        
        # Get agent's database bindings
        bindings = await self.query_service.get_agent_bindings(agent_id, business_id)
        self.agent_bindings[connection_id] = [binding.database_id for binding in bindings]
        
        return {
            "type": "auth_success",
            "agent_id": agent_id,
            "available_databases": len(self.agent_bindings[connection_id])
        }
    
    async def handle_list_databases(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """List available databases for the authenticated agent"""
        if connection_id not in self.agent_bindings:
            return {
                "type": "error",
                "error": "Not authenticated"
            }
        
        database_ids = self.agent_bindings[connection_id]
        databases = await self.query_service.get_databases_info(database_ids)
        
        return {
            "type": "database_list",
            "databases": [
                {
                    "id": str(db.id),
                    "name": db.name,
                    "description": db.description,
                    "schema": db.schema_definition
                }
                for db in databases
            ]
        }
    
    async def handle_query_database(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle structured database query"""
        if connection_id not in self.agent_bindings:
            return {
                "type": "error",
                "error": "Not authenticated"
            }
        
        database_id = data.get("database_id")
        query = data.get("query")
        
        if database_id not in self.agent_bindings[connection_id]:
            return {
                "type": "error",
                "error": "Access denied to this database"
            }
        
        try:
            results = await self.query_service.execute_structured_query(database_id, query)
            return {
                "type": "query_result",
                "database_id": database_id,
                "results": results
            }
        except Exception as e:
            return {
                "type": "error",
                "error": f"Query execution failed: {str(e)}"
            }
    
    async def handle_search_knowledge(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Handle semantic search in knowledge base"""
        if connection_id not in self.agent_bindings:
            return {
                "type": "error",
                "error": "Not authenticated"
            }
        
        query_text = data.get("query")
        database_id = data.get("database_id")
        limit = data.get("limit", 5)
        
        if database_id and database_id not in self.agent_bindings[connection_id]:
            return {
                "type": "error",
                "error": "Access denied to this database"
            }
        
        try:
            # Search across all accessible databases if no specific database specified
            database_ids = [database_id] if database_id else self.agent_bindings[connection_id]
            
            results = await self.vector_service.semantic_search(
                query_text=query_text,
                database_ids=database_ids,
                limit=limit
            )
            
            return {
                "type": "search_result",
                "query": query_text,
                "results": results
            }
        except Exception as e:
            return {
                "type": "error",
                "error": f"Search failed: {str(e)}"
            }
    
    async def handle_get_schema(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Get database schema information"""
        if connection_id not in self.agent_bindings:
            return {
                "type": "error",
                "error": "Not authenticated"
            }
        
        database_id = data.get("database_id")
        
        if database_id not in self.agent_bindings[connection_id]:
            return {
                "type": "error",
                "error": "Access denied to this database"
            }
        
        try:
            schema = await self.query_service.get_database_schema(database_id)
            return {
                "type": "schema_info",
                "database_id": database_id,
                "schema": schema
            }
        except Exception as e:
            return {
                "type": "error",
                "error": f"Schema retrieval failed: {str(e)}"
            }
    
    async def handle_execute_query(self, data: Dict[str, Any], connection_id: str) -> Dict[str, Any]:
        """Execute raw SQL query (with safety checks)"""
        if connection_id not in self.agent_bindings:
            return {
                "type": "error",
                "error": "Not authenticated"
            }
        
        database_id = data.get("database_id")
        sql_query = data.get("sql")
        
        if database_id not in self.agent_bindings[connection_id]:
            return {
                "type": "error",
                "error": "Access denied to this database"
            }
        
        try:
            # Safety check: only allow SELECT queries
            if not sql_query.strip().upper().startswith("SELECT"):
                return {
                    "type": "error",
                    "error": "Only SELECT queries are allowed"
                }
            
            results = await self.query_service.execute_raw_query(database_id, sql_query)
            return {
                "type": "sql_result",
                "database_id": database_id,
                "query": sql_query,
                "results": results
            }
        except Exception as e:
            return {
                "type": "error",
                "error": f"SQL execution failed: {str(e)}"
            }
    
    async def send_error(self, websocket: WebSocketServerProtocol, error_message: str):
        """Send error message to client"""
        error_response = {
            "type": "error",
            "error": error_message
        }
        await websocket.send(json.dumps(error_response))
