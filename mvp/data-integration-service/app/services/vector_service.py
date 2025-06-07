"""
Vector database service for semantic search
"""

import logging
from typing import List, Dict, Any, Optional
from qdrant_client import QdrantClient
from qdrant_client.http import models
import openai
from app.core.config import settings

logger = logging.getLogger(__name__)


class VectorService:
    """Service for vector database operations"""
    
    def __init__(self):
        self.client = QdrantClient(url=settings.VECTOR_DB_URL)
        self.collection_name = settings.VECTOR_COLLECTION_NAME
        openai.api_key = settings.OPENAI_API_KEY
        
    async def initialize_collection(self):
        """Initialize vector collection if it doesn't exist"""
        try:
            # Check if collection exists
            collections = self.client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if self.collection_name not in collection_names:
                # Create collection
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=models.VectorParams(
                        size=1536,  # OpenAI embedding size
                        distance=models.Distance.COSINE
                    )
                )
                logger.info(f"Created vector collection: {self.collection_name}")
            else:
                logger.info(f"Vector collection already exists: {self.collection_name}")
                
        except Exception as e:
            logger.error(f"Error initializing vector collection: {str(e)}")
            raise
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using OpenAI"""
        try:
            response = openai.Embedding.create(
                model=settings.EMBEDDING_MODEL,
                input=text
            )
            return response['data'][0]['embedding']
            
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise
    
    async def index_chunks(self, chunks: List[Dict[str, Any]], data_source_id: str):
        """Index text chunks in vector database"""
        try:
            points = []
            
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding = await self.generate_embedding(chunk["content"])
                
                # Create point
                point = models.PointStruct(
                    id=f"{data_source_id}_{i}",
                    vector=embedding,
                    payload={
                        "content": chunk["content"],
                        "data_source_id": data_source_id,
                        "chunk_index": chunk["index"],
                        "metadata": chunk["metadata"]
                    }
                )
                points.append(point)
            
            # Upsert points
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"Indexed {len(points)} chunks for data source {data_source_id}")
            
        except Exception as e:
            logger.error(f"Error indexing chunks: {str(e)}")
            raise
    
    async def search_similar(
        self, 
        query: str, 
        business_id: str,
        limit: int = 10,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Search for similar content"""
        try:
            # Generate query embedding
            query_embedding = await self.generate_embedding(query)
            
            # Search
            search_result = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=models.Filter(
                    must=[
                        models.FieldCondition(
                            key="metadata.business_id",
                            match=models.MatchValue(value=business_id)
                        )
                    ]
                ),
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            results = []
            for hit in search_result:
                results.append({
                    "content": hit.payload["content"],
                    "score": hit.score,
                    "data_source_id": hit.payload["data_source_id"],
                    "metadata": hit.payload["metadata"]
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Error searching vectors: {str(e)}")
            raise
    
    async def delete_data_source(self, data_source_id: str):
        """Delete all vectors for a data source"""
        try:
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="data_source_id",
                                match=models.MatchValue(value=data_source_id)
                            )
                        ]
                    )
                )
            )
            
            logger.info(f"Deleted vectors for data source {data_source_id}")
            
        except Exception as e:
            logger.error(f"Error deleting vectors: {str(e)}")
            raise
