/**
 * Medical Cases List Screen
 * Displays all medical cases for a user with ability to create new ones
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { MedicalCase, SeverityScale } from '../types/Medical';
import MedicalCaseService from '../services/MedicalCaseService';
import { authService } from '../services/auth';
import ErrorBoundary from '../components/ErrorBoundary';
import EmptyState from '../components/EmptyState';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('MedicalCasesScreen');

interface MedicalCasesScreenProps {
  navigation: any;
  route: {
    params: {
      userId: string;
    };
  };
}

const MedicalCasesScreen: React.FC<MedicalCasesScreenProps> = ({ navigation, route }) => {
  const { userId } = route.params;
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);
  
  const [cases, setCases] = useState<MedicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, open: 0, closed: 0, followup: 0, urgent: 0 });
  
  // Create case form state
  const [title, setTitle] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<SeverityScale>(3);
  
  const caseService = MedicalCaseService.getInstance();

  useEffect(() => {
    trackScreen('MedicalCasesScreen', {
      userId
    });
    
    loadCases();
    caseService.initialize();
  }, []);

  const loadCases = async () => {
    try {
      setLoading(true);
      const userCases = await caseService.getUserCases(userId);
      setCases(userCases);
      
      const statistics = await caseService.getCaseStats(userId);
      setStats(statistics);
    } catch (error) {
      logger.error('Error loading cases', error);
      Alert.alert('Error', 'Failed to load medical cases');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadCases();
  };

  const handleCreateCase = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a case title');
      return;
    }

    if (!symptoms.trim()) {
      Alert.alert('Error', 'Please describe your symptoms');
      return;
    }

    try {
      const symptomsList = symptoms.split(',').map(s => s.trim()).filter(s => s);
      
      await caseService.createCase({
        userId,
        title,
        description,
        symptoms: symptomsList,
        severity,
      });

      Alert.alert('Success', 'Medical case created successfully');
      setShowCreateModal(false);
      resetForm();
      loadCases();
    } catch (error) {
      logger.error('Error creating case', error);
      Alert.alert('Error', 'Failed to create medical case');
    }
  };

  const resetForm = () => {
    setTitle('');
    setSymptoms('');
    setDescription('');
    setSeverity(3);
  };

  const handleCasePress = (medicalCase: MedicalCase) => {
    try {
      // Get current user from auth service
      const currentUser = authService.getCurrentUser();
      
      if (!currentUser) {
        Alert.alert('Error', 'User session not found. Please log in again.');
        return;
      }

      navigation.navigate('CaseDetail', { 
        case: medicalCase, 
        user: currentUser 
      });
    } catch (error) {
      logger.error('Error navigating to case detail', error);
      Alert.alert('Error', 'Failed to open case details. Please try again.');
    }
  };

  const getSeverityColor = (severity: SeverityScale) => {
    if (severity >= 4) return '#f44336';
    if (severity >= 3) return '#FF9800';
    return '#4CAF50';
  };

  const getSeverityLabel = (severity: SeverityScale) => {
    if (severity >= 4) return 'Urgent';
    if (severity >= 3) return 'Moderate';
    return 'Mild';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#2196F3';
      case 'completed': return '#4CAF50';
      case 'escalated': return '#f44336';
      case 'follow_up': return '#FF9800';
      default: return colors.textSecondary;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const CaseCard = ({ medicalCase }: { medicalCase: MedicalCase }) => (
    <TouchableOpacity
      style={styles.caseCard}
      onPress={() => handleCasePress(medicalCase)}
    >
      <View style={styles.caseHeader}>
        <View style={styles.caseHeaderLeft}>
          <Text style={styles.caseTitle}>{medicalCase.title}</Text>
          <Text style={styles.caseDate}>{formatDate(medicalCase.createdAt)}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(medicalCase.severity) + '20' }]}>
          <Text style={[styles.severityText, { color: getSeverityColor(medicalCase.severity) }]}>
            {getSeverityLabel(medicalCase.severity)}
          </Text>
        </View>
      </View>

      <View style={styles.symptomsContainer}>
        {medicalCase.symptoms.slice(0, 3).map((symptom, index) => (
          <View key={index} style={styles.symptomChip}>
            <Text style={styles.symptomText}>{symptom}</Text>
          </View>
        ))}
        {medicalCase.symptoms.length > 3 && (
          <View style={styles.symptomChip}>
            <Text style={styles.symptomText}>+{medicalCase.symptoms.length - 3} more</Text>
          </View>
        )}
      </View>

      <View style={styles.caseFooter}>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(medicalCase.status) + '20' }]}>
          <Text style={[styles.statusText, { color: getStatusColor(medicalCase.status) }]}>
            {medicalCase.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );

  const SeveritySelector = () => (
    <View style={styles.severitySelector}>
      <Text style={styles.inputLabel}>Severity Level</Text>
      <View style={styles.severityButtons}>
        {[1, 2, 3, 4, 5].map((level) => (
          <TouchableOpacity
            key={level}
            style={[
              styles.severityButton,
              severity === level && { backgroundColor: getSeverityColor(level as SeverityScale) }
            ]}
            onPress={() => setSeverity(level as SeverityScale)}
          >
            <Text style={[
              styles.severityButtonText,
              severity === level && { color: '#fff' }
            ]}>
              {level}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.severityHint}>
        1 = Mild, 3 = Moderate, 5 = Urgent
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Medical Cases</Text>
        <TouchableOpacity onPress={() => setShowCreateModal(true)}>
          <MaterialIcons name="add" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#2196F3' }]}>{stats.open}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.closed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.followup}</Text>
          <Text style={styles.statLabel}>Follow-up</Text>
        </View>
      </View>

      {/* Cases List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading cases...</Text>
          </View>
        ) : cases.length === 0 ? (
          <EmptyState
            icon="folder-open"
            title="No Medical Cases Yet"
            message="Create a case to track your health concerns and consultations"
            actionLabel="Create Case"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <View style={styles.casesList}>
            {cases.map((medicalCase) => (
              <CaseCard key={medicalCase.id} medicalCase={medicalCase} />
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Case Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Medical Case</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Case Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Persistent headache"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Symptoms * (comma separated)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., headache, dizziness, nausea"
                placeholderTextColor={colors.textSecondary}
                value={symptoms}
                onChangeText={setSymptoms}
                multiline
              />

              <Text style={styles.inputLabel}>Additional Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe your condition in detail..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
              />

              <SeveritySelector />

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleCreateCase}
              >
                <MaterialIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Create Case</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const createStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    marginTop: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  casesList: {
    padding: 16,
  },
  caseCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  caseHeaderLeft: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  caseDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  severityText: {
    fontSize: 12,
    fontWeight: '600',
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  symptomChip: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  symptomText: {
    fontSize: 12,
    color: colors.primary,
  },
  caseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalBody: {
    padding: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  severitySelector: {
    marginTop: 16,
  },
  severityButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  severityButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  severityButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  severityHint: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

const MedicalCasesScreenWithErrorBoundary: React.FC<MedicalCasesScreenProps> = (props) => (
  <ErrorBoundary>
    <MedicalCasesScreen {...props} />
  </ErrorBoundary>
);

export default MedicalCasesScreenWithErrorBoundary;
