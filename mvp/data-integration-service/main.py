"""
Data Integration Service - Main Application
Handles file uploads, data processing, and MCP integration for AI Voice Agent Platform
"""

import asyncio
import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import structlog

from app.core.config import settings
from app.core.database import init_db
from app.core.redis import init_redis
from app.core.vector_db import init_vector_db
from app.api.v1.router import api_router
from app.services.mcp_server import MCPServer
from app.services.websocket_manager import WebSocketManager
from app.middleware.auth import AuthMiddleware
from app.middleware.logging import LoggingMiddleware

# Configure structured logging
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting Data Integration Service")
    
    # Initialize databases
    await init_db()
    await init_redis()
    await init_vector_db()
    
    # Start MCP Server
    mcp_server = MCPServer()
    mcp_task = asyncio.create_task(mcp_server.start())
    
    # Start WebSocket Manager
    ws_manager = WebSocketManager()
    app.state.ws_manager = ws_manager
    
    logger.info("Data Integration Service started successfully")
    
    yield
    
    # Cleanup
    logger.info("Shutting down Data Integration Service")
    mcp_task.cancel()
    try:
        await mcp_task
    except asyncio.CancelledError:
        pass


# Create FastAPI application
app = FastAPI(
    title="AI Voice Agent - Data Integration Service",
    description="Microservice for handling business data integration, file processing, and MCP connectivity",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(AuthMiddleware)
app.add_middleware(LoggingMiddleware)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "data-integration",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "AI Voice Agent - Data Integration Service",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8001,
        reload=settings.DEBUG,
        log_level="info"
    )
