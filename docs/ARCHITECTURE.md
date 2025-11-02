# MediBot MBSE - Architecture Overview

## Three Independent Projects with Interconnected Workflows

This monorepo contains three independently deployable projects that work together to form the complete MediBot healthcare platform.

## 🏗️ Project Structure

### 1. Backend (NestJS API) - `medibot-backend/`
**Technology**: NestJS, TypeORM, PostgreSQL, JWT Authentication  
**Port**: 3001  
**Workflow**: `.github/workflows/backend-cicd.yml`

#### Responsibilities:
- RESTful API endpoints for medical records, consultations, schedules
- User authentication & authorization (doctors, patients, admin, staff)
- Database management with TypeORM migrations
- Integration with AI Agent for intelligent responses
- Medical data validation and business logic

#### Artifacts Produced:
- **Build Artifact**: `dist/` folder (compiled TypeScript → JavaScript)
- **Docker Image**: `ghcr.io/noelkhan/medibot-backend:main`
- **Coverage Reports**: Test coverage data

#### Environment Variables:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=<secret>
DATABASE_NAME=medibot
JWT_SECRET=<secret>
AI_AGENT_URL=http://localhost:8000
```

#### Standalone Execution:
```bash
cd medibot-backend
npm install
npm run build
npm run start:prod
```

---

### 2. Web Frontend (React + Vite) - `medibot-web/`
**Technology**: React 18, Vite, Material-UI, TypeScript  
**Port**: 3000  
**Workflow**: `.github/workflows/web-cicd.yml`

#### Responsibilities:
- User interface for doctors, patients, administrators
- Dashboard for medical records, appointments, analytics
- Real-time AI chat integration
- Responsive design for desktop and tablet
- Role-based access control UI

#### Artifacts Produced:
- **Build Artifact**: `dist/` folder (optimized static files)
- **Docker Image**: `ghcr.io/noelkhan/medibot-web:main`
- **Static Assets**: HTML, CSS, JS bundles

#### Environment Variables:
```env
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

#### Standalone Execution:
```bash
cd medibot-web
npm install
npm run build
npm run preview  # Serve production build
# OR for development:
npm run dev
```

---

### 3. Mobile App (React Native + Expo) - `medibot-mobile/`
**Technology**: React Native, Expo SDK 52, TypeScript  
**Port**: 8081 (Metro bundler)  
**Workflow**: `.github/workflows/mobile-cicd.yml`

#### Responsibilities:
- Native mobile app for iOS and Android
- Patient-focused features (appointments, records)
- Push notifications for appointment reminders
- Camera integration for document scanning
- Offline support for critical features

#### Artifacts Produced:
- **Development Build**: APK/IPA for testing via Expo
- **Preview Build**: Staging builds via EAS Build
- **Production Build**: App Store / Play Store releases
- **OTA Updates**: Over-the-air updates via Expo Updates

#### Environment Variables:
```env
API_URL=http://localhost:3001/api
AI_AGENT_URL=http://localhost:8000
```

#### Standalone Execution:
```bash
cd medibot-mobile
npm install
npm start  # Start Expo Metro bundler
# Then scan QR code with Expo Go app
# OR:
npm run android  # Run on Android emulator
npm run ios      # Run on iOS simulator
```

---

## 🔄 Inter-Project Communication

### Backend ↔ AI Agent
- **Protocol**: HTTP REST API
- **Backend calls**: `POST /predict`, `GET /health`
- **Use case**: Backend forwards patient queries to AI for intelligent responses

### Web Frontend → Backend
- **Protocol**: HTTP REST API with JWT authentication
- **Endpoints**: `/api/auth`, `/api/patients`, `/api/doctors`, `/api/consultations`
- **Use case**: All user actions (login, view records, book appointments)

### Mobile App → Backend
- **Protocol**: HTTP REST API with JWT authentication
- **Endpoints**: Same as web, optimized responses for mobile
- **Use case**: Patient-focused mobile features

### Direct AI Chat (Web/Mobile → AI Agent)
- **Protocol**: WebSocket or HTTP streaming
- **Endpoint**: `/chat`, `/stream`
- **Use case**: Real-time chat with AI assistant

---

## 📦 CI/CD Workflow Independence

### Backend Workflow Triggers:
```yaml
on:
  push:
    branches: [main, develop]
    paths:
      - 'medibot-backend/**'
      - '.github/workflows/backend-cicd.yml'
```
**Result**: Only triggers when backend code changes

### Web Workflow Triggers:
```yaml
on:
  push:
    branches: [main, develop, staging]
    paths:
      - 'medibot-web/**'
      - '.github/workflows/web-cicd.yml'
```
**Result**: Only triggers when web code changes

### Mobile Workflow Triggers:
```yaml
on:
  push:
    branches: [main, develop, staging]
    paths:
      - 'medibot-mobile/**'
      - '.github/workflows/mobile-cicd.yml'
```
**Result**: Only triggers when mobile code changes

---

## 🚀 Deployment Scenarios

### Scenario 1: Backend-Only Update
1. Modify code in `medibot-backend/`
2. Commit & push to `develop` or `main`
3. **Only backend workflow runs**
4. Backend Docker image built and pushed
5. Deploy new backend version
6. Web and mobile continue using new API (backward compatible)

### Scenario 2: Frontend-Only Update
1. Modify code in `medibot-web/`
2. Commit & push
3. **Only web workflow runs**
4. Web Docker image built and pushed
5. Deploy new frontend
6. Backend remains unchanged

### Scenario 3: Mobile-Only Update
1. Modify code in `medibot-mobile/`
2. Commit & push
3. **Only mobile workflow runs**
4. EAS Build creates APK/IPA
5. Push OTA update or submit to app stores
6. Backend and web remain unchanged

### Scenario 4: Full Stack Update
1. Use complete-stack workflow OR
2. Modify all three projects simultaneously
3. Each project workflow runs independently
4. Deploy all three components

---

## 🏃 Running All Three Projects Locally

### Option 1: Docker Compose (Recommended)
```bash
cd infrastructure/docker
docker-compose up
```
**Services Started**:
- Backend: http://localhost:3001
- Web: http://localhost:3000
- AI Agent: http://localhost:8000
- PostgreSQL: localhost:5432

### Option 2: Manual Start (Development)
```bash
# Terminal 1 - Backend
cd medibot-backend
npm install
npm run start:dev

# Terminal 2 - Web
cd medibot-web
npm install
npm run dev

# Terminal 3 - Mobile
cd medibot-mobile
npm install
npm start

# Terminal 4 - AI Agent (Python)
cd medibot-backend/python/aiagent
pip install -r requirements.txt
python main.py
```

---

## 📊 Project Status Dashboard

### Backend
- ✅ Standalone workflow: `backend-cicd.yml`
- ✅ Docker image: `ghcr.io/noelkhan/medibot-backend`
- ✅ Build artifacts: `dist/` uploaded to GitHub Actions
- ✅ Independent deployment capability

### Web Frontend
- ✅ Standalone workflow: `web-cicd.yml`
- ✅ Docker image: `ghcr.io/noelkhan/medibot-web`
- ✅ Build artifacts: `dist/` uploaded to GitHub Actions
- ✅ Independent deployment capability
- ✅ Vercel integration (optional)

### Mobile App
- ✅ Standalone workflow: `mobile-cicd.yml`
- ✅ EAS Build integration
- ✅ Development/Preview/Production profiles
- ✅ Independent deployment capability
- ⚠️ Requires EXPO_TOKEN secret for builds

---

## 🔧 Configuration Management

### Shared Configuration
- API URLs configured via environment variables
- Each project can be deployed to different environments
- Secrets managed via GitHub Actions secrets

### Environment-Specific Configs
```
Development:
  Backend: http://localhost:3001
  Web: http://localhost:3000
  Mobile: http://localhost:3001

Staging:
  Backend: https://staging-api.medibot.com
  Web: https://staging.medibot.com
  Mobile: https://staging-api.medibot.com

Production:
  Backend: https://api.medibot.com
  Web: https://medibot.com
  Mobile: https://api.medibot.com
```

---

## 🎯 Key Principles

1. **Independence**: Each project can be built, tested, and deployed separately
2. **Interconnection**: Projects communicate via well-defined APIs
3. **Modularity**: Changes to one project don't require rebuilding others
4. **Scalability**: Each component can be scaled independently
5. **CI/CD Isolation**: Workflows only trigger when relevant code changes

---

## 📝 Next Steps

1. ✅ Backend workflow produces Docker image + build artifacts
2. ✅ Web workflow produces Docker image + static files
3. ✅ Mobile workflow integrated with Expo EAS
4. ⏭️ Add EXPO_TOKEN secret for mobile builds
5. ⏭️ Configure deployment targets (K8s, Vercel, EAS)
6. ⏭️ Set up environment-specific configurations
