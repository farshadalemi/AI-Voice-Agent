"""
Agent management endpoints for the AI Voice Agent Platform
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timezone, timedelta
from typing import List, Optional
import uuid
import logging

from app.core.database import get_db
from app.core.security import get_current_business
from app.models.business import Business
from app.models.agent import Agent, Conversation
from app.schemas.agent import (
    AgentCreate, AgentUpdate, AgentResponse, ConversationResponse,
    AgentAnalytics, SimulateCallRequest, SimulateCallResponse,
    ConversationMessage
)
from app.schemas.business import SuccessResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=AgentResponse)
async def create_agent(
    agent_data: AgentCreate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Create a new AI agent"""
    
    # Check agent limit based on subscription plan
    current_agents = db.query(func.count(Agent.id)).filter(
        Agent.business_id == current_business.id
    ).scalar() or 0
    
    # For MVP, allow up to 3 agents per business
    if current_agents >= 3:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent limit reached for your subscription plan"
        )
    
    # Create new agent
    new_agent = Agent(
        business_id=current_business.id,
        name=agent_data.name,
        description=agent_data.description,
        voice_settings=agent_data.voice_settings.dict() if agent_data.voice_settings else {},
        personality=agent_data.personality.dict() if agent_data.personality else {},
        capabilities=agent_data.capabilities or [],
        phone_numbers=agent_data.phone_numbers or [],
        status="ready"  # For MVP, agents are immediately ready
    )
    
    db.add(new_agent)
    db.commit()
    db.refresh(new_agent)
    
    logger.info(f"New agent created: {new_agent.name} for business: {current_business.email}")
    
    return AgentResponse.from_orm(new_agent)


@router.get("", response_model=List[AgentResponse])
async def list_agents(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100)
):
    """List all agents for the current business"""
    
    agents = db.query(Agent).filter(
        Agent.business_id == current_business.id
    ).offset(skip).limit(limit).all()
    
    return [AgentResponse.from_orm(agent) for agent in agents]


@router.get("/{agent_id}", response_model=AgentResponse)
async def get_agent(
    agent_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get specific agent details"""
    
    agent = db.query(Agent).filter(
        and_(
            Agent.id == agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    return AgentResponse.from_orm(agent)


@router.put("/{agent_id}", response_model=AgentResponse)
async def update_agent(
    agent_id: str,
    agent_update: AgentUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Update agent configuration"""
    
    agent = db.query(Agent).filter(
        and_(
            Agent.id == agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Update fields if provided
    if agent_update.name is not None:
        agent.name = agent_update.name
    if agent_update.description is not None:
        agent.description = agent_update.description
    if agent_update.voice_settings is not None:
        agent.voice_settings = agent_update.voice_settings.dict()
    if agent_update.personality is not None:
        agent.personality = agent_update.personality.dict()
    if agent_update.capabilities is not None:
        agent.capabilities = agent_update.capabilities
    if agent_update.phone_numbers is not None:
        agent.phone_numbers = agent_update.phone_numbers
    if agent_update.status is not None:
        agent.status = agent_update.status
    
    db.commit()
    db.refresh(agent)
    
    logger.info(f"Agent updated: {agent.name} for business: {current_business.email}")
    
    return AgentResponse.from_orm(agent)


@router.delete("/{agent_id}", response_model=SuccessResponse)
async def delete_agent(
    agent_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Delete an agent"""
    
    agent = db.query(Agent).filter(
        and_(
            Agent.id == agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Delete agent and all related conversations
    db.delete(agent)
    db.commit()
    
    logger.info(f"Agent deleted: {agent.name} for business: {current_business.email}")
    
    return SuccessResponse(
        data={"message": f"Agent '{agent.name}' deleted successfully"}
    )


@router.get("/{agent_id}/conversations", response_model=List[ConversationResponse])
async def get_agent_conversations(
    agent_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=100),
    status: Optional[str] = Query(default=None)
):
    """Get conversations for a specific agent"""
    
    # Verify agent belongs to current business
    agent = db.query(Agent).filter(
        and_(
            Agent.id == agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Build query
    query = db.query(Conversation).filter(Conversation.agent_id == agent_id)
    
    if status:
        query = query.filter(Conversation.status == status)
    
    conversations = query.order_by(
        Conversation.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    return [ConversationResponse.from_orm(conv) for conv in conversations]


@router.get("/{agent_id}/analytics", response_model=AgentAnalytics)
async def get_agent_analytics(
    agent_id: str,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365)
):
    """Get analytics for a specific agent"""
    
    # Verify agent belongs to current business
    agent = db.query(Agent).filter(
        and_(
            Agent.id == agent_id,
            Agent.business_id == current_business.id
        )
    ).first()
    
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found"
        )
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get conversations in date range
    conversations = db.query(Conversation).filter(
        and_(
            Conversation.agent_id == agent_id,
            Conversation.created_at >= start_date,
            Conversation.created_at <= end_date
        )
    ).all()
    
    total_conversations = len(conversations)
    successful_conversations = len([c for c in conversations if c.status == "completed"])
    
    # Calculate averages
    if conversations:
        total_duration = sum(c.duration_seconds or 0 for c in conversations)
        average_duration = total_duration / len(conversations)
        
        sentiment_scores = [
            float(c.sentiment_score) for c in conversations
            if c.sentiment_score is not None
        ]
        average_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
        
        satisfaction_scores = [
            c.customer_satisfaction for c in conversations
            if c.customer_satisfaction is not None
        ]
        average_satisfaction = sum(satisfaction_scores) / len(satisfaction_scores) if satisfaction_scores else 0
    else:
        average_duration = 0
        average_sentiment = 0
        average_satisfaction = 0
    
    # Mock top intents and outcomes for MVP
    top_intents = [
        {"intent": "customer_support", "count": int(total_conversations * 0.4)},
        {"intent": "product_inquiry", "count": int(total_conversations * 0.3)},
        {"intent": "billing_question", "count": int(total_conversations * 0.2)},
        {"intent": "technical_support", "count": int(total_conversations * 0.1)}
    ]
    
    conversation_outcomes = {
        "resolved": successful_conversations,
        "transferred": int(total_conversations * 0.1),
        "abandoned": total_conversations - successful_conversations - int(total_conversations * 0.1)
    }
    
    # Mock daily stats
    daily_stats = []
    for i in range(min(days, 7)):  # Last 7 days
        date = end_date - timedelta(days=i)
        daily_conversations = len([
            c for c in conversations
            if c.created_at.date() == date.date()
        ])
        daily_stats.append({
            "date": date.date().isoformat(),
            "conversations": daily_conversations,
            "average_duration": average_duration if daily_conversations > 0 else 0
        })
    
    return AgentAnalytics(
        agent_id=agent_id,
        total_conversations=total_conversations,
        successful_conversations=successful_conversations,
        average_duration_seconds=average_duration,
        average_sentiment_score=average_sentiment,
        average_customer_satisfaction=average_satisfaction,
        top_intents=top_intents,
        conversation_outcomes=conversation_outcomes,
        daily_stats=daily_stats
    )
