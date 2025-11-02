/**
 * API Client
 * ==========
 * Pure HTTP client for backend API communication
 * 
 * Responsibilities:
 * - HTTP request configuration
 * - Request/response interceptors
 * - Token management
 * - Error handling
 * - Retry logic
 * 
 * Does NOT contain:
 * - Business logic
 * - State management
 * - UI logic
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';
import { API_CONFIG } from '../config/api.config';

// Web storage adapter (replaces AsyncStorage)
const WebStorage = {
  getItem: async (key: string): Promise<string | null> => {
    return localStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    localStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    localStorage.removeItem(key);
  }
};

// Simple logger for web
const logger = {
  info: (...args: any[]) => console.log('[ApiClient]', ...args),
  error: (...args: any[]) => console.error('[ApiClient]', ...args),
  warn: (...args: any[]) => console.warn('[ApiClient]', ...args),
  debug: (...args: any[]) => console.debug('[ApiClient]', ...args),
};

// Storage keys for tokens
const TOKEN_KEY = '@medibot:accessToken';
const REFRESH_TOKEN_KEY = '@medibot:refreshToken';

// Feature flags for web
const FEATURE_FLAGS = {
  USE_API: true,
  ENABLE_MOCK_FALLBACK: true,
  LOG_API_CALLS: true, // Enable API logging
};

export interface ApiError {
  message: string;
  statusCode?: number;
  error?: string;
  details?: any;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * HTTP Client for API communication
 * Singleton pattern to ensure single axios instance
 */
export class HttpClient {
  private static instance: HttpClient;
  private axiosInstance: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  private constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_CONFIG.baseURL,
      timeout: API_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): HttpClient {
    if (!HttpClient.instance) {
      HttpClient.instance = new HttpClient();
    }
    return HttpClient.instance;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = await this.getAccessToken();
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (FEATURE_FLAGS.LOG_API_CALLS) {
          logger.debug('HTTP Request', {
            method: config.method?.toUpperCase(),
            url: config.url,
          });
        }

        return config;
      },
      (error) => {
        logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors and token refresh
    this.axiosInstance.interceptors.response.use(
      (response) => {
        if (FEATURE_FLAGS.LOG_API_CALLS) {
          logger.debug('HTTP Response', {
            status: response.status,
            url: response.config.url,
          });
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Handle 401 Unauthorized - try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // Queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then((token) => {
                if (originalRequest.headers) {
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                return this.axiosInstance(originalRequest);
              })
              .catch((err) => Promise.reject(err));
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = await this.getRefreshToken();
            if (refreshToken) {
              const response = await this.axiosInstance.post('/auth/refresh', {
                refreshToken,
              });

              const { accessToken } = response.data;
              await this.setAccessToken(accessToken);

              // Retry all queued requests
              this.failedQueue.forEach((promise) => promise.resolve(accessToken));
              this.failedQueue = [];

              // Retry original request
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              }
              return this.axiosInstance(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed - clear tokens and redirect to login
            this.failedQueue.forEach((promise) => promise.reject(refreshError));
            this.failedQueue = [];
            await this.clearTokens();
            logger.error('Token refresh failed', refreshError);
            throw refreshError;
          } finally {
            this.isRefreshing = false;
          }
        }

        // Handle network errors
        if (!error.response) {
          logger.error('Network error', error.message);
          const apiError: ApiError = {
            message: 'Network error. Please check your connection.',
            statusCode: 0,
          };
          throw apiError;
        }

        // Handle other errors
        const responseData = error.response.data as any;
        const apiError: ApiError = {
          message: responseData?.message || error.message,
          statusCode: error.response.status,
          error: responseData?.error,
          details: responseData,
        };

        logger.error('API Error', apiError);
        throw apiError;
      }
    );
  }

  /**
   * HTTP GET request
   */
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.get<ApiResponse<T>>(url, config);
    // Handle both wrapped and unwrapped responses
    return response.data.data !== undefined ? response.data.data : response.data as any;
  }

  /**
   * HTTP POST request
   */
  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.post<ApiResponse<T>>(url, data, config);
    // Handle both wrapped and unwrapped responses
    return response.data.data !== undefined ? response.data.data : response.data as any;
  }

  /**
   * HTTP PUT request
   */
  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.put<ApiResponse<T>>(url, data, config);
    // Handle both wrapped and unwrapped responses
    return response.data.data !== undefined ? response.data.data : response.data as any;
  }

  /**
   * HTTP PATCH request
   */
  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.patch<ApiResponse<T>>(url, data, config);
    // Handle both wrapped and unwrapped responses
    return response.data.data !== undefined ? response.data.data : response.data as any;
  }

  /**
   * HTTP DELETE request
   */
  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.axiosInstance.delete<ApiResponse<T>>(url, config);
    // Handle both wrapped and unwrapped responses
    return response.data.data !== undefined ? response.data.data : response.data as any;
  }

  /**
   * Get access token from storage
   */
  private async getAccessToken(): Promise<string | null> {
    try {
      return await WebStorage.getItem(TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting access token', error);
      return null;
    }
  }

  /**
   * Get refresh token from storage
   */
  private async getRefreshToken(): Promise<string | null> {
    try {
      return await WebStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error getting refresh token', error);
      return null;
    }
  }

  /**
   * Set access token in storage
   */
  public async setAccessToken(token: string): Promise<void> {
    try {
      await WebStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error setting access token', error);
    }
  }

  /**
   * Set refresh token in storage
   */
  public async setRefreshToken(token: string): Promise<void> {
    try {
      await WebStorage.setItem(REFRESH_TOKEN_KEY, token);
    } catch (error) {
      logger.error('Error setting refresh token', error);
    }
  }

  /**
   * Clear all tokens from storage
   */
  public async clearTokens(): Promise<void> {
    try {
      await WebStorage.removeItem(TOKEN_KEY);
      await WebStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      logger.error('Error clearing tokens', error);
    }
  }

  /**
   * Get the raw axios instance (for advanced usage)
   */
  public getRawInstance(): AxiosInstance {
    return this.axiosInstance;
  }
}

// Export singleton instance
export const httpClient = HttpClient.getInstance();

// Export default for convenience
export default httpClient;
