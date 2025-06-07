"""
Search endpoints for Data Integration Service
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import time
import logging

from app.core.database import get_db
from app.core.security import get_current_business
from app.models.database import BusinessDatabase, DataSource
from app.schemas.search import SearchRequest, SearchResponse, QueryRequest, QueryResponse
from app.services.vector_service import VectorService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/search", response_model=SearchResponse)
async def search_data(
    search_request: SearchRequest,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Search across business data using semantic search"""
    
    start_time = time.time()
    
    try:
        vector_service = VectorService()
        
        # Search using vector service
        results = await vector_service.search_similar(
            query=search_request.query,
            business_id=current_business["id"],
            limit=search_request.limit,
            score_threshold=search_request.score_threshold
        )
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return SearchResponse(
            query=search_request.query,
            results=results,
            total_count=len(results),
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )


@router.post("/query", response_model=QueryResponse)
async def query_database(
    query_request: QueryRequest,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Query a specific database"""
    
    start_time = time.time()
    
    # Verify database exists and belongs to business
    if query_request.database_id:
        database = db.query(BusinessDatabase).filter(
            BusinessDatabase.id == query_request.database_id,
            BusinessDatabase.business_id == current_business["id"]
        ).first()
        
        if not database:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Database not found"
            )
    
    try:
        vector_service = VectorService()
        
        if query_request.query_type == "semantic":
            # Use semantic search
            results = await vector_service.search_similar(
                query=query_request.query,
                business_id=current_business["id"],
                limit=20,
                score_threshold=0.5
            )
            
            # Filter by database if specified
            if query_request.database_id:
                results = [r for r in results if r.get("data_source_id") == query_request.database_id]
        
        else:
            # For other query types, return empty for now
            results = []
        
        execution_time = int((time.time() - start_time) * 1000)
        
        return QueryResponse(
            query_type=query_request.query_type,
            query=query_request.query,
            results=results,
            total_count=len(results),
            execution_time_ms=execution_time
        )
        
    except Exception as e:
        logger.error(f"Query error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query failed: {str(e)}"
        )


@router.get("/databases/{database_id}/schema")
async def get_database_schema(
    database_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get database schema information"""
    
    # Verify database exists and belongs to business
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Get data sources for this database
    data_sources = db.query(DataSource).filter(
        DataSource.database_id == database_id
    ).all()
    
    # Build schema from data sources
    tables = []
    for source in data_sources:
        table_info = {
            "name": source.name,
            "source_type": source.source_type,
            "records_count": source.records_count,
            "columns": [],
            "metadata": source.metadata
        }
        
        # Extract column information from metadata if available
        if source.metadata and "columns" in source.metadata:
            table_info["columns"] = source.metadata["columns"]
        
        tables.append(table_info)
    
    return {
        "database_id": database_id,
        "database_name": database.name,
        "tables": tables,
        "relationships": database.schema_definition.get("relationships", []),
        "indexes": database.schema_definition.get("indexes", []),
        "constraints": database.schema_definition.get("constraints", [])
    }
