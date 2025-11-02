# Authentication Removal Plan - Medibot MBSE
**Date:** November 2, 2025  
**Issue:** Auth tokens causing "unauthorized" errors in chat and AI agent functionality

---

## 🔍 ANALYSIS SUMMARY

### Current State
The Medibot system currently implements JWT-based authentication across all three applications:

#### **1. medibot-web** 
- Uses `ChatApiService` with token management
- Stores auth tokens in localStorage (`auth_token`)
- Sends `Authorization: Bearer <token>` headers to backend
- ChatPage retrieves token on mount and sets it for API calls
- Has dedicated `auth.api.ts` with login/register flows
- Uses `apiClient.ts` with axios interceptors for token injection

#### **2. medibot-mobile**
- Similar token management in `ChatApiService`
- Similar token management in `DoctorsApiService`
- Has auth API endpoints (`auth.api.ts`)
- Uses tokens for push notification registration
- **Status:** Authentication features appear to be used for mobile app functionality

#### **3. medibot-backend**
- All endpoints protected by `@UseGuards(JwtAuthGuard)`
- Chat endpoints: `/api/chat/*` - **REQUIRES AUTH**
- AI Agent endpoints: `/api/ai/*` - **REQUIRES AUTH**
- Uses NestJS Passport JWT strategy
- Guards automatically reject requests without valid JWT tokens

---

## 🚨 ROOT CAUSE

### The Problem Chain:
1. **Web app** tries to use chat/AI features without authentication
2. **Backend** requires JWT token on all chat/AI endpoints via `JwtAuthGuard`
3. Web app either:
   - Has no token in localStorage → 401 Unauthorized
   - Has expired/invalid token → 401 Unauthorized
4. Chat/AI agent functionality breaks with "unauthorized" errors

### Why Mobile May Need Auth:
- Mobile app uses authentication for:
  - User profile management
  - Booking appointments
  - Push notification registration
  - Medical records access
- **Recommendation:** Keep mobile auth intact unless similar issues occur

---

## 🏗️ ARCHITECTURE COMPARISON

### CURRENT ARCHITECTURE (With Auth)
```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
├────────────────────────────┬────────────────────────────────────────┤
│     MEDIBOT-WEB            │         MEDIBOT-MOBILE                 │
│  ┌──────────────────┐      │     ┌──────────────────┐              │
│  │  ChatPage        │      │     │  Chat Screen     │              │
│  │  - localStorage  │      │     │  - AsyncStorage  │              │
│  │  - auth_token    │      │     │  - auth_token    │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
│           │                │              │                         │
│  ┌────────▼─────────┐      │     ┌────────▼─────────┐              │
│  │ ChatApiService   │      │     │ ChatApiService   │              │
│  │ - setToken()     │      │     │ - setToken()     │              │
│  │ - clearToken()   │      │     │ - clearToken()   │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
│           │                │              │                         │
│  ┌────────▼─────────┐      │     ┌────────▼─────────┐              │
│  │ HTTP Request     │      │     │ HTTP Request     │              │
│  │ Headers:         │      │     │ Headers:         │              │
│  │ Authorization:   │      │     │ Authorization:   │              │
│  │ Bearer <token>   │      │     │ Bearer <token>   │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
└───────────┼────────────────┴──────────────┼─────────────────────────┘
            │                               │
            └───────────┬───────────────────┘
                        │
┌───────────────────────▼──────────────────────────────────────────────┐
│                    MEDIBOT-BACKEND (NestJS)                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                  JWT AUTH MIDDLEWARE                         │    │
│  │  @UseGuards(JwtAuthGuard)                                   │    │
│  │  - Validates JWT token                                       │    │
│  │  - Extracts user from token                                  │    │
│  │  - ❌ REJECTS if no/invalid token → 401 Unauthorized        │    │
│  └────────────────────────┬────────────────────────────────────┘    │
│                           │ ✅ Token Valid                           │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                   CONTROLLERS                               │     │
│  │  ┌──────────────────┐  ┌──────────────────┐                │     │
│  │  │ ChatController   │  │ AIAgentController│                │     │
│  │  │ @UseGuards(JWT)  │  │ @UseGuards(JWT)  │                │     │
│  │  │                  │  │                  │                │     │
│  │  │ POST /message    │  │ POST /chat       │                │     │
│  │  │ POST /analyze    │  │ POST /triage     │                │     │
│  │  │ GET /convos      │  │ GET /cases       │                │     │
│  │  └──────────────────┘  └──────────────────┘                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                           │                                           │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                   SERVICES                                  │     │
│  │  ┌──────────────────┐  ┌──────────────────┐                │     │
│  │  │ ChatService      │  │ AIAgentService   │                │     │
│  │  │                  │  │                  │                │     │
│  │  └──────────────────┘  └──────────────────┘                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

### PROPOSED ARCHITECTURE (Without Auth for Web)
```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
├────────────────────────────┬────────────────────────────────────────┤
│     MEDIBOT-WEB            │         MEDIBOT-MOBILE                 │
│  ┌──────────────────┐      │     ┌──────────────────┐              │
│  │  ChatPage        │      │     │  Chat Screen     │              │
│  │  ❌ NO AUTH      │      │     │  ✅ WITH AUTH    │              │
│  │  ❌ NO TOKEN     │      │     │  - auth_token    │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
│           │                │              │                         │
│  ┌────────▼─────────┐      │     ┌────────▼─────────┐              │
│  │ ChatApiService   │      │     │ ChatApiService   │              │
│  │ ❌ No token mgmt │      │     │ ✅ setToken()    │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
│           │                │              │                         │
│  ┌────────▼─────────┐      │     ┌────────▼─────────┐              │
│  │ HTTP Request     │      │     │ HTTP Request     │              │
│  │ Headers:         │      │     │ Headers:         │              │
│  │ Content-Type     │      │     │ Authorization:   │              │
│  │ only             │      │     │ Bearer <token>   │              │
│  └────────┬─────────┘      │     └────────┬─────────┘              │
└───────────┼────────────────┴──────────────┼─────────────────────────┘
            │                               │
            │                               │
┌───────────▼───────────────────────────────▼───────────────────────────┐
│                    MEDIBOT-BACKEND (NestJS)                           │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │              CONDITIONAL AUTH MIDDLEWARE                     │    │
│  │  @UseGuards(OptionalJwtAuthGuard) OR No Guard               │    │
│  │  - Validates JWT token IF present                           │    │
│  │  - Extracts user from token IF present                       │    │
│  │  - ✅ ALLOWS anonymous access for chat/AI endpoints         │    │
│  │  - ✅ REQUIRES auth for mobile endpoints                     │    │
│  └────────────────────────┬────────────────────────────────────┘    │
│                           │                                           │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                   CONTROLLERS                               │     │
│  │  ┌──────────────────┐  ┌──────────────────┐                │     │
│  │  │ ChatController   │  │ AIAgentController│                │     │
│  │  │ ❌ NO @UseGuards │  │ ❌ NO @UseGuards │                │     │
│  │  │                  │  │                  │                │     │
│  │  │ POST /message    │  │ POST /chat       │                │     │
│  │  │ POST /analyze    │  │ POST /triage     │                │     │
│  │  │ GET /convos      │  │ GET /cases       │                │     │
│  │  └──────────────────┘  └──────────────────┘                │     │
│  └────────────────────────────────────────────────────────────┘     │
│                           │                                           │
│  ┌────────────────────────┴────────────────────────────────────┐    │
│  │            OTHER CONTROLLERS (Keep Auth)                     │    │
│  │  ┌──────────────────┐  ┌──────────────────┐                │    │
│  │  │ BookingsController│  │ UsersController  │                │    │
│  │  │ ✅ @UseGuards(JWT)│  │ ✅ @UseGuards(JWT)│               │    │
│  │  └──────────────────┘  └──────────────────┘                │    │
│  └────────────────────────────────────────────────────────────┘     │
│                           │                                           │
│                           ▼                                           │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │                   SERVICES                                  │     │
│  │  - Anonymous user handling for web                          │     │
│  │  - User-specific data for mobile                            │     │
│  └────────────────────────────────────────────────────────────┘     │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 📋 DETAILED REMOVAL PLAN

### PHASE 1: BACKEND CHANGES (medibot-backend)

#### 1.1 Remove Auth Guards from Chat & AI Agent Controllers

**Files to Modify:**
- `medibot-backend/src/modules/chat/chat.controller.ts`
- `medibot-backend/src/modules/ai-agent/ai-agent.controller.ts`

**Changes:**
```typescript
// BEFORE:
@Controller('chat')
@UseGuards(JwtAuthGuard)  // ❌ REMOVE THIS
@ApiBearerAuth()          // ❌ REMOVE THIS
export class ChatController {
  @Post('message')
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    const userId = req.user.userId;  // ❌ WILL BREAK
    return this.chatService.sendMessage(userId, dto);
  }
}

// AFTER:
@Controller('chat')
// No guards - allow anonymous access
export class ChatController {
  @Post('message')
  async sendMessage(@Body() dto: SendMessageDto) {
    // Generate anonymous user ID or use optional userId from request
    const userId = dto.userId || this.generateAnonymousId();
    return this.chatService.sendMessage(userId, dto);
  }
}
```

#### 1.2 Update Service Layer to Handle Anonymous Users

**Files to Modify:**
- `medibot-backend/src/modules/chat/chat.service.ts`
- `medibot-backend/src/modules/ai-agent/ai-agent.service.ts`

**Changes:**
- Remove dependency on authenticated user ID
- Generate anonymous session IDs for tracking conversations
- Use conversationId as primary identifier instead of userId

#### 1.3 Update DTOs

**Files to Modify:**
- `medibot-backend/src/modules/chat/dto/chat.dto.ts`
- `medibot-backend/src/modules/ai-agent/dto/ai-agent.dto.ts`

**Changes:**
```typescript
export class SendMessageDto {
  @IsOptional()
  @IsString()
  userId?: string;  // Make optional - for anonymous users
  
  @IsOptional()
  @IsString()
  conversationId?: string;
  
  @IsNotEmpty()
  @IsString()
  content: string;
}
```

#### 1.4 Keep Auth Guards on Other Endpoints

**Controllers to Keep Protected:**
- `bookings.controller.ts` - ✅ Keep auth (appointments need user identity)
- `users.controller.ts` - ✅ Keep auth (user profile management)
- `reminders.controller.ts` - ✅ Keep auth (personal reminders)
- `emergency.controller.ts` - ✅ Keep auth (emergency contacts)
- `notifications.controller.ts` - ✅ Keep auth (push notifications)
- `doctors.controller.ts` - ⚠️ Make list endpoints public, keep booking endpoints protected

---

### PHASE 2: WEB APP CHANGES (medibot-web)

#### 2.1 Remove Token Management from ChatApiService

**File:** `medibot-web/src/services/ChatApiService.ts`

**Changes:**
```typescript
export class ChatApiService {
  private baseURL: string;
  // ❌ REMOVE: private token: string | null = null;
  
  // ❌ REMOVE: public setToken(token: string): void
  // ❌ REMOVE: public clearToken(): void
  
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      // ❌ REMOVE: Authorization header logic
    };
  }
  
  public async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    // Just send request without auth
    const response = await fetch(`${this.baseURL}/api/chat/message`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
    });
    // ... rest remains same
  }
}
```

#### 2.2 Remove Token Logic from ChatPage

**File:** `medibot-web/src/pages/ChatPage.tsx`

**Changes:**
```typescript
export default function ChatPage() {
  // ❌ REMOVE: Token retrieval from localStorage
  // ❌ REMOVE: chatApiService.setToken(token) call
  
  useEffect(() => {
    // ❌ REMOVE THIS ENTIRE BLOCK:
    // const token = localStorage.getItem('auth_token');
    // if (token) {
    //   chatApiService.setToken(token);
    // }
  }, []);
  
  // Rest of component remains same
}
```

#### 2.3 Clean Up apiClient.ts

**File:** `medibot-web/src/services/apiClient.ts`

**Options:**
1. **Option A (Recommended):** Keep for other potential authenticated endpoints, but make token optional
2. **Option B:** Remove entirely if no other endpoints need auth

**If keeping (Option A):**
```typescript
class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  
  constructor() {
    this.client = axios.create({...});
    
    this.client.interceptors.request.use(
      (config) => {
        // Only add token if present
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      }
    );
    
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        // ❌ REMOVE: Auto-redirect on 401
        // Web app should handle auth errors gracefully
        return Promise.reject(this.handleError(error));
      }
    );
  }
}
```

#### 2.4 Archive or Remove Auth API

**File:** `medibot-web/src/api/auth.api.ts`

**Options:**
1. Move to `docs/archive/` for future reference
2. Delete if confirmed not needed

---

### PHASE 3: MOBILE APP EVALUATION (medibot-mobile)

#### 3.1 Test Current Functionality

**Action Items:**
- ✅ Test if mobile app chat works without modification
- ✅ Test if mobile booking features require auth
- ✅ Test if push notifications require auth

#### 3.2 Decision Matrix

| Feature | Needs Auth? | Action |
|---------|-------------|--------|
| Chat/AI Agent | ❌ No | Remove auth like web |
| View Doctors List | ❌ No | Make endpoint public |
| Book Appointment | ✅ Yes | Keep auth |
| Medical Records | ✅ Yes | Keep auth |
| Push Notifications | ✅ Yes | Keep auth |
| User Profile | ✅ Yes | Keep auth |

#### 3.3 If Same Issues Occur

**Files to Modify:**
- `medibot-mobile/src/services/ChatApiService.ts` - Remove token management
- `medibot-mobile/src/services/DoctorsApiService.ts` - Make list methods public
- `medibot-mobile/src/api/auth.api.ts` - Keep but make optional for chat

---

## 🔄 MIGRATION STRATEGY

### Step-by-Step Execution

#### Step 1: Backend - Remove Guards
1. Remove `@UseGuards(JwtAuthGuard)` from ChatController
2. Remove `@UseGuards(JwtAuthGuard)` from AIAgentController
3. Update method signatures to not depend on `@Request() req`
4. Make userId optional in services

#### Step 2: Backend - Test Endpoints
```bash
# Test chat endpoint without auth
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "I have a headache"}'

# Should return 200/201 instead of 401
```

#### Step 3: Web - Remove Token Logic
1. Comment out token code in ChatApiService
2. Comment out token code in ChatPage
3. Test chat functionality

#### Step 4: Web - Clean Up
1. Remove commented code
2. Remove unused imports
3. Update documentation

#### Step 5: Mobile - Evaluate & Fix (if needed)
1. Test current functionality
2. Apply similar changes if unauthorized errors occur
3. Keep auth for booking/profile features

---

## ⚠️ RISKS & MITIGATION

### Risk 1: Data Privacy
**Risk:** Anonymous users can access chat without identity  
**Mitigation:** 
- Implement rate limiting on chat endpoints
- Log conversation IDs for abuse monitoring
- Add optional session tracking

### Risk 2: Conversation Persistence
**Risk:** Users lose conversation history without authentication  
**Mitigation:**
- Use conversationId stored in localStorage/sessionStorage
- Offer optional "sign up to save history" feature later
- Keep conversations in DB with anonymous IDs

### Risk 3: Backend Dependencies
**Risk:** Other services may depend on userId from JWT  
**Mitigation:**
- Audit all service dependencies
- Make userId optional with fallback to anonymous ID
- Use TypeScript optional chaining

### Risk 4: Breaking Mobile Features
**Risk:** Removing auth breaks mobile booking/profile features  
**Mitigation:**
- Keep auth for non-chat endpoints
- Selective removal - only chat/AI endpoints
- Maintain separate auth flow for protected resources

---

## ✅ TESTING PLAN

### Backend Tests
```bash
# 1. Chat endpoint without auth
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}'
# Expected: 200/201 with AI response

# 2. AI agent endpoint without auth
curl -X POST http://localhost:3000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I have fever", "userId": "anonymous-123"}'
# Expected: 200 with triage response

# 3. Protected endpoint should still require auth
curl -X GET http://localhost:3000/api/bookings
# Expected: 401 Unauthorized

# 4. Doctors list should be public
curl -X GET http://localhost:3000/api/doctors
# Expected: 200 with doctors list
```

### Web App Tests
1. Open ChatPage
2. Send message without logging in
3. Verify no "unauthorized" errors in console
4. Verify AI response is received
5. Verify conversation persists in session

### Mobile App Tests
1. Open chat screen
2. Send message
3. Verify no unauthorized errors
4. Test booking feature (should still work if auth kept)
5. Test profile feature (should still work if auth kept)

---

## 📊 ROLLBACK PLAN

### If Issues Arise

#### Quick Rollback (Git)
```bash
# Restore previous commit
git log --oneline  # Find commit before changes
git revert <commit-hash>
git push origin main
```

#### Manual Rollback
1. Re-add `@UseGuards(JwtAuthGuard)` to controllers
2. Re-add token management in web services
3. Re-add token retrieval in ChatPage
4. Deploy backend first, then frontend

---

## 📁 FILES TO MODIFY

### Backend (medibot-backend)
- ❌ Remove Guards:
  - `src/modules/chat/chat.controller.ts`
  - `src/modules/ai-agent/ai-agent.controller.ts`
  
- ✏️ Modify Services:
  - `src/modules/chat/chat.service.ts`
  - `src/modules/ai-agent/ai-agent.service.ts`
  
- ✏️ Update DTOs:
  - `src/modules/chat/dto/chat.dto.ts`
  - `src/modules/ai-agent/dto/ai-agent.dto.ts`

- ⚠️ Make Public (Conditional):
  - `src/modules/doctors/doctors.controller.ts` (list endpoints only)

### Web App (medibot-web)
- ❌ Remove Token Logic:
  - `src/services/ChatApiService.ts`
  - `src/pages/ChatPage.tsx`
  
- ✏️ Update (Optional):
  - `src/services/apiClient.ts`
  
- 📦 Archive:
  - `src/api/auth.api.ts` → `docs/archive/`

### Mobile App (medibot-mobile) - IF NEEDED
- ⚠️ Conditional Changes:
  - `src/services/ChatApiService.ts`
  - `src/services/DoctorsApiService.ts`
  
- ✅ Keep Intact:
  - `src/api/auth.api.ts` (for other features)
  - All booking/profile related auth flows

---

## 🎯 SUCCESS CRITERIA

- [ ] Web chat works without authentication
- [ ] No "unauthorized" errors in console
- [ ] AI agent responds to anonymous users
- [ ] Backend chat endpoints accept requests without JWT
- [ ] Mobile app booking features still work (if auth kept)
- [ ] Mobile app profile features still work (if auth kept)
- [ ] Doctor list is publicly accessible
- [ ] Protected endpoints (bookings, users) still require auth
- [ ] No breaking changes in mobile functionality
- [ ] Clean codebase with no unused auth code in web app

---

## 📝 NEXT STEPS

1. **Review this plan** with team
2. **Backup database** before making changes
3. **Create feature branch**: `git checkout -b feature/remove-web-auth`
4. **Implement backend changes** first
5. **Test backend endpoints** thoroughly
6. **Implement web changes**
7. **Test web app** thoroughly
8. **Evaluate mobile app** for similar issues
9. **Deploy to staging** environment
10. **Monitor for errors** before production deployment

---

## 📞 QUESTIONS TO RESOLVE

1. Should we keep conversation history for anonymous users?
2. Do we want optional authentication for saving history?
3. Should doctors list be completely public?
4. Should we implement rate limiting immediately?
5. Do we need session management for anonymous users?
6. Should mobile app follow the same pattern?

---

*Document prepared by: GitHub Copilot*  
*Last updated: November 2, 2025*
