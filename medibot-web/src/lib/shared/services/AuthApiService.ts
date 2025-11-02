/**
 * Auth API Service
 * =================
 * Platform-agnostic authentication service
 */

import type { HttpClient } from '../utils/httpClient';
import type {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../types';

export class AuthApiService {
  private httpClient: HttpClient;
  private baseEndpoint = '/auth';

  constructor(httpClient: HttpClient) {
    this.httpClient = httpClient;
  }

  /**
   * Login user
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.httpClient.post<AuthResponse>(
      `${this.baseEndpoint}/login`,
      credentials
    );
    return this.deserializeAuthResponse(response.data);
  }

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.httpClient.post<AuthResponse>(
      `${this.baseEndpoint}/register`,
      data
    );
    return this.deserializeAuthResponse(response.data);
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    const response = await this.httpClient.post<AuthResponse>(
      `${this.baseEndpoint}/refresh`,
      { refreshToken }
    );
    return this.deserializeAuthResponse(response.data);
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    await this.httpClient.post(`${this.baseEndpoint}/logout`);
  }

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await this.httpClient.get<User>(
      `${this.baseEndpoint}/profile`
    );
    return this.deserializeUser(response.data);
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await this.httpClient.patch<User>(
      `${this.baseEndpoint}/profile`,
      data
    );
    return this.deserializeUser(response.data);
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    await this.httpClient.post(`${this.baseEndpoint}/forgot-password`, { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.httpClient.post(`${this.baseEndpoint}/reset-password`, {
      token,
      newPassword,
    });
  }

  // Helper methods to deserialize dates from JSON strings
  private deserializeAuthResponse(response: any): AuthResponse {
    return {
      ...response,
      user: this.deserializeUser(response.user),
    };
  }

  private deserializeUser(user: any): User {
    return {
      ...user,
      dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }
}
