/**
 * Authentication Context
 * ======================
 * Global state management for user authentication
 * 
 * NOTE: Chat/AI features don't require auth
 * This context is for other features like booking, profiles, etc.
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../services/apiClient';
import { API_CONFIG } from '../config/api.config';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'patient' | 'doctor' | 'nurse' | 'emergency' | 'staff' | 'admin';
  staffId?: string; // For medical and emergency staff
  profileImage?: string;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'patient';
}

interface AuthResponse {
  user: User;
  token: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const storedUser = localStorage.getItem('user_data');
      
      if (token && storedUser) {
        console.log('Loading stored user session');
        apiClient.setToken(token);
        // NOTE: Chat no longer uses auth tokens
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      apiClient.clearToken();
      // NOTE: Chat no longer uses auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      // Test accounts mapping
      const TEST_ACCOUNTS = {
        // Patient accounts
        'test@medibot.com': { password: 'Test123!', role: 'patient' as const, firstName: 'Test', lastName: 'Patient', staffId: undefined },
        'sarah.johnson@example.com': { password: 'password123', role: 'patient' as const, firstName: 'Sarah', lastName: 'Johnson', staffId: undefined },
        'robert.chen@example.com': { password: 'password123', role: 'patient' as const, firstName: 'Robert', lastName: 'Chen', staffId: undefined },
        'margaret.williams@example.com': { password: 'password123', role: 'patient' as const, firstName: 'Margaret', lastName: 'Williams', staffId: undefined },
        
        // Medical staff accounts
        'test@medical.com': { password: 'Test123!', role: 'doctor' as const, firstName: 'Dr. Test', lastName: 'Medical', staffId: 'API-001' },
        'supervisor@health.vic.gov.au': { password: 'staff2024', role: 'doctor' as const, firstName: 'Dr. Sarah', lastName: 'Mitchell', staffId: 'SUP001' },
        'nurse@health.vic.gov.au': { password: 'staff2024', role: 'nurse' as const, firstName: 'Nurse', lastName: 'Johnson', staffId: 'NUR001' },
        
        // Emergency staff accounts
        'test@emergency.com': { password: 'Test123!', role: 'emergency' as const, firstName: 'Emergency', lastName: 'Operator', staffId: 'API-911' },
        'emergency@health.vic.gov.au': { password: 'emergency123', role: 'emergency' as const, firstName: 'Emergency', lastName: 'Dispatcher', staffId: 'EMG001' },
        
        // Demo accounts (backward compatibility)
        'patient@demo.com': { password: 'patient123', role: 'patient' as const, firstName: 'Demo', lastName: 'Patient', staffId: undefined },
        'doctor@demo.com': { password: 'doctor123', role: 'doctor' as const, firstName: 'Dr. Demo', lastName: 'Doctor', staffId: undefined },
      };

      // Check if it's a test account
      const testAccount = TEST_ACCOUNTS[email as keyof typeof TEST_ACCOUNTS];
      if (testAccount && password === testAccount.password) {
        const demoUser: User = {
          id: email.split('@')[0],
          email: email,
          firstName: testAccount.firstName,
          lastName: testAccount.lastName,
          role: testAccount.role,
          staffId: testAccount.staffId,
        };
        
        const demoToken = 'test-token-' + Date.now();
        apiClient.setToken(demoToken);
        // NOTE: Chat no longer uses auth tokens
        localStorage.setItem('auth_token', demoToken);
        localStorage.setItem('user_data', JSON.stringify(demoUser));
        localStorage.setItem('user_role', demoUser.role); // Store role separately for quick access
        setUser(demoUser);
        
        console.log('Test account login successful:', demoUser);
        return;
      }
      
      // Real API login
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.endpoints.auth.login,
        { email, password }
      );
      
      apiClient.setToken(response.token);
      // NOTE: Chat no longer uses auth tokens
      localStorage.setItem('auth_token', response.token);
      localStorage.setItem('user_data', JSON.stringify(response.user));
      localStorage.setItem('user_role', response.user.role);
      setUser(response.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw new Error('Invalid credentials. Please check your email and password.');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await apiClient.post<AuthResponse>(
        API_CONFIG.endpoints.auth.register,
        { ...data, role: data.role || 'patient' }
      );
      
      apiClient.setToken(response.token);
      // NOTE: Chat no longer uses auth tokens
      setUser(response.user);
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiClient.post(API_CONFIG.endpoints.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      apiClient.clearToken();
      // NOTE: Chat no longer uses auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('user_role');
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
