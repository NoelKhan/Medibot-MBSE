import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { AlertProvider } from './src/components/CrossPlatformAlert';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { BackendStatusProvider } from './src/contexts/BackendStatusContext';
import FollowupTaskManager from './src/services/FollowupTaskManager';
import AuthPersistenceService from './src/services/AuthPersistenceService';
import { authService } from './src/services/auth';
import { enhancedNotificationService } from './src/services/EnhancedNotificationService';
import MedicalCaseService from './src/services/MedicalCaseService';
import ErrorBoundary from './src/components/ErrorBoundary';

// StatusBar wrapper to handle theme changes
const ThemedStatusBar = () => {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
};

// Main App Component with initialization
const AppContent = () => {
  const [isReady, setIsReady] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // Initialize follow-up task manager
        try {
          const taskManager = FollowupTaskManager.getInstance();
          taskManager.startProcessing();
          console.log('✅ Task manager initialized');
        } catch (error) {
          console.error('⚠️ Task manager initialization failed:', error);
        }

        // Initialize enhanced notification service with backend integration
        try {
          await enhancedNotificationService.initialize();
          console.log('✅ Notification service initialized');
        } catch (error) {
          console.error('⚠️ Notification service initialization failed:', error);
        }

        // Initialize medical case service
        try {
          const caseService = MedicalCaseService.getInstance();
          await caseService.initialize();
          console.log('✅ Medical case service initialized');
        } catch (error) {
          console.error('⚠️ Medical case service initialization failed:', error);
        }

        // Check for saved auth session
        try {
          const authPersistence = AuthPersistenceService.getInstance();
          const authState = await authPersistence.loadAuthState();
          
          // Also restore session for new consolidated AuthService
          const newAuthState = await authService.loadAuthState();
          
          if (authState) {
            console.log('✅ Restored auth session (legacy) for:', authState.user.email);
          }
          if (newAuthState) {
            console.log('✅ Restored auth session (new) for:', newAuthState.user.name || newAuthState.user.id);
          }
          if (!authState && !newAuthState) {
            console.log('ℹ️ No saved auth session found');
          }
        } catch (error) {
          console.error('⚠️ Auth session restore failed:', error);
        }

        console.log('✅ App initialization complete');
        setIsReady(true);
      } catch (error) {
        console.error('❌ App initialization error:', error);
        setIsReady(true); // Continue even if initialization fails
      }
    };

    initializeApp();

    return () => {
      const taskManager = FollowupTaskManager.getInstance();
      taskManager.cleanup();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return <AppNavigator />;
};

export default function App() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('🚨 Global Error Caught:', error);
        console.error('📍 Error Info:', errorInfo);
      }}
    >
      <SafeAreaProvider>
        <ThemeProvider>
          <BackendStatusProvider>
            <AlertProvider>
              <ThemedStatusBar />
              <AppContent />
            </AlertProvider>
          </BackendStatusProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
