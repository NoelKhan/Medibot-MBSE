# API Layer Documentation

## Overview

The API layer provides a clean, type-safe interface to the MediBot backend. It follows these principles:

- **Pure HTTP calls** - No business logic
- **Type-safe** - All requests/responses are typed
- **Stateless** - No internal state management
- **Consistent patterns** - All services follow the same structure
- **Easy to test** - Pure functions are easy to mock

## Architecture

```
src/api/
├── client.ts              # HTTP client (axios wrapper)
├── auth.api.ts           # Authentication endpoints
├── users.api.ts          # User & medical records
├── cases.api.ts          # Medical cases
├── bookings.api.ts       # Appointments & doctors
├── emergency.api.ts      # Emergency cases
├── notifications.api.ts  # Push notifications
├── reminders.api.ts      # Medication reminders
└── index.ts              # Central export
```

## HTTP Client

The HTTP client (`client.ts`) provides:

- Automatic token management
- Request/response interceptors
- Token refresh on 401
- Error handling
- Retry logic

### Basic Usage

```typescript
import httpClient from './client';

// GET request
const user = await httpClient.get<User>('/api/users/123');

// POST request
const newCase = await httpClient.post<MedicalCase>('/api/cases', data);

// PATCH request
const updated = await httpClient.patch<User>('/api/users/123', { name: 'John' });

// DELETE request
await httpClient.delete('/api/cases/456');
```

## API Services

### Authentication (`auth.api.ts`)

**11 functions** for user authentication:

```typescript
import { authApi, login, register } from '../api/auth.api';

// Login
const response = await login({ email, password });
// or
const response = await authApi.login({ email, password });

// Register
const user = await register({ name, email, password });

// Refresh token
const tokens = await refreshToken({ refreshToken });

// Get current user
const user = await getCurrentUser();

// Logout
await logout();
```

**Functions:**
- `register(data)` - Register new user
- `login(data)` - User login
- `staffLogin(data)` - Staff login
- `createGuest(data)` - Create guest user
- `refreshToken(data)` - Refresh access token
- `getCurrentUser()` - Get authenticated user
- `logout()` - Logout
- `verifyEmail(token)` - Verify email
- `requestPasswordReset(email)` - Request password reset
- `resetPassword(token, password)` - Reset password
- `changePassword(old, new)` - Change password

### Users (`users.api.ts`)

**9 functions** for user management and medical records:

```typescript
import { usersApi, getUser, updateProfile } from '../api/users.api';

// Get user
const user = await getUser(userId);

// Update profile
const profile = await updateProfile(userId, { bloodType: 'O+' });

// Get medical history
const history = await getMedicalHistory(userId);

// Add medication
const medication = await addMedication(userId, {
  name: 'Aspirin',
  dosage: '100mg',
  frequency: 'daily',
  startDate: '2024-01-01'
});
```

**Functions:**
- `getUser(userId)` - Get user by ID
- `updateUser(userId, data)` - Update user info
- `updateProfile(userId, data)` - Update medical profile
- `getMedicalHistory(userId)` - Get medical history
- `addMedicalHistory(userId, data)` - Add history entry
- `getMedications(userId)` - Get medications
- `addMedication(userId, data)` - Add medication
- `getAllergies(userId)` - Get allergies
- `addAllergy(userId, data)` - Add allergy

### Cases (`cases.api.ts`)

**7 functions** for medical case management:

```typescript
import { casesApi, createCase, addNote } from '../api/cases.api';

// Create case
const newCase = await createCase({
  patientId: '123',
  chiefComplaint: 'Headache',
  symptoms: ['headache', 'dizziness'],
  severity: 3
});

// Get cases
const cases = await getCases(patientId);

// Add note
const note = await addNote(caseId, {
  content: 'Patient improving',
  noteType: 'clinical'
});
```

**Functions:**
- `createCase(data)` - Create medical case
- `getCases(patientId?)` - Get all cases
- `getCase(caseId)` - Get case by ID
- `updateCase(caseId, data)` - Update case
- `getNotes(caseId)` - Get case notes
- `addNote(caseId, data)` - Add note
- `createTriage(caseId, data)` - Create triage

### Bookings (`bookings.api.ts`)

**6 functions** for appointments:

```typescript
import { bookingsApi, getDoctors, createAppointment } from '../api/bookings.api';

// Get doctors
const doctors = await getDoctors({ 
  specialization: 'Cardiology',
  availability: true 
});

// Create appointment
const appointment = await createAppointment({
  patientId: '123',
  doctorId: '456',
  scheduledTime: '2024-01-15T10:00:00Z',
  appointmentType: 'telehealth'
});
```

**Functions:**
- `getDoctors(query?)` - Get available doctors
- `createAppointment(data)` - Create appointment
- `getAppointments(patientId?, doctorId?)` - Get appointments
- `getAppointment(id)` - Get appointment by ID
- `updateAppointment(id, data)` - Update appointment
- `cancelAppointment(id)` - Cancel appointment

### Emergency (`emergency.api.ts`)

**5 functions** for emergency cases:

```typescript
import { emergencyApi, createEmergency } from '../api/emergency.api';

// Create emergency
const emergency = await createEmergency({
  userId: '123',
  emergencyType: 'chest-pain',
  severity: 5,
  description: 'Severe chest pain',
  location: {
    latitude: 40.7128,
    longitude: -74.0060,
    address: '123 Main St'
  }
});
```

**Functions:**
- `createEmergency(data)` - Create emergency case
- `getEmergencies(userId?)` - Get all emergencies
- `getEmergency(id)` - Get emergency by ID
- `updateEmergency(id, data)` - Update emergency
- `assignStaff(id, staffId)` - Assign staff

### Notifications (`notifications.api.ts`)

**8 functions** for push notifications:

```typescript
import { notificationsApi, getNotifications } from '../api/notifications.api';

// Get notifications
const notifications = await getNotifications(userId);

// Mark as read
await markAsRead(notificationId);

// Register device
await registerDevice({
  userId: '123',
  deviceToken: 'expo-push-token',
  platform: 'ios'
});
```

**Functions:**
- `getNotifications(userId)` - Get user notifications
- `getNotification(id)` - Get notification by ID
- `sendNotification(data)` - Send notification
- `markAsRead(id)` - Mark as read
- `markAllAsRead(userId)` - Mark all as read
- `deleteNotification(id)` - Delete notification
- `registerDevice(data)` - Register device
- `unregisterDevice(token)` - Unregister device

### Reminders (`reminders.api.ts`)

**9 functions** for medication reminders:

```typescript
import { remindersApi, createReminder } from '../api/reminders.api';

// Create reminder
const reminder = await createReminder({
  userId: '123',
  medicationName: 'Aspirin',
  dosage: '100mg',
  frequency: 'daily',
  scheduledTimes: ['08:00', '20:00'],
  startDate: '2024-01-01'
});

// Log taken
await logMedicationTaken(reminderId, 'Taken with breakfast');
```

**Functions:**
- `getReminders(userId)` - Get user reminders
- `getReminder(id)` - Get reminder by ID
- `createReminder(data)` - Create reminder
- `updateReminder(id, data)` - Update reminder
- `deleteReminder(id)` - Delete reminder
- `toggleReminder(id)` - Toggle enabled status
- `getReminderLogs(id)` - Get reminder history
- `logMedicationTaken(id, notes?)` - Log taken
- `logMedicationSkipped(id, notes?)` - Log skipped

## Import Patterns

### Named Imports (Recommended)

```typescript
// Import specific functions
import { login, register, getCurrentUser } from '../api/auth.api';

// Use directly
const user = await login({ email, password });
```

### Object Imports

```typescript
// Import convenience object
import { authApi } from '../api/auth.api';

// Use through object
const user = await authApi.login({ email, password });
```

### Barrel Imports

```typescript
// Import from index
import { authApi, usersApi, casesApi } from '../api';

// Use any API
const user = await authApi.login({ email, password });
const profile = await usersApi.getUser(userId);
```

## Error Handling

All API calls can throw errors. Use try-catch:

```typescript
try {
  const user = await login({ email, password });
} catch (error) {
  // Error format from client.ts
  console.error('Login failed:', error.message);
  // error.message contains user-friendly message
}
```

## Type Safety

All functions are fully typed:

```typescript
// TypeScript knows the return type
const user: LoginResponse = await login({ email, password });

// TypeScript validates request data
await createCase({
  patientId: '123',
  chiefComplaint: 'Headache',
  symptoms: ['headache'],
  severity: 3 // Must be 1-5
});
```

## Testing

API functions are easy to mock:

```typescript
// Mock a function
jest.mock('../api/auth.api', () => ({
  login: jest.fn().mockResolvedValue({ user, tokens })
}));

// Or mock the HTTP client
jest.mock('../api/client', () => ({
  default: {
    get: jest.fn(),
    post: jest.fn(),
  }
}));
```

## Best Practices

### ✅ DO

- Use API layer for all HTTP calls
- Handle errors appropriately
- Use TypeScript types
- Keep API calls in API layer only

### ❌ DON'T

- Add business logic to API functions
- Store state in API layer
- Call backend directly from components
- Mix API calls with UI code

## Migration Guide

### Before (Old Pattern)

```typescript
import { AuthApiService } from '../services/AuthApiService';

const authService = AuthApiService.getInstance();
const user = await authService.login(email, password);
```

### After (New Pattern)

```typescript
import { login } from '../api/auth.api';

const response = await login({ email, password });
const user = response.user;
```

## Summary

| Service | Functions | Purpose |
|---------|-----------|---------|
| `auth.api.ts` | 11 | Authentication & authorization |
| `users.api.ts` | 9 | User profiles & medical records |
| `cases.api.ts` | 7 | Medical case management |
| `bookings.api.ts` | 6 | Appointments & doctors |
| `emergency.api.ts` | 5 | Emergency cases |
| `notifications.api.ts` | 8 | Push notifications |
| `reminders.api.ts` | 9 | Medication reminders |
| **TOTAL** | **55** | **Complete API coverage** |

---

**Next Steps:**
1. Create consolidated business logic services in `services/{domain}/`
2. Migrate existing code to use new API layer
3. Remove old API service classes
