"""
Authentication endpoints for the AI Voice Agent Platform
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from datetime import timedelta, datetime, timezone
import logging

from app.core.database import get_db
from app.core.security import (
    create_access_token, create_refresh_token, verify_token,
    get_password_hash, verify_password, get_current_business
)
from app.models.business import Business, Subscription, Plan
from app.schemas.business import (
    BusinessRegister, BusinessLogin, TokenResponse,
    BusinessResponse, SuccessResponse, ErrorResponse
)

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


@router.post("/register", response_model=SuccessResponse)
async def register_business(
    business_data: BusinessRegister,
    db: Session = Depends(get_db)
):
    """Register a new business account"""
    
    # Check if business already exists
    existing_business = db.query(Business).filter(
        Business.email == business_data.email
    ).first()
    
    if existing_business:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Business with this email already exists"
        )
    
    # Create new business
    hashed_password = get_password_hash(business_data.password)
    
    new_business = Business(
        name=business_data.business_name,
        email=business_data.email,
        password_hash=hashed_password,
        industry=business_data.industry,
        phone=business_data.phone,
        website=business_data.website,
        email_verified=True  # For MVP, auto-verify emails
    )
    
    db.add(new_business)
    db.commit()
    db.refresh(new_business)
    
    # Create default subscription (Starter plan for MVP)
    starter_plan = db.query(Plan).filter(Plan.id == "starter").first()
    if starter_plan:
        subscription = Subscription(
            business_id=new_business.id,
            plan_id="starter",
            current_period_start=datetime.now(timezone.utc),
            current_period_end=datetime.now(timezone.utc) + timedelta(days=30)
        )
        db.add(subscription)
        db.commit()
    
    logger.info(f"New business registered: {new_business.email}")
    
    return SuccessResponse(
        data={
            "business_id": str(new_business.id),
            "email_verification_required": False,  # MVP: auto-verified
            "message": "Business registered successfully"
        }
    )


@router.post("/login", response_model=TokenResponse)
async def login_business(
    login_data: BusinessLogin,
    db: Session = Depends(get_db)
):
    """Authenticate business and return tokens"""
    
    # Find business by email
    business = db.query(Business).filter(
        Business.email == login_data.email
    ).first()
    
    if not business:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(login_data.password, business.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Check if business is active
    if business.status != "active":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Business account is not active"
        )
    
    # Create tokens
    access_token = create_access_token(data={"sub": str(business.id)})
    refresh_token = create_refresh_token(data={"sub": str(business.id)})
    
    logger.info(f"Business logged in: {business.email}")
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes
        business_id=str(business.id)
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_token: str,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    try:
        payload = verify_token(refresh_token)
        business_id = payload.get("sub")
        token_type = payload.get("type")
        
        if business_id is None or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )
    
    # Verify business exists and is active
    business = db.query(Business).filter(Business.id == business_id).first()
    if not business or business.status != "active":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Business not found or inactive"
        )
    
    # Create new tokens
    new_access_token = create_access_token(data={"sub": business_id})
    new_refresh_token = create_refresh_token(data={"sub": business_id})
    
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
        token_type="bearer",
        expires_in=30 * 60,  # 30 minutes
        business_id=business_id
    )


@router.post("/logout", response_model=SuccessResponse)
async def logout_business(
    current_business: Business = Depends(get_current_business)
):
    """Logout business (invalidate tokens)"""
    
    # In a production system, you would add the token to a blacklist
    # For MVP, we'll just return success
    
    logger.info(f"Business logged out: {current_business.email}")
    
    return SuccessResponse(
        data={"message": "Logged out successfully"}
    )


@router.get("/me", response_model=BusinessResponse)
async def get_current_business_info(
    current_business: Business = Depends(get_current_business)
):
    """Get current authenticated business information"""

    # Convert UUID to string manually
    business_data = {
        "id": str(current_business.id),
        "name": current_business.name,
        "email": current_business.email,
        "industry": current_business.industry,
        "phone": current_business.phone,
        "website": current_business.website,
        "settings": current_business.settings or {},
        "status": current_business.status,
        "email_verified": current_business.email_verified,
        "created_at": current_business.created_at,
        "updated_at": current_business.updated_at
    }

    return BusinessResponse(**business_data)


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(
    verification_token: str,
    db: Session = Depends(get_db)
):
    """Verify business email address"""
    
    # For MVP, we'll implement a simple verification
    # In production, this would verify a JWT token sent via email
    
    try:
        payload = verify_token(verification_token)
        business_id = payload.get("sub")
        
        if business_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        business.email_verified = True
        db.commit()
        
        logger.info(f"Email verified for business: {business.email}")
        
        return SuccessResponse(
            data={"message": "Email verified successfully"}
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    email: str,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    
    business = db.query(Business).filter(Business.email == email).first()
    
    # Always return success for security (don't reveal if email exists)
    # In production, send password reset email if business exists
    
    if business:
        logger.info(f"Password reset requested for: {email}")
        # Here you would send a password reset email
    
    return SuccessResponse(
        data={"message": "If the email exists, a password reset link has been sent"}
    )


@router.post("/reset-password", response_model=SuccessResponse)
async def reset_password(
    reset_token: str,
    new_password: str,
    db: Session = Depends(get_db)
):
    """Reset password using reset token"""
    
    try:
        payload = verify_token(reset_token)
        business_id = payload.get("sub")
        
        if business_id is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        business = db.query(Business).filter(Business.id == business_id).first()
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Business not found"
            )
        
        # Update password
        business.password_hash = get_password_hash(new_password)
        db.commit()
        
        logger.info(f"Password reset for business: {business.email}")
        
        return SuccessResponse(
            data={"message": "Password reset successfully"}
        )
        
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
