import { apiService } from './api';
import { 
  LoginCredentials, 
  RegisterData, 
  TokenResponse, 
  Business 
} from '../types/auth';

export const authService = {
  // Login
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    return apiService.postDirect<TokenResponse>('/auth/login', credentials);
  },

  // Register
  register: async (data: RegisterData): Promise<{ message: string }> => {
    return apiService.post<{ message: string }>('/auth/register', {
      business_name: data.businessName,
      email: data.email,
      password: data.password,
      industry: data.industry,
      phone: data.phone,
      website: data.website,
    });
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<TokenResponse> => {
    return apiService.postDirect<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  // Get current business
  getCurrentBusiness: async (): Promise<Business> => {
    return apiService.getDirect<Business>('/auth/me');
  },

  // Logout
  logout: async (): Promise<void> => {
    return apiService.post<void>('/auth/logout');
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return apiService.post<{ message: string }>('/auth/verify-email', {
      verification_token: token,
    });
  },

  // Forgot password
  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiService.post<{ message: string }>('/auth/forgot-password', {
      email,
    });
  },

  // Reset password
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return apiService.post<{ message: string }>('/auth/reset-password', {
      reset_token: token,
      new_password: newPassword,
    });
  },
};
