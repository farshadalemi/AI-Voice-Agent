"""
Configuration settings for Data Integration Service
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "Data Integration Service"
    DEBUG: bool = False
    VERSION: str = "1.0.0"
    
    # Database
    DATABASE_URL: str = "postgresql://voiceagent:voiceagent_password@localhost:5432/voiceagent_db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Vector Database
    VECTOR_DB_URL: str = "http://localhost:6333"
    VECTOR_COLLECTION_NAME: str = "business_knowledge"
    
    # File Storage
    FILE_STORAGE_PATH: str = "/app/storage"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    SUPPORTED_FORMATS: List[str] = ["xlsx", "csv", "json", "pdf", "txt", "docx"]
    
    # AI & LLM
    OPENAI_API_KEY: str = "sk-demo-key"
    EMBEDDING_MODEL: str = "text-embedding-ada-002"
    CHAT_MODEL: str = "gpt-3.5-turbo"

    # MCP Server
    MCP_SERVER_HOST: str = "0.0.0.0"
    MCP_SERVER_PORT: int = 8002

    # JWT Settings (shared with main service)
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]
    
    # MCP Server
    MCP_SERVER_PORT: int = 8002
    MCP_SERVER_HOST: str = "0.0.0.0"
    
    # WebSocket
    WEBSOCKET_PORT: int = 8003
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000"
    ]
    
    # Processing
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200
    MAX_CONCURRENT_UPLOADS: int = 5
    
    # Monitoring
    ENABLE_METRICS: bool = True
    SENTRY_DSN: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
