"""
Pydantic schemas for business-related API requests and responses
"""

from pydantic import BaseModel, EmailStr, Field, validator, field_validator, model_validator
from typing import Optional, Dict, Any, List, Union
from datetime import datetime
import uuid


class BusinessRegister(BaseModel):
    """Business registration request schema"""
    business_name: str = Field(..., min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    industry: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(c.isupper() for c in v):
            raise ValueError('Password must contain at least one uppercase letter')
        if not any(c.islower() for c in v):
            raise ValueError('Password must contain at least one lowercase letter')
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        return v
    
    @validator('website')
    def validate_website(cls, v):
        if v and not (v.startswith('http://') or v.startswith('https://')):
            return f'https://{v}'
        return v


class BusinessLogin(BaseModel):
    """Business login request schema"""
    email: EmailStr
    password: str


class BusinessUpdate(BaseModel):
    """Business profile update request schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    industry: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    website: Optional[str] = Field(None, max_length=255)
    settings: Optional[Dict[str, Any]] = None


class BusinessResponse(BaseModel):
    """Business profile response schema"""
    id: str
    name: str
    email: str
    industry: Optional[str]
    phone: Optional[str]
    website: Optional[str]
    settings: Dict[str, Any]
    status: str
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    @field_validator('id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        """Convert UUID to string"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class PlanResponse(BaseModel):
    """Plan response schema"""
    id: str
    name: str
    description: Optional[str]
    price: float
    currency: str
    billing_cycle: str
    features: Dict[str, Any]
    limits: Dict[str, Any]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


class SubscriptionResponse(BaseModel):
    """Subscription response schema"""
    id: str
    business_id: str
    plan_id: str
    status: str
    current_period_start: datetime
    current_period_end: datetime
    stripe_subscription_id: Optional[str]
    created_at: datetime
    updated_at: datetime
    plan: Optional[PlanResponse] = None

    @field_validator('id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        """Convert UUID to string"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    """Subscription creation request schema"""
    plan_id: str
    payment_method: Optional[str] = None


class BusinessProfileResponse(BaseModel):
    """Complete business profile with subscription info"""
    business: BusinessResponse
    subscription: Optional[SubscriptionResponse] = None
    usage: Optional[Dict[str, Any]] = None


class TokenResponse(BaseModel):
    """Authentication token response schema"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    business_id: str


class APIKeyCreate(BaseModel):
    """API key creation request schema"""
    name: str = Field(..., min_length=1, max_length=100)
    permissions: Optional[List[str]] = []
    expires_at: Optional[datetime] = None


class APIKeyResponse(BaseModel):
    """API key response schema"""
    id: str
    business_id: str
    key_prefix: str
    name: Optional[str]
    permissions: List[str]
    last_used_at: Optional[datetime]
    expires_at: Optional[datetime]
    is_active: bool
    created_at: datetime

    @field_validator('id', 'business_id')
    @classmethod
    def convert_uuid_to_str(cls, v: Union[str, uuid.UUID]) -> str:
        """Convert UUID to string"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    class Config:
        from_attributes = True


class APIKeyCreateResponse(BaseModel):
    """API key creation response with full key"""
    api_key: str
    key_info: APIKeyResponse


class UsageResponse(BaseModel):
    """Usage statistics response schema"""
    metric_name: str
    metric_value: int
    period_start: datetime
    period_end: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True


class BusinessStatsResponse(BaseModel):
    """Business statistics response schema"""
    total_agents: int
    total_conversations: int
    total_calls_this_month: int
    average_call_duration: float
    customer_satisfaction_avg: float
    usage_records: List[UsageResponse]


# Standard API response schemas
class SuccessResponse(BaseModel):
    """Standard success response"""
    success: bool = True
    data: Optional[Any] = None
    message: Optional[str] = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: Dict[str, Any]


class PaginatedResponse(BaseModel):
    """Paginated response schema"""
    success: bool = True
    data: List[Any]
    pagination: Dict[str, Any]
