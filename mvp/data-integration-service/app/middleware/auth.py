"""
Authentication middleware for Data Integration Service
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)


class AuthMiddleware(BaseHTTPMiddleware):
    """Middleware for handling authentication"""
    
    def __init__(self, app):
        super().__init__(app)
        # Paths that don't require authentication
        self.public_paths = {
            "/",
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/api/v1/health",
            "/api/v1/status"
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request and check authentication"""
        
        # Skip auth for public paths
        if request.url.path in self.public_paths:
            return await call_next(request)
        
        # Skip auth for OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        try:
            # Let the endpoint handle authentication
            # This middleware is mainly for logging and future enhancements
            response = await call_next(request)
            return response
            
        except Exception as e:
            logger.error(f"Auth middleware error: {e}")
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={"error": "Internal server error"}
            )
