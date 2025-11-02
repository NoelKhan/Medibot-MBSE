import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, UserRole } from '../types/User';
import { MIGRATION_CONFIG } from '../config/FeatureFlags';
import AuthService from '../services/AuthService';
import { createLogger } from '../services/Logger';
import { useTheme } from '../contexts/ThemeContext';

const logger = createLogger('AppNavigator');

/**
 * MVC ARCHITECTURE - PRESENTATION LAYER IMPORTS
 * These screens represent the View layer in MVC pattern
 * Each screen handles UI presentation and user interaction
 */
// Import screens
import PatientWelcomeScreen from '../screens/PatientWelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import PatientLoginScreen from '../screens/PatientLoginScreen';
import ChatScreen from '../screens/ChatScreen';
import DoctorServicesScreen from '../screens/DoctorServicesScreen';
import LoginScreen from '../screens/LoginScreen';
import ConversationHistoryScreen from '../screens/ConversationHistoryScreen';
import MedicalStaffLoginScreen from '../screens/MedicalStaffLoginScreen';
import EmergencyStaffLoginScreen from '../screens/EmergencyStaffLoginScreen';
import MedicalStaffWelcomeScreen from '../screens/MedicalStaffWelcomeScreen';
import EmergencyStaffWelcomeScreen from '../screens/EmergencyStaffWelcomeScreen';
import StaffDashboardScreen from '../screens/StaffDashboardScreen';
import EmergencyCallScreen from '../screens/EmergencyCallScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import CaseManagementScreen from '../screens/CaseManagementScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import RemindersScreen from '../screens/RemindersScreen';
import CaseDetailScreen from '../screens/CaseDetailScreen';
import MedicalCasesScreen from '../screens/MedicalCasesScreen';
import NotificationPreferencesScreen from '../screens/NotificationPreferencesScreen';
import { ApiTestScreen } from '../screens/ApiTestScreen';
import MedicalStaffTriageScreen from '../screens/MedicalStaffTriageScreen';
import StaffProfileScreen from '../screens/StaffProfileScreen';
import ReminderListScreen from '../screens/ReminderListScreen';
import PatientConsultationScreen from '../screens/PatientConsultationScreen';
import PatientRecordsScreen from '../screens/PatientRecordsScreen';
import StaffScheduleScreen from '../screens/StaffScheduleScreen';
import StaffAnalyticsScreen from '../screens/StaffAnalyticsScreen';
import AIChatScreen from '../screens/AIChatScreen';

/**
 * MVC ARCHITECTURE - NAVIGATION LAYER (PRESENTATION/VIEW)
 * This file defines the navigation structure and routing for the application.
 * In MVC pattern, this acts as the View Controller managing screen transitions.
 * 
 * SCALABILITY NOTES:
 * - Navigation params are strongly typed for type safety
 * - Each screen route is explicitly defined for maintainability
 * - Ready for backend integration with user session management
 * - Smart routing based on user role and preferences
 * - Supports both Option A (Smart) and Option B (Strict) migration strategies
 */
export type RootStackParamList = {
  RoleSelection: undefined;
  PatientLogin: undefined;
  MedicalStaffLogin: undefined;
  EmergencyStaffLogin: undefined;
  MedicalStaffWelcome: undefined;
  EmergencyStaffWelcome: undefined;
  PatientWelcome: undefined;
  Welcome: undefined;
  MedicalStaffTriage: { staff: User };
  Chat: { user: User; conversationId?: string; caseId?: string; caseContext?: any };
  AIChat: undefined;
  DoctorServices: { user?: User; initialTab?: 'immediate' | 'scheduled' };
  Login: { userType?: 'patient' | 'doctor' | 'staff' };
  Profile: { user: any; isNewUser?: boolean; focus?: 'contact' | string };
  ConversationHistory: { user: User };
  StaffLogin: undefined;
  StaffDashboard: { staff?: User };
  EmergencyCall: { user?: User; emergencyType?: string };
  CaseDetail: { case: any; user?: any; isStaff?: boolean };
  NotificationSettings: { user?: User };
  NotificationPreferences: { userId?: string };
  Reminders: { userId?: string };
  ReminderList: undefined;
  MedicalCases: { userId: string };
  ApiTest: undefined;
  StaffProfile: { staff?: User };
  PatientConsultation: { caseId: string; patientId: string };
  PatientRecords: undefined;
  StaffSchedule: undefined;
  StaffAnalytics: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Determine initial route based on user state and preferences
 * Implements Option A (Smart Routing) and Option B (Strict Mode)
 */
const getInitialRouteName = async (): Promise<keyof RootStackParamList> => {
  try {
    const authService = AuthService.getInstance();
    
    // OPTION B: Strict Mode - Always show role selection
    if (MIGRATION_CONFIG.FORCE_ROLE_SELECTION) {
      logger.info('Migration Mode: Option B (Strict) - Showing role selection');
      return 'RoleSelection';
    }
    
    // OPTION A: Smart Routing
    logger.info('Migration Mode: Option A (Smart) - Auto-routing based on user state');
    
    // Check if user is authenticated
    const currentUser = authService.getCurrentUser();
    
    if (currentUser && MIGRATION_CONFIG.AUTO_ROUTE_BY_ROLE) {
      // User is authenticated - route based on role
      const isStaff = [
        UserRole.DOCTOR,
        UserRole.NURSE,
        UserRole.EMT,
        UserRole.PHARMACIST,
        UserRole.ADMIN,
      ].includes(currentUser.role);
      
      const rolePreference = isStaff ? 'staff' : 'patient';
      
      // Save preference for future sessions
      await AsyncStorage.setItem('userRolePreference', rolePreference);
      
      logger.info('Authenticated user detected', { role: currentUser.role, preference: rolePreference });
      
      // Route to appropriate portal
      return isStaff ? 'StaffDashboard' : 'Welcome';
    }
    
    // Check for saved role preference (for non-authenticated users)
    const savedPreference = await AsyncStorage.getItem('userRolePreference');
    
    if (savedPreference && MIGRATION_CONFIG.REMEMBER_ROLE_PREFERENCE) {
      logger.info('Saved preference found', { preference: savedPreference });
      return savedPreference === 'staff' ? 'MedicalStaffLogin' : 'Welcome';
    }
    
    // New user - show role selection
    logger.info('New user - Showing role selection');
    return 'RoleSelection';
    
  } catch (error) {
    logger.error('Error determining initial route', error);
    // Fallback to role selection on error
    return 'RoleSelection';
  }
};

const AppNavigator: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList>('Welcome');
  const [isReady, setIsReady] = useState(false);
  const { colors, isDark } = useTheme();
  
  // Create custom navigation theme based on current theme
  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.notification,
    },
  };
  
  useEffect(() => {
    const initializeNavigation = async () => {
      const route = await getInitialRouteName();
      setInitialRoute(route);
      setIsReady(true);
    };
    
    initializeNavigation();
  }, []);
  
  if (!isReady) {
    // You could show a splash screen here
    return null;
  }
  
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* New Role-Based Screens */}
        <Stack.Screen 
          name="RoleSelection" 
          component={RoleSelectionScreen}
          options={{ headerShown: false }}
        />
        
        {/* Patient Auth */}
        <Stack.Screen 
          name="PatientLogin" 
          component={PatientLoginScreen}
          options={{ headerShown: false }}
        />
        
        {/* Medical Staff Auth - Professional Portal */}
        <Stack.Screen 
          name="MedicalStaffLogin" 
          component={MedicalStaffLoginScreen}
          options={{ headerShown: false }}
        />
        
        {/* Emergency Staff Auth - Emergency Operations */}
        <Stack.Screen 
          name="EmergencyStaffLogin" 
          component={EmergencyStaffLoginScreen}
          options={{ headerShown: false }}
        />
        
        {/* Medical Staff Welcome - Professional Landing */}
        <Stack.Screen 
          name="MedicalStaffWelcome" 
          component={MedicalStaffWelcomeScreen}
          options={{ headerShown: false }}
        />
        
        {/* Emergency Staff Welcome - Operations Landing */}
        <Stack.Screen 
          name="EmergencyStaffWelcome" 
          component={EmergencyStaffWelcomeScreen}
          options={{ headerShown: false }}
        />
        
        {/* Medical Staff Triage - Emergency Queue */}
        <Stack.Screen 
          name="MedicalStaffTriage" 
          component={MedicalStaffTriageScreen}
          options={{ headerShown: false }}
        />
        
                {/* Main Screens */}
        <Stack.Screen 
          name="Welcome" 
          component={PatientWelcomeScreen}
          options={{ headerShown: false }}
        />
        
        {/* Patient Welcome - Same as Welcome for now */}
        <Stack.Screen 
          // @ts-ignore TypeScript incorrectly infers PatientWelcome type 
          name="PatientWelcome"
          component={PatientWelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="AIChat" 
          component={AIChatScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DoctorServices" 
          component={DoctorServicesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffLogin" 
          component={EmergencyStaffLoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffDashboard" 
          component={StaffDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Profile" 
          component={UserProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ConversationHistory" 
          component={ConversationHistoryScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="EmergencyCall" 
          component={EmergencyCallScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CaseDetail" 
          component={CaseDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NotificationSettings" 
          component={NotificationSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="NotificationPreferences" 
          component={NotificationPreferencesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Reminders" 
          component={RemindersScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ReminderList" 
          component={ReminderListScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MedicalCases" 
          component={MedicalCasesScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ApiTest" 
          component={ApiTestScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffProfile" 
          component={StaffProfileScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PatientConsultation" 
          component={PatientConsultationScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="PatientRecords" 
          component={PatientRecordsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffSchedule" 
          component={StaffScheduleScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="StaffAnalytics" 
          component={StaffAnalyticsScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;