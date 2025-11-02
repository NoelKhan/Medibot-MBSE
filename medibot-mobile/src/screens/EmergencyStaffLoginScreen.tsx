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
import EmergencyService from '../services/EmergencyService';
import { StaffUser } from '../types/Booking';
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { useBackHandler } from '../hooks/useBackHandler';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';

interface EmergencyStaffLoginScreenProps {
  navigation: any;
}

const EmergencyStaffLoginScreen: React.FC<EmergencyStaffLoginScreenProps> = ({ navigation }) => {
  const { theme, colors } = useTheme();
  const styles = createStyles(colors);
  
  // Handle hardware back button - navigate to RoleSelection
  useBackHandler('RoleSelection');
  
  // Track screen view
  React.useEffect(() => {
    trackScreen('EmergencyStaffLoginScreen');
  }, []);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [staffId, setStaffId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const emergencyService = EmergencyService.getInstance();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Missing Information', 'Please enter both email and password.');
      return;
    }

    setLoading(true);
    
    try {
      const staff = await emergencyService.authenticateStaff(email, password, staffId);
      
      // Track successful emergency staff login
      Analytics.track(AnalyticsEvent.LOGIN_SUCCESS, {
        method: 'emergency_service',
        userRole: staff.role,
        staffType: 'emergency',
        department: staff.department,
      });
      
      Alert.alert(
        'Login Successful',
        `Welcome back, ${staff.name}!\n\nRole: ${staff.role}\nDepartment: ${staff.department}\nShift: ${staff.shift}`,
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate to EmergencyStaffWelcome
              navigation.replace('EmergencyStaffWelcome');
            }
          }
        ]
      );
      
    } catch (error) {
      // Track login failure
      Analytics.track(AnalyticsEvent.LOGIN_FAILURE, {
        method: 'emergency_service',
        userRole: 'emergency_staff',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      Alert.alert(
        'Login Failed',
        error instanceof Error ? error.message : 'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (role: 'api' | 'operator' | 'doctor' | 'nurse') => {
    const credentials = {
      api: {
        email: 'test@emergency.com',
        password: 'Test123!',
        staffId: 'API-911'
      },
      operator: {
        email: 'emergency@health.vic.gov.au',
        password: 'emergency123',
        staffId: 'EMG001'
      },
      doctor: {
        email: 'supervisor@health.vic.gov.au', 
        password: 'staff2024',
        staffId: 'SUP001'
      },
      nurse: {
        email: 'nurse@health.vic.gov.au',
        password: 'staff2024', 
        staffId: 'NUR001'
      }
    };

    const creds = credentials[role];
    setEmail(creds.email);
    setPassword(creds.password);
    setStaffId(creds.staffId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Staff Login</Text>
            <View style={styles.placeholder} />
          </View>

          <View style={styles.content}>
            <View style={styles.logoSection}>
              <View style={styles.logoContainer}>
                <MaterialIcons name="local-hospital" size={60} color={colors.primary} />
              </View>
              <Text style={styles.logoTitle}>Emergency Services</Text>
              <Text style={styles.logoSubtitle}>Staff Access Portal</Text>
            </View>

            <View style={styles.loginForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="email" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your work email"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Staff ID (Optional)</Text>
                <View style={styles.inputContainer}>
                  <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your staff ID"
                    value={staffId}
                    onChangeText={setStaffId}
                    autoCapitalize="characters"
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
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeButton}
                  >
                    <MaterialIcons 
                      name={showPassword ? 'visibility-off' : 'visibility'} 
                      size={20} 
                      color={colors.textSecondary} 
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <MaterialIcons name="login" size={20} color="#FFFFFF" />
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Quick Access (Demo)</Text>
                <View style={styles.dividerLine} />
              </View>

              <View style={styles.quickLoginSection}>
                <Text style={styles.quickLoginTitle}>Demo Accounts:</Text>
                
                <TouchableOpacity
                  style={[styles.quickLoginButton, { backgroundColor: '#FF9500' }]}
                  onPress={() => quickLogin('api')}
                >
                  <MaterialIcons name="bug-report" size={24} color="#FFFFFF" />
                  <View style={styles.quickLoginContent}>
                    <Text style={styles.quickLoginText}>🐛 API Test Account</Text>
                    <Text style={styles.quickLoginSubtext}>test@emergency.com • Backend testing</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLoginButton, styles.operatorButton]}
                  onPress={() => quickLogin('operator')}
                >
                  <MaterialIcons name="support-agent" size={24} color="#FFFFFF" />
                  <View style={styles.quickLoginContent}>
                    <Text style={styles.quickLoginText}>Emergency Operator</Text>
                    <Text style={styles.quickLoginSubtext}>Sarah Johnson</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLoginButton, styles.doctorButton]}
                  onPress={() => quickLogin('doctor')}
                >
                  <MaterialIcons name="medical-services" size={24} color="#FFFFFF" />
                  <View style={styles.quickLoginContent}>
                    <Text style={styles.quickLoginText}>Emergency Doctor</Text>
                    <Text style={styles.quickLoginSubtext}>Dr. Michael Chen</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.quickLoginButton, styles.nurseButton]}
                  onPress={() => quickLogin('nurse')}
                >
                  <MaterialIcons name="healing" size={24} color="#FFFFFF" />
                  <View style={styles.quickLoginContent}>
                    <Text style={styles.quickLoginText}>Triage Nurse</Text>
                    <Text style={styles.quickLoginSubtext}>Emma Thompson</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={styles.infoSection}>
                <MaterialIcons name="info" size={16} color={colors.primary} />
                <Text style={styles.infoText}>
                  This portal provides access to emergency cases, patient priority lists, and dispatch coordination tools.
                </Text>
              </View>
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
    backgroundColor: colors.background
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text
  },
  placeholder: {
    width: 34
  },
  content: {
    flex: 1,
    padding: 20
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 3,
    borderColor: colors.primary
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5
  },
  logoSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center'
  },
  loginForm: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    padding: 25,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  inputGroup: {
    marginBottom: 20
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 15,
    backgroundColor: colors.surface
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 10,
    fontSize: 16,
    color: colors.text
  },
  eyeButton: {
    padding: 5
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10
  },
  loginButtonDisabled: {
    backgroundColor: colors.border
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 25
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border
  },
  dividerText: {
    marginHorizontal: 15,
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  quickLoginSection: {
    marginBottom: 20
  },
  quickLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 15,
    textAlign: 'center'
  },
  quickLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10
  },
  operatorButton: {
    backgroundColor: '#FF9500'
  },
  doctorButton: {
    backgroundColor: '#34C759'
  },
  nurseButton: {
    backgroundColor: '#FF3B30'
  },
  quickLoginContent: {
    marginLeft: 15,
    flex: 1
  },
  quickLoginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  },
  quickLoginSubtext: {
    color: '#FFFFFF',
    fontSize: 14,
    opacity: 0.9,
    marginTop: 2
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F8FF',
    padding: 15,
    borderRadius: 8,
    marginTop: 10
  },
  infoText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#007AFF',
    flex: 1,
    lineHeight: 20
  }
});

const EmergencyStaffLoginScreenWithErrorBoundary: React.FC<EmergencyStaffLoginScreenProps> = (props) => (
  <ErrorBoundary>
    <EmergencyStaffLoginScreen {...props} />
  </ErrorBoundary>
);

export default EmergencyStaffLoginScreenWithErrorBoundary;