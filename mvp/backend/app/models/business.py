"""
Business model for the AI Voice Agent Platform
"""

from sqlalchemy import Column, String, Boolean, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid

from app.core.database import Base


class Business(Base):
    """Business entity model"""
    
    __tablename__ = "businesses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    industry = Column(String(100))
    phone = Column(String(20))
    website = Column(String(255))
    settings = Column(JSON, default={})
    status = Column(String(20), default="active")  # active, suspended, deleted
    email_verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="business", cascade="all, delete-orphan")
    agents = relationship("Agent", back_populates="business", cascade="all, delete-orphan")
    api_keys = relationship("APIKey", back_populates="business", cascade="all, delete-orphan")
    conversations = relationship("Conversation", back_populates="business", cascade="all, delete-orphan")
    usage_records = relationship("UsageRecord", back_populates="business", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Business(id={self.id}, name={self.name}, email={self.email})>"
    
    @property
    def is_active(self):
        """Check if business is active"""
        return self.status == "active"
    
    @property
    def is_verified(self):
        """Check if business email is verified"""
        return self.email_verified
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "industry": self.industry,
            "phone": self.phone,
            "website": self.website,
            "settings": self.settings,
            "status": self.status,
            "email_verified": self.email_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class Plan(Base):
    """Subscription plan model"""
    
    __tablename__ = "plans"
    
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    price = Column(String(10), nullable=False)  # Using string for decimal representation
    currency = Column(String(3), default="USD")
    billing_cycle = Column(String(20), default="monthly")  # monthly, yearly
    features = Column(JSON, nullable=False)
    limits = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    subscriptions = relationship("Subscription", back_populates="plan")
    
    def __repr__(self):
        return f"<Plan(id={self.id}, name={self.name}, price={self.price})>"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "price": float(self.price),
            "currency": self.currency,
            "billing_cycle": self.billing_cycle,
            "features": self.features,
            "limits": self.limits,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Subscription(Base):
    """Business subscription model"""
    
    __tablename__ = "subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True)
    plan_id = Column(String(50), ForeignKey("plans.id"), nullable=False)
    status = Column(String(20), default="active")  # active, cancelled, expired, past_due
    current_period_start = Column(DateTime(timezone=True), nullable=False)
    current_period_end = Column(DateTime(timezone=True), nullable=False)
    stripe_subscription_id = Column(String(255))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    usage_records = relationship("UsageRecord", back_populates="subscription", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Subscription(id={self.id}, business_id={self.business_id}, plan_id={self.plan_id})>"
    
    @property
    def is_active(self):
        """Check if subscription is active"""
        return self.status == "active"
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "plan_id": self.plan_id,
            "status": self.status,
            "current_period_start": self.current_period_start.isoformat() if self.current_period_start else None,
            "current_period_end": self.current_period_end.isoformat() if self.current_period_end else None,
            "stripe_subscription_id": self.stripe_subscription_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class APIKey(Base):
    """API key model for business authentication"""
    
    __tablename__ = "api_keys"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    business_id = Column(UUID(as_uuid=True), ForeignKey("businesses.id"), nullable=False, index=True)
    key_hash = Column(String(255), nullable=False, unique=True, index=True)
    key_prefix = Column(String(20), nullable=False)
    name = Column(String(100))
    permissions = Column(JSON, default=[])
    last_used_at = Column(DateTime(timezone=True))
    expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    business = relationship("Business", back_populates="api_keys")
    
    def __repr__(self):
        return f"<APIKey(id={self.id}, business_id={self.business_id}, prefix={self.key_prefix})>"
    
    @property
    def is_valid(self):
        """Check if API key is valid"""
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < func.now():
            return False
        return True
    
    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": str(self.id),
            "business_id": str(self.business_id),
            "key_prefix": self.key_prefix,
            "name": self.name,
            "permissions": self.permissions,
            "last_used_at": self.last_used_at.isoformat() if self.last_used_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
