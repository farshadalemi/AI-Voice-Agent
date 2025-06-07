"""
Main API router for Data Integration Service
"""

from fastapi import APIRouter

from app.api.v1.endpoints import databases, files, search, mcp

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    databases.router,
    prefix="/databases",
    tags=["Database Management"]
)

api_router.include_router(
    files.router,
    prefix="/files",
    tags=["File Processing"]
)

api_router.include_router(
    search.router,
    prefix="",
    tags=["Search & Query"]
)

api_router.include_router(
    mcp.router,
    prefix="/mcp",
    tags=["MCP Server"]
)
