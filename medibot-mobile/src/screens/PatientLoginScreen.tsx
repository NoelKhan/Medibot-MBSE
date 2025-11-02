/**
 * PATIENT LOGIN SCREEN
 * ====================
 * Clean, focused login/register screen for patients
 * Matches the design pattern of EmergencyStaffLoginScreen
 * 
 * Features:
 * - Login, Register, and Guest modes
 * - API-based auth with smart fallback to mock
 * - Test accounts for quick access
 * - Theme-aware styling
 * - Backend integration with mock fallback
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/auth';
// Removed deprecated notificationService import
import { User, UserRole, AuthStatus } from '../types/User';
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { checkBackendHealth, API_CONFIG, logApiCall, logError } from '../config/FeatureFlags';
import { useBackHandler } from '../hooks/useBackHandler';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('PatientLoginScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'PatientLogin'>;
type LoginMode = 'login' | 'register' | 'guest';

export const PatientLoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  
  // Handle hardware back button - navigate to RoleSelection
  useBackHandler('RoleSelection');

  // Track screen view
  React.useEffect(() => {
    trackScreen('PatientLoginScreen');
  }, []);

  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle Login with New Consolidated AuthService
   */
  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);

    try {
      logApiCall('/auth/login', 'POST', { email });

      // Use new consolidated authService for login
      const user = await authService.login({ email, password });

      // Register push notifications
      try {
  // Register with backend notification logic removed (service deprecated)
      } catch (notifError) {
        logger.warn('Failed to register push token', notifError);
      }

      // Track successful login
      Analytics.identifyUser(user.id, {
        email: user.email,
      });
      Analytics.track(AnalyticsEvent.LOGIN_SUCCESS, {
        method: 'consolidated_auth',
        userRole: 'patient',
      });

      Alert.alert(
        'Welcome Back!',
        `Hello ${user.name}! You're now logged in.`,
        [{ text: 'Continue', onPress: () => navigation.replace('Welcome') }]
      );

    } catch (error: any) {
      logError('Login failed', error);

      Analytics.track(AnalyticsEvent.LOGIN_FAILURE, {
        error: error.message,
        method: 'consolidated_auth',
      });

      Alert.alert(
        'Login Failed',
        error.message || 'Unable to log in. Please check your credentials and try again.',
        [
          { text: 'Try Again' },
          {
            text: 'Use Test Account',
            onPress: () => {
              setEmail('test@api.com');
              setPassword('Test123!');
            },
          },
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Registration with New Consolidated AuthService
   */
  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      logApiCall('/auth/register', 'POST', { email, name });

      // Use new consolidated authService for registration
      const user = await authService.register({
        email,
        password,
        name,
      });

      // Register push notifications
      try {
  // Register with backend notification logic removed (service deprecated)
      } catch (notifError) {
        logger.warn('Failed to register push token', notifError);
      }

      // Track successful registration
      Analytics.identifyUser(user.id, {
        email: user.email,
      });
      Analytics.track(AnalyticsEvent.LOGIN_SUCCESS, {
        method: 'registration_consolidated_auth',
        userRole: 'patient',
      });

      Alert.alert(
        'Registration Successful!',
        `Welcome to MediBot, ${user.name}!`,
        [{ text: 'Get Started', onPress: () => navigation.replace('Welcome') }]
      );

    } catch (error: any) {
      logError('Patient Registration', error);

      Analytics.track(AnalyticsEvent.LOGIN_FAILURE, {
        error: error.message,
        method: 'registration_consolidated_auth',
      });

      Alert.alert(
        'Registration Failed',
        error.message || 'Unable to create account. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle Guest Access
   */
  const handleGuestLogin = async () => {
    setLoading(true);

    try {
      const guestUser = await authService.loginAsGuest({ name: 'Guest User' });

      Alert.alert(
        'Welcome Guest User',
        'For the best experience including notifications and appointment reminders, consider creating a profile.',
        [
          {
            text: 'Continue as Guest',
            style: 'cancel',
            onPress: () => navigation.replace('Welcome'),
          },
          {
            text: 'Create Account',
            onPress: () => setMode('register'),
          },
        ]
      );
    } catch (error) {
      logError('Guest Login', error);
      Alert.alert('Error', 'Failed to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Quick Login with Test Account
   */
  const quickLogin = (userType: 'api' | 'sarah' | 'robert' | 'margaret') => {
    const testAccounts = {
      api: {
        email: 'test@medibot.com',
        password: 'Test123!',
        name: 'API Test User',
      },
      sarah: {
        email: 'sarah.johnson@example.com',
        password: 'password123',
        name: 'Sarah Johnson',
      },
      robert: {
        email: 'robert.chen@example.com',
        password: 'password123',
        name: 'Robert Chen',
      },
      margaret: {
        email: 'margaret.williams@example.com',
        password: 'password123',
        name: 'Margaret Williams',
      },
    };

    const account = testAccounts[userType];
    setEmail(account.email);
    setPassword(account.password);
    setName(account.name);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Patient Portal</Text>
            <View style={styles.placeholder} />
          </View>

          {/* Logo Section */}
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <MaterialIcons name="healing" size={60} color={colors.primary} />
            </View>
            <Text style={styles.logoTitle}>MediBot</Text>
            <Text style={styles.logoSubtitle}>Your Personal Health Assistant</Text>
          </View>

          {/* Mode Tabs */}
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
              onPress={() => setMode('login')}
            >
              <Text style={[styles.modeTabText, mode === 'login' && styles.modeTabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'register' && styles.modeTabActive]}
              onPress={() => setMode('register')}
            >
              <Text style={[styles.modeTabText, mode === 'register' && styles.modeTabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'guest' && styles.modeTabActive]}
              onPress={() => setMode('guest')}
            >
              <Text style={[styles.modeTabText, mode === 'guest' && styles.modeTabTextActive]}>
                Guest
              </Text>
            </TouchableOpacity>
          </View>

          {/* Login Form */}
          {mode === 'login' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Login</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Quick Test Account Button */}
              <TouchableOpacity
                style={styles.quickTestButton}
                onPress={() => quickLogin('api')}
              >
                <MaterialIcons name="bug-report" size={16} color="#FF9800" />
                <Text style={styles.quickTestText}>🐛 Use API Test Account</Text>
              </TouchableOpacity>

              {/* Sample Users */}
              <View style={styles.sampleUsersSection}>
                <Text style={styles.sampleUsersTitle}>📋 Sample Patients (for testing):</Text>
                
                <TouchableOpacity
                  style={[styles.sampleUserButton, { backgroundColor: '#4CAF50' + '20', borderColor: '#4CAF50' }]}
                  onPress={() => quickLogin('api')}
                >
                  <MaterialIcons name="verified" size={16} color="#4CAF50" />
                  <Text style={[styles.sampleUserText, { color: '#4CAF50', fontWeight: '600' }]}>
                    API Test Account - Full case history
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.sampleUserButton} onPress={() => quickLogin('sarah')}>
                  <Text style={styles.sampleUserText}>Sarah Johnson - Young adult with asthma</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sampleUserButton} onPress={() => quickLogin('robert')}>
                  <Text style={styles.sampleUserText}>Robert Chen - Middle-aged with diabetes</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.sampleUserButton} onPress={() => quickLogin('margaret')}>
                  <Text style={styles.sampleUserText}>Margaret Williams - Elderly with multiple conditions</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <MaterialIcons name="person" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Full Name *"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Email *"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Phone (optional)"
                  placeholderTextColor={colors.textSecondary}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Password *"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialIcons
                    name={showPassword ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password *"
                  placeholderTextColor={colors.textSecondary}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Create Account</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Guest Mode */}
          {mode === 'guest' && (
            <View style={styles.form}>
              <View style={styles.guestInfo}>
                <MaterialIcons name="info-outline" size={24} color={colors.primary} />
                <Text style={styles.guestInfoText}>
                  Continue as a guest to try MediBot without creating an account. You can always
                  create an account later to save your medical history and appointments.
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.submitButton, loading && styles.submitButtonDisabled]}
                onPress={handleGuestLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="explore" size={20} color="#FFFFFF" />
                    <Text style={styles.submitButtonText}>Continue as Guest</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    keyboardView: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      padding: 20,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    backButton: {
      padding: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    placeholder: {
      width: 40,
    },
    logoSection: {
      alignItems: 'center',
      marginBottom: 30,
    },
    logoContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.primary + '20',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    logoTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 4,
    },
    logoSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    modeSelector: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modeTab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 10,
    },
    modeTabActive: {
      backgroundColor: colors.primary,
    },
    modeTabText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    modeTabTextActive: {
      color: '#FFFFFF',
    },
    form: {
      gap: 16,
    },
    inputGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },
    input: {
      flex: 1,
      fontSize: 16,
      color: colors.text,
    },
    submitButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primary,
      paddingVertical: 16,
      borderRadius: 12,
      gap: 8,
      marginTop: 8,
    },
    submitButtonDisabled: {
      opacity: 0.6,
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    quickTestButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFF3E0',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      marginTop: 10,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: '#FF9800',
    },
    quickTestText: {
      marginLeft: 6,
      fontSize: 13,
      color: '#F57C00',
      fontWeight: '600',
    },
    sampleUsersSection: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sampleUsersTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sampleUserButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.primary + '10',
      borderRadius: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: colors.primary + '30',
      gap: 8,
    },
    sampleUserText: {
      fontSize: 13,
      color: colors.text,
      flex: 1,
    },
    testAccountsSection: {
      marginTop: 20,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    testAccountsTitle: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 12,
    },
    testAccountButton: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: colors.primary + '15',
      borderRadius: 8,
      marginBottom: 8,
    },
    testAccountText: {
      fontSize: 13,
      color: colors.primary,
      fontWeight: '500',
    },
    guestInfo: {
      flexDirection: 'row',
      gap: 12,
      padding: 16,
      backgroundColor: colors.primary + '10',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.primary + '30',
    },
    guestInfoText: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
  });

const PatientLoginScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <PatientLoginScreen {...props} />
  </ErrorBoundary>
);

export default PatientLoginScreenWithErrorBoundary;
