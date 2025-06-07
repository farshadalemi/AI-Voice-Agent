"""
MCP (Model Context Protocol) schemas for Data Integration Service
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


class MCPServerStats(BaseModel):
    """Schema for MCP server statistics"""
    total_connections: int = Field(..., description="Total connections since startup")
    active_connections: int = Field(..., description="Currently active connections")
    total_queries: int = Field(..., description="Total queries processed")
    queries_per_minute: int = Field(..., description="Queries processed per minute")
    uptime_seconds: int = Field(..., description="Server uptime in seconds")
    server_status: str = Field(..., description="Server status (running, stopped, error)")


class MCPConnection(BaseModel):
    """Schema for MCP connection information"""
    id: str = Field(..., description="Connection ID")
    agent_id: str = Field(..., description="Connected agent ID")
    agent_name: str = Field(..., description="Connected agent name")
    connected_at: str = Field(..., description="Connection timestamp")
    last_activity: str = Field(..., description="Last activity timestamp")
    status: str = Field(..., description="Connection status")


class MCPServerConfig(BaseModel):
    """Schema for MCP server configuration"""
    port: int = Field(8002, description="Server port")
    max_connections: int = Field(100, description="Maximum concurrent connections")
    timeout_seconds: int = Field(30, description="Connection timeout in seconds")
    enable_logging: bool = Field(True, description="Enable request logging")
    log_level: str = Field("INFO", description="Logging level")
    additional_config: Dict[str, Any] = Field(default_factory=dict, description="Additional configuration")
