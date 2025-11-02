/**
 * Analytics Service
 * Tracks user behavior, feature usage, and app performance
 * Supports multiple analytics providers (Firebase, Mixpanel, custom)
 */

import { createLogger } from './Logger';

const logger = createLogger('Analytics');

// Web platform info
const Platform = {
  OS: 'web' as const,
  Version: navigator.userAgent,
};

export enum AnalyticsEvent {
  // Screen Views
  SCREEN_VIEW = 'screen_view',
  
  // Authentication
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  ROLE_SELECTED = 'role_selected',
  
  // Chat
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_VOICE_RECORDED = 'chat_voice_recorded',
  CHAT_FILE_UPLOADED = 'chat_file_uploaded',
  CHAT_EXPORTED = 'chat_exported',
  
  // Medical Cases
  CASE_CREATED = 'case_created',
  CASE_VIEWED = 'case_viewed',
  CASE_UPDATED = 'case_updated',
  
  // Appointments
  APPOINTMENT_BOOKED = 'appointment_booked',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_COMPLETED = 'appointment_completed',
  
  // Emergency
  EMERGENCY_CALL_INITIATED = 'emergency_call_initiated',
  EMERGENCY_CASE_CREATED = 'emergency_case_created',
  
  // Profile
  PROFILE_UPDATED = 'profile_updated',
  PROFILE_VIEWED = 'profile_viewed',
  
  // Notifications
  NOTIFICATION_RECEIVED = 'notification_received',
  NOTIFICATION_OPENED = 'notification_opened',
  NOTIFICATION_DISMISSED = 'notification_dismissed',
  
  // Errors
  ERROR_OCCURRED = 'error_occurred',
  ERROR_BOUNDARY_TRIGGERED = 'error_boundary_triggered',
  
  // Performance
  API_CALL_DURATION = 'api_call_duration',
  SCREEN_LOAD_TIME = 'screen_load_time',
  
  // Feature Usage
  FEATURE_USED = 'feature_used',
  BUTTON_CLICKED = 'button_clicked',
  
  // Search & Discovery
  SEARCH_PERFORMED = 'search_performed',
  FILTER_APPLIED = 'filter_applied',
}

export interface AnalyticsProperties {
  [key: string]: string | number | boolean | undefined;
}

export interface UserProperties {
  userId?: string;
  userRole?: string;
  userType?: string;
  email?: string;
  platform?: string;
  appVersion?: string;
}

const isDev = import.meta.env.MODE === 'development';

class AnalyticsService {
  private static instance: AnalyticsService;
  private enabled: boolean = !isDev; // Disabled in development by default
  private userProperties: UserProperties = {};
  private sessionId: string;
  private sessionStartTime: Date;

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = new Date();
    this.userProperties.platform = 'web';
    this.userProperties.appVersion = '1.0.0'; // Could be dynamic from app.json
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Enable or disable analytics
   */
  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    logger.info(`Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Set user properties
   */
  public setUserProperties(properties: UserProperties): void {
    this.userProperties = { ...this.userProperties, ...properties };
    logger.debug('User properties updated', this.userProperties);
  }

  /**
   * Identify user (called after login)
   */
  public identifyUser(userId: string, properties?: UserProperties): void {
    this.userProperties.userId = userId;
    if (properties) {
      this.setUserProperties(properties);
    }
    logger.info('User identified', { userId });
  }

  /**
   * Clear user data (called on logout)
   */
  public clearUser(): void {
    this.userProperties = {
      platform: 'web',
      appVersion: this.userProperties.appVersion,
    };
    logger.info('User data cleared');
  }

  /**
   * Track an event
   */
  public track(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    if (!this.enabled) {
      return;
    }

    const eventData = {
      event,
      properties: {
        ...properties,
        ...this.userProperties,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
      },
    };

    logger.debug('Analytics event tracked', eventData);

    // Here you would send to your analytics provider
    // Example: Firebase, Mixpanel, Amplitude, custom backend
    this.sendToProvider(eventData);
  }

  /**
   * Track screen view
   */
  public trackScreenView(screenName: string, properties?: AnalyticsProperties): void {
    this.track(AnalyticsEvent.SCREEN_VIEW, {
      screen_name: screenName,
      ...properties,
    });
  }

  /**
   * Track error
   */
  public trackError(error: Error, context?: string, properties?: AnalyticsProperties): void {
    this.track(AnalyticsEvent.ERROR_OCCURRED, {
      error_message: error.message,
      error_stack: error.stack,
      context,
      ...properties,
    });
  }

  /**
   * Track timing (e.g., API calls, screen load)
   */
  public trackTiming(
    category: string,
    variable: string,
    duration: number,
    properties?: AnalyticsProperties
  ): void {
    this.track(AnalyticsEvent.API_CALL_DURATION, {
      category,
      variable,
      duration,
      ...properties,
    });
  }

  /**
   * Start timing (returns function to end timing)
   */
  public startTiming(category: string, variable: string): () => void {
    const startTime = Date.now();
    return () => {
      const duration = Date.now() - startTime;
      this.trackTiming(category, variable, duration);
    };
  }

  /**
   * Track feature usage
   */
  public trackFeatureUsage(featureName: string, properties?: AnalyticsProperties): void {
    this.track(AnalyticsEvent.FEATURE_USED, {
      feature_name: featureName,
      ...properties,
    });
  }

  /**
   * Track button click
   */
  public trackButtonClick(buttonName: string, screenName?: string): void {
    this.track(AnalyticsEvent.BUTTON_CLICKED, {
      button_name: buttonName,
      screen_name: screenName,
    });
  }

  /**
   * Get session duration
   */
  public getSessionDuration(): number {
    return Date.now() - this.sessionStartTime.getTime();
  }

  /**
   * Get session info
   */
  public getSessionInfo(): { sessionId: string; duration: number; startTime: Date } {
    return {
      sessionId: this.sessionId,
      duration: this.getSessionDuration(),
      startTime: this.sessionStartTime,
    };
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  /**
   * Send event to analytics provider(s)
   */
  private async sendToProvider(eventData: any): Promise<void> {
    // In production, implement actual analytics provider integration
    // Examples:
    
    // Firebase Analytics
    // await analytics().logEvent(eventData.event, eventData.properties);
    
    // Mixpanel
    // Mixpanel.track(eventData.event, eventData.properties);
    
    // Custom Backend
    // await fetch('https://api.example.com/analytics', {
    //   method: 'POST',
    //   body: JSON.stringify(eventData),
    // });
    
    // For now, just log in development
    if (isDev) {
      logger.debug('Would send to analytics provider', eventData);
    }
  }

  /**
   * Batch events (for performance optimization)
   */
  private eventQueue: any[] = [];
  private batchSize: number = 10;
  // private batchInterval: number = 30000; // 30 seconds - currently unused

  /**
   * Add event to queue (will be sent in batches)
   */
  public queueEvent(event: AnalyticsEvent, properties?: AnalyticsProperties): void {
    this.eventQueue.push({
      event,
      properties: {
        ...properties,
        ...this.userProperties,
        timestamp: new Date().toISOString(),
      },
    });

    if (this.eventQueue.length >= this.batchSize) {
      this.flushEvents();
    }
  }

  /**
   * Flush queued events
   */
  public async flushEvents(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const eventsToSend = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send batch to analytics provider
      // await fetch('https://api.example.com/analytics/batch', {
      //   method: 'POST',
      //   body: JSON.stringify({ events: eventsToSend }),
      // });
      
      logger.debug('Flushed analytics events', { count: eventsToSend.length });
    } catch (error) {
      logger.error('Failed to flush analytics events', error);
      // Re-queue events on failure
      this.eventQueue = [...eventsToSend, ...this.eventQueue];
    }
  }
}

// Export singleton instance
export const Analytics = AnalyticsService.getInstance();

// Convenience functions for common tracking
export const trackScreen = (screenName: string, properties?: AnalyticsProperties) => {
  Analytics.trackScreenView(screenName, properties);
};

export const trackEvent = (event: AnalyticsEvent, properties?: AnalyticsProperties) => {
  Analytics.track(event, properties);
};

export const trackError = (error: Error, context?: string, properties?: AnalyticsProperties) => {
  Analytics.trackError(error, context, properties);
};

export const trackFeature = (featureName: string, properties?: AnalyticsProperties) => {
  Analytics.trackFeatureUsage(featureName, properties);
};

export default Analytics;
