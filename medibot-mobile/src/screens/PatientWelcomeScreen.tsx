import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useOrientation, getOrientationStyles } from '../hooks/useOrientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/auth';
import { User, UserRole } from '../types/User';
import { PatientUser } from '../types/Booking';
import { showAlert } from '../components/CrossPlatformAlert';
import { AppColors, Colors } from '../theme/colors';
import { useTheme } from '../contexts/ThemeContext';
import { GlobalAuthWidget } from '../components/GlobalAuthWidget';
import RoleGuard from '../utils/RoleGuard';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';
import { StatusIndicator } from '../components/StatusIndicator';

const logger = createLogger('PatientWelcomeScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const PatientWelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | PatientUser | null>(null);
  const orientation = useOrientation();
  const orientationStyles = getOrientationStyles(orientation);
  
  const { colors, isDark, theme, toggleTheme } = useTheme();
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDark);

  // Check for logged in user on mount and when screen comes into focus
  React.useEffect(() => {
    trackScreen('PatientWelcomeScreen', { 
      hasUser: !!currentUser,
      userRole: (currentUser as any)?.role 
    });
    
    const checkUser = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      
      // Enforce role-based access - staff cannot access patient portal
      if (user && RoleGuard.isStaff(user as any)) {
        RoleGuard.forceLogout(
          navigation,
          'Staff members must use the staff portal. Please login with a patient account to access patient features.'
        );
      }
    };

    // Check on mount
    checkUser();

    // Re-check when screen comes into focus
    const unsubscribe = navigation.addListener('focus', checkUser);

    return unsubscribe;
  }, [navigation]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return 'light-mode';
      case 'dark': return 'dark-mode';
      default: return 'brightness-auto';
    }
  };

  const getThemeText = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'Auto';
    }
  };

  const handleGuestAccess = async () => {
    setLoading(true);
    try {
      const guestUser = await authService.loginAsGuest({ name: 'Guest User' });
      
      // Show notification preference alert for guest users
      showAlert(
        'Welcome Guest User',
        'For the best experience including notifications and appointment reminders, consider creating a profile with your email.',
        [
          {
            text: 'Continue as Guest',
            style: 'cancel',
            onPress: () => navigation.navigate('Chat', { user: guestUser as any })
          },
          {
            text: 'Create Profile',
            onPress: () => navigation.navigate('PatientLogin')
          }
        ]
      );
    } catch (error) {
      showAlert('Error', 'Failed to continue as guest. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    if (!email) {
      showAlert('Error', 'Please enter a valid email address.');
      return;
    }

    if (!isValidEmail(email)) {
      showAlert('Error', 'Please enter a valid email format.');
      return;
    }

    // Navigate to login screen
    navigation.navigate('PatientLogin');
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <SafeAreaView style={[styles.container, orientationStyles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      
      {/* Backend Status Indicator */}
      <StatusIndicator />
      
      {/* Global Auth Widget */}
      {currentUser && (
        <GlobalAuthWidget 
          navigation={navigation} 
          position="top"
          onLogout={async () => {
            try {
              await authService.logout();
              setCurrentUser(null);
              // Force navigation to RoleSelection
              navigation.replace('RoleSelection');
              showAlert('Success', 'Logged out successfully');
            } catch (error) {
              logger.error('Logout error', error);
            }
          }}
        />
      )}
      
      {/* Header - matches staff welcome style */}
      <View style={[styles.themeHeader, { backgroundColor: colors.background, borderBottomColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 }]}> 
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={[styles.appName, { color: colors.text, fontSize: 20, fontWeight: 'bold' }]}>MediBot</Text>
          {currentUser && (
            <View style={[styles.userBadge, { backgroundColor: colors.primary + '20', marginLeft: 8 }]}> 
              <MaterialIcons name="account-circle" size={16} color={colors.primary} />
              <Text style={[styles.userBadgeText, { color: colors.primary }]}> {currentUser.name || currentUser.email || 'Guest'} </Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity onPress={toggleTheme} style={[styles.iconButton, { marginRight: 8 }]}> 
            <MaterialIcons name={getThemeIcon()} size={24} color={colors.text} />
          </TouchableOpacity>
          {currentUser && (
            <TouchableOpacity onPress={() => {
              Alert.alert(
                'Logout',
                'Are you sure you want to logout?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await authService.logout();
                        setCurrentUser(null);
                        navigation.replace('RoleSelection');
                      } catch (error) {
                        Alert.alert('Error', 'Failed to logout. Please try again.');
                      }
                    }
                  }
                ]
              );
            }} style={styles.iconButton}>
              <MaterialIcons name="logout" size={24} color={colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={[styles.scrollContainer, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.scrollContent, orientationStyles.scrollContent]}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary + '20' }]}>
            <MaterialIcons name="medical-services" size={80} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>MediBot</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Your AI Healthcare Assistant</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Get instant medical advice, book appointments, and access emergency services 24/7
          </Text>
        </View>

        {/* Enhanced features banner removed — redundant */}

        <View style={styles.buttonContainer}>
        {!showEmailLogin ? (
          <>
            {/* Show Start Chat button - adapts text based on login status */}
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, { 
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              }]}
              
              onPress={async () => {
                if (currentUser) {
                  // User already logged in, start NEW chat consultation
                  Analytics.track(AnalyticsEvent.FEATURE_USED, {
                    feature: 'start_new_consultation',
                    source: 'welcome_screen',
                    userRole: (currentUser as any).role
                  });
                  // Always pass only user, never conversationId - ensures fresh consultation
                  navigation.navigate('Chat', { user: currentUser as any });
                } else {
                  // Login as guest
                  Analytics.track(AnalyticsEvent.FEATURE_USED, {
                    feature: 'start_chat_guest',
                    source: 'welcome_screen'
                  });
                  setLoading(true);
                  try {
                    const guestUser = await authService.loginAsGuest({ name: 'Guest User' });
                    setCurrentUser(guestUser);
                    // Start fresh consultation for guest
                    navigation.navigate('Chat', { user: guestUser as any });
                  } catch (error) {
                    showAlert('Error', 'Failed to start chat. Please try again.');
                  } finally {
                    setLoading(false);
                  }
                }
              }}
              disabled={loading}
            >
              <MaterialIcons name="chat" size={24} color={colors.surface} />
              <View style={styles.buttonTextContainer}>
                <Text style={[styles.buttonText, styles.primaryButtonText, { color: colors.surface }]}>
                  {currentUser ? 'Start New Consultation' : 'Start Chat'}
                </Text>
                <Text style={[styles.buttonSubtext, { color: colors.surface + 'DD' }]}>
                  {currentUser ? 'Begin a fresh medical consultation' : 'Begin as guest, login anytime'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Only show Login/Register button if not logged in */}
            {!currentUser && (
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.primary 
                }]}
                
                onPress={() => navigation.navigate('PatientLogin')}
                disabled={loading}
              >
                <MaterialIcons name="account-circle" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  Login / Create Account
                </Text>
              </TouchableOpacity>
            )}

            {/* Show View Profile button if logged in */}
            {currentUser && (
              <>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton, { 
                    backgroundColor: colors.surface, 
                    borderColor: colors.primary 
                  }]} 
                  onPress={() => {
                    try {
                      navigation.navigate('Profile', { user: currentUser });
                    } catch (error) {
                      logger.error('Navigation error', error);
                      showAlert('Error', 'Unable to open profile. Please try again.');
                    }
                  }}
                  disabled={loading}
                >
                  <MaterialIcons name="person" size={20} color={colors.primary} />
                  <Text style={[styles.buttonText, { color: colors.primary }]}> 
                    {(currentUser as any).role === UserRole.GUEST ? 'Update Profile & Access History' : 'User Profile'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton, { 
                    backgroundColor: colors.surface, 
                    borderColor: '#4CAF50' 
                  }]} 
                  onPress={() => {
                    try {
                      navigation.navigate('MedicalCases', { userId: currentUser.id });
                    } catch (error) {
                      logger.error('Navigation error', error);
                      showAlert('Error', 'Unable to open medical cases. Please try again.');
                    }
                  }}
                  disabled={loading}
                >
                  <MaterialIcons name="folder" size={20} color="#4CAF50" />
                  <Text style={[styles.buttonText, { color: '#4CAF50' }]}>
                    My Medical Cases
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* New Feature Buttons */}
            <View style={styles.featuresSection}>
              <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={[styles.featureButton, styles.doctorButton]} 
                onPress={() => {
                  // Navigate directly to Doctor Services
                  navigation.navigate('DoctorServices', { 
                    user: (currentUser as any) || undefined,
                    initialTab: 'scheduled' 
                  });
                }}
                disabled={loading}
              >
                <MaterialIcons name="local-hospital" size={24} color="#FFFFFF" />
                <View style={styles.featureButtonContent}>
                  <Text style={styles.featureButtonText}>Doctor Services</Text>
                  <Text style={styles.featureButtonSubtext}>Appointments & consultations</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.featureButton, styles.emergencyButton]} 
                onPress={() => navigation.navigate('EmergencyCall', {})}
                disabled={loading}
              >
                <MaterialIcons name="emergency" size={24} color="#FFFFFF" />
                <View style={styles.featureButtonContent}>
                  <Text style={styles.featureButtonText}>Emergency Call</Text>
                  <Text style={styles.featureButtonSubtext}>Call 000 with timer</Text>
                </View>
              </TouchableOpacity>

              {/* Only show Patient Login/Register when NOT logged in */}
              {!currentUser && (
                <TouchableOpacity 
                  style={[styles.featureButton, styles.userLoginButton]} 
                  onPress={() => navigation.navigate('PatientLogin')}
                  disabled={loading}
                >
                  <MaterialIcons name="person" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>Patient Account</Text>
                    <Text style={styles.featureButtonSubtext}>Login or create your medical profile</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Show Reminders when logged in */}
              {currentUser && (
                <TouchableOpacity 
                  style={[styles.featureButton, styles.reminderButton]} 
                  onPress={() => navigation.navigate('ReminderList')}
                  disabled={loading}
                >
                  <MaterialIcons name="notifications-active" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>My Reminders</Text>
                    <Text style={styles.featureButtonSubtext}>Manage medication & appointment reminders</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Show Notification Preferences when logged in */}
              {currentUser && (
                <TouchableOpacity 
                  style={[styles.featureButton, styles.settingsButton]} 
                  onPress={() => navigation.navigate('NotificationSettings', { user: currentUser as any })}
                  disabled={loading}
                >
                  <MaterialIcons name="settings" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>Notification Preferences</Text>
                    <Text style={styles.featureButtonSubtext}>Manage push & email preferences</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Show Conversation History when logged in */}
              {currentUser && (
                <TouchableOpacity 
                  style={[styles.featureButton, styles.historyButton]} 
                  onPress={() => navigation.navigate('ConversationHistory', { user: currentUser as any })}
                  disabled={loading}
                >
                  <MaterialIcons name="history" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>Chat History</Text>
                    <Text style={styles.featureButtonSubtext}>View past consultations & conversations</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity 
                style={[styles.featureButton, styles.apiTestButton]} 
                onPress={() => navigation.navigate('ApiTest')}
                disabled={loading}
              >
                <MaterialIcons name="science" size={24} color="#FFFFFF" />
                <View style={styles.featureButtonContent}>
                  <Text style={styles.featureButtonText}>API Test</Text>
                  <Text style={styles.featureButtonSubtext}>Test backend integration</Text>
                </View>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emailLoginContainer}>
            <Text style={styles.emailLoginTitle}>Enter your email to track previous chats</Text>
            <TextInput
              style={styles.emailInput}
              placeholder="Enter your email address"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
            <View style={styles.emailButtonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton]} 
                onPress={handleEmailLogin}
                disabled={loading || !email.trim()}
              >
                <MaterialIcons name="login" size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={() => {
                  setShowEmailLogin(false);
                  setEmail('');
                }}
                disabled={loading}
              >
                <MaterialIcons name="arrow-back" size={20} color={colors.textSecondary} />
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

        <Text style={styles.disclaimer}>
          ⚠️ MediBot provides health information for educational purposes only. 
          Always consult healthcare professionals for medical advice.
        </Text>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    ...Platform.select({
      web: {
        minHeight: '100vh' as any,
        width: '100%',
        backgroundColor: colors.background,
        background: isDark 
          ? colors.background 
          : `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)`,
      } as any,
    }),
  },
  flex1: {
    flex: 1,
  },
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 56,
    minHeight: 56,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  themeHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  userBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  themeText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 40,
    minHeight: Dimensions.get('window').height - 100,
    ...Platform.select({
      ios: {
        paddingTop: 20,
      },
      android: {
        paddingTop: 20,
      },
      web: {
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40,
        minHeight: 'calc(100vh - 60px)' as any,
        justifyContent: 'center',
      } as any,
    }),
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    ...Platform.select({
      web: {
        paddingHorizontal: 40,
      },
    }),
  },
    logoContainer: {
    backgroundColor: colors.surface,
    borderRadius: 35,
    padding: 28,
    marginBottom: 24,
    alignSelf: 'center',
    ...Platform.select({
      ios: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: `0 8px 24px ${colors.primary}20`,
      },
    }),
  },
  title: {
    fontSize: Platform.select({
      web: 42,
      default: 36,
    }),
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 20,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
    fontWeight: '400',
    ...Platform.select({
      web: {
        maxWidth: 450,
      },
    }),
  },
  // featuresBanner styles removed (enhanced features UI was redundant)
  buttonContainer: {
    marginVertical: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary[500],
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary[500],
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: `0 4px 12px ${colors.primary}30, 0 2px 6px ${colors.primary}20`,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        ':hover': {
          backgroundColor: colors.secondary,
          transform: 'translateY(-1px)',
          boxShadow: `0 6px 16px ${colors.primary}40, 0 3px 8px ${colors.primary}30`,
        },
      } as any,
    }),
  },
  emailButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  emailButtonText: {
    color: colors.primary,
    fontWeight: '600',
  },
  emailLoginContainer: {
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      },
    }),
  },
  emailLoginTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  emailInput: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    fontSize: 16,
    marginBottom: 18,
    backgroundColor: colors.background,
    color: colors.text,
    ...Platform.select({
      ios: {
        paddingVertical: 18,
      },
      web: {
        outline: 'none',
        transition: 'all 0.2s ease',
        ':focus': {
          borderColor: colors.primary,
          backgroundColor: colors.surface,
          boxShadow: `0 0 0 3px ${colors.primary}33`,
        },
      },
    }),
  },
  emailButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
  },
  backButton: {
    flex: 1,
    backgroundColor: Colors.neutral[200],
  },
  buttonText: {
    color: Colors.text.inverse,
    fontSize: 17,
    fontWeight: '700',
    marginLeft: 10,
    letterSpacing: 0.3,
  },
  primaryButton: {
    paddingVertical: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  buttonTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  buttonSubtext: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '400',
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  featuresSection: {
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 3px 6px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
        transition: 'transform 0.2s ease',
        ':hover': {
          transform: 'translateY(-1px)',
        },
      } as any,
    }),
  },
  doctorButton: {
    backgroundColor: colors.secondary,
  },
  consultButton: {
    backgroundColor: colors.primary,
  },
  emergencyButton: {
    backgroundColor: colors.error,
  },
  userLoginButton: {
    backgroundColor: colors.success,
  },
  reminderButton: {
    backgroundColor: '#FF9800',
  },
  settingsButton: {
    backgroundColor: '#607D8B',
  },
  historyButton: {
    backgroundColor: '#9C27B0',
  },
  profileButton: {
    backgroundColor: colors.secondary,
  },
  staffButton: {
    backgroundColor: colors.warning,
  },
  apiTestButton: {
    backgroundColor: '#9C27B0',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  featureButtonContent: {
    marginLeft: 15,
    flex: 1,
  },
  featureButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureButtonSubtext: {
    color: colors.surface,
    fontSize: 13,
    opacity: 0.9,
  },
});

const PatientWelcomeScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <PatientWelcomeScreen {...props} />
  </ErrorBoundary>
);

export default PatientWelcomeScreenWithErrorBoundary;