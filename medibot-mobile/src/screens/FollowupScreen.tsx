import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import EmptyState from '../components/EmptyState';
import ErrorBoundary from '../components/ErrorBoundary';
import CaseFollowupService, { CaseFollowup, FollowupResponse, FollowupStatistics } from '../services/CaseFollowupService';
import { InputValidator } from '../utils/InputValidator';
import { createLogger } from '../services/Logger';
import { Analytics, trackScreen } from '../services/Analytics';

const logger = createLogger('FollowupScreen');

interface FollowupScreenProps {
  userId: string;
  userEmail?: string;
  onClose: () => void;
}

/**
 * FOLLOW-UP MANAGEMENT SCREEN
 * ==========================
 * 
 * Production-ready interface for managing medical case follow-ups with:
 * - Timeline view of pending follow-ups
 * - Interactive response forms
 * - Overdue case alerts
 * - Statistics dashboard
 * - Email integration for guest users
 */

const FollowupScreen: React.FC<FollowupScreenProps> = ({ userId, userEmail, onClose }) => {
  const { colors } = useTheme();
  const [followups, setFollowups] = useState<CaseFollowup[]>([]);
  const [statistics, setStatistics] = useState<FollowupStatistics | null>(null);
  const [selectedFollowup, setSelectedFollowup] = useState<CaseFollowup | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Response form state
  const [symptomUpdate, setSymptomUpdate] = useState('');
  const [feelingBetter, setFeelingBetter] = useState<boolean | null>(null);
  const [newSymptoms, setNewSymptoms] = useState('');
  const [medicationCompliance, setMedicationCompliance] = useState<boolean | null>(null);
  const [additionalConcerns, setAdditionalConcerns] = useState('');
  const [requiresFurtherCare, setRequiresFurtherCare] = useState<boolean | null>(null);

  const followupService = CaseFollowupService.getInstance();

  useEffect(() => {
    trackScreen('FollowupScreen', { userId, hasEmail: !!userEmail });
    loadFollowups();
    loadStatistics();
  }, [userId, userEmail]);

  const loadFollowups = async () => {
    try {
      setLoading(true);
      const userFollowups = await followupService.getUserFollowups(userId, userEmail);
      const pending = await followupService.getPendingFollowups(userId);
      
      // Combine and sort by priority and date
      const allRelevant = [...userFollowups, ...pending.filter(p => 
        !userFollowups.some(uf => uf.id === p.id)
      )];
      
      setFollowups(allRelevant);
    } catch (error) {
      logger.error('Error loading follow-ups', error);
      Alert.alert('Error', 'Failed to load follow-ups. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await followupService.getFollowupStatistics(userId);
      setStatistics(stats);
    } catch (error) {
      logger.error('Error loading statistics', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadFollowups();
    loadStatistics();
  };

  const openResponseModal = (followup: CaseFollowup) => {
    setSelectedFollowup(followup);
    setShowResponseModal(true);
    resetResponseForm();
  };

  const resetResponseForm = () => {
    setSymptomUpdate('');
    setFeelingBetter(null);
    setNewSymptoms('');
    setMedicationCompliance(null);
    setAdditionalConcerns('');
    setRequiresFurtherCare(null);
  };

  const submitResponse = async () => {
    if (!selectedFollowup) return;

    if (!symptomUpdate.trim()) {
      Alert.alert('Required Field', 'Please provide an update on your symptoms.');
      return;
    }

    if (feelingBetter === null) {
      Alert.alert('Required Field', 'Please indicate if you are feeling better.');
      return;
    }

    try {
      const response: Omit<FollowupResponse, 'responseDate'> = {
        followupId: selectedFollowup.id,
        userId: userId,
        symptomUpdate: symptomUpdate.trim(),
        feelingBetter: feelingBetter,
        newSymptoms: newSymptoms.split(',').map(s => s.trim()).filter(s => s.length > 0),
        medicationCompliance: medicationCompliance ?? undefined,
        additionalConcerns: additionalConcerns.trim(),
        requiresFurtherCare: requiresFurtherCare || false
      };

      await followupService.submitFollowupResponse(response);
      
      Alert.alert(
        'Response Submitted ✅',
        'Thank you for your follow-up response. Our team will review it and contact you if needed.',
        [{ text: 'OK', onPress: () => {
          setShowResponseModal(false);
          loadFollowups(); // Refresh to show updated status
        }}]
      );

    } catch (error) {
      logger.error('Error submitting response', error);
      Alert.alert('Error', 'Failed to submit response. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: CaseFollowup['priority']) => {
    switch (priority) {
      case 'critical': return '#FF4444';
      case 'high': return '#FF8800';
      case 'normal': return '#FFD700';
      case 'low': return '#4CAF50';
      default: return colors.textSecondary;
    }
  };

  const getTypeIcon = (type: CaseFollowup['type']) => {
    switch (type) {
      case 'critical-follow-up': return 'emergency';
      case 'recovery-assessment': return 'healing';
      case 'medication-review': return 'medication';
      case 'symptom-check': return 'favorite';
      default: return 'help';
    }
  };

  const renderFollowupCard = (followup: CaseFollowup) => {
    const isOverdue = followup.overdueDate && new Date() > followup.overdueDate;
    const isPending = !followup.completed && new Date() >= followup.scheduledDate;
    
    return (
      <TouchableOpacity
        key={followup.id}
        style={[
          styles.followupCard,
          { 
            backgroundColor: colors.surface,
            borderLeftColor: getPriorityColor(followup.priority),
            borderLeftWidth: 4
          },
          isOverdue && styles.overdueCard,
          isPending && styles.pendingCard
        ]}
        onPress={() => !followup.completed && openResponseModal(followup)}
      >
        <View style={styles.followupHeader}>
          <MaterialIcons 
            name={getTypeIcon(followup.type) as any} 
            size={24} 
            color={getPriorityColor(followup.priority)} 
          />
          <View style={styles.followupInfo}>
            <Text style={[styles.followupType, { color: colors.text }]}>
              {followup.type.replace('-', ' ').toUpperCase()}
            </Text>
            <Text style={[styles.followupDate, { color: colors.textSecondary }]}>
              {followup.completed ? 'Completed' : formatDate(followup.scheduledDate)}
            </Text>
          </View>
          <View style={styles.followupStatus}>
            <Text style={[styles.priorityBadge, { 
              backgroundColor: getPriorityColor(followup.priority) + '20',
              color: getPriorityColor(followup.priority)
            }]}>
              {followup.priority.toUpperCase()}
            </Text>
            {isOverdue && (
              <Text style={styles.overdueBadge}>OVERDUE</Text>
            )}
          </View>
        </View>

        <Text style={[styles.followupMessage, { color: colors.text }]} numberOfLines={3}>
          {followup.message}
        </Text>

        <View style={styles.followupMeta}>
          <Text style={[styles.metaText, { color: colors.textSecondary }]}>
            Severity: {followup.metadata.severity}/5 • 
            Reminders: {followup.remindersSent} • 
            Window: {followup.timeframeWindow} days
          </Text>
          {followup.completed && followup.completedDate && (
            <Text style={[styles.completedText, { color: colors.success }]}>
              ✅ Completed {formatDate(followup.completedDate)}
            </Text>
          )}
        </View>

        {!followup.completed && (
          <TouchableOpacity 
            style={[styles.respondButton, { backgroundColor: getPriorityColor(followup.priority) }]}
            onPress={() => openResponseModal(followup)}
          >
            <Text style={styles.respondButtonText}>Respond Now</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderStatistics = () => {
    if (!statistics) return null;

    return (
      <View style={[styles.statsContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.statsTitle, { color: colors.text }]}>Follow-up Overview</Text>
        
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.primary }]}>
              {statistics.totalCases}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Cases
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF8800' }]}>
              {statistics.pendingFollowups}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Pending
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#FF4444' }]}>
              {statistics.overdueCases}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Overdue
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>
              {statistics.responseRate.toFixed(0)}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Response Rate
            </Text>
          </View>
        </View>

        {statistics.criticalCasesOverdue > 0 && (
          <View style={styles.criticalAlert}>
            <MaterialIcons name="warning" size={20} color="#FF4444" />
            <Text style={styles.criticalAlertText}>
              {statistics.criticalCasesOverdue} critical case(s) overdue
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Health Follow-ups
        </Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.headerButton}>
          <MaterialIcons name="refresh" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Statistics */}
        {renderStatistics()}

        {/* Follow-ups List */}
        <View style={styles.followupsList}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                Loading follow-ups...
              </Text>
            </View>
          ) : followups.length === 0 ? (
            <EmptyState
              icon="event-available"
              title="No follow-ups at this time"
              message="Your healthcare follow-ups will appear here"
            />
          ) : (
            followups.map(renderFollowupCard)
          )}
        </View>
      </ScrollView>

      {/* Response Modal */}
      <Modal
        visible={showResponseModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.surface }]}>
            <TouchableOpacity 
              onPress={() => setShowResponseModal(false)}
              style={styles.headerButton}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Follow-up Response
            </Text>
            <TouchableOpacity 
              onPress={submitResponse}
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {selectedFollowup && (
              <>
                <View style={[styles.followupContext, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.contextTitle, { color: colors.text }]}>
                    {selectedFollowup.type.replace('-', ' ').toUpperCase()}
                  </Text>
                  <Text style={[styles.contextMessage, { color: colors.textSecondary }]}>
                    {selectedFollowup.message}
                  </Text>
                </View>

                {/* Symptom Update */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    How are your symptoms? *
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                    value={symptomUpdate}
                    onChangeText={setSymptomUpdate}
                    placeholder="Describe your current symptoms and any changes..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={3}
                  />
                </View>

                {/* Feeling Better */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    Are you feeling better overall? *
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.surface },
                        feelingBetter === true && { backgroundColor: '#4CAF50' }
                      ]}
                      onPress={() => setFeelingBetter(true)}
                    >
                      <Text style={[
                        styles.optionText, 
                        { color: feelingBetter === true ? 'white' : colors.text }
                      ]}>
                        Yes, Better
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.surface },
                        feelingBetter === false && { backgroundColor: '#FF4444' }
                      ]}
                      onPress={() => setFeelingBetter(false)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: feelingBetter === false ? 'white' : colors.text }
                      ]}>
                        No, Same/Worse
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* New Symptoms */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    Any new symptoms? (comma-separated)
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                    value={newSymptoms}
                    onChangeText={setNewSymptoms}
                    placeholder="headache, fever, nausea..."
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                {/* Medication Compliance */}
                {selectedFollowup.type === 'medication-review' && (
                  <View style={styles.formSection}>
                    <Text style={[styles.formLabel, { color: colors.text }]}>
                      Have you been taking your medication as prescribed?
                    </Text>
                    <View style={styles.buttonRow}>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.surface },
                          medicationCompliance === true && { backgroundColor: '#4CAF50' }
                        ]}
                        onPress={() => setMedicationCompliance(true)}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: medicationCompliance === true ? 'white' : colors.text }
                        ]}>
                          Yes
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.optionButton,
                          { backgroundColor: colors.surface },
                          medicationCompliance === false && { backgroundColor: '#FF4444' }
                        ]}
                        onPress={() => setMedicationCompliance(false)}
                      >
                        <Text style={[
                          styles.optionText,
                          { color: medicationCompliance === false ? 'white' : colors.text }
                        ]}>
                          No
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* Additional Concerns */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    Any additional concerns or questions?
                  </Text>
                  <TextInput
                    style={[styles.textInput, { backgroundColor: colors.surface, color: colors.text }]}
                    value={additionalConcerns}
                    onChangeText={setAdditionalConcerns}
                    placeholder="Optional: Share any other concerns..."
                    placeholderTextColor={colors.textSecondary}
                    multiline
                    numberOfLines={2}
                  />
                </View>

                {/* Further Care */}
                <View style={styles.formSection}>
                  <Text style={[styles.formLabel, { color: colors.text }]}>
                    Do you feel you need further medical care?
                  </Text>
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.surface },
                        requiresFurtherCare === true && { backgroundColor: '#FF8800' }
                      ]}
                      onPress={() => setRequiresFurtherCare(true)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: requiresFurtherCare === true ? 'white' : colors.text }
                      ]}>
                        Yes, Need Care
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.optionButton,
                        { backgroundColor: colors.surface },
                        requiresFurtherCare === false && { backgroundColor: '#4CAF50' }
                      ]}
                      onPress={() => setRequiresFurtherCare(false)}
                    >
                      <Text style={[
                        styles.optionText,
                        { color: requiresFurtherCare === false ? 'white' : colors.text }
                      ]}>
                        No, I'm Good
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerButton: {
    padding: 8,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  criticalAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#FF444420',
    borderRadius: 8,
  },
  criticalAlertText: {
    color: '#FF4444',
    marginLeft: 8,
    fontWeight: '500',
  },
  followupsList: {
    gap: 12,
  },
  followupCard: {
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  overdueCard: {
    backgroundColor: '#FF444410',
  },
  pendingCard: {
    backgroundColor: '#FF880010',
  },
  followupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  followupInfo: {
    flex: 1,
    marginLeft: 12,
  },
  followupType: {
    fontSize: 14,
    fontWeight: '600',
  },
  followupDate: {
    fontSize: 12,
    marginTop: 2,
  },
  followupStatus: {
    alignItems: 'flex-end',
    gap: 4,
  },
  priorityBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  overdueBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FF4444',
    backgroundColor: '#FF444420',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  followupMessage: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  followupMeta: {
    marginBottom: 8,
  },
  metaText: {
    fontSize: 11,
  },
  completedText: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  respondButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  respondButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  submitButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  followupContext: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  contextMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  optionText: {
    fontWeight: '500',
  },
});

const FollowupScreenWithErrorBoundary: React.FC<FollowupScreenProps> = (props) => (
  <ErrorBoundary>
    <FollowupScreen {...props} />
  </ErrorBoundary>
);

export default FollowupScreenWithErrorBoundary;