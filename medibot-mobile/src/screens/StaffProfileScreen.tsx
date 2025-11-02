/**
 * STAFF PROFILE SCREEN
 * Full profile management for medical and emergency staff
 * Replaces the temporary alerts in welcome screens
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { useResponsive } from '../hooks/useResponsive';
import { StaffUser } from '../types/Booking';
import { authService } from '../services/auth';
import ErrorBoundary from '../components/ErrorBoundary';
import EmptyState from '../components/EmptyState';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('StaffProfileScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'StaffProfile'>;

const StaffProfileScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const responsive = useResponsive();
  const styles = createStyles(colors, isDark, responsive);
  
  const [staff, setStaff] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [specializations, setSpecializations] = useState<string[]>([]);

  useEffect(() => {
    trackScreen('StaffProfileScreen', {
      editing,
      hasStaff: !!staff
    });
    
    loadStaffProfile();
  }, []);

  const loadStaffProfile = async () => {
    try {
      setLoading(true);
      const currentUser = authService.getCurrentUser();

      if (currentUser && 'badgeNumber' in currentUser) {
        const staffUser = currentUser as unknown as StaffUser;
        setStaff(staffUser);
        setName(staffUser.name || '');
        setEmail(staffUser.email || '');
        setDepartment(staffUser.department || '');
        setSpecializations(staffUser.specializations || []);
      } else {
        Alert.alert('Error', 'Staff profile not found', [
          { text: 'Go Back', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      logger.error('Error loading staff profile', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate inputs
      if (!name.trim()) {
        Alert.alert('Validation Error', 'Name is required');
        return;
      }

      if (!email.trim()) {
        Alert.alert('Validation Error', 'Email is required');
        return;
      }

      // Update staff object
      if (staff) {
        const updatedStaff: StaffUser = {
          ...staff,
          name: name.trim(),
          email: email.trim(),
          department: department.trim(),
          specializations: specializations,
        };

        // TODO: Save to backend
        // await staffService.updateProfile(updatedStaff);

        setStaff(updatedStaff);
        setEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      }
    } catch (error) {
      logger.error('Error saving profile', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (staff) {
      setName(staff.name || '');
      setEmail(staff.email || '');
      setDepartment(staff.department || '');
      setSpecializations(staff.specializations || []);
    }
    setEditing(false);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'doctor':
        return colors.primary;
      case 'nurse':
        return colors.info;
      case 'emergency_staff':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return 'local-hospital';
      case 'nurse':
        return 'healing';
      case 'emergency_staff':
        return 'emergency';
      default:
        return 'person';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!staff) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Staff Profile</Text>
          <View style={{ width: 40 }} />
        </View>
        <EmptyState
          icon="person-outline"
          title="Profile Incomplete"
          message="Complete your staff profile to access all features and manage your account."
          actionLabel="Complete Profile"
          onAction={() => {
            setEditing(true);
            loadStaffProfile();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Staff Profile</Text>
        {!editing && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setEditing(true)}
          >
            <MaterialIcons name="edit" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}
        {editing && <View style={{ width: 40 }} />}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <MaterialIcons 
              name={getRoleIcon(staff.role)} 
              size={60} 
              color={colors.surface} 
            />
          </View>
          
          <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(staff.role) }]}>
            <Text style={styles.roleBadgeText}>
              {staff.role.replace('_', ' ').toUpperCase()}
            </Text>
          </View>

          <Text style={styles.badgeNumber}>Badge: {staff.badgeNumber}</Text>
        </View>

        {/* Profile Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Full Name *</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.fieldValue}>{name || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email *</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text style={styles.fieldValue}>{email || 'Not set'}</Text>
            )}
          </View>
        </View>

        {/* Professional Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Professional Information</Text>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Department</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={department}
                onChangeText={setDepartment}
                placeholder="e.g., Cardiology, Emergency"
                placeholderTextColor={colors.textSecondary}
              />
            ) : (
              <Text style={styles.fieldValue}>{department || 'Not set'}</Text>
            )}
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Specializations</Text>
            <Text style={styles.fieldValue}>
              {specializations.length > 0 ? specializations.join(', ') : 'Not set'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Certifications</Text>
            <Text style={styles.fieldValue}>
              {staff.certifications?.length > 0 ? staff.certifications.join(', ') : 'Not set'}
            </Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Shift</Text>
            <Text style={styles.fieldValue}>
              {staff.shift?.toUpperCase() || 'Not set'}
            </Text>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <MaterialIcons name="assignment" size={32} color={colors.primary} />
              <Text style={styles.statValue}>{staff.activeCases?.length || 0}</Text>
              <Text style={styles.statLabel}>Active Cases</Text>
            </View>

            <View style={styles.statCard}>
              <MaterialIcons name="schedule" size={32} color={colors.info} />
              <Text style={styles.statValue}>
                {staff.status?.toUpperCase() || 'OFFLINE'}
              </Text>
              <Text style={styles.statLabel}>Status</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {editing && (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              disabled={saving}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, styles.saveButton]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Guest Mode Notice */}
        <View style={styles.noticeCard}>
          <MaterialIcons name="info" size={20} color={colors.warning} />
          <Text style={styles.noticeText}>
            Staff accounts do not support guest mode. All credentials are pre-configured and managed by hospital administration.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean, responsive: any) => {
  const isLandscape = responsive.isLandscape;
  const isTablet = responsive.isTablet;
  const contentPadding = isTablet ? 24 : 16;

  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: isTablet ? 17 : 16,
    color: colors.text,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: contentPadding,
  },
  errorText: {
    fontSize: isTablet ? 19 : 18,
    color: colors.error,
    marginTop: 16,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: contentPadding,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: isTablet ? 22 : 20,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  editButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  roleBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  roleBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  badgeNumber: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  section: {
    padding: 20,
    backgroundColor: colors.surface,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 16,
  },
  field: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.surface,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: colors.warning + '20',
    marginHorizontal: contentPadding,
    marginTop: 16,
    padding: contentPadding,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  noticeText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
});
};

const StaffProfileScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <StaffProfileScreen {...props} />
  </ErrorBoundary>
);

export default StaffProfileScreenWithErrorBoundary;
