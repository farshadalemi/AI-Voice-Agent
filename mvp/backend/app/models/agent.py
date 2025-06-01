"""
Agent and conversation models for the AI Voice Agent Platform
"""

from sqlalchemy import Column, String, Integer, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Agent(Base):
    """AI Agent model"""
    
    __tablename__ = "agents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text)
    voice_settings = Column(JSON, default={})
    personality = Column(JSON, default={})
    capabilities = Column(JSON, default=[])
    status = Column(String(20), default="created")  # created, training, ready, error
    webhook_url = Column(String(500))
    phone_numbers = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="agents")
    conversations = relationship("Conversation", back_populates="agent", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Agent(id={self.id}, name={self.name}, business_id={self.business_id})>"
    
    @property
    def is_ready(self):
        """Check if agent is ready for conversations"""
        return self.status == "ready"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "name": self.name,
            "description": self.description,
            "voice_settings": self.voice_settings,
            "personality": self.personality,
            "capabilities": self.capabilities,
            "status": self.status,
            "webhook_url": self.webhook_url,
            "phone_numbers": self.phone_numbers,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Conversation(Base):
    """Conversation model"""
    
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    agent_id = Column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=False, index=True)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True)
    call_id = Column(String(255), unique=True, nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False)
    direction = Column(String(10))  # inbound, outbound
    status = Column(String(20), default="active")  # active, completed, transferred, failed
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True))
    duration_seconds = Column(Integer)
    transcript = Column(JSON, default=[])
    summary = Column(Text)
    sentiment_score = Column(String(5))  # Using string for decimal representation
    customer_satisfaction = Column(Integer)  # 1-5 rating
    outcome = Column(String(50))
    metadata = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    agent = relationship("Agent", back_populates="conversations")
    business = relationship("Business", back_populates="conversations")
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, call_id={self.call_id}, agent_id={self.agent_id})>"
    
    @property
    def is_active(self):
        """Check if conversation is active"""
        return self.status == "active"
    
    @property
    def duration_minutes(self):
        """Get duration in minutes"""
        if self.duration_seconds:
            return round(self.duration_seconds / 60, 2)
        return 0
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "agent_id": str(self.agent_id),
            "business_id": str(self.business_id),
            "call_id": self.call_id,
            "customer_phone": self.customer_phone,
            "direction": self.direction,
            "status": self.status,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "duration_seconds": self.duration_seconds,
            "duration_minutes": self.duration_minutes,
            "transcript": self.transcript,
            "summary": self.summary,
            "sentiment_score": float(self.sentiment_score) if self.sentiment_score else None,
            "customer_satisfaction": self.customer_satisfaction,
            "outcome": self.outcome,
            "metadata": self.metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class UsageRecord(Base):
    """Usage tracking model"""
    
    __tablename__ = "usage_records"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"))
    metric_name = Column(String(50), nullable=False)
    metric_value = Column(Integer, nullable=False)
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="usage_records")
    subscription = relationship("Subscription", back_populates="usage_records")
    
    def __repr__(self):
        return f"<UsageRecord(id={self.id}, metric={self.metric_name}, value={self.metric_value})>"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "subscription_id": str(self.subscription_id) if self.subscription_id else None,
            "metric_name": self.metric_name,
            "metric_value": self.metric_value,
            "period_start": self.period_start.isoformat() if self.period_start else None,
            "period_end": self.period_end.isoformat() if self.period_end else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
