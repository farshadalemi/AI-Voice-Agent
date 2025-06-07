"""
Pydantic schemas for Data Integration Service
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
import uuid


class DatabaseCreate(BaseModel):
    """Schema for creating a new business database"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    schema_definition: Dict[str, Any] = Field(default_factory=dict)
    database_type: str = Field(default="internal")
    
    @validator('name')
    def validate_name(cls, v):
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Database name must contain only alphanumeric characters, hyphens, and underscores')
        return v


class DatabaseUpdate(BaseModel):
    """Schema for updating database configuration"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    schema_definition: Optional[Dict[str, Any]] = None
    
    @validator('name')
    def validate_name(cls, v):
        if v and not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Database name must contain only alphanumeric characters, hyphens, and underscores')
        return v


class DatabaseResponse(BaseModel):
    """Schema for database response"""
    id: str
    business_id: str
    name: str
    description: Optional[str]
    schema_definition: Dict[str, Any]
    database_type: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    @validator('id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class DataSourceResponse(BaseModel):
    """Schema for data source response"""
    id: str
    database_id: str
    business_id: str
    name: str
    source_type: str
    file_path: Optional[str]
    file_size: Optional[int]
    file_hash: Optional[str]
    metadata: Dict[str, Any]
    processing_status: str
    processing_error: Optional[str]
    records_count: int
    created_at: datetime
    updated_at: datetime
    
    @validator('id', 'database_id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class AgentBindingCreate(BaseModel):
    """Schema for creating agent-database binding"""
    agent_id: str
    binding_config: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('agent_id')
    def validate_agent_id(cls, v):
        try:
            uuid.UUID(v)
        except ValueError:
            raise ValueError('Invalid agent ID format')
        return v


class AgentBindingResponse(BaseModel):
    """Schema for agent binding response"""
    id: str
    agent_id: str
    database_id: str
    business_id: str
    binding_config: Dict[str, Any]
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    @validator('id', 'agent_id', 'database_id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    file_id: str
    filename: str
    file_size: int
    file_type: str
    upload_status: str
    processing_job_id: Optional[str] = None


class ProcessingJobResponse(BaseModel):
    """Schema for processing job response"""
    id: str
    business_id: str
    job_type: str
    status: str
    progress: int
    result: Optional[Dict[str, Any]]
    error_message: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]
    
    @validator('id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        if isinstance(v, uuid.UUID):
            return str(v)
        return v
    
    class Config:
        from_attributes = True


class QueryRequest(BaseModel):
    """Schema for database query request"""
    query_type: str = Field(..., regex="^(structured|semantic|sql)$")
    query: str = Field(..., min_length=1)
    database_id: Optional[str] = None
    limit: int = Field(default=10, ge=1, le=100)
    filters: Dict[str, Any] = Field(default_factory=dict)


class QueryResponse(BaseModel):
    """Schema for query response"""
    query_type: str
    query: str
    results: List[Dict[str, Any]]
    total_count: int
    execution_time_ms: float
    metadata: Dict[str, Any] = Field(default_factory=dict)


class SearchRequest(BaseModel):
    """Schema for semantic search request"""
    query: str = Field(..., min_length=1)
    database_ids: Optional[List[str]] = None
    limit: int = Field(default=5, ge=1, le=20)
    similarity_threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    include_metadata: bool = True


class SearchResult(BaseModel):
    """Schema for search result item"""
    content: str
    similarity_score: float
    source_id: str
    source_name: str
    database_id: str
    metadata: Dict[str, Any]


class SearchResponse(BaseModel):
    """Schema for search response"""
    query: str
    results: List[SearchResult]
    total_found: int
    search_time_ms: float


class MCPMessage(BaseModel):
    """Schema for MCP protocol messages"""
    operation: str
    request_id: Optional[str] = None
    agent_id: Optional[str] = None
    business_id: Optional[str] = None
    database_id: Optional[str] = None
    query: Optional[str] = None
    sql: Optional[str] = None
    limit: Optional[int] = 10
    metadata: Dict[str, Any] = Field(default_factory=dict)


class MCPResponse(BaseModel):
    """Schema for MCP protocol responses"""
    type: str
    request_id: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    results: Optional[List[Dict[str, Any]]] = None


class DatabaseSchema(BaseModel):
    """Schema for database structure information"""
    tables: List[Dict[str, Any]]
    relationships: List[Dict[str, Any]]
    indexes: List[Dict[str, Any]]
    constraints: List[Dict[str, Any]]


class HealthCheck(BaseModel):
    """Schema for health check response"""
    status: str
    service: str
    version: str
    timestamp: datetime
    dependencies: Dict[str, str]


class FileUploadResponse(BaseModel):
    """Schema for file upload response"""
    id: str
    filename: str
    size: int
    status: str
    message: str


class ProcessingStatus(BaseModel):
    """Schema for file processing status"""
    id: str
    status: str
    progress: int = Field(ge=0, le=100)
    error: Optional[str] = None
    records_processed: int = 0
    started_at: datetime
    completed_at: Optional[datetime] = None


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    error: str
    detail: Optional[str] = None
    code: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
