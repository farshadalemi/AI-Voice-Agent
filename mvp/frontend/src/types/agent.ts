// Agent related types

export interface VoiceSettings {
  voice_id: string;
  speed: number;
  pitch: number;
  volume: number;
}

export interface PersonalitySettings {
  tone: 'friendly' | 'professional' | 'casual' | 'formal';
  formality: 'informal' | 'professional' | 'formal';
  empathy_level: 'low' | 'medium' | 'high';
  response_style: 'concise' | 'detailed' | 'conversational';
}

export interface Agent {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  voice_settings: VoiceSettings;
  personality: PersonalitySettings;
  capabilities: string[];
  status: 'created' | 'training' | 'ready' | 'error';
  webhook_url?: string;
  phone_numbers: string[];
  created_at: string;
  updated_at: string;
}

export interface AgentCreate {
  name: string;
  description?: string;
  voice_settings?: VoiceSettings;
  personality?: PersonalitySettings;
  capabilities?: string[];
  phone_numbers?: string[];
}

export interface AgentUpdate {
  name?: string;
  description?: string;
  voice_settings?: VoiceSettings;
  personality?: PersonalitySettings;
  capabilities?: string[];
  phone_numbers?: string[];
  status?: 'created' | 'training' | 'ready' | 'error';
}

export interface ConversationMessage {
  speaker: 'customer' | 'agent';
  message: string;
  timestamp: string;
  intent?: string;
  confidence?: number;
}

export interface Conversation {
  id: string;
  agent_id: string;
  business_id: string;
  call_id: string;
  customer_phone: string;
  direction: 'inbound' | 'outbound';
  status: 'active' | 'completed' | 'transferred' | 'failed';
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  duration_minutes?: number;
  transcript: ConversationMessage[];
  summary?: string;
  sentiment_score?: number;
  customer_satisfaction?: number;
  outcome?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface SimulateCallRequest {
  agent_id: string;
  customer_phone: string;
  scenario?: string;
  duration_seconds?: number;
  customer_message?: string;
}

export interface SimulateCallResponse {
  conversation_id: string;
  call_id: string;
  status: string;
  simulated_transcript: ConversationMessage[];
  summary: string;
  duration_seconds: number;
  sentiment_score: number;
  customer_satisfaction: number;
}

export interface AgentAnalytics {
  agent_id: string;
  total_conversations: number;
  successful_conversations: number;
  average_duration_seconds: number;
  average_sentiment_score: number;
  average_customer_satisfaction: number;
  top_intents: Array<{
    intent: string;
    count: number;
  }>;
  conversation_outcomes: Record<string, number>;
  daily_stats: Array<{
    date: string;
    conversations: number;
    average_duration: number;
  }>;
}

export interface VoiceAnalytics {
  total_calls: number;
  successful_calls: number;
  failed_calls: number;
  average_duration: number;
  total_duration_minutes: number;
  customer_satisfaction_avg: number;
  sentiment_distribution: Record<string, number>;
  call_outcomes: Record<string, number>;
  hourly_distribution: Array<{
    hour: number;
    calls: number;
  }>;
  daily_distribution: Array<{
    date: string;
    calls: number;
    successful: number;
    failed: number;
  }>;
}
