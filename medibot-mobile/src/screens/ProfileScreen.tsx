import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  BackHandler,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { showAlert } from '../components/CrossPlatformAlert';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { User, UserRole } from '../types/User';
import { authService } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

const ProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const { user } = route.params;
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email || '');
  const [phoneNumber, setPhoneNumber] = useState(user.profile?.phoneNumber || '');
  const [emergencyContactName, setEmergencyContactName] = useState(
    user.profile?.emergencyContact?.name || ''
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user.profile?.emergencyContact?.phoneNumber || ''
  );
  const [medicalHistory, setMedicalHistory] = useState(
    user.profile?.medicalHistory?.join(', ') || ''
  );
  const [allergies, setAllergies] = useState(
    user.profile?.allergies?.join(', ') || ''
  );
  const [notifications, setNotifications] = useState(true);

  // refs for scrolling/focusing the emergency contact section
  const scrollRef = useRef<ScrollView | null>(null);
  const contactYRef = useRef<number | null>(null);
  const focus = (route.params as any)?.focus;

  // If opened with focus=contact (from Chat), open edit mode and scroll to contact
  useEffect(() => {
    if (focus === 'contact') {
      setEditMode(true);
      const t = setTimeout(() => {
        const y = contactYRef.current;
        if (y != null && scrollRef.current) {
          scrollRef.current.scrollTo({ y: Math.max(y - 20, 0), animated: true });
        }
      }, 250);
      return () => clearTimeout(t);
    }
    return;
  }, [focus]);

  // If in edit mode, hardware back should exit edit mode first
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (editMode) {
        setEditMode(false);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [editMode]);

  const handleSave = async () => {
    try {
      const updatedUser: User = {
        ...user,
        name,
        email,
        profile: {
          ...user.profile,
          phoneNumber,
          emergencyContact: emergencyContactName ? {
            name: emergencyContactName,
            relationship: 'Emergency Contact',
            phoneNumber: emergencyContactPhone,
          } : undefined,
          medicalHistory: medicalHistory ? medicalHistory.split(',').map((item: string) => item.trim()) : [],
          allergies: allergies ? allergies.split(',').map((item: string) => item.trim()) : [],
        },
      };

      await authService.updateUserData(updatedUser);
      setEditMode(false);
      showAlert('Success', 'Profile updated successfully');
    } catch (error) {
      showAlert('Error', 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    showAlert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          },
        },
      ]
    );
  };

  const renderProfileSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: keyof typeof MaterialIcons.glyphMap,
    multiline = false
  ) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <MaterialIcons name={icon} size={20} color={colors.textSecondary} />
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {editMode ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.fieldInputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={`Enter ${label.toLowerCase()}`}
          multiline={multiline}
        />
      ) : (
        <Text style={styles.fieldValue}>{value || 'Not provided'}</Text>
      )}
    </View>
  );

  const styles = createStyles(colors, isDark);

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex1}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header with Back Navigation */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{focus === 'contact' ? 'Contact Information' : 'Profile'}</Text>
          <TouchableOpacity 
            onPress={editMode ? handleSave : () => setEditMode(true)}
            style={styles.editButton}
          >
            <MaterialIcons 
              name={editMode ? "check" : "edit"} 
              size={24} 
              color={colors.primary} 
            />
            <Text style={styles.editButtonText}>
              {editMode ? "Save" : "Edit"}
            </Text>
          </TouchableOpacity>
        </View>
        <ScrollView ref={scrollRef} style={styles.scrollView}>
        {/* User Info Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatarContainer}>
            <MaterialIcons 
              name={user.role === UserRole.DOCTOR ? 'medical-services' : 'person'} 
              size={60} 
              color={colors.primary} 
            />
          </View>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userRole}>
            {user.role === UserRole.GUEST ? 'Guest User' : 
             user.role === UserRole.DOCTOR ? 'Medical Professional' : 
             user.role === UserRole.PATIENT ? 'Patient' : user.role}
          </Text>
        </View>

        {/* Basic Information */}
        {renderProfileSection('Basic Information', (
          <>
            {renderField('Full Name', name, setName, 'person')}
            {renderField('Email', email, setEmail, 'email')}
            {renderField('Phone Number', phoneNumber, setPhoneNumber, 'phone')}
          </>
        ))}

        {/* Emergency Contact (capture layout to allow scrolling/focus) */}
        {user.role === UserRole.PATIENT && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Contact</Text>
            <View
              style={styles.sectionContent}
              onLayout={(ev) => {
                // store the Y coordinate so we can scroll to this section when requested
                contactYRef.current = ev.nativeEvent.layout.y;
              }}
            >
              {renderField('Contact Name', emergencyContactName, setEmergencyContactName, 'contact-phone')}
              {renderField('Contact Phone', emergencyContactPhone, setEmergencyContactPhone, 'phone')}
            </View>
          </View>
        )}

        {/* Medical Information */}
        {user.role === UserRole.PATIENT && renderProfileSection('Medical Information', (
          <>
            {renderField('Medical History', medicalHistory, setMedicalHistory, 'medical-services', true)}
            {renderField('Allergies', allergies, setAllergies, 'warning', true)}
          </>
        ))}

        {/* Professional Information */}
        {user.role === UserRole.DOCTOR && renderProfileSection('Professional Information', (
          <>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <MaterialIcons name="badge" size={20} color={colors.textSecondary} />
                <Text style={styles.fieldLabel}>License Number</Text>
              </View>
              <Text style={styles.fieldValue}>{user.profile?.licenseNumber || 'Not provided'}</Text>
            </View>
            <View style={styles.fieldContainer}>
              <View style={styles.fieldHeader}>
                <MaterialIcons name="work" size={20} color={colors.textSecondary} />
                <Text style={styles.fieldLabel}>Specialty</Text>
              </View>
              <Text style={styles.fieldValue}>{user.profile?.specialty || 'Not provided'}</Text>
            </View>
          </>
        ))}

        {/* Settings */}
        {renderProfileSection('Settings', (
          <View style={styles.settingItem}>
            <View style={styles.settingHeader}>
              <MaterialIcons name="notifications" size={20} color={colors.textSecondary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={notifications ? '#FFFFFF' : colors.textSecondary}
            />
          </View>
        ))}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={() => navigation.navigate('ConversationHistory', { user })}
          >
            <MaterialIcons name="history" size={20} color={styles.primaryButtonText.color} />
            <Text style={styles.primaryButtonText}>View Conversation History</Text>
          </TouchableOpacity>

          {editMode ? (
            <View style={styles.editButtons}>
              <TouchableOpacity
                style={[styles.button, styles.successButton]}
                onPress={handleSave}
              >
                <MaterialIcons name="check" size={20} color={styles.primaryButtonText.color} />
                <Text style={styles.primaryButtonText}>Save Changes</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => setEditMode(false)}
              >
                <MaterialIcons name="close" size={20} color={styles.secondaryButtonText.color} />
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.button, styles.secondaryButton]}
              onPress={() => setEditMode(true)}
            >
              <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
              <Text style={styles.secondaryButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleLogout}
          >
            <MaterialIcons name="logout" size={20} color={styles.primaryButtonText.color} />
            <Text style={styles.primaryButtonText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex1: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    paddingHorizontal: 12,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  editButtonText: {
    fontSize: 16,
    color: colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  userHeader: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  section: {
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
    fontWeight: '500',
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 28,
  },
  fieldInput: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 28,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
  },
  fieldInputMultiline: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
    marginLeft: 8,
  },
  buttonContainer: {
    padding: 16,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 12,
    flex: 1,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  successButton: {
    backgroundColor: colors.success,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButtonText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default ProfileScreen;