# Authentication Service

## Overview

The `AuthService` is a consolidated authentication service that merges functionality from:
- `AuthService.ts` (basic auth)
- `UserAuthService.ts` (user management)
- `AuthPersistenceService.ts` (session persistence)

## Features

### ✅ User Authentication
- Register new users
- Login with email/password
- Guest user sessions
- Logout functionality

### ✅ Session Management
- Persistent sessions (30 days)
- Automatic token refresh
- Secure token storage (SecureStore)
- Session state restoration

### ✅ Password Management
- Request password reset
- Reset password with token
- Change password

### ✅ Email Verification
- Verify email with token
- Refresh user data after verification

## Usage

### Import

```typescript
import { authService } from '../services/auth';
// or
import authService from '../services/auth';
```

### Register New User

```typescript
try {
  const user = await authService.register({
    name: 'John Doe',
    email: 'john@example.com',
    password: 'securePassword123',
    phone: '+1234567890',
    dateOfBirth: new Date('1990-01-01'),
    gender: 'male',
  });
  
  console.log('User registered:', user);
} catch (error) {
  console.error('Registration failed:', error.message);
}
```

### Login

```typescript
try {
  const user = await authService.login({
    email: 'john@example.com',
    password: 'securePassword123',
  });
  
  console.log('User logged in:', user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Guest Login

```typescript
try {
  const guestUser = await authService.loginAsGuest({
    name: 'Guest User',
    phone: '+1234567890', // optional
  });
  
  console.log('Guest user created:', guestUser);
} catch (error) {
  console.error('Guest login failed:', error.message);
}
```

### Logout

```typescript
try {
  await authService.logout();
  console.log('User logged out');
} catch (error) {
  console.error('Logout failed:', error.message);
}
```

### Get Current User

```typescript
const currentUser = authService.getCurrentUser();

if (currentUser) {
  console.log('Current user:', currentUser);
} else {
  console.log('No user logged in');
}
```

### Check Authentication Status

```typescript
if (authService.isAuthenticated()) {
  console.log('User is authenticated');
}

if (authService.isGuest()) {
  console.log('User is a guest');
}
```

### Restore Session (on app startup)

```typescript
useEffect(() => {
  const restoreSession = async () => {
    try {
      const authState = await authService.loadAuthState();
      
      if (authState) {
        console.log('Session restored:', authState.user);
        // Navigate to authenticated screen
      } else {
        console.log('No saved session');
        // Navigate to login screen
      }
    } catch (error) {
      console.error('Session restore failed:', error);
    }
  };
  
  restoreSession();
}, []);
```

### Password Management

```typescript
// Request password reset
await authService.requestPasswordReset('john@example.com');

// Reset password with token
await authService.resetPassword('reset-token', 'newPassword123');

// Change password (requires authentication)
await authService.changePassword('oldPassword', 'newPassword123');
```

### Email Verification

```typescript
// Verify email
await authService.verifyEmail('verification-token');

// Refresh user data after verification
await authService.refreshUserData();
```

### Update User Data

```typescript
const updatedUser = { ...currentUser, name: 'Updated Name' };
await authService.updateUserData(updatedUser);
```

## Methods Reference

### Authentication Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register(data)` | `RegisterData` | `Promise<PatientUser>` | Register new user |
| `login(data)` | `LoginData` | `Promise<PatientUser>` | Login with email/password |
| `loginAsGuest(data)` | `GuestData` | `Promise<PatientUser>` | Create/restore guest session |
| `logout()` | - | `Promise<void>` | Logout current user |
| `getCurrentUser()` | - | `User \| PatientUser \| null` | Get current user |
| `isAuthenticated()` | - | `boolean` | Check if authenticated |
| `isGuest()` | - | `boolean` | Check if user is guest |

### Session Management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `loadAuthState()` | - | `Promise<AuthState \| null>` | Restore session from storage |
| `refreshAccessToken()` | - | `Promise<void>` | Refresh access token |
| `updateUserData(user)` | `User \| PatientUser` | `Promise<void>` | Update current user data |

### Password Management

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `requestPasswordReset(email)` | `string` | `Promise<void>` | Request password reset email |
| `resetPassword(token, password)` | `string, string` | `Promise<void>` | Reset password with token |
| `changePassword(old, new)` | `string, string` | `Promise<void>` | Change password |

### Email Verification

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `verifyEmail(token)` | `string` | `Promise<void>` | Verify email with token |
| `refreshUserData()` | - | `Promise<void>` | Refresh user data from server |

### Utility Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `clearGuestData()` | - | `Promise<void>` | Clear guest user data |

## Type Definitions

### RegisterData
```typescript
interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
}
```

### LoginData
```typescript
interface LoginData {
  email: string;
  password: string;
}
```

### GuestData
```typescript
interface GuestData {
  name: string;
  phone?: string;
}
```

### AuthState
```typescript
interface AuthState {
  user: User | PatientUser;
  accessToken: string;
  refreshToken: string;
  timestamp: number;
}
```

## Architecture

### Separation of Concerns

```
Component
    ↓
AuthService (Business Logic)
    ↓
auth.api.ts (HTTP Calls)
    ↓
httpClient (HTTP Layer)
    ↓
Backend API
```

### Benefits

1. **Single Responsibility**: Auth logic in one place
2. **Type Safe**: Full TypeScript support
3. **Testable**: Easy to mock API calls
4. **Maintainable**: Clear structure and patterns
5. **Persistent**: Sessions survive app restarts

## Migration Guide

### Old Pattern (Don't Use)

```typescript
import { AuthService } from '../services/AuthService';
import { UserAuthService } from '../services/UserAuthService';

const authService = AuthService.getInstance();
const userAuthService = UserAuthService.getInstance();

await authService.loginWithEmail(email);
await userAuthService.authenticateUser(email, password);
```

### New Pattern (Use This)

```typescript
import { authService } from '../services/auth';

await authService.login({ email, password });
```

## Error Handling

All methods throw errors on failure. Always use try-catch:

```typescript
try {
  await authService.login({ email, password });
} catch (error) {
  if (error.message === 'Invalid email or password') {
    // Handle authentication error
  } else {
    // Handle other errors
  }
}
```

## Security

- Tokens stored in `SecureStore` (encrypted storage)
- Sessions expire after 30 days
- Automatic token refresh on 401 errors
- Secure logout clears all auth data

## Testing

```typescript
// Mock the service
jest.mock('../services/auth', () => ({
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

// Use in tests
import { authService } from '../services/auth';

(authService.login as jest.Mock).mockResolvedValue(mockUser);
```

## Status

✅ **Complete and ready for use**
- All methods implemented
- Type-safe
- Error handling
- Persistent sessions
- Well documented

---

**Next Steps:**
1. Update screens to use new AuthService
2. Test authentication flows
3. Remove deprecated auth services
