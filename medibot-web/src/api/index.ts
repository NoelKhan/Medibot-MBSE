/**
 * API Layer Index
 * ================
 * Central export point for all API services
 * 
 * Usage:
 * import { authApi, usersApi, casesApi } from '../api';
 */

// Export individual API modules
export * from './auth.api';
export * from './users.api';
export * from './cases.api';
export * from './bookings.api';
export * from './emergency.api';
export * from './notifications.api';
export * from './reminders.api';

// Export HTTP client for advanced usage
export { default as httpClient } from './client';

// Re-export convenience objects
export { authApi } from './auth.api';
export { usersApi } from './users.api';
export { casesApi } from './cases.api';
export { bookingsApi } from './bookings.api';
export { emergencyApi } from './emergency.api';
export { notificationsApi } from './notifications.api';
export { remindersApi } from './reminders.api';
