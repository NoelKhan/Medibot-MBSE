import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme } from '../contexts/ThemeContext';
import { authService } from '../services/auth';
import EmergencyService from '../services/EmergencyService';
import CaseMockService from '../services/CaseMockService';
import { StaffUser } from '../types/Booking';
import { User } from '../types/User';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';

const logger = createLogger('MedicalStaffWelcomeScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'MedicalStaffWelcome'>;

const MedicalStaffWelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [caseStats, setCaseStats] = useState({ total: 0, urgent: 0, pending: 0 });
  
  const emergencyService = EmergencyService.getInstance();
  const caseMockService = CaseMockService.getInstance();
  
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    trackScreen('MedicalStaffWelcomeScreen', {
      hasUser: !!currentUser,
      hasStaff: !!currentStaff,
      staffRole: currentUser?.role || currentStaff?.role
    });
    
    loadStaffData();
    loadCaseStats();

    // Block hardware back button - user must logout to return to role selection
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(
        'Logout Required',
        'Please use the logout button to return to role selection.',
        [{ text: 'OK' }]
      );
      return true; // Prevent default back behavior
    });

    // Re-check staff when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadStaffData();
      loadCaseStats();
    });

    return () => {
      backHandler.remove();
      unsubscribe();
    };
  }, [navigation]);

  const loadStaffData = async () => {
    try {
      // First check AuthService for medical staff (from MedicalStaffLogin)
      const user = authService.getCurrentUser();
      if (user) {
        setCurrentUser(user as any);
        logger.info(`Medical staff loaded from AuthService: ${user.name} - ${(user as any).role}`);
        return;
      }

      // Fallback: Check EmergencyService for emergency staff
      const staff = await emergencyService.getCurrentStaff();
      if (staff) {
        setCurrentStaff(staff);
        logger.info(`Medical staff loaded from EmergencyService: ${staff.name} - ${staff.role}`);
        return;
      }

      // No staff data found
      logger.warn('No staff data found in either service');
      // Only redirect after a delay to avoid flashing
      setTimeout(() => {
        const checkAgain = authService.getCurrentUser();
        if (!checkAgain) {
          emergencyService.getCurrentStaff().then(s => {
            if (!s) {
              logger.warn('Still no staff data, redirecting to role selection');
              navigation.replace('RoleSelection');
            }
          });
        }
      }, 500);
    } catch (error) {
      logger.error('Error loading staff data', error);
      // Don't redirect on error - might be temporary
    }
  };

  const loadCaseStats = async () => {
    try {
      // Medical staff sees severity 1-4 cases
      const cases = caseMockService.getAllCases();
      const stats = caseMockService.getStatistics();
      
      setCaseStats({
        total: cases.length,
        urgent: cases.filter(c => c.severity >= 3).length,
        pending: cases.filter(c => c.status === 'pending').length,
      });
    } catch (error) {
      logger.error('Error loading case stats', error);
    }
  };

  const handleLogout = () => {
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
              // Logout from both services to be safe
              await authService.logout();
              await emergencyService.logoutStaff();
              navigation.replace('RoleSelection');
            } catch (error) {
              logger.error('Logout error', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          }
        }
      ]
    );
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return 'light-mode';
      case 'dark': return 'dark-mode';
      default: return 'brightness-auto';
    }
  };

  const getRoleIcon = () => {
    if (currentUser) {
      return 'medical-services'; // Default for medical staff from AuthService
    }
    if (!currentStaff) return 'medical-services';
    switch (currentStaff.role) {
      case 'doctor': return 'medical-services';
      case 'nurse': return 'local-hospital';
      case 'admin': return 'admin-panel-settings';
      default: return 'badge';
    }
  };

  const getRoleColor = () => {
    if (currentUser) {
      return colors.secondary; // Default theme color for medical staff
    }
    if (!currentStaff) return colors.primary;
    switch (currentStaff.role) {
      case 'doctor': return colors.secondary;
      case 'nurse': return colors.success;
      case 'admin': return colors.warning;
      default: return colors.primary;
    }
  };

  const getStaffName = () => {
    if (currentUser) return currentUser.name;
    if (currentStaff) return currentStaff.name;
    return 'Loading...';
  };

  const getStaffRole = () => {
    if (currentUser) {
      return `${currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1)} • ${currentUser.email}`;
    }
    if (currentStaff) {
      return `${currentStaff.role.charAt(0).toUpperCase() + currentStaff.role.slice(1)} • Badge: ${currentStaff.badgeNumber}`;
    }
    return '';
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDark ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={{ width: 24 }} />
        <Text style={styles.headerTitle}>Medical Staff Portal</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={toggleTheme} style={styles.iconButton}>
            <MaterialIcons name={getThemeIcon()} size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
            <MaterialIcons name="logout" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Staff Info Banner */}
      <View style={[styles.staffBanner, { backgroundColor: colors.surface }]}>
        <View style={styles.staffInfo}>
          <MaterialIcons name={getRoleIcon()} size={28} color={getRoleColor()} />
          <View style={styles.staffDetails}>
            <Text style={styles.staffName}>{getStaffName()}</Text>
            {(currentUser || currentStaff) && (
              <Text style={styles.staffRole}>{getStaffRole()}</Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        {caseStats.total === 0 ? (
          <EmptyState
            icon="medical-services"
            title="No Cases Assigned"
            message="You have no medical cases assigned at this time. New cases will appear here when assigned."
            actionLabel="Refresh"
            onAction={loadCaseStats}
          />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}> 
                <MaterialIcons name="folder" size={32} color="#2196F3" />
                <Text style={styles.statNumber}>{caseStats.total}</Text>
                <Text style={styles.statLabel}>Total Cases</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="warning" size={32} color="#FF9500" />
                <Text style={styles.statNumber}>{caseStats.urgent}</Text>
                <Text style={styles.statLabel}>Urgent Cases</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.card }]}>
                <MaterialIcons name="pending" size={32} color="#34C759" />
                <Text style={styles.statNumber}>{caseStats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
            </View>

            {/* Main Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              {/* View Cases Dashboard */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('StaffDashboard', {})}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="dashboard" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: '#FFFFFF' }]}>Case Dashboard</Text>
                  <Text style={[styles.actionDescription, { color: 'rgba(255,255,255,0.8)' }]}>
                    View and manage all medical cases (Severity 1-4)
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Triage Queue */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  if (currentStaff) {
                    navigation.navigate('MedicalStaffTriage', { staff: currentStaff as any });
                  } else {
                    Alert.alert('Error', 'Staff data not loaded');
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                  <MaterialIcons name="medical-services" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Triage Queue</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    Assess and prioritize incoming cases
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Chat with Patients */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  if (currentStaff) {
                    navigation.navigate('Chat', { user: currentStaff as any });
                  } else {
                    Alert.alert('Error', 'Staff data not loaded');
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.success }]}>
                  <MaterialIcons name="chat" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Patient Consultations</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    Chat and follow up with patients
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Patient Records */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('PatientRecords')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#8E44AD' }]}>
                  <MaterialIcons name="folder" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Patient Records</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    View all patient records and medical history
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* My Schedule */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('StaffSchedule')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#3498DB' }]}>
                  <MaterialIcons name="calendar-today" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>My Schedule</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    View shifts and appointments
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Analytics */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('StaffAnalytics')}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#E74C3C' }]}>
                  <MaterialIcons name="analytics" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Analytics</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    View performance metrics and statistics
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* View Profile */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => navigation.navigate('StaffProfile', {})}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.secondary }]}>
                  <MaterialIcons name="person" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>My Profile</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    View credentials and settings
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* API Testing */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface, borderWidth: 2, borderColor: colors.warning }]}
                onPress={() => navigation.navigate('ApiTest')}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                  <MaterialIcons name="bug-report" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>API Testing</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    Test backend endpoints and integrations
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Info Section */}
            <View style={[styles.infoSection, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="info-outline" size={24} color={colors.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoTitle, { color: colors.text }]}>Medical Staff Access</Text>
                <Text style={[styles.infoDescription, { color: colors.textSecondary }]}>
                  As medical staff, you have access to cases with severity levels 1-4 (Low to Urgent). 
                  Critical emergency cases (Level 5) are handled by emergency operations staff.
                </Text>
              </View>
            </View>

            <View style={styles.bottomSpacer} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: colors.card,
  },
  staffBanner: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  staffDetails: {
    flex: 1,
  },
  staffName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  staffRole: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: isDark ? 'rgba(0,0,0,0.5)' : colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  actionsContainer: {
    marginTop: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: isDark ? 'rgba(0,0,0,0.5)' : colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    marginLeft: 16,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  actionDescription: {
    fontSize: 13,
  },
  infoSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 40,
  },
});

const MedicalStaffWelcomeScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <MedicalStaffWelcomeScreen {...props} />
  </ErrorBoundary>
);

export default MedicalStaffWelcomeScreenWithErrorBoundary;
