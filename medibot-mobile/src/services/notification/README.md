# Notification Service

**Consolidated notification management service** that replaces 5 separate notification services.

## Architecture

```
// NotificationService (business logic) - removed
    ↓
notifications.api.ts (HTTP calls)
    ↓
Backend API
```

## Replaced Services

This service consolidates:
// Deprecated notification services removed

Total: **~1,200 lines → 700 lines** (40% reduction)

## Features

### Push Notifications
- Expo push notification registration
- Device token management
- Backend sync for push tokens
- Platform-specific configuration (iOS/Android)
- Notification channels (Android)

### Local Notifications
- Schedule reminders (appointments, medications, follow-ups)
- Immediate notifications
- Cancel scheduled notifications
- Notification triggers (date-based)

### Settings Management
- User preferences (push, email, SMS)
- Reminder preferences (appointments, medications, follow-ups)
- Emergency alerts configuration
- Persistent storage

### Notification History
- Track received notifications
- Mark as read
- Clear history
- In-memory + AsyncStorage

### Backend Integration
- Fetch notifications from API
- Mark as read (sync with backend)
- Delete notifications
- Register/unregister devices

## Usage

### Initialization

```typescript
import { notificationService } from '../services/notification';

// Initialize on app start
const pushToken = await notificationService.initialize();

// Register with backend after login
await notificationService.registerWithBackend(userId);
```

### Send Local Notification

```typescript
const notificationId = await notificationService.sendLocalNotification({
  title: 'Appointment Reminder',
  body: 'You have an appointment tomorrow at 10:00 AM',
  data: { appointmentId: '123' },
});
```

### Schedule Reminder

```typescript
const reminderId = await notificationService.scheduleReminder({
  title: 'Take Medication',
  body: 'Time to take your blood pressure medication',
  date: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  type: 'medication',
  priority: 'high',
});

// Cancel reminder
await notificationService.cancelReminder(reminderId);
```

### Update Settings

```typescript
await notificationService.updateSettings({
  appointmentReminders: true,
  medicationReminders: true,
  marketingMessages: false,
});

const settings = notificationService.getSettings();
```

### Backend Notifications

```typescript
// Fetch notifications
const notifications = await notificationService.fetchNotifications(userId);

// Mark as read
await notificationService.markNotificationAsRead(notificationId);

// Mark all as read
await notificationService.markAllNotificationsAsRead(userId);

// Delete notification
await notificationService.deleteNotification(notificationId);
```

### Notification History

```typescript
const history = notificationService.getHistory();
await notificationService.clearHistory();
```

### Permissions

```typescript
// Check permissions
const hasPermission = await notificationService.checkPermissions();

// Request permissions
const granted = await notificationService.requestPermissions();
```

### Badge Management

```typescript
const count = await notificationService.getBadgeCount();
await notificationService.setBadgeCount(5);
await notificationService.clearBadges();
```

## Migration Guide

### From Old NotificationService

```typescript
// OLD
const service = NotificationService.getInstance();
await service.initialize();
await service.registerPushTokenWithBackend(userId, token);

// NEW
import { notificationService } from '../services/notification';
await notificationService.initialize();
await notificationService.registerWithBackend(userId);
```

### From EnhancedNotificationService

```typescript
// OLD
const service = EnhancedNotificationService.getInstance();
await service.initialize();
await service.scheduleNotification({ title, body, date });

// NEW
import { notificationService } from '../services/notification';
await notificationService.initialize();
await notificationService.scheduleReminder({ title, body, date, type: 'custom', priority: 'normal' });
```

### From PushNotificationService

```typescript
// OLD
const token = await PushNotificationService.registerForPushNotifications();

// NEW
import { notificationService } from '../services/notification';
const token = await notificationService.initialize();
```

## Key Improvements

1. **Single Source of Truth**: One service for all notification needs
2. **Backend Integration**: Full API sync with notifications.api.ts
3. **Type Safety**: Complete TypeScript types for all operations
4. **Persistent Storage**: Settings and history saved automatically
5. **Error Handling**: Comprehensive error logging
6. **Clean API**: Simplified, intuitive method names
7. **Cleanup**: Proper listener cleanup to prevent memory leaks

## Storage Keys

- `@notification_settings` - User preferences
- `@push_token` - Device push token
- `@notification_history` - Notification history
- `@scheduled_reminders` - Scheduled reminders

## Dependencies

- `expo-notifications` - Push notifications
- `expo-device` - Device information
- `expo-constants` - App constants
- `@react-native-async-storage/async-storage` - Persistent storage
- `../../api/notifications.api` - Backend API calls
- `../Logger` - Logging service

## Error Handling

All methods handle errors gracefully:
- Push notification registration failures (non-physical devices)
- Permission denials
- Backend API failures (offline mode)
- Storage errors

Errors are logged but don't crash the app.

## Testing

```typescript
// Test initialization
const token = await notificationService.initialize();
expect(token).toBeTruthy();

// Test scheduling
const reminderId = await notificationService.scheduleReminder({
  title: 'Test',
  body: 'Test reminder',
  date: new Date(Date.now() + 60000),
  type: 'custom',
  priority: 'normal',
});
expect(reminderId).toBeTruthy();

// Test settings
await notificationService.updateSettings({ pushNotifications: false });
const settings = notificationService.getSettings();
expect(settings.pushNotifications).toBe(false);
```

## Notes

- Push notifications only work on physical devices
- Requires Expo project ID for push tokens
- Android requires notification channels
- iOS requires notification permissions
- Backend sync is optional (graceful fallback)
