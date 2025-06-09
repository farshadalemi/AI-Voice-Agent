"""
Database configuration and session management for Data Integration Service
"""

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool
from typing import Generator
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

# SQLAlchemy engine
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    pool_pre_ping=True,
    echo=settings.DEBUG,
    connect_args={
        "check_same_thread": False
    } if "sqlite" in settings.DATABASE_URL else {}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Database session dependency
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_db_session() -> Generator[Session, None, None]:
    """
    Get database session for background tasks
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


async def init_db():
    """Initialize database tables"""
    try:
        # Import all models to ensure they are registered
        from app.models.database import BusinessDatabase, DataSource, DataChunk, AgentDatabaseBinding, ProcessingJob, Base as ModelsBase

        # Create all tables using the models' Base class
        ModelsBase.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")

    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
