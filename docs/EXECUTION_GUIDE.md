# MediBot MBSE - Execution Guide

## Three Independent Executable Projects

This guide demonstrates how to build and execute each project independently as standalone applications.

---

## 🎯 Project Execution Matrix

| Project | Build Output | Execution Method | Port | Status |
|---------|--------------|------------------|------|--------|
| **Backend** | `dist/` + Docker Image | Node.js or Docker | 3001 | ✅ Ready |
| **Web** | `dist/` + Docker Image | Static Server or Docker | 3000 | ✅ Ready |
| **Mobile** | APK/IPA | Expo Go or Native | 8081 | ✅ Ready |

---

## 1️⃣ Backend Execution

### Method A: Node.js Direct Execution
```bash
# Navigate to backend
cd medibot-backend

# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build
# Output: dist/ folder with compiled JS

# Run production server
npm run start:prod
# Server running at http://localhost:3001

# Test the API
curl http://localhost:3001/api/health
```

### Method B: Docker Execution
```bash
# Pull the Docker image from GitHub Container Registry
docker pull ghcr.io/noelkhan/medibot-backend:main

# Run the container
docker run -d \
  --name medibot-backend \
  -p 3001:3001 \
  -e DATABASE_HOST=postgres \
  -e DATABASE_PORT=5432 \
  -e DATABASE_USER=postgres \
  -e DATABASE_PASSWORD=yourpassword \
  -e DATABASE_NAME=medibot \
  -e JWT_SECRET=your-secret-key \
  -e AI_AGENT_URL=http://localhost:8000 \
  ghcr.io/noelkhan/medibot-backend:main

# Check logs
docker logs medibot-backend

# Test the API
curl http://localhost:3001/api/health
```

### Method C: Build Docker Image Locally
```bash
# From repository root
docker build -f infrastructure/docker/backend/Dockerfile -t medibot-backend .

# Run the container
docker run -d \
  --name medibot-backend \
  -p 3001:3001 \
  --env-file medibot-backend/.env \
  medibot-backend

# Access at http://localhost:3001
```

### Required Environment Variables
```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=your-secure-password
DATABASE_NAME=medibot

# Authentication
JWT_SECRET=your-jwt-secret-key-min-32-chars
JWT_EXPIRATION=24h

# AI Agent Integration
AI_AGENT_URL=http://localhost:8000

# Server Configuration
PORT=3001
NODE_ENV=production
```

### API Endpoints
- **Health Check**: `GET /api/health`
- **Authentication**: `POST /api/auth/login`
- **Patients**: `GET /api/patients`
- **Doctors**: `GET /api/doctors`
- **Consultations**: `GET /api/consultations`

---

## 2️⃣ Web Frontend Execution

### Method A: Static File Server (npm)
```bash
# Navigate to web
cd medibot-web

# Install dependencies
npm install

# Build production bundle
npm run build
# Output: dist/ folder with optimized HTML, CSS, JS

# Preview production build
npm run preview
# Server running at http://localhost:4173

# Or serve with any static file server
npx serve dist -p 3000
# Server running at http://localhost:3000
```

### Method B: Docker Execution
```bash
# Pull the Docker image
docker pull ghcr.io/noelkhan/medibot-web:main

# Run the container
docker run -d \
  --name medibot-web \
  -p 3000:80 \
  ghcr.io/noelkhan/medibot-web:main

# Access at http://localhost:3000
```

### Method C: Build Docker Image Locally
```bash
# From repository root
docker build \
  -f infrastructure/docker/web/Dockerfile \
  --build-arg VITE_API_URL=http://localhost:3001/api \
  -t medibot-web .

# Run the container
docker run -d \
  --name medibot-web \
  -p 3000:80 \
  medibot-web

# Access at http://localhost:3000
```

### Method D: Development Server
```bash
cd medibot-web
npm install
npm run dev
# Dev server at http://localhost:5173 with HMR
```

### Build Configuration
```bash
# .env.production
VITE_API_URL=http://localhost:3001/api
VITE_AI_AGENT_URL=http://localhost:8000
```

### Build Output
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js    # Main application bundle
│   ├── index-[hash].css   # Styles
│   └── [asset files]      # Images, fonts, etc.
└── favicon.ico
```

---

## 3️⃣ Mobile App Execution

### Prerequisites
**Important**: This project requires React 19.x for compatibility with Expo SDK 54:
```bash
# If needed, update React version
npm install react@19.1.0 react-dom@19.1.0 --save-exact
```

### Method A: Expo Go (Development)
```bash
# Navigate to mobile
cd medibot-mobile

# Install dependencies
npm install

# Verify React version (should be 19.1.0)
npm list react

# Start Expo development server
npm start

# Options:
# - Scan QR code with Expo Go app (iOS/Android)
# - Press 'a' for Android emulator
# - Press 'i' for iOS simulator
# - Press 'w' for web version
```

### Method B: Development Build (EAS)
```bash
# Build development APK
npx eas-cli build --platform android --profile development

# Download and install APK on device
# Or use:
npx eas-cli build:run --platform android --latest
```

### Method C: Preview Build (Testing)
```bash
# Build preview version (staging)
npx eas-cli build --platform all --profile preview

# Outputs:
# - Android: APK file
# - iOS: IPA file (requires Apple Developer account)
```

### Method D: Production Build
```bash
# Build for app stores
npx eas-cli build --platform all --profile production

# Submit to stores
npx eas-cli submit --platform android
npx eas-cli submit --platform ios
```

### Method E: Run Native Builds
```bash
# Android
npm run android
# Requires Android Studio and emulator

# iOS (macOS only)
npm run ios
# Requires Xcode and iOS simulator
```

### Configuration Files
```javascript
// app.json - Expo configuration
{
  "expo": {
    "name": "MediBot",
    "slug": "medibot-mobile",
    "version": "1.0.0",
    "ios": { "bundleIdentifier": "com.medibot.app" },
    "android": { "package": "com.medibot.app" }
  }
}

// eas.json - Build profiles
{
  "build": {
    "development": { "developmentClient": true },
    "preview": { "distribution": "internal" },
    "production": {}
  }
}
```

---

## 🔗 Interconnected Execution

### Scenario 1: Full Stack Local Development
```bash
# Terminal 1 - Backend
cd medibot-backend
npm install && npm run start:dev

# Terminal 2 - Web
cd medibot-web
npm install && npm run dev

# Terminal 3 - Mobile
cd medibot-mobile
npm install && npm start

# Terminal 4 - AI Agent (optional)
cd medibot-backend/python/aiagent
pip install -r requirements.txt && python main.py
```

### Scenario 2: Docker Compose (All Services)
```bash
cd infrastructure/docker
docker-compose up -d

# Services available:
# - Backend: http://localhost:3001
# - Web: http://localhost:3000
# - AI Agent: http://localhost:8000
# - PostgreSQL: localhost:5432
# - Ollama: localhost:11434
```

### Scenario 3: Hybrid (Docker Backend + Local Frontend)
```bash
# Start backend in Docker
docker-compose up backend postgres

# Run web locally with hot reload
cd medibot-web
npm run dev

# Run mobile locally
cd medibot-mobile
npm start
```

### Scenario 4: Production Deployment
```bash
# Backend deployed to cloud (AWS, GCP, Azure)
# API: https://api.medibot.com

# Web deployed to Vercel/Netlify
# URL: https://medibot.com

# Mobile via App Stores or OTA
# Android: Google Play
# iOS: App Store
```

---

## 📊 Build Artifacts from CI/CD

### Backend Artifacts
```
backend-dist/
├── main.js              # Entry point
├── health.controller.js # Health check endpoint
├── modules/            # Business logic modules
├── config/             # Configuration files
└── database/           # Database entities & migrations
```

**Download from GitHub Actions**:
```bash
gh run download <run-id> -n backend-dist
```

### Web Artifacts
```
web-dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── [images/fonts]
└── favicon.ico
```

**Download from GitHub Actions**:
```bash
gh run download <run-id> -n web-dist
```

### Mobile Artifacts
- **Development Build**: `.apk` file for Android testing
- **Preview Build**: `.apk` + `.ipa` for staging
- **Production Build**: App Store Connect / Google Play Console

---

## ✅ Verification Steps

### Backend Verification
```bash
# Health check
curl http://localhost:3001/api/health

# Expected response:
{
  "status": "ok",
  "database": "connected",
  "uptime": 12345
}
```

### Web Verification
```bash
# Open in browser
open http://localhost:3000

# Check console for API connection
# Login with test credentials
# Navigate through UI
```

### Mobile Verification
```bash
# Start app in Expo Go
# Check API connection indicator
# Test login flow
# Verify all screens load
```

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All three workflows passing ✅
- [ ] Backend Docker image built ✅
- [ ] Web Docker image built ✅
- [ ] Mobile APK/IPA generated ✅
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates configured

### Backend Deployment
- [ ] Deploy Docker image to cloud
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Set up health check endpoints
- [ ] Configure load balancer

### Web Deployment
- [ ] Deploy Docker image or static files
- [ ] Configure CDN (CloudFront/CloudFlare)
- [ ] Set up custom domain
- [ ] Enable HTTPS
- [ ] Configure API endpoints

### Mobile Deployment
- [ ] Submit to App Store (iOS)
- [ ] Submit to Google Play (Android)
- [ ] Configure OTA updates
- [ ] Set up analytics
- [ ] Test on multiple devices

---

## � Troubleshooting

### Mobile App Issues

#### React Version Mismatch
If you encounter errors related to React hooks or compatibility:
```bash
cd medibot-mobile

# Check current React version
npm list react

# Install the correct version (React 19.1.0 for Expo SDK 54)
npm install react@19.1.0 react-dom@19.1.0 --save-exact

# Clear cache and restart
npx expo start --clear
```

#### Metro Bundler Issues
```bash
# Clear all caches
rm -rf node_modules
npm install
npx expo start --clear

# If still having issues, reset Metro
watchman watch-del-all
rm -rf $TMPDIR/metro-*
```

#### Backend Connection Issues
The mobile app auto-detects the backend URL, but if you have issues:
```bash
# Check the auto-detected URL in logs
# Look for: "Auto-detected backend URL"

# For physical devices, ensure:
# 1. Phone and computer are on same WiFi
# 2. Firewall allows port 3001
# 3. Backend is running: curl http://localhost:3001/api/health

# Manual override (if needed):
export EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:3001
npm start
```

---

## �📝 Summary

| Capability | Backend | Web | Mobile |
|------------|---------|-----|--------|
| **Standalone Build** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Docker Image** | ✅ Yes | ✅ Yes | ❌ No |
| **Native Package** | ❌ No | ❌ No | ✅ Yes |
| **CI/CD Artifact** | ✅ dist/ | ✅ dist/ | ✅ APK/IPA |
| **Independent Deploy** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Interconnected** | ✅ API | ✅ Client | ✅ Client |

**All three projects are fully independent and can be built, tested, and deployed separately while working together as an interconnected system.** 🎯
