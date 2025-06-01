"""
Business management endpoints for the AI Voice Agent Platform
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import datetime, timedelta, timezone
from typing import List, Optional
import logging

from app.core.database import get_db
from app.core.security import get_current_business
from app.models.business import Business, Plan, Subscription
from app.models.agent import Agent, Conversation, UsageRecord
from app.schemas.business import (
    BusinessUpdate, BusinessResponse, PlanResponse, SubscriptionResponse,
    SubscriptionCreate, BusinessProfileResponse, BusinessStatsResponse,
    UsageResponse, SuccessResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/profile", response_model=BusinessProfileResponse)
async def get_business_profile(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get complete business profile with subscription and usage info"""
    
    # Get current subscription
    subscription = db.query(Subscription).filter(
        and_(
            Subscription.business_id == current_business.id,
            Subscription.status == "active"
        )
    ).first()
    
    subscription_data = None
    if subscription:
        plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
        subscription_data = SubscriptionResponse.from_orm(subscription)
        if plan:
            subscription_data.plan = PlanResponse.from_orm(plan)
    
    # Get usage statistics for current month
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Count calls this month
    calls_this_month = db.query(func.count(Conversation.id)).filter(
        and_(
            Conversation.business_id == current_business.id,
            Conversation.created_at >= month_start
        )
    ).scalar() or 0
    
    # Get plan limits
    plan_limits = {}
    if subscription and subscription_data and subscription_data.plan:
        plan_limits = subscription_data.plan.limits
    
    usage_data = {
        "calls_this_month": calls_this_month,
        "calls_limit": plan_limits.get("calls_per_month", 0),
        "agents_count": db.query(func.count(Agent.id)).filter(
            Agent.business_id == current_business.id
        ).scalar() or 0,
        "agents_limit": plan_limits.get("agents", 1)
    }
    
    return BusinessProfileResponse(
        business=BusinessResponse.from_orm(current_business),
        subscription=subscription_data,
        usage=usage_data
    )


@router.put("/profile", response_model=BusinessResponse)
async def update_business_profile(
    business_update: BusinessUpdate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Update business profile"""
    
    # Update fields if provided
    if business_update.name is not None:
        current_business.name = business_update.name
    if business_update.industry is not None:
        current_business.industry = business_update.industry
    if business_update.phone is not None:
        current_business.phone = business_update.phone
    if business_update.website is not None:
        current_business.website = business_update.website
    if business_update.settings is not None:
        current_business.settings = business_update.settings
    
    db.commit()
    db.refresh(current_business)
    
    logger.info(f"Business profile updated: {current_business.email}")
    
    return BusinessResponse.from_orm(current_business)


@router.get("/plans", response_model=List[PlanResponse])
async def get_available_plans(db: Session = Depends(get_db)):
    """Get all available subscription plans"""
    
    plans = db.query(Plan).filter(Plan.is_active == True).all()
    return [PlanResponse.from_orm(plan) for plan in plans]


@router.post("/subscribe", response_model=SuccessResponse)
async def subscribe_to_plan(
    subscription_data: SubscriptionCreate,
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Subscribe to a plan"""
    
    # Verify plan exists
    plan = db.query(Plan).filter(Plan.id == subscription_data.plan_id).first()
    if not plan:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Plan not found"
        )
    
    # Check if business already has an active subscription
    existing_subscription = db.query(Subscription).filter(
        and_(
            Subscription.business_id == current_business.id,
            Subscription.status == "active"
        )
    ).first()
    
    if existing_subscription:
        # Update existing subscription
        existing_subscription.plan_id = subscription_data.plan_id
        existing_subscription.current_period_start = datetime.now(timezone.utc)
        existing_subscription.current_period_end = datetime.now(timezone.utc) + timedelta(days=30)
        db.commit()
        
        logger.info(f"Subscription updated for business: {current_business.email} to plan: {subscription_data.plan_id}")
    else:
        # Create new subscription
        new_subscription = Subscription(
            business_id=current_business.id,
            plan_id=subscription_data.plan_id,
            current_period_start=datetime.now(timezone.utc),
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db.add(new_subscription)
        db.commit()
        
        logger.info(f"New subscription created for business: {current_business.email} to plan: {subscription_data.plan_id}")
    
    return SuccessResponse(
        data={
            "message": f"Successfully subscribed to {plan.name} plan",
            "plan_id": subscription_data.plan_id
        }
    )


@router.get("/subscription", response_model=SubscriptionResponse)
async def get_current_subscription(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Get current business subscription"""
    
    subscription = db.query(Subscription).filter(
        and_(
            Subscription.business_id == current_business.id,
            Subscription.status == "active"
        )
    ).first()
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active subscription found"
        )
    
    # Include plan information
    plan = db.query(Plan).filter(Plan.id == subscription.plan_id).first()
    subscription_data = SubscriptionResponse.from_orm(subscription)
    if plan:
        subscription_data.plan = PlanResponse.from_orm(plan)
    
    return subscription_data


@router.get("/stats", response_model=BusinessStatsResponse)
async def get_business_statistics(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db),
    days: int = Query(default=30, ge=1, le=365)
):
    """Get business statistics and analytics"""
    
    # Calculate date range
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    # Get basic counts
    total_agents = db.query(func.count(Agent.id)).filter(
        Agent.business_id == current_business.id
    ).scalar() or 0
    
    total_conversations = db.query(func.count(Conversation.id)).filter(
        Conversation.business_id == current_business.id
    ).scalar() or 0
    
    # Get conversations in date range
    conversations_in_range = db.query(Conversation).filter(
        and_(
            Conversation.business_id == current_business.id,
            Conversation.created_at >= start_date,
            Conversation.created_at <= end_date
        )
    ).all()
    
    total_calls_this_period = len(conversations_in_range)
    
    # Calculate averages
    if conversations_in_range:
        total_duration = sum(
            conv.duration_seconds or 0 for conv in conversations_in_range
        )
        average_call_duration = total_duration / len(conversations_in_range) if conversations_in_range else 0
        
        satisfaction_scores = [
            conv.customer_satisfaction for conv in conversations_in_range
            if conv.customer_satisfaction is not None
        ]
        customer_satisfaction_avg = (
            sum(satisfaction_scores) / len(satisfaction_scores)
            if satisfaction_scores else 0
        )
    else:
        average_call_duration = 0
        customer_satisfaction_avg = 0
    
    # Get usage records
    usage_records = db.query(UsageRecord).filter(
        and_(
            UsageRecord.business_id == current_business.id,
            UsageRecord.period_start >= start_date
        )
    ).all()
    
    return BusinessStatsResponse(
        total_agents=total_agents,
        total_conversations=total_conversations,
        total_calls_this_month=total_calls_this_period,
        average_call_duration=average_call_duration,
        customer_satisfaction_avg=customer_satisfaction_avg,
        usage_records=[UsageResponse.from_orm(record) for record in usage_records]
    )


@router.delete("/account", response_model=SuccessResponse)
async def delete_business_account(
    current_business: Business = Depends(get_current_business),
    db: Session = Depends(get_db)
):
    """Delete business account (soft delete)"""
    
    # Soft delete by changing status
    current_business.status = "deleted"
    db.commit()
    
    logger.info(f"Business account deleted: {current_business.email}")
    
    return SuccessResponse(
        data={"message": "Business account deleted successfully"}
    )
