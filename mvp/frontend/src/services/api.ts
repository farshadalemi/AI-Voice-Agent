import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-toastify';

// API base URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';
const DATA_INTEGRATION_API_URL = process.env.REACT_APP_DATA_INTEGRATION_API_URL || 'http://localhost:8001/api/v1';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: AxiosRequestConfig): any => {
    const token = localStorage.getItem('access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { access_token, refresh_token: newRefreshToken } = response.data;
          
          // Update stored tokens
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied. You do not have permission to perform this action.');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found.');
    } else if (error.response?.status === 429) {
      toast.error('Too many requests. Please slow down.');
    }

    return Promise.reject(error);
  }
);

// API response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

// Generic API methods
export const apiService = {
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<ApiResponse<T>>(url, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error?.message || 'API request failed');
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<ApiResponse<T>>(url, data, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error?.message || 'API request failed');
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.put<ApiResponse<T>>(url, data, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error?.message || 'API request failed');
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.delete<ApiResponse<T>>(url, config);
    if (response.data.success) {
      return response.data.data as T;
    }
    throw new Error(response.data.error?.message || 'API request failed');
  },

  // For endpoints that return data directly (like token endpoints)
  postDirect: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.post<T>(url, data, config);
    return response.data;
  },

  getDirect: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    const response = await api.get<T>(url, config);
    return response.data;
  },
};

export default api;
