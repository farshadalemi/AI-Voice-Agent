"""
Voice processing and simulation endpoints for the AI Voice Agent Platform MVP
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
import random
import logging

from app.core.database import get_db
from app.core.security import get_current_business
from app.models.business import Business
from app.models.agent import Agent, Conversation
from app.schemas.agent import (
    SimulateCallRequest, SimulateCallResponse, ConversationMessage,
    ConversationResponse, VoiceAnalytics
)
from app.schemas.business import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/simulate-call", response_model=SimulateCallResponse)
async def simulate_voice_call(
    call_request: SimulateCallRequest,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Simulate a voice call for demonstration purposes"""
    
    # Verify agent belongs to current business
    agent = db.query(Agent).filter(
        and_(
            Agent.id == call_request.agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    if agent.status != "ready":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Agent is not ready for calls"
        )
    
    # Generate unique call ID
    call_id = f"call_{uuid.uuid4().hex[:12]}"
    
    # Create conversation record
    conversation = Conversation(
        agent_id=agent.id,
        business_id=current_business.id,
        call_id=call_id,
        customer_phone=call_request.customer_phone,
        direction="inbound",
        status="active",
        start_time=datetime.now(timezone.utc)
    )
    
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    
    # Generate simulated conversation transcript
    simulated_transcript = generate_mock_conversation(
        agent_name=agent.name,
        customer_message=call_request.customer_message,
        scenario=call_request.scenario,
        duration_seconds=call_request.duration_seconds
    )
    
    # Update conversation with results
    conversation.end_time = datetime.now(timezone.utc)
    conversation.duration_seconds = call_request.duration_seconds
    conversation.transcript = [msg.dict() for msg in simulated_transcript]
    conversation.status = "completed"
    conversation.sentiment_score = str(round(random.uniform(0.6, 0.9), 2))
    conversation.customer_satisfaction = random.randint(4, 5)
    conversation.outcome = "resolved"
    conversation.summary = generate_conversation_summary(simulated_transcript)
    
    db.commit()
    
    logger.info(f"Simulated call completed: {call_id} for agent: {agent.name}")
    
    return SimulateCallResponse(
        conversation_id=str(conversation.id),
        call_id=call_id,
        status="completed",
        simulated_transcript=simulated_transcript,
        summary=conversation.summary,
        duration_seconds=call_request.duration_seconds,
        sentiment_score=float(conversation.sentiment_score),
        customer_satisfaction=conversation.customer_satisfaction
    )


@router.get("/conversations", response_model=List[ConversationResponse])
async def get_all_conversations(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    agent_id: Optional[str] = Query(default=None),
    status: Optional[str] = Query(default=None),
    days: int = Query(default=30, ge=1, le=365)
):
    """Get all conversations for the business"""
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Build query
    query = db.query(Conversation).filter(
        and_(
            Conversation.business_id == current_business.id,
            Conversation.created_at >= start_date
        )
    )
    
    if agent_id:
        query = query.filter(Conversation.agent_id == agent_id)
    
    if status:
        query = query.filter(Conversation.status == status)
    
    conversations = query.order_by(
        Conversation.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [ConversationResponse.from_orm(conv) for conv in conversations]


@router.get("/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(
    conversation_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get specific conversation details"""
    
    conversation = db.query(Conversation).filter(
        and_(
            Conversation.id == conversation_id,
            Conversation.business_id == current_business.id
        )
    ).first()
    
    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found"
        )
    
    return ConversationResponse.from_orm(conversation)


@router.get("/analytics", response_model=VoiceAnalytics)
async def get_voice_analytics(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365)
):
    """Get voice analytics for the business"""
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get conversations in date range
    conversations = db.query(Conversation).filter(
        and_(
            Conversation.business_id == current_business.id,
            Conversation.created_at >= start_date
        )
    ).all()
    
    total_calls = len(conversations)
    successful_calls = len([c for c in conversations if c.status == "completed"])
    failed_calls = len([c for c in conversations if c.status == "failed"])
    
    # Calculate metrics
    if conversations:
        total_duration = sum(c.duration_seconds or 0 for c in conversations)
        average_duration = total_duration / len(conversations)
        total_duration_minutes = total_duration / 60
        
        satisfaction_scores = [
            c.customer_satisfaction for c in conversations
            if c.customer_satisfaction is not None
        ]
        customer_satisfaction_avg = (
            sum(satisfaction_scores) / len(satisfaction_scores)
            if satisfaction_scores else 0
        )
    else:
        average_duration = 0
        total_duration_minutes = 0
        customer_satisfaction_avg = 0
    
    # Mock sentiment distribution
    sentiment_distribution = {
        "positive": int(total_calls * 0.7),
        "neutral": int(total_calls * 0.2),
        "negative": int(total_calls * 0.1)
    }
    
    # Mock call outcomes
    call_outcomes = {
        "resolved": successful_calls,
        "transferred": int(total_calls * 0.1),
        "abandoned": failed_calls
    }
    
    # Generate hourly distribution (mock data)
    hourly_distribution = []
    for hour in range(24):
        call_count = random.randint(0, max(1, total_calls // 10))
        hourly_distribution.append({
            "hour": hour,
            "calls": call_count
        })
    
    # Generate daily distribution
    daily_distribution = []
    for i in range(min(days, 30)):  # Last 30 days max
        date = end_date - timedelta(days=i)
        daily_conversations = len([
            c for c in conversations
            if c.created_at.date() == date.date()
        ])
        daily_distribution.append({
            "date": date.date().isoformat(),
            "calls": daily_conversations,
            "successful": int(daily_conversations * 0.8),
            "failed": int(daily_conversations * 0.2)
        })
    
    return VoiceAnalytics(
        total_calls=total_calls,
        successful_calls=successful_calls,
        failed_calls=failed_calls,
        average_duration=average_duration,
        total_duration_minutes=total_duration_minutes,
        customer_satisfaction_avg=customer_satisfaction_avg,
        sentiment_distribution=sentiment_distribution,
        call_outcomes=call_outcomes,
        hourly_distribution=hourly_distribution,
        daily_distribution=daily_distribution
    )


def generate_mock_conversation(
    agent_name: str,
    customer_message: str,
    scenario: str,
    duration_seconds: int
) -> List[ConversationMessage]:
    """Generate a mock conversation transcript"""
    
    now = datetime.now(timezone.utc)
    messages = []
    
    # Customer starts the conversation
    messages.append(ConversationMessage(
        speaker="customer",
        message=customer_message,
        timestamp=now,
        intent="initial_inquiry",
        confidence=0.95
    ))
    
    # Agent responses based on scenario
    if scenario == "customer_inquiry":
        messages.append(ConversationMessage(
            speaker="agent",
            message=f"Hello! I'm {agent_name}, your AI assistant. I'd be happy to help you with your inquiry. Could you please provide me with more details?",
            timestamp=now + timedelta(seconds=2),
            intent="greeting",
            confidence=0.98
        ))
        
        messages.append(ConversationMessage(
            speaker="customer",
            message="I'm having trouble with my recent order. It hasn't arrived yet and I placed it a week ago.",
            timestamp=now + timedelta(seconds=15),
            intent="order_status",
            confidence=0.92
        ))
        
        messages.append(ConversationMessage(
            speaker="agent",
            message="I understand your concern about your order. Let me check the status for you. Could you please provide your order number?",
            timestamp=now + timedelta(seconds=18),
            intent="order_lookup",
            confidence=0.96
        ))
        
        messages.append(ConversationMessage(
            speaker="customer",
            message="Yes, it's order number 12345.",
            timestamp=now + timedelta(seconds=25),
            intent="provide_order_number",
            confidence=0.99
        ))
        
        messages.append(ConversationMessage(
            speaker="agent",
            message="Thank you. I've found your order and I can see it's currently in transit. It should arrive within the next 2 business days. I'll send you a tracking link via email.",
            timestamp=now + timedelta(seconds=30),
            intent="order_status_update",
            confidence=0.94
        ))
        
        messages.append(ConversationMessage(
            speaker="customer",
            message="Great, thank you so much for your help!",
            timestamp=now + timedelta(seconds=40),
            intent="satisfaction",
            confidence=0.97
        ))
        
        messages.append(ConversationMessage(
            speaker="agent",
            message="You're welcome! Is there anything else I can help you with today?",
            timestamp=now + timedelta(seconds=42),
            intent="additional_help",
            confidence=0.98
        ))
        
        messages.append(ConversationMessage(
            speaker="customer",
            message="No, that's all. Thank you!",
            timestamp=now + timedelta(seconds=45),
            intent="end_conversation",
            confidence=0.99
        ))
    
    return messages


def generate_conversation_summary(messages: List[ConversationMessage]) -> str:
    """Generate a summary of the conversation"""
    
    customer_messages = [msg for msg in messages if msg.speaker == "customer"]
    
    if any("order" in msg.message.lower() for msg in customer_messages):
        return "Customer inquired about order status. Agent provided tracking information and resolved the issue successfully."
    elif any("billing" in msg.message.lower() for msg in customer_messages):
        return "Customer had a billing question. Agent provided clarification and resolved the billing concern."
    elif any("technical" in msg.message.lower() or "problem" in msg.message.lower() for msg in customer_messages):
        return "Customer reported a technical issue. Agent provided troubleshooting steps and resolved the problem."
    else:
        return "Customer contacted support with a general inquiry. Agent provided assistance and resolved the matter successfully."
