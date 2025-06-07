"""
Search and query schemas for Data Integration Service
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


class SearchRequest(BaseModel):
    """Schema for search requests"""
    query: str = Field(..., description="Search query")
    database_id: Optional[str] = Field(None, description="Optional database ID to search within")
    limit: int = Field(10, ge=1, le=50, description="Maximum number of results")
    score_threshold: float = Field(0.7, ge=0.0, le=1.0, description="Minimum similarity score")


class SearchResultItem(BaseModel):
    """Schema for individual search result"""
    content: str = Field(..., description="Content that matched the search")
    score: float = Field(..., description="Similarity score (0-1)")
    data_source_id: str = Field(..., description="ID of the data source")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")


class SearchResponse(BaseModel):
    """Schema for search response"""
    query: str = Field(..., description="Original search query")
    results: List[SearchResultItem] = Field(default_factory=list, description="Search results")
    total_count: int = Field(..., description="Total number of results")
    execution_time_ms: int = Field(..., description="Execution time in milliseconds")


class QueryRequest(BaseModel):
    """Schema for database query requests"""
    query_type: str = Field(..., description="Type of query (semantic, sql, etc.)")
    query: str = Field(..., description="Query string")
    database_id: Optional[str] = Field(None, description="Database ID to query")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Query parameters")


class QueryResponse(BaseModel):
    """Schema for database query response"""
    query_type: str = Field(..., description="Type of query executed")
    query: str = Field(..., description="Original query")
    results: List[Any] = Field(default_factory=list, description="Query results")
    total_count: int = Field(..., description="Total number of results")
    execution_time_ms: int = Field(..., description="Execution time in milliseconds")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional metadata")
