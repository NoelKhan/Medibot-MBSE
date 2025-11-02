import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { User, UserRole } from '../types/User';
import { authService } from '../services/auth';
// Removed deprecated notificationService import
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { InputValidator } from '../utils/InputValidator';
import EmptyState from '../components/EmptyState';
import FollowupScreen from './FollowupScreen';
import CaseFollowupService from '../services/CaseFollowupService';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('SimpleProfileScreen');

interface SimpleProfileScreenProps {
  user: User;
  onClose: () => void;
  onLogout: () => void;
  onProfileComplete: () => void;
  navigation?: any;
}

// Safe date formatter
const formatDate = (date: Date | undefined | null): string => {
  try {
    if (!date) return '';
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date.toLocaleDateString();
    }
    return '';
  } catch (error) {
    logger.warn('Date formatting error', error);
    return '';
  }
};

const SimpleProfileScreen: React.FC<SimpleProfileScreenProps> = ({
  user,
  onClose,
  onLogout,
  onProfileComplete,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  // Initialize state with proper null checks and error handling
  const [isEditing, setIsEditing] = useState(() => {
    try {
      return user?.role === 'guest' || !user?.email;
    } catch (error) {
      logger.warn('Error checking user editing state', error);
      return true;
    }
  });

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.profile?.phoneNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState(user?.profile?.emergencyContact?.name || '');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(user?.profile?.emergencyContact?.phoneNumber || '');
  const [medicalHistory, setMedicalHistory] = useState(() => {
    try {
      return user?.profile?.medicalHistory?.join(', ') || '';
    } catch (error) {
      logger.warn('Error formatting medical history', error);
      return '';
    }
  });
  const [allergies, setAllergies] = useState(() => {
    try {
      return user?.profile?.allergies?.join(', ') || '';
    } catch (error) {
      logger.warn('Error formatting allergies', error);
      return '';
    }
  });
  const [medications, setMedications] = useState(() => {
    try {
      return user?.profile?.medications?.join(', ') || '';
    } catch (error) {
      logger.warn('Error formatting medications', error);
      return '';
    }
  });
  const [dateOfBirth, setDateOfBirth] = useState(formatDate(user?.profile?.dateOfBirth));
  const [gender, setGender] = useState(user?.profile?.gender || '');
  
  // Follow-up state
  const [showFollowups, setShowFollowups] = useState(false);
  const [followupCount, setFollowupCount] = useState(0);
  
  const followupService = CaseFollowupService.getInstance();

  // Load follow-up count on mount
  useEffect(() => {
    trackScreen('SimpleProfileScreen', {
      isEditing,
      userRole: user?.role,
      isGuest: user?.role === 'guest',
      hasProfile: !!user?.email
    });
    
    const loadFollowupCount = async () => {
      try {
        const statistics = await followupService.getFollowupStatistics(user.id);
        setFollowupCount(statistics.pendingFollowups + statistics.overdueCases);
      } catch (error) {
        logger.error('Error loading follow-up count', error);
      }
    };

    loadFollowupCount();
  }, [user.id]);

  const handleSave = async () => {
    // Validate name
    const nameValidation = InputValidator.validateName(name, 'Name');
    if (!nameValidation.isValid) {
      Alert.alert('Invalid Name', nameValidation.error || 'Please enter a valid name');
      return;
    }
    
    // Validate email
    const emailValidation = InputValidator.validateEmail(email);
    if (!emailValidation.isValid) {
      Alert.alert('Invalid Email', emailValidation.error || 'Please enter a valid email address');
      return;
    }

    // Validate phone number
    const phoneValidation = InputValidator.validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      Alert.alert('Invalid Phone Number', phoneValidation.error || 'Please enter a valid phone number');
      return;
    }

    // Validate date of birth
    const dobValidation = InputValidator.validateDateOfBirth(dateOfBirth);
    if (!dobValidation.isValid) {
      Alert.alert('Invalid Date of Birth', dobValidation.error || 'Please enter a valid date of birth');
      return;
    }

    // Validate emergency contact name
    if (emergencyContactName) {
      const emergencyNameValidation = InputValidator.validateName(emergencyContactName, 'Emergency contact name');
      if (!emergencyNameValidation.isValid) {
        Alert.alert('Invalid Emergency Contact', emergencyNameValidation.error || 'Please enter a valid emergency contact name');
        return;
      }
    }

    // Validate emergency contact phone
    if (emergencyContactPhone) {
      const emergencyPhoneValidation = InputValidator.validatePhoneNumber(emergencyContactPhone);
      if (!emergencyPhoneValidation.isValid) {
        Alert.alert('Invalid Emergency Contact Phone', emergencyPhoneValidation.error || 'Please enter a valid emergency contact phone number');
        return;
      }
    }

    // Validate medical text fields
    const medicalHistoryValidation = InputValidator.validateMedicalText(medicalHistory, 'Medical history', 500);
    if (!medicalHistoryValidation.isValid) {
      Alert.alert('Invalid Medical History', medicalHistoryValidation.error || 'Please check your medical history information');
      return;
    }

    const allergiesValidation = InputValidator.validateMedicalText(allergies, 'Allergies', 300);
    if (!allergiesValidation.isValid) {
      Alert.alert('Invalid Allergies', allergiesValidation.error || 'Please check your allergies information');
      return;
    }

    const medicationsValidation = InputValidator.validateMedicalText(medications, 'Medications', 400);
    if (!medicationsValidation.isValid) {
      Alert.alert('Invalid Medications', medicationsValidation.error || 'Please check your medications information');
      return;
    }

    try {
      const updatedUser: User = {
        ...user,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: user.role === UserRole.GUEST ? UserRole.PATIENT : user.role,
        profile: {
          ...user.profile,
          phoneNumber: phoneNumber.trim(),
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender: gender as any,
          emergencyContact: emergencyContactName && emergencyContactPhone ? {
            name: emergencyContactName.trim(),
            relationship: 'Emergency Contact',
            phoneNumber: emergencyContactPhone.trim(),
          } : undefined,
          medicalHistory: medicalHistory ? medicalHistory.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
          allergies: allergies ? allergies.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
          medications: medications ? medications.split(',').map((item: string) => item.trim()).filter(Boolean) : [],
        },
        updatedAt: new Date(),
      };

      await authService.updateUserData(updatedUser);
      
      // TODO: Update notification settings when notification service is available
      // await notificationService.updatePreferences({
      //   emailNotifications: true,
      //   smsNotifications: false,
      // });

      setIsEditing(false);
      
      if (onProfileComplete) {
        onProfileComplete();
      }
      
      Alert.alert(
        'Profile Updated!', 
        user.role === 'guest' 
          ? 'Welcome! Your profile has been created successfully. You can now save consultations and receive notifications.'
          : 'Your profile has been updated successfully!'
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout? This will end your current session.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            onLogout();
          }
        },
      ]
    );
  };

  // Dynamic styles will be inline with colors object

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.surface}
      />
      
      {/* Fixed Header with proper platform styling */}
      <SafeAreaView edges={['top']} style={{ backgroundColor: colors.surface }}>
        <View style={[ 
          styles.header, 
          { 
            backgroundColor: colors.surface, 
            borderBottomColor: colors.border,
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
              },
              android: {
                elevation: 4,
              },
              web: {
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              },
            })
          }
        ]}>
        <TouchableOpacity 
          onPress={() => {
            try {
              onClose();
            } catch (error) {
              logger.error('Error closing profile', error);
            }
          }} 
          style={[styles.headerButton, { backgroundColor: colors.background }]}
        >
          <MaterialIcons name="close" size={24} color={colors.secondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? (user.role === UserRole.GUEST ? 'Create Profile' : 'Edit Profile') : 'Profile'}
        </Text>
        <TouchableOpacity 
          onPress={() => {
            try {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            } catch (error) {
              logger.error('Error saving/editing profile', error);
            }
          }}
          style={[styles.headerButton, { backgroundColor: colors.background }]}
        >
          <MaterialIcons name={isEditing ? "save" : "edit"} size={24} color={colors.secondary} />
        </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* Content with proper keyboard handling */}
      <KeyboardAvoidingView 
        style={[styles.container, { backgroundColor: colors.background }]} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={[styles.content, { backgroundColor: colors.background }]} 
          contentContainerStyle={[styles.contentContainer, { backgroundColor: colors.background }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={50} color="#2196F3" />
          </View>
        </View>

        {/* Basic Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Name *</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your full name"
                placeholderTextColor={colors.textSecondary}
                editable={true}
                maxLength={100}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{name}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email * (Required for notifications)</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={email}
                onChangeText={(text) => setEmail(text.toLowerCase().trim())}
                placeholder="example@email.com"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                editable={true}
                maxLength={254}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{email || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={phoneNumber}
                onChangeText={(text) => {
                  const formatted = InputValidator.formatPhoneNumberInput(text, phoneNumber);
                  setPhoneNumber(formatted);
                }}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={true}
                maxLength={20}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{phoneNumber || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Date of Birth</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={dateOfBirth}
                onChangeText={(text) => {
                  const formatted = InputValidator.formatDateInput(text, dateOfBirth);
                  setDateOfBirth(formatted);
                }}
                placeholder="DD/MM/YYYY"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                editable={true}
                maxLength={10}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{dateOfBirth || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Gender</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={gender}
                onChangeText={setGender}
                placeholder="Male / Female / Other / Prefer not to say"
                placeholderTextColor={colors.textSecondary}
                editable={true}
                maxLength={30}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{gender || 'Not provided'}</Text>
            )}
          </View>
        </View>

        {/* Emergency Contact */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Contact</Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Name</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Emergency contact full name"
                placeholderTextColor={colors.textSecondary}
                editable={true}
                maxLength={100}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{emergencyContactName || 'Not provided'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Contact Phone</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={emergencyContactPhone}
                onChangeText={(text) => {
                  const formatted = InputValidator.formatPhoneNumberInput(text, emergencyContactPhone);
                  setEmergencyContactPhone(formatted);
                }}
                placeholder="Emergency contact phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
                autoComplete="tel"
                editable={true}
                maxLength={20}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{emergencyContactPhone || 'Not provided'}</Text>
            )}
          </View>
        </View>

        {/* Medical Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Medical Information</Text>
          
          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Medical History</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.multilineInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={medicalHistory}
                onChangeText={setMedicalHistory}
                placeholder="Enter medical conditions, separated by commas"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={3}
                editable={true}
                maxLength={500}
              />
            ) : (
              medicalHistory ? (
                <Text style={[styles.value, { color: colors.text }]}>{medicalHistory}</Text>
              ) : (
                <View style={{ marginTop: 10 }}>
                  <EmptyState
                    icon="medical-services"
                    title="No Medical History"
                    message="Add your medical history to help us provide better care."
                    actionLabel="Add History"
                    onAction={() => setIsEditing(true)}
                  />
                </View>
              )
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Allergies</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.multilineInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={allergies}
                onChangeText={setAllergies}
                placeholder="Enter allergies, separated by commas"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={2}
                editable={true}
                maxLength={300}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{allergies || 'None known'}</Text>
            )}
          </View>

          <View style={styles.infoItem}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Current Medications</Text>
            {isEditing ? (
              <TextInput
                style={[styles.input, styles.multilineInput, { 
                  borderColor: colors.border, 
                  backgroundColor: colors.background,
                  color: colors.text 
                }]}
                value={medications}
                onChangeText={setMedications}
                placeholder="Enter current medications, separated by commas"
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={3}
                editable={true}
                maxLength={400}
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>{medications || 'None'}</Text>
            )}
          </View>
        </View>

        {!isEditing && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Role</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user.role === UserRole.GUEST ? 'Guest User' : 
                 user.role === UserRole.PATIENT ? 'Patient' :
                 user.role === UserRole.DOCTOR ? 'Medical Professional' : user.role}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Member Since</Text>
              <Text style={[styles.value, { color: colors.text }]}>
                {user.createdAt 
                  ? (user.createdAt instanceof Date 
                      ? user.createdAt.toLocaleDateString() 
                      : new Date(user.createdAt).toLocaleDateString())
                  : 'N/A'}
              </Text>
            </View>
          </View>
        )}

        {/* App Info */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>About MediBot</Text>
          <Text style={[styles.appInfo, { color: colors.textSecondary }]}>
            MediBot is an AI-powered healthcare assistant designed to provide health information 
            and guidance. It helps you understand symptoms, provides self-care recommendations, 
            and guides you on when to seek professional medical attention.
          </Text>
          <Text style={[styles.disclaimer, { color: colors.error }]}>
            ⚠️ Important: MediBot provides educational information only and should not replace 
            professional medical advice, diagnosis, or treatment.
          </Text>
        </View>

        {/* Health Management */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.followupButton, { backgroundColor: colors.primary }]} 
            onPress={() => setShowFollowups(true)}
          >
            <MaterialIcons name="healing" size={20} color="#FFFFFF" />
            <View style={styles.followupButtonText}>
              <Text style={styles.followupButtonTitle}>Health Follow-ups</Text>
              {followupCount > 0 && (
                <Text style={styles.followupCount}>
                  {followupCount} pending
                </Text>
              )}
            </View>
            {followupCount > 0 && (
              <View style={styles.followupBadge}>
                <Text style={styles.followupBadgeText}>{followupCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.casesButton, { 
              backgroundColor: '#4CAF50',
              marginTop: 12,
            }]} 
            onPress={() => {
              if ((navigation as any).navigate) {
                (navigation as any).navigate('MedicalCases', { userId: user.id });
              }
            }}
          >
            <MaterialIcons name="folder" size={20} color="#FFFFFF" />
            <View style={styles.followupButtonText}>
              <Text style={styles.followupButtonTitle}>My Medical Cases</Text>
              <Text style={styles.followupCount}>
                View and manage your health records
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: colors.error }]} 
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Follow-up Screen Modal */}
      {showFollowups && (
        <FollowupScreen
          userId={user.id}
          userEmail={user.email}
          onClose={() => {
            setShowFollowups(false);
            // Reload follow-up count when modal closes
            followupService.getFollowupStatistics(user.id).then(stats => {
              setFollowupCount(stats.pendingFollowups + stats.overdueCases);
            }).catch(error => logger.error('Error reloading follow-up count', error));
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // Ensure header doesn't overlap with status bar
    minHeight: 60,
    zIndex: 1000,
    // Prevent layout shifts
    position: 'relative',
    ...Platform.select({
      web: {
        // Ensure proper positioning on web
        position: 'sticky' as any,
        top: 0,
      },
    }),
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
    minWidth: 40,
    minHeight: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 20,
    paddingBottom: 40, // Add extra bottom padding for safe scrolling
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  infoItem: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    fontSize: 16,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    // Fix keyboard overlay issues
    ...Platform.select({
      ios: {
        minHeight: 44,
      },
      android: {
        minHeight: 48,
      },
      web: {
        minHeight: 40,
        outline: 'none',
      },
    }),
  },
  multilineInput: {
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
    paddingVertical: 16,
  },
  appInfo: {
    fontSize: 14,
    lineHeight: 20,
    color: '#666',
    marginBottom: 12,
  },
  disclaimer: {
    fontSize: 12,
    lineHeight: 16,
    color: '#FF6B35',
    fontStyle: 'italic',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  followupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  casesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  followupButtonText: {
    flex: 1,
    marginLeft: 12,
  },
  followupButtonTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  followupCount: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  followupBadge: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  followupBadgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

const SimpleProfileScreenWithErrorBoundary: React.FC<SimpleProfileScreenProps> = (props) => (
  <ErrorBoundary>
    <SimpleProfileScreen {...props} />
  </ErrorBoundary>
);

export default SimpleProfileScreenWithErrorBoundary;