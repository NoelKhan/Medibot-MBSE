/**
 * Authentication API Service
 * ==========================
 * API wrapper for backend authentication endpoints
 * Integrates with UserAuthService for hybrid mode operation
 */

import { apiClient } from './ApiClient';
import { API_ENDPOINTS, FEATURE_FLAGS } from '../config/api.config';
import { PatientUser } from '../types/Booking';
import { createLogger } from './Logger';

const logger = createLogger('AuthApiService');

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: PatientUser;
}

export interface StaffLoginResponse {
  accessToken: string;
  refreshToken: string;
  staff: any; // StaffUser type
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber: string;
  dateOfBirth?: string;
}

export interface CreateGuestRequest {
  name: string;
  phoneNumber?: string;
}

export class AuthApiService {
  private static instance: AuthApiService;

  private constructor() {}

  public static getInstance(): AuthApiService {
    if (!AuthApiService.instance) {
      AuthApiService.instance = new AuthApiService();
    }
    return AuthApiService.instance;
  }

  /**
   * Register new patient user
   */
  public async register(data: RegisterRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.REGISTER,
        data
      );

      // Store tokens
      await apiClient.setAuthTokens(response.accessToken, response.refreshToken);

      if (FEATURE_FLAGS.LOG_API_CALLS) {
        logger.info('User registered successfully', { userId: response.user.id });
      }

      return response;
    } catch (error: any) {
      logger.error('Registration failed', error);
      throw new Error(error.message || 'Registration failed');
    }
  }

  /**
   * Login patient user
   */
  public async login(email: string, password: string): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.LOGIN,
        { email, password }
      );

      // Store tokens
      await apiClient.setAuthTokens(response.accessToken, response.refreshToken);

      if (FEATURE_FLAGS.LOG_API_CALLS) {
        logger.info('User logged in successfully', { userId: response.user.id });
      }

      return response;
    } catch (error: any) {
      logger.error('Login failed', error);
      throw new Error(error.message || 'Invalid email or password');
    }
  }

  /**
   * Login staff user
   */
  public async staffLogin(email: string, password: string): Promise<StaffLoginResponse> {
    try {
      const response = await apiClient.post<StaffLoginResponse>(
        API_ENDPOINTS.AUTH.STAFF_LOGIN,
        { email, password }
      );

      // Store tokens
      await apiClient.setAuthTokens(response.accessToken, response.refreshToken);

      if (FEATURE_FLAGS.LOG_API_CALLS) {
        logger.info('Staff logged in successfully', { staffId: response.staff.id });
      }

      return response;
    } catch (error: any) {
      logger.error('Staff login failed', error);
      throw new Error(error.message || 'Invalid staff credentials');
    }
  }

  /**
   * Create guest user
   */
  public async createGuest(data: CreateGuestRequest): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<LoginResponse>(
        API_ENDPOINTS.AUTH.GUEST,
        data
      );

      // Store tokens
      await apiClient.setAuthTokens(response.accessToken, response.refreshToken);

      if (FEATURE_FLAGS.LOG_API_CALLS) {
        logger.info('Guest user created successfully', { userId: response.user.id });
      }

      return response;
    } catch (error: any) {
      logger.error('Guest creation failed', error);
      throw new Error(error.message || 'Failed to create guest user');
    }
  }

  /**
   * Get current user from backend
   */
  public async getCurrentUser(): Promise<PatientUser> {
    try {
      const response = await apiClient.get<{ user: PatientUser }>(
        API_ENDPOINTS.AUTH.ME
      );

      return response.user;
    } catch (error: any) {
      logger.error('Get current user failed', error);
      throw new Error(error.message || 'Failed to get current user');
    }
  }

  /**
   * Logout - clear local tokens
   */
  public async logout(): Promise<void> {
    try {
      await apiClient.clearAuthData();
      
      if (FEATURE_FLAGS.LOG_API_CALLS) {
        logger.info('User logged out successfully');
      }
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   */
  public async isAuthenticated(): Promise<boolean> {
    const token = await apiClient.getAccessToken();
    return !!token;
  }
}

export const authApiService = AuthApiService.getInstance();
