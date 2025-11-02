/**
 * CASE MANAGEMENT SCREEN
 * 
 * Comprehensive case tracking and management system including:
 * - Case detail view with full history
 * - Staff assignment and triaging
 * - Status updates and progress tracking
 * - Note management (user and staff notes)
 * - Attachment handling
 * - Priority and severity management
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
  FlatList,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { MedicalCase, CaseNote, TriageAssessment, PatientUser } from '../types/Booking';
import { caseService } from '../services/medical';
import { authService } from '../services/auth';
import { useTheme } from '../contexts/ThemeContext';
import ErrorBoundary from '../components/ErrorBoundary';
import { Analytics, AnalyticsEvent, trackScreen } from '../services/Analytics';
import { createLogger } from '../services/Logger';

const logger = createLogger('CaseManagementScreen');

interface CaseManagementScreenProps {
  navigation: any;
  route: {
    params: {
      case: MedicalCase;
      user?: PatientUser;
      isStaff?: boolean;
    };
  };
}

const CaseManagementScreen: React.FC<CaseManagementScreenProps> = ({ navigation, route }) => {
  const { case: initialCase, user, isStaff = false } = route.params;
  const { theme, colors } = useTheme();
  const styles = createStyles(colors);
  
  const [medicalCase, setMedicalCase] = useState<MedicalCase>(initialCase);
  const [triageAssessment, setTriageAssessment] = useState<TriageAssessment | null>(null);
  const [newNote, setNewNote] = useState('');
  const [showAddNote, setShowAddNote] = useState(false);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(medicalCase.status);

  useEffect(() => {
    trackScreen('CaseManagementScreen', {
      caseId: initialCase.id,
      caseSeverity: initialCase.severity,
      caseStatus: initialCase.status,
      isStaffView: isStaff,
      hasUser: !!user
    });
    
    loadTriageAssessment();
  }, []);

  const loadTriageAssessment = async () => {
    try {
      // In a real app, this would fetch from the service
      // For now, we'll create a mock assessment if needed
      if (medicalCase.triageScore && medicalCase.triageScore > 0) {
        const assessment = await caseService.createTriage(medicalCase.id, 'system');
        setTriageAssessment(assessment);
      }
    } catch (error) {
      logger.error('Failed to load triage assessment', error);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      await caseService.addCaseNote(
        medicalCase.id,
        'user',
        user?.id || 'system',
        newNote,
        false
      );

      // Refresh case data
      const updatedCase = await caseService.getCaseById(medicalCase.id);
      if (updatedCase) {
        setMedicalCase(updatedCase);
      }

      setNewNote('');
      setShowAddNote(false);
      Alert.alert('Success', 'Note added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add note');
    }
  };

  const handleStatusUpdate = async () => {
    try {
      const updatedCase = await caseService.updateCase(
        medicalCase.id,
        { status: selectedStatus }
      );
      
      setMedicalCase(updatedCase);
      setShowStatusUpdate(false);
      Alert.alert('Success', 'Case status updated');
    } catch (error) {
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleTriage = async () => {
    try {
      const assessment = await caseService.createTriage(medicalCase.id, user?.id || 'system');
      setTriageAssessment(assessment);
      
      // Refresh case data
      const updatedCase = await caseService.getCaseById(medicalCase.id);
      if (updatedCase) {
        setMedicalCase(updatedCase);
      }
      
      Alert.alert(
        'Triage Complete',
        `Triage Level: ${assessment.triageLevel}\nRecommended Action: ${assessment.recommendedAction}\nEstimated Wait: ${assessment.estimatedWaitTime} minutes`
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to perform triage');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return colors.error;
      case 'in-progress': return colors.warning;
      case 'waiting-patient': return colors.info;
      case 'resolved': return colors.success;
      case 'closed': return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return colors.error;
      case 'high': return colors.warning;
      case 'medium': return colors.info;
      case 'low': return colors.success;
      default: return colors.textSecondary;
    }
  };

  const getTriageLevelColor = (level: number) => {
    switch (level) {
      case 1: return colors.error;
      case 2: return colors.warning;
      case 3: return colors.info;
      case 4: return colors.success;
      case 5: return colors.textSecondary;
      default: return colors.textSecondary;
    }
  };

  const renderCaseHeader = () => (
    <View style={styles.caseHeader}>
      <View style={styles.caseHeaderTop}>
        <View style={styles.caseTitleSection}>
          <Text style={styles.caseTitle}>{medicalCase.title}</Text>
          <Text style={styles.caseTicket}>#{medicalCase.ticketNumber}</Text>
        </View>
        <View style={styles.caseHeaderBadges}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(medicalCase.status) }]}>
            <Text style={styles.statusText}>{medicalCase.status}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(medicalCase.priority) }]}>
            <Text style={styles.priorityText}>{medicalCase.priority}</Text>
          </View>
        </View>
      </View>
      
      <Text style={styles.caseDescription}>{medicalCase.description}</Text>
      
      <View style={styles.caseMetadata}>
        <View style={styles.metadataItem}>
          <MaterialIcons name="schedule" size={16} color={colors.textSecondary} />
          <Text style={styles.metadataText}>
            Created: {medicalCase.createdAt.toLocaleDateString()}
          </Text>
        </View>
        <View style={styles.metadataItem}>
          <MaterialIcons name="update" size={16} color={colors.textSecondary} />
          <Text style={styles.metadataText}>
            Updated: {medicalCase.updatedAt.toLocaleDateString()}
          </Text>
        </View>
        {medicalCase.assignedStaff && (
          <View style={styles.metadataItem}>
            <MaterialIcons name="person" size={16} color={colors.textSecondary} />
            <Text style={styles.metadataText}>Assigned: {medicalCase.assignedStaff}</Text>
          </View>
        )}
      </View>

      <View style={styles.symptomsSection}>
        <Text style={styles.symptomsSectionTitle}>Symptoms:</Text>
        <View style={styles.symptomsContainer}>
          {medicalCase.symptoms.map((symptom, index) => (
            <View key={index} style={styles.symptomTag}>
              <Text style={styles.symptomText}>{symptom}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTriageSection = () => {
    if (!triageAssessment) {
      return (
        <View style={styles.triageSection}>
          <View style={styles.triageHeader}>
            <Text style={styles.triageSectionTitle}>Triage Assessment</Text>
            {isStaff && (
              <TouchableOpacity style={styles.triageButton} onPress={handleTriage}>
                <MaterialIcons name="assessment" size={16} color="white" />
                <Text style={styles.triageButtonText}>Perform Triage</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.triageNotAvailable}>No triage assessment available</Text>
        </View>
      );
    }

    return (
      <View style={styles.triageSection}>
        <Text style={styles.triageSectionTitle}>Triage Assessment</Text>
        
        <View style={styles.triageGrid}>
          <View style={styles.triageItem}>
            <Text style={styles.triageLabel}>Triage Level</Text>
            <View style={[styles.triageLevelBadge, { backgroundColor: getTriageLevelColor(triageAssessment.triageLevel) }]}>
              <Text style={styles.triageLevelText}>{triageAssessment.triageLevel}</Text>
            </View>
          </View>
          
          <View style={styles.triageItem}>
            <Text style={styles.triageLabel}>Recommended Action</Text>
            <Text style={styles.triageValue}>{triageAssessment.recommendedAction}</Text>
          </View>
          
          <View style={styles.triageItem}>
            <Text style={styles.triageLabel}>Estimated Wait</Text>
            <Text style={styles.triageValue}>{triageAssessment.estimatedWaitTime} min</Text>
          </View>
          
          <View style={styles.triageItem}>
            <Text style={styles.triageLabel}>Assessed By</Text>
            <Text style={styles.triageValue}>{triageAssessment.assessedBy}</Text>
          </View>
        </View>

        <View style={styles.reasoningScores}>
          <Text style={styles.reasoningTitle}>Assessment Scores:</Text>
          <View style={styles.scoreGrid}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Symptoms</Text>
              <Text style={styles.scoreValue}>{triageAssessment.reasoningScore.symptomsScore}/5</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Pain Level</Text>
              <Text style={styles.scoreValue}>{triageAssessment.reasoningScore.painLevel}/5</Text>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreLabel}>Vitals</Text>
              <Text style={styles.scoreValue}>{triageAssessment.reasoningScore.vitalSignsScore}/5</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderNotesSection = () => (
    <View style={styles.notesSection}>
      <View style={styles.notesSectionHeader}>
        <Text style={styles.notesSectionTitle}>Case Notes ({medicalCase.notes.length})</Text>
        <TouchableOpacity
          style={styles.addNoteButton}
          onPress={() => setShowAddNote(true)}
        >
          <MaterialIcons name="add" size={16} color="white" />
          <Text style={styles.addNoteButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={medicalCase.notes.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[
            styles.noteItem,
            item.isPrivate && styles.privateNote
          ]}>
            <View style={styles.noteHeader}>
              <View style={styles.noteAuthor}>
                <MaterialIcons
                  name={item.authorRole === 'staff' ? 'badge' : item.authorRole === 'doctor' ? 'medical-services' : 'person'}
                  size={16}
                  color={colors.textSecondary}
                />
                <Text style={styles.noteAuthorName}>{item.authorName}</Text>
                <Text style={styles.noteAuthorRole}>({item.authorRole})</Text>
                {item.isPrivate && (
                  <MaterialIcons name="lock" size={14} color={colors.warning} />
                )}
              </View>
              <Text style={styles.noteTimestamp}>
                {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString()}
              </Text>
            </View>
            <Text style={styles.noteContent}>{item.content}</Text>
            <View style={[styles.noteTypeBadge, { backgroundColor: getNoteTypeColor(item.type) }]}>
              <Text style={styles.noteTypeText}>{item.type}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'assessment': return colors.info;
      case 'treatment': return colors.success;
      case 'follow-up': return colors.warning;
      case 'system': return colors.textSecondary;
      default: return colors.primary;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Case Details</Text>
        <TouchableOpacity
          style={styles.statusButton}
          onPress={() => setShowStatusUpdate(true)}
        >
          <MaterialIcons name="edit" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderCaseHeader()}
        {renderTriageSection()}
        {renderNotesSection()}
      </ScrollView>

      {/* Add Note Modal */}
      <Modal
        visible={showAddNote}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddNote(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Note</Text>
            <TouchableOpacity onPress={handleAddNote}>
              <Text style={styles.modalSaveButton}>Save</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <TextInput
              style={styles.noteInput}
              placeholder="Enter your note..."
              value={newNote}
              onChangeText={setNewNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Status Update Modal */}
      <Modal
        visible={showStatusUpdate}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowStatusUpdate(false)}>
              <Text style={styles.modalCancelButton}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Update Status</Text>
            <TouchableOpacity onPress={handleStatusUpdate}>
              <Text style={styles.modalSaveButton}>Update</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            {['open', 'in-progress', 'waiting-patient', 'resolved', 'closed'].map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.statusOption,
                  selectedStatus === status && styles.statusOptionSelected
                ]}
                onPress={() => setSelectedStatus(status as any)}
              >
                <Text style={[
                  styles.statusOptionText,
                  selectedStatus === status && styles.statusOptionTextSelected
                ]}>
                  {status.replace('-', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  statusButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  caseHeader: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  caseHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  caseTitleSection: {
    flex: 1,
  },
  caseTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  caseTicket: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.primary,
  },
  caseHeaderBadges: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
  caseDescription: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
    lineHeight: 20,
  },
  caseMetadata: {
    marginBottom: 12,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 6,
  },
  symptomsSection: {
    marginTop: 8,
  },
  symptomsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  symptomTag: {
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 6,
  },
  symptomText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '500',
  },
  triageSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  triageSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  triageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  triageButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  triageNotAvailable: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  triageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  triageItem: {
    width: '50%',
    marginBottom: 12,
  },
  triageLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  triageValue: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  triageLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  triageLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  reasoningScores: {
    marginTop: 8,
  },
  reasoningTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  scoreGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  scoreItem: {
    alignItems: 'center',
  },
  scoreLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  notesSection: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  notesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  addNoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addNoteButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
    marginLeft: 4,
  },
  noteItem: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  privateNote: {
    backgroundColor: colors.warning + '10',
    borderColor: colors.warning + '30',
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  noteAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  noteAuthorName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  noteAuthorRole: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  noteTimestamp: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  noteContent: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  noteTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noteTypeText: {
    fontSize: 10,
    fontWeight: '500',
    color: 'white',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  modalSaveButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 120,
  },
  statusOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statusOptionSelected: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

const CaseManagementScreenWithErrorBoundary: React.FC<CaseManagementScreenProps> = (props) => (
  <ErrorBoundary>
    <CaseManagementScreen {...props} />
  </ErrorBoundary>
);

export default CaseManagementScreenWithErrorBoundary;