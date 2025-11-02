/**
 * Consolidated Authentication Service
 * ====================================
 * 
 * This service consolidates AuthService, UserAuthService, and AuthPersistenceService
 * into a single, well-organized authentication service.
 * 
 * Responsibilities:
 * - User authentication (login, register, logout)
 * - Guest user management
 * - Session persistence and token management
 * - Current user state management
 * 
 * Uses:
 * - auth.api.ts for all HTTP calls
 * - AsyncStorage/SecureStore for persistence
 * - Logger for debugging
 * 
 * Architecture:
 * - Business logic lives here
 * - HTTP calls delegated to API layer
 * - No direct axios usage
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { User, UserRole, AuthStatus } from '../../types/User';
import { PatientUser } from '../../types/Booking';
import * as authApi from '../../api/auth.api';
import { createLogger } from '../core/Logger';

const logger = createLogger('AuthService');

// Storage keys
const STORAGE_KEYS = {
  USER: '@medibot_user',
  GUEST_USER: '@medibot_guest_user',
  EMAIL_USERS: '@medibot_email_users',
  AUTH_TOKEN: 'medibot_auth_token',
  REFRESH_TOKEN: 'medibot_refresh_token',
  USER_DATA: 'medibot_user_data',
  AUTH_TIMESTAMP: 'medibot_auth_timestamp',
} as const;

// Session expiry: 30 days
const SESSION_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Create a complete PatientUser object with all required fields
 */
function createMockPatientUser(overrides: Partial<PatientUser> & { id: string; name: string }): PatientUser {
  return {
    userType: 'registered' as const,
    emergencyContacts: [],
    medicalHistory: [],
    currentMedications: [],
    allergies: [],
    activeCases: [],
    caseHistory: [],
    totalCases: 0,
    createdAt: new Date(),
    lastActivity: new Date(),
    accountStatus: 'active' as const,
    preferences: {
      language: 'en',
      notifications: {
        email: true,
        sms: true,
        push: true,
      },
      privacySettings: {
        shareWithStaff: true,
        shareWithDoctors: true,
        dataRetention: '5-years' as const,
      },
    },
    verification: {
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
    },
    ...overrides,
  };
}

// Mock/Offline accounts for development and offline use
const MOCK_ACCOUNTS = {
  patient: {
    email: 'patient@demo.com',
    password: 'demo123',
    user: createMockPatientUser({
      id: 'demo-patient-001',
      email: 'patient@demo.com',
      phone: '+1234567890',
      name: 'Demo Patient',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'prefer-not-to-say' as const,
    }),
  },
  doctor: {
    email: 'doctor@demo.com',
    password: 'demo123',
    user: createMockPatientUser({
      id: 'demo-doctor-001',
      email: 'doctor@demo.com',
      phone: '+1234567891',
      name: 'Dr. Demo',
      dateOfBirth: new Date('1985-01-01'),
      gender: 'prefer-not-to-say' as const,
    }),
  },
  staff: {
    email: 'staff@demo.com',
    password: 'demo123',
    user: createMockPatientUser({
      id: 'demo-staff-001',
      email: 'staff@demo.com',
      phone: '+1234567892',
      name: 'Demo Staff',
      dateOfBirth: new Date('1988-01-01'),
      gender: 'prefer-not-to-say' as const,
    }),
  },
  guest: {
    email: '', // No email for guest
    password: '', // No password for guest
    user: createMockPatientUser({
      id: 'demo-guest-001',
      userType: 'guest' as const,
      name: 'Guest User',
      accountStatus: 'guest' as const,
      preferences: {
        language: 'en',
        notifications: {
          email: false,
          sms: false,
          push: false,
        },
        privacySettings: {
          shareWithStaff: false,
          shareWithDoctors: false,
          dataRetention: '1-year' as const,
        },
      },
    }),
  },
};

export interface AuthState {
  user: User | PatientUser;
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface GuestData {
  name: string;
  phone?: string;
}

/**
 * Consolidated Authentication Service
 * Singleton pattern for consistent state across app
 */
export class AuthService {
  private static instance: AuthService;
  private currentUser: User | PatientUser | null = null;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // =========================================================================
  // AUTHENTICATION METHODS
  // =========================================================================

  /**
   * Authenticate medical staff user (manual login)
   * Used when staff credentials are verified externally (e.g., MedicalStaffLogin)
   */
  public async authenticateStaff(user: User): Promise<User> {
    try {
      logger.info('Authenticating medical staff user', { userId: user.id, name: user.name });
      
      // Create mock token for medical staff (offline mode)
      const mockToken = `staff_token_${Date.now()}`;
      
      // Save authentication state
      await this.saveAuthState(user, mockToken, mockToken);
      
      this.currentUser = user;
      logger.info('Medical staff authenticated successfully', { userId: user.id });
      
      return user;
    } catch (error) {
      logger.error('Medical staff authentication failed', error);
      throw error;
    }
  }

  /**
   * Register new user account
   * Falls back to offline mode if backend is unavailable
   */
  public async register(data: RegisterData): Promise<PatientUser> {
    try {
      logger.info('Registering new user', { email: data.email });

      // Try API registration first
      try {
        const response = await authApi.register({
          fullName: data.name,
          email: data.email,
          password: data.password,
          phoneNumber: data.phone,
        });

        // Save authentication state
        await this.saveAuthState(response.user, response.accessToken, response.refreshToken);
        
        this.currentUser = response.user;
        logger.info('User registered successfully via API', { userId: response.user.id });
        
        return response.user;
      } catch (apiError: any) {
        // Check if it's a network error (backend unavailable)
        const isNetworkError = apiError.statusCode === 0 || 
                              apiError.message?.includes('Network') ||
                              apiError.message?.includes('ECONNREFUSED');
        
        if (isNetworkError) {
          logger.warn('Backend unavailable, creating offline user account');
          
          // Create offline user account using helper function
          const offlineUser = createMockPatientUser({
            id: `offline-${Date.now()}`,
            userType: 'registered' as const,
            email: data.email,
            phone: data.phone,
            name: data.name,
            dateOfBirth: data.dateOfBirth,
            gender: data.gender,
            accountStatus: 'active' as const,
          });

          // Create mock token for offline mode
          const mockToken = `offline_token_${Date.now()}`;
          
          // Save authentication state
          await this.saveAuthState(offlineUser, mockToken, mockToken);
          
          this.currentUser = offlineUser;
          logger.info('User registered successfully (OFFLINE MODE)', { 
            userId: offlineUser.id,
            email: data.email 
          });
          
          return offlineUser;
        }
        
        // If not a network error, re-throw (e.g., validation error, email exists)
        throw apiError;
      }
    } catch (error) {
      logger.error('Registration failed', error);
      throw error;
    }
  }

  /**
   * Login with email and password
   * Falls back to mock accounts if backend is unavailable
   */
  public async login(data: LoginData): Promise<PatientUser> {
    try {
      logger.info('Logging in user', { email: data.email });

      // Try API login first
      try {
        const response = await authApi.login({
          email: data.email,
          password: data.password,
        });

        // Save authentication state
        await this.saveAuthState(response.user, response.accessToken, response.refreshToken);
        
        this.currentUser = response.user;
        logger.info('User logged in successfully via API', { userId: response.user.id });
        
        return response.user;
      } catch (apiError: any) {
        // Check if it's a network error (backend unavailable)
        const isNetworkError = apiError.statusCode === 0 || 
                              apiError.message?.includes('Network') ||
                              apiError.message?.includes('ECONNREFUSED');
        
        if (isNetworkError) {
          logger.warn('Backend unavailable, trying offline login', { email: data.email });
          
          // Try offline/mock login
          const mockAccount = Object.values(MOCK_ACCOUNTS).find(
            account => account.email === data.email && account.password === data.password
          );

          if (mockAccount) {
            // Create mock tokens for offline mode
            const mockToken = `offline_token_${Date.now()}`;
            
            // Save authentication state with mock tokens
            await this.saveAuthState(mockAccount.user, mockToken, mockToken);
            
            this.currentUser = mockAccount.user;
            logger.info('User logged in successfully (OFFLINE MODE)', { 
              userId: mockAccount.user.id,
              email: data.email 
            });
            
            return mockAccount.user;
          } else {
            logger.warn('No matching offline account found', { email: data.email });
            throw new Error('Invalid credentials. Available offline accounts: patient@demo.com, doctor@demo.com, staff@demo.com (password: demo123)');
          }
        }
        
        // If not a network error, re-throw (e.g., invalid credentials)
        throw apiError;
      }
    } catch (error) {
      logger.error('Login failed', error);
      throw error;
    }
  }

  /**
   * Login as guest user
   * Maintains persistent guest session across app restarts
   * Works offline with local guest account
   */
  public async loginAsGuest(data: GuestData): Promise<PatientUser> {
    try {
      logger.info('Creating guest session', { name: data.name });

      // Check for existing persistent guest user
      const existingGuest = await this.loadGuestFromStorage();
      if (existingGuest) {
        // Update name if provided
        existingGuest.name = data.name || existingGuest.name;
        
        this.currentUser = existingGuest;
        await this.saveGuestToStorage(existingGuest);
        
        logger.info('Loaded existing guest user', { userId: existingGuest.id });
        return existingGuest;
      }

      // Try to create new guest user via API
      try {
        const response = await authApi.createGuest({
          name: data.name,
          phoneNumber: data.phone,
        });

        // Save guest user for persistence
        await this.saveGuestToStorage(response.user);
        await this.saveUserToStorage(response.user);
        
        this.currentUser = response.user;
        logger.info('Created new guest user via API', { userId: response.user.id });
        
        return response.user;
      } catch (apiError: any) {
        // If backend unavailable, use offline guest account
        const isNetworkError = apiError.statusCode === 0 || 
                              apiError.message?.includes('Network') ||
                              apiError.message?.includes('ECONNREFUSED') ||
                              apiError.statusCode === 400; // Backend validation error
        
        if (isNetworkError) {
          logger.warn('Backend unavailable, using offline guest account');
          
          // Create offline guest user with provided name
          const offlineGuest: PatientUser = {
            ...MOCK_ACCOUNTS.guest.user,
            id: `guest-${Date.now()}`,
            name: data.name || 'Guest User',
            phone: data.phone,
            createdAt: new Date(),
            lastActivity: new Date(),
          };

          // Save guest user for persistence
          await this.saveGuestToStorage(offlineGuest);
          await this.saveUserToStorage(offlineGuest);
          
          this.currentUser = offlineGuest;
          logger.info('Created offline guest user', { 
            userId: offlineGuest.id,
            name: offlineGuest.name 
          });
          
          return offlineGuest;
        }
        
        // If not a network error, re-throw
        throw apiError;
      }
    } catch (error) {
      logger.error('Guest login failed', error);
      throw error;
    }
  }

  /**
   * Logout current user
   * Clears all authentication state
   */
  public async logout(): Promise<void> {
    try {
      logger.info('Logging out user', { userId: this.currentUser?.id });

      // Call logout API endpoint
      try {
        await authApi.logout();
      } catch (apiError) {
        // Log but don't fail on API error
        logger.warn('Logout API call failed, continuing with local logout', apiError);
      }

      // Clear all authentication state
      await this.clearAuthState();
      
      this.currentUser = null;
      logger.info('User logged out successfully');
    } catch (error) {
      logger.error('Logout failed', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  public getCurrentUser(): User | PatientUser | null {
    return this.currentUser;
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  /**
   * Check if current user is guest
   */
  public isGuest(): boolean {
    if (!this.currentUser) return false;
    
    // Check User type
    if ('role' in this.currentUser) {
      return this.currentUser.role === UserRole.GUEST;
    }
    
    // Check PatientUser type
    if ('userType' in this.currentUser) {
      return this.currentUser.userType === 'guest';
    }
    
    return false;
  }

  // =========================================================================
  // SESSION MANAGEMENT
  // =========================================================================

  /**
   * Refresh access token using refresh token
   */
  public async refreshAccessToken(): Promise<void> {
    try {
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      logger.info('Refreshing access token');
      
      const response = await authApi.refreshToken({ refreshToken });
      
      // Update stored tokens
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, response.accessToken);
      if (response.refreshToken) {
        await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, response.refreshToken);
      }
      
      logger.info('Access token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', error);
      // Clear auth state on refresh failure
      await this.clearAuthState();
      throw error;
    }
  }

  /**
   * Load authentication state from storage
   * Called on app startup to restore session
   */
  public async loadAuthState(): Promise<AuthState | null> {
    try {
      const userDataStr = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
      const accessToken = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      const timestampStr = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TIMESTAMP);

      if (!userDataStr) {
        logger.info('No saved auth state found');
        return null;
      }

      const user = JSON.parse(userDataStr);
      const timestamp = timestampStr ? parseInt(timestampStr, 10) : Date.now();

      // Check session expiry
      if (Date.now() - timestamp > SESSION_EXPIRY_MS) {
        logger.warn('Auth session expired, clearing state', { timestamp });
        await this.clearAuthState();
        return null;
      }

      this.currentUser = user;
      logger.info('Auth state loaded successfully', { userId: user.id });
      
      return {
        user,
        accessToken: accessToken || '',
        refreshToken: refreshToken || '',
        timestamp,
      };
    } catch (error) {
      logger.error('Failed to load auth state', error);
      return null;
    }
  }

  /**
   * Update current user data
   * Used after profile updates
   */
  public async updateUserData(user: User | PatientUser): Promise<void> {
    try {
      this.currentUser = user;
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      logger.info('User data updated', { userId: user.id });
    } catch (error) {
      logger.error('Failed to update user data', error);
      throw error;
    }
  }

  // =========================================================================
  // PASSWORD MANAGEMENT
  // =========================================================================

  /**
   * Request password reset email
   */
  public async requestPasswordReset(email: string): Promise<void> {
    try {
      logger.info('Requesting password reset', { email });
      await authApi.requestPasswordReset(email);
      logger.info('Password reset email sent');
    } catch (error) {
      logger.error('Password reset request failed', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   */
  public async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      logger.info('Resetting password with token');
      await authApi.resetPassword(token, newPassword);
      logger.info('Password reset successful');
    } catch (error) {
      logger.error('Password reset failed', error);
      throw error;
    }
  }

  /**
   * Change password for authenticated user
   */
  public async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated to change password');
      }

      logger.info('Changing password');
      await authApi.changePassword(oldPassword, newPassword);
      logger.info('Password changed successfully');
    } catch (error) {
      logger.error('Password change failed', error);
      throw error;
    }
  }

  // =========================================================================
  // EMAIL VERIFICATION
  // =========================================================================

  /**
   * Verify email with token
   */
  public async verifyEmail(token: string): Promise<void> {
    try {
      logger.info('Verifying email');
      await authApi.verifyEmail(token);
      logger.info('Email verified successfully');
      
      // Refresh user data
      if (this.isAuthenticated()) {
        await this.refreshUserData();
      }
    } catch (error) {
      logger.error('Email verification failed', error);
      throw error;
    }
  }

  /**
   * Refresh current user data from server
   */
  public async refreshUserData(): Promise<void> {
    try {
      if (!this.isAuthenticated()) {
        throw new Error('User must be authenticated');
      }

      logger.info('Refreshing user data');
      const response = await authApi.getCurrentUser();
      await this.updateUserData(response.user);
      logger.info('User data refreshed');
    } catch (error) {
      logger.error('Failed to refresh user data', error);
      throw error;
    }
  }

  // =========================================================================
  // PRIVATE HELPER METHODS
  // =========================================================================

  /**
   * Save authentication state to secure storage
   */
  private async saveAuthState(
    user: User | PatientUser,
    accessToken: string,
    refreshToken: string
  ): Promise<void> {
    try {
      const timestamp = Date.now();
      
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, accessToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TIMESTAMP, timestamp.toString());
      
      // Also save to regular storage for backward compatibility
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      
      logger.info('Auth state saved successfully', { userId: user.id });
    } catch (error) {
      logger.error('Failed to save auth state', error);
      throw error;
    }
  }

  /**
   * Clear all authentication state
   */
  private async clearAuthState(): Promise<void> {
    try {
      // Clear secure storage
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TIMESTAMP);
      
      // Clear regular storage
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      await AsyncStorage.removeItem(STORAGE_KEYS.GUEST_USER);
      
      logger.info('Auth state cleared successfully');
    } catch (error) {
      logger.error('Failed to clear auth state', error);
      throw error;
    }
  }

  /**
   * Save user to regular storage
   */
  private async saveUserToStorage(user: User | PatientUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save user to storage', error);
    }
  }

  /**
   * Save guest user to persistent storage
   */
  private async saveGuestToStorage(user: User | PatientUser): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.GUEST_USER, JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save guest user', error);
    }
  }

  /**
   * Load guest user from storage
   */
  private async loadGuestFromStorage(): Promise<PatientUser | null> {
    try {
      const guestData = await AsyncStorage.getItem(STORAGE_KEYS.GUEST_USER);
      if (guestData) {
        return JSON.parse(guestData);
      }
    } catch (error) {
      logger.info('No existing guest user found');
    }
    return null;
  }

  /**
   * Clear guest user data
   */
  public async clearGuestData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.GUEST_USER);
      logger.info('Guest data cleared');
    } catch (error) {
      logger.error('Failed to clear guest data', error);
    }
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export default authService;
