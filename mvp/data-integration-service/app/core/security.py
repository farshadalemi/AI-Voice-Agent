"""
Security utilities for Data Integration Service
"""

from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from typing import Dict, Any
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)
security = HTTPBearer()


def verify_token(token: str) -> Dict[str, Any]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_business(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current business from JWT token"""
    
    token = credentials.credentials
    payload = verify_token(token)
    
    business_id = payload.get("business_id")
    if not business_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing business_id"
        )
    
    return {
        "id": business_id,
        "email": payload.get("email"),
        "name": payload.get("business_name")
    }


async def get_current_agent(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> Dict[str, Any]:
    """Get current agent from JWT token (for MCP connections)"""
    
    token = credentials.credentials
    payload = verify_token(token)
    
    agent_id = payload.get("agent_id")
    business_id = payload.get("business_id")
    
    if not agent_id or not business_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token: missing agent_id or business_id"
        )
    
    return {
        "id": agent_id,
        "business_id": business_id,
        "name": payload.get("agent_name")
    }
