import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole, AuthStatus } from '../types/User';
import { apiClient } from './ApiClient';
import { createLogger } from './Logger';

const logger = createLogger('AuthService');

export class AuthService {
  private static instance: AuthService;
  private currentUser: User | null = null;

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loginAsGuest(name: string = 'Guest User'): Promise<User> {
    try {
      // Check if there's already a persistent guest user
      const existingGuestData = await AsyncStorage.getItem('@medibot_guest_user');
      if (existingGuestData) {
        const existingGuest = JSON.parse(existingGuestData);
        // Update the name if provided, but keep the same ID for persistence
        existingGuest.name = name;
        existingGuest.updatedAt = new Date();
        this.currentUser = existingGuest;
        await this.saveGuestUserToStorage(existingGuest);
        logger.info('Loaded existing guest user', { userId: existingGuest.id });
        return existingGuest;
      }
    } catch (error) {
      logger.info('No existing guest user found, creating new one');
    }

    // Create new persistent guest user
    const guestUser: User = {
      id: `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      role: UserRole.GUEST,
      authStatus: AuthStatus.GUEST,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.currentUser = guestUser;
    await this.saveUserToStorage(guestUser);
    await this.saveGuestUserToStorage(guestUser);
    logger.info('Created new persistent guest user', { userId: guestUser.id });
    return guestUser;
  }

  async loginWithEmail(email: string): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getUserByEmail(email);
    if (existingUser) {
      this.currentUser = existingUser;
      await this.saveUserToStorage(existingUser);
      return existingUser;
    }

    // Create new user with email
    const newUser: User = {
      id: `email_${Date.now()}`,
      email,
      name: email.split('@')[0], // Use email prefix as default name
      role: UserRole.PATIENT,
      authStatus: AuthStatus.AUTHENTICATED,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.currentUser = newUser;
    await this.saveUserToStorage(newUser);
    await this.saveEmailUser(newUser);
    return newUser;
  }

  async authenticate(user: User): Promise<User> {
    this.currentUser = user;
    await this.saveUserToStorage(user);
    return user;
  }

  async logout(): Promise<void> {
    try {
      logger.info('Logging out patient');
      
      // Clear current user
      this.currentUser = null;
      
      // Clear patient user storage
      await AsyncStorage.removeItem('@medibot_user');
      
      // Clear auth tokens (CRITICAL FIX: this was missing!)
      await apiClient.clearAuthData();
      
      logger.info('Patient logged out successfully');
    } catch (error) {
      logger.error('Error logging out patient', error);
      throw error;
    }
  }

  private async getUserByEmail(email: string): Promise<User | null> {
    try {
      const usersData = await AsyncStorage.getItem('@medibot_email_users');
      if (!usersData) return null;

      const users: User[] = JSON.parse(usersData);
      const user = users.find(u => u.email === email);
      return user || null;
    } catch (error) {
      logger.error('Failed to get user by email', error);
      return null;
    }
  }

  private async saveEmailUser(user: User): Promise<void> {
    try {
      const usersData = await AsyncStorage.getItem('@medibot_email_users');
      const users: User[] = usersData ? JSON.parse(usersData) : [];
      
      // Update existing or add new
      const existingIndex = users.findIndex(u => u.email === user.email);
      if (existingIndex >= 0) {
        users[existingIndex] = user;
      } else {
        users.push(user);
      }

      await AsyncStorage.setItem('@medibot_email_users', JSON.stringify(users));
    } catch (error) {
      logger.error('Failed to save email user', error);
    }
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  private async saveUserToStorage(user: User): Promise<void> {
    try {
      await AsyncStorage.setItem('@medibot_user', JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save user', error);
    }
  }

  private async saveGuestUserToStorage(user: User): Promise<void> {
    try {
      // Save guest user separately for persistence across sessions
      await AsyncStorage.setItem('@medibot_guest_user', JSON.stringify(user));
    } catch (error) {
      logger.error('Failed to save guest user', error);
    }
  }

  async loadUserFromStorage(): Promise<User | null> {
    try {
      const userData = await AsyncStorage.getItem('@medibot_user');
      if (userData) {
        const user = JSON.parse(userData);
        this.currentUser = user;
        return user;
      }
    } catch (error) {
      logger.error('Failed to load user from storage', error);
    }
    return null;
  }

  async clearGuestData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('@medibot_guest_user');
    } catch (error) {
      logger.error('Failed to clear guest data', error);
    }
  }
}

export default AuthService;