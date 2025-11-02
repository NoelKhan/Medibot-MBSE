import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { EmergencyCase, StaffUser } from '../types/Booking';
import { User, UserRole, AuthStatus } from '../types/User';
import EmergencyService from '../services/EmergencyService';
import CaseMockService, { MedicalCaseFull } from '../services/CaseMockService';
import { authService } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import { createLogger } from '../services/Logger';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';

const logger = createLogger('StaffDashboardScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'StaffDashboard'>;

const StaffDashboardScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [emergencyCases, setEmergencyCases] = useState<EmergencyCase[]>([]);
  const [priorityCases, setPriorityCases] = useState<EmergencyCase[]>([]);
  const [mockCases, setMockCases] = useState<MedicalCaseFull[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(null);
  const [selectedMockCase, setSelectedMockCase] = useState<MedicalCaseFull | null>(null);
  const [showCaseModal, setShowCaseModal] = useState(false);
  const [caseNotes, setCaseNotes] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'responded'>('all');

  const emergencyService = EmergencyService.getInstance();
  const caseMockService = CaseMockService.getInstance();
  
  // Create dynamic styles based on theme
  const styles = createStyles(colors);

  useEffect(() => {
    trackScreen('StaffDashboardScreen', {
      staffRole: currentStaff?.role,
      staffDepartment: currentStaff?.department,
      hasStaffData: !!route.params?.staff
    });
    
    loadStaffData();
    loadEmergencyCases();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadEmergencyCases();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadStaffData = async () => {
    try {
      // Check if staff was passed via navigation params (from MedicalStaffLogin)
      if (route.params?.staff) {
        logger.info('Staff data loaded from navigation params', { staffId: route.params.staff.id });
        
        // Convert User type to StaffUser type for the dashboard
        const user = route.params.staff;
        const staffUser: StaffUser = {
          id: user.id,
          email: user.email || '',
          name: user.name,
          role: user.role === UserRole.DOCTOR ? 'doctor' : 
                user.role === UserRole.NURSE ? 'nurse' :
                user.role === UserRole.EMT ? 'paramedic' : 'doctor',
          badgeNumber: user.profile?.licenseNumber || user.id,
          department: user.profile?.hospitalAffiliation || 'Medical Services',
          shift: 'day',
          status: 'available',
          specializations: user.profile?.specialty ? [user.profile.specialty] : [],
          certifications: ['CPR', 'First Aid'],
          activeCases: [],
          createdAt: user.createdAt,
          lastLoginAt: new Date()
        };
        
        setCurrentStaff(staffUser);
        return;
      }
      
      // Check AuthService for medical staff (from MedicalStaffLogin)
      const authUser = authService.getCurrentUser();
      if (authUser && 'role' in authUser) {
        const user = authUser as User;
        logger.info('Staff data loaded from AuthService', { userId: user.id, role: user.role });
        
        // Convert User type to StaffUser type for the dashboard
        const staffUser: StaffUser = {
          id: user.id,
          email: user.email || '',
          name: user.name,
          role: user.role === UserRole.DOCTOR ? 'doctor' : 
                user.role === UserRole.NURSE ? 'nurse' :
                user.role === UserRole.EMT ? 'paramedic' : 'doctor',
          badgeNumber: user.profile?.licenseNumber || user.id,
          department: user.profile?.hospitalAffiliation || 'Medical Services',
          shift: 'day',
          status: 'available',
          specializations: user.profile?.specialty ? [user.profile.specialty] : [],
          certifications: ['CPR', 'First Aid'],
          activeCases: [],
          createdAt: user.createdAt,
          lastLoginAt: new Date()
        };
        
        setCurrentStaff(staffUser);
        return;
      }
      
      // Fallback: Check EmergencyService for emergency staff
      const staff = await emergencyService.getCurrentStaff();
      if (staff) {
        logger.info('Staff data loaded from EmergencyService', { staffId: staff.id });
        setCurrentStaff(staff);
        return;
      }
      
      // No staff data found anywhere
      logger.warn('No staff data found in any service, redirecting to role selection');
      navigation.replace('RoleSelection');
    } catch (error) {
      logger.error('Error loading staff data', error);
      navigation.replace('RoleSelection');
    }
  };

  const loadEmergencyCases = async () => {
    try {
      setLoading(true);
      
      // Load traditional emergency service cases
      const [allCases, priority] = await Promise.all([
        emergencyService.getAllEmergencyCases(),
        emergencyService.getPriorityCases()
      ]);
      
      setEmergencyCases(allCases);
      setPriorityCases(priority);
      
      // Load mock cases with role-based filtering
      const staff = await emergencyService.getCurrentStaff();
      let cases: MedicalCaseFull[];
      
      if (staff && (staff.role === 'emergency_operator' || staff.role === 'paramedic')) {
        // Emergency staff sees only severity 4-5 (urgent and critical)
        cases = caseMockService.getEmergencyCases();
        logger.info('Emergency Staff View - Showing urgent/critical cases', { 
          caseCount: cases.length,
          severityRange: '4-5'
        });
      } else {
        // Medical staff (doctor/nurse) sees severity 1-4
        cases = caseMockService.getAllCases();
        logger.info('Medical Staff View - Showing cases', { 
          caseCount: cases.length,
          severityRange: '1-4'
        });
      }
      
      setMockCases(cases);
      
      // Log statistics
      const stats = caseMockService.getStatistics();
      logger.debug('Case Statistics', stats);
      
    } catch (error) {
      logger.error('Error loading emergency cases', error);
      Alert.alert('Error', 'Failed to load emergency cases. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadEmergencyCases();
  };

  const handleCaseSelect = (emergencyCase: EmergencyCase) => {
    setSelectedCase(emergencyCase);
    setCaseNotes(emergencyCase.notes || '');
    setShowCaseModal(true);
  };

  const updateCaseStatus = async (status: EmergencyCase['status']) => {
    if (!selectedCase) return;

    try {
      await emergencyService.updateCaseStatus(
        selectedCase.id,
        status,
        caseNotes !== selectedCase.notes ? caseNotes : undefined
      );
      
      setShowCaseModal(false);
      loadEmergencyCases();
      
      Alert.alert('Success', `Case status updated to ${status}`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update case status');
    }
  };

  const assignSelfToCase = async () => {
    if (!selectedCase || !currentStaff) return;

    try {
      await emergencyService.assignStaff(selectedCase.id, currentStaff.id);
      loadEmergencyCases();
      Alert.alert('Success', 'Case assigned to you successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to assign case');
    }
  };

  const handleStartChat = (caseItem: MedicalCaseFull) => {
    // Create a mock patient user for the chat
    const patientUser: User = {
      id: `patient-${caseItem.id}`,
      name: caseItem.patientName,
      email: `patient.${caseItem.id}@patient.example.com`,
      role: UserRole.PATIENT,
      authStatus: AuthStatus.AUTHENTICATED,
      profile: {
        phoneNumber: caseItem.contactNumber,
        dateOfBirth: new Date(new Date().getFullYear() - caseItem.patientAge, 0, 1),
        gender: caseItem.patientGender === 'male' ? 'male' : caseItem.patientGender === 'female' ? 'female' : 'other',
        medicalHistory: caseItem.symptoms,
        allergies: caseItem.allergies,
        medications: caseItem.medications
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Navigate to chat with case context
    navigation.navigate('Chat', {
      user: patientUser,
      caseId: caseItem.id,
      caseContext: {
        emergency: true,
        severity: caseItem.severity,
        priority: caseItem.priority,
        symptoms: caseItem.symptoms
      }
    });
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
            await emergencyService.logoutStaff();
            // Navigate back to role selection instead of patient welcome
            navigation.replace('RoleSelection');
          }
        }
      ]
    );
  };

  const getStatusColor = (status: EmergencyCase['status']) => {
    switch (status) {
      case 'pending': return '#FF9500';
      case 'responded': return '#007AFF';
      case 'resolved': return '#34C759';
      case 'cancelled': return '#8E8E93';
      default: return '#666';
    }
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return '#FF3B30';
    if (severity >= 3) return '#FF9500';
    if (severity >= 2) return '#FFCC02';
    return '#34C759';
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffMins < 1440) {
      return `${Math.floor(diffMins / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const filteredCases = emergencyCases.filter(emergencyCase => {
    if (filterStatus === 'all') return true;
    return emergencyCase.status === filterStatus;
  });

  const renderEmergencyCase = ({ item: emergencyCase }: { item: EmergencyCase }) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => handleCaseSelect(emergencyCase)}
    >
      <View style={styles.caseHeader}>
        <View style={styles.caseHeaderLeft}>
          <Text style={styles.caseId}>#{emergencyCase.id.slice(-6)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(emergencyCase.status) }]}>
            <Text style={styles.statusText}>{emergencyCase.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.caseHeaderRight}>
          <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(emergencyCase.severity) }]}>
            <MaterialIcons name="warning" size={16} color="#FFFFFF" />
            <Text style={styles.severityText}>{emergencyCase.severity}/5</Text>
          </View>
          <Text style={styles.timestamp}>{formatTimestamp(emergencyCase.timestamp)}</Text>
        </View>
      </View>

      <View style={styles.caseContent}>
        <Text style={styles.emergencyType}>{emergencyCase.emergencyType}</Text>
        <Text style={styles.symptoms} numberOfLines={2}>
          {emergencyCase.symptoms.join(', ')}
        </Text>
        
        {emergencyCase.location && (
          <View style={styles.locationInfo}>
            <MaterialIcons name="location-on" size={14} color="#666" />
            <Text style={styles.locationText}>GPS coordinates available</Text>
          </View>
        )}

        {emergencyCase.assignedStaff && (
          <View style={styles.assignedInfo}>
            <MaterialIcons name="person" size={14} color="#007AFF" />
            <Text style={styles.assignedText}>
              Assigned to {emergencyCase.assignedStaff === currentStaff?.id ? 'You' : 'Staff'}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.caseFooter}>
        <Text style={styles.contactNumber}>
          <MaterialIcons name="phone" size={14} color="#666" />
          {` ${emergencyCase.contactNumber}`}
        </Text>
        <MaterialIcons name="chevron-right" size={20} color="#007AFF" />
      </View>
    </TouchableOpacity>
  );

  const renderMockCase = ({ item: caseItem }: { item: MedicalCaseFull }) => {
    const getPriorityColor = (priority: string) => {
      switch (priority) {
        case 'critical': return '#FF3B30';
        case 'high': return '#FF9500';
        case 'medium': return '#FFCC00';
        case 'low': return '#34C759';
        default: return '#8E8E93';
      }
    };

    const getPriorityIcon = (priority: string) => {
      switch (priority) {
        case 'critical': return 'emergency';
        case 'high': return 'warning';
        case 'medium': return 'info';
        case 'low': return 'check-circle';
        default: return 'info';
      }
    };

    return (
      <TouchableOpacity
        style={[styles.caseCard, { borderLeftWidth: 4, borderLeftColor: getPriorityColor(caseItem.priority) }]}
        onPress={() => {
          setSelectedMockCase(caseItem);
          setShowCaseModal(true);
        }}
      >
        <View style={styles.caseHeader}>
          <View style={styles.caseHeaderLeft}>
            <MaterialIcons 
              name={getPriorityIcon(caseItem.priority) as any} 
              size={24} 
              color={getPriorityColor(caseItem.priority)} 
            />
            <View style={{ marginLeft: 8 }}>
              <Text style={styles.caseId}>{caseItem.patientName}</Text>
              <Text style={{ fontSize: 12, color: colors.textSecondary }}>
                {caseItem.patientAge}y • {caseItem.patientGender}
              </Text>
            </View>
          </View>
          <View style={styles.caseHeaderRight}>
            <View style={[styles.statusBadge, { backgroundColor: getPriorityColor(caseItem.priority) }]}>
              <Text style={styles.statusText}>{caseItem.priority.toUpperCase()}</Text>
            </View>
            <Text style={styles.timestamp}>{formatTimestamp(caseItem.timestamp)}</Text>
          </View>
        </View>

        <View style={styles.caseContent}>
          <Text style={styles.emergencyType}>{caseItem.emergencyType}</Text>
          <Text style={styles.symptoms} numberOfLines={2}>
            {caseItem.symptoms.join(' • ')}
          </Text>
          
          {caseItem.vitalSigns && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 8 }}>
              {caseItem.vitalSigns.heartRate && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 4, borderRadius: 4 }}>
                  <MaterialIcons name="favorite" size={12} color="#FF3B30" />
                  <Text style={{ fontSize: 11, marginLeft: 4 }}>{caseItem.vitalSigns.heartRate} bpm</Text>
                </View>
              )}
              {caseItem.vitalSigns.bloodPressure && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 4, borderRadius: 4 }}>
                  <MaterialIcons name="water-drop" size={12} color="#007AFF" />
                  <Text style={{ fontSize: 11, marginLeft: 4 }}>{caseItem.vitalSigns.bloodPressure}</Text>
                </View>
              )}
              {caseItem.vitalSigns.temperature && (
                <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, padding: 4, borderRadius: 4 }}>
                  <MaterialIcons name="thermostat" size={12} color="#FF9500" />
                  <Text style={{ fontSize: 11, marginLeft: 4 }}>{caseItem.vitalSigns.temperature}°C</Text>
                </View>
              )}
            </View>
          )}

          {caseItem.location && (
            <View style={styles.locationInfo}>
              <MaterialIcons name="location-on" size={14} color="#666" />
              <Text style={styles.locationText}>{caseItem.location.address}</Text>
            </View>
          )}
        </View>

        <View style={styles.caseFooter}>
          <Text style={styles.contactNumber}>
            <MaterialIcons name="phone" size={14} color="#666" />
            {` ${caseItem.contactNumber}`}
          </Text>
          {/* Show Start Chat button for emergency staff on high severity cases */}
          {currentStaff && 
           (currentStaff.role === 'emergency_operator' || currentStaff.role === 'paramedic') && 
           caseItem.severity >= 4 ? (
            <TouchableOpacity
              style={styles.chatButton}
              onPress={(e) => {
                e.stopPropagation();
                handleStartChat(caseItem);
              }}
            >
              <MaterialIcons name="chat" size={16} color="#FFF" />
              <Text style={styles.chatButtonText}>Start Chat</Text>
            </TouchableOpacity>
          ) : (
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {caseItem.estimatedWaitTime ? `~${caseItem.estimatedWaitTime} min wait` : 'Immediate'}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading dashboard...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerLeft}>
          <Text style={styles.welcomeText}>
            Welcome, {currentStaff?.name.split(' ')[0]}
          </Text>
          <Text style={styles.roleText}>{currentStaff?.role} • {currentStaff?.department}</Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      {/* Stats Dashboard */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{mockCases.length}</Text>
          <Text style={styles.statLabel}>Total Cases</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockCases.filter(c => c.priority === 'critical' || c.priority === 'high').length}
          </Text>
          <Text style={styles.statLabel}>High Priority</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>
            {mockCases.filter(c => c.status === 'pending').length}
          </Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Role Badge */}
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          backgroundColor: currentStaff?.role === 'emergency_operator' || currentStaff?.role === 'paramedic' 
            ? '#FF3B30' 
            : '#007AFF',
          paddingHorizontal: 12,
          paddingVertical: 6,
          borderRadius: 20,
          alignSelf: 'flex-start'
        }}>
          <MaterialIcons name="local-hospital" size={16} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginLeft: 6 }}>
            {currentStaff?.role === 'emergency_operator' || currentStaff?.role === 'paramedic' 
              ? `🚨 Emergency Staff - ${mockCases.length} Urgent/Critical Cases (Severity 4-5)`
              : `👨‍⚕️ Medical Staff - ${mockCases.length} Cases (Severity 1-4)`}
          </Text>
        </View>
      </View>

      {/* Mock Cases List */}
      <FlatList
        data={mockCases}
        renderItem={renderMockCase}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.casesList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <EmptyState
            icon="inbox"
            title="No emergency cases found"
            message="New emergency cases will appear here automatically"
          />
        }
      />

      {/* Case Details Modal */}
      <Modal
        visible={showCaseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCaseModal(false)}>
              <MaterialIcons name="close" size={24} color="#007AFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Emergency Case</Text>
            <View style={styles.placeholder} />
          </View>

          {selectedCase && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.caseDetailsCard}>
                <View style={styles.caseDetailHeader}>
                  <Text style={styles.caseDetailId}>#{selectedCase.id}</Text>
                  <View style={[
                    styles.detailSeverityBadge, 
                    { backgroundColor: getSeverityColor(selectedCase.severity) }
                  ]}>
                    <Text style={styles.detailSeverityText}>
                      Severity {selectedCase.severity}/5
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <Text style={styles.detailValue}>{selectedCase.emergencyType}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Status:</Text>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedCase.status) }]}>
                    <Text style={styles.statusText}>{selectedCase.status.toUpperCase()}</Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Reported:</Text>
                  <Text style={styles.detailValue}>
                    {selectedCase.timestamp.toLocaleString()}
                  </Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Contact:</Text>
                  <Text style={styles.detailValue}>{selectedCase.contactNumber}</Text>
                </View>

                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Symptoms:</Text>
                  <Text style={styles.symptomsText}>
                    {selectedCase.symptoms.join(', ')}
                  </Text>
                </View>

                {selectedCase.location && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location:</Text>
                    <Text style={styles.detailValue}>
                      {selectedCase.location.address}
                    </Text>
                    <Text style={styles.coordinatesText}>
                      GPS: {selectedCase.location.latitude.toFixed(6)}, {selectedCase.location.longitude.toFixed(6)}
                    </Text>
                  </View>
                )}

                <View style={styles.notesSection}>
                  <Text style={styles.detailLabel}>Notes:</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={caseNotes}
                    onChangeText={setCaseNotes}
                    placeholder="Add case notes..."
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                {!selectedCase.assignedStaff && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.assignButton]}
                    onPress={assignSelfToCase}
                  >
                    <MaterialIcons name="assignment-ind" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Assign to Me</Text>
                  </TouchableOpacity>
                )}

                {selectedCase.status === 'pending' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.respondButton]}
                    onPress={() => updateCaseStatus('responded')}
                  >
                    <MaterialIcons name="directions-run" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Mark Responded</Text>
                  </TouchableOpacity>
                )}

                {selectedCase.status === 'responded' && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => updateCaseStatus('resolved')}
                  >
                    <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Mark Resolved</Text>
                  </TouchableOpacity>
                )}
              </View>
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: colors.textSecondary
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  backButton: {
    padding: 8,
    marginRight: 8
  },
  headerLeft: {
    flex: 1
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text
  },
  roleText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2
  },
  logoutButton: {
    padding: 8
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 15
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center'
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    marginRight: 10
  },
  activeFilter: {
    backgroundColor: '#007AFF'
  },
  filterText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  activeFilterText: {
    color: '#FFFFFF'
  },
  casesList: {
    padding: 20
  },
  caseCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  caseHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  caseId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  caseHeaderRight: {
    alignItems: 'flex-end'
  },
  severityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4
  },
  severityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 4
  },
  timestamp: {
    fontSize: 12,
    color: '#666'
  },
  caseContent: {
    marginBottom: 10
  },
  emergencyType: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  symptoms: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4
  },
  assignedInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  assignedText: {
    fontSize: 12,
    color: '#007AFF',
    marginLeft: 4,
    fontWeight: '500'
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0'
  },
  contactNumber: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500'
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600'
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#CCC',
    marginTop: 15
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center'
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333'
  },
  placeholder: {
    width: 24
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  caseDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20
  },
  caseDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  caseDetailId: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  detailSeverityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15
  },
  detailSeverityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15
  },
  detailSection: {
    marginBottom: 15
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 80,
    marginRight: 10
  },
  detailValue: {
    fontSize: 16,
    color: '#333',
    flex: 1
  },
  symptomsText: {
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
    marginTop: 5
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'monospace',
    marginTop: 4
  },
  notesSection: {
    marginTop: 10
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FAFAFA',
    marginTop: 8,
    textAlignVertical: 'top'
  },
  actionButtons: {
    gap: 10
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8
  },
  assignButton: {
    backgroundColor: '#007AFF'
  },
  respondButton: {
    backgroundColor: '#FF9500'
  },
  resolveButton: {
    backgroundColor: '#34C759'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600'
  }
});

const StaffDashboardScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <StaffDashboardScreen {...props} />
  </ErrorBoundary>
);

export default StaffDashboardScreenWithErrorBoundary;