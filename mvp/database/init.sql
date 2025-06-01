-- AI Voice Agent Platform MVP Database Schema
-- PostgreSQL 14+

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Businesses table
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    industry VARCHAR(100),
    phone VARCHAR(20),
    website VARCHAR(255),
    settings JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Plans table
CREATE TABLE plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    billing_cycle VARCHAR(20) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    plan_id VARCHAR(50) NOT NULL REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    stripe_subscription_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- API keys table
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(20) NOT NULL,
    name VARCHAR(100),
    permissions JSONB DEFAULT '[]',
    last_used_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Agents table
CREATE TABLE agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    voice_settings JSONB DEFAULT '{}',
    personality JSONB DEFAULT '{}',
    capabilities JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'created' CHECK (status IN ('created', 'training', 'ready', 'error')),
    webhook_url VARCHAR(500),
    phone_numbers JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Conversations table (simplified for MVP)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    call_id VARCHAR(255) UNIQUE NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'failed')),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    transcript JSONB DEFAULT '[]',
    summary TEXT,
    sentiment_score DECIMAL(3,2),
    customer_satisfaction INTEGER CHECK (customer_satisfaction BETWEEN 1 AND 5),
    outcome VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Usage tracking table
CREATE TABLE usage_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    metric_name VARCHAR(50) NOT NULL,
    metric_value INTEGER NOT NULL,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_businesses_email ON businesses(email);
CREATE INDEX idx_subscriptions_business_id ON subscriptions(business_id);
CREATE INDEX idx_usage_records_business_period ON usage_records(business_id, period_start, period_end);
CREATE INDEX idx_api_keys_business_id ON api_keys(business_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX idx_agents_business_id ON agents(business_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_call_id ON conversations(call_id);
CREATE INDEX idx_conversations_start_time ON conversations(start_time);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_businesses_updated_at BEFORE UPDATE ON businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for plans
INSERT INTO plans (id, name, description, price, features, limits) VALUES
('starter', 'Starter', 'Perfect for small businesses getting started with AI voice agents', 29.00, 
 '{"voice_customization": false, "crm_integration": false, "analytics": "basic", "support": "email"}',
 '{"calls_per_month": 100, "agents": 1, "knowledge_base_size_mb": 50}'),
('professional', 'Professional', 'Advanced features for growing businesses', 99.00,
 '{"voice_customization": true, "crm_integration": true, "analytics": "advanced", "support": "priority"}',
 '{"calls_per_month": 1000, "agents": 3, "knowledge_base_size_mb": 500}'),
('enterprise', 'Enterprise', 'Full-featured solution for large organizations', 499.00,
 '{"voice_customization": true, "crm_integration": true, "analytics": "enterprise", "support": "dedicated"}',
 '{"calls_per_month": -1, "agents": -1, "knowledge_base_size_mb": -1}');

-- Sample demo business (for testing)
INSERT INTO businesses (id, name, email, password_hash, industry, phone, website, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Business', 'demo@voiceagent.platform', 
 '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/VJWZmc2dW', -- password: demo123
 'technology', '+1234567890', 'https://demo.voiceagent.platform', true);

-- Sample subscription for demo business
INSERT INTO subscriptions (business_id, plan_id, current_period_start, current_period_end) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'professional', NOW(), NOW() + INTERVAL '1 month');

-- Sample agent for demo business
INSERT INTO agents (business_id, name, description, voice_settings, personality, capabilities, status) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Customer Support Agent', 
 'Handles customer inquiries and support requests',
 '{"voice_id": "voice_sarah_professional", "speed": 1.0, "pitch": 0.0}',
 '{"tone": "friendly", "formality": "professional", "empathy_level": "high"}',
 '["order_status", "product_information", "appointment_booking"]',
 'ready');
