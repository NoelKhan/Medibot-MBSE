# 🏥 MediBot - Advanced AI Medical Assistant

> **Production-Ready Healthcare Platform with Comprehensive Case Follow-up System**

MediBot is a sophisticated React Native healthcare application that provides intelligent medical consultation services with advanced emergency detection, comprehensive case follow-up management, voice input capabilities, file sharing, and extensive notification systems. Built with enterprise-grade architecture and medical AI analysis.

![React Native](https://img.shields.io/badge/React_Native-0.72-61DAFB?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo)
![Medical AI](https://img.shields.io/badge/Medical_AI-Enabled-00C853?style=for-the-badge)
![CI/CD Ready](https://img.shields.io/badge/CI%2FCD-Ready-4CAF50?style=for-the-badge)

## 🌟 Key Features

### 🔄 **Case Follow-up Management System** ⭐ NEW
- **Timeline-Based Monitoring**: Automatic follow-up scheduling based on case severity and type
- **Email Integration for Guest Users**: Comprehensive email-based follow-up system for non-registered users
- **Automated Reminder System**: Smart reminder scheduling with escalation workflows
- **Overdue Case Detection**: Automated detection and escalation of missed follow-ups
- **Interactive Response Forms**: User-friendly forms for symptom updates and progress tracking
- **Statistics Dashboard**: Real-time analytics on follow-up rates and case management
- **Multi-Channel Notifications**: Push notifications, email alerts, and in-app reminders
- **Background Processing**: Automated follow-up management with FollowupTaskManager

### 🎨 **Theme System** ⭐ NEW
- **Light/Dark/Auto Modes**: Complete app theming with system preference detection
- **Medical Color Coding**: Industry-standard color palette (Red=Emergency, Orange=High, Yellow=Recommendation, Green=Self-care, Blue=Info)
- **Persistent Preferences**: AsyncStorage-based theme persistence across app sessions
- **Real-Time Switching**: Instant theme changes with smooth transitions

### 🛡️ **Input Validation & Safety** ⭐ NEW
- **Comprehensive Validation**: RFC-compliant email, phone number, and date validation
- **Auto-Formatting**: Real-time input formatting for better user experience
- **Exception Prevention**: Strict validation to prevent app crashes from invalid data
- **Medical Text Validation**: Specialized validation for medical information fields

### � **Enhanced Emergency Detection System**
- **5-Level Severity Analysis**: Immediate, Critical, High, Medium, Low priority classification
- **Color-Coded Escalation**: Visual priority system with medical industry standards
- **Real-Time Push Notifications**: Instant emergency alerts with actionable responses
- **Automatic Case Creation**: Emergency consultations automatically saved as high-priority cases
- **Smart Recommendations**: Severity-based action suggestions with confidence scoring

### � **Cross-Platform Compatibility**
- **Universal Design**: Optimized for iOS, Android, and Web platforms
- **SafeAreaView Integration**: Proper handling of device notches and safe areas
- **Keyboard Management**: Optimized keyboard handling without overlay issues
- **Responsive Layouts**: All screens adapt to different screen sizes and orientations

### 🎤 **Voice & Media Integration**
- **High-Quality Recording**: Professional voice input with duration tracking
- **File Upload Support**: Images, PDFs, documents, and medical files
- **Chat Export**: Multiple formats (Text, HTML, PDF) with email integration
- **Audio Management**: Play, pause, and cancel recording capabilities

### � **Comprehensive Notification System**
- **Push Notifications**: Emergency alerts, appointment reminders, medication schedules
- **Email Notifications**: Guest user integration with professional email templates
- **Notification Categories**: Emergency, appointments, medication, health tips, general
- **Scheduling System**: Advanced notification scheduling with retry logic

## 🏗️ Architecture Overview

### **Model-View-Controller (MVC) Pattern**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│     Models      │    │   Controllers   │    │     Views       │
│                 │    │                 │    │                 │
│ • Medical.ts    │◄───┤ • ChatScreen    │◄───┤ • Components    │
│ • User.ts       │    │ • Services      │    │ • Screens       │
│ • Types         │    │ • Utilities     │    │ • Navigation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Service Layer Architecture**

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                              Service Layer                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ CaseFollowupService ⭐ NEW │ FollowupTaskManager ⭐ NEW │ InputValidator ⭐ NEW │
│ EmergencyDetectionService  │ VoiceRecordingService      │ FileUploadService   │
│ ChatHistoryService         │ AIConsultationService      │ StorageService      │
│ PushNotificationService    │ AuthService                │ ProductionSafeguards│
└──────────────────────────────────────────────────────────────────────────────┘
```

### **Follow-up System Data Flow** ⭐ NEW

```text
┌─────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│  Medical Case   │───▶│  CaseFollowupService│───▶│ FollowupTaskMgr  │
│  (Severity 1-5) │    │                     │    │                  │
└─────────────────┘    │ • Timeline Calc     │    │ • Auto Reminders │
                       │ • Email Integration │    │ • Overdue Monitor│
┌─────────────────┐    │ • Statistics Track  │    │ • Background Proc│
│   User Response │◄───│ • Response Handler  │◄───│ • Notification   │
│   (Interactive) │    │                     │    │   Scheduling     │
└─────────────────┘    └─────────────────────┘    └──────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- **Node.js**: 18.0+ 
- **npm/yarn**: Latest version
- **Expo CLI**: `npm install -g @expo/cli`
- **Mobile Device or Emulator**: iOS 12+ / Android 8+

### Installation

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/medibot-app.git
   cd medibot-app
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start Development Server**
   ```bash
   npx expo start
   ```

5. **Run on Device**
   - **iOS**: Press `i` or scan QR with Camera app
   - **Android**: Press `a` or scan QR with Expo Go
   - **Web**: Press `w` for web development

## 📦 Project Structure

```
MediBot/
├── 📱 src/
│   ├── 🧩 components/         # Reusable UI components
│   │   ├── CrossPlatformAlert.ts
│   │   └── LoadingSpinner.tsx
│   ├── 🎯 hooks/             # Custom React hooks
│   │   └── useOrientation.ts
│   ├── 🧭 navigation/        # App navigation setup
│   │   └── AppNavigator.tsx
│   ├── 📄 screens/           # Application screens
│   │   ├── WelcomeScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   ├── EmergencyCallScreen.tsx
│   │   ├── SimpleProfileScreen.tsx
│   │   └── FollowupScreen.tsx          # ⭐ NEW: Follow-up management
│   ├── 🔧 services/          # Business logic services
│   │   ├── CaseFollowupService.ts      # ⭐ NEW: Follow-up management
│   │   ├── FollowupTaskManager.ts      # ⭐ NEW: Background processing
│   │   ├── PushNotificationService.ts  # Enhanced notification system
│   │   ├── InputValidator.ts           # ⭐ NEW: Input validation
│   │   ├── EmergencyDetectionService.ts
│   │   ├── VoiceRecordingService.ts
│   │   ├── FileUploadService.ts
│   │   ├── ChatHistoryService.ts
│   │   ├── AIConsultationService.ts
│   │   ├── StorageService.ts
│   │   └── ProductionSafeguards.ts
│   ├── 🎨 theme/             # Design system & theming
│   │   ├── ThemeContext.tsx            # ⭐ NEW: Theme provider
│   │   └── colors.ts
│   └── 📋 types/             # TypeScript definitions
│       ├── Medical.ts
│       ├── User.ts
│       └── Followup.ts                 # ⭐ NEW: Follow-up types
├── 📄 app.json              # Expo configuration
├── 📦 package.json          # Dependencies
├── 🏗️ ARCHITECTURE.md       # ⭐ NEW: System architecture
├── 🚀 CI_CD_GUIDE.md        # ⭐ NEW: CI/CD integration
└── 📖 README.md            # This file
```

## 🔧 Core Services

### CaseFollowupService ⭐ NEW

Comprehensive case follow-up management with intelligent scheduling:

**Key Features:**
- **Timeline-Based Monitoring**: Automatic calculation of follow-up schedules based on case severity
- **Email Integration**: Guest user support with professional email templates
- **Automated Reminders**: Smart reminder scheduling with escalation workflows
- **Statistics Tracking**: Real-time analytics on follow-up rates and case management

**Usage Example:**
```typescript
const followupService = CaseFollowupService.getInstance();
await followupService.initialize();

// Create follow-up for a case
const followup = await followupService.createCaseFollowup({
  id: 'case-123',
  userId: 'user-456',
  severity: 4, // High priority
  symptoms: ['headache', 'fever'],
  createdAt: new Date()
});

// Get user statistics
const stats = await followupService.getFollowupStatistics('user-456');
```

### FollowupTaskManager ⭐ NEW

Background processing service for automated follow-up management:

**Features:**
- **Automatic Processing**: 15-minute intervals for reminder processing
- **App State Management**: Proper handling of foreground/background states
- **Email Queue Management**: Batch processing for guest user notifications
- **Error Handling**: Exponential backoff for failed operations

### EmergencyDetectionService

Advanced medical emergency detection with 5-level severity classification:

```typescript
// Real-time emergency analysis
const analysis = await emergencyDetection.analyzeMessage(userInput);

if (analysis.severity === 'immediate') {
  // Direct emergency services routing
  navigation.navigate('EmergencyCall');
}
```

**Severity Levels:**
- **Immediate**: Life-threatening conditions requiring 000/911
- **Critical**: Urgent medical attention within hours
- **High**: Medical consultation within 24 hours
- **Medium**: Schedule doctor appointment
- **Low**: Self-care and monitoring

### VoiceRecordingService
Professional audio recording with real-time feedback:

```typescript
// Start high-quality recording
const success = await VoiceRecordingService.startRecording();

// Get recording with metadata
const recording = await VoiceRecordingService.stopRecording();
// Returns: { uri, duration, size }
```

### FileUploadService
Secure file handling with validation:

```typescript
// Upload with validation
const result = await FileUploadService.pickDocument();

if (result.success) {
  // File ready for use: result.file
}
```

### ChatHistoryService
Comprehensive export functionality:

```typescript
// Export to multiple formats
const fileUri = await chatHistory.exportChat(conversation, user, {
  format: 'pdf',
  includeTimestamps: true,
  includeUserInfo: true
});
```

## 🎯 Emergency Detection Keywords

### Immediate Priority (🚨 Emergency Services)
- "chest pain", "heart attack", "stroke", "unconscious"
- "severe bleeding", "suicide", "overdose", "choking"
- "severe allergic reaction", "anaphylaxis", "not breathing"

### Critical Priority (🏥 Urgent Care)
- "severe pain", "high fever", "difficulty breathing"
- "severe headache", "seizure", "severe vomiting"
- "deep cut", "broken bone", "severe burns"

### High Priority (👩‍⚕️ Doctor Soon)
- "persistent pain", "fever", "infection signs"
- "concerning symptoms", "worsening condition"
- "medication reaction", "abnormal bleeding"

## 🎨 Design System

### Color Palette
```typescript
Colors: {
  primary: {
    50: '#E3F2FD',   // Light backgrounds
    500: '#2196F3',  // Primary actions
    600: '#1976D2',  // Hover states
  },
  error: {
    50: '#FFEBEE',   // Error backgrounds
    500: '#F44336',  // Error text/icons
  },
  success: {
    500: '#4CAF50',  // Success states
  }
}
```

### Typography Scale
- **Headings**: 24px, 20px, 18px (Bold)
- **Body**: 16px, 14px (Regular/Medium)
- **Captions**: 12px (Medium)

## 📱 Platform-Specific Features

### iOS
- **Native Audio**: AVAudioSession integration
- **Haptic Feedback**: Emergency alert vibrations
- **Background Processing**: Voice recording continuation

### Android
- **Material Design**: Component theming
- **Notification Channels**: Emergency alerts
- **File System**: Scoped storage compatibility

### Web
- **Responsive Layout**: Desktop-optimized interface
- **Keyboard Shortcuts**: Accessibility improvements
- **Progressive Web App**: Offline functionality

## 🔒 Privacy & Security

### Data Protection
- **Local Storage**: Sensitive data never leaves device
- **Encryption**: Chat history encrypted at rest
- **HIPAA Considerations**: Healthcare data compliance ready

### User Privacy
- **Anonymous Mode**: Guest consultation without profile
- **Data Retention**: User-controlled conversation saving
- **Export Control**: User manages data exports

## 🧪 Testing Strategy

### Unit Tests
```bash
npm run test              # Run all tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage reports
```

### Integration Tests
- Emergency detection accuracy
- Voice recording quality
- File upload validation
- Export functionality

### E2E Testing
- Complete user journeys
- Cross-platform compatibility
- Performance benchmarks

## 📈 Performance Optimization

### Memory Management
- **Lazy Loading**: Components and screens
- **Image Optimization**: Automatic resizing
- **Cache Strategy**: Intelligent data caching

### Battery Efficiency
- **Background Limits**: Minimal background processing
- **Audio Optimization**: Efficient recording codec
- **Network Throttling**: Batch API requests

## 🚀 Deployment

### Development Build
```bash
npx expo build:ios        # iOS development
npx expo build:android    # Android development
npx expo start --web      # Web development
```

### Production Build
```bash
# iOS App Store
eas build --platform ios --profile production

# Google Play Store  
eas build --platform android --profile production

# Web Deployment
npx expo export:web
```

### Environment Configuration
```bash
# .env.production
EXPO_PUBLIC_API_URL=https://api.medibot.app
EXPO_PUBLIC_ENVIRONMENT=production
EXPO_PUBLIC_SENTRY_DSN=your-sentry-dsn
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow
1. **Fork** the repository
2. **Create** feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** branch (`git push origin feature/amazing-feature`)
5. **Open** Pull Request

### Code Standards
- **TypeScript**: Strict mode enabled
- **ESLint**: Airbnb configuration
- **Prettier**: Automatic formatting
- **Commit**: Conventional commits

## 📋 Roadmap

### v2.0.0 (Next Release)
- [ ] **Real-time Chat**: WebSocket integration
- [ ] **Telemedicine**: Video consultation
- [ ] **AI Diagnosis**: Enhanced medical AI
- [ ] **Multi-language**: Internationalization

### v2.1.0 (Future)
- [ ] **Wearable Integration**: Apple Watch/Android Wear
- [ ] **Cloud Sync**: Cross-device synchronization
- [ ] **Advanced Analytics**: Health trend analysis
- [ ] **Insurance Integration**: Claims processing

## 🆘 Support

### Getting Help
- 📧 **Email**: support@medibot.app
- 💬 **Discord**: [Join our community](https://discord.gg/medibot)
- 📖 **Documentation**: [docs.medibot.app](https://docs.medibot.app)
- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/medibot-app/issues)

### Emergency Disclaimer
⚠️ **Important**: MediBot is a healthcare information tool and should not replace professional medical advice, diagnosis, or treatment. In case of medical emergency, immediately contact your local emergency services (000, 911, etc.).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Expo Team**: Amazing React Native platform
- **React Native Community**: Open source contributions
- **Medical Professionals**: Clinical guidance and validation
- **Beta Testers**: User feedback and testing

---

<div align="center">

**Built with ❤️ for better healthcare accessibility**

[Website](https://medibot.app) • [Documentation](https://docs.medibot.app) • [Support](mailto:support@medibot.app)

</div>