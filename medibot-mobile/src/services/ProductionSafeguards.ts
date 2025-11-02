/**
 * Production Safeguards for MediBot Healthcare App
 * Implements user concurrency limits, rate limiting, and error handling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLogger } from './Logger';

const logger = createLogger('ProductionSafeguards');

interface UserSession {
  id: string;
  userId?: string;
  timestamp: number;
  isActive: boolean;
  platform: 'web' | 'mobile';
  userAgent?: string;
}

interface RateLimit {
  count: number;
  resetTime: number;
}

export class ProductionSafeguards {
  private static instance: ProductionSafeguards;
  private maxConcurrentUsers: number;
  private activeSessions: Map<string, UserSession>;
  private rateLimits: Map<string, RateLimit>;
  private readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private readonly MAX_REQUESTS_PER_WINDOW = 100;
  private readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  private constructor() {
    this.maxConcurrentUsers = parseInt(process.env.EXPO_PUBLIC_MAX_CONCURRENT_USERS || '5');
    this.activeSessions = new Map();
    this.rateLimits = new Map();
    
    // Clean up expired sessions every 5 minutes
    setInterval(() => this.cleanupExpiredSessions(), 5 * 60 * 1000);
    
    // Clean up rate limits every hour
    setInterval(() => this.cleanupExpiredRateLimits(), 60 * 60 * 1000);
  }

  public static getInstance(): ProductionSafeguards {
    if (!ProductionSafeguards.instance) {
      ProductionSafeguards.instance = new ProductionSafeguards();
    }
    return ProductionSafeguards.instance;
  }

  /**
   * Check if a new user session can be created
   */
  public async canCreateSession(platform: 'web' | 'mobile', userAgent?: string): Promise<{
    allowed: boolean;
    reason?: string;
    waitTime?: number;
  }> {
    // Clean up expired sessions first
    this.cleanupExpiredSessions();

    const activeCount = Array.from(this.activeSessions.values())
      .filter(session => session.isActive).length;

    if (activeCount >= this.maxConcurrentUsers) {
      // Find the oldest session to estimate wait time
      const oldestSession = Array.from(this.activeSessions.values())
        .filter(session => session.isActive)
        .sort((a, b) => a.timestamp - b.timestamp)[0];

      const waitTime = oldestSession 
        ? Math.max(0, this.SESSION_TIMEOUT - (Date.now() - oldestSession.timestamp))
        : 5 * 60 * 1000; // Default 5 minutes

      return {
        allowed: false,
        reason: `Maximum concurrent users (${this.maxConcurrentUsers}) reached. Please try again later.`,
        waitTime
      };
    }

    return { allowed: true };
  }

  /**
   * Create a new user session
   */
  public async createSession(userId?: string, platform: 'web' | 'mobile' = 'web', userAgent?: string): Promise<string> {
    const canCreate = await this.canCreateSession(platform, userAgent);
    
    if (!canCreate.allowed) {
      throw new Error(canCreate.reason || 'Cannot create session');
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: UserSession = {
      id: sessionId,
      userId,
      timestamp: Date.now(),
      isActive: true,
      platform,
      userAgent
    };

    this.activeSessions.set(sessionId, session);
    
    // Store session locally for persistence
    try {
      await AsyncStorage.setItem(`medibot_session_${sessionId}`, JSON.stringify(session));
    } catch (error) {
      logger.warn('Failed to store session locally', error);
    }

    logger.info('Created session', { sessionId, platform, activeSessionCount: this.getActiveSessionCount() });
    
    return sessionId;
  }

  /**
   * End a user session
   */
  public async endSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    
    if (session) {
      session.isActive = false;
      this.activeSessions.delete(sessionId);
      
      // Remove from local storage
      try {
        await AsyncStorage.removeItem(`medibot_session_${sessionId}`);
      } catch (error) {
        logger.warn('Failed to remove session from local storage', error);
      }

      logger.info('Ended session', { sessionId, activeSessionCount: this.getActiveSessionCount() });
    }
  }

  /**
   * Check rate limiting for API requests
   */
  public checkRateLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const rateLimit = this.rateLimits.get(identifier);

    if (!rateLimit || now >= rateLimit.resetTime) {
      // Create new rate limit window
      const newRateLimit: RateLimit = {
        count: 1,
        resetTime: now + this.RATE_LIMIT_WINDOW
      };
      this.rateLimits.set(identifier, newRateLimit);
      
      return {
        allowed: true,
        remaining: this.MAX_REQUESTS_PER_WINDOW - 1,
        resetTime: newRateLimit.resetTime
      };
    }

    if (rateLimit.count >= this.MAX_REQUESTS_PER_WINDOW) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: rateLimit.resetTime
      };
    }

    // Increment counter
    rateLimit.count++;
    this.rateLimits.set(identifier, rateLimit);

    return {
      allowed: true,
      remaining: this.MAX_REQUESTS_PER_WINDOW - rateLimit.count,
      resetTime: rateLimit.resetTime
    };
  }

  /**
   * Get current active session count
   */
  public getActiveSessionCount(): number {
    return Array.from(this.activeSessions.values())
      .filter(session => session.isActive).length;
  }

  /**
   * Get system status for monitoring
   */
  public getSystemStatus(): {
    activeUsers: number;
    maxUsers: number;
    utilizationPercent: number;
    rateLimitedUsers: number;
    systemHealthy: boolean;
  } {
    const activeUsers = this.getActiveSessionCount();
    const rateLimitedUsers = Array.from(this.rateLimits.values())
      .filter(limit => limit.count >= this.MAX_REQUESTS_PER_WINDOW).length;

    return {
      activeUsers,
      maxUsers: this.maxConcurrentUsers,
      utilizationPercent: Math.round((activeUsers / this.maxConcurrentUsers) * 100),
      rateLimitedUsers,
      systemHealthy: activeUsers < this.maxConcurrentUsers && rateLimitedUsers < 10
    };
  }

  /**
   * Handle application errors with proper logging and user feedback
   */
  public handleError(error: Error, context: string, sessionId?: string): {
    userMessage: string;
    shouldRetry: boolean;
    logLevel: 'info' | 'warn' | 'error' | 'critical';
  } {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context,
      sessionId,
      timestamp: new Date().toISOString(),
      activeUsers: this.getActiveSessionCount()
    };

    // Categorize errors
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      logger.warn('Network error', errorInfo);
      return {
        userMessage: 'Network connection issue. Please check your internet connection and try again.',
        shouldRetry: true,
        logLevel: 'warn'
      };
    }

    if (error.message.includes('concurrent users') || error.message.includes('rate limit')) {
      logger.info('Capacity limit reached', errorInfo);
      return {
        userMessage: 'Our service is currently at capacity. Please try again in a few minutes.',
        shouldRetry: true,
        logLevel: 'info'
      };
    }

    if (error.message.includes('AI service') || error.message.includes('generateResponse')) {
      logger.error('AI service error', errorInfo);
      return {
        userMessage: 'Our AI assistant is temporarily unavailable. Please try again or seek medical advice from a healthcare provider.',
        shouldRetry: true,
        logLevel: 'error'
      };
    }

    // Unknown/critical errors
    logger.error('Critical error', errorInfo);
    return {
      userMessage: 'An unexpected error occurred. If this is urgent, please contact emergency services or your healthcare provider.',
      shouldRetry: false,
      logLevel: 'critical'
    };
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    const expiredSessions: string[] = [];

    for (const [sessionId, session] of this.activeSessions) {
      if (now - session.timestamp > this.SESSION_TIMEOUT) {
        expiredSessions.push(sessionId);
      }
    }

    for (const sessionId of expiredSessions) {
      this.endSession(sessionId);
    }

    if (expiredSessions.length > 0) {
      logger.info('Cleaned up expired sessions', { expiredCount: expiredSessions.length });
    }
  }

  /**
   * Clean up expired rate limits
   */
  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    const expiredLimits: string[] = [];

    for (const [identifier, rateLimit] of this.rateLimits) {
      if (now >= rateLimit.resetTime) {
        expiredLimits.push(identifier);
      }
    }

    for (const identifier of expiredLimits) {
      this.rateLimits.delete(identifier);
    }

    if (expiredLimits.length > 0) {
      logger.info('Cleaned up expired rate limits', { expiredCount: expiredLimits.length });
    }
  }

  /**
   * Restore sessions from local storage on app restart
   */
  public async restoreSessionsFromStorage(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const sessionKeys = keys.filter(key => key.startsWith('medibot_session_'));
      
      for (const key of sessionKeys) {
        try {
          const sessionData = await AsyncStorage.getItem(key);
          if (sessionData) {
            const session: UserSession = JSON.parse(sessionData);
            
            // Check if session is still valid
            if (Date.now() - session.timestamp < this.SESSION_TIMEOUT) {
              this.activeSessions.set(session.id, session);
            } else {
              // Remove expired session
              await AsyncStorage.removeItem(key);
            }
          }
        } catch (error) {
          logger.warn('Failed to restore session', { key, error });
          await AsyncStorage.removeItem(key);
        }
      }

      logger.info('Restored active sessions from storage', { sessionCount: this.activeSessions.size });
    } catch (error) {
      logger.error('Failed to restore sessions from storage', error);
    }
  }
}

export default ProductionSafeguards;