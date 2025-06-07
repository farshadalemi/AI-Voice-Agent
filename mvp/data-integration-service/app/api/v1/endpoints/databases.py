"""
Database management endpoints for Data Integration Service
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List, Optional
import uuid
import json

from app.core.database import get_db
from app.core.security import get_current_business
from app.models.database import BusinessDatabase, DataSource, AgentDatabaseBinding
from app.schemas.database import (
    DatabaseCreate, DatabaseResponse, DatabaseUpdate,
    DataSourceResponse, AgentBindingCreate, AgentBindingResponse
)
from app.services.database_manager import DatabaseManager
from app.services.file_processor import FileProcessor

router = APIRouter()


@router.post("", response_model=DatabaseResponse)
async def create_database(
    database_data: DatabaseCreate,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Create a new business database"""
    
    # Check if database name already exists for this business
    existing = db.query(BusinessDatabase).filter(
        BusinessDatabase.business_id == current_business["id"],
        BusinessDatabase.name == database_data.name
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Database with this name already exists"
        )
    
    # Create database
    new_database = BusinessDatabase(
        business_id=current_business["id"],
        name=database_data.name,
        description=database_data.description,
        schema_definition=database_data.schema_definition,
        database_type=database_data.database_type
    )
    
    db.add(new_database)
    db.commit()
    db.refresh(new_database)
    
    # Initialize database structure
    db_manager = DatabaseManager()
    await db_manager.create_database_structure(new_database)
    
    return DatabaseResponse.from_orm(new_database)


@router.get("", response_model=List[DatabaseResponse])
async def list_databases(
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """List all databases for the current business"""
    
    databases = db.query(BusinessDatabase).filter(
        BusinessDatabase.business_id == current_business["id"]
    ).all()
    
    return [DatabaseResponse.from_orm(database) for database in databases]


@router.get("/{database_id}", response_model=DatabaseResponse)
async def get_database(
    database_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get specific database details"""
    
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    return DatabaseResponse.from_orm(database)


@router.put("/{database_id}", response_model=DatabaseResponse)
async def update_database(
    database_id: str,
    database_update: DatabaseUpdate,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Update database configuration"""
    
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Update fields
    if database_update.name is not None:
        database.name = database_update.name
    if database_update.description is not None:
        database.description = database_update.description
    if database_update.schema_definition is not None:
        database.schema_definition = database_update.schema_definition
    
    db.commit()
    db.refresh(database)
    
    return DatabaseResponse.from_orm(database)


@router.delete("/{database_id}")
async def delete_database(
    database_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Delete a database and all its data"""
    
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Delete database and all related data
    db.delete(database)
    db.commit()
    
    return {"message": "Database deleted successfully"}


@router.post("/{database_id}/upload", response_model=DataSourceResponse)
async def upload_data_file(
    database_id: str,
    file: UploadFile = File(...),
    name: Optional[str] = Form(None),
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Upload and process a data file"""
    
    # Verify database exists
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Process file
    file_processor = FileProcessor()
    data_source = await file_processor.process_upload(
        file=file,
        database_id=database_id,
        business_id=current_business["id"],
        name=name or file.filename,
        db=db
    )
    
    return DataSourceResponse.from_orm(data_source)


@router.get("/{database_id}/sources", response_model=List[DataSourceResponse])
async def list_data_sources(
    database_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """List all data sources for a database"""
    
    # Verify database exists
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    sources = db.query(DataSource).filter(
        DataSource.database_id == database_id
    ).all()
    
    return [DataSourceResponse.from_orm(source) for source in sources]


@router.post("/{database_id}/bind-agent", response_model=AgentBindingResponse)
async def bind_agent_to_database(
    database_id: str,
    binding_data: AgentBindingCreate,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Bind an AI agent to a database for MCP access"""
    
    # Verify database exists
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    # Check if binding already exists
    existing_binding = db.query(AgentDatabaseBinding).filter(
        AgentDatabaseBinding.agent_id == binding_data.agent_id,
        AgentDatabaseBinding.database_id == database_id
    ).first()
    
    if existing_binding:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is already bound to this database"
        )
    
    # Create binding
    binding = AgentDatabaseBinding(
        agent_id=binding_data.agent_id,
        database_id=database_id,
        business_id=current_business["id"],
        binding_config=binding_data.binding_config
    )
    
    db.add(binding)
    db.commit()
    db.refresh(binding)
    
    return AgentBindingResponse.from_orm(binding)


@router.get("/{database_id}/bindings", response_model=List[AgentBindingResponse])
async def list_agent_bindings(
    database_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """List all agent bindings for a database"""
    
    # Verify database exists
    database = db.query(BusinessDatabase).filter(
        BusinessDatabase.id == database_id,
        BusinessDatabase.business_id == current_business["id"]
    ).first()
    
    if not database:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Database not found"
        )
    
    bindings = db.query(AgentDatabaseBinding).filter(
        AgentDatabaseBinding.database_id == database_id
    ).all()
    
    return [AgentBindingResponse.from_orm(binding) for binding in bindings]


@router.delete("/bindings/{binding_id}")
async def remove_agent_binding(
    binding_id: str,
    current_business: dict = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Remove an agent binding"""

    binding = db.query(AgentDatabaseBinding).filter(
        AgentDatabaseBinding.id == binding_id,
        AgentDatabaseBinding.business_id == current_business["id"]
    ).first()

    if not binding:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Binding not found"
        )

    db.delete(binding)
    db.commit()

    return {"message": "Binding removed successfully"}
