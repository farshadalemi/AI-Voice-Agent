"""
Vector database configuration and utilities for Data Integration Service
"""

from qdrant_client import QdrantClient
from qdrant_client.http import models
import logging
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Qdrant client
qdrant_client: Optional[QdrantClient] = None


async def init_vector_db():
    """Initialize vector database connection"""
    global qdrant_client
    
    try:
        qdrant_client = QdrantClient(url=settings.VECTOR_DB_URL)
        
        # Test connection
        collections = qdrant_client.get_collections()
        logger.info(f"Vector database connected. Collections: {len(collections.collections)}")
        
        # Initialize collection if it doesn't exist
        await _ensure_collection_exists()
        
    except Exception as e:
        logger.error(f"Vector database connection failed: {e}")
        qdrant_client = None
        raise


async def _ensure_collection_exists():
    """Ensure the main collection exists"""
    if not qdrant_client:
        return
    
    try:
        collections = qdrant_client.get_collections()
        collection_names = [col.name for col in collections.collections]
        
        if settings.VECTOR_COLLECTION_NAME not in collection_names:
            # Create collection
            qdrant_client.create_collection(
                collection_name=settings.VECTOR_COLLECTION_NAME,
                vectors_config=models.VectorParams(
                    size=1536,  # OpenAI embedding size
                    distance=models.Distance.COSINE
                )
            )
            logger.info(f"Created vector collection: {settings.VECTOR_COLLECTION_NAME}")
        else:
            logger.info(f"Vector collection already exists: {settings.VECTOR_COLLECTION_NAME}")
            
    except Exception as e:
        logger.error(f"Error ensuring collection exists: {e}")
        raise


def get_vector_client() -> Optional[QdrantClient]:
    """Get vector database client"""
    return qdrant_client
