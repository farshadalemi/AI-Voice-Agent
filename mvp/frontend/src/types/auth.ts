// Authentication related types

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  businessName: string;
  email: string;
  password: string;
  industry?: string;
  phone?: string;
  website?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  business_id: string;
}

export interface Business {
  id: string;
  name: string;
  email: string;
  industry?: string;
  phone?: string;
  website?: string;
  settings: Record<string, any>;
  status: string;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BusinessUpdate {
  name?: string;
  industry?: string;
  phone?: string;
  website?: string;
  settings?: Record<string, any>;
}
