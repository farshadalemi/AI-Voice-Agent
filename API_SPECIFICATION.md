# AI Voice Agent Platform - API Specification

## Base URL
```
Production: https://api.voiceagent.platform/v1
Staging: https://staging-api.voiceagent.platform/v1
```

## Authentication
All API requests require authentication using API keys or JWT tokens.

### API Key Authentication
```http
Authorization: Bearer YOUR_API_KEY
```

### JWT Authentication
```http
Authorization: Bearer YOUR_JWT_TOKEN
```

## Core API Endpoints

### 1. Authentication & Registration

#### Register Business
```http
POST /auth/register
Content-Type: application/json

{
  "business_name": "Acme Corp",
  "email": "admin@acme.com",
  "password": "secure_password",
  "industry": "retail",
  "phone": "+1234567890",
  "website": "https://acme.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "business_id": "bus_123456",
    "email_verification_required": true,
    "api_key": "ak_live_abcd1234..."
  }
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "expires_in": 3600,
    "business_id": "bus_123456"
  }
}
```

### 2. Business Management

#### Get Business Profile
```http
GET /business/profile
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "data": {
    "business_id": "bus_123456",
    "name": "Acme Corp",
    "industry": "retail",
    "phone": "+1234567890",
    "website": "https://acme.com",
    "created_at": "2024-01-15T10:30:00Z",
    "subscription": {
      "plan": "professional",
      "status": "active",
      "usage": {
        "calls_this_month": 245,
        "calls_limit": 1000
      }
    }
  }
}
```

#### Update Business Profile
```http
PUT /business/profile
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Acme Corporation",
  "phone": "+1234567891",
  "settings": {
    "timezone": "America/New_York",
    "business_hours": {
      "monday": {"start": "09:00", "end": "17:00"},
      "tuesday": {"start": "09:00", "end": "17:00"}
    }
  }
}
```

### 3. Plan Management

#### Get Available Plans
```http
GET /plans
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "plan_id": "starter",
      "name": "Starter",
      "price": 29,
      "currency": "USD",
      "billing_cycle": "monthly",
      "features": {
        "calls_per_month": 100,
        "voice_customization": false,
        "crm_integration": false,
        "analytics": "basic"
      }
    },
    {
      "plan_id": "professional",
      "name": "Professional",
      "price": 99,
      "currency": "USD",
      "billing_cycle": "monthly",
      "features": {
        "calls_per_month": 1000,
        "voice_customization": true,
        "crm_integration": true,
        "analytics": "advanced"
      }
    }
  ]
}
```

#### Subscribe to Plan
```http
POST /business/subscribe
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "plan_id": "professional",
  "payment_method": "card_1234567890"
}
```

### 4. AI Agent Management

#### Create AI Agent
```http
POST /agents
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "Customer Support Agent",
  "description": "Handles customer inquiries and support requests",
  "voice_settings": {
    "voice_id": "voice_sarah_professional",
    "speed": 1.0,
    "pitch": 0.0
  },
  "personality": {
    "tone": "friendly",
    "formality": "professional",
    "empathy_level": "high"
  },
  "capabilities": [
    "order_status",
    "product_information",
    "appointment_booking"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "agent_id": "agent_789012",
    "name": "Customer Support Agent",
    "status": "created",
    "training_required": true,
    "webhook_url": "https://api.voiceagent.platform/v1/voice/webhook/agent_789012"
  }
}
```

#### Get Agent Details
```http
GET /agents/{agent_id}
Authorization: Bearer YOUR_API_KEY
```

#### Update Agent Configuration
```http
PUT /agents/{agent_id}
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "voice_settings": {
    "voice_id": "voice_john_casual",
    "speed": 0.9
  },
  "personality": {
    "tone": "casual",
    "formality": "informal"
  }
}
```

### 5. Knowledge Management

#### Upload Business Data
```http
POST /knowledge/upload
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

file: business_data.csv
type: customer_records
description: Customer database with order history
```

**Response:**
```json
{
  "success": true,
  "data": {
    "upload_id": "upload_345678",
    "status": "processing",
    "file_name": "business_data.csv",
    "records_count": 15420,
    "estimated_processing_time": "5-10 minutes"
  }
}
```

#### Upload Voice Samples
```http
POST /knowledge/voice-samples
Authorization: Bearer YOUR_API_KEY
Content-Type: multipart/form-data

files: [sample1.wav, sample2.wav, sample3.wav]
type: customer_calls
description: Real customer service call recordings
```

#### Query Knowledge Base
```http
POST /knowledge/query
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "query": "What is the return policy for electronics?",
  "agent_id": "agent_789012",
  "context": {
    "customer_id": "cust_123",
    "product_category": "electronics"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "answer": "Our electronics return policy allows returns within 30 days of purchase with original receipt and packaging.",
    "confidence": 0.95,
    "sources": [
      {
        "document": "return_policy.pdf",
        "section": "Electronics Returns",
        "relevance": 0.98
      }
    ]
  }
}
```

### 6. Voice Integration

#### Voice Webhook Endpoint
```http
POST /voice/webhook/{agent_id}
Content-Type: application/json

{
  "call_id": "call_567890",
  "event": "call_started",
  "from": "+1234567890",
  "to": "+1987654321",
  "timestamp": "2024-01-15T14:30:00Z"
}
```

#### Test Call
```http
POST /voice/test-call
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "agent_id": "agent_789012",
  "phone_number": "+1234567890",
  "test_scenario": "customer_inquiry"
}
```

### 7. Analytics & Reporting

#### Get Call Analytics
```http
GET /analytics/calls?start_date=2024-01-01&end_date=2024-01-31&agent_id=agent_789012
Authorization: Bearer YOUR_API_KEY
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total_calls": 1247,
    "successful_calls": 1189,
    "average_duration": 180,
    "customer_satisfaction": 4.2,
    "top_intents": [
      {"intent": "order_status", "count": 456},
      {"intent": "product_info", "count": 234}
    ],
    "call_outcomes": {
      "resolved": 892,
      "transferred": 297,
      "abandoned": 58
    }
  }
}
```

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request parameters are invalid",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid or missing authentication
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `RATE_LIMITED`: Too many requests
- `INVALID_REQUEST`: Malformed request
- `INTERNAL_ERROR`: Server error

## Rate Limiting
- **Starter Plan**: 100 requests/minute
- **Professional Plan**: 500 requests/minute
- **Enterprise Plan**: 2000 requests/minute

Rate limit headers:
```
X-RateLimit-Limit: 500
X-RateLimit-Remaining: 487
X-RateLimit-Reset: 1642694400
```
