"""
Redis configuration and utilities for Data Integration Service
"""

import redis.asyncio as redis
import logging
from typing import Optional, Any
import json

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Redis client
redis_client: Optional[redis.Redis] = None


async def init_redis():
    """Initialize Redis connection"""
    global redis_client
    
    try:
        redis_client = redis.from_url(
            settings.REDIS_URL,
            decode_responses=True,
            socket_connect_timeout=5,
            socket_timeout=5
        )
        
        # Test connection
        await redis_client.ping()
        logger.info("Redis connection established")
        
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        redis_client = None
        raise


async def get_redis() -> Optional[redis.Redis]:
    """Get Redis client"""
    return redis_client


async def cache_set(key: str, value: Any, expire: int = 3600):
    """Set value in cache with expiration"""
    if redis_client:
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            await redis_client.setex(key, expire, value)
        except Exception as e:
            logger.error(f"Cache set error: {e}")


async def cache_get(key: str) -> Optional[Any]:
    """Get value from cache"""
    if redis_client:
        try:
            value = await redis_client.get(key)
            if value:
                try:
                    return json.loads(value)
                except json.JSONDecodeError:
                    return value
        except Exception as e:
            logger.error(f"Cache get error: {e}")
    return None


async def cache_delete(key: str):
    """Delete key from cache"""
    if redis_client:
        try:
            await redis_client.delete(key)
        except Exception as e:
            logger.error(f"Cache delete error: {e}")


async def cache_exists(key: str) -> bool:
    """Check if key exists in cache"""
    if redis_client:
        try:
            return await redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Cache exists error: {e}")
    return False
