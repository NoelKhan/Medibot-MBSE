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
import EmergencyService from '../services/EmergencyService';
import CaseMockService from '../services/CaseMockService';
import { StaffUser } from '../types/Booking';
import { User } from '../types/User';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';

const logger = createLogger('EmergencyStaffWelcomeScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'EmergencyStaffWelcome'>;

const EmergencyStaffWelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors, isDark, theme, toggleTheme } = useTheme();
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [caseStats, setCaseStats] = useState({ total: 0, critical: 0, pending: 0 });
  
  const emergencyService = EmergencyService.getInstance();
  const caseMockService = CaseMockService.getInstance();
  
  const styles = createStyles(colors, isDark);

  useEffect(() => {
    trackScreen('EmergencyStaffWelcomeScreen', {
      hasStaff: !!currentStaff,
      staffRole: currentStaff?.role,
      staffDepartment: currentStaff?.department
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
      const staff = await emergencyService.getCurrentStaff();
      if (staff) {
        setCurrentStaff(staff);
        logger.info(`Emergency staff loaded: ${staff.name} - ${staff.role}`);
      } else {
        // Don't redirect immediately - user might just be loading
        logger.warn('No staff data found');
        // Only redirect after a delay to avoid flashing
        setTimeout(() => {
          emergencyService.getCurrentStaff().then(s => {
            if (!s) {
              logger.warn('Still no staff data, redirecting to role selection');
              navigation.replace('RoleSelection');
            }
          });
        }, 500);
      }
    } catch (error) {
      logger.error('Error loading staff data', error);
      // Don't redirect on error - might be temporary
    }
  };

  const loadCaseStats = async () => {
    try {
      // Emergency staff sees severity 4-5 cases only
      const cases = caseMockService.getEmergencyCases();
      
      setCaseStats({
        total: cases.length,
        critical: cases.filter(c => c.severity === 5).length,
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
    if (!currentStaff) return 'emergency';
    switch (currentStaff.role) {
      case 'emergency_operator': return 'phone-in-talk';
      case 'paramedic': return 'local-hospital';
      default: return 'emergency';
    }
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
        <Text style={styles.headerTitle}>Emergency Operations</Text>
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
          <MaterialIcons name={getRoleIcon()} size={28} color={colors.error} />
          <View style={styles.staffDetails}>
            <Text style={styles.staffName}>
              {currentStaff ? currentStaff.name : 'Loading...'}
            </Text>
            {currentStaff && (
              <Text style={styles.staffRole}>
                {currentStaff.role === 'emergency_operator' ? 'Emergency Operator' : 'Paramedic'} • Badge: {currentStaff.badgeNumber}
              </Text>
            )}
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        {caseStats.total === 0 ? (
          <EmptyState
            icon="emergency"
            title="No Active Emergencies"
            message="There are currently no active emergency cases. New critical cases will appear here when reported."
            actionLabel="Refresh"
            onAction={loadCaseStats}
          />
        ) : (
          <>
            <View style={styles.statsContainer}>
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="emergency" size={32} color={colors.error} />
                <Text style={styles.statNumber}>{caseStats.total}</Text>
                <Text style={styles.statLabel}>Active Cases</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="local-fire-department" size={32} color={colors.error} />
                <Text style={styles.statNumber}>{caseStats.critical}</Text>
                <Text style={styles.statLabel}>Critical (Level 5)</Text>
              </View>
              
              <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="pending-actions" size={32} color={colors.warning} />
                <Text style={styles.statNumber}>{caseStats.pending}</Text>
                <Text style={styles.statLabel}>Awaiting Response</Text>
              </View>
            </View>

            {/* Main Actions */}
            <View style={styles.actionsContainer}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              {/* Emergency Dashboard */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.error }]}
                onPress={() => navigation.navigate('StaffDashboard', {})}
              >
                <View style={[styles.actionIcon, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <MaterialIcons name="emergency" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: '#FFFFFF' }]}>Emergency Dashboard</Text>
                  <Text style={[styles.actionDescription, { color: 'rgba(255,255,255,0.8)' }]}>
                    View and respond to critical cases (Severity 4-5)
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
              </TouchableOpacity>

              {/* Emergency Call */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => {
                  if (currentStaff) {
                    navigation.navigate('EmergencyCall', { user: currentStaff as any });
                  } else {
                    Alert.alert('Error', 'Staff data not loaded');
                  }
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.error }]}>
                  <MaterialIcons name="phone" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Emergency Call</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    Initiate or receive emergency calls
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* Active Dispatch */}
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
                <View style={[styles.actionIcon, { backgroundColor: colors.warning }]}>
                  <MaterialIcons name="directions-car" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.actionContent}>
                  <Text style={[styles.actionTitle, { color: colors.text }]}>Active Dispatch</Text>
                  <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>
                    Coordinate emergency response teams
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>

              {/* View Profile */}
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.surface }]}
                onPress={() => currentStaff && navigation.navigate('StaffProfile', { staff: currentStaff as unknown as User })}
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
                    Test emergency backend endpoints
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Emergency Alert */}
            <View style={[styles.alertSection, { backgroundColor: colors.error + '15', borderColor: colors.error }]}>
              <MaterialIcons name="warning" size={24} color={colors.error} />
              <View style={styles.alertText}>
                <Text style={[styles.alertTitle, { color: colors.error }]}>Emergency Operations Access</Text>
                <Text style={[styles.alertDescription, { color: colors.text }]}>
                  You have access to urgent (Level 4) and critical (Level 5) emergency cases only. 
                  Immediate response and coordination with medical teams is essential.
                </Text>
              </View>
            </View>

            {/* Emergency Protocols */}
            <View style={styles.protocolsSection}>
              <Text style={styles.sectionTitle}>Quick Protocols</Text>
              
              <View style={[styles.protocolCard, { backgroundColor: colors.surface }]}>
                <View style={styles.protocolHeader}>
                  <MaterialIcons name="local-fire-department" size={20} color={colors.error} />
                  <Text style={[styles.protocolTitle, { color: colors.text }]}>Level 5 - Critical Emergency</Text>
                </View>
                <Text style={[styles.protocolText, { color: colors.textSecondary }]}>
                  • Immediate dispatch required{'\n'}
                  • Life-threatening situation{'\n'}
                  • ETA: 3-5 minutes
                </Text>
              </View>

              <View style={[styles.protocolCard, { backgroundColor: colors.surface }]}>
                <View style={styles.protocolHeader}>
                  <MaterialIcons name="warning" size={20} color={colors.warning} />
                  <Text style={[styles.protocolTitle, { color: colors.text }]}>Level 4 - Urgent</Text>
                </View>
                <Text style={[styles.protocolText, { color: colors.textSecondary }]}>
                  • Priority dispatch{'\n'}
                  • Serious but stable{'\n'}
                  • ETA: 8-12 minutes
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
  backgroundColor: colors.surface,
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
  alertSection: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    gap: 12,
    borderWidth: 1,
  },
  alertText: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  alertDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  protocolsSection: {
    marginTop: 30,
  },
  protocolCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  protocolHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  protocolTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  protocolText: {
    fontSize: 13,
    lineHeight: 20,
  },
  bottomSpacer: {
    height: 40,
  },
});

const EmergencyStaffWelcomeScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <EmergencyStaffWelcomeScreen {...props} />
  </ErrorBoundary>
);

export default EmergencyStaffWelcomeScreenWithErrorBoundary;
