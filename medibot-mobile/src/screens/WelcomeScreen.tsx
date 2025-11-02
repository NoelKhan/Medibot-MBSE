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
} from 'react-native';
import { useOrientation, getOrientationStyles } from '../hooks/useOrientation';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { authService } from '../services/auth';
import { User } from '../types/User';
import { PatientUser } from '../types/Booking';
import { showAlert } from '../components/CrossPlatformAlert';
import { AppColors, Colors } from '../theme/colors';
import { useTheme } from '../contexts/ThemeContext';
import { GlobalAuthWidget } from '../components/GlobalAuthWidget';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const [showEmailLogin, setShowEmailLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | PatientUser | null>(null);
  const orientation = useOrientation();
  const orientationStyles = getOrientationStyles(orientation);
  
  const { colors, isDark, theme, toggleTheme } = useTheme();
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors, isDark);

  // Check for logged in user on mount
  React.useEffect(() => {
    const user = authService.getCurrentUser();
    setCurrentUser(user);
  }, []);

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
            onPress: () => navigation.navigate('Login', {})
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

    setLoading(true);
    try {
      // For now, navigate to Login screen for full authentication
      // In the future, this could support magic link authentication
      navigation.navigate('Login', {});
    } catch (error) {
      showAlert('Error', 'Failed to proceed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  return (
    <SafeAreaView style={[styles.container, orientationStyles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />
      
      {/* Global Auth Widget */}
      {currentUser && (
        <GlobalAuthWidget 
          navigation={navigation} 
          position="top"
          onLogout={() => {
            setCurrentUser(null);
            showAlert('Success', 'Logged out successfully');
          }}
        />
      )}
      
      {/* Theme Toggle Header */}
      <View style={[styles.themeHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <View style={styles.themeHeaderLeft}>
          <Text style={[styles.appName, { color: colors.text }]}>MediBot</Text>
          {currentUser && (
            <View style={[styles.userBadge, { backgroundColor: colors.primary + '20' }]}>
              <MaterialIcons name="account-circle" size={16} color={colors.primary} />
              <Text style={[styles.userBadgeText, { color: colors.primary }]}>
                {currentUser.name || currentUser.email || 'Guest'}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity 
          style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={toggleTheme}
        >
          <MaterialIcons name={getThemeIcon()} size={20} color={colors.primary} />
          <Text style={[styles.themeText, { color: colors.text }]}>{getThemeText()}</Text>
        </TouchableOpacity>
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

        {/* New Features Banner */}
        <View style={[styles.featuresBanner, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
          <View style={styles.featuresBannerHeader}>
            <MaterialIcons name="new-releases" size={24} color={colors.primary} />
            <Text style={[styles.featuresBannerTitle, { color: colors.primary }]}>
              ✨ Enhanced Features
            </Text>
          </View>
          <View style={styles.featuresBannerContent}>
            <View style={styles.featureBannerItem}>
              <MaterialIcons name="notifications-active" size={18} color={colors.primary} />
              <Text style={[styles.featureBannerText, { color: colors.text }]}>
                Smart notification management
              </Text>
            </View>
            <View style={styles.featureBannerItem}>
              <MaterialIcons name="alarm" size={18} color={colors.primary} />
              <Text style={[styles.featureBannerText, { color: colors.text }]}>
                Medication & appointment reminders
              </Text>
            </View>
            <View style={styles.featureBannerItem}>
              <MaterialIcons name="dark-mode" size={18} color={colors.primary} />
              <Text style={[styles.featureBannerText, { color: colors.text }]}>
                Dark mode support
              </Text>
            </View>
          </View>
        </View>

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
                  // User already logged in, go directly to chat
                  navigation.navigate('Chat', { user: currentUser as any });
                } else {
                  // Login as guest
                  setLoading(true);
                  try {
                    const guestUser = await authService.loginAsGuest({ name: 'Guest User' });
                    setCurrentUser(guestUser);
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
                  {currentUser ? 'Continue to Chat' : 'Start Chat'}
                </Text>
                <Text style={[styles.buttonSubtext, { color: colors.surface + 'DD' }]}>
                  {currentUser ? 'Resume your consultation' : 'Begin as guest, login anytime'}
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
                onPress={() => navigation.navigate('Login', {})}
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
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: colors.primary 
                }]} 
                onPress={() => navigation.navigate('MedicalCases', { userId: currentUser.id })}
                disabled={loading}
              >
                <MaterialIcons name="folder" size={20} color={colors.primary} />
                <Text style={[styles.buttonText, { color: colors.primary }]}>
                  My Medical Cases
                </Text>
              </TouchableOpacity>
            )}

            {/* Show Logout button if logged in */}
            {currentUser && (
              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton, { 
                  backgroundColor: colors.surface, 
                  borderColor: '#FF4444',
                }]} 
                onPress={async () => {
                  showAlert(
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
                            showAlert('Success', 'You have been logged out successfully.');
                          } catch (error) {
                            showAlert('Error', 'Failed to logout. Please try again.');
                          }
                        }
                      }
                    ]
                  );
                }}
                disabled={loading}
              >
                <MaterialIcons name="logout" size={20} color="#FF4444" />
                <Text style={[styles.buttonText, { color: '#FF4444' }]}>
                  Logout
                </Text>
              </TouchableOpacity>
            )}

            {/* New Feature Buttons */}
            <View style={styles.featuresSection}>
              <Text style={[styles.featuresTitle, { color: colors.textSecondary }]}>Quick Actions</Text>
              
              <TouchableOpacity 
                style={[styles.featureButton, styles.doctorButton]} 
                onPress={() => {
                  // Check if user has email for notifications
                  showAlert(
                    'Doctor Services',
                    'Access appointments, consultations, and medical services. Email notifications are recommended.',
                    [
                      { text: 'Continue', onPress: () => navigation.navigate('DoctorServices', { initialTab: 'scheduled' }) },
                      { text: 'Set Email First', onPress: () => navigation.navigate('Login', {}) }
                    ]
                  );
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
                  onPress={() => navigation.navigate('Login', {})}
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
                  onPress={() => navigation.navigate('Reminders', { userId: currentUser.id })}
                  disabled={loading}
                >
                  <MaterialIcons name="notifications-active" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>My Reminders</Text>
                    <Text style={styles.featureButtonSubtext}>View & manage medication reminders</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Show Notification Settings when logged in */}
              {currentUser && (
                <TouchableOpacity 
                  style={[styles.featureButton, styles.settingsButton]} 
                  onPress={() => navigation.navigate('NotificationPreferences', { userId: currentUser.id })}
                  disabled={loading}
                >
                  <MaterialIcons name="settings" size={24} color="#FFFFFF" />
                  <View style={styles.featureButtonContent}>
                    <Text style={styles.featureButtonText}>Notification Settings</Text>
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
                style={[styles.featureButton, styles.staffButton]} 
                onPress={() => navigation.navigate('StaffLogin')}
                disabled={loading}
              >
                <MaterialIcons name="admin-panel-settings" size={24} color="#FFFFFF" />
                <View style={styles.featureButtonContent}>
                  <Text style={styles.featureButtonText}>Staff Login</Text>
                  <Text style={styles.featureButtonSubtext}>Emergency services access</Text>
                </View>
              </TouchableOpacity>

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
  themeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
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
  featuresBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  featuresBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuresBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  featuresBannerContent: {
    gap: 8,
  },
  featureBannerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
  },
  featureBannerText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
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

export default WelcomeScreen;