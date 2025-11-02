/**
 * UNIFIED LOGIN SCREEN
 * ====================
 * Single login screen with tabs for Patient and Staff authentication
 * 
 * Features:
 * - Patient Tab: API-based auth (with fallback to local), guest login, sample users with cases
 * - Staff Tab: Local auth for medical professionals
 * - Test account button for development
 * - Theme-aware styling (dark mode support)
 * - Login, Register, and Guest modes
 * 
 * Note: Emergency staff login (operators/nurses) remains separate in StaffLoginScreen
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
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/auth';
// Removed deprecated notificationService import
import { User, UserRole, AuthStatus } from '../types/User';
import { PatientUser } from '../types/Booking';
import { useTheme } from '../contexts/ThemeContext';
import { useBackHandler } from '../hooks/useBackHandler';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('LoginScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;
type LoginMode = 'login' | 'register' | 'guest';
type UserTab = 'patient' | 'staff';

const LoginScreen: React.FC<Props> = ({ navigation, route }) => {
  const { theme, colors } = useTheme();
  const styles = createStyles(colors);
  
  // Handle hardware back button - navigate to RoleSelection
  useBackHandler('RoleSelection');
  
  // Determine initial tab from route params
  const initialTab: UserTab = (() => {
    const paramType = route?.params?.userType;
    return (paramType === 'doctor' || paramType === 'staff') ? 'staff' : 'patient';
  })();
  
  const [activeTab, setActiveTab] = useState<UserTab>(initialTab);
  const [mode, setMode] = useState<LoginMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer-not-to-say'>('prefer-not-to-say');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    trackScreen('LoginScreen', {
      activeTab,
      mode,
      initialTab
    });
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    
    try {
      // For patient tab: Use new consolidated auth service
      if (activeTab === 'patient') {
        const user = await authService.login({
          email: email.trim(),
          password: password.trim(),
        });
        
        // Register push token
        try {
          const tokens = await authService.loadAuthState();
          if (tokens?.accessToken) {
            // Register with backend notification logic removed (service deprecated)
          }
        } catch (notifError) {
          logger.warn('Failed to register push token', notifError);
        }
        
        Alert.alert(
          'Welcome Back!',
          `Hello ${user.name}! You're now logged in.`,
          [{ text: 'Continue', onPress: () => navigation.navigate('Welcome') }]
        );
        return;
      } else {
        // For staff tab: Authenticate medical staff (doctor/nurse)
        // Medical staff accounts: test@medical.com, supervisor@health.vic.gov.au, nurse@health.vic.gov.au
        const staffCredentials = {
          'test@medical.com': { password: 'Test123!', role: 'doctor', name: 'Dr. API Test', staffId: 'API-001' },
          'supervisor@health.vic.gov.au': { password: 'staff2024', role: 'doctor', name: 'Dr. Michael Chen', staffId: 'SUP001' },
          'nurse@health.vic.gov.au': { password: 'staff2024', role: 'nurse', name: 'Emma Thompson', staffId: 'NUR001' }
        };

        const trimmedEmail = email.trim().toLowerCase();
        const creds = staffCredentials[trimmedEmail as keyof typeof staffCredentials];
        
        if (!creds || password.trim() !== creds.password) {
          Alert.alert(
            'Login Failed',
            'Invalid credentials. Please check your email and password.\n\nTip: Try test@medical.com / Test123!',
            [{ text: 'OK' }]
          );
          return;
        }

        // Create User object for medical staff
        const staffUser: User = {
          id: creds.staffId,
          name: creds.name,
          email: trimmedEmail,
          role: creds.role === 'doctor' ? UserRole.DOCTOR : UserRole.NURSE,
          authStatus: AuthStatus.AUTHENTICATED,
          profile: {
            specialty: creds.role === 'doctor' ? 'Emergency Medicine' : 'Triage',
            hospitalAffiliation: 'Victoria Health Services',
            licenseNumber: creds.staffId
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };

        Alert.alert(
          'Welcome!',
          `Hello ${staffUser.name}!\n\nRole: ${creds.role}\nAccess: Medical Dashboard`,
          [{ 
            text: 'Continue', 
            onPress: () => navigation.navigate('StaffDashboard', { staff: staffUser }) 
          }]
        );
        return;
      }
    } catch (error) {
      logger.error('Login failed', error);
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials. Please check your email and password.',
        [
          { text: 'Try Again' },
          { 
            text: 'Use Guest',
            onPress: () => setMode('guest')
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

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
      const user = await authService.register({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        phone: phone.trim() || undefined,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender
      });
      
      Alert.alert(
        'Registration Successful!',
        `Welcome ${user.name}!\n\nYour account has been created successfully. You can now access personalized medical assistance and track your cases.`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Welcome')
          }
        ]
      );
    } catch (error) {
      logger.error('Registration failed', error);
      Alert.alert(
        'Registration Failed',
        error instanceof Error ? error.message : 'Unable to create account. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    if (!name.trim()) {
      Alert.alert('Missing Information', 'Please enter your name.');
      return;
    }

    setLoading(true);
    
    try {
      const guestUser = await authService.loginAsGuest({
        name: name.trim(),
        phone: phone.trim() || undefined,
      });
      
      Alert.alert(
        'Guest Access Created',
        `Welcome ${guestUser.name}!\n\nYou're using MediBot as a guest. Your conversations and cases will be tracked, but consider creating an account for better continuity of care.`,
        [
          {
            text: 'Continue',
            onPress: () => navigation.navigate('Welcome')
          }
        ]
      );
    } catch (error) {
      logger.error('Guest login failed', error);
      Alert.alert(
        'Guest Access Failed',
        'Unable to create guest access. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderLoginForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Login</Text>
        )}
      </TouchableOpacity>

      {activeTab === 'patient' && (
        <>
          {/* Guest Access Button */}
          <TouchableOpacity
            style={[styles.button, styles.guestButton]}
            onPress={async () => {
              setLoading(true);
              try {
                const guestUser = await authService.loginAsGuest({
                  name: 'Guest User',
                });
                Alert.alert(
                  'Welcome Guest User',
                  'You can now chat with MediBot. Consider creating a profile for better experience.',
                  [{ text: 'Continue', onPress: () => navigation.replace('Welcome') }]
                );
              } catch (error) {
                Alert.alert('Error', 'Failed to continue as guest. Please try again.');
              } finally {
                setLoading(false);
              }
            }}
            disabled={loading}
          >
            <MaterialIcons name="person-outline" size={20} color={colors.primary} />
            <Text style={[styles.buttonText, { color: colors.primary }]}>Continue as Guest</Text>
          </TouchableOpacity>

          {/* Test Account Button */}
          <TouchableOpacity
            style={styles.testAccountButton}
            onPress={() => {
              setEmail('test@medibot.com');
              setPassword('Test123!');
            }}
          >
            <MaterialIcons name="bug-report" size={16} color="#FF9800" />
            <Text style={styles.testAccountText}>🐛 Use Test Account</Text>
          </TouchableOpacity>

          {/* Sample Users */}
          <View style={styles.sampleUsersContainer}>
            <Text style={styles.sampleUsersTitle}>📋 Sample Patients (for testing):</Text>
            
            {/* API Test Account */}
            <TouchableOpacity
              style={[styles.sampleUserButton, { backgroundColor: '#4CAF50' + '20', borderColor: '#4CAF50' }]}
              onPress={() => {
                setEmail('test@medibot.com');
                setPassword('Test123!');
              }}
            >
              <MaterialIcons name="verified" size={16} color="#4CAF50" />
              <Text style={[styles.sampleUserText, { color: '#4CAF50', fontWeight: '600' }]}>
                API Test Account - Full case history
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.sampleUserButton}
              onPress={() => {
                setEmail('sarah.johnson@example.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.sampleUserText}>Sarah Johnson - Young adult with asthma</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sampleUserButton}
              onPress={() => {
                setEmail('robert.chen@example.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.sampleUserText}>Robert Chen - Middle-aged with diabetes</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.sampleUserButton}
              onPress={() => {
                setEmail('margaret.williams@example.com');
                setPassword('password123');
              }}
            >
              <Text style={styles.sampleUserText}>Margaret Williams - Elderly with multiple conditions</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </>
  );

  const renderRegisterForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Full Name *</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your full name"
            value={name}
            onChangeText={setName}
            autoComplete="name"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email Address *</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="email" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of Birth (Optional)</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="cake" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            value={dateOfBirth}
            onChangeText={setDateOfBirth}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Password *</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoComplete="password-new"
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <MaterialIcons 
              name={showPassword ? 'visibility-off' : 'visibility'} 
              size={20} 
              color={colors.textSecondary} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirm Password *</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="lock-outline" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </>
  );

  const renderGuestForm = () => (
    <>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Your Name *</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="person" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Phone Number (Optional)</Text>
        <View style={styles.inputContainer}>
          <MaterialIcons name="phone" size={20} color={colors.textSecondary} />
          <TextInput
            style={styles.input}
            placeholder="For emergency contact"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>
      </View>

      <View style={styles.guestNotice}>
        <MaterialIcons name="info" size={20} color={colors.primary} />
        <Text style={styles.guestNoticeText}>
          As a guest, your conversation will be tracked for continuity, but creating an account provides better long-term care management.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleGuestLogin}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Continue as Guest</Text>
        )}
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {activeTab === 'patient' ? 'Patient Access' : 'Staff Access'}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <MaterialIcons 
                  name={activeTab === 'patient' ? 'healing' : 'medical-services'} 
                  size={60} 
                  color={colors.primary} 
                />
              </View>
              <Text style={styles.logoTitle}>MediBot</Text>
              <Text style={styles.logoSubtitle}>
                {activeTab === 'patient' ? 'Your Personal Health Assistant' : 'Professional Medical Portal'}
              </Text>
            </View>

            {/* Patient/Staff Tab Selector */}
            <View style={styles.userTypeSelector}>
              <TouchableOpacity
                style={[styles.userTypeTab, activeTab === 'patient' && styles.userTypeTabActive]}
                onPress={() => {
                  setActiveTab('patient');
                  setMode('login');
                  setEmail('');
                  setPassword('');
                }}
              >
                <MaterialIcons 
                  name="person" 
                  size={20} 
                  color={activeTab === 'patient' ? '#FFFFFF' : colors.textSecondary} 
                />
                <Text style={[styles.userTypeTabText, activeTab === 'patient' && styles.userTypeTabTextActive]}>
                  Patient
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.userTypeTab, activeTab === 'staff' && styles.userTypeTabActive]}
                onPress={() => {
                  setActiveTab('staff');
                  setMode('login');
                  setEmail('');
                  setPassword('');
                }}
              >
                <MaterialIcons 
                  name="medical-services" 
                  size={20} 
                  color={activeTab === 'staff' ? '#FFFFFF' : colors.textSecondary} 
                />
                <Text style={[styles.userTypeTabText, activeTab === 'staff' && styles.userTypeTabTextActive]}>
                  Staff
                </Text>
              </TouchableOpacity>
            </View>

            {/* Mode Selection Tabs (only show guest for patient) */}
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
              {activeTab === 'patient' && (
                <TouchableOpacity
                  style={[styles.modeTab, mode === 'guest' && styles.modeTabActive]}
                  onPress={() => setMode('guest')}
                >
                  <Text style={[styles.modeTabText, mode === 'guest' && styles.modeTabTextActive]}>
                    Guest
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.loginForm}>
              {mode === 'login' && renderLoginForm()}
              {mode === 'register' && renderRegisterForm()}
              {mode === 'guest' && activeTab === 'patient' && renderGuestForm()}
            </View>

          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  logoSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  userTypeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  userTypeTab: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    gap: 6,
  },
  userTypeTabActive: {
    backgroundColor: colors.primary,
  },
  userTypeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  userTypeTabTextActive: {
    color: 'white',
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: colors.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  modeTabTextActive: {
    color: 'white',
  },
  loginForm: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    marginLeft: 12,
  },
  guestNotice: {
    flexDirection: 'row',
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  guestNoticeText: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
    lineHeight: 20,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: colors.textSecondary,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  testAccountButton: {
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
  testAccountText: {
    marginLeft: 6,
    fontSize: 13,
    color: '#F57C00',
    fontWeight: '600',
  },
  sampleUsersContainer: {
    marginTop: 24,
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sampleUsersTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  sampleUserButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.primaryLight + '20',
    borderRadius: 8,
    marginBottom: 8,
  },
  sampleUserText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
});

const LoginScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <LoginScreen {...props} />
  </ErrorBoundary>
);

export default LoginScreenWithErrorBoundary;