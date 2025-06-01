"""
Main API router for the AI Voice Agent Platform MVP
"""

from fastapi import APIRouter

from app.api.v1.endpoints import auth, business, agents, voice

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    business.router,
    prefix="/business",
    tags=["Business Management"]
)

api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["Agent Management"]
)

api_router.include_router(
    voice.router,
    prefix="/voice",
    tags=["Voice Processing"]
)
