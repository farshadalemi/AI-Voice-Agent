"""
File upload and processing endpoints for Data Integration Service
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import os
import hashlib
import aiofiles
from datetime import datetime
import logging

from app.core.database import get_db
from app.core.security import get_current_business
from app.core.config import settings
from app.models.database import DataSource, BusinessDatabase
from app.schemas.database import DataSourceResponse, FileUploadResponse, ProcessingStatus
from app.services.file_processor import FileProcessor
from app.services.background_tasks import process_file_background

logger = logging.getLogger(__name__)
router = APIRouter()

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'xls': 'application/vnd.ms-excel',
    'csv': 'text/csv',
    'json': 'application/json',
    'pdf': 'application/pdf',
    'txt': 'text/plain',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
}

def validate_file_extension(filename: str) -> bool:
    """Validate file extension"""
    if '.' not in filename:
        return False
    extension = filename.rsplit('.', 1)[1].lower()
    return extension in ALLOWED_EXTENSIONS

def get_file_hash(content: bytes) -> str:
    """Generate SHA-256 hash of file content"""
    return hashlib.sha256(content).hexdigest()

@router.post("/upload", response_model=FileUploadResponse)
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    database_id: str = Form(...),
    description: Optional[str] = Form(None),
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Upload and process a file for a business database"""
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    if not validate_file_extension(file.filename):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed types: {', '.join(ALLOWED_EXTENSIONS.keys())}"
        )
    
    # Check file size
    content = await file.read()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
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
    
    # Generate file hash for deduplication
    file_hash = get_file_hash(content)
    
    # Check if file already exists
    existing_source = db.query(DataSource).filter(
        DataSource.business_id == current_business["id"],
        DataSource.file_hash == file_hash
    ).first()
    
    if existing_source:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="File already uploaded"
        )
    
    # Create data source record
    data_source = DataSource(
        database_id=database_id,
        business_id=current_business["id"],
        name=file.filename,
        source_type=file.filename.rsplit('.', 1)[1].lower(),
        file_size=len(content),
        file_hash=file_hash,
        metadata={
            "original_filename": file.filename,
            "content_type": file.content_type,
            "description": description
        },
        processing_status="pending"
    )
    
    db.add(data_source)
    db.commit()
    db.refresh(data_source)
    
    # Save file to storage
    file_path = os.path.join(
        settings.FILE_STORAGE_PATH,
        str(current_business["id"]),
        str(data_source.id),
        file.filename
    )
    
    # Create directory if it doesn't exist
    os.makedirs(os.path.dirname(file_path), exist_ok=True)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Update file path in database
    data_source.file_path = file_path
    db.commit()
    
    # Start background processing
    background_tasks.add_task(
        process_file_background,
        data_source.id,
        file_path,
        current_business["id"]
    )
    
    return FileUploadResponse(
        id=str(data_source.id),
        filename=file.filename,
        size=len(content),
        status="uploaded",
        message="File uploaded successfully and processing started"
    )

@router.get("/sources", response_model=List[DataSourceResponse])
async def list_data_sources(
    database_id: Optional[str] = None,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """List all data sources for the business"""
    
    query = db.query(DataSource).filter(
        DataSource.business_id == current_business["id"]
    )
    
    if database_id:
        query = query.filter(DataSource.database_id == database_id)
    
    sources = query.order_by(DataSource.created_at.desc()).all()
    
    return [DataSourceResponse.from_orm(source) for source in sources]

@router.get("/sources/{source_id}", response_model=DataSourceResponse)
async def get_data_source(
    source_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get details of a specific data source"""
    
    source = db.query(DataSource).filter(
        DataSource.id == source_id,
        DataSource.business_id == current_business["id"]
    ).first()
    
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    return DataSourceResponse.from_orm(source)

@router.get("/sources/{source_id}/status", response_model=ProcessingStatus)
async def get_processing_status(
    source_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get processing status of a data source"""
    
    source = db.query(DataSource).filter(
        DataSource.id == source_id,
        DataSource.business_id == current_business["id"]
    ).first()
    
    if not source:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Data source not found"
        )
    
    return ProcessingStatus(
        id=str(source.id),
        status=source.processing_status,
        progress=source.metadata.get("processing_progress", 0),
        error=source.processing_error,
        records_processed=source.records_count,
        started_at=source.created_at,
        completed_at=source.processed_at
    )
