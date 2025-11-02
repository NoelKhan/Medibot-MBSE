import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { MedicalCase } from '../types/Medical';
import MedicalCaseService from '../services/MedicalCaseService';
import { ChatHistoryService } from '../services/ChatHistoryService';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import EmptyState from '../components/EmptyState';
import { createLogger } from '../services/Logger';

const logger = createLogger('CaseDetailScreen');

interface CaseDetailScreenProps {
  navigation: any;
  route: any;
}

const CaseDetailScreen: React.FC<CaseDetailScreenProps> = ({ navigation, route }) => {
  const { case: initialCase, user } = route.params;
  const { colors } = useTheme();
  const [medicalCase, setMedicalCase] = useState<MedicalCase>(initialCase);
  const [loading, setLoading] = useState(false);
  const medicalCaseService = MedicalCaseService.getInstance();
  const chatHistoryService = ChatHistoryService.getInstance();

  useEffect(() => {
    trackScreen('CaseDetailScreen', {
      caseId: initialCase.id,
      caseStatus: initialCase.status,
      hasConversation: !!initialCase.conversationId,
      hasUser: !!user
    });
    
    loadCaseDetails();
  }, [initialCase.id]);

  const loadCaseDetails = async () => {
    setLoading(true);
    try {
      const caseDetails = await medicalCaseService.getCaseById(initialCase.id);
      if (caseDetails) {
        setMedicalCase(caseDetails);
      } else {
        setMedicalCase(null as any);
      }
    } catch (error) {
      logger.error('Failed to load case details', error);
      setMedicalCase(null as any);
    } finally {
      setLoading(false);
    }
  };

  const handleResumeChat = async () => {
    if (medicalCase.conversationId) {
      // Navigate to chat with the conversation ID and case context
      navigation.navigate('Chat', { 
        user, 
        conversationId: medicalCase.conversationId,
        caseId: medicalCase.id,
        caseContext: medicalCase
      });
    } else {
      Alert.alert(
        'No Conversation',
        'This case was created manually. Would you like to start a new chat about it?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Chat',
            onPress: () => navigation.navigate('Chat', { 
              user,
              caseId: medicalCase.id,
              caseContext: medicalCase
            }),
          },
        ]
      );
    }
  };

  const handleUpdateStatus = async (newStatus: MedicalCase['status']) => {
    try {
      const updated = await medicalCaseService.updateCase(medicalCase.id, {
        status: newStatus,
      });
      if (updated) {
        setMedicalCase(updated);
        Alert.alert('Success', 'Case status updated successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update case status');
    }
  };

  const handleDeleteCase = () => {
    Alert.alert(
      'Delete Case',
      'Are you sure you want to delete this medical case? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicalCaseService.deleteCase(medicalCase.id);
              Alert.alert('Success', 'Case deleted successfully', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete case');
            }
          },
        },
      ]
    );
  };

  const getSeverityColor = (severity: number) => {
    if (severity >= 4) return '#FF4444';
    if (severity >= 3) return '#FF9800';
    return '#4CAF50';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity >= 4) return 'High';
    if (severity >= 3) return 'Medium';
    return 'Low';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#2196F3';
      case 'completed':
        return '#4CAF50';
      case 'followup':
        return '#FF9800';
      default:
        return colors.textSecondary;
    }
  };

  const formatDate = (date: Date | string | undefined | null): string => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString();
    } catch {
      return 'N/A';
    }
  };

  if (loading && !medicalCase) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!medicalCase) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Case Details</Text>
          <View style={styles.deleteButton} />
        </View>
        <EmptyState
          icon="folder-open"
          title="Case Not Found"
          message="The requested case could not be found or has been removed."
          actionLabel="Back to Cases"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Case Details</Text>
        <TouchableOpacity onPress={handleDeleteCase} style={styles.deleteButton}>
          <MaterialIcons name="delete" size={24} color="#FF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Case Title */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            {medicalCase.title || 'Medical Case'}
          </Text>
          <View style={styles.badges}>
            <View style={[styles.badge, { backgroundColor: getSeverityColor(medicalCase.severity) + '20' }]}>
              <Text style={[styles.badgeText, { color: getSeverityColor(medicalCase.severity) }]}>
                {getSeverityLabel(medicalCase.severity)} Severity
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(medicalCase.status) + '20' }]}>
              <Text style={[styles.badgeText, { color: getStatusColor(medicalCase.status) }]}>
                {medicalCase.status.charAt(0).toUpperCase() + medicalCase.status.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Symptoms */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Symptoms</Text>
          <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
            {medicalCase.symptoms || 'No symptoms recorded'}
          </Text>
        </View>

        {/* Diagnosis */}
        {medicalCase.diagnosis && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Diagnosis</Text>
            <Text style={[styles.sectionContent, { color: colors.textSecondary }]}>
              {medicalCase.diagnosis}
            </Text>
          </View>
        )}

        {/* Recommendations */}
        {medicalCase.recommendations && medicalCase.recommendations.length > 0 && (
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recommendations</Text>
            {medicalCase.recommendations.map((rec, index) => (
              <Text key={index} style={[styles.sectionContent, { color: colors.textSecondary, marginBottom: 4 }]}>
                • {rec}
              </Text>
            ))}
          </View>
        )}

        {/* Case Information */}
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Case Information</Text>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Created:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(medicalCase.createdAt)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Last Updated:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {formatDate(medicalCase.updatedAt)}
            </Text>
          </View>
          {medicalCase.followUpDate && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Follow-up:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>
                {formatDate(medicalCase.followUpDate)}
              </Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {medicalCase.conversationId && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.primary }]}
              onPress={handleResumeChat}
            >
              <MaterialIcons name="chat" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Resume Chat</Text>
            </TouchableOpacity>
          )}

          {medicalCase.status !== 'completed' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
              onPress={() => handleUpdateStatus('completed')}
            >
              <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          )}

          {medicalCase.status !== 'follow_up' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#FF9800' }]}
              onPress={() => handleUpdateStatus('follow_up')}
            >
              <MaterialIcons name="schedule" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Follow-up</Text>
            </TouchableOpacity>
          )}

          {medicalCase.status !== 'active' && (
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
              onPress={() => handleUpdateStatus('active')}
            >
              <MaterialIcons name="autorenew" size={20} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Mark as Active</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  sectionContent: {
    fontSize: 16,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E010',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
  },
  actions: {
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

const CaseDetailScreenWithErrorBoundary: React.FC<CaseDetailScreenProps> = (props) => (
  <ErrorBoundary>
    <CaseDetailScreen {...props} />
  </ErrorBoundary>
);

export default CaseDetailScreenWithErrorBoundary;
