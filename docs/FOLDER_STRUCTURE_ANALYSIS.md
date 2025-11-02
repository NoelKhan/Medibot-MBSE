# Medibot MBSE - Folder Structure Analysis
**Date:** November 2, 2025  
**Purpose:** Comprehensive analysis of all project folders and their relationships

---

## 🗂️ PROJECT OVERVIEW

```
Medibot-MBSE/
├── medibot-backend/          # NestJS backend API server
├── medibot-web/              # React + Vite web application
├── medibot-mobile/           # React Native mobile app
├── packages/shared/          # Shared code/types between projects
├── infrastructure/           # Docker & Kubernetes configs
├── scripts/                  # Deployment & utility scripts
├── tests/                    # Integration & load tests
└── docs/                     # Documentation
```

---

## 📦 DETAILED FOLDER ANALYSIS

### 1. `medibot-backend/` - Backend API Server

**Technology Stack:** NestJS, TypeScript, PostgreSQL, TypeORM

#### Structure:
```
medibot-backend/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── app.module.ts              # Root module
│   ├── health.controller.ts       # Health check endpoint
│   │
│   ├── common/                    # Shared utilities
│   ├── config/                    # Configuration files
│   ├── database/                  # Database connection
│   │
│   └── modules/                   # Feature modules
│       ├── auth/                  # Authentication & JWT
│       │   ├── auth.controller.ts
│       │   ├── auth.service.ts
│       │   ├── auth.module.ts
│       │   └── guards/
│       │       ├── jwt-auth.guard.ts      # 🎯 BLOCKS CHAT/AI
│       │       └── roles.guard.ts
│       │
│       ├── chat/                  # 🎯 CHAT ENDPOINTS (Protected)
│       │   ├── chat.controller.ts         # @UseGuards(JwtAuthGuard)
│       │   ├── chat.service.ts
│       │   └── dto/
│       │
│       ├── ai-agent/              # 🎯 AI AGENT (Protected)
│       │   ├── ai-agent.controller.ts     # @UseGuards(JwtAuthGuard)
│       │   ├── ai-agent.service.ts
│       │   └── dto/
│       │
│       ├── users/                 # User management (Keep protected)
│       ├── doctors/               # Doctor listings (Make public?)
│       ├── bookings/              # Appointments (Keep protected)
│       ├── reminders/             # Medication reminders (Keep protected)
│       ├── emergency/             # Emergency contacts (Keep protected)
│       ├── notifications/         # Push notifications (Keep protected)
│       └── medical-cases/         # Medical case management (Keep protected)
│
├── python/
│   └── aiagent/                   # Python AI agent integration
│
├── controllers/                   # Legacy JS controllers
├── models/                        # Legacy JS models
├── routes/                        # Legacy JS routes
├── migrations/                    # SQL migration scripts
├── infrastructure/                # Docker & K8s for backend
│   ├── Docker/
│   └── k8s/
└── scripts/                       # Deployment scripts
```

#### Key Issues:
- ❌ **All chat/AI endpoints protected by `JwtAuthGuard`**
- ❌ **No anonymous access to chat functionality**
- ⚠️ **Mixed TypeScript (src/) and JavaScript (controllers/) structure**

#### Dependencies:
- `@nestjs/jwt` - JWT token generation/validation
- `@nestjs/passport` - Authentication strategies
- `passport-jwt` - JWT passport strategy
- `typeorm` - Database ORM
- `pg` - PostgreSQL driver

---

### 2. `medibot-web/` - Web Application

**Technology Stack:** React 18, TypeScript, Vite, Material-UI

#### Structure:
```
medibot-web/
├── src/
│   ├── main.tsx                   # Application entry
│   ├── App.tsx                    # Root component
│   │
│   ├── api/                       # API layer
│   │   ├── auth.api.ts            # 🎯 AUTH API (To remove)
│   │   └── client.ts              # HTTP client
│   │
│   ├── services/                  # Business logic
│   │   ├── ChatApiService.ts      # 🎯 HAS TOKEN MGMT
│   │   ├── apiClient.ts           # 🎯 HAS TOKEN MGMT
│   │   └── Logger.ts
│   │
│   ├── pages/                     # Page components
│   │   ├── ChatPage.tsx           # 🎯 RETRIEVES TOKEN FROM localStorage
│   │   ├── RoleSelectionPage.tsx
│   │   ├── BookingPage.tsx
│   │   └── ...
│   │
│   ├── components/                # Reusable components
│   ├── config/                    # Configuration
│   │   └── api.config.ts          # API URLs
│   │
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   ├── navigation/                # Routing
│   ├── theme/                     # MUI theming
│   ├── types/                     # TypeScript types
│   └── utils/                     # Utility functions
│
├── infrastructure/
│   ├── Dockerfile
│   └── nginx.conf
│
└── scripts/
    ├── deploy-k8s.sh
    └── START-PRODUCTION.sh
```

#### Key Issues:
- ❌ **ChatApiService stores and sends auth tokens**
- ❌ **ChatPage retrieves token from localStorage on mount**
- ❌ **apiClient.ts intercepts requests to add Authorization header**
- ❌ **401 errors redirect to home page automatically**

#### Authentication Flow (Current):
```
1. User visits ChatPage
2. useEffect retrieves 'auth_token' from localStorage
3. chatApiService.setToken(token)
4. Each API call includes: Authorization: Bearer <token>
5. Backend rejects with 401 if token missing/invalid
6. axios interceptor redirects to '/' on 401
```

---

### 3. `medibot-mobile/` - Mobile Application

**Technology Stack:** React Native, Expo, TypeScript

#### Structure:
```
medibot-mobile/
├── App.tsx                        # Root component
├── src/
│   ├── api/                       # API layer
│   │   ├── auth.api.ts            # 🎯 AUTH API (Keep for bookings?)
│   │   └── client.ts
│   │
│   ├── services/                  # Business logic
│   │   ├── ChatApiService.ts      # 🎯 HAS TOKEN MGMT
│   │   ├── DoctorsApiService.ts   # 🎯 HAS TOKEN MGMT
│   │   ├── NotificationService.ts # Uses auth for push tokens
│   │   └── Logger.ts
│   │
│   ├── screens/                   # Mobile screens
│   │   ├── ChatScreen.tsx
│   │   ├── BookingScreen.tsx
│   │   └── ...
│   │
│   ├── components/                # Reusable components
│   ├── config/                    # Configuration
│   ├── contexts/                  # React contexts
│   ├── hooks/                     # Custom hooks
│   ├── navigation/                # React Navigation
│   ├── theme/                     # Styling
│   ├── types/                     # TypeScript types
│   └── utils/                     # Utility functions
│
└── infrastructure/
    ├── nginx.conf
    └── Docker/
```

#### Key Issues:
- ⚠️ **Similar token management to web app**
- ✅ **Mobile likely NEEDS auth for:**
  - Booking appointments (requires user identity)
  - Medical records access
  - Push notification registration
  - User profile management

#### Recommendation:
- Keep auth for booking/profile features
- Remove auth ONLY for chat/AI features IF same issues occur
- Test thoroughly before changes

---

### 4. `packages/shared/` - Shared Code

**Purpose:** Shared types, utilities, and logic between frontend projects

#### Likely Contents:
```
packages/shared/
├── src/
│   ├── types/                     # Shared TypeScript types
│   │   ├── User.ts
│   │   ├── Chat.ts
│   │   ├── Booking.ts
│   │   └── ...
│   │
│   ├── utils/                     # Shared utilities
│   └── constants/                 # Shared constants
│
└── package.json
```

#### Impact:
- ✏️ May need to update shared types if auth-related types are removed

---

### 5. `infrastructure/` - DevOps Configuration

#### Structure:
```
infrastructure/
├── docker/
│   └── docker-compose.yml         # Local development setup
│
└── k8s/                           # Kubernetes manifests
    ├── backend-deployment.yaml
    ├── web-deployment.yaml
    ├── mobile-deployment.yaml
    ├── ai-agent-deployment.yaml
    ├── postgres-statefulset.yaml
    ├── ollama-statefulset.yaml
    ├── ingress.yaml               # Routing rules
    ├── hpa.yaml                   # Auto-scaling
    └── deploy.sh                  # Deployment script
```

#### Impact:
- ✅ No changes needed (auth removal is application-level)
- Infrastructure remains the same

---

### 6. `scripts/` - Automation Scripts

#### Structure:
```
scripts/
├── deployment/                    # Deployment automation
├── development/                   # Dev environment setup
├── testing/                       # Test automation
└── utilities/                     # Utility scripts
```

#### Impact:
- ✅ No changes needed

---

### 7. `tests/` - Testing Suite

#### Structure:
```
tests/
├── load/                          # Load testing scripts
└── ...
```

#### Impact:
- ✏️ May need to update API tests to work without auth headers

---

## 🔗 INTER-PROJECT DEPENDENCIES

### Communication Flow:
```
┌─────────────┐          ┌─────────────┐
│ medibot-web │◄────────►│             │
└─────────────┘          │  medibot-   │          ┌──────────┐
                         │  backend    │◄────────►│PostgreSQL│
┌─────────────┐          │             │          └──────────┘
│medibot-     │◄────────►│             │
│mobile       │          └─────────────┘
└─────────────┘                 │
                                │
                         ┌──────▼──────┐
                         │   AI Agent  │
                         │   (Python)  │
                         └─────────────┘
```

### API Endpoints Used by Web App:
- `/api/chat/message` - 🎯 Send chat message (Currently protected)
- `/api/chat/analyze` - 🎯 Analyze symptoms (Currently protected)
- `/api/chat/conversations` - 🎯 Get conversations (Currently protected)
- `/api/ai/chat` - 🎯 AI agent chat (Currently protected)
- `/api/ai/triage` - 🎯 Quick triage (Currently protected)
- `/api/doctors` - Get doctors list (Should be public)

### API Endpoints Used by Mobile App:
- Same chat/AI endpoints as web
- `/api/bookings/*` - Appointment booking (KEEP protected)
- `/api/users/*` - User profile (KEEP protected)
- `/api/reminders/*` - Medication reminders (KEEP protected)
- `/api/notifications/register-token` - Push tokens (KEEP protected)

---

## 🎯 AUTH REMOVAL IMPACT BY FOLDER

| Folder | Impact Level | Changes Required |
|--------|--------------|------------------|
| `medibot-backend/src/modules/chat/` | 🔴 HIGH | Remove `@UseGuards(JwtAuthGuard)` |
| `medibot-backend/src/modules/ai-agent/` | 🔴 HIGH | Remove `@UseGuards(JwtAuthGuard)` |
| `medibot-backend/src/modules/auth/` | ✅ NONE | Keep intact for other modules |
| `medibot-backend/src/modules/doctors/` | 🟡 MEDIUM | Make list endpoints public |
| `medibot-backend/src/modules/bookings/` | ✅ NONE | Keep protected |
| `medibot-web/src/services/` | 🔴 HIGH | Remove token management |
| `medibot-web/src/pages/ChatPage.tsx` | 🔴 HIGH | Remove token retrieval |
| `medibot-web/src/api/auth.api.ts` | 🟡 MEDIUM | Archive or remove |
| `medibot-mobile/src/services/` | 🟠 CONDITIONAL | Only if same issues occur |
| `medibot-mobile/src/api/auth.api.ts` | ✅ NONE | Keep for bookings/profile |
| `packages/shared/` | 🟢 LOW | Update types if needed |
| `infrastructure/` | ✅ NONE | No changes |
| `scripts/` | ✅ NONE | No changes |
| `tests/` | 🟢 LOW | Update API tests |

---

## 📊 AUTHENTICATION USAGE MATRIX

| Feature | Web | Mobile | Backend | Auth Required? |
|---------|-----|--------|---------|----------------|
| Chat/AI Agent | ✅ | ✅ | ✅ | ❌ NO (Remove) |
| View Doctors | ✅ | ✅ | ✅ | ❌ NO (Make public) |
| Book Appointment | ❌ | ✅ | ✅ | ✅ YES (Keep) |
| User Profile | ❌ | ✅ | ✅ | ✅ YES (Keep) |
| Medical Records | ❌ | ✅ | ✅ | ✅ YES (Keep) |
| Reminders | ❌ | ✅ | ✅ | ✅ YES (Keep) |
| Push Notifications | ❌ | ✅ | ✅ | ✅ YES (Keep) |
| Emergency Contacts | ❌ | ✅ | ✅ | ✅ YES (Keep) |

---

## 🔍 CRITICAL FILES TO MODIFY

### Priority 1 (Must Change):
1. `medibot-backend/src/modules/chat/chat.controller.ts`
2. `medibot-backend/src/modules/ai-agent/ai-agent.controller.ts`
3. `medibot-web/src/services/ChatApiService.ts`
4. `medibot-web/src/pages/ChatPage.tsx`

### Priority 2 (Should Change):
5. `medibot-backend/src/modules/chat/chat.service.ts`
6. `medibot-backend/src/modules/ai-agent/ai-agent.service.ts`
7. `medibot-web/src/services/apiClient.ts`
8. `medibot-backend/src/modules/doctors/doctors.controller.ts`

### Priority 3 (Nice to Clean):
9. `medibot-web/src/api/auth.api.ts` (archive)
10. DTOs in chat/ai-agent modules
11. Test files

---

## 🛠️ DEVELOPMENT WORKFLOW

### Local Development:
```bash
# Backend
cd medibot-backend
npm install
npm run start:dev  # Runs on http://localhost:3000

# Web
cd medibot-web
npm install
npm run dev  # Runs on http://localhost:5173

# Mobile
cd medibot-mobile
npm install
npx expo start  # Runs on Expo
```

### After Auth Removal:
```bash
# Test backend endpoint
curl -X POST http://localhost:3000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello"}'

# Should return 200/201 instead of 401
```

---

## 📚 RELATED DOCUMENTATION

- **Main README:** `/Medibot-MBSE/README.md` (deleted, needs restoration)
- **Setup Guide:** `/Medibot-MBSE/SETUP_AND_DEPLOYMENT.md`
- **Backend Docs:** `/medibot-backend/docs/`
- **Web Docs:** `/medibot-web/docs/`
- **Mobile Docs:** `/medibot-mobile/docs/`
- **K8s Docs:** `/infrastructure/k8s/README.md`

---

## 🎯 NEXT ACTIONS

1. ✅ Review folder structure analysis
2. ✅ Review authentication removal plan
3. ⏳ Backup current codebase
4. ⏳ Create feature branch
5. ⏳ Implement backend changes
6. ⏳ Test backend thoroughly
7. ⏳ Implement web changes
8. ⏳ Test web thoroughly
9. ⏳ Evaluate mobile app needs
10. ⏳ Deploy to staging

---

*Document prepared by: GitHub Copilot*  
*Last updated: November 2, 2025*
