/**
 * USER PROFILE MANAGEMENT SCREEN
 * 
 * Comprehensive user profile management including:
 * - Medical history management
 * - Current medications tracking
 * - Allergies and reactions
 * - Emergency contacts
 * - Case history and tracking
 * - Account settings and preferences
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackHandler } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { PatientUser, MedicalHistory, Medication, Allergy, MedicalCase, StaffUser } from '../types/Booking';
import UserAuthService from '../services/UserAuthService'; // TODO: Remove after migrating getUserCases to CaseService
import { authService } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import { createLogger } from '../services/Logger';
import { Analytics, trackScreen } from '../services/Analytics';

const logger = createLogger('UserProfileScreen');

interface UserProfileScreenProps {
  navigation: any;
  route: {
    params: {
      user: PatientUser | StaffUser | any;
      isNewUser?: boolean;
      focus?: 'contact' | string;
    };
  };
}

type ProfileSection = 'overview' | 'medical' | 'medications' | 'allergies' | 'cases' | 'settings' | 'contact';

// Type guard to check if user is a PatientUser
const isPatientUser = (user: any): user is PatientUser => {
  return user && (
    user.userType === 'registered' || 
    user.userType === 'guest' || 
    'activeCases' in user ||
    'currentMedications' in user
  );
};

// Type guard to check if user is a StaffUser
const isStaffUser = (user: any): user is StaffUser => {
  return user && ('role' in user && (user.role === 'doctor' || user.role === 'nurse' || user.role === 'admin' || user.role === 'emergency_operator' || user.role === 'paramedic'));
};

// Type guard to check if user is a simple User (from User.ts)
const isSimpleUser = (user: any): boolean => {
  return user && 'authStatus' in user && !('userType' in user) && !('activeCases' in user);
};

// Convert simple User to PatientUser format
const convertToPatientUser = (user: any): PatientUser => {
  // If already PatientUser, return as is
  if (isPatientUser(user)) {
    return user;
  }

  // Convert User to PatientUser
  return {
    id: user.id,
    name: user.name,
    email: user.email || undefined,
    phone: user.profile?.phoneNumber || undefined,
    userType: user.role === 'guest' ? 'guest' : 'registered',
    accountStatus: user.role === 'guest' ? 'guest' : 'active',
    dateOfBirth: user.profile?.dateOfBirth || undefined,
    gender: user.profile?.gender || undefined,
    createdAt: user.createdAt || new Date(),
    lastLoginAt: new Date(),
    lastActivity: new Date(),
    address: {
      street: '',
      city: '',
      state: '',
      postcode: '',
      country: '',
    },
    emergencyContacts: user.profile?.emergencyContact ? [{
      id: '1',
      name: user.profile.emergencyContact.name,
      relationship: user.profile.emergencyContact.relationship,
      phoneNumber: user.profile.emergencyContact.phoneNumber,
      isPrimary: true,
    }] : [],
    medicalHistory: (user.profile?.medicalHistory || []).map((condition: string, index: number) => ({
      id: `mh-${index}`,
      condition,
      diagnosedDate: new Date(),
      status: 'active' as const,
      severity: 'moderate' as const,
      notes: '',
    })),
    allergies: (user.profile?.allergies || []).map((allergen: string, index: number) => ({
      id: `al-${index}`,
      allergen,
      severity: 'moderate' as const,
      reaction: '',
      diagnosedDate: new Date(),
    })),
    currentMedications: (user.profile?.medications || []).map((name: string, index: number) => ({
      id: `med-${index}`,
      name,
      dosage: '',
      frequency: 'daily' as const,
      startDate: new Date(),
      prescribedBy: '',
      purpose: '',
      sideEffects: [],
    })),
    activeCases: [],
    caseHistory: [],
    totalCases: 0,
    preferences: {
      language: 'en',
      notifications: {
        email: true,
        sms: false,
        push: true,
      },
      privacySettings: {
        shareWithStaff: true,
        shareWithDoctors: true,
        dataRetention: '5-years' as const,
      },
    },
    verification: {
      emailVerified: false,
      phoneVerified: false,
      identityVerified: false,
    },
  };
};

const UserProfileScreen: React.FC<UserProfileScreenProps> = ({ navigation, route }) => {
  const { user: initialUser, isNewUser, focus } = route.params;
  const insets = useSafeAreaInsets();
  const { theme, colors } = useTheme();
  const styles = createStyles(colors);

  // Redirect staff users to a different screen or show staff-specific profile
  useEffect(() => {
    if (isStaffUser(initialUser)) {
      Alert.alert(
        'Staff Profile',
        'Staff profile management is currently under development. Please use the staff dashboard for now.',
        [
          {
            text: 'Go Back',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
  }, [initialUser]);

  // Convert to PatientUser if needed
  const patientUser = convertToPatientUser(initialUser);
  
  const [user, setUser] = useState<PatientUser>(patientUser);
  const [activeSection, setActiveSection] = useState<ProfileSection>('overview');
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userAuthService = UserAuthService.getInstance();

  // Contact editing state (moved to top-level to follow hooks rules)
  const [contactPhone, setContactPhone] = useState<string | undefined>(user.phone || '');
  const [contactEmName, setContactEmName] = useState<string>(user.emergencyContacts?.[0]?.name || '');
  const [contactEmPhone, setContactEmPhone] = useState<string>(user.emergencyContacts?.[0]?.phoneNumber || '');

  useEffect(() => {
    trackScreen('UserProfileScreen', { 
      userType: user.userType,
      isNewUser: isNewUser || false 
    });
    loadUserCases();
    if (isNewUser) {
      Alert.alert(
        'Welcome to MediBot!',
        'Please take a moment to set up your medical profile. This information helps provide more personalized and accurate health assistance.',
        [
          { text: 'Skip for Now' },
          { text: 'Set Up Profile', onPress: () => setActiveSection('medical') }
        ]
      );
    }
    // If opened with a focus param (e.g. from chat), switch to contact section
    if (focus === 'contact') {
      setActiveSection('contact');
    }
  }, [focus]);

  // Handle hardware back: when in contact section, close it first instead of leaving screen
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (activeSection === 'contact') {
        if (navigation && navigation.canGoBack && navigation.canGoBack()) {
          navigation.goBack();
        } else {
          setActiveSection('overview');
        }
        return true;
      }
      return false;
    });

    return () => sub.remove();
  }, [activeSection, navigation]);

  const saveContactInfo = async () => {
    try {
      const updatedUser: PatientUser = {
        ...user,
        phone: contactPhone || undefined,
        emergencyContacts: contactEmName && contactEmPhone ? [{
          id: user.emergencyContacts?.[0]?.id || '1',
          name: contactEmName,
          relationship: user.emergencyContacts?.[0]?.relationship || 'Emergency Contact',
          phoneNumber: contactEmPhone,
          isPrimary: true,
        }] : [],
      } as PatientUser;

      await authService.updateUserData(updatedUser);
      setUser(updatedUser);
      Alert.alert('Saved', 'Contact information updated successfully');
    } catch (err) {
      logger.error('Failed to save contact info', err);
      Alert.alert('Error', 'Failed to update contact info. Please try again.');
    }
  };

  const renderContactSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Contact Information</Text>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.fieldLabel}>Phone</Text>
        <TextInput value={contactPhone} onChangeText={setContactPhone} style={styles.textInput} keyboardType="phone-pad" />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.fieldLabel}>Emergency Contact Name</Text>
        <TextInput value={contactEmName} onChangeText={setContactEmName} style={styles.textInput} />
      </View>

      <View style={{ marginBottom: 12 }}>
        <Text style={styles.fieldLabel}>Emergency Contact Phone</Text>
        <TextInput value={contactEmPhone} onChangeText={setContactEmPhone} style={styles.textInput} keyboardType="phone-pad" />
      </View>

      <TouchableOpacity onPress={saveContactInfo} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Contact Info</Text>
      </TouchableOpacity>
    </View>
  );

  const loadUserCases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const userCases = userAuthService.getUserCases(user.id, true);
      setCases(userCases);
    } catch (error) {
      logger.error('Failed to load cases', error);
      setError('Failed to load your cases. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderOverviewSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Profile Overview</Text>
      
      <View style={styles.overviewCard}>
        <View style={styles.overviewHeader}>
          <MaterialIcons name="person" size={40} color={colors.primary} />
          <View style={styles.overviewInfo}>
            <Text style={styles.overviewName}>{user.name}</Text>
            <Text style={styles.overviewType}>{user.userType === 'registered' ? 'Registered User' : 'Guest User'}</Text>
            {user.email && <Text style={styles.overviewEmail}>{user.email}</Text>}
          </View>
        </View>
        
        <View style={styles.overviewStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.activeCases.length}</Text>
            <Text style={styles.statLabel}>Active Cases</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.totalCases}</Text>
            <Text style={styles.statLabel}>Total Cases</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.currentMedications.length}</Text>
            <Text style={styles.statLabel}>Medications</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{user.allergies.length}</Text>
            <Text style={styles.statLabel}>Allergies</Text>
          </View>
        </View>
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.quickActionsTitle}>Quick Actions</Text>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('Chat', { user })}
        >
          <MaterialIcons name="chat" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>Start New Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => setActiveSection('cases')}
        >
          <MaterialIcons name="assignment" size={20} color={colors.primary} />
          <Text style={styles.quickActionText}>View Case History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => navigation.navigate('EmergencyCall', { user })}
        >
          <MaterialIcons name="emergency" size={20} color={colors.error} />
          <Text style={[styles.quickActionText, { color: colors.error }]}>Emergency Call</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderMedicalHistorySection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Medical History</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
        >
          <MaterialIcons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {user.medicalHistory.length === 0 ? (
        <EmptyState
          icon="healing"
          title="No medical history recorded"
          message="Add conditions to help provide better care"
        />
      ) : (
        <FlatList
          data={user.medicalHistory}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.historyItem}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyCondition}>{item.condition}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.historyDate}>
                Diagnosed: {item.diagnosedDate.toLocaleDateString()}
              </Text>
              <Text style={styles.historySeverity}>Severity: {item.severity}</Text>
              {item.notes && <Text style={styles.historyNotes}>{item.notes}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );

  const renderMedicationsSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Current Medications</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
        >
          <MaterialIcons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {user.currentMedications.length === 0 ? (
        <EmptyState
          icon="medication"
          title="No medications recorded"
          message="Add current medications for safety checks"
        />
      ) : (
        <FlatList
          data={user.currentMedications.filter(med => med.status === 'active')}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.medicationItem}>
              <View style={styles.medicationHeader}>
                <Text style={styles.medicationName}>{item.name}</Text>
                <Text style={styles.medicationDosage}>{item.dosage}</Text>
              </View>
              <Text style={styles.medicationFrequency}>{item.frequency}</Text>
              <Text style={styles.medicationPurpose}>For: {item.purpose}</Text>
              {item.instructions && (
                <Text style={styles.medicationInstructions}>{item.instructions}</Text>
              )}
            </View>
          )}
        />
      )}
    </View>
  );

  const renderAllergiesSection = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Allergies & Reactions</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            setEditingItem(null);
            setShowAddModal(true);
          }}
        >
          <MaterialIcons name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {user.allergies.length === 0 ? (
        <EmptyState
          icon="warning"
          title="No allergies recorded"
          message="Add known allergies for safety"
        />
      ) : (
        <FlatList
          data={user.allergies}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.allergyItem}>
              <View style={styles.allergyHeader}>
                <Text style={styles.allergyName}>{item.allergen}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
                  <Text style={styles.severityText}>{item.severity}</Text>
                </View>
              </View>
              <Text style={styles.allergyReactions}>
                Reactions: {item.reactions.join(', ')}
              </Text>
              {item.notes && <Text style={styles.allergyNotes}>{item.notes}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );

  const renderCasesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Case History</Text>
      
      {cases.length === 0 ? (
        <EmptyState
          icon="assignment"
          title="No cases yet"
          message="Start a chat to create your first case"
        />
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.caseItem}
              onPress={() => navigation.navigate('CaseDetail', { case: item })}
            >
              <View style={styles.caseHeader}>
                <Text style={styles.caseTitle}>{item.title}</Text>
                <View style={[styles.statusBadge, { backgroundColor: getCaseStatusColor(item.status) }]}>
                  <Text style={styles.statusText}>{item.status}</Text>
                </View>
              </View>
              <Text style={styles.caseTicket}>#{item.ticketNumber}</Text>
              <Text style={styles.caseDate}>
                Created: {item.createdAt.toLocaleDateString()}
              </Text>
              <Text style={styles.caseSymptoms}>
                Symptoms: {item.symptoms.slice(0, 2).join(', ')}
                {item.symptoms.length > 2 && ` +${item.symptoms.length - 2} more`}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );

  const renderSettingsSection = () => {
    // Ensure preferences exist with defaults
    const notifications = user.preferences?.notifications || { email: true, sms: false, push: true };
    const privacySettings = user.preferences?.privacySettings || { 
      shareWithStaff: true, 
      shareWithDoctors: true, 
      dataRetention: '5-years' as const 
    };

    return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Account Settings</Text>
      
      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>📬 Notification Preferences</Text>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="notifications-active" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Push Notifications</Text>
          </View>
          <Switch
            value={notifications.push}
            onValueChange={(value) => {
              setUser(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  notifications: {
                    ...prev.preferences.notifications,
                    push: value
                  }
                }
              }));
            }}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="email" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Email Notifications</Text>
          </View>
          <Switch
            value={notifications.email}
            onValueChange={(value) => {
              setUser(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  notifications: {
                    ...prev.preferences.notifications,
                    email: value
                  }
                }
              }));
            }}
          />
        </View>
        
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="sms" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>SMS Notifications</Text>
          </View>
          <Switch
            value={notifications.sms}
            onValueChange={(value) => {
              setUser(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  notifications: {
                    ...prev.preferences.notifications,
                    sms: value
                  }
                }
              }));
            }}
          />
        </View>

        <View style={styles.settingDescription}>
          <Text style={styles.settingDescriptionText}>
            📅 Appointment Reminders: You'll receive notifications 24 hours and 1 hour before scheduled appointments
          </Text>
        </View>
        
        <View style={styles.settingDescription}>
          <Text style={styles.settingDescriptionText}>
            💊 Medication Reminders: Set up medication schedules in your profile to receive timely reminders
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.linkButton}
          onPress={() => navigation.navigate('NotificationSettings', { user })}
        >
          <MaterialIcons name="settings" size={20} color={colors.primary} />
          <Text style={styles.linkButtonText}>Advanced Notification Settings</Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.linkButton, { backgroundColor: colors.primary + '10', marginTop: 8 }]}
          onPress={() => navigation.navigate('Reminders', { userId: user.id })}
        >
          <MaterialIcons name="alarm" size={20} color={colors.primary} />
          <Text style={[styles.linkButtonText, { color: colors.primary, fontWeight: '600' }]}>
            Manage My Reminders
          </Text>
          <MaterialIcons name="chevron-right" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsGroup}>
        <Text style={styles.settingsGroupTitle}>🔒 Privacy</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="people" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Share with Staff</Text>
          </View>
          <Switch
            value={privacySettings.shareWithStaff}
            onValueChange={(value) => {
              setUser(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  privacySettings: {
                    ...prev.preferences.privacySettings,
                    shareWithStaff: value
                  }
                }
              }));
            }}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingLabelContainer}>
            <MaterialIcons name="medical-services" size={20} color={colors.primary} />
            <Text style={styles.settingLabel}>Share with Doctors</Text>
          </View>
          <Switch
            value={privacySettings.shareWithDoctors}
            onValueChange={(value) => {
              setUser(prev => ({
                ...prev,
                preferences: {
                  ...prev.preferences,
                  privacySettings: {
                    ...prev.preferences.privacySettings,
                    shareWithDoctors: value
                  }
                }
              }));
            }}
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => {
          Alert.alert(
            'Logout',
            'Are you sure you want to logout?',
            [
              { text: 'Cancel' },
              {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                  await authService.logout();
                  // Force navigation to RoleSelection
                  navigation.replace('RoleSelection');
                }
              }
            ]
          );
        }}
      >
        <MaterialIcons name="logout" size={20} color={colors.error} />
        <Text style={[styles.logoutText]}>Logout</Text>
      </TouchableOpacity>
    </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.error;
      case 'managed': return colors.warning;
      case 'resolved': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'life-threatening': return colors.error;
      case 'severe': return colors.error;
      case 'moderate': return colors.warning;
      case 'mild': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getCaseStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.error;
      case 'in-progress': return colors.warning;
      case 'resolved': return colors.success;
      case 'closed': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview': return renderOverviewSection();
      case 'contact': return renderContactSection();
      case 'medical': return renderMedicalHistorySection();
      case 'medications': return renderMedicationsSection();
      case 'allergies': return renderAllergiesSection();
      case 'cases': return renderCasesSection();
      case 'settings': return renderSettingsSection();
      default: return renderOverviewSection();
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadUserCases} />;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
  <View style={[styles.header, { paddingTop: Math.max(insets.top, 16) }]}> 
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
  <Text style={styles.headerTitle}>{(focus === 'contact' || activeSection === 'contact') ? 'Contact Information' : 'User Profile'}</Text>
        {activeSection === 'contact' ? (
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => {
              if (navigation && navigation.canGoBack && navigation.canGoBack()) navigation.goBack();
              else setActiveSection('overview');
            }}
          >
            <MaterialIcons name="close" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => navigation.navigate('Chat', { user })}
          >
            <MaterialIcons name="chat" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.navigationTabs}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'overview', label: 'Overview', icon: 'dashboard' },
            { key: 'medical', label: 'Medical', icon: 'healing' },
            { key: 'medications', label: 'Medications', icon: 'medication' },
            { key: 'allergies', label: 'Allergies', icon: 'warning' },
            { key: 'cases', label: 'Cases', icon: 'assignment' },
            { key: 'contact', label: 'Contact', icon: 'contact-phone' },
            { key: 'settings', label: 'Settings', icon: 'settings' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.navigationTab,
                activeSection === tab.key && styles.navigationTabActive
              ]}
              onPress={() => setActiveSection(tab.key as ProfileSection)}
            >
              <MaterialIcons
                name={tab.icon as any}
                size={20}
                color={activeSection === tab.key ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.navigationTabText,
                  activeSection === tab.key && styles.navigationTabTextActive
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderSectionContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    zIndex: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  chatButton: {
    padding: 8,
  },
  navigationTabs: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 8,
  },
  navigationTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  navigationTabActive: {
    backgroundColor: colors.primaryLight + '20',
  },
  navigationTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.textSecondary,
    marginLeft: 6,
  },
  navigationTabTextActive: {
    color: colors.primary,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewInfo: {
    marginLeft: 16,
    flex: 1,
  },
  overviewName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  overviewType: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overviewEmail: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quickActions: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  quickActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderRadius: 8,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginLeft: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.textSecondary,
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  historyItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyCondition: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  historyDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  historySeverity: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  historyNotes: {
    fontSize: 14,
    color: colors.text,
    fontStyle: 'italic',
  },
  medicationItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  medicationName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  medicationDosage: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  medicationFrequency: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  medicationPurpose: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  medicationInstructions: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  allergyItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  allergyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  allergyName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  allergyReactions: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 4,
  },
  allergyNotes: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  caseItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  caseTicket: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
    marginBottom: 4,
  },
  caseDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  caseSymptoms: {
    fontSize: 14,
    color: colors.text,
  },
  settingsGroup: {
    marginBottom: 24,
  },
  settingsGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 8,
  },
  settingLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingDescription: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.surface + '80',
    borderRadius: 8,
    marginBottom: 12,
  },
  settingDescriptionText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  linkButtonText: {
    flex: 1,
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: 16,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.error,
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  saveButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const UserProfileScreenWithErrorBoundary: React.FC<UserProfileScreenProps> = (props) => (
  <ErrorBoundary>
    <UserProfileScreen {...props} />
  </ErrorBoundary>
);

export default UserProfileScreenWithErrorBoundary;