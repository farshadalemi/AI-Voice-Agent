"""
Database models for Data Integration Service
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey, Boolean, LargeBinary
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class BusinessDatabase(Base):
    """Custom database created by businesses"""
    
    __tablename__ = "business_databases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    schema_definition = Column(JSON, nullable=False)  # Dynamic schema
    connection_string = Column(String(500))  # For external DBs
    database_type = Column(String(50), default="internal")  # internal, postgresql, mysql, etc.
    status = Column(String(20), default="active")  # active, inactive, error
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    data_sources = relationship("DataSource", back_populates="database", cascade="all, delete-orphan")
    agent_bindings = relationship("AgentDatabaseBinding", back_populates="database", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<BusinessDatabase(id={self.id}, name={self.name}, business_id={self.business_id})>"


class DataSource(Base):
    """Data sources (files, APIs, etc.) imported into business databases"""
    
    __tablename__ = "data_sources"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    database_id = Column(UUID(as_uuid=True), ForeignKey("business_databases.id"), nullable=False, index=True)
    business_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    source_type = Column(String(50), nullable=False)  # file, api, manual, csv, excel, json, pdf
    file_path = Column(String(500))  # For file-based sources
    file_size = Column(Integer)
    file_hash = Column(String(64))  # SHA-256 hash for deduplication
    metadata = Column(JSON, default={})
    processing_status = Column(String(20), default="pending")  # pending, processing, completed, error
    processing_error = Column(Text)
    records_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    database = relationship("BusinessDatabase", back_populates="data_sources")
    chunks = relationship("DataChunk", back_populates="data_source", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<DataSource(id={self.id}, name={self.name}, type={self.source_type})>"


class DataChunk(Base):
    """Processed data chunks for vector search"""
    
    __tablename__ = "data_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    data_source_id = Column(UUID(as_uuid=True), ForeignKey("data_sources.id"), nullable=False, index=True)
    business_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)  # For deduplication
    metadata = Column(JSON, default={})
    vector_id = Column(String(100))  # ID in vector database
    chunk_index = Column(Integer, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    data_source = relationship("DataSource", back_populates="chunks")
    
    def __repr__(self):
        return f"<DataChunk(id={self.id}, source_id={self.data_source_id}, index={self.chunk_index})>"


class AgentDatabaseBinding(Base):
    """Binding between AI agents and business databases"""
    
    __tablename__ = "agent_database_bindings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    database_id = Column(UUID(as_uuid=True), ForeignKey("business_databases.id"), nullable=False, index=True)
    business_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    binding_config = Column(JSON, default={})  # Configuration for how agent uses the database
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    database = relationship("BusinessDatabase", back_populates="agent_bindings")
    
    def __repr__(self):
        return f"<AgentDatabaseBinding(agent_id={self.agent_id}, database_id={self.database_id})>"


class ProcessingJob(Base):
    """Background processing jobs"""
    
    __tablename__ = "processing_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    job_type = Column(String(50), nullable=False)  # file_processing, data_import, vector_indexing
    status = Column(String(20), default="pending")  # pending, running, completed, failed
    progress = Column(Integer, default=0)  # 0-100
    result = Column(JSON)
    error_message = Column(Text)
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<ProcessingJob(id={self.id}, type={self.job_type}, status={self.status})>"
