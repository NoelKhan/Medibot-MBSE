/**
 * Authentication API
 * ==================
 * Pure HTTP API calls for authentication endpoints
 * 
 * Responsibilities:
 * - HTTP calls to /api/auth/* endpoints
 * - Request/response type definitions
 * - No business logic
 * - No state management
 * - No token storage (handled by HttpClient)
 */

import httpClient from './client';
import { API_ENDPOINTS } from '../config/api.config';
import type { PatientUser } from '../types/Booking';

// ============================================================================
// Type Definitions
// ============================================================================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: PatientUser;
}

export interface StaffLoginRequest {
  email: string;
  password: string;
}

export interface StaffLoginResponse {
  accessToken: string;
  refreshToken: string;
  staff: any; // StaffUser type from backend
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  dateOfBirth?: string;
}

export interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: PatientUser;
}

export interface GuestRequest {
  name: string;
  phoneNumber?: string;
}

export interface GuestResponse {
  accessToken: string;
  refreshToken: string;
  user: PatientUser;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfileResponse {
  user: PatientUser;
}

// ============================================================================
// Authentication API Functions
// ============================================================================

/**
 * Register a new patient user
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  return httpClient.post<RegisterResponse>(API_ENDPOINTS.AUTH.REGISTER, data);
}

/**
 * Login patient user
 */
export async function login(data: LoginRequest): Promise<LoginResponse> {
  return httpClient.post<LoginResponse>(API_ENDPOINTS.AUTH.LOGIN, data);
}

/**
 * Login staff user
 */
export async function staffLogin(data: StaffLoginRequest): Promise<StaffLoginResponse> {
  return httpClient.post<StaffLoginResponse>(API_ENDPOINTS.AUTH.STAFF_LOGIN, data);
}

/**
 * Create guest user
 */
export async function createGuest(data: GuestRequest): Promise<GuestResponse> {
  return httpClient.post<GuestResponse>(API_ENDPOINTS.AUTH.GUEST, data);
}

/**
 * Refresh access token
 */
export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return httpClient.post<RefreshTokenResponse>(API_ENDPOINTS.AUTH.REFRESH, data);
}

/**
 * Get current user profile
 */
export async function getCurrentUser(): Promise<UserProfileResponse> {
  return httpClient.get<UserProfileResponse>(API_ENDPOINTS.AUTH.ME);
}

/**
 * Logout (invalidate tokens on server)
 */
export async function logout(): Promise<void> {
  return httpClient.post<void>('/auth/logout');
}

/**
 * Verify email with token
 */
export async function verifyEmail(token: string): Promise<void> {
  return httpClient.post<void>('/auth/verify-email', { token });
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<void> {
  return httpClient.post<void>('/auth/forgot-password', { email });
}

/**
 * Reset password with token
 */
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  return httpClient.post<void>('/auth/reset-password', {
    token,
    newPassword,
  });
}

/**
 * Change password (authenticated user)
 */
export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  return httpClient.post<void>('/auth/change-password', {
    oldPassword,
    newPassword,
  });
}

// ============================================================================
// Export as named object for backwards compatibility
// ============================================================================

export const authApi = {
  register,
  login,
  staffLogin,
  createGuest,
  refreshToken,
  getCurrentUser,
  logout,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  changePassword,
};

export default authApi;
