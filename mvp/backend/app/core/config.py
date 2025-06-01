"""
Configuration settings for the AI Voice Agent Platform MVP
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Optional
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Application
    APP_NAME: str = "AI Voice Agent Platform MVP"
    VERSION: str = "1.0.0-mvp"
    ENVIRONMENT: str = Field(default="development", env="ENVIRONMENT")
    DEBUG: bool = Field(default=True, env="DEBUG")
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    
    # API
    API_V1_STR: str = "/api/v1"
    
    # Database
    DATABASE_URL: str = Field(env="DATABASE_URL")
    
    # Redis
    REDIS_URL: str = Field(env="REDIS_URL")
    
    # JWT
    JWT_SECRET_KEY: str = Field(env="JWT_SECRET_KEY")
    JWT_ALGORITHM: str = Field(default="HS256", env="JWT_ALGORITHM")
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(default=30, env="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = Field(default=7, env="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # CORS
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"],
        env="CORS_ORIGINS"
    )
    
    # External APIs (Mock for MVP)
    OPENAI_API_KEY: str = Field(default="sk-demo-key", env="OPENAI_API_KEY")
    ELEVENLABS_API_KEY: str = Field(default="demo-key", env="ELEVENLABS_API_KEY")
    PINECONE_API_KEY: str = Field(default="demo-key", env="PINECONE_API_KEY")
    PINECONE_ENVIRONMENT: str = Field(default="demo", env="PINECONE_ENVIRONMENT")
    
    # Twilio (Mock for MVP)
    TWILIO_ACCOUNT_SID: str = Field(default="demo-sid", env="TWILIO_ACCOUNT_SID")
    TWILIO_AUTH_TOKEN: str = Field(default="demo-token", env="TWILIO_AUTH_TOKEN")
    TWILIO_PHONE_NUMBER: str = Field(default="+1234567890", env="TWILIO_PHONE_NUMBER")
    
    # Email
    SMTP_HOST: Optional[str] = Field(default=None, env="SMTP_HOST")
    SMTP_PORT: int = Field(default=587, env="SMTP_PORT")
    SMTP_USER: Optional[str] = Field(default=None, env="SMTP_USER")
    SMTP_PASSWORD: Optional[str] = Field(default=None, env="SMTP_PASSWORD")
    EMAIL_FROM: str = Field(default="noreply@voiceagent.platform", env="EMAIL_FROM")
    
    # File Upload
    UPLOAD_DIR: str = Field(default="./uploads", env="UPLOAD_DIR")
    MAX_FILE_SIZE: int = Field(default=10485760, env="MAX_FILE_SIZE")  # 10MB
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = Field(default=100, env="RATE_LIMIT_REQUESTS_PER_MINUTE")
    RATE_LIMIT_BURST: int = Field(default=20, env="RATE_LIMIT_BURST")
    
    # Security
    BCRYPT_ROUNDS: int = Field(default=12, env="BCRYPT_ROUNDS")
    SESSION_TIMEOUT_MINUTES: int = Field(default=60, env="SESSION_TIMEOUT_MINUTES")
    
    # Mock Services
    ENABLE_MOCK_SERVICES: bool = Field(default=True, env="ENABLE_MOCK_SERVICES")
    MOCK_CALL_DURATION_SECONDS: int = Field(default=120, env="MOCK_CALL_DURATION_SECONDS")
    MOCK_RESPONSE_DELAY_MS: int = Field(default=500, env="MOCK_RESPONSE_DELAY_MS")
    
    # Stripe (for future billing)
    STRIPE_PUBLISHABLE_KEY: Optional[str] = Field(default=None, env="STRIPE_PUBLISHABLE_KEY")
    STRIPE_SECRET_KEY: Optional[str] = Field(default=None, env="STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: Optional[str] = Field(default=None, env="STRIPE_WEBHOOK_SECRET")
    
    # Analytics
    ENABLE_ANALYTICS: bool = Field(default=True, env="ENABLE_ANALYTICS")
    ANALYTICS_RETENTION_DAYS: int = Field(default=90, env="ANALYTICS_RETENTION_DAYS")
    
    # Feature Flags
    ENABLE_VOICE_CLONING: bool = Field(default=False, env="ENABLE_VOICE_CLONING")
    ENABLE_MULTI_LANGUAGE: bool = Field(default=False, env="ENABLE_MULTI_LANGUAGE")
    ENABLE_CRM_INTEGRATION: bool = Field(default=False, env="ENABLE_CRM_INTEGRATION")
    ENABLE_ADVANCED_ANALYTICS: bool = Field(default=False, env="ENABLE_ADVANCED_ANALYTICS")
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Parse CORS origins if provided as string
        if isinstance(self.CORS_ORIGINS, str):
            self.CORS_ORIGINS = [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
        
        # Ensure upload directory exists
        os.makedirs(self.UPLOAD_DIR, exist_ok=True)


# Create settings instance
settings = Settings()
