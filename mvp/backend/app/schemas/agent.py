"""
Pydantic schemas for agent-related API requests and responses
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
import uuid


class VoiceSettings(BaseModel):
    """Voice settings schema"""
    voice_id: str = Field(default="voice_sarah_professional")
    speed: float = Field(default=1.0, ge=0.5, le=2.0)
    pitch: float = Field(default=0.0, ge=-1.0, le=1.0)
    volume: float = Field(default=1.0, ge=0.1, le=2.0)
    
    class Config:
        schema_extra = {
            "example": {
                "voice_id": "voice_sarah_professional",
                "speed": 1.0,
                "pitch": 0.0,
                "volume": 1.0
            }
        }


class PersonalitySettings(BaseModel):
    """Personality settings schema"""
    tone: str = Field(default="friendly", regex="^(friendly|professional|casual|formal)$")
    formality: str = Field(default="professional", regex="^(informal|professional|formal)$")
    empathy_level: str = Field(default="medium", regex="^(low|medium|high)$")
    response_style: str = Field(default="concise", regex="^(concise|detailed|conversational)$")
    
    class Config:
        schema_extra = {
            "example": {
                "tone": "friendly",
                "formality": "professional",
                "empathy_level": "high",
                "response_style": "conversational"
            }
        }


class AgentCreate(BaseModel):
    """Agent creation request schema"""
    name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    voice_settings: Optional[VoiceSettings] = VoiceSettings()
    personality: Optional[PersonalitySettings] = PersonalitySettings()
    capabilities: Optional[List[str]] = Field(default=[])
    phone_numbers: Optional[List[str]] = Field(default=[])
    
    @validator('capabilities')
    def validate_capabilities(cls, v):
        allowed_capabilities = [
            "order_status", "product_information", "appointment_booking",
            "customer_support", "billing_inquiries", "technical_support",
            "sales_assistance", "lead_qualification"
        ]
        for capability in v:
            if capability not in allowed_capabilities:
                raise ValueError(f'Invalid capability: {capability}')
        return v
    
    @validator('phone_numbers')
    def validate_phone_numbers(cls, v):
        for phone in v:
            if not phone.startswith('+'):
                raise ValueError('Phone numbers must include country code (e.g., +1234567890)')
        return v


class AgentUpdate(BaseModel):
    """Agent update request schema"""
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    voice_settings: Optional[VoiceSettings] = None
    personality: Optional[PersonalitySettings] = None
    capabilities: Optional[List[str]] = None
    phone_numbers: Optional[List[str]] = None
    status: Optional[str] = Field(None, regex="^(created|training|ready|error)$")


class AgentResponse(BaseModel):
    """Agent response schema"""
    id: str
    business_id: str
    name: str
    description: Optional[str]
    voice_settings: Dict[str, Any]
    personality: Dict[str, Any]
    capabilities: List[str]
    status: str
    webhook_url: Optional[str]
    phone_numbers: List[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ConversationMessage(BaseModel):
    """Conversation message schema"""
    speaker: str = Field(..., regex="^(customer|agent)$")
    message: str
    timestamp: datetime
    intent: Optional[str] = None
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)


class ConversationCreate(BaseModel):
    """Conversation creation request schema"""
    agent_id: str
    customer_phone: str = Field(..., regex=r'^\+\d{10,15}$')
    direction: str = Field(..., regex="^(inbound|outbound)$")
    metadata: Optional[Dict[str, Any]] = {}


class ConversationUpdate(BaseModel):
    """Conversation update request schema"""
    status: Optional[str] = Field(None, regex="^(active|completed|transferred|failed)$")
    end_time: Optional[datetime] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    transcript: Optional[List[ConversationMessage]] = None
    summary: Optional[str] = Field(None, max_length=1000)
    sentiment_score: Optional[float] = Field(None, ge=-1.0, le=1.0)
    customer_satisfaction: Optional[int] = Field(None, ge=1, le=5)
    outcome: Optional[str] = Field(None, max_length=50)
    metadata: Optional[Dict[str, Any]] = None


class ConversationResponse(BaseModel):
    """Conversation response schema"""
    id: str
    agent_id: str
    business_id: str
    call_id: str
    customer_phone: str
    direction: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    duration_seconds: Optional[int]
    duration_minutes: Optional[float]
    transcript: List[Dict[str, Any]]
    summary: Optional[str]
    sentiment_score: Optional[float]
    customer_satisfaction: Optional[int]
    outcome: Optional[str]
    metadata: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True


class SimulateCallRequest(BaseModel):
    """Simulate call request schema"""
    agent_id: str
    customer_phone: str = Field(..., regex=r'^\+\d{10,15}$')
    scenario: str = Field(default="customer_inquiry")
    duration_seconds: Optional[int] = Field(default=120, ge=10, le=600)
    customer_message: Optional[str] = Field(default="Hello, I need help with my order")


class SimulateCallResponse(BaseModel):
    """Simulate call response schema"""
    conversation_id: str
    call_id: str
    status: str
    simulated_transcript: List[ConversationMessage]
    summary: str
    duration_seconds: int
    sentiment_score: float
    customer_satisfaction: int


class AgentAnalytics(BaseModel):
    """Agent analytics response schema"""
    agent_id: str
    total_conversations: int
    successful_conversations: int
    average_duration_seconds: float
    average_sentiment_score: float
    average_customer_satisfaction: float
    top_intents: List[Dict[str, Any]]
    conversation_outcomes: Dict[str, int]
    daily_stats: List[Dict[str, Any]]


class VoiceAnalytics(BaseModel):
    """Voice analytics response schema"""
    total_calls: int
    successful_calls: int
    failed_calls: int
    average_duration: float
    total_duration_minutes: float
    customer_satisfaction_avg: float
    sentiment_distribution: Dict[str, int]
    call_outcomes: Dict[str, int]
    hourly_distribution: List[Dict[str, Any]]
    daily_distribution: List[Dict[str, Any]]
