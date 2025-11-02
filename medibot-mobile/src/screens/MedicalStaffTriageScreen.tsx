import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useTheme, ThemeColors } from '../contexts/ThemeContext';
import { User, UserRole } from '../types/User';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('MedicalStaffTriageScreen');

type Props = NativeStackScreenProps<RootStackParamList, 'MedicalStaffTriage'>;

interface EmergencyCase {
  id: string;
  patientName: string;
  urgency: 'critical' | 'high' | 'medium';
  symptoms: string;
  waitTime: number; // minutes
  assignedTo?: string;
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.emergency,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  backgroundColor: colors.surface,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  casesList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  caseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  patientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  urgencyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  urgencyText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 4,
  },
  symptoms: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  waitTime: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  callButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chatButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
    marginLeft: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

const MedicalStaffTriageScreen: React.FC<Props> = ({ route, navigation }) => {
  const { staff } = route.params;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    trackScreen('MedicalStaffTriageScreen', {
      staffId: staff?.id,
      staffRole: staff?.role
    });
  }, []);

  // Mock emergency cases
  const [cases, setCases] = useState<EmergencyCase[]>([
    {
      id: '1',
      patientName: 'John Smith',
      urgency: 'critical',
      symptoms: 'Severe chest pain, shortness of breath',
      waitTime: 2,
    },
    {
      id: '2',
      patientName: 'Sarah Johnson',
      urgency: 'high',
      symptoms: 'High fever (103°F), severe headache',
      waitTime: 8,
    },
    {
      id: '3',
      patientName: 'Mike Davis',
      urgency: 'medium',
      symptoms: 'Persistent cough, mild fever',
      waitTime: 15,
    },
  ]);

  useEffect(() => {
    const loadTriageData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        // Data is already set in mock state
      } catch (err) {
        logger.error('Failed to load triage data', err);
        setError('Failed to load triage queue. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadTriageData();
  }, []);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'critical': return colors.emergency;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      default: return colors.textSecondary;
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'critical': return 'local-hospital';
      case 'high': return 'warning';
      case 'medium': return 'info';
      default: return 'help';
    }
  };

  const handleCall = (caseItem: EmergencyCase) => {
    navigation.navigate('EmergencyCall', {
      emergencyType: 'triage',
    });
  };

  const handleChat = (caseItem: EmergencyCase) => {
    // Create a mock patient user for the case
    const patientUser: User = {
      id: caseItem.id,
      name: caseItem.patientName,
      email: `${caseItem.patientName.toLowerCase().replace(' ', '.')}@patient.com`,
      role: UserRole.PATIENT,
      authStatus: 'authenticated' as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      profile: {
        gender: 'prefer_not_to_say',
        emergencyContact: {
          name: 'Emergency Contact',
          relationship: 'Family',
          phoneNumber: '911',
        },
      },
    };
    
    navigation.navigate('Chat', { user: patientUser });
  };

  const renderCase = ({ item }: { item: EmergencyCase }) => (
    <View style={[styles.caseCard, { borderColor: getUrgencyColor(item.urgency) }]}>
      <View style={styles.caseHeader}>
        <Text style={styles.patientName}>{item.patientName}</Text>
        <View style={[styles.urgencyBadge, { backgroundColor: getUrgencyColor(item.urgency) }]}>
          <MaterialIcons name={getUrgencyIcon(item.urgency)} size={16} color="#FFFFFF" />
          <Text style={styles.urgencyText}>{item.urgency.toUpperCase()}</Text>
        </View>
      </View>
      
      <Text style={styles.symptoms}>{item.symptoms}</Text>
      
      <View style={styles.caseFooter}>
        <Text style={styles.waitTime}>⏱ Wait time: {item.waitTime} min</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.callButton} onPress={() => handleCall(item)}>
            <MaterialIcons name="phone" size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Call</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.chatButton} onPress={() => handleChat(item)}>
            <MaterialIcons name="chat" size={16} color="#FFFFFF" />
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons 
        name="local-hospital" 
        size={80} 
        color={colors.textSecondary} 
        style={styles.emptyIcon}
      />
      <Text style={styles.emptyTitle}>No Active Cases</Text>
      <Text style={styles.emptySubtitle}>
        All emergency cases have been handled. Great work!
      </Text>
    </View>
  );

  if (isLoading) {
    return <LoadingState message="Loading triage queue..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={() => {
      setIsLoading(true);
      setError(null);
      setTimeout(() => setIsLoading(false), 800);
    }} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.error}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Triage</Text>
        <Text style={styles.headerSubtitle}>
          Welcome, {staff.name} | {staff.profile?.specialty || 'Medical Staff'}
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.emergency }]}>
            {cases.filter(c => c.urgency === 'critical').length}
          </Text>
          <Text style={styles.statLabel}>Critical</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.warning }]}>
            {cases.filter(c => c.urgency === 'high').length}
          </Text>
          <Text style={styles.statLabel}>High</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.info }]}>
            {cases.filter(c => c.urgency === 'medium').length}
          </Text>
          <Text style={styles.statLabel}>Medium</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{cases.length}</Text>
          <Text style={styles.statLabel}>Total Cases</Text>
        </View>
      </View>

      {/* Cases List */}
      {cases.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={cases}
          renderItem={renderCase}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.casesList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const MedicalStaffTriageScreenWithErrorBoundary: React.FC<Props> = (props) => (
  <ErrorBoundary>
    <MedicalStaffTriageScreen {...props} />
  </ErrorBoundary>
);

export default MedicalStaffTriageScreenWithErrorBoundary;
